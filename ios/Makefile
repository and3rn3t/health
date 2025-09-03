# Makefile for VitalSense Monitor
# Provides convenient commands for common development tasks

.PHONY: help setup build test clean lint format install-deps

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Setup development environment
	@echo "Setting up development environment..."
	./scripts/setup-dev-env.sh
	npm install

build: ## Build the iOS project
	@echo "Building VitalSense Monitor..."
	xcodebuild clean build \
		-project VitalSenseMonitor.xcodeproj \
		-scheme VitalSenseMonitor \
		-configuration Debug

test: ## Run tests
	@echo "Running tests..."
	xcodebuild test \
		-project VitalSenseMonitor.xcodeproj \
		-scheme VitalSenseMonitor \
		-destination 'platform=iOS Simulator,name=iPhone 15 Pro'

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	xcodebuild clean -project VitalSenseMonitor.xcodeproj
	rm -rf build/
	rm -rf DerivedData/

lint: ## Run Swift linting
	@echo "Running SwiftLint..."
	swiftlint lint

format: ## Format Swift code
	@echo "Formatting Swift code..."
	swiftlint --fix

install-deps: ## Install development dependencies
	@echo "Installing dependencies..."
	brew install swiftlint
	npm install

simulator: ## Start iOS Simulator
	@echo "Starting iOS Simulator..."
	open -a Simulator

watch: ## Watch for changes and rebuild
	@echo "Watching for changes..."
	fswatch -o HealthKitBridge/ | xargs -n1 -I{} make build

dev-server: ## Start development WebSocket server
	@echo "Starting development server..."
	npm start

backend-services: ## Start backend services with Docker
	@echo "Starting backend services (WebSocket, Redis, PostgreSQL)..."
	docker-compose up -d

stop-services: ## Stop backend services
	@echo "Stopping backend services..."
	docker-compose down

logs: ## View backend service logs
	@echo "Viewing service logs..."
	docker-compose logs -f
