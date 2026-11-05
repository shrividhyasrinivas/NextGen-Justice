#!/usr/bin/env bash
# ==============================================================================
# NextGen Justice V8 - Production Deployment to Google Cloud Run
# Target Project: vast-provider-zz0s9
# Preferred Region: asia-south1 (Mumbai - optimal for India/Tamil Nadu users)
# ==============================================================================

set -euo pipefail

PROJECT_ID="vast-provider-zz0s9"
SERVICE_NAME="nextgen-justice"
REGION="${REGION:-asia-south1}"

echo "=========================================================="
echo " Starting NextGen Justice V8 Cloud Run Deployment"
echo " Project: $PROJECT_ID"
echo " Service: $SERVICE_NAME"
echo " Region:  $REGION"
echo "=========================================================="

# 1. Ensure Google Cloud project is configured
echo "[1/4] Setting active GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# 2. Enable essential APIs if not already enabled
echo "[2/4] Verifying required Google Cloud APIs are enabled..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# 3. Deploy full-stack container directly from source
echo "[3/4] Building container and deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,PORT=8080,JWT_SECRET=nextgen-justice-v8-enterprise-secret-key-2026,UPLOAD_DIR=uploads,SEED_ADMIN_EMAIL=admin@nextgenjustice.org,SEED_ADMIN_PASSWORD=Admin@2026"

# 4. Fetch and display deployed service URL and health
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format 'value(status.url)')

echo "=========================================================="
echo " DEPLOYMENT SUCCESSFUL!"
echo " Public Production URL: $SERVICE_URL"
echo " Health Endpoint:       $SERVICE_URL/api/health"
echo " Advocate Directory:    $SERVICE_URL/advocates"
echo "=========================================================="

echo "Verifying service health..."
curl -sI "$SERVICE_URL/api/health" || true
