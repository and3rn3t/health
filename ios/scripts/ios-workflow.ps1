# 🎯 iOS Development Workflow Automation
# Complete iOS development workflow automation for Windows

param(
    [switch]$FullCheck = $false,
    [switch]$QuickCheck = $false,
    [switch]$FixIssues = $false,
    [switch]$PrepareForBuild = $false,
    [string]$ReportFormat = "console" # console, json, html
)

Write-Host "🎯 iOS Development Workflow Automation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

if (-not ($FullCheck -or $QuickCheck -or $FixIssues -or $PrepareForBuild)) {
    Write-Host "🚀 Available Workflows:" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 QUICK WORKFLOWS:" -ForegroundColor Yellow
    Write-Host "   -QuickCheck        # Fast validation (2-3 min)" -ForegroundColor White
    Write-Host "   -FixIssues         # Auto-fix common issues" -ForegroundColor White
    Write-Host "   -PrepareForBuild   # Complete pre-build validation" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 COMPREHENSIVE ANALYSIS:" -ForegroundColor Yellow
    Write-Host "   -FullCheck         # Complete analysis (5-10 min)" -ForegroundColor White
    Write-Host ""
    Write-Host "📄 REPORTING OPTIONS:" -ForegroundColor Yellow
    Write-Host "   -ReportFormat console|json|html" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 EXAMPLES:" -ForegroundColor Cyan
    Write-Host "   # Quick pre-commit check" -ForegroundColor Gray
    Write-Host "   .\ios-workflow.ps1 -QuickCheck" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Complete analysis with HTML report" -ForegroundColor Gray
    Write-Host "   .\ios-workflow.ps1 -FullCheck -ReportFormat html" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Auto-fix and prepare for build" -ForegroundColor Gray
    Write-Host "   .\ios-workflow.ps1 -FixIssues -PrepareForBuild" -ForegroundColor Gray
    exit 0
}

# Change to iOS directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

$workflow = @{
    StartTime = Get-Date
    Results = @{}
    Issues = @{
        Critical = @()
        Warning = @()
        Info = @()
    }
    FixesApplied = @()
}

