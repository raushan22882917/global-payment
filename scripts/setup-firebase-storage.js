#!/usr/bin/env node

/**
 * Firebase Storage Setup Script
 * 
 * This script helps set up Firebase Storage for the organization management system.
 * It provides instructions and automated setup where possible.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Storage Setup Script');
console.log('================================\n');

// Check if Firebase CLI is available
try {
  const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Firebase CLI version: ${version}`);
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('   npm install -g firebase-tools');
  process.exit(1);
}

// Check current project
try {
  const project = execSync('firebase use', { encoding: 'utf8' });
  console.log(`✅ Current project: ${project.match(/Active Project: (.+)/)?.[1] || 'Unknown'}`);
} catch (error) {
  console.error('❌ No Firebase project selected. Run: firebase use <project-id>');
  process.exit(1);
}

console.log('\n📋 Setup Instructions:');
console.log('======================');

console.log('\n1. Enable Firebase Storage in Console:');
console.log('   🌐 Go to: https://console.firebase.google.com/project/curious-context-409607/storage');
console.log('   📝 Click "Get Started" to enable Firebase Storage');
console.log('   🌍 Choose your storage location (preferably same as Firestore)');
console.log('   ✅ Click "Done"');

console.log('\n2. Deploy Storage Rules:');
console.log('   After enabling storage in the console, run:');
console.log('   📤 firebase deploy --only storage');

console.log('\n3. Test Storage Upload:');
console.log('   🧪 Go to /org/settings in your app');
console.log('   📸 Try uploading an organization logo');
console.log('   ✅ Verify it appears in Firebase Storage console');

console.log('\n🔧 Current Storage Rules:');
console.log('========================');

// Read and display current storage rules
try {
  const rulesPath = path.join(__dirname, '..', 'storage.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  console.log('📄 storage.rules:');
  console.log(rules.split('\n').map(line => `   ${line}`).join('\n'));
} catch (error) {
  console.error('❌ Could not read storage.rules file');
}

console.log('\n🛡️ Security Features:');
console.log('=====================');
console.log('✅ Only ORG_ADMIN can upload organization logos');
console.log('✅ Only organization members can upload QR codes and attachments');
console.log('✅ File size limits enforced (5MB for logos, 2MB for QR codes, 10MB for attachments)');
console.log('✅ File type validation for images');
console.log('✅ Public read access for organization logos');
console.log('✅ Organization-scoped access control');

console.log('\n🔄 Fallback Behavior:');
console.log('=====================');
console.log('📝 If Firebase Storage is not available:');
console.log('   • Logo uploads will use data URLs stored in Firestore');
console.log('   • This works for development but has limitations');
console.log('   • Enable Firebase Storage for production use');

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Complete step 1 above (enable in console)');
console.log('2. Run: firebase deploy --only storage');
console.log('3. Test logo upload in the application');
console.log('4. Monitor storage usage in Firebase console');

console.log('\n✨ Setup complete! Follow the instructions above to enable Firebase Storage.');