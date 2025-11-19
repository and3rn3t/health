#!/bin/bash
# Health check for Docker containers
# Usage: ./scripts/docker/health-check.sh [container-name]

set -e

CONTAINER_NAME=${1:-vitalsense-build}

echo "🏥 Checking health of container: $CONTAINER_NAME"

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Container $CONTAINER_NAME not found"
  exit 1
fi

# Check container status
STATUS=$(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)
echo "Status: $STATUS"

if [ "$STATUS" != "running" ] && [ "$STATUS" != "exited" ]; then
  echo "❌ Container is not in a valid state"
  exit 1
fi

# Check if artifacts exist
echo "📦 Checking for build artifacts..."
if docker exec $CONTAINER_NAME test -d /build-output/dist 2>/dev/null; then
  echo "✅ dist/ found"
  docker exec $CONTAINER_NAME du -sh /build-output/dist
else
  echo "⚠️ dist/ not found"
fi

if docker exec $CONTAINER_NAME test -d /build-output/dist-worker 2>/dev/null; then
  echo "✅ dist-worker/ found"
  docker exec $CONTAINER_NAME du -sh /build-output/dist-worker
else
  echo "⚠️ dist-worker/ not found"
fi

echo "✅ Health check complete"

