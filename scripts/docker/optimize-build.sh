#!/bin/bash
# Optimize Docker build with cache mounts and parallel builds
# Usage: ./scripts/docker/optimize-build.sh

set -e

echo "🚀 Optimizing Docker build..."

# Build with cache mounts for node_modules
docker build \
  --file Dockerfile.build \
  --tag vitalsense:build \
  --cache-from type=local,src=/tmp/.buildx-cache \
  --cache-to type=local,dest=/tmp/.buildx-cache,mode=max \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  .

echo "✅ Optimized build complete"

