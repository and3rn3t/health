# Makefile for HealthKit Bridge Development
# Provides easy commands for common development tasks

.PHONY: help build build-sim clean test test-sim install lint setup run run-sim simulator device deploy

# Default target
help:
	@echo "HealthKit Bridge Development Commands"
	@echo "====================================="
	@echo "setup          - Initial project setup and optimization"
	@echo "build          - Build for Matt's iPhone (HealthKit requires physical device)"
	@echo "build-sim      - Build for iOS Simulator (fallback)"
	@echo "run            - Build and run on Matt's iPhone"
	@echo "run-sim        - Build and run on iOS Simulator"
	@echo "test           - Run tests on Matt's iPhone"
	@echo "test-sim       - Run UI tests on iOS Simulator"
	@echo "lint           - Run SwiftLint"
	@echo "lint-fix       - Auto-fix SwiftLint issues"
	@echo "clean          - Clean build artifacts"
	@echo "simulator      - Open iOS Simulator"
	@echo "devices        - List available devices"
	@echo "check-device   - Check if Matt's iPhone is connected"
	@echo "install-tools  - Install development tools"
	@echo "optimize       - Optimize Xcode settings"
	@echo "reset-sim      - Reset all simulators"
	@echo "deploy         - Deploy to connected device"

# Project configuration - Updated for Matt's iPhone (HealthKit requires physical device)
PROJECT = HealthKitBridge.xcodeproj
SCHEME = HealthKitBridge
DEVICE = "Matt's iPhone"
DEVICE_ID = "00008130-000859EC0AD1001C"
SIM_DEVICE = "iPhone 16 Pro"
CONFIG = Debug

# Setup and optimization
setup: install-tools optimize
	@echo "✅ Development environment setup complete"

install-tools:
	@echo "🛠️  Installing development tools..."
	@./scripts/setup-dev-env.sh

optimize:
	@echo "⚡ Optimizing Xcode..."
	@./scripts/optimize-xcode.sh

# Build commands - Default to physical device for HealthKit compatibility
build:
	@echo "🔨 Building $(SCHEME) for physical device..."
	@echo "📱 Target device: $(DEVICE)"
	@echo "⚠️  Note: HealthKit only works on physical devices, not simulators"
	@xcodebuild build -project $(PROJECT) -scheme $(SCHEME) -configuration $(CONFIG) -destination 'platform=iOS,id=$(DEVICE_ID)'

# Fallback build for simulator (when device isn't available)
build-sim:
	@echo "🔨 Building $(SCHEME) for iOS Simulator..."
	@echo "⚠️  Note: HealthKit features will not work in simulator"
	@xcodebuild build -project $(PROJECT) -scheme $(SCHEME) -configuration $(CONFIG) -destination 'platform=iOS Simulator,name=$(SIM_DEVICE)'

clean:
	@echo "🧹 Cleaning build artifacts..."
	@xcodebuild clean -project $(PROJECT) -scheme $(SCHEME)
	@rm -rf build/

# Run commands - Default to physical device for HealthKit
run:
	@echo "🚀 Building and running on physical device..."
	@echo "📱 Target device: $(DEVICE)"
	@echo "⚠️  Make sure $(DEVICE) is connected and unlocked"
	@./scripts/build-and-run.sh "$(DEVICE)" $(CONFIG)

# Run on simulator (fallback)
run-sim:
	@echo "🚀 Building and running on iOS Simulator..."
	@echo "⚠️  HealthKit features will not work in simulator"
	@./scripts/build-and-run.sh "$(SIM_DEVICE)" $(CONFIG)

simulator:
	@echo "📱 Opening iOS Simulator..."
	@open -a Simulator

# Testing - Default to physical device for HealthKit tests
test:
	@echo "🧪 Running tests on physical device..."
	@echo "📱 Target device: $(DEVICE)"
	@echo "⚠️  Make sure $(DEVICE) is connected and unlocked"
	@xcodebuild test -project $(PROJECT) -scheme $(SCHEME) -destination 'platform=iOS,id=$(DEVICE_ID)'

