#!/bin/bash
# Extract build artifacts from Docker container
# Usage: ./scripts/docker/extract-artifacts.sh [image-name]

set -e

IMAGE_NAME=${1:-vitalsense:build}
CONTAINER_NAME=vitalsense-artifacts-$(date +%s)

echo "📦 Extracting build artifacts from $IMAGE_NAME..."

# Create a temporary container
docker create --name $CONTAINER_NAME $IMAGE_NAME

# Extract artifacts
echo "📂 Extracting dist/..."
docker cp $CONTAINER_NAME:/build-output/dist ./dist || echo "⚠️ dist/ not found"

echo "📂 Extracting dist-worker/..."
docker cp $CONTAINER_NAME:/build-output/dist-worker ./dist-worker || echo "⚠️ dist-worker/ not found"

# Clean up
docker rm $CONTAINER_NAME

echo "✅ Artifacts extracted to ./dist and ./dist-worker"

