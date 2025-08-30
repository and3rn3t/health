# Health Monitoring Platform - PowerShell Setup Script
# =======================================================

Write-Host "🏥 Health Monitoring Platform - Setup Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check for required tools
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "📦 Installing WebSocket server dependencies..." -ForegroundColor Yellow
Push-Location server
try {
    npm install
    Write-Host "✅ Server dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
} finally {
    Pop-Location
}

# Install main project dependencies (if not already done)
Write-Host "📦 Installing main project dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Main project dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install main project dependencies" -ForegroundColor Red
}

# Add missing dependencies for WebSocket integration
Write-Host "📦 Adding WebSocket client dependencies..." -ForegroundColor Yellow
try {
    npm install ws
    npm install --save-dev @types/ws
    Write-Host "✅ WebSocket dependencies added" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add WebSocket dependencies" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Next Steps to Complete Integration:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 📱 iOS App Development (CRITICAL - Currently Missing)" -ForegroundColor Red
Write-Host "   - Open Xcode and create new iOS project" -ForegroundColor White
Write-Host "   - Add HealthKit framework to your project" -ForegroundColor White
Write-Host "   - Copy ios/HealthKitManager.swift to your iOS project" -ForegroundColor White
Write-Host "   - Configure Info.plist with HealthKit usage description" -ForegroundColor White
Write-Host "   - Add HealthKit entitlements" -ForegroundColor White
Write-Host ""
Write-Host "2. 🔧 Start the WebSocket Server" -ForegroundColor Yellow
Write-Host "   Push-Location server; npm start; Pop-Location" -ForegroundColor White
Write-Host ""
Write-Host "3. 🌐 Start the Web Dashboard" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "4. 📲 Test the Integration" -ForegroundColor Yellow
Write-Host "   - Run iOS app on device (not simulator for HealthKit)" -ForegroundColor White
Write-Host "   - Grant HealthKit permissions" -ForegroundColor White
Write-Host "   - Check web dashboard for live data" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Current Status:" -ForegroundColor Cyan
Write-Host "  ✅ Web dashboard with simulated data" -ForegroundColor Green
Write-Host "  ✅ WebSocket server ready" -ForegroundColor Green
Write-Host "  ✅ Real-time data processing pipeline" -ForegroundColor Green
Write-Host "  ❌ iOS app for HealthKit integration (NEEDS CREATION)" -ForegroundColor Red
Write-Host "  ❌ Apple Watch companion app (NEEDS CREATION)" -ForegroundColor Red
Write-Host ""
Write-Host "💡 Priority Actions:" -ForegroundColor Cyan
Write-Host "  1. Create iOS app project in Xcode" -ForegroundColor White
Write-Host "  2. Integrate HealthKit framework" -ForegroundColor White
Write-Host "  3. Test real device connectivity" -ForegroundColor White
Write-Host "  4. Deploy to production environment" -ForegroundColor White
Write-Host ""
Write-Host "📚 Use these PowerShell commands to start:" -ForegroundColor Cyan
Write-Host "  .\start-server.ps1    # Start WebSocket server" -ForegroundColor White
Write-Host "  .\start-dev.ps1       # Start web dashboard" -ForegroundColor White
Write-Host "  .\test-integration.ps1 # Test integration" -ForegroundColor White
