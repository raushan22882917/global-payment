#!/bin/bash

# Firebase Storage Setup Script
# This script helps enable Firebase Storage for the organization management system

echo "🔥 Firebase Storage Setup"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo "Please install Firebase CLI first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found${NC}"

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase${NC}"
    echo "Please login first:"
    echo "firebase login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Firebase${NC}"

# Check current project
PROJECT=$(firebase use 2>/dev/null | grep "curious-context-409607" | head -1)
if [ -z "$PROJECT" ]; then
    # Try alternative method
    PROJECT=$(cat .firebaserc 2>/dev/null | grep -o '"default"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$PROJECT" ]; then
    echo -e "${RED}❌ No Firebase project selected${NC}"
    echo "Please select a project first:"
    echo "firebase use <project-id>"
    exit 1
fi

echo -e "${GREEN}✅ Current project: $PROJECT${NC}"

# Check if Google Cloud CLI is available
if command -v gcloud &> /dev/null; then
    echo -e "${GREEN}✅ Google Cloud CLI found${NC}"
    
    echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
    
    # Enable Storage API
    gcloud services enable storage.googleapis.com --project=$PROJECT
    echo -e "${GREEN}✅ Storage API enabled${NC}"
    
    # Enable Firebase Storage API
    gcloud services enable firebasestorage.googleapis.com --project=$PROJECT
    echo -e "${GREEN}✅ Firebase Storage API enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Google Cloud CLI not found${NC}"
    echo "APIs may need to be enabled manually in the console"
fi

echo ""
echo -e "${BLUE}📋 Manual Setup Required:${NC}"
echo "=========================="
echo ""
echo "1. 🌐 Open Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT/storage"
echo ""
echo "2. 📝 Click 'Get Started' to enable Firebase Storage"
echo ""
echo "3. 🌍 Choose your storage location:"
echo "   - Recommended: Same region as your Firestore database"
echo "   - For best performance, choose a location close to your users"
echo ""
echo "4. ✅ Click 'Done' to complete setup"
echo ""
echo "5. 🚀 Deploy storage rules:"
echo "   firebase deploy --only storage"
echo ""

echo -e "${BLUE}🛡️  Security Rules Preview:${NC}"
echo "============================"
echo ""
echo "The storage rules will enforce:"
echo "• Only ORG_ADMIN can upload organization logos"
echo "• Only organization members can upload QR codes and attachments"
echo "• File size limits (5MB for logos, 2MB for QR codes, 10MB for attachments)"
echo "• File type validation for images"
echo "• Public read access for organization logos"
echo ""

echo -e "${BLUE}🧪 Testing:${NC}"
echo "==========="
echo ""
echo "After setup, test the logo upload:"
echo "1. Start your development server: npm run dev"
echo "2. Login as an Organization Admin"
echo "3. Go to /org/settings"
echo "4. Try uploading a logo"
echo "5. Check Firebase Storage console to verify upload"
echo ""

echo -e "${GREEN}✨ Setup script complete!${NC}"
echo "Follow the manual steps above to enable Firebase Storage."