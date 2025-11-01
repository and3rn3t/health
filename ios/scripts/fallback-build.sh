#!/bin/bash

# VitalSense Fallback Build Script
# Direct xcodebuild without Fastlane gym wrapper
# Use when exit status 74 persists with Fastlane

set -e

echo "🚀 VitalSense Fallback Build"
echo "============================"

# Create build directory
mkdir -p build
mkdir -p logs

# Configuration
WORKSPACE="VitalSense.xcworkspace"
SCHEME="VitalSense"
CONFIGURATION="Release"
ARCHIVE_PATH="build/VitalSense-Fallback.xcarchive"
LOG_PATH="logs/fallback-build.log"

echo "📋 Build Configuration:"
echo "  Workspace: $WORKSPACE"
echo "  Scheme: $SCHEME"
echo "  Configuration: $CONFIGURATION"
echo "  Archive Path: $ARCHIVE_PATH"
echo ""

# Step 1: Resolve dependencies
echo "📦 Resolving Swift Package dependencies..."
xcodebuild -resolvePackageDependencies \
    -workspace "$WORKSPACE" \
    2>&1 | tee -a "$LOG_PATH"

# Step 2: Clean build folder
echo "🧹 Cleaning build folder..."
xcodebuild clean \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    2>&1 | tee -a "$LOG_PATH"

# Step 3: Build for testing (faster than archive)
echo "🔨 Building for testing..."
xcodebuild build-for-testing \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    COMPILER_INDEX_STORE_ENABLE=NO \
    SWIFT_WHOLE_MODULE_OPTIMIZATION=YES \
    GCC_OPTIMIZATION_LEVEL=fast \
    2>&1 | tee -a "$LOG_PATH"

# Step 4: Archive (if build-for-testing succeeds)
echo "📦 Creating archive..."
xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO \
    COMPILER_INDEX_STORE_ENABLE=NO \
    SWIFT_WHOLE_MODULE_OPTIMIZATION=YES \
    GCC_OPTIMIZATION_LEVEL=fast \
    2>&1 | tee -a "$LOG_PATH"

echo ""
echo "✅ Fallback build completed successfully!"
echo "📦 Archive created at: $ARCHIVE_PATH"
echo "📄 Build logs saved to: $LOG_PATH"

# Verify archive was created
if [ -d "$ARCHIVE_PATH" ]; then
    echo "🎯 Archive verification: SUCCESS"
    ls -la "$ARCHIVE_PATH"
else
    echo "❌ Archive verification: FAILED - Archive not found"
    exit 1
fi
