#!/usr/bin/env node

/**
 * Script to test Firebase configuration
 * Run with: node scripts/test-firebase-config.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function testFirebaseConfig() {
  console.log('🔧 Testing Firebase Configuration...\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];
    
    requiredVars.forEach(varName => {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match) {
        const value = match[1].trim();
        console.log(`   ✅ ${varName}=${value.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ ${varName} is missing`);
      }
    });
  } else {
    console.log('   ❌ .env.local file not found');
  }

  // Test 2: Check service account
  console.log('\n2️⃣ Checking Service Account:');
  const serviceAccountPath = path.join(__dirname, '..', 'curious-context-409607-3f3fb76418c2.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      console.log(`   ✅ Service account file found`);
      console.log(`   📧 Client email: ${serviceAccount.client_email}`);
      console.log(`   🆔 Project ID: ${serviceAccount.project_id}`);
      
      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log(`   ✅ Firebase Admin initialized successfully`);
      
    } catch (error) {
      console.log(`   ❌ Service account error: ${error.message}`);
    }
  } else {
    console.log(`   ❌ Service account file not found`);
  }

  // Test 3: Test Firebase Auth configuration
  console.log('\n3️⃣ Testing Firebase Auth Configuration:');
  try {
    const auth = admin.auth();
    
    // Test listing users (this will fail if auth is not properly configured)
    const listUsersResult = await auth.listUsers(1);
    console.log(`   ✅ Firebase Auth is working (found ${listUsersResult.users.length} users)`);
    
    // Check if Google provider is enabled (we can't directly check this via admin SDK)
    console.log(`   ℹ️  Google provider status: Check Firebase Console manually`);
    
  } catch (authError) {
    console.log(`   ❌ Firebase Auth error: ${authError.message}`);
  }

  // Test 4: Test Firestore configuration
  console.log('\n4️⃣ Testing Firestore Configuration:');
  try {
    const db = admin.firestore();
    
    // Test reading a collection
    const usersSnapshot = await db.collection('users').limit(1).get();
    console.log(`   ✅ Firestore is working (users collection accessible)`);
    
  } catch (firestoreError) {
    console.log(`   ❌ Firestore error: ${firestoreError.message}`);
  }

  // Test 5: Check Google Cloud project status
  console.log('\n5️⃣ Google Cloud Project Information:');
  console.log(`   🆔 Project ID: curious-context-409607`);
  console.log(`   🌐 Auth Domain: curious-context-409607.firebaseapp.com`);
  console.log(`   📦 Storage Bucket: curious-context-409607.firebasestorage.app`);

  // Test 6: Common configuration issues
  console.log('\n6️⃣ Common Configuration Issues to Check:');
  console.log(`   🔍 Firebase Console: https://console.firebase.google.com/project/curious-context-409607`);
  console.log(`   📋 Check these settings:`);
  console.log(`      - Authentication → Sign-in method → Google (should be enabled)`);
  console.log(`      - Authentication → Settings → Authorized domains (should include localhost)`);
  console.log(`      - Project Settings → General → Your apps (Web app should be configured)`);

  console.log('\n7️⃣ Google Cloud Console Checks:');
  console.log(`   🔍 Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=curious-context-409607`);
  console.log(`   📋 Check these settings:`);
  console.log(`      - OAuth 2.0 Client IDs (should exist for web application)`);
  console.log(`      - Authorized JavaScript origins (should include http://localhost:3000)`);
  console.log(`      - Authorized redirect URIs (should include Firebase auth handler)`);

  console.log('\n8️⃣ Browser Testing Recommendations:');
  console.log(`   🌐 Test in different browsers: Chrome, Firefox, Safari`);
  console.log(`   🔒 Try incognito/private browsing mode`);
  console.log(`   🧹 Clear browser cache and cookies`);
  console.log(`   🚫 Disable browser extensions temporarily`);
  console.log(`   🍪 Ensure third-party cookies are enabled`);

  console.log('\n✨ Configuration test completed!');
  console.log('If all tests pass but login still fails, the issue is likely browser-related or Google OAuth configuration.');
}

// Run the test
testFirebaseConfig().catch(console.error);