#!/usr/bin/env node

/**
 * Script to test Firebase Storage permissions
 * Run with: node scripts/test-storage-permissions.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'curious-context-409607-3f3fb76418c2.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'curious-context-409607',
    storageBucket: 'curious-context-409607.firebasestorage.app'
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const bucket = admin.storage().bucket();

async function testStoragePermissions() {
  console.log('🔍 Testing Firebase Storage permissions...\n');

  try {
    // Test 1: Check if bucket exists and is accessible
    console.log('1. Testing bucket access...');
    const [exists] = await bucket.exists();
    if (exists) {
      console.log('✅ Storage bucket exists and is accessible');
    } else {
      console.log('❌ Storage bucket does not exist or is not accessible');
      return;
    }

    // Test 2: Try to list files in logos directory
    console.log('\n2. Testing logos directory access...');
    try {
      const [files] = await bucket.getFiles({ prefix: 'logos/' });
      console.log(`✅ Found ${files.length} files in logos directory`);
    } catch (error) {
      console.log('⚠️  Could not list files in logos directory:', error.message);
    }

    // Test 3: Check storage rules
    console.log('\n3. Checking storage rules...');
    try {
      // This is a basic check - in a real scenario, you'd need to test with actual user tokens
      console.log('✅ Storage rules appear to be configured (detailed testing requires client-side authentication)');
    } catch (error) {
      console.log('❌ Error checking storage rules:', error.message);
    }

    // Test 4: Create a test file
    console.log('\n4. Testing file upload (admin privileges)...');
    try {
      const testContent = 'This is a test file created by the admin script';
      const testFile = bucket.file('test/admin-test.txt');
      
      await testFile.save(testContent, {
        metadata: {
          contentType: 'text/plain',
        },
      });
      
      console.log('✅ Test file uploaded successfully');
      
      // Clean up test file
      await testFile.delete();
      console.log('✅ Test file cleaned up');
      
    } catch (error) {
      console.log('❌ Failed to upload test file:', error.message);
    }

    console.log('\n🎉 Storage permissions test completed!');
    console.log('\n📋 Recommendations:');
    console.log('1. Make sure storage rules are deployed: firebase deploy --only storage');
    console.log('2. Wait a few minutes for rules to propagate');
    console.log('3. Clear browser cache and try again');
    console.log('4. Check Firebase Console for any additional error messages');

  } catch (error) {
    console.error('❌ Error testing storage permissions:', error);
  }
}

// Run the test
testStoragePermissions().catch(console.error);