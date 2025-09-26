#!/bin/bash

# VitalSense Project Health Check
# Validates project structure, configuration, and development environment

set -e

echo "🔍 VitalSense Project Health Check"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Function to report issues
report_issue() {
    echo -e "${RED}❌ $1${NC}"
    ((ISSUES_FOUND++))
}

report_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check workspace structure
echo -e "\n📁 Project Structure"
echo "--------------------"

if [ -f "VitalSense.xcworkspace/contents.xcworkspacedata" ]; then
    report_success "Workspace file exists"
else
    report_issue "Missing VitalSense.xcworkspace"
fi

if [ -d "VitalSense" ]; then
    report_success "Main app directory exists"
else
    report_issue "Missing VitalSense app directory"
fi

if [ -d "Scripts/Build" ]; then
    report_success "Build scripts directory exists"
else
    report_issue "Missing Scripts/Build directory"
fi

if [ -d "Docs" ]; then
    report_success "Documentation directory exists"
else
    report_issue "Missing Docs directory"
fi

# Check critical files
echo -e "\n📄 Critical Files"
echo "-----------------"

CRITICAL_FILES=(
    "VitalSense/VitalSenseApp.swift"
    "VitalSense/Info.plist"
    "VitalSense/VitalSense.entitlements"
    "Scripts/Build/preflight-xcode-finalization.sh"
    "Docs/COPILOT_INSTRUCTIONS.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        report_success "Found $file"
    else
        report_issue "Missing $file"
    fi
done

# Check configuration files
echo -e "\n⚙️  Configuration Files"
echo "----------------------"

CONFIG_FILES=(
    ".gitignore"
    ".editorconfig"
    "CODEOWNERS"
    "Configuration/Project/Debug.xcconfig"
    "Configuration/Project/Release.xcconfig"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        report_success "Found $file"
    else
        report_warning "Missing $file (recommended)"
    fi
done

# Check build tools
echo -e "\n🛠️  Build Tools"
echo "---------------"

if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    report_success "Xcode available: $XCODE_VERSION"
else
    report_issue "xcodebuild not found - Xcode not installed or not in PATH"
fi

if command -v swiftlint &> /dev/null; then
    SWIFTLINT_VERSION=$(swiftlint version)
    report_success "SwiftLint available: $SWIFTLINT_VERSION"
else
    report_warning "SwiftLint not installed (recommended for code quality)"
fi

if [ -f "Gemfile" ] && command -v bundle &> /dev/null; then
    report_success "Bundler available for Ruby dependencies"
else
    report_warning "Bundler/Gemfile setup incomplete"
fi

# Check HealthKit configuration
echo -e "\n🏥 HealthKit Configuration"
echo "-------------------------"

if grep -q "NSHealthShareUsageDescription" VitalSense/Info.plist 2>/dev/null; then
    report_success "HealthKit usage description found"
else
    report_issue "Missing HealthKit usage description in Info.plist"
fi

if grep -q "com.apple.developer.healthkit" VitalSense/VitalSense.entitlements 2>/dev/null; then
    report_success "HealthKit entitlement found"
else
    report_issue "Missing HealthKit entitlement"
fi

# Check for common issues
echo -e "\n🔍 Common Issues Check"
echo "---------------------"

# Check for .DS_Store files
if find . -name ".DS_Store" -type f | grep -q .; then
    report_warning "Found .DS_Store files (should be gitignored)"
else
    report_success "No .DS_Store files found"
fi

# Check for xcuserdata
if find . -name "xcuserdata" -type d | grep -q .; then
    report_warning "Found xcuserdata directories (should be gitignored)"
else
    report_success "No xcuserdata directories found"
fi

# Check workspace vs project usage
if grep -q "VitalSense.xcodeproj" Docs/*.md 2>/dev/null; then
    report_warning "Documentation mentions .xcodeproj - should use .xcworkspace"
fi

# Summary
echo -e "\n📊 Summary"
echo "----------"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 Project health check passed! No critical issues found.${NC}"
    exit 0
else
    echo -e "${RED}Found $ISSUES_FOUND critical issue(s) that should be addressed.${NC}"
    echo -e "${YELLOW}Run the suggested fixes or consult the documentation.${NC}"
    exit 1
fi