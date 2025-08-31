#!/bin/bash
# iOS Project Setup Script
# Run this on your Mac after creating the Xcode project

echo "🍎 HealthKit Bridge - iOS Project Setup"
echo "======================================="
echo ""

PROJECT_DIR="$HOME/Desktop/HealthKitBridge"
SOURCE_DIR="$(pwd)/ios"

echo "📁 Creating project directory structure..."
mkdir -p "$PROJECT_DIR"

echo "📄 Copying Swift files to Desktop..."
cp "$SOURCE_DIR"/*.swift "$PROJECT_DIR/" 2>/dev/null || echo "No Swift files to copy (add them manually in Xcode)"
cp "$SOURCE_DIR"/Config.plist "$PROJECT_DIR/" 2>/dev/null || echo "Config.plist not found"
cp "$SOURCE_DIR"/Info.template.plist "$PROJECT_DIR/Info.plist" 2>/dev/null || echo "Info template not found"

echo ""
echo "✅ Files copied to: $PROJECT_DIR"
echo ""
echo "📋 Next steps in Xcode:"
echo "1. Drag the .swift files into your Xcode project"
echo "2. Replace ContentView.swift with the new one"
echo "3. Replace App.swift with HealthKitBridgeApp.swift"
echo "4. Add Config.plist to your app target"
echo "5. Replace Info.plist with the new one"
echo ""
echo "🔧 Then add HealthKit capability:"
echo "1. Select project > Signing & Capabilities"
echo "2. Click + Capability > HealthKit"
echo "3. Enable 'Background Delivery'"
echo ""
echo "🚀 Build and run on your iPhone!"
echo ""
echo "📊 Your servers are ready:"
echo "   - React Dashboard: http://localhost:5000"
echo "   - API Server: http://127.0.0.1:8789"
echo "   - WebSocket: ws://localhost:3001"
