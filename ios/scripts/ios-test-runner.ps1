#!/usr/bin/env pwsh
# 🧪 iOS Test Runner Script

param(
    [switch]$Unit,
    [switch]$UI,
    [switch]$All,
    [switch]$Coverage,
    [switch]$Performance,
    [string]$TestCase = "",
    [switch]$Verbose,
    [switch]$Device,
    [string]$Simulator = "iPhone 15"
)

Write-Host "🧪 iOS Test Runner" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

$script:testResults = @()
$script:totalTests = 0
$script:passedTests = 0
$script:failedTests = 0

function Add-TestResult {
    param($TestSuite, $Status, $Details = "")
    $script:testResults += @{
        TestSuite = $TestSuite
        Status    = $Status
        Details   = $Details
        Timestamp = Get-Date
    }

    $script:totalTests++
    if ($Status -eq "PASS") {
        $script:passedTests++
    }
    else {
        $script:failedTests++
    }
}

function Test-XcodeBuildTools {
    Write-Host "🔍 Checking Xcode build tools..." -ForegroundColor Yellow

    try {
        $xcodeVersion = & xcodebuild -version 2>&1 | Select-Object -First 1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Xcode available: $xcodeVersion" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "   ❌ Xcode not available" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "   ❌ Xcode build tools not found" -ForegroundColor Red
        return $false
    }
}

function Get-AvailableSimulators {
    Write-Host "📱 Getting available simulators..." -ForegroundColor Yellow

    try {
        $simulators = & xcrun simctl list devices available | Where-Object { $_ -match "iPhone|iPad" }
        return $simulators
    }
    catch {
        Write-Host "   ⚠️  Could not list simulators" -ForegroundColor Yellow
        return @()
    }
}

function Initialize-TestEnvironment {
    Write-Host "🔧 Initializing test environment..." -ForegroundColor Yellow

    # Run environment setup
    $setupScript = Join-Path $PSScriptRoot "test-environment-setup.ps1"
    if (Test-Path $setupScript) {
        & $setupScript -ValidateEnvironment -Verbose:$Verbose
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Environment validation failed" -ForegroundColor Red
            return $false
        }
    }

    return $true
}

function Run-UnitTests {
    Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
    Write-Host ""

    $testScheme = "HealthKitBridge-UnitTests"
    $destination = if ($Device) { "generic/platform=iOS" } else { "platform=iOS Simulator,name=$Simulator" }

    $testCommand = @(
        "xcodebuild",
        "test",
        "-project", "ios/HealthKitBridge.xcodeproj",
        "-scheme", $testScheme,
        "-destination", $destination,
        "-testPlan", "HealthKitBridge.xctestplan",
        "-only-testing", "HealthKitBridgeTests"
    )

    if ($Coverage) {
        $testCommand += @("-enableCodeCoverage", "YES")
    }

    if ($Verbose) {
        $testCommand += @("-verbose")
    }

    if ($TestCase) {
        $testCommand += @("-only-testing", "HealthKitBridgeTests/$TestCase")
    }

    try {
        Write-Host "Running: $($testCommand -join ' ')" -ForegroundColor Gray
        & $testCommand[0] $testCommand[1..($testCommand.Length - 1)]

        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Unit tests passed" -ForegroundColor Green
            Add-TestResult "Unit Tests" "PASS" "All unit tests passed"
        }
        else {
            Write-Host "   ❌ Unit tests failed" -ForegroundColor Red
            Add-TestResult "Unit Tests" "FAIL" "Some unit tests failed"
        }
    }
    catch {
        Write-Host "   ❌ Unit test execution failed: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Unit Tests" "FAIL" $_.Exception.Message
    }
}

function Run-UITests {
    Write-Host "🖥️  Running UI Tests..." -ForegroundColor Cyan
    Write-Host ""

    $testScheme = "HealthKitBridge-UITests"
    $destination = if ($Device) { "generic/platform=iOS" } else { "platform=iOS Simulator,name=$Simulator" }

    $testCommand = @(
        "xcodebuild",
        "test",
        "-project", "ios/HealthKitBridge.xcodeproj",
        "-scheme", $testScheme,
        "-destination", $destination,
        "-testPlan", "UITests"
    )

    if ($Verbose) {
        $testCommand += @("-verbose")
    }

    if ($TestCase) {
        $testCommand += @("-only-testing", "HealthKitBridgeUITests/$TestCase")
    }

    try {
        Write-Host "Running: $($testCommand -join ' ')" -ForegroundColor Gray
        & $testCommand[0] $testCommand[1..($testCommand.Length - 1)]

        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ UI tests passed" -ForegroundColor Green
            Add-TestResult "UI Tests" "PASS" "All UI tests passed"
        }
        else {
            Write-Host "   ❌ UI tests failed" -ForegroundColor Red
            Add-TestResult "UI Tests" "FAIL" "Some UI tests failed"
        }
    }
    catch {
        Write-Host "   ❌ UI test execution failed: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "UI Tests" "FAIL" $_.Exception.Message
    }
}

