#!/bin/bash

# HealthKit Bridge - Xcode Project Creation Script
# Run this script on your Mac to create the iOS project

echo "🍎 Creating HealthKit Bridge iOS Project..."

# Project configuration
PROJECT_NAME="HealthKitBridge"
BUNDLE_ID="com.healthapp.healthkitbridge"
TEAM_ID="YOUR_TEAM_ID"  # Replace with your Apple Developer Team ID

# Create project directory
echo "📁 Creating project directory..."
mkdir -p ~/Desktop/$PROJECT_NAME

# Copy all Swift files
echo "📄 Copying Swift files..."
cp *.swift ~/Desktop/$PROJECT_NAME/
cp Config.plist ~/Desktop/$PROJECT_NAME/
cp Info.template.plist ~/Desktop/$PROJECT_NAME/Info.plist

echo "✅ Project files copied to ~/Desktop/$PROJECT_NAME"
echo ""
echo "🚀 Next steps:"
echo "1. Open Xcode"
echo "2. Create New Project > iOS > App"
echo "3. Configure project:"
echo "   - Product Name: $PROJECT_NAME"
echo "   - Bundle Identifier: $BUNDLE_ID"
echo "   - Language: Swift"
echo "   - Interface: SwiftUI"
echo "   - iOS Deployment Target: 16.0+"
echo ""
echo "4. Replace default files with copied files:"
echo "   - Replace ContentView.swift"
echo "   - Add HealthKitBridgeApp.swift (replace App.swift)"
echo "   - Add HealthKitManager.swift"
echo "   - Add WebSocketManager.swift"
echo "   - Add ApiClient.swift"
echo "   - Add AppConfig.swift"
echo "   - Replace Info.plist"
echo "   - Add Config.plist"
echo ""
echo "5. Add HealthKit capability:"
echo "   - Select project > Signing & Capabilities"
echo "   - Click + Capability > HealthKit"
echo "   - Enable 'Background Delivery'"
echo ""
echo "6. Build and run on a physical device (HealthKit requires real device)"
echo ""
echo "💡 Your servers are ready:"
echo "   - API Server: http://127.0.0.1:8789"
echo "   - WebSocket: ws://localhost:3001"
echo ""
echo "🎯 Once running, you'll see real HealthKit data in your web dashboard!"
