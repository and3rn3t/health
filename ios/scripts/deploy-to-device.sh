#!/bin/bash

# HealthKitBridge iOS App Deployment Script
# This script builds and installs the app to connected iOS devices

#!/bin/bash

# VitalSense Monitor iOS App Deployment Script
# Automated deployment to connected iOS devices

echo "🚀 VitalSense Monitor Deployment Script"
echo "======================================"

# Check if any iOS devices are connected
echo "📱 Checking for connected iOS devices..."
DEVICES=$(xcrun devicectl list devices | grep -E "iPhone|iPad" | grep "connected")

if [ -z "$DEVICES" ]; then
    echo "❌ No iOS devices found. Please connect Matt's iPhone and trust this computer."
    exit 1
fi

echo "✅ Found connected devices:"
echo "$DEVICES"

# Build the project
echo ""
echo "🔨 Building VitalSense Monitor for iOS..."
cd "$(dirname "$0")"

xcodebuild -project HealthKitBridge.xcodeproj \
           -scheme HealthKitBridge \
           -configuration Debug \
           -destination "generic/platform=iOS" \
           build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📲 The app has been built and signed. To install:"
    echo "1. Open Xcode"
    echo "2. Go to Window > Devices and Simulators"
    echo "3. Select Matt's iPhone"
    echo "4. Drag and drop the .app file to install"
    echo ""
    echo "App location: ~/Library/Developer/Xcode/DerivedData/HealthKitBridge-*/Build/Products/Debug-iphoneos/HealthKitBridge.app"
    echo ""
    echo "🧪 Testing Features Available:"
    echo "• Tap status cards to connect HealthKit and WebSocket"
    echo "• Use manual data fetch buttons to test health data retrieval"
    echo "• Tap 'Data Streaming' card to send test data"
    echo "• Expand 'Debug Info' section to see configuration details"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# HealthKit Bridge - Deploy to Device Script
# This script builds and deploys the app to your connected iPhone

set -e  # Exit on any error

echo "🚀 Starting HealthKit Bridge deployment to device..."

# Configuration
PROJECT_NAME="HealthKitBridge"
SCHEME_NAME="HealthKitBridge"
DEVICE_ID="00008130-000859EC0AD1001C"  # Matt's iPhone
BUILD_CONFIG="Debug"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Target Device: Matt's iPhone (${DEVICE_ID})${NC}"
echo -e "${BLUE}🔨 Build Configuration: ${BUILD_CONFIG}${NC}"

# Check if device is connected
echo -e "${YELLOW}🔍 Checking device connection...${NC}"
if xcrun devicectl list devices | grep -q "$DEVICE_ID"; then
    echo -e "${GREEN}✅ Device found and connected${NC}"
else
    echo -e "${RED}❌ Device not found. Please ensure your iPhone is connected and trusted.${NC}"
    echo "💡 Try:"
    echo "   1. Connect your iPhone via USB"
    echo "   2. Trust this computer on your iPhone"
    echo "   3. Unlock your iPhone"
    exit 1
fi

# Clean build folder
echo -e "${YELLOW}🧹 Cleaning build folder...${NC}"
xcodebuild clean -project "${PROJECT_NAME}.xcodeproj" -scheme "$SCHEME_NAME"

# Build and install the app
echo -e "${YELLOW}🔨 Building and installing app...${NC}"
xcodebuild \
    -project "${PROJECT_NAME}.xcodeproj" \
    -scheme "$SCHEME_NAME" \
    -destination "platform=iOS,id=${DEVICE_ID}" \
    -configuration "$BUILD_CONFIG" \
    install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App successfully built and installed!${NC}"
    echo -e "${BLUE}📱 Check your iPhone - the HealthKit Bridge app should now be installed${NC}"
    echo -e "${YELLOW}💡 You may need to trust the developer certificate in Settings > General > VPN & Device Management${NC}"
else
    echo -e "${RED}❌ Build/Install failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
