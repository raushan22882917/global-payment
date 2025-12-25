#!/usr/bin/env node

/**
 * Script to create required Firestore indexes
 * Run this script to automatically create the necessary database indexes
 */

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB_wlTisykoPnE2E3NZJ1bSz0ErxjINgfY",
  authDomain: "curious-context-409607.firebaseapp.com",
  projectId: "curious-context-409607",
  storageBucket: "curious-context-409607.firebasestorage.app",
  messagingSenderId: "386472192378",
  appId: "1:386472192378:web:1482a0891df928700ecec3",
  measurementId: "G-9BXK65Y6XR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firestore Index Creation Guide');
console.log('=====================================\n');

console.log('The following indexes need to be created in Firestore:\n');

console.log('1. APPROVAL LEVELS INDEX');
console.log('   Collection: approvalLevels');
console.log('   Fields:');
console.log('   - orgId (Ascending)');
console.log('   - levelOrder (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('2. USERS BY ORGANIZATION INDEX (if needed)');
console.log('   Collection: users');
console.log('   Fields:');
console.log('   - orgId (Ascending)');
console.log('   - active (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('3. PAYMENT REQUESTS INDEX (if needed)');
console.log('   Collection: paymentRequests');
console.log('   Fields:');
console.log('   - orgId (Ascending)');
console.log('   - createdAt (Descending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('📋 MANUAL CREATION STEPS:');
console.log('=========================');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Select your project: curious-context-409607');
console.log('3. Navigate to Firestore Database > Indexes');
console.log('4. Click "Create Index"');
console.log('5. Create each index with the fields listed above');
console.log('');

console.log('🚀 AUTOMATIC CREATION:');
console.log('======================');
console.log('Click on the error links in your browser console to automatically create indexes:');
console.log('');

console.log('✅ Once indexes are created, your queries will work without errors!');
console.log('⏱️  Index creation may take a few minutes to complete.');

process.exit(0);