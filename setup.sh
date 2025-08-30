#!/bin/bash

echo "🏥 Health Monitoring Platform - Setup Script"
echo "============================================="

# Check for required tools
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install server dependencies
echo "📦 Installing WebSocket server dependencies..."
cd server
npm install
cd ..

# Install main project dependencies (if not already done)
echo "📦 Installing main project dependencies..."
npm install

# Add missing dependencies for WebSocket integration
echo "📦 Adding WebSocket client dependencies..."
npm install ws @types/ws

echo ""
echo "🚀 Next Steps to Complete Integration:"
echo "======================================"
echo ""
echo "1. 📱 iOS App Development (CRITICAL - Currently Missing)"
echo "   - Open Xcode and create new iOS project"
echo "   - Add HealthKit framework to your project"
echo "   - Copy ios/HealthKitManager.swift to your iOS project"
echo "   - Configure Info.plist with HealthKit usage description"
echo "   - Add HealthKit entitlements"
echo ""
echo "2. 🔧 Start the WebSocket Server"
echo "   cd server && npm start"
echo ""
echo "3. 🌐 Start the Web Dashboard"
echo "   npm run dev"
echo ""
echo "4. 📲 Test the Integration"
echo "   - Run iOS app on device (not simulator for HealthKit)"
echo "   - Grant HealthKit permissions"
echo "   - Check web dashboard for live data"
echo ""
echo "🔍 Current Status:"
echo "  ✅ Web dashboard with simulated data"
echo "  ✅ WebSocket server ready"
echo "  ✅ Real-time data processing pipeline"
echo "  ❌ iOS app for HealthKit integration (NEEDS CREATION)"
echo "  ❌ Apple Watch companion app (NEEDS CREATION)"
echo ""
echo "💡 Priority Actions:"
echo "  1. Create iOS app project in Xcode"
echo "  2. Integrate HealthKit framework"
echo "  3. Test real device connectivity"
echo "  4. Deploy to production environment"
echo ""
