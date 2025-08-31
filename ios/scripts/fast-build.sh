#!/bin/bash

# Fast Development Build Script
# Optimized for speed during development

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT="HealthKitBridge.xcodeproj"
SCHEME="HealthKitBridge"
DEVICE=${1:-"iPhone 15 Pro"}
CONFIG=${2:-"Debug"}

echo -e "${BLUE}🚀 Fast Development Build${NC}"
echo "=========================="
echo "Device: $DEVICE"
echo "Config: $CONFIG"
echo ""

# Clean derived data for fresh start (optional)
if [ "$3" = "clean" ]; then
    echo -e "${YELLOW}🧹 Cleaning derived data...${NC}"
    rm -rf ~/Library/Developer/Xcode/DerivedData/HealthKitBridge-*
fi

# Build with optimizations for speed
echo -e "${GREEN}🔨 Building with performance optimizations...${NC}"
xcodebuild build \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination "platform=iOS Simulator,name=$DEVICE" \
    -xcconfig BuildOptimizations.xcconfig \
    -jobs $(sysctl -n hw.ncpu) \
    -quiet \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    COMPILER_INDEX_STORE_ENABLE=NO \
    SWIFT_COMPILATION_MODE=singlefile \
    | xcpretty --color

# Install and run
echo -e "${GREEN}📱 Installing and launching...${NC}"
xcodebuild run \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination "platform=iOS Simulator,name=$DEVICE" \
    -xcconfig BuildOptimizations.xcconfig \
    -quiet \
    | xcpretty --color

echo -e "${GREEN}✅ Build and launch completed!${NC}"