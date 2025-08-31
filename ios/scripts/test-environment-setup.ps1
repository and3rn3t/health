#!/usr/bin/env pwsh
# 🔧 Test Environment Setup and Validation Script

param(
    [switch]$CheckDependencies,
    [switch]$SetupSimulators,
    [switch]$ValidateEnvironment,
    [switch]$CleanTestData,
    [switch]$All,
    [switch]$Verbose
)

Write-Host "🔧 Test Environment Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to check dependencies
function Test-Dependencies {
    Write-Host "🔍 Checking Dependencies..." -ForegroundColor Yellow

    $dependencies = @{
        "xcodebuild" = "Xcode Command Line Tools"
        "xcrun" = "Xcode Runtime"
        "instruments" = "Xcode Instruments"
        "simctl" = "iOS Simulator Control"
    }

    $missing = @()

    foreach ($dep in $dependencies.GetEnumerator()) {
        if (Test-Command $dep.Key) {
            Write-Host "  ✅ $($dep.Value)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($dep.Value)" -ForegroundColor Red
            $missing += $dep.Value
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ Missing dependencies:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
        Write-Host "💡 To install missing dependencies:" -ForegroundColor Yellow
        Write-Host "  xcode-select --install" -ForegroundColor Gray
        return $false
    }

    Write-Host "  ✅ All dependencies satisfied" -ForegroundColor Green
    return $true
}

# Function to setup simulators
function Set-Simulators {
    Write-Host "🔧 Setting up iOS Simulators..." -ForegroundColor Yellow

    try {
        # List available simulators
        $simulators = xcrun simctl list devices --json | ConvertFrom-Json

        # Find iPhone 15 simulator
        $iphone15 = $null
        foreach ($runtime in $simulators.devices.PSObject.Properties) {
            foreach ($device in $runtime.Value) {
                if ($device.name -eq "iPhone 15" -and $device.isAvailable) {
                    $iphone15 = $device
                    break
                }
            }
            if ($iphone15) { break }
        }

        if ($iphone15) {
            Write-Host "  ✅ iPhone 15 simulator found: $($iphone15.udid)" -ForegroundColor Green

            # Boot the simulator if not already booted
            if ($iphone15.state -ne "Booted") {
                Write-Host "  🚀 Booting iPhone 15 simulator..." -ForegroundColor Blue
                xcrun simctl boot $iphone15.udid
                Start-Sleep -Seconds 5
            }

            # Enable hardware keyboard
            xcrun simctl spawn $iphone15.udid defaults write com.apple.iphonesimulator ConnectHardwareKeyboard 0

            Write-Host "  ✅ iPhone 15 simulator ready" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ iPhone 15 simulator not found, will use default" -ForegroundColor Yellow
        }

        return $true
    } catch {
        Write-Host "  ❌ Failed to setup simulators: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to validate test environment
function Test-Environment {
    Write-Host "🔍 Validating Test Environment..." -ForegroundColor Yellow

    $allValid = $true

    # Check if services are running
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8789/health" -TimeoutSec 5
        Write-Host "  ✅ Worker service healthy" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Worker service not accessible: $($_.Exception.Message)" -ForegroundColor Red
        $allValid = $false
    }

    # Check WebSocket server
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("127.0.0.1", 3001)
        $tcpClient.Close()
        Write-Host "  ✅ WebSocket server accessible" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ WebSocket server not accessible: $($_.Exception.Message)" -ForegroundColor Red
        $allValid = $false
    }

    # Check Xcode project
    $projectPath = "$PSScriptRoot/../HealthKitBridge.xcodeproj"
    if (Test-Path $projectPath) {
        Write-Host "  ✅ Xcode project found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Xcode project not found at $projectPath" -ForegroundColor Red
        $allValid = $false
    }

    # Check test targets
    try {
        $buildSettings = xcodebuild -project "$projectPath" -list
        if ($buildSettings -match "HealthKitBridgeTests" -and $buildSettings -match "HealthKitBridgeUITests") {
            Write-Host "  ✅ Test targets configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Test targets not properly configured" -ForegroundColor Red
            $allValid = $false
        }
    } catch {
        Write-Host "  ❌ Failed to check test targets: $($_.Exception.Message)" -ForegroundColor Red
        $allValid = $false
    }

    # Check test schemes
    $schemesPath = "$PSScriptRoot/../HealthKitBridge.xcodeproj/xcshareddata/xcschemes"
    if (Test-Path $schemesPath) {
        $schemes = Get-ChildItem -Path $schemesPath -Filter "*.xcscheme"
        if ($schemes.Count -gt 0) {
            Write-Host "  ✅ Test schemes configured ($($schemes.Count) schemes)" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ No test schemes found" -ForegroundColor Yellow
        }
    }

    return $allValid
}

# Function to clean test data
function Clear-TestData {
    Write-Host "🧹 Cleaning Test Data..." -ForegroundColor Yellow

    try {
        # Clean build folder
        $buildPath = "$PSScriptRoot/../build"
        if (Test-Path $buildPath) {
            Remove-Item -Path $buildPath -Recurse -Force
            Write-Host "  ✅ Build folder cleaned" -ForegroundColor Green
        }

        # Clean derived data
        $derivedDataPath = "$HOME/Library/Developer/Xcode/DerivedData"
        if (Test-Path $derivedDataPath) {
            Get-ChildItem -Path $derivedDataPath -Filter "*HealthKitBridge*" | Remove-Item -Recurse -Force
            Write-Host "  ✅ Derived data cleaned" -ForegroundColor Green
        }

        # Clean test artifacts
        $testArtifactsPath = "$PSScriptRoot/../TestArtifacts"
        if (Test-Path $testArtifactsPath) {
            Remove-Item -Path $testArtifactsPath -Recurse -Force
            Write-Host "  ✅ Test artifacts cleaned" -ForegroundColor Green
        }

        # Reset iOS Simulator
        Write-Host "  🔄 Resetting iOS Simulator..." -ForegroundColor Blue
        xcrun simctl shutdown all
        xcrun simctl erase all

        Write-Host "  ✅ Test data cleanup complete" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ❌ Failed to clean test data: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
$success = $true

if ($All -or $CheckDependencies) {
    $success = $success -and (Test-Dependencies)
    Write-Host ""
}

if ($All -or $SetupSimulators) {
    $success = $success -and (Set-Simulators)
    Write-Host ""
}

if ($All -or $ValidateEnvironment) {
    $success = $success -and (Test-Environment)
    Write-Host ""
}

if ($CleanTestData) {
    $success = $success -and (Clear-TestData)
    Write-Host ""
}

if (-not ($CheckDependencies -or $SetupSimulators -or $ValidateEnvironment -or $CleanTestData -or $All)) {
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -CheckDependencies    Check if all required tools are installed" -ForegroundColor Gray
    Write-Host "  -SetupSimulators      Setup and configure iOS simulators" -ForegroundColor Gray
    Write-Host "  -ValidateEnvironment  Validate test environment is ready" -ForegroundColor Gray
    Write-Host "  -CleanTestData        Clean all test data and artifacts" -ForegroundColor Gray
    Write-Host "  -All                  Run all setup tasks" -ForegroundColor Gray
    Write-Host "  -Verbose              Enable verbose output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\test-environment-setup.ps1 -All" -ForegroundColor Gray
    Write-Host "  .\test-environment-setup.ps1 -ValidateEnvironment" -ForegroundColor Gray
    exit 0
}

# Final status
Write-Host "=========================" -ForegroundColor Cyan
if ($success) {
    Write-Host "✅ Test environment setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Run 'npm run ios:test' to execute all tests" -ForegroundColor Gray
    Write-Host "  2. Use 'npm run ios:test:unit' for unit tests only" -ForegroundColor Gray
    Write-Host "  3. Use 'npm run ios:test:ui' for UI tests only" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "❌ Test environment setup failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please address the issues above before running tests." -ForegroundColor Yellow
    exit 1
}
