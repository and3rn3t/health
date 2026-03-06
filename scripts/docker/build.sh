#!/bin/bash
# Docker build script for VitalSense
# Usage: ./scripts/docker/build.sh [production|build|dev]

set -e

BUILD_TYPE=${1:-production}
VERSION=${2:-latest}

echo "🐳 Building Docker image for: $BUILD_TYPE"

case $BUILD_TYPE in
  production)
    echo "📦 Building production image..."
    docker build \
      -f Dockerfile.production \
      -t vitalsense:production \
      -t vitalsense:${VERSION} \
      --target production \
      .
    echo "✅ Production image built: vitalsense:production"
    ;;
  build)
    echo "🔨 Building build image (for CI/CD)..."
    docker build \
      -f Dockerfile.build \
      -t vitalsense:build \
      -t vitalsense:build-${VERSION} \
      .
    echo "✅ Build image created: vitalsense:build"
    ;;
  dev)
    echo "🛠️ Building development image..."
    docker build \
      -f Dockerfile \
      -t vitalsense:dev \
      --build-arg SKIP_BUILD=true \
      .
    echo "✅ Development image built: vitalsense:dev"
    ;;
  *)
    echo "❌ Unknown build type: $BUILD_TYPE"
    echo "Usage: $0 [production|build|dev] [version]"
    exit 1
    ;;
esac

echo "📊 Image sizes:"
docker images vitalsense --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

