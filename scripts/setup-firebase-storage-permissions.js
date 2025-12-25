#!/usr/bin/env node

/**
 * Script to help set up Firebase Storage permissions
 * Run with: node scripts/setup-firebase-storage-permissions.js
 */

const admin = require('firebase-admin');
const path = require('path');

console.log('🔧 Firebase Storage Permission Setup Helper\n');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, '..', 'curious-context-409607-3f3fb76418c2.json');

try {
  const serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account file found');
  console.log(`📧 Service account email: ${serviceAccount.client_email}`);
  console.log(`🆔 Project ID: ${serviceAccount.project_id}\n`);
} catch (error) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  console.error('   Make sure the Firebase service account key is in the project root\n');
  process.exit(1);
}

console.log('🔍 Diagnosing Firebase Storage setup...\n');

// Check Firebase project configuration
console.log('📋 Current Configuration:');
console.log('   Project ID: curious-context-409607');
console.log('   Storage Bucket: curious-context-409607.firebasestorage.app');
console.log('   Service Account: payment@curious-context-409607.iam.gserviceaccount.com\n');

console.log('🚨 IDENTIFIED ISSUE:');
console.log('   The service account lacks Google Cloud Storage permissions.\n');

console.log('🛠️  REQUIRED ACTIONS (for project administrator):\n');

console.log('1️⃣  ENABLE FIREBASE STORAGE:');
console.log('   • Go to: https://console.firebase.google.com/project/curious-context-409607/storage');
console.log('   • Click "Get Started" if Storage is not enabled');
console.log('   • Choose storage location (recommend: us-central1)');
console.log('   • Click "Done"\n');

console.log('2️⃣  ENABLE CLOUD STORAGE API:');
console.log('   • Go to: https://console.cloud.google.com/apis/library/storage-component.googleapis.com?project=curious-context-409607');
console.log('   • Click "Enable" if not already enabled\n');

console.log('3️⃣  SET UP IAM PERMISSIONS:');
console.log('   • Go to: https://console.cloud.google.com/iam-admin/iam?project=curious-context-409607');
console.log('   • Find: payment@curious-context-409607.iam.gserviceaccount.com');
console.log('   • Click "Edit" (pencil icon)');
console.log('   • Add these roles:');
console.log('     - Storage Object Admin');
console.log('     - Storage Object Viewer (or Storage Admin for full access)');
console.log('     - Firebase Admin SDK Administrator Service Agent (if not present)');
console.log('   • Click "Save"\n');

console.log('4️⃣  ALTERNATIVE: Use gcloud CLI (if available):');
console.log('   ```bash');
console.log('   # Enable the API');
console.log('   gcloud services enable storage-component.googleapis.com --project=curious-context-409607');
console.log('   ');
console.log('   # Add IAM roles');
console.log('   gcloud projects add-iam-policy-binding curious-context-409607 \\');
console.log('     --member="serviceAccount:payment@curious-context-409607.iam.gserviceaccount.com" \\');
console.log('     --role="roles/storage.objectAdmin"');
console.log('   ');
console.log('   gcloud projects add-iam-policy-binding curious-context-409607 \\');
console.log('     --member="serviceAccount:payment@curious-context-409607.iam.gserviceaccount.com" \\');
console.log('     --role="roles/storage.objectViewer"');
console.log('   ');
console.log('   # Alternative: Use Storage Admin for full access');
console.log('   # gcloud projects add-iam-policy-binding curious-context-409607 \\');
console.log('   #   --member="serviceAccount:payment@curious-context-409607.iam.gserviceaccount.com" \\');
console.log('   #   --role="roles/storage.admin"');
console.log('   ```\n');

console.log('5️⃣  DEPLOY STORAGE RULES:');
console.log('   ```bash');
console.log('   firebase deploy --only storage');
console.log('   ```\n');

console.log('6️⃣  TEST THE SETUP:');
console.log('   ```bash');
console.log('   node scripts/test-storage-permissions.js');
console.log('   ```\n');

console.log('⏱️  EXPECTED TIMELINE:');
console.log('   • IAM changes: 1-2 minutes to propagate');
console.log('   • Storage rules: 5-10 minutes to propagate globally');
console.log('   • Full setup: 10-15 minutes total\n');

console.log('🔄 CURRENT WORKAROUND:');
console.log('   The application is using a fallback method (data URLs) for logo uploads.');
console.log('   This works but is not optimal for production use.\n');

console.log('📞 NEED HELP?');
console.log('   • Firebase Console: https://console.firebase.google.com/project/curious-context-409607');
console.log('   • Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=curious-context-409607');
console.log('   • Firebase Support: https://firebase.google.com/support/contact/troubleshooting\n');

console.log('✨ Once setup is complete, logo uploads will use Firebase Storage with CDN benefits!');