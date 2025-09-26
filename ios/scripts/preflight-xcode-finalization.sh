#!/bin/bash

# VitalSense Preflight Xcode Finalization Script
# Automated surface checks before manual Xcode tasks

set -euo pipefail

echo "🔍 VitalSense Preflight Xcode Finalization Check"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

ISSUES=0

echo ""
echo "📋 Configuration Files"
echo "---------------------"
check_file "VitalSense.xcodeproj/Configuration/Base.xcconfig" "Base.xcconfig exists" || ((ISSUES++))
check_file "VitalSense.xcodeproj/Configuration/Debug.xcconfig" "Debug.xcconfig exists" || ((ISSUES++))
check_file "VitalSense.xcodeproj/Configuration/Release.xcconfig" "Release.xcconfig exists" || ((ISSUES++))
check_file "VitalSense.xcodeproj/Configuration/Shared.xcconfig" "Shared.xcconfig exists" || ((ISSUES++))

echo ""
echo "📱 Info.plist Files"
echo "------------------"
check_file "src/VitalSense/Support/Info.plist" "Main app Info.plist exists" || ((ISSUES++))
check_file "src/VitalSenseWatch/Info.plist" "Watch app Info.plist exists" || ((ISSUES++))
check_file "src/VitalSenseWidgets/Info.plist" "Widget Info.plist exists" || ((ISSUES++))

echo ""
echo "🔒 Entitlements & Permissions"
echo "----------------------------"
check_file "src/VitalSense/Support/VitalSense.entitlements" "Entitlements file exists" || ((ISSUES++))

echo ""
echo "🎨 Assets & Resources"
echo "-------------------"
check_dir "src/VitalSense/Resources/Assets.xcassets/AppIcon.appiconset" "iOS App Icon set exists" || ((ISSUES++))
check_dir "src/VitalSense/Resources/Assets.xcassets/AppIcon-Watch.appiconset" "Watch App Icon set exists" || ((ISSUES++))
check_file "src/VitalSense/Resources/Assets.xcassets/AccentColor.colorset/Contents.json" "AccentColor exists" || ((ISSUES++))

echo ""
echo "🧪 Testing Configuration"
echo "-----------------------"
check_file "VitalSenseTests/VitalSenseTests.xctestplan" "Test plan exists" || ((ISSUES++))

echo ""
echo "📦 Workspace Configuration"
echo "-------------------------"
check_file "VitalSense.xcworkspace/contents.xcworkspacedata" "Workspace contents exists" || ((ISSUES++))

# Check for non-empty configuration files
echo ""
echo "📝 Configuration File Contents"
echo "-----------------------------"
if [ -s "VitalSense.xcodeproj/Configuration/Base.xcconfig" ]; then
    echo -e "${GREEN}✅ Base.xcconfig has content${NC}"
else
    echo -e "${RED}❌ Base.xcconfig is empty${NC}"
    ((ISSUES++))
fi

if [ -s "VitalSense.xcworkspace/contents.xcworkspacedata" ]; then
    echo -e "${GREEN}✅ Workspace contents has content${NC}"
else
    echo -e "${RED}❌ Workspace contents is empty${NC}"
    ((ISSUES++))
fi

echo ""
echo "🎯 Summary"
echo "---------"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All automated checks passed!${NC}"
    echo "Ready for manual Xcode finalization tasks."
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES issues that need to be resolved.${NC}"
    echo -e "${YELLOW}⚠️  Please address the issues above before proceeding with Xcode tasks.${NC}"
    exit 1
fi