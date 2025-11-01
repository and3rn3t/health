#!/bin/bash

# Simple test to validate Fastfile syntax
echo "🧪 Testing Fastfile syntax..."

# Check if we're in the right directory
if [ ! -f "fastlane/Fastfile" ]; then
    echo "❌ Not in iOS project directory or Fastfile missing"
    exit 1
fi

echo "📋 Testing Ruby syntax validation..."

# Test Ruby syntax
if ruby -c fastlane/Fastfile > /dev/null 2>&1; then
    echo "✅ Fastfile Ruby syntax is valid"
else
    echo "❌ Fastfile has Ruby syntax errors"
    ruby -c fastlane/Fastfile
    exit 1
fi

# If bundle is available, test fastlane
if command -v bundle >/dev/null 2>&1; then
    echo "📋 Testing Fastlane lanes..."

    # Test simple lane first
    if bundle exec fastlane test_syntax; then
        echo "✅ Basic lane execution works"
    else
        echo "❌ Basic lane execution failed"
        exit 1
    fi

    # List all lanes
    echo "📋 Available lanes:"
    bundle exec fastlane lanes

else
    echo "⚠️ Bundle not available - Ruby syntax test passed but cannot test Fastlane execution"
    echo "   This is expected on Windows. GitHub Actions (macOS) will handle full testing."
fi

echo "🎉 Fastfile validation completed!"
