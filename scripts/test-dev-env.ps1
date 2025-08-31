#!/usr/bin/env pwsh
# 🧪 Comprehensive Development Testing Script

param(
    [switch]$Quick,
    [switch]$Full,
    [switch]$iOS,
    [switch]$API,
    [switch]$WebSocket
)

Write-Host "🧪 Health App Development Testing" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$script:testResults = @()

function Add-TestResult {
    param($Name, $Status, $Details = "")
    $script:testResults += @{
        Name = $Name
        Status = $Status
        Details = $Details
        Timestamp = Get-Date
    }
}

function Test-Worker {
    Write-Host "🔍 Testing Cloudflare Worker..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8789/health" -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "   ✅ Worker Health: OK" -ForegroundColor Green
            Add-TestResult "Worker Health" "PASS" $response.environment
        } else {
            Write-Host "   ❌ Worker Health: Unhealthy" -ForegroundColor Red
            Add-TestResult "Worker Health" "FAIL" "Unhealthy response"
        }
    } catch {
        Write-Host "   ❌ Worker Health: No Response" -ForegroundColor Red
        Add-TestResult "Worker Health" "FAIL" $_.Exception.Message
    }

    # Test API endpoint
    try {
        $authResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8789/api/device/auth" -Method POST -Body '{"userId":"test-user"}' -ContentType "application/json" -TimeoutSec 5
        if ($authResponse.ok) {
            Write-Host "   ✅ API Auth: OK" -ForegroundColor Green
            Add-TestResult "API Authentication" "PASS" "Token received"
        } else {
            Write-Host "   ❌ API Auth: Failed" -ForegroundColor Red
            Add-TestResult "API Authentication" "FAIL" "No token"
        }
    } catch {
        Write-Host "   ❌ API Auth: Error" -ForegroundColor Red
        Add-TestResult "API Authentication" "FAIL" $_.Exception.Message
    }
}

function Test-WebSocketServer {
    Write-Host "🔍 Testing WebSocket Server..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/status" -TimeoutSec 5
        Write-Host "   ✅ WebSocket Server: Running" -ForegroundColor Green
        Add-TestResult "WebSocket Server" "PASS" "Server responsive"
    } catch {
        Write-Host "   ❌ WebSocket Server: Not responding" -ForegroundColor Red
        Add-TestResult "WebSocket Server" "FAIL" $_.Exception.Message
    }
}

function Test-BuildSystem {
    Write-Host "🔍 Testing Build System..." -ForegroundColor Yellow

    # Test worker build
    $workerBuild = & npm run build:worker 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Worker Build: OK" -ForegroundColor Green
        Add-TestResult "Worker Build" "PASS" "Compiled successfully"
    } else {
        Write-Host "   ❌ Worker Build: Failed" -ForegroundColor Red
        Add-TestResult "Worker Build" "FAIL" "Compilation errors"
    }

    # Test app build
    $appBuild = & npm run build:app 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ App Build: OK" -ForegroundColor Green
        Add-TestResult "App Build" "PASS" "Compiled successfully"
    } else {
        Write-Host "   ❌ App Build: Failed" -ForegroundColor Red
        Add-TestResult "App Build" "FAIL" "Compilation errors"
    }
}

function Test-iOSProject {
    Write-Host "🔍 Testing iOS Project..." -ForegroundColor Yellow

    $requiredFiles = @(
        "ios/HealthKitBridge.xcodeproj/project.pbxproj",
        "ios/HealthKitBridge/HealthKitBridgeApp.swift",
        "ios/HealthKitBridge/HealthKitManager.swift",
        "ios/HealthKitBridge/Config.plist"
    )

    $allGood = $true
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "   ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $file (missing)" -ForegroundColor Red
            $allGood = $false
        }
    }

    if ($allGood) {
        Add-TestResult "iOS Project Files" "PASS" "All required files present"
    } else {
        Add-TestResult "iOS Project Files" "FAIL" "Missing required files"
    }

    # Test Swift lint if available
    try {
        & npm run ios:lint 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Swift Lint: OK" -ForegroundColor Green
            Add-TestResult "Swift Lint" "PASS" "No lint errors"
        } else {
            Write-Host "   ⚠️  Swift Lint: Issues found" -ForegroundColor Yellow
            Add-TestResult "Swift Lint" "WARN" "Lint issues detected"
        }
    } catch {
        Write-Host "   ⚠️  Swift Lint: Not available" -ForegroundColor Yellow
        Add-TestResult "Swift Lint" "SKIP" "Tool not available"
    }
}

function Test-Security {
    Write-Host "🔍 Testing Security..." -ForegroundColor Yellow

    # Test CORS
    try {
        $headers = @{
            "Origin" = "http://localhost:5173"
        }
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8789/health" -Headers $headers -UseBasicParsing
        if ($response.Headers["Access-Control-Allow-Origin"]) {
            Write-Host "   ✅ CORS: Configured" -ForegroundColor Green
            Add-TestResult "CORS Policy" "PASS" "Headers present"
        } else {
            Write-Host "   ⚠️  CORS: Not configured" -ForegroundColor Yellow
            Add-TestResult "CORS Policy" "WARN" "No CORS headers"
        }
    } catch {
        Write-Host "   ❌ CORS: Test failed" -ForegroundColor Red
        Add-TestResult "CORS Policy" "FAIL" $_.Exception.Message
    }
}

function Show-TestSummary {
    Write-Host ""
    Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    Write-Host ""

    $passed = ($script:testResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failed = ($script:testResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $warned = ($script:testResults | Where-Object { $_.Status -eq "WARN" }).Count
    $skipped = ($script:testResults | Where-Object { $_.Status -eq "SKIP" }).Count

    foreach ($result in $script:testResults) {
        $color = switch ($result.Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "WARN" { "Yellow" }
            "SKIP" { "Gray" }
        }
        $icon = switch ($result.Status) {
            "PASS" { "✅" }
            "FAIL" { "❌" }
            "WARN" { "⚠️ " }
            "SKIP" { "⏭️ " }
        }
        Write-Host "$icon $($result.Name): $($result.Status)" -ForegroundColor $color
        if ($result.Details) {
            Write-Host "   $($result.Details)" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "Results: $passed passed, $failed failed, $warned warnings, $skipped skipped" -ForegroundColor White

    if ($failed -eq 0) {
        Write-Host "🎉 All critical tests passed! Ready for development testing." -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️  Some tests failed. Review issues before deployment." -ForegroundColor Yellow
        return $false
    }
}

# Main execution
if ($Quick -or (-not $Full -and -not $iOS -and -not $API -and -not $WebSocket)) {
    Test-Worker
    Test-WebSocketServer
} elseif ($Full) {
    Test-Worker
    Test-WebSocketServer
    Test-BuildSystem
    Test-iOSProject
    Test-Security
} else {
    if ($API) { Test-Worker }
    if ($WebSocket) { Test-WebSocketServer }
    if ($iOS) { Test-iOSProject }
}

$success = Show-TestSummary
exit $(if ($success) { 0 } else { 1 })