function Run-PerformanceTests {
    Write-Host "⚡ Running Performance Tests..." -ForegroundColor Cyan
    Write-Host ""

    $testScheme = "HealthKitBridge"
    $destination = if ($Device) { "generic/platform=iOS" } else { "platform=iOS Simulator,name=$Simulator" }

    $testCommand = @(
        "xcodebuild",
        "test",
        "-project", "ios/HealthKitBridge.xcodeproj",
        "-scheme", $testScheme,
        "-destination", $destination,
        "-only-testing", "HealthKitBridgeTests/PerformanceMonitorTests"
    )

    try {
        Write-Host "Running: $($testCommand -join ' ')" -ForegroundColor Gray
        & $testCommand[0] $testCommand[1..($testCommand.Length - 1)]

        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Performance tests passed" -ForegroundColor Green
            Add-TestResult "Performance Tests" "PASS" "All performance tests passed"
        }
        else {
            Write-Host "   ❌ Performance tests failed" -ForegroundColor Red
            Add-TestResult "Performance Tests" "FAIL" "Some performance tests failed"
        }
    }
    catch {
        Write-Host "   ❌ Performance test execution failed: $($_.Exception.Message)" -ForegroundColor Red
        Add-TestResult "Performance Tests" "FAIL" $_.Exception.Message
    }
}

function Generate-TestReport {
    Write-Host ""
    Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    Write-Host ""

    foreach ($result in $script:testResults) {
        $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
        $icon = if ($result.Status -eq "PASS") { "✅" } else { "❌" }

        Write-Host "$icon $($result.TestSuite): $($result.Status)" -ForegroundColor $color
        if ($result.Details) {
            Write-Host "   $($result.Details)" -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "Results: $script:passedTests passed, $script:failedTests failed, $script:totalTests total" -ForegroundColor White

    if ($script:failedTests -eq 0) {
        Write-Host "🎉 All tests passed!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "⚠️  Some tests failed. Review the results above." -ForegroundColor Yellow
        return $false
    }
}

function Generate-CoverageReport {
    if ($Coverage) {
        Write-Host ""
        Write-Host "📈 Generating Code Coverage Report..." -ForegroundColor Cyan

        try {
            # Generate coverage report
            $coverageCommand = @(
                "xcrun", "xccov", "view",
                "--report",
                "--json",
                "build/Logs/Test/*.xcresult"
            )

            & $coverageCommand[0] $coverageCommand[1..($coverageCommand.Length - 1)] | Out-File -FilePath "ios/coverage-report.json"

            Write-Host "   ✅ Coverage report generated: ios/coverage-report.json" -ForegroundColor Green
        }
        catch {
            Write-Host "   ⚠️  Could not generate coverage report: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Main execution
Write-Host "Environment: iOS Testing on $(if ($Device) { 'Device' } else { $Simulator })" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'MM/dd/yyyy HH:mm:ss')" -ForegroundColor White
Write-Host ""

# Check prerequisites
if (-not (Test-XcodeBuildTools)) {
    Write-Host "❌ Xcode build tools are required for iOS testing" -ForegroundColor Red
    exit 1
}

# Initialize test environment
if (-not (Initialize-TestEnvironment)) {
    Write-Host "❌ Test environment initialization failed" -ForegroundColor Red
    exit 1
}

# Show available simulators if not using device
if (-not $Device) {
    $simulators = Get-AvailableSimulators
    if ($simulators.Count -gt 0) {
        Write-Host "📱 Available simulators:" -ForegroundColor Yellow
        $simulators | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        Write-Host ""
    }
}

# Run tests based on parameters
if ($All -or (-not $Unit -and -not $UI -and -not $Performance)) {
    # Run all tests if no specific test type specified
    Run-UnitTests
    Run-UITests
    if ($Performance) {
        Run-PerformanceTests
    }
}
else {
    if ($Unit) {
        Run-UnitTests
    }

    if ($UI) {
        Run-UITests
    }

    if ($Performance) {
        Run-PerformanceTests
    }
}

# Generate reports
Generate-CoverageReport
$success = Generate-TestReport

# Exit with appropriate code
exit $(if ($success) { 0 } else { 1 })