# Function to run script and capture results
function Invoke-ScriptWithCapture {
    param(
        [string]$ScriptPath,
        [string]$Arguments = "",
        [string]$Name
    )

    Write-Host "🔄 Running: $Name" -ForegroundColor Yellow
    $startTime = Get-Date

    try {
        if ($Arguments) {
            $result = & "pwsh" "-NoProfile" "-File" $ScriptPath $Arguments.Split(' ') 2>&1
        } else {
            $result = & "pwsh" "-NoProfile" "-File" $ScriptPath 2>&1
        }

        $duration = ((Get-Date) - $startTime).TotalSeconds
        $exitCode = $LASTEXITCODE

        $workflow.Results[$Name] = @{
            Duration = [math]::Round($duration, 2)
            ExitCode = $exitCode
            Output = $result
            Status = if ($exitCode -eq 0) { "Success" } else { "Failed" }
        }

        Write-Host "   ✅ Completed in $([math]::Round($duration, 1))s" -ForegroundColor Green
        return $true
    }
    catch {
        $workflow.Results[$Name] = @{
            Duration = ((Get-Date) - $startTime).TotalSeconds
            ExitCode = 1
            Output = $_.Exception.Message
            Status = "Error"
        }
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Quick Check Workflow
if ($QuickCheck -or $PrepareForBuild) {
    Write-Host "🚀 QUICK CHECK WORKFLOW" -ForegroundColor Green
    Write-Host "=======================" -ForegroundColor Green
    Write-Host ""

    # 1. Swift Linting
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-lint-windows.ps1" -Name "Swift Linting"

    # 2. Build Simulation
    Invoke-ScriptWithCapture -ScriptPath "scripts/ios-build-simulator.ps1" -Name "Build Simulation"

    # 3. Basic Error Check
    Invoke-ScriptWithCapture -ScriptPath "HealthKitBridge/scripts/Check-SwiftErrors.ps1" -Name "Swift Error Check"
}

# Full Check Workflow
if ($FullCheck) {
    Write-Host "🔍 FULL ANALYSIS WORKFLOW" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host ""

    # 1. Swift Linting (Detailed)
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-lint-windows.ps1" -Arguments "-Detailed" -Name "Swift Linting (Detailed)"

    # 2. Build Simulation (Verbose)
    Invoke-ScriptWithCapture -ScriptPath "scripts/ios-build-simulator.ps1" -Arguments "-Verbose" -Name "Build Simulation (Verbose)"

    # 3. Dependency Analysis
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-dependency-analyzer.ps1" -Arguments "-CheckCircular" -Name "Dependency Analysis"

    # 4. Performance Analysis
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-performance-analyzer.ps1" -Arguments "-Detailed" -Name "Performance Analysis"

    # 5. Error Check
    Invoke-ScriptWithCapture -ScriptPath "HealthKitBridge/scripts/Check-SwiftErrors.ps1" -Name "Swift Error Check"
}

# Auto-Fix Issues
if ($FixIssues) {
    Write-Host "🔧 AUTO-FIX WORKFLOW" -ForegroundColor Green
    Write-Host "====================" -ForegroundColor Green
    Write-Host ""

    # 1. Format Swift Code
    Write-Host "🎨 Formatting Swift code..." -ForegroundColor Yellow
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-format-windows.ps1" -Name "Swift Formatting"

    if ($workflow.Results["Swift Formatting"].Status -eq "Success") {
        $workflow.FixesApplied += "Swift code formatting applied"
    }

    # 2. Add common missing imports (basic fix)
    Write-Host "📦 Checking for missing imports..." -ForegroundColor Yellow
    $swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse
    $importsFixed = 0

    foreach ($file in $swiftFiles) {
        if ($file.FullName) {
            $content = Get-Content $file.FullName -Raw
            $originalContent = $content

            # Add SwiftUI import if using SwiftUI features
            if ($content -match "@Published|@StateObject|@ObservedObject|@State|View\s*\{" -and $content -notmatch "import SwiftUI") {
                if ($content -match "import Foundation") {
                    $content = $content -replace "(import Foundation)", "import Foundation`nimport SwiftUI"
                } else {
                    $content = "import Foundation`nimport SwiftUI`n`n" + $content
                }
                $importsFixed++
            }

            # Add HealthKit import if using HealthKit
            if ($content -match "HKHealthStore|HKQuantity|HKSample" -and $content -notmatch "import HealthKit") {
                if ($content -match "import Foundation") {
                    $content = $content -replace "(import Foundation)", "import Foundation`nimport HealthKit"
                } else {
                    $content = "import Foundation`nimport HealthKit`n`n" + $content
                }
                $importsFixed++
            }

            if ($content -ne $originalContent) {
                Set-Content $file.FullName -Value $content -Encoding UTF8
                Write-Host "   ✅ Fixed imports in $($file.Name)" -ForegroundColor Green
            }
        }
    }

    if ($importsFixed -gt 0) {
        $workflow.FixesApplied += "Added $importsFixed missing import statements"
    }
}

# Prepare for Build
if ($PrepareForBuild) {
    Write-Host ""
    Write-Host "🏗️  PREPARE FOR BUILD" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    Write-Host ""

    # Final validation
    Invoke-ScriptWithCapture -ScriptPath "scripts/swift-lint-windows.ps1" -Name "Final Swift Validation"

    $buildReady = $true
    foreach ($result in $workflow.Results.Values) {
        if ($result.Status -ne "Success") {
            $buildReady = $false
            break
        }
    }

    Write-Host ""
    if ($buildReady) {
        Write-Host "🎉 BUILD READINESS: READY" -ForegroundColor Green
        Write-Host "✅ All checks passed - project ready for Xcode build" -ForegroundColor Green
    } else {
        Write-Host "⚠️  BUILD READINESS: NOT READY" -ForegroundColor Red
        Write-Host "❌ Please fix issues before building in Xcode" -ForegroundColor Red
    }
}

# Generate Summary Report
$duration = ((Get-Date) - $workflow.StartTime).TotalMinutes
$successCount = ($workflow.Results.Values | Where-Object { $_.Status -eq "Success" }).Count
$totalTests = $workflow.Results.Count

Write-Host ""
Write-Host "📊 WORKFLOW SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Total Duration: $([math]::Round($duration, 1)) minutes" -ForegroundColor White
Write-Host "Tests Run: $totalTests" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } else { "Yellow" })
Write-Host "Failed: $($totalTests - $successCount)" -ForegroundColor $(if ($successCount -eq $totalTests) { "Green" } else { "Red" })