# Testing on simulator (for UI tests that don't need HealthKit)
test-sim:
	@echo "🧪 Running UI tests on iOS Simulator..."
	@echo "⚠️  HealthKit tests will be skipped in simulator"
	@xcodebuild test -project $(PROJECT) -scheme $(SCHEME) -destination 'platform=iOS Simulator,name=$(SIM_DEVICE)'

# Code quality
lint:
	@echo "📝 Running SwiftLint..."
	@if command -v swiftlint >/dev/null 2>&1; then \
		swiftlint; \
	else \
		echo "❌ SwiftLint not installed. Run: brew install swiftlint"; \
	fi

lint-fix:
	@echo "🔧 Auto-fixing SwiftLint issues..."
	@if command -v swiftlint >/dev/null 2>&1; then \
		swiftlint --fix; \
	else \
		echo "❌ SwiftLint not installed. Run: brew install swiftlint"; \
	fi

# Device management
devices:
	@echo "📱 Available devices:"
	@echo ""
	@echo "Physical Devices:"
	@xcrun xctrace list devices | grep -E "iPhone|iPad" | grep -v "Simulator" || echo "  No physical devices found"
	@echo ""
	@echo "Simulators:"
	@xcrun simctl list devices iOS | grep -E "iPhone|iPad" | head -5

check-device:
	@echo "🔍 Checking if $(DEVICE) is available..."
	@if xcrun xctrace list devices | grep -q "$(DEVICE)"; then \
		echo "✅ $(DEVICE) is available"; \
		xcrun xctrace list devices | grep "$(DEVICE)"; \
	else \
		echo "❌ $(DEVICE) not found or not connected"; \
		echo "💡 Please connect and unlock your iPhone, then try again"; \
		echo ""; \
		echo "Available devices:"; \
		xcrun xctrace list devices | grep -E "iPhone|iPad" | grep -v "Simulator"; \
	fi

reset-sim:
	@echo "🔄 Resetting all simulators..."
	@xcrun simctl erase all

# Deployment
deploy:
	@echo "📤 Deploying to connected device..."
	@./deploy-to-device.sh

# Development server
start-server:
	@echo "🌐 Starting WebSocket test server..."
	@if [ -f test-websocket-server.js ]; then \
		node test-websocket-server.js; \
	elif [ -f test-websocket-server.py ]; then \
		python3 test-websocket-server.py; \
	else \
		echo "❌ No test server found"; \
	fi

# Quick development workflow (with device check)
dev: check-device clean build run
	@echo "🎉 Development build complete!"

# Production build
release:
	@echo "🚀 Building release version for $(DEVICE)..."
	@xcodebuild build -project $(PROJECT) -scheme $(SCHEME) -configuration Release -destination 'platform=iOS,id=$(DEVICE_ID)'

# Archive for distribution
archive:
	@echo "📦 Creating archive..."
	@xcodebuild archive -project $(PROJECT) -scheme $(SCHEME) -archivePath ./build/$(SCHEME).xcarchive

# HealthKit specific commands
healthkit-test:
	@echo "🏥 Running HealthKit-specific tests on $(DEVICE)..."
	@echo "⚠️  This requires a physical device with HealthKit data"
	@xcodebuild test -project $(PROJECT) -scheme $(SCHEME) -destination 'platform=iOS,id=$(DEVICE_ID)' -only-testing:HealthKitBridgeTests/HealthKitManagerTests

# Show current configuration
config:
	@echo "🔧 Current Configuration:"
	@echo "  Project: $(PROJECT)"
	@echo "  Scheme: $(SCHEME)"
	@echo "  Default Device: $(DEVICE)"
	@echo "  Device ID: $(DEVICE_ID)"
	@echo "  Simulator Fallback: $(SIM_DEVICE)"
	@echo "  Build Configuration: $(CONFIG)"
