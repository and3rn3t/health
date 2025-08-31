#!/bin/bash

# Swift Code Quality and Build Validation Script
# Run this to check your Swift code before building in Xcode

echo "🔍 Swift Code Quality Check"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -d "ios" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

cd ios

echo "📁 Checking Swift files..."
SWIFT_FILES=$(find . -name "*.swift" | grep -v ".fixed.swift")
echo "Found Swift files:"
for file in $SWIFT_FILES; do
    echo "   - $file"
done
echo ""

echo "🔍 Basic Syntax Validation..."

# Function to check basic Swift syntax
check_swift_file() {
    local file="$1"
    echo "Checking $file..."

    # Check for common issues
    local issues=0

    # Check for missing imports
    if ! grep -q "import Foundation\|import SwiftUI\|import HealthKit" "$file"; then
        echo "   ⚠️  Warning: No imports found in $file"
        ((issues++))
    fi

    # Check for unclosed braces
    local open_braces=$(grep -o "{" "$file" | wc -l)
    local close_braces=$(grep -o "}" "$file" | wc -l)
    if [ "$open_braces" -ne "$close_braces" ]; then
        echo "   ❌ Error: Mismatched braces in $file (open: $open_braces, close: $close_braces)"
        ((issues++))
    fi

    # Check for async/await usage
    if grep -q "await.*\." "$file" && ! grep -q "async func\|Task {" "$file"; then
        echo "   ⚠️  Warning: 'await' usage detected, ensure function is marked 'async' in $file"
        ((issues++))
    fi

    # Check for @StateObject without ObservableObject
    if grep -q "@StateObject" "$file"; then
        local filename=$(basename "$file" .swift)
        if ! grep -q "ObservableObject\|: ObservableObject" "$file"; then
            echo "   ⚠️  Warning: @StateObject used but class may not conform to ObservableObject in $file"
        fi
    fi

    return $issues
}

total_issues=0

# Check each Swift file
for file in $SWIFT_FILES; do
    if [ -f "$file" ]; then
        check_swift_file "$file"
        issues=$?
        ((total_issues += issues))
        echo ""
    fi
done

echo "📊 Summary:"
if [ $total_issues -eq 0 ]; then
    echo "✅ No major issues found!"
    echo "🚀 Your Swift code looks good for building in Xcode"
else
    echo "⚠️  Found $total_issues potential issues"
    echo "💡 Consider reviewing the warnings above before building"
fi

echo ""
echo "🔧 Fixed versions available:"
echo "   - ApiClient.fixed.swift"
echo "   - AppConfig.fixed.swift"
echo "   - HealthKitBridgeApp.fixed.swift"
echo ""
echo "💡 To use fixed versions:"
echo "   1. In Xcode, delete the original files"
echo "   2. Add the .fixed.swift versions to your project"
echo "   3. Rename them to remove '.fixed' extension"
echo ""
echo "🎯 Next steps:"
echo "   1. Fix any issues shown above"
echo "   2. Build in Xcode (⌘+B)"
echo "   3. Run on your iPhone (⌘+R)"