if ($workflow.FixesApplied.Count -gt 0) {
    Write-Host ""
    Write-Host "🔧 Fixes Applied:" -ForegroundColor Green
    foreach ($fix in $workflow.FixesApplied) {
        Write-Host "   ✅ $fix" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 Test Results:" -ForegroundColor White
foreach ($test in $workflow.Results.GetEnumerator()) {
    $status = $test.Value.Status
    $icon = if ($status -eq "Success") { "✅" } elseif ($status -eq "Failed") { "❌" } else { "⚠️" }
    $color = if ($status -eq "Success") { "Green" } elseif ($status -eq "Failed") { "Red" } else { "Yellow" }
    Write-Host "   $icon $($test.Key): $status ($($test.Value.Duration)s)" -ForegroundColor $color
}

# Export Report
if ($ReportFormat -ne "console") {
    $reportData = @{
        workflow = @{
            startTime = $workflow.StartTime
            duration = $duration
            type = if ($FullCheck) { "Full Analysis" } elseif ($QuickCheck) { "Quick Check" } elseif ($PrepareForBuild) { "Build Preparation" } else { "Custom" }
        }
        summary = @{
            totalTests = $totalTests
            successful = $successCount
            failed = $totalTests - $successCount
            fixesApplied = $workflow.FixesApplied.Count
        }
        results = $workflow.Results
        fixes = $workflow.FixesApplied
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

    switch ($ReportFormat.ToLower()) {
        "json" {
            $jsonPath = "ios-workflow-report-$timestamp.json"
            $reportData | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
            Write-Host ""
            Write-Host "📄 JSON report exported: $jsonPath" -ForegroundColor Green
        }
        "html" {
            $htmlPath = "ios-workflow-report-$timestamp.html"
            $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>iOS Development Workflow Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
        .success { color: #059669; } .error { color: #dc2626; } .warning { color: #d97706; }
        .metric { display: inline-block; margin: 15px; padding: 15px 20px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #64748b; }
        .metric.success { border-left-color: #10b981; } .metric.error { border-left-color: #ef4444; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 4px solid #e5e7eb; }
        .test-result.success { background: #f0fdf4; border-left-color: #10b981; }
        .test-result.error { background: #fef2f2; border-left-color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🎯 iOS Development Workflow Report</h1>
        <p><strong>Generated:</strong> $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
        <p><strong>Workflow Type:</strong> $($reportData.workflow.type)</p>
        <p><strong>Duration:</strong> $([math]::Round($duration, 1)) minutes</p>

        <div style="margin: 30px 0;">
            <div class="metric $(if ($successCount -eq $totalTests) { 'success' } else { 'error' })">
                <strong>Tests:</strong> $successCount/$totalTests passed
            </div>
            <div class="metric">
                <strong>Fixes Applied:</strong> $($workflow.FixesApplied.Count)
            </div>
            <div class="metric">
                <strong>Duration:</strong> $([math]::Round($duration, 1))m
            </div>
        </div>

        <h2>Test Results</h2>
        $(foreach ($test in $workflow.Results.GetEnumerator()) {
            $cssClass = if ($test.Value.Status -eq "Success") { "success" } else { "error" }
            "<div class='test-result $cssClass'>" +
            "<strong>$($test.Key):</strong> $($test.Value.Status) " +
            "<span style='float: right;'>$($test.Value.Duration)s</span>" +
            "</div>"
        })

        $(if ($workflow.FixesApplied.Count -gt 0) {
            "<h2>Fixes Applied</h2><ul>" +
            ($workflow.FixesApplied | ForEach-Object { "<li>$_</li>" }) -join "" +
            "</ul>"
        })
    </div>
</body>
</html>
"@
            $html | Set-Content $htmlPath -Encoding UTF8
            Write-Host ""
            Write-Host "📄 HTML report exported: $htmlPath" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
if ($successCount -eq $totalTests) {
    Write-Host "  🚀 All checks passed - ready to build in Xcode!" -ForegroundColor Green
    Write-Host "  1. Open HealthKitBridge.xcodeproj in Xcode" -ForegroundColor White
    Write-Host "  2. Build the project (⌘+B)" -ForegroundColor White
    Write-Host "  3. Run on simulator or device (⌘+R)" -ForegroundColor White
} else {
    Write-Host "  🔧 Please address the failed checks above" -ForegroundColor Yellow
    Write-Host "  1. Review the failed test results" -ForegroundColor White
    Write-Host "  2. Fix the identified issues" -ForegroundColor White
    Write-Host "  3. Re-run the workflow" -ForegroundColor White
    Write-Host "  4. Build in Xcode when all checks pass" -ForegroundColor White
}

Write-Host ""
Write-Host "🛠️  Available Workflows:" -ForegroundColor Cyan
Write-Host "  .\ios-workflow.ps1 -QuickCheck          # Quick validation" -ForegroundColor White
Write-Host "  .\ios-workflow.ps1 -FullCheck           # Complete analysis" -ForegroundColor White
Write-Host "  .\ios-workflow.ps1 -FixIssues           # Auto-fix issues" -ForegroundColor White
Write-Host "  .\ios-workflow.ps1 -PrepareForBuild     # Pre-build validation" -ForegroundColor White
