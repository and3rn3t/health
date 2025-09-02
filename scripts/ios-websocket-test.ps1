#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple WebSocket Connection Test for iOS App

.DESCRIPTION
    Tests WebSocket connectivity for the VitalSense iOS app
#>

Write-Host "🧪 VitalSense iOS WebSocket Connection Test" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Test the production backend WebSocket endpoint
Write-Host "📋 Testing Production Backend..." -ForegroundColor Yellow
Write-Host "URL: wss://health.andernet.dev/ws" -ForegroundColor Gray

try {
    $result = curl.exe -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" https://health.andernet.dev/ws 2>&1

    if ($result -match "426") {
        Write-Host "✅ Expected Result: 426 Upgrade Required" -ForegroundColor Green
        Write-Host "📝 Production backend correctly reports WebSocket not available" -ForegroundColor Gray
    } else {
        Write-Host "❓ Unexpected response: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing production: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check if local WebSocket server is available
Write-Host "📋 Testing Local WebSocket Server..." -ForegroundColor Yellow
Write-Host "URL: ws://localhost:3001" -ForegroundColor Gray

try {
    $tcpTest = Test-NetConnection -ComputerName "localhost" -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue

    if ($tcpTest) {
        Write-Host "✅ Local WebSocket server is running on port 3001" -ForegroundColor Green
        Write-Host "📝 iOS app can connect to local server for testing" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Local WebSocket server not running on port 3001" -ForegroundColor Yellow
        Write-Host "💡 Run: cd server && npm start" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error testing local server: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📱 iOS App WebSocket Testing Summary" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "🎯 Current WebSocket Status:" -ForegroundColor Cyan
Write-Host "   • Production Backend: Intentionally disabled (returns 426)" -ForegroundColor Gray
Write-Host "   • Local Testing: Available via Node.js server on port 3001" -ForegroundColor Gray
Write-Host "   • iOS App Behavior: Gracefully falls back to mock mode" -ForegroundColor Gray
Write-Host ""

Write-Host "🧪 To Test iOS WebSocket Connection:" -ForegroundColor Yellow
Write-Host "   1. Start local server: cd server && npm start" -ForegroundColor Gray
Write-Host "   2. Update iOS Config.plist: WS_URL = ws://localhost:3001" -ForegroundColor Gray
Write-Host "   3. Build & run iOS app in Xcode simulator" -ForegroundColor Gray
Write-Host "   4. Watch Xcode console for WebSocket connection logs" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 iOS App Features to Test:" -ForegroundColor Yellow
Write-Host "   • Connection status indicator (green/red circle)" -ForegroundColor Gray
Write-Host "   • Real-time data transmission rate display" -ForegroundColor Gray
Write-Host "   • Send test data button functionality" -ForegroundColor Gray
Write-Host "   • Automatic fallback to mock mode" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Test completed!" -ForegroundColor Green
