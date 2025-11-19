.PHONY: help docker-build docker-build-prod docker-build-ci docker-test docker-clean docker-push docker-extract

# Default target
help:
	@echo "VitalSense Docker Commands:"
	@echo ""
	@echo "  make docker-build          - Build development image"
	@echo "  make docker-build-prod     - Build production image"
	@echo "  make docker-build-ci       - Build CI/CD image"
	@echo "  make docker-test           - Test Docker build"
	@echo "  make docker-extract        - Extract artifacts from build image"
	@echo "  make docker-clean          - Clean Docker images and containers"
	@echo "  make docker-push           - Push images to registry"
	@echo ""

# Build development image
docker-build:
	@echo "🐳 Building development image..."
	docker build -f Dockerfile -t vitalsense:dev --build-arg SKIP_BUILD=true .

# Build production image
docker-build-prod:
	@echo "📦 Building production image..."
	docker build -f Dockerfile.production -t vitalsense:production -t vitalsense:latest .

# Build CI/CD image
docker-build-ci:
	@echo "🔨 Building CI/CD image..."
	docker build -f Dockerfile.build -t vitalsense:build .

# Test Docker build
docker-test:
	@echo "🧪 Testing Docker build..."
	docker build -f Dockerfile.build -t vitalsense:test .
	@echo "✅ Build test successful"

# Extract artifacts from build image
docker-extract:
	@echo "📦 Extracting build artifacts..."
	@./scripts/docker/extract-artifacts.sh vitalsense:build

# Clean Docker resources
docker-clean:
	@echo "🧹 Cleaning Docker resources..."
	docker system prune -f
	docker image prune -f
	@echo "✅ Cleanup complete"

# Push to registry (requires REGISTRY env var)
docker-push:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "❌ REGISTRY not set. Usage: REGISTRY=ghcr.io/and3rn3t make docker-push"; \
		exit 1; \
	fi
	@echo "📤 Pushing images to $(REGISTRY)..."
	docker tag vitalsense:production $(REGISTRY)/health:latest
	docker tag vitalsense:build $(REGISTRY)/health:build
	docker push $(REGISTRY)/health:latest
	docker push $(REGISTRY)/health:build
	@echo "✅ Images pushed"

