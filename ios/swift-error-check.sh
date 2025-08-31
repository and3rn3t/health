#!/bin/bash

# 🔍 Swift Error Diagnostic Script
# This script checks all Swift files for compilation errors

echo "🔍 Swift Error Diagnostic Report"
echo "=================================="
echo "Date: $(date)"
echo "Directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "HealthKitBridgeApp.swift" ]; then
    echo "❌ Error: Not in iOS project directory"
    echo "Please run this from the ios/ folder"
    exit 1
fi

echo "📂 Files in directory:"
ls -la *.swift
echo ""

echo "🔧 Checking individual Swift files for syntax errors:"
echo ""

# Check each Swift file individually
for file in *.swift; do
    echo "Checking $file..."

    # Use swiftc to check syntax
    if command -v swiftc &> /dev/null; then
        swiftc -parse "$file" 2>&1 | head -20
        if [ $? -eq 0 ]; then
            echo "✅ $file: No syntax errors"
        else
            echo "❌ $file: Has syntax errors (see above)"
        fi
    else
        echo "⚠️  swiftc not found, checking with basic syntax patterns..."

        # Basic checks
        if grep -q "import " "$file"; then
            echo "✅ $file: Has import statements"
        else
            echo "⚠️  $file: No import statements found"
        fi

        if grep -q "class\|struct\|enum\|protocol" "$file"; then
            echo "✅ $file: Has type definitions"
        else
            echo "⚠️  $file: No type definitions found"
        fi

        # Check for common errors
        if grep -q "AppConfig\.load" "$file"; then
            echo "❌ $file: Uses old AppConfig.load() - should be AppConfig.shared"
        fi

        if grep -q "ApiClient(" "$file"; then
            echo "❌ $file: Tries to initialize ApiClient - should use ApiClient.shared"
        fi
    fi
    echo ""
done

echo "📋 Required files check:"
echo ""

required_files=("HealthKitBridgeApp.swift" "ContentView.swift" "HealthKitManager.swift" "WebSocketManager.swift" "ApiClient.swift" "AppConfig.swift" "Config.plist")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file MISSING"
    fi
done

echo ""
echo "🔧 Config.plist validation:"
if [ -f "Config.plist" ]; then
    echo "✅ Config.plist exists"

    # Check if it contains required keys
    if command -v plutil &> /dev/null; then
        echo "📝 Config.plist contents:"
        plutil -p Config.plist
    else
        echo "📝 Config.plist raw contents:"
        cat Config.plist
    fi
else
    echo "❌ Config.plist is missing!"
    echo "You need to create Config.plist with:"
    echo "- API_BASE_URL: http://127.0.0.1:8789"
    echo "- WS_URL: ws://localhost:3001"
    echo "- USER_ID: demo-user"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Fix any syntax errors shown above"
echo "2. Ensure all required files exist"
echo "3. Verify Config.plist has correct values"
echo "4. Try building in Xcode again"
echo ""
echo "📧 Send this output to your Windows PC for analysis!"
