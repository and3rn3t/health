#!/bin/bash

# VitalSense Development Environment Validator
# Ensures all required tools and configurations are properly set up

set -e

echo "🔧 VitalSense Development Environment Validator"
echo "=============================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_requirement() {
    local name="$1"
    local command="$2"
    local required="$3"
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ $name${NC}"
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $name (REQUIRED)${NC}"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠️  $name (RECOMMENDED)${NC}"
            ((WARNINGS++))
        fi
    fi
}

echo -e "\n${BLUE}📋 System Requirements${NC}"
echo "----------------------"

check_requirement "macOS 14.0+" "[[ \$(sw_vers -productVersion | cut -d. -f1) -ge 14 ]]" true
check_requirement "Xcode 15.0+" "xcodebuild -version | grep -E 'Xcode (1[5-9]|[2-9][0-9])'" true
check_requirement "Git" "command -v git" true
check_requirement "Ruby" "command -v ruby" false
check_requirement "Python 3" "command -v python3" false
check_requirement "Node.js" "command -v node" false

echo -e "\n${BLUE}🛠️  Development Tools${NC}"
echo "---------------------"

check_requirement "SwiftLint" "command -v swiftlint" false
check_requirement "Bundler" "command -v bundle" false
check_requirement "Fastlane" "command -v fastlane || bundle exec fastlane --version" false
check_requirement "xcpretty" "command -v xcpretty" false

echo -e "\n${BLUE}📁 Project Structure${NC}"
echo "--------------------"

check_requirement "Workspace exists" "[ -f VitalSense.xcworkspace/contents.xcworkspacedata ]" true
check_requirement "Main app source" "[ -d VitalSense ]" true
check_requirement "Build scripts" "[ -d Scripts/Build ]" true
check_requirement "Documentation" "[ -d Docs ]" true
check_requirement "Configuration" "[ -d Configuration ]" true

echo -e "\n${BLUE}⚙️  Configuration Files${NC}"
echo "------------------------"

check_requirement ".gitignore" "[ -f .gitignore ]" true
check_requirement ".editorconfig" "[ -f .editorconfig ]" false
check_requirement "CODEOWNERS" "[ -f CODEOWNERS ]" false
check_requirement "Debug config" "[ -f Configuration/Project/Debug.xcconfig ]" true
check_requirement "Release config" "[ -f Configuration/Project/Release.xcconfig ]" true

echo -e "\n${BLUE}🔐 Code Signing${NC}"
echo "---------------"

if [ -f "VitalSense/VitalSense.entitlements" ]; then
    echo -e "${GREEN}✅ Entitlements file exists${NC}"
    
    # Check for required entitlements
    if grep -q "com.apple.developer.healthkit" VitalSense/VitalSense.entitlements; then
        echo -e "${GREEN}✅ HealthKit entitlement configured${NC}"
    else
        echo -e "${RED}❌ Missing HealthKit entitlement${NC}"
        ((ERRORS++))
    fi
    
    if grep -q "com.apple.security.application-groups" VitalSense/VitalSense.entitlements; then
        echo -e "${GREEN}✅ App Groups entitlement configured${NC}"
    else
        echo -e "${YELLOW}⚠️  App Groups entitlement missing${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ Entitlements file missing${NC}"
    ((ERRORS++))
fi

echo -e "\n${BLUE}🏥 HealthKit Configuration${NC}"
echo "-------------------------"

if [ -f "VitalSense/Info.plist" ]; then
    if grep -q "NSHealthShareUsageDescription" VitalSense/Info.plist; then
        echo -e "${GREEN}✅ HealthKit usage description present${NC}"
    else
        echo -e "${RED}❌ Missing HealthKit usage description${NC}"
        ((ERRORS++))
    fi
    
    if grep -q "NSHealthUpdateUsageDescription" VitalSense/Info.plist; then
        echo -e "${GREEN}✅ HealthKit update usage description present${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing HealthKit update usage description${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ Info.plist not found${NC}"
    ((ERRORS++))
fi

echo -e "\n${BLUE}📊 Summary${NC}"
echo "----------"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Development environment is fully configured.${NC}"
    else
        echo -e "${YELLOW}✨ Good! $WARNINGS optional improvement(s) available.${NC}"
    fi
    echo -e "${GREEN}Ready for VitalSense development!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $ERRORS critical issue(s) must be resolved before development.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Additionally, $WARNINGS optional improvement(s) are recommended.${NC}"
    fi
    
    echo -e "\n${BLUE}🔧 Quick Fixes:${NC}"
    echo "- Run: ./Scripts/Build/setup-enhanced-dev-env.sh"
    echo "- Check: ./Scripts/Build/preflight-xcode-finalization.sh"
    echo "- Review: Docs/QUICK_START.md"
    
    exit 1
fi