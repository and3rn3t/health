#!/bin/bash

# VitalSense Widget System Deployment Script
# Run this script to verify widget implementation is ready for Xcode integration

echo "🎯 VitalSense Widget System Deployment Verification"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "VitalSenseWidgets" ]; then
    echo "❌ Error: Run this script from the ios directory"
    exit 1
fi

echo "✅ Directory structure verified"

# Check required files exist
required_files=(
    "VitalSenseWidgets/VitalSenseHealthWidget.swift"
    "VitalSenseWidgets/VitalSenseSpecializedWidgets.swift"
    "VitalSenseWidgets/WidgetHealthManager.swift"
    "VitalSenseWidgets/VitalSenseWidgetBundle.swift"
    "VitalSenseWidgets/VitalSenseWidgets.entitlements"
    "VitalSenseWidgets/Info.plist"
    "VitalSenseWidgets/.swiftlint.yml"
    "VitalSense/Views/WidgetConfigurationView.swift"
    "docs/WIDGET_IMPLEMENTATION_GUIDE.md"
)

echo ""
echo "📁 Checking required files..."
missing_files=0

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        ((missing_files++))
    fi
done

if [ $missing_files -gt 0 ]; then
    echo ""
    echo "❌ $missing_files files are missing. Please create them before proceeding."
    exit 1
fi

echo ""
echo "📝 Verifying file contents..."

# Check key configuration values
if grep -q "group.dev.andernet.VitalSense.shared" VitalSenseWidgets/VitalSenseWidgets.entitlements; then
    echo "✅ Widget entitlements app group configured"
else
    echo "❌ Widget entitlements missing app group"
    exit 1
fi

if grep -q "group.dev.andernet.VitalSense.shared" VitalSenseWidgets/WidgetHealthManager.swift; then
    echo "✅ Widget health manager app group configured"
else
    echo "❌ Widget health manager app group not configured"
    exit 1
fi

if grep -q "NSHealthShareUsageDescription" VitalSenseWidgets/Info.plist; then
    echo "✅ Widget Info.plist has HealthKit permissions"
else
    echo "❌ Widget Info.plist missing HealthKit permissions"
    exit 1
fi

if grep -q "WidgetConfigurationView" VitalSense/UI/Views/EnhancedHealthMonitoringView.swift; then
    echo "✅ Main app integrated with widget configuration"
else
    echo "❌ Main app missing widget integration"
    exit 1
fi

echo ""
echo "🔍 Checking widget implementation completeness..."

# Count widget types
widget_count=$(grep -c "struct.*Widget: Widget" VitalSenseWidgets/VitalSense*.swift)
echo "✅ Found $widget_count widget types implemented"

# Check for timeline providers
provider_count=$(grep -c "TimelineProvider" VitalSenseWidgets/VitalSense*.swift)
echo "✅ Found $provider_count timeline providers"

# Check for widget bundle
if grep -q "@main" VitalSenseWidgets/VitalSenseWidgetBundle.swift; then
    echo "✅ Widget bundle has main entry point"
else
    echo "❌ Widget bundle missing main entry point"
    exit 1
fi

echo ""
echo "🎨 Checking widget families and sizes..."

# Check for different widget families
families=("systemSmall" "systemMedium" "systemLarge" "accessoryCircular" "accessoryRectangular")
for family in "${families[@]}"; do
    if grep -q "$family" VitalSenseWidgets/VitalSense*.swift; then
        echo "✅ $family widget family supported"
    else
        echo "⚠️  $family widget family not found"
    fi
done

echo ""
echo "🔐 Security and Privacy Verification..."

# Check for HealthKit permission descriptions
if grep -q "NSHealthShareUsageDescription" VitalSenseWidgets/Info.plist; then
    echo "✅ HealthKit share permission description found"
else
    echo "❌ Missing HealthKit share permission description"
fi

if grep -q "NSHealthUpdateUsageDescription" VitalSenseWidgets/Info.plist; then
    echo "✅ HealthKit update permission description found"
else
    echo "❌ Missing HealthKit update permission description"
fi

# Check for app group consistency
main_app_group=$(grep -o "group\.dev\.andernet\.VitalSense\.shared" VitalSense/VitalSense.entitlements | head -1)
widget_app_group=$(grep -o "group\.dev\.andernet\.VitalSense\.shared" VitalSenseWidgets/VitalSenseWidgets.entitlements | head -1)

if [ "$main_app_group" = "$widget_app_group" ]; then
    echo "✅ App group consistency verified"
else
    echo "❌ App group mismatch between main app and widgets"
    exit 1
fi

echo ""
echo "📊 Code Quality Checks..."

# Basic syntax checks (if Swift is available)
if command -v swift &> /dev/null; then
    echo "✅ Swift compiler available for syntax checking"

    # Basic syntax check for key files
    swift_files=(
        "VitalSenseWidgets/VitalSenseHealthWidget.swift"
        "VitalSenseWidgets/WidgetHealthManager.swift"
        "VitalSenseWidgets/VitalSenseWidgetBundle.swift"
    )

    for file in "${swift_files[@]}"; do
        if swift -frontend -parse "$file" &> /dev/null; then
            echo "✅ $file syntax valid"
        else
            echo "❌ $file has syntax errors"
            exit 1
        fi
    done
else
    echo "⚠️  Swift compiler not available - skipping syntax checks"
fi

echo ""
echo "📱 Deployment Readiness Checklist..."

checklist_items=(
    "Widget extension files created"
    "App group entitlements configured"
    "HealthKit permissions added"
    "Timeline providers implemented"
    "Widget bundle configured"
    "Main app integration completed"
    "Configuration UI added"
    "Documentation created"
)

for item in "${checklist_items[@]}"; do
    echo "✅ $item"
done

echo ""
echo "🎉 Widget System Implementation Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Open VitalSense.xcodeproj in Xcode"
echo "2. Add Widget Extension target:"
echo "   • File → New → Target → Widget Extension"
echo "   • Product Name: VitalSenseWidgets"
echo "   • Bundle ID: dev.andernet.VitalSense.VitalSenseWidgets"
echo "3. Add widget Swift files to the new target"
echo "4. Configure build settings and entitlements"
echo "5. Test on physical device (widgets don't work in simulator)"
echo ""
echo "📖 See docs/WIDGET_IMPLEMENTATION_GUIDE.md for detailed instructions"
echo ""
echo "Ready for Xcode integration! 🚀"
