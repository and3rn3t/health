#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test WebSocket connection for VitalSense iOS app

.DESCRIPTION
    Comprehensive WebSocket connection testing tool that simulates the iOS app's connection
    to the production backend and tests various scenarios.

.PARAMETER BackendUrl
    The backend WebSocket URL to test (default: production backend)

.PARAMETER TestToken
    Test authentication token to use

.PARAMETER MockHealthData
    Send mock health data during the test

.PARAMETER Verbose
    Enable detailed output

.EXAMPLE
    .\test-websocket-connection.ps1

.EXAMPLE
    .\test-websocket-connection.ps1 -BackendUrl "wss://health.andernet.dev/ws" -MockHealthData -Verbose
#>

param(
    [string]$BackendUrl = "wss://health.andernet.dev/ws",
    [string]$TestToken = "test-ios-app-token",
    [switch]$MockHealthData,
    [switch]$Verbose
)

# Enable verbose output if requested
if ($Verbose) {
    $VerbosePreference = 'Continue'
}

Write-Host "🧪 VitalSense WebSocket Connection Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Test configuration
$testConfig = @{
    BackendUrl = $BackendUrl
    TestToken = $TestToken
    Timeout = 10
    MockHealthData = $MockHealthData
}

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Backend URL: $($testConfig.BackendUrl)" -ForegroundColor Gray
Write-Host "   Test Token: $($testConfig.TestToken)" -ForegroundColor Gray
Write-Host "   Timeout: $($testConfig.Timeout)s" -ForegroundColor Gray
Write-Host "   Mock Data: $($testConfig.MockHealthData)" -ForegroundColor Gray
Write-Host ""

