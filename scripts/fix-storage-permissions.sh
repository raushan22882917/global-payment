#!/bin/bash

# Script to fix Firebase Storage permissions
# Run with: bash scripts/fix-storage-permissions.sh

echo "🔧 Fixing Firebase Storage Permissions"
echo "======================================"

PROJECT_ID="curious-context-409607"
SERVICE_ACCOUNT="payment@curious-context-409607.iam.gserviceaccount.com"

echo "📋 Project: $PROJECT_ID"
echo "🔑 Service Account: $SERVICE_ACCOUNT"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it or use the Google Cloud Console."
    echo "   Install: https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "🌐 Manual setup via Google Cloud Console:"
    echo "   1. Go to: https://console.cloud.google.com/iam-admin/iam?project=$PROJECT_ID"
    echo "   2. Find: $SERVICE_ACCOUNT"
    echo "   3. Click 'Edit' and add these roles:"
    echo "      - Storage Object Admin"
    echo "      - Storage Object Viewer"
    echo "      - Firebase Admin SDK Administrator Service Agent"
    exit 1
fi

echo "✅ gcloud CLI found"

# Set the project
echo "🔄 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔄 Enabling Cloud Storage API..."
gcloud services enable storage-component.googleapis.com

echo "🔄 Enabling Firebase Management API..."
gcloud services enable firebase.googleapis.com

# Add IAM roles
echo "🔄 Adding Storage Object Admin role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectAdmin"

echo "🔄 Adding Storage Object Viewer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectViewer"

echo "🔄 Adding Firebase Admin SDK role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/firebase.sdkAdminServiceAgent"

echo ""
echo "✅ Permissions setup complete!"
echo ""
echo "🧪 Testing permissions..."
echo "   Run: node scripts/test-storage-permissions.js"
echo ""
echo "⏱️  Note: Changes may take 1-2 minutes to propagate"