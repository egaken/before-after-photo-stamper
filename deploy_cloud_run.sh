#!/bin/bash
set -e

PROJECT_ID="gen-lang-client-0290197999"
SERVICE_NAME="before-after-photo-stamper"
REGION="asia-northeast1"

echo "Deploying ${SERVICE_NAME} to Google Cloud Run (Project: ${PROJECT_ID}, Region: ${REGION})..."

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --quiet

echo "Deployment completed successfully!"
