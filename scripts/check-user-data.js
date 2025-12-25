#!/usr/bin/env node

/**
 * Script to check user data in Firestore
 * Run with: node scripts/check-user-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'curious-context-409607-3f3fb76418c2.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'curious-context-409607'
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function checkUserData() {
  try {
    console.log('\n🔍 Checking user data for: su-22016@sitare.org');
    console.log('==========================================');
    
    // First, let's find the user by email
    const usersRef = db.collection('users');
    const emailQuery = await usersRef.where('email', '==', 'su-22016@sitare.org').get();
    
    if (emailQuery.empty) {
      console.log('❌ No user found with email: su-22016@sitare.org');
      
      // Let's check if there are any users at all
      const allUsersSnapshot = await usersRef.limit(5).get();
      console.log(`\n📊 Total users in database: ${allUsersSnapshot.size}`);
      
      if (!allUsersSnapshot.empty) {
        console.log('\n👥 Sample users:');
        allUsersSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`  - ID: ${doc.id}`);
          console.log(`    Email: ${data.email}`);
          console.log(`    Role: ${data.role}`);
          console.log(`    Active: ${data.active}`);
          console.log(`    OrgId: ${data.orgId}`);
          console.log('');
        });
      }
      
      return;
    }
    
    console.log(`✅ Found ${emailQuery.size} user(s) with this email`);
    
    emailQuery.forEach(doc => {
      const data = doc.data();
      console.log('\n📋 User Details:');
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  Active: ${data.active}`);
      console.log(`  Is Super Admin: ${data.isSuperAdmin}`);
      console.log(`  Organization ID: ${data.orgId}`);
      console.log(`  Created At: ${data.createdAt?.toDate()}`);
      
      // Check if this is the expected role
      if (data.role && data.role.startsWith('ORG_')) {
        console.log('\n✅ User has ORG_ role - should redirect to /org/dashboard');
        if (data.active) {
          console.log('✅ User is active - redirect should work');
        } else {
          console.log('⚠️  User is inactive - will redirect to /setup-status');
        }
      } else {
        console.log('\n⚠️  User does not have ORG_ role');
        console.log('   Expected: ORG_ADMIN, ORG_MEMBER, ORG_FINANCE, etc.');
        console.log(`   Actual: ${data.role}`);
      }
    });
    
    // Also check by UID if we can find it
    console.log('\n🔍 Checking by UID: n97SufOXvtSvyAtW3U5w0MafxHZ2');
    try {
      const userDoc = await db.collection('users').doc('n97SufOXvtSvyAtW3U5w0MafxHZ2').get();
      if (userDoc.exists) {
        const data = userDoc.data();
        console.log('✅ Found user by UID:');
        console.log(`  Email: ${data.email}`);
        console.log(`  Role: ${data.role}`);
        console.log(`  Active: ${data.active}`);
      } else {
        console.log('❌ No user found with UID: n97SufOXvtSvyAtW3U5w0MafxHZ2');
      }
    } catch (uidError) {
      console.log('❌ Error checking by UID:', uidError.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking user data:', error);
  }
}

// Run the check
checkUserData().then(() => {
  console.log('\n✅ User data check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});