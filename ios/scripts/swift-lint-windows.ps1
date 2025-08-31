# 🔍 Swift Linting and Validation Script for Windows
# Cross-platform Swift code quality checks that work without Xcode

param(
    [switch]$Fix = $false,
    [switch]$Detailed = $false,
    [string]$File = ""
)

Write-Host "🔍 Swift Code Quality & Linting" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Change to iOS directory if not already there
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
    Write-Host "📁 Working directory: $((Get-Location).Path)" -ForegroundColor Green
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

# Function to analyze Swift file
function Test-SwiftFile {
    param([string]$FilePath)

    $issues = @()
    $content = Get-Content $FilePath -Raw
    $fileName = Split-Path $FilePath -Leaf

    Write-Host "🔍 Analyzing: $fileName" -ForegroundColor Yellow

    # Basic syntax checks
    $openBraces = ($content | Select-String -Pattern '{' -AllMatches).Matches.Count
    $closeBraces = ($content | Select-String -Pattern '}' -AllMatches).Matches.Count

    if ($openBraces -ne $closeBraces) {
        $issues += "❌ Mismatched braces: $openBraces open, $closeBraces close"
    }

    # Import checks
    if ($content -notmatch 'import (Foundation|SwiftUI|HealthKit|UIKit)') {
        $issues += "⚠️  No standard imports found"
    }

    # SwiftUI/UIKit patterns
    if ($content -match '@StateObject' -and $content -notmatch 'ObservableObject') {
        $issues += "⚠️  @StateObject used without ObservableObject conformance"
    }

    if ($content -match '@Published' -and $content -notmatch 'ObservableObject') {
        $issues += "⚠️  @Published used without ObservableObject conformance"
    }

    # Async/await patterns
    if ($content -match '\bawait\b' -and $content -notmatch 'async func') {
        $issues += "⚠️  'await' used without 'async func'"
    }

    # Force unwrapping detection
    $forceUnwraps = ($content | Select-String -Pattern '!\s*[^=]' -AllMatches).Matches.Count
    if ($forceUnwraps -gt 5) {
        $issues += "⚠️  High number of force unwraps: $forceUnwraps (consider using optional binding)"
    }

    # HealthKit specific patterns
    if ($content -match 'HKHealthStore' -and $content -notmatch 'requestAuthorization') {
        $issues += "⚠️  HealthKit store used without authorization check"
    }

    # WebSocket patterns
    if ($content -match '\.send\(' -and $content -notmatch 'do\s*{.*catch') {
        $issues += "⚠️  WebSocket send without error handling"
    }

    # Code style checks
    if ($content -match '    ') {
        $tabSpaces = ($content | Select-String -Pattern '    ' -AllMatches).Matches.Count
        if ($tabSpaces -gt 0) {
            $issues += "💡 Consider using 2-space indentation instead of 4-space"
        }
    }

    # Line length check
    $longLines = ($content -split "`n" | Where-Object { $_.Length -gt 120 }).Count
    if ($longLines -gt 0) {
        $issues += "💡 $longLines lines exceed 120 characters"
    }

    # Print results
    if ($issues.Count -eq 0) {
        Write-Host "  ✅ No issues found" -ForegroundColor Green
    } else {
        foreach ($issue in $issues) {
            Write-Host "  $issue" -ForegroundColor $(if ($issue.StartsWith("❌")) { "Red" } else { "Yellow" })
        }
    }

    if ($Detailed) {
        Write-Host "  📊 Stats: $openBraces functions/classes, $forceUnwraps force unwraps, $longLines long lines" -ForegroundColor Cyan
    }

    Write-Host ""
    return $issues.Count
}

# Function to check project structure
function Test-ProjectStructure {
    Write-Host "🏗️  Project Structure Validation" -ForegroundColor Green
    Write-Host ""

    $requiredFiles = @(
        "HealthKitBridge/HealthKitBridgeApp.swift",
        "HealthKitBridge/ContentView.swift",
        "HealthKitBridge/HealthKitManager.swift",
        "HealthKitBridge/WebSocketManager.swift",
        "HealthKitBridge/ApiClient.swift",
        "HealthKitBridge/AppConfig.swift",
        "HealthKitBridge/Config.plist",
        "HealthKitBridge.xcodeproj/project.pbxproj"
    )

    $missingFiles = @()

    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file" -ForegroundColor Red
            $missingFiles += $file
        }
    }

    if ($missingFiles.Count -gt 0) {
        Write-Host ""
        Write-Host "🔧 Missing files need to be created:" -ForegroundColor Yellow
        foreach ($file in $missingFiles) {
            Write-Host "  - $file" -ForegroundColor White
        }
    }

    Write-Host ""
    return $missingFiles.Count
}

# Function to validate Config.plist
function Test-ConfigPlist {
    Write-Host "⚙️  Config.plist Validation" -ForegroundColor Green

    $configPath = "HealthKitBridge/Config.plist"
    if (Test-Path $configPath) {
        Write-Host "  ✅ Config.plist exists" -ForegroundColor Green

        $configContent = Get-Content $configPath -Raw
        $requiredKeys = @("API_BASE_URL", "WS_URL", "USER_ID")

        foreach ($key in $requiredKeys) {
            if ($configContent -match $key) {
                Write-Host "  ✅ $key found" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $key missing" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ❌ Config.plist missing" -ForegroundColor Red
        Write-Host "  💡 Create with keys: API_BASE_URL, WS_URL, USER_ID" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Main execution
$totalIssues = 0

# Check specific file or all Swift files
if ($File) {
    if (Test-Path $File) {
        $totalIssues = Test-SwiftFile $File
    } else {
        Write-Host "❌ File not found: $File" -ForegroundColor Red
        exit 1
    }
} else {
    # Find all Swift files
    $swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse | Where-Object { $_.Name -notmatch "\.fixed\.swift$" }

    if ($swiftFiles.Count -eq 0) {
        Write-Host "❌ No Swift files found in HealthKitBridge/" -ForegroundColor Red
        exit 1
    }

    Write-Host "📝 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green
    Write-Host ""

    foreach ($file in $swiftFiles) {
        if ($file.FullName -and (Test-Path $file.FullName)) {
            $totalIssues += Test-SwiftFile $file.FullName
        } else {
            Write-Host "⚠️  Skipping invalid file: $($file.Name)" -ForegroundColor Yellow
        }
    }    # Additional project checks
    $missingFiles = Test-ProjectStructure
    Test-ConfigPlist

    $totalIssues += $missingFiles
}

# Summary
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan

if ($totalIssues -eq 0) {
    Write-Host "🎉 All checks passed! Your Swift code looks good." -ForegroundColor Green
    Write-Host "🚀 Ready for Xcode build" -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $totalIssues issues total" -ForegroundColor Yellow
    Write-Host "🔧 Review the issues above before building in Xcode" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Fix any ❌ errors shown above" -ForegroundColor White
Write-Host "  2. Consider addressing ⚠️  warnings" -ForegroundColor White
Write-Host "  3. Run: ./Check-SwiftErrors.ps1 for detailed diagnostics" -ForegroundColor White
Write-Host "  4. Build in Xcode (⌘+B)" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Available tools:" -ForegroundColor Cyan
Write-Host "  - swift-lint-windows.ps1 -File 'filename.swift'  # Check specific file" -ForegroundColor White
Write-Host "  - swift-lint-windows.ps1 -Detailed              # Detailed analysis" -ForegroundColor White
Write-Host "  - swift-format-windows.ps1                      # Format Swift code" -ForegroundColor White

exit $totalIssues
