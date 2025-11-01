#!/bin/bash

# VitalSense Exit Status 74 Debug Script
# Comprehensive diagnostics for Xcode build failures in CI

set -e

echo "🔍 VitalSense iOS Build Troubleshooting"
echo "======================================"
echo "Exit Status 74 Debug Analysis"
echo ""

# Function to run command and capture both success/failure
run_diagnostic() {
    local description="$1"
    local command="$2"

    echo "🧪 Testing: $description"
    echo "Command: $command"
    echo "----------------------------------------"

    if eval "$command"; then
        echo "✅ SUCCESS: $description"
    else
        local exit_code=$?
        echo "❌ FAILED: $description (Exit Code: $exit_code)"
    fi
    echo ""
}

# Basic environment checks
run_diagnostic "Xcode Version" "xcodebuild -version"
run_diagnostic "Available SDKs" "xcodebuild -showsdks | head -10"
run_diagnostic "Workspace Exists" "test -f VitalSense.xcworkspace/contents.xcworkspacedata"
run_diagnostic "Project Exists" "test -f VitalSense.xcodeproj/project.pbxproj"

# Scheme and configuration checks
run_diagnostic "List Schemes" "xcodebuild -workspace VitalSense.xcworkspace -list"
run_diagnostic "Show Destinations" "xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -showdestinations | head -10"

# Package resolution
if [ -f "Package.swift" ] || [ -f "Package.resolved" ]; then
    run_diagnostic "Resolve Packages" "xcodebuild -resolvePackageDependencies -workspace VitalSense.xcworkspace"
else
    echo "📦 No Swift packages detected"
fi

# Test basic builds with different configurations
echo "🏗️ Build Configuration Tests"
echo "============================"

# Test 1: Basic build for iOS Simulator
run_diagnostic "Build for iOS Simulator" "xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -configuration Release -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' CODE_SIGN_IDENTITY='' CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO build"

# Test 2: Build for Generic iOS Device
run_diagnostic "Build for Generic iOS Device" "xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -configuration Release -destination generic/platform=iOS CODE_SIGN_IDENTITY='' CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO build"

# Test 3: Archive build (what gym typically does)
run_diagnostic "Archive Build" "xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -configuration Release -destination generic/platform=iOS CODE_SIGN_IDENTITY='' CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO archive -archivePath build/Debug.xcarchive"

echo "🎯 Build Analysis Complete"
echo "========================="
echo ""
echo "If all tests pass, the issue is likely with Fastlane's gym configuration."
echo "If specific tests fail, focus on those configurations for the fix."
echo ""
echo "Common Exit 74 causes:"
echo "  • Missing iOS SDK or Xcode tools"
echo "  • Invalid scheme or workspace configuration"
echo "  • Unresolved Swift package dependencies"
echo "  • Code signing issues (even with CODE_SIGNING_ALLOWED=NO)"
echo "  • Incompatible Xcode version or missing simulators"
