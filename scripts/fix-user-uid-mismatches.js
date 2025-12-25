#!/usr/bin/env node

/**
 * Script to fix UID mismatches between Firebase Auth and Firestore
 * Run with: node scripts/fix-user-uid-mismatches.js
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

async function fixUIDMismatches() {
  console.log('🔧 Fixing UID Mismatches...\n');

  try {
    // Get all users from both Auth and Firestore
    const authUsers = await auth.listUsers();
    const usersSnapshot = await db.collection('users').get();
    
    console.log('📊 Current Status:');
    console.log(`   Firebase Auth users: ${authUsers.users.length}`);
    console.log(`   Firestore user documents: ${usersSnapshot.size}\n`);

    // Create maps for easier lookup
    const authUsersByEmail = new Map();
    authUsers.users.forEach(user => {
      authUsersByEmail.set(user.email, user);
    });

    const firestoreUsersByEmail = new Map();
    const firestoreUsersByDocId = new Map();
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      firestoreUsersByEmail.set(data.email, { id: doc.id, ...data });
      firestoreUsersByDocId.set(doc.id, { id: doc.id, ...data });
    });

    // Fix 1: raushan@autonxt.in - move from wrong doc ID to correct UID
    console.log('🔧 Fix 1: raushan@autonxt.in');
    const raushanautoEmail = 'raushan@autonxt.in';
    const raushanautoAuthUser = authUsersByEmail.get(raushanautoEmail);
    const raushanautoFirestoreUser = firestoreUsersByEmail.get(raushanautoEmail);
    
    if (raushanautoAuthUser && raushanautoFirestoreUser) {
      console.log(`   Auth UID: ${raushanautoAuthUser.uid}`);
      console.log(`   Firestore Doc ID: ${raushanautoFirestoreUser.id}`);
      
      if (raushanautoAuthUser.uid !== raushanautoFirestoreUser.id) {
        console.log('   ⚠️ UID mismatch detected, fixing...');
        
        // Create new document with correct UID
        const correctDocRef = db.collection('users').doc(raushanautoAuthUser.uid);
        const userData = { ...raushanautoFirestoreUser };
        delete userData.id; // Remove the id field
        
        await correctDocRef.set(userData);
        console.log(`   ✅ Created new document with correct UID: ${raushanautoAuthUser.uid}`);
        
        // Delete old document
        await db.collection('users').doc(raushanautoFirestoreUser.id).delete();
        console.log(`   ✅ Deleted old document: ${raushanautoFirestoreUser.id}`);
      } else {
        console.log('   ✅ UIDs already match');
      }
    } else {
      console.log('   ❌ User not found in Auth or Firestore');
    }

    // Fix 2: su-22016@sitare.org - create missing Firestore document
    console.log('\n🔧 Fix 2: su-22016@sitare.org');
    const sitareEmail = 'su-22016@sitare.org';
    const sitareAuthUser = authUsersByEmail.get(sitareEmail);
    const sitareFirestoreUser = firestoreUsersByEmail.get(sitareEmail);
    
    if (sitareAuthUser && !sitareFirestoreUser) {
      console.log(`   Auth UID: ${sitareAuthUser.uid}`);
      console.log('   ⚠️ Missing Firestore document, creating...');
      
      // Create Firestore document for this user
      const newUserData = {
        email: sitareAuthUser.email,
        name: sitareAuthUser.displayName || 'User',
        role: 'ORG_USER', // Default role, can be changed by admin
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(sitareAuthUser.uid).set(newUserData);
      console.log(`   ✅ Created Firestore document with UID: ${sitareAuthUser.uid}`);
    } else if (sitareFirestoreUser) {
      console.log('   ✅ Firestore document already exists');
    } else {
      console.log('   ❌ User not found in Firebase Auth');
    }

    // Verification: Check all users again
    console.log('\n🔍 Verification - Checking all users after fixes...');
    const updatedUsersSnapshot = await db.collection('users').get();
    const updatedAuthUsers = await auth.listUsers();
    
    console.log(`   Firebase Auth users: ${updatedAuthUsers.users.length}`);
    console.log(`   Firestore user documents: ${updatedUsersSnapshot.size}`);
    
    // Check for remaining mismatches
    const updatedAuthUIDs = new Set(updatedAuthUsers.users.map(u => u.uid));
    const updatedFirestoreUIDs = new Set();
    
    updatedUsersSnapshot.forEach(doc => {
      updatedFirestoreUIDs.add(doc.id);
    });

    const remainingAuthOnlyUIDs = [...updatedAuthUIDs].filter(uid => !updatedFirestoreUIDs.has(uid));
    const remainingFirestoreOnlyUIDs = [...updatedFirestoreUIDs].filter(uid => !updatedAuthUIDs.has(uid));

    if (remainingAuthOnlyUIDs.length === 0 && remainingFirestoreOnlyUIDs.length === 0) {
      console.log('   ✅ All UIDs now match between Auth and Firestore!');
    } else {
      console.log('   ⚠️ Some mismatches remain:');
      if (remainingAuthOnlyUIDs.length > 0) {
        console.log('      Auth only:', remainingAuthOnlyUIDs);
      }
      if (remainingFirestoreOnlyUIDs.length > 0) {
        console.log('      Firestore only:', remainingFirestoreOnlyUIDs);
      }
    }

    console.log('\n🎉 UID mismatch fixes completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Users should now be able to log in successfully');
    console.log('2. Test login with all user accounts');
    console.log('3. Check that role-based redirects work correctly');
    console.log('4. If issues persist, check browser console for detailed errors');

  } catch (error) {
    console.error('❌ Error fixing UID mismatches:', error);
  }
}

// Run the fix
fixUIDMismatches().catch(console.error);