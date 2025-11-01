#!/bin/bash

# Test Fastlane lanes to ensure they're properly integrated
echo "🧪 Testing Fastlane integration..."

# Check if bundle is available
if ! command -v bundle &> /dev/null; then
    echo "❌ Bundle not found. Installing Ruby and bundler..."
    # For GitHub Actions (macOS), this should work
    if [[ "$RUNNER_OS" == "macOS" ]]; then
        echo "✅ Running on macOS in GitHub Actions"
        gem install bundler
        bundle install
    else
        echo "⚠️ Local development environment - bundle not available"
        echo "   This is expected on Windows. The GitHub Actions CI will handle this."
        exit 0
    fi
fi

echo "📋 Available Fastlane lanes:"
bundle exec fastlane lanes

echo "🔍 Testing specific lanes exist:"
if bundle exec fastlane lanes | grep -q "build_optimized"; then
    echo "✅ build_optimized lane found"
else
    echo "❌ build_optimized lane missing"
fi

if bundle exec fastlane lanes | grep -q "performance_test"; then
    echo "✅ performance_test lane found"
else
    echo "❌ performance_test lane missing"
fi

if bundle exec fastlane lanes | grep -q "build_health_monitoring"; then
    echo "✅ build_health_monitoring lane found"
else
    echo "❌ build_health_monitoring lane missing"
fi

echo "🎉 Fastlane integration test completed!"
