#!/usr/bin/env node

/**
 * Script to diagnose and fix common organization issues
 * Run with: node scripts/fix-organization-issues.js
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
  console.error('Make sure the service account file exists at:', serviceAccountPath);
  process.exit(1);
}

const db = admin.firestore();

async function diagnoseOrganizationIssues() {
  console.log('🔍 Diagnosing organization issues...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Found ${users.length} users`);

    // Get all organizations
    const orgsSnapshot = await db.collection('organizations').get();
    const organizations = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`🏢 Found ${organizations.length} organizations`);

    // Find users with organization roles but missing organizations
    const orgUsers = users.filter(user => user.role && user.role.startsWith('ORG_'));
    console.log(`👥 Found ${orgUsers.length} organization users`);

    const issuesFound = [];

    for (const user of orgUsers) {
      if (!user.orgId || user.orgId === 'public') {
        issuesFound.push({
          type: 'MISSING_ORG_ID',
          user: user.id,
          email: user.email,
          role: user.role,
          issue: 'User has organization role but no orgId'
        });
        continue;
      }

      // Check if organization exists
      const orgExists = organizations.find(org => org.id === user.orgId);
      if (!orgExists) {
        issuesFound.push({
          type: 'MISSING_ORGANIZATION',
          user: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
          issue: 'User references non-existent organization'
        });
      }
    }

    // Report issues
    if (issuesFound.length === 0) {
      console.log('✅ No organization issues found!');
      return;
    }

    console.log(`\n⚠️  Found ${issuesFound.length} issues:\n`);

    issuesFound.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}`);
      console.log(`   User: ${issue.email} (${issue.user})`);
      console.log(`   Role: ${issue.role}`);
      if (issue.orgId) console.log(`   OrgId: ${issue.orgId}`);
      console.log(`   Issue: ${issue.issue}\n`);
    });

    // Offer to fix issues
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Would you like to fix these issues? (y/N): ', resolve);
    });

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await fixOrganizationIssues(issuesFound);
    }

    rl.close();

  } catch (error) {
    console.error('❌ Error diagnosing issues:', error);
  }
}

async function fixOrganizationIssues(issues) {
  console.log('\n🔧 Fixing organization issues...\n');

  for (const issue of issues) {
    try {
      if (issue.type === 'MISSING_ORGANIZATION') {
        // Create missing organization
        const orgData = {
          name: `Organization for ${issue.email}`,
          status: 'ACTIVE',
          businessType: 'Other',
          createdBy: issue.user,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          memberIds: [issue.user]
        };

        await db.collection('organizations').doc(issue.orgId).set(orgData);
        console.log(`✅ Created organization ${issue.orgId} for user ${issue.email}`);

      } else if (issue.type === 'MISSING_ORG_ID') {
        // Generate new organization ID and create organization
        const newOrgId = `ORG_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const orgData = {
          name: `Organization for ${issue.email}`,
          status: 'ACTIVE',
          businessType: 'Other',
          createdBy: issue.user,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          memberIds: [issue.user]
        };

        await db.collection('organizations').doc(newOrgId).set(orgData);
        
        // Update user with new orgId
        await db.collection('users').doc(issue.user).update({
          orgId: newOrgId
        });

        console.log(`✅ Created organization ${newOrgId} and updated user ${issue.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to fix issue for ${issue.email}:`, error.message);
    }
  }

  console.log('\n🎉 Organization issues fixed!');
}

// Run the diagnosis
diagnoseOrganizationIssues().catch(console.error);