# Function to test WebSocket connectivity
function Test-WebSocketConnection {
    param($Url, $Token, $TimeoutSeconds = 10)

    Write-Host "🔌 Testing WebSocket Connection..." -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray

    try {
        # Parse the URL to get components
        $uri = [System.Uri]::new($Url)
        $host = $uri.Host
        $port = if ($uri.Port -ne -1) { $uri.Port } else { if ($uri.Scheme -eq "wss") { 443 } else { 80 } }

        Write-Host "   Host: $host" -ForegroundColor Gray
        Write-Host "   Port: $port" -ForegroundColor Gray

        # Test basic connectivity
        Write-Host "🌐 Testing basic connectivity..." -ForegroundColor Cyan
        $tcpTest = Test-NetConnection -ComputerName $host -Port $port -WarningAction SilentlyContinue

        if ($tcpTest.TcpTestSucceeded) {
            Write-Host "   ✅ TCP connection successful" -ForegroundColor Green
        } else {
            Write-Host "   ❌ TCP connection failed" -ForegroundColor Red
            return $false
        }

        # Test HTTPS/WSS endpoint if it's a secure connection
        if ($uri.Scheme -eq "wss") {
            Write-Host "🔒 Testing HTTPS endpoint..." -ForegroundColor Cyan
            $httpsUrl = $Url -replace "wss://", "https://" -replace "/ws", "/health"

            try {
                $response = Invoke-RestMethod -Uri $httpsUrl -TimeoutSec $TimeoutSeconds -ErrorAction Stop
                Write-Host "   ✅ HTTPS endpoint accessible" -ForegroundColor Green
                Write-Host "   📊 Backend status: $($response.status)" -ForegroundColor Gray
            } catch {
                Write-Host "   ⚠️  HTTPS endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }

        return $true

    } catch {
        Write-Host "   ❌ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to simulate iOS app WebSocket behavior
function Simulate-iOSWebSocketBehavior {
    param($Url, $Token)

    Write-Host "📱 Simulating iOS App WebSocket Behavior..." -ForegroundColor Yellow
    Write-Host ""

    # Mock health data that the iOS app would send
    $mockHealthData = @(
        @{
            type = "heart_rate"
            value = 72.5
            unit = "bpm"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            deviceId = "test-ios-device"
            userId = "production_user"
        },
        @{
            type = "step_count"
            value = 1234
            unit = "steps"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            deviceId = "test-ios-device"
            userId = "production_user"
        },
        @{
            type = "distance_walking_running"
            value = 2.3
            unit = "km"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            deviceId = "test-ios-device"
            userId = "production_user"
        }
    )

    Write-Host "💓 Mock Health Data Prepared:" -ForegroundColor Cyan
    foreach ($data in $mockHealthData) {
        Write-Host "   📊 $($data.type): $($data.value) $($data.unit)" -ForegroundColor Gray
    }
    Write-Host ""

    # WebSocket connection simulation using .NET WebSocket
    Write-Host "🔌 Attempting WebSocket connection (simulation)..." -ForegroundColor Cyan

    # Since PowerShell doesn't have native WebSocket support, we'll use curl for testing
    $curlTest = Test-WebSocketWithCurl -Url $Url -Token $Token

    return $curlTest
}

# Function to test WebSocket using curl (if available)
function Test-WebSocketWithCurl {
    param($Url, $Token)

    # Check if curl is available
    $curlPath = Get-Command "curl.exe" -ErrorAction SilentlyContinue
    if (-not $curlPath) {
        Write-Host "   ⚠️  curl.exe not found - skipping WebSocket test" -ForegroundColor Yellow
        return $false
    }

    Write-Host "🌐 Testing WebSocket with curl..." -ForegroundColor Cyan

    # Create a simple WebSocket test
    $urlWithToken = "$Url?token=$Token"

    try {
        # Use curl to test WebSocket upgrade
        $result = & curl.exe -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" $urlWithToken 2>&1

        if ($LASTEXITCODE -eq 0 -and $result -match "101") {
            Write-Host "   ✅ WebSocket upgrade successful" -ForegroundColor Green
            return $true
        } else {
            Write-Host "   ⚠️  WebSocket upgrade response: $result" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "   ❌ WebSocket test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to run comprehensive tests
function Run-ComprehensiveTest {
    param($Config)

    Write-Host "🔬 Running Comprehensive WebSocket Tests..." -ForegroundColor Magenta
    Write-Host ""

    $results = @{
        ConnectivityTest = $false
        WebSocketTest = $false
        OverallStatus = "Failed"
    }

    # Test 1: Basic connectivity
    Write-Host "📋 Test 1: Basic Connectivity" -ForegroundColor Yellow
    $results.ConnectivityTest = Test-WebSocketConnection -Url $Config.BackendUrl -Token $Config.TestToken -TimeoutSeconds $Config.Timeout
    Write-Host ""

    # Test 2: WebSocket behavior simulation
    Write-Host "📋 Test 2: WebSocket Behavior Simulation" -ForegroundColor Yellow
    if ($results.ConnectivityTest) {
        $results.WebSocketTest = Simulate-iOSWebSocketBehavior -Url $Config.BackendUrl -Token $Config.TestToken
    } else {
        Write-Host "   ⏭️  Skipping WebSocket test due to connectivity failure" -ForegroundColor Yellow
    }
    Write-Host ""

    # Overall assessment
    if ($results.ConnectivityTest -and $results.WebSocketTest) {
        $results.OverallStatus = "Excellent"
    } elseif ($results.ConnectivityTest) {
        $results.OverallStatus = "Good"
    } else {
        $results.OverallStatus = "Needs Attention"
    }

    return $results
}

# Function to show iOS app connection guidance
function Show-iOSConnectionGuidance {
    Write-Host "📱 iOS App Connection Guidance" -ForegroundColor Magenta
    Write-Host "==============================" -ForegroundColor Magenta
    Write-Host ""

    Write-Host "🎯 To test the WebSocket connection in the iOS app:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 📱 Open Xcode and load the project:" -ForegroundColor Yellow
    Write-Host "   cd ios/" -ForegroundColor Gray
    Write-Host "   open HealthKitBridge.xcodeproj" -ForegroundColor Gray
    Write-Host ""

    Write-Host "2. 🏃‍♂️ Build and run in simulator or device:" -ForegroundColor Yellow
    Write-Host "   ⌘+R in Xcode" -ForegroundColor Gray
    Write-Host ""

    Write-Host "3. 👀 Watch the connection status in the app:" -ForegroundColor Yellow
    Write-Host "   • Connection indicator (green = connected)" -ForegroundColor Gray
    Write-Host "   • Real-time data transmission rates" -ForegroundColor Gray
    Write-Host "   • Debug information panel" -ForegroundColor Gray
    Write-Host ""

    Write-Host "4. 🧪 Use the app's built-in test features:" -ForegroundColor Yellow
    Write-Host "   • Send test data button" -ForegroundColor Gray
    Write-Host "   • Refresh data button" -ForegroundColor Gray
    Write-Host "   • Connection quality monitoring" -ForegroundColor Gray
    Write-Host ""

    Write-Host "5. 📊 Monitor debug output in Xcode console:" -ForegroundColor Yellow
    Write-Host "   Look for WebSocket connection logs like:" -ForegroundColor Gray
    Write-Host "   🔌 Connecting to WebSocket..." -ForegroundColor Gray
    Write-Host "   ✅ WebSocket connection opened" -ForegroundColor Gray
    Write-Host "   📤 Sending health data..." -ForegroundColor Gray
    Write-Host ""
}

# Main execution
try {
    # Run the comprehensive test
    $testResults = Run-ComprehensiveTest -Config $testConfig

    # Show results summary
    Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Magenta
    Write-Host "========================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "🌐 Connectivity Test: $(if($testResults.ConnectivityTest){'✅ PASSED'}else{'❌ FAILED'})" -ForegroundColor $(if($testResults.ConnectivityTest){'Green'}else{'Red'})
    Write-Host "🔌 WebSocket Test: $(if($testResults.WebSocketTest){'✅ PASSED'}else{'❌ FAILED'})" -ForegroundColor $(if($testResults.WebSocketTest){'Green'}else{'Red'})
    Write-Host "🎯 Overall Status: $($testResults.OverallStatus)" -ForegroundColor $(if($testResults.OverallStatus -eq 'Excellent'){'Green'}elseif($testResults.OverallStatus -eq 'Good'){'Yellow'}else{'Red'})
    Write-Host ""

    # Show guidance for iOS app testing
    Show-iOSConnectionGuidance

    Write-Host "✨ Test completed!" -ForegroundColor Green

} catch {
    Write-Host "💥 Test failed with error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
}
