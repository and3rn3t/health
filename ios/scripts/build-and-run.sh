#!/bin/bash

# Enhanced build and run script for VitalSense Monitor
# Usage: ./scripts/build-and-run.sh [device_name] [configuration]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="HealthKitBridge"
SCHEME="HealthKitBridge"
WORKSPACE_PATH="HealthKitBridge.xcodeproj"
CONFIGURATION=${2:-"Debug"}
DEVICE_NAME=${1:-""}

echo -e "${BLUE}🚀 VitalSense Monitor Build & Deploy Script${NC}"
echo "================================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode command line tools not found!"
    exit 1
fi

print_status "Xcode found"

# Clean previous builds
print_status "Cleaning previous builds..."
xcodebuild clean -project "$WORKSPACE_PATH" -scheme "$SCHEME" -configuration "$CONFIGURATION" > /dev/null 2>&1

# List available simulators if no device specified
if [ -z "$DEVICE_NAME" ]; then
    print_warning "No device specified. Available iOS simulators:"
    xcrun simctl list devices iOS | grep -E "iPhone|iPad" | grep "Booted\|Shutdown" | head -10
    echo ""
    print_warning "Usage: $0 [device_name] [configuration]"
    print_warning "Example: $0 'iPhone 15 Pro' Debug"
    echo ""
    DEVICE_NAME="iPhone 15 Pro"
    print_status "Using default device: $DEVICE_NAME"
fi

# Boot simulator if needed
print_status "Preparing simulator: $DEVICE_NAME"
DEVICE_ID=$(xcrun simctl list devices | grep "$DEVICE_NAME" | grep -E -o -i "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})" | head -1)

if [ -z "$DEVICE_ID" ]; then
    print_error "Device '$DEVICE_NAME' not found!"
    exit 1
fi

# Boot the simulator if it's not already booted
DEVICE_STATE=$(xcrun simctl list devices | grep "$DEVICE_ID" | grep -o "Booted\|Shutdown")
if [ "$DEVICE_STATE" != "Booted" ]; then
    print_status "Booting simulator..."
    xcrun simctl boot "$DEVICE_ID"
    sleep 3
fi

# Build the app
print_status "Building $SCHEME for $CONFIGURATION..."
BUILD_START=$(date +%s)

xcodebuild build \
    -project "$WORKSPACE_PATH" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "id=$DEVICE_ID" \
    -allowProvisioningUpdates \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

print_status "Build completed in ${BUILD_TIME}s"

# Install and run the app
print_status "Installing app on simulator..."
APP_PATH=$(find build/Build/Products/$CONFIGURATION-iphonesimulator -name "*.app" | head -1)

if [ -z "$APP_PATH" ]; then
    print_error "App not found in build products!"
    exit 1
fi

xcrun simctl install "$DEVICE_ID" "$APP_PATH"

# Get bundle identifier
BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw "$APP_PATH/Info.plist")
print_status "Launching app with bundle ID: $BUNDLE_ID"

xcrun simctl launch "$DEVICE_ID" "$BUNDLE_ID"

print_status "🎉 App launched successfully!"
print_status "Check the iOS Simulator for your running app"

# Optional: Open iOS Simulator
if ! pgrep -f "iOS Simulator" > /dev/null; then
    print_status "Opening iOS Simulator..."
    open -a Simulator
fi