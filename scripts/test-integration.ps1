# Test Health Monitoring Integration - PowerShell Script
# ===================================================

Write-Host "🧪 Testing Health Monitoring Platform Integration..." -ForegroundColor Cyan

# Function to test if a port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to make HTTP request
function Test-HttpEndpoint {
    param([string]$Url)
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5
        return $response
    } catch {
        return $null
    }
}

Write-Host "🔍 Checking system status..." -ForegroundColor Yellow

# Check if WebSocket server is running
Write-Host "📡 Testing WebSocket server (port 3001)..." -ForegroundColor Gray
if (Test-Port -Port 3001) {
    Write-Host "✅ WebSocket server is running" -ForegroundColor Green

    # Test REST API endpoint
    $healthCheck = Test-HttpEndpoint -Url "http://localhost:3001/api/health"
    if ($healthCheck) {
        Write-Host "✅ REST API is responding" -ForegroundColor Green
        Write-Host "   Status: $($healthCheck.status)" -ForegroundColor White
        Write-Host "   Connections: $($healthCheck.connections)" -ForegroundColor White
        Write-Host "   Uptime: $([math]::Round($healthCheck.uptime, 2)) seconds" -ForegroundColor White
    } else {
        Write-Host "⚠️  REST API not responding" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ WebSocket server not running" -ForegroundColor Red
    Write-Host "   Start with: .\start-server.ps1" -ForegroundColor Gray
}

# Check if web dashboard is running
Write-Host "🌐 Testing web dashboard (port 5173)..." -ForegroundColor Gray
if (Test-Port -Port 5173) {
    Write-Host "✅ Web dashboard is running" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
} else {
    Write-Host "❌ Web dashboard not running" -ForegroundColor Red
    Write-Host "   Start with: .\start-dev.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔧 Testing WebSocket connection..." -ForegroundColor Yellow

# Create a simple WebSocket test using Node.js
$testScript = @"
const WebSocket = require('ws');

console.log('Attempting to connect to WebSocket server...');

try {
    const ws = new WebSocket('ws://localhost:3001');

    ws.on('open', function() {
        console.log('✅ WebSocket connection established');

        // Send test identification
        ws.send(JSON.stringify({
            type: 'client_identification',
            clientType: 'test_client',
            userId: 'test-user'
        }));

        setTimeout(() => {
            console.log('✅ Connection test completed');
            ws.close();
            process.exit(0);
        }, 2000);
    });

    ws.on('message', function(data) {
        const message = JSON.parse(data);
        console.log('📨 Received message:', message.type);
    });

    ws.on('error', function(error) {
        console.log('❌ WebSocket error:', error.message);
        process.exit(1);
    });

    ws.on('close', function() {
        console.log('🔌 WebSocket connection closed');
    });

} catch (error) {
    console.log('❌ Failed to create WebSocket:', error.message);
    process.exit(1);
}

setTimeout(() => {
    console.log('⏰ Connection timeout');
    process.exit(1);
}, 10000);
"@

# Save test script temporarily
$testScript | Out-File -FilePath "temp-websocket-test.js" -Encoding UTF8

# Run WebSocket test if server is available
if (Test-Port -Port 3001) {
    try {
        Write-Host "🔗 Testing WebSocket connection..." -ForegroundColor Gray
        node temp-websocket-test.js
    } catch {
        Write-Host "❌ WebSocket test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipping WebSocket test (server not running)" -ForegroundColor Yellow
}

# Clean up test file
if (Test-Path "temp-websocket-test.js") {
    Remove-Item "temp-websocket-test.js"
}

Write-Host ""
Write-Host "📋 Integration Status Summary:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check project files
$criticalFiles = @(
    "ios/HealthKitManager.swift",
    "server/websocket-server.js",
    "server/package.json",
    "src/lib/liveHealthDataSync.ts",
    "src/hooks/useLiveHealthData.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚨 CRITICAL MISSING COMPONENTS:" -ForegroundColor Red
Write-Host "1. 📱 iOS App Project (HealthKit integration)" -ForegroundColor Red
Write-Host "2. ⌚ Apple Watch Companion App" -ForegroundColor Red
Write-Host "3. 🔐 Production Security Configuration" -ForegroundColor Yellow
Write-Host "4. ☁️  Cloud Deployment Setup" -ForegroundColor Yellow

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create iOS project in Xcode" -ForegroundColor White
Write-Host "2. Import HealthKitManager.swift into iOS project" -ForegroundColor White
Write-Host "3. Configure HealthKit entitlements and permissions" -ForegroundColor White
Write-Host "4. Test on physical device (HealthKit requires real device)" -ForegroundColor White
Write-Host "5. Deploy backend to cloud service" -ForegroundColor White
