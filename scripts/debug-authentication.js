#!/usr/bin/env node

/**
 * Script to debug authentication issues
 * Run with: node scripts/debug-authentication.js
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
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function debugAuthentication() {
  console.log('🔍 Debugging Authentication Issues...\n');

  try {
    // 1. List all users in Firebase Auth
    console.log('1️⃣ Checking Firebase Auth users...');
    const authUsers = await auth.listUsers();
    console.log(`   Found ${authUsers.users.length} users in Firebase Auth:`);
    
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email}`);
      console.log(`      UID: ${user.uid}`);
      console.log(`      Created: ${user.metadata.creationTime}`);
      console.log(`      Last Sign In: ${user.metadata.lastSignInTime || 'Never'}`);
      console.log(`      Verified: ${user.emailVerified}`);
      console.log('');
    });

    // 2. List all users in Firestore
    console.log('2️⃣ Checking Firestore users collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Found ${usersSnapshot.size} users in Firestore:`);
    
    usersSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. Document ID: ${doc.id}`);
      console.log(`      Email: ${data.email}`);
      console.log(`      Role: ${data.role}`);
      console.log(`      Active: ${data.active}`);
      console.log(`      Name: ${data.name}`);
      console.log(`      Org ID: ${data.orgId || 'None'}`);
      console.log('');
    });

    // 3. Check for mismatches
    console.log('3️⃣ Checking for UID mismatches...');
    const authUIDs = new Set(authUsers.users.map(u => u.uid));
    const firestoreUIDs = new Set();
    
    usersSnapshot.forEach(doc => {
      firestoreUIDs.add(doc.id);
    });

    const authOnlyUIDs = [...authUIDs].filter(uid => !firestoreUIDs.has(uid));
    const firestoreOnlyUIDs = [...firestoreUIDs].filter(uid => !authUIDs.has(uid));

    if (authOnlyUIDs.length > 0) {
      console.log('   ⚠️ Users in Firebase Auth but NOT in Firestore:');
      for (const uid of authOnlyUIDs) {
        const authUser = authUsers.users.find(u => u.uid === uid);
        console.log(`      - ${authUser.email} (${uid})`);
      }
    }

    if (firestoreOnlyUIDs.length > 0) {
      console.log('   ⚠️ Users in Firestore but NOT in Firebase Auth:');
      for (const uid of firestoreOnlyUIDs) {
        console.log(`      - ${uid}`);
      }
    }

    if (authOnlyUIDs.length === 0 && firestoreOnlyUIDs.length === 0) {
      console.log('   ✅ All UIDs match between Auth and Firestore');
    }

    // 4. Check specific user (if provided)
    const targetEmail = 'raushan22882917@gmail.com'; // Super admin email
    console.log(`\n4️⃣ Checking specific user: ${targetEmail}`);
    
    try {
      const authUser = await auth.getUserByEmail(targetEmail);
      console.log(`   ✅ Found in Firebase Auth:`);
      console.log(`      UID: ${authUser.uid}`);
      console.log(`      Email Verified: ${authUser.emailVerified}`);
      
      // Check if this user exists in Firestore
      const firestoreDoc = await db.collection('users').doc(authUser.uid).get();
      if (firestoreDoc.exists) {
        console.log(`   ✅ Found in Firestore:`);
        const data = firestoreDoc.data();
        console.log(`      Role: ${data.role}`);
        console.log(`      Active: ${data.active}`);
        console.log(`      Super Admin: ${data.isSuperAdmin}`);
      } else {
        console.log(`   ❌ NOT found in Firestore - this is the problem!`);
        console.log(`   🔧 Solution: Create user document in Firestore`);
        
        // Auto-create super admin user
        console.log(`   🚀 Auto-creating super admin user...`);
        await db.collection('users').doc(authUser.uid).set({
          email: authUser.email,
          name: authUser.displayName || 'Super Admin',
          role: 'SUPER_ADMIN',
          isSuperAdmin: true,
          active: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Super admin user created successfully!`);
      }
    } catch (error) {
      console.log(`   ❌ User not found in Firebase Auth: ${error.message}`);
    }

    // 5. Check organizations
    console.log(`\n5️⃣ Checking organizations...`);
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`   Found ${orgsSnapshot.size} organizations in Firestore`);
    
    if (orgsSnapshot.size > 0) {
      orgsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.name} (${doc.id})`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Created By: ${data.createdBy || 'Unknown'}`);
      });
    }

    console.log('\n🎉 Authentication debugging completed!');
    
    // Recommendations
    console.log('\n📋 Recommendations:');
    console.log('1. Make sure users exist in both Firebase Auth AND Firestore');
    console.log('2. UIDs must match between Auth and Firestore documents');
    console.log('3. Super admin should have role: "SUPER_ADMIN" and isSuperAdmin: true');
    console.log('4. Regular users need to be created by admin before they can login');
    console.log('5. Check browser console for detailed error messages during login');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug
debugAuthentication().catch(console.error);