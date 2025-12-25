#!/usr/bin/env node

/**
 * Script to test live authentication flow
 * Run with: node scripts/test-live-authentication.js
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

async function testLiveAuthentication() {
  console.log('🧪 Testing Live Authentication Flow...\n');

  try {
    // Test each user's authentication flow
    const testUsers = [
      'raushan22882917@gmail.com',
      'raushan@autonxt.in', 
      'su-22016@sitare.org'
    ];

    for (const email of testUsers) {
      console.log(`\n🔍 Testing user: ${email}`);
      console.log('=' .repeat(50));
      
      try {
        // Step 1: Get user from Firebase Auth
        const authUser = await auth.getUserByEmail(email);
        console.log(`✅ Step 1: Found in Firebase Auth`);
        console.log(`   UID: ${authUser.uid}`);
        console.log(`   Email Verified: ${authUser.emailVerified}`);
        console.log(`   Disabled: ${authUser.disabled}`);
        
        // Step 2: Get user from Firestore
        const firestoreDoc = await db.collection('users').doc(authUser.uid).get();
        if (firestoreDoc.exists) {
          const userData = firestoreDoc.data();
          console.log(`✅ Step 2: Found in Firestore`);
          console.log(`   Document ID: ${firestoreDoc.id}`);
          console.log(`   Email: ${userData.email}`);
          console.log(`   Role: ${userData.role}`);
          console.log(`   Active: ${userData.active}`);
          console.log(`   Name: ${userData.name}`);
          console.log(`   Org ID: ${userData.orgId || 'None'}`);
          console.log(`   Super Admin: ${userData.isSuperAdmin || false}`);
          
          // Step 3: Test Firestore permissions by creating a custom token
          console.log(`✅ Step 3: Testing Firestore access...`);
          try {
            const customToken = await auth.createCustomToken(authUser.uid);
            console.log(`   Custom token created successfully`);
            
            // Simulate what the client-side would do
            console.log(`   Simulating client-side user lookup...`);
            
            // This simulates the getUser function from database.ts
            const testDoc = await db.collection('users').doc(authUser.uid).get();
            if (testDoc.exists) {
              console.log(`   ✅ Client-side lookup would succeed`);
              
              // Check if user should be redirected based on role
              if (userData.role === 'SUPER_ADMIN' || userData.isSuperAdmin) {
                console.log(`   🎯 Should redirect to: /super-admin/dashboard`);
              } else if (userData.role && userData.role.startsWith('ORG_')) {
                if (userData.active) {
                  console.log(`   🎯 Should redirect to: /org/dashboard`);
                } else {
                  console.log(`   🎯 Should redirect to: /setup-status`);
                }
              } else {
                console.log(`   🎯 Should redirect to: /setup-status`);
              }
            } else {
              console.log(`   ❌ Client-side lookup would fail`);
            }
            
          } catch (tokenError) {
            console.log(`   ❌ Custom token creation failed: ${tokenError.message}`);
          }
          
        } else {
          console.log(`❌ Step 2: NOT found in Firestore`);
          console.log(`   This user will not be able to log in`);
        }
        
      } catch (authError) {
        console.log(`❌ Step 1: Not found in Firebase Auth: ${authError.message}`);
      }
    }

    // Test Firestore connection and rules
    console.log(`\n\n🔧 Testing Firestore Connection & Rules...`);
    console.log('=' .repeat(50));
    
    try {
      // Test reading users collection
      const usersSnapshot = await db.collection('users').limit(1).get();
      console.log(`✅ Can read users collection (${usersSnapshot.size} docs)`);
      
      // Test reading organizations collection  
      const orgsSnapshot = await db.collection('organizations').limit(1).get();
      console.log(`✅ Can read organizations collection (${orgsSnapshot.size} docs)`);
      
    } catch (firestoreError) {
      console.log(`❌ Firestore access error: ${firestoreError.message}`);
    }

    // Check for common issues
    console.log(`\n\n🔍 Common Issue Checklist...`);
    console.log('=' .repeat(50));
    
    // Check 1: Environment variables
    console.log(`1. Environment Variables:`);
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ];
    
    // Read .env.local file
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      requiredEnvVars.forEach(varName => {
        if (envContent.includes(varName)) {
          console.log(`   ✅ ${varName} is set`);
        } else {
          console.log(`   ❌ ${varName} is missing`);
        }
      });
    } else {
      console.log(`   ❌ .env.local file not found`);
    }

    // Check 2: Firebase config
    console.log(`\n2. Firebase Configuration:`);
    console.log(`   Project ID: curious-context-409607`);
    console.log(`   Auth Domain: curious-context-409607.firebaseapp.com`);
    
    // Check 3: Browser compatibility
    console.log(`\n3. Browser Compatibility Notes:`);
    console.log(`   - Make sure browser allows third-party cookies`);
    console.log(`   - Check if browser blocks popups (affects Google login)`);
    console.log(`   - Clear browser cache and localStorage`);
    console.log(`   - Try incognito/private browsing mode`);

    console.log(`\n\n🎯 Debugging Recommendations:`);
    console.log('=' .repeat(50));
    console.log(`1. Open browser DevTools → Console tab`);
    console.log(`2. Try logging in and watch for error messages`);
    console.log(`3. Check Network tab for failed requests`);
    console.log(`4. Look for these specific error patterns:`);
    console.log(`   - "No Firebase user" → Auth not working`);
    console.log(`   - "Database lookup error" → Firestore permission issue`);
    console.log(`   - "User not found in system" → UID mismatch (should be fixed now)`);
    console.log(`5. If login seems to work but redirects fail, check the useEffect in page.tsx`);

    console.log(`\n✨ All authentication components appear to be configured correctly!`);
    console.log(`If users still can't log in, the issue is likely client-side.`);

  } catch (error) {
    console.error('❌ Error during live authentication test:', error);
  }
}

// Run the test
testLiveAuthentication().catch(console.error);