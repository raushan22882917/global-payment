#!/usr/bin/env node

/**
 * Script to fix missing payment configurations for organizations
 * Run with: node scripts/fix-missing-payment-configs.js
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

async function fixMissingPaymentConfigs() {
  console.log('🔧 Fixing Missing Payment Configurations...\n');

  try {
    // Get all organizations
    console.log('1️⃣ Fetching all organizations...');
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`   Found ${orgsSnapshot.size} organizations\n`);

    // Get all existing payment configs
    console.log('2️⃣ Fetching existing payment configurations...');
    const paymentConfigsSnapshot = await db.collection('paymentConfigs').get();
    const existingConfigs = new Set();
    paymentConfigsSnapshot.forEach(doc => {
      existingConfigs.add(doc.id);
    });
    console.log(`   Found ${paymentConfigsSnapshot.size} existing payment configurations\n`);

    // Find organizations without payment configs
    const missingConfigs = [];
    orgsSnapshot.forEach(doc => {
      const orgId = doc.id;
      if (!existingConfigs.has(orgId)) {
        const orgData = doc.data();
        missingConfigs.push({
          id: orgId,
          name: orgData.name,
          status: orgData.status
        });
      }
    });

    console.log('3️⃣ Organizations missing payment configurations:');
    if (missingConfigs.length === 0) {
      console.log('   ✅ All organizations have payment configurations!\n');
      return;
    }

    missingConfigs.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.id}) - Status: ${org.status}`);
    });
    console.log('');

    // Create missing payment configurations
    console.log('4️⃣ Creating missing payment configurations...');
    const batch = db.batch();
    
    missingConfigs.forEach(org => {
      const configRef = db.collection('paymentConfigs').doc(org.id);
      const defaultConfig = {
        orgId: org.id,
        enableUPI: false,
        enableBank: false,
        gateway: 'RAZORPAY',
        autoPay: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(configRef, defaultConfig);
      console.log(`   ✅ Queued payment config for: ${org.name}`);
    });

    // Commit the batch
    await batch.commit();
    console.log(`\n✅ Successfully created ${missingConfigs.length} payment configurations!`);

    // Verify the fix
    console.log('\n5️⃣ Verifying the fix...');
    const updatedPaymentConfigsSnapshot = await db.collection('paymentConfigs').get();
    console.log(`   Payment configurations after fix: ${updatedPaymentConfigsSnapshot.size}`);
    
    if (updatedPaymentConfigsSnapshot.size === orgsSnapshot.size) {
      console.log('   ✅ All organizations now have payment configurations!');
    } else {
      console.log('   ⚠️ Some organizations may still be missing payment configurations');
    }

    console.log('\n🎉 Payment configuration fix completed!');
    console.log('\n📋 What was fixed:');
    console.log('✅ Created default payment configurations for organizations');
    console.log('✅ Set default values: UPI=false, Bank=false, Gateway=RAZORPAY, AutoPay=false');
    console.log('✅ Added timestamps for tracking');
    console.log('\n🔧 Users can now:');
    console.log('✅ Access organization settings without errors');
    console.log('✅ Update payment configurations successfully');
    console.log('✅ Enable/disable payment methods as needed');

  } catch (error) {
    console.error('❌ Error fixing payment configurations:', error);
  }
}

// Run the fix
fixMissingPaymentConfigs().catch(console.error);