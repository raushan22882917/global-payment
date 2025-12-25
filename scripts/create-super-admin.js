#!/usr/bin/env node

/**
 * Script to create super admin user in Firestore
 * This will create the user document that the app is looking for
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

async function createSuperAdmin() {
  try {
    console.log('🔐 Creating Super Admin User Record...\n');
    
    // The UID from your logs
    const superAdminUID = '5L8m2dKuviaG2TPmPEvNFKLJEOV2';
    const superAdminEmail = 'raushan22882917@gmail.com';
    
    console.log('📝 Creating user document for:');
    console.log('   Email:', superAdminEmail);
    console.log('   UID:', superAdminUID);
    
    // Create the user document in Firestore
    const userRef = doc(db, 'users', superAdminUID);
    
    const userData = {
      email: superAdminEmail,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      active: true,
      name: 'Super Admin',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    
    await setDoc(userRef, userData);
    
    console.log('✅ Super admin user document created successfully!');
    console.log('📋 User Data:');
    console.log('   - Email:', userData.email);
    console.log('   - Role:', userData.role);
    console.log('   - Super Admin:', userData.isSuperAdmin);
    console.log('   - Active:', userData.active);
    
    console.log('\n🎉 Setup Complete!');
    console.log('   Now you can login with:', superAdminEmail);
    console.log('   Should redirect to: /super-admin/dashboard');
    
    console.log('\n🔍 Expected behavior:');
    console.log('   1. Login with Google or email/password');
    console.log('   2. Console shows: "Database user found: {role: SUPER_ADMIN, ...}"');
    console.log('   3. Automatic redirect to super admin dashboard');
    
  } catch (error) {
    console.error('❌ Failed to create super admin:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 This is expected - we need to use Firebase Admin SDK or console');
      console.log('   Let me provide alternative methods...');
    }
  }
}

createSuperAdmin();