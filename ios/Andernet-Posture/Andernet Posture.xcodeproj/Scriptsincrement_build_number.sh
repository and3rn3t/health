#!/bin/bash

# Auto-increment Build Number Script
# Add this to Build Phases → "+" → New Run Script Phase
# Place it BEFORE "Compile Sources" phase

# Script name: "Auto-increment Build Number"

# Only increment for Release builds
if [ "$CONFIGURATION" == "Release" ]; then
    buildNumber=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${INFOPLIST_FILE}")
    buildNumber=$((buildNumber + 1))
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $buildNumber" "${INFOPLIST_FILE}"
    echo "Build number incremented to: $buildNumber"
else
    echo "Debug build - build number not incremented"
fi
