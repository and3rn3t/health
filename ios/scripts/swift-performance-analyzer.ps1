# 🚀 Swift Performance Analyzer
# Analyzes Swift code for potential performance issues and optimization opportunities

param(
    [switch]$Detailed = $false,
    [switch]$ExportReport = $false,
    [string]$OutputFormat = "text" # text, html, json
)

Write-Host "🚀 Swift Performance Analysis" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Change to iOS directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

$performanceIssues = @{
    Critical = @()
    Warning = @()
    Info = @()
}

$optimizationSuggestions = @()
$memoryIssues = @()
$networkIssues = @()

Write-Host "📂 Analyzing Swift files for performance issues..." -ForegroundColor Green
Write-Host ""

$swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse

foreach ($file in $swiftFiles) {
    if ($file.FullName) {
        $fileName = $file.Name
        $content = Get-Content $file.FullName -Raw
        $lines = $content -split "`n"

        Write-Host "🔍 Analyzing: $fileName" -ForegroundColor Yellow

        # Check for performance anti-patterns

        # 1. Force unwrapping in loops or repeated operations
        $forceUnwrapInLoops = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -match "(for|while|forEach)" -and ($i+1 -lt $lines.Count)) {
                $nextFewLines = $lines[$i..([math]::Min($i+10, $lines.Count-1))] -join " "
                $forceUnwraps = ($nextFewLines | Select-String -Pattern "!" -AllMatches).Matches.Count
                if ($forceUnwraps -gt 2) {
                    $forceUnwrapInLoops += $forceUnwraps
                }
            }
        }

        if ($forceUnwrapInLoops -gt 0) {
            $performanceIssues.Warning += "⚠️  ${fileName}: $forceUnwrapInLoops force unwraps in loops - use optional binding"
        }

        # 2. String concatenation in loops
        if ($content -match "(for|while|forEach).*\{[^}]*\+=.*String|String.*\+=.*(for|while|forEach)") {
            $performanceIssues.Warning += "⚠️  ${fileName}: String concatenation in loops - consider using StringBuilder or array.joined()"
        }

        # 3. Inefficient array operations
        if ($content -match "\.append.*for|for.*\.append") {
            $performanceIssues.Info += "💡 ${fileName}: Array.append() in loop - consider pre-allocating capacity or using +"
        }

        # 4. Synchronous network calls
        if ($content -match "URLSession.*\.dataTask|\.downloadTask|\.uploadTask" -and $content -notmatch "async|await") {
            $networkIssues += "⚠️  ${fileName}: Synchronous network operations - consider using async/await"
        }

        # 5. Memory leaks patterns
        if ($content -match "\[self\]" -and $content -notmatch "\[weak self\]|\[unowned self\]") {
            $memoryIssues += "🧠 ${fileName}: Strong self captures - potential memory leaks"
        }

        # 6. Expensive operations on main thread
        if ($content -match "DispatchQueue\.main" -and $content -match "(\.write|\.save|\.fetch|\.parse|\.decode)") {
            $performanceIssues.Warning += "⚠️  ${fileName}: Expensive operations on main queue - consider background processing"
        }

        # 7. Inefficient SwiftUI patterns
        if ($content -match "@State.*Array|@State.*Dictionary" -and $content -match "\.count|\.isEmpty" -and $content -match "body.*var") {
            $performanceIssues.Info += "💡 ${fileName}: @State collections in body - consider @StateObject or computed properties"
        }

        # 8. HealthKit performance issues
        if ($content -match "HKHealthStore.*execute.*HKQuery" -and $content -notmatch "predicate") {
            $performanceIssues.Warning += "⚠️  ${fileName}: HealthKit queries without predicates - may fetch too much data"
        }

        # 9. Inefficient JSON parsing
        if ($content -match "JSONSerialization" -and $content -notmatch "Codable") {
            $optimizationSuggestions += "💡 ${fileName}: Consider using Codable instead of JSONSerialization for better performance"
        }

        # 10. Large view hierarchies
        $viewNestingLevel = 0
        $maxNesting = 0
        foreach ($line in $lines) {
            if ($line -match "\{") {
                $viewNestingLevel++
                $maxNesting = [math]::Max($maxNesting, $viewNestingLevel)
            }
            if ($line -match "\}") {
                $viewNestingLevel--
            }
        }

        if ($maxNesting -gt 8) {
            $performanceIssues.Warning += "⚠️  ${fileName}: Deep view nesting ($maxNesting levels) - consider breaking into smaller views"
        }

        # 11. Timer usage without invalidation
        if ($content -match "Timer\." -and $content -notmatch "invalidate") {
            $performanceIssues.Critical += "❌ ${fileName}: Timer created without invalidation - memory leak risk"
        }

        # 12. Core Data performance issues
        if ($content -match "NSManagedObjectContext" -and $content -notmatch "performBlock|perform") {
            $performanceIssues.Warning += "⚠️  ${fileName}: Core Data operations not using performBlock - threading issues"
        }

        Write-Host "   ✅ Complete" -ForegroundColor Green
    }
}

# Generate performance report
Write-Host ""
Write-Host "📊 PERFORMANCE ANALYSIS REPORT" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$totalIssues = $performanceIssues.Critical.Count + $performanceIssues.Warning.Count + $performanceIssues.Info.Count

if ($totalIssues -eq 0) {
    Write-Host "🎉 No performance issues detected!" -ForegroundColor Green
} else {
    Write-Host "Found $totalIssues potential performance issues:" -ForegroundColor Yellow
}

if ($performanceIssues.Critical.Count -gt 0) {
    Write-Host ""
    Write-Host "🚨 CRITICAL ISSUES ($($performanceIssues.Critical.Count)):" -ForegroundColor Red
    foreach ($issue in $performanceIssues.Critical) {
        Write-Host "   $issue" -ForegroundColor Red
    }
}

if ($performanceIssues.Warning.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  WARNING ISSUES ($($performanceIssues.Warning.Count)):" -ForegroundColor Yellow
    foreach ($issue in $performanceIssues.Warning) {
        Write-Host "   $issue" -ForegroundColor Yellow
    }
}

if ($performanceIssues.Info.Count -gt 0) {
    Write-Host ""
    Write-Host "💡 OPTIMIZATION OPPORTUNITIES ($($performanceIssues.Info.Count)):" -ForegroundColor Cyan
    foreach ($issue in $performanceIssues.Info) {
        Write-Host "   $issue" -ForegroundColor Cyan
    }
}

if ($memoryIssues.Count -gt 0) {
    Write-Host ""
    Write-Host "🧠 MEMORY MANAGEMENT ISSUES ($($memoryIssues.Count)):" -ForegroundColor Magenta
    foreach ($issue in $memoryIssues) {
        Write-Host "   $issue" -ForegroundColor Magenta
    }
}

if ($networkIssues.Count -gt 0) {
    Write-Host ""
    Write-Host "🌐 NETWORK PERFORMANCE ISSUES ($($networkIssues.Count)):" -ForegroundColor Blue
    foreach ($issue in $networkIssues) {
        Write-Host "   $issue" -ForegroundColor Blue
    }
}

if ($optimizationSuggestions.Count -gt 0) {
    Write-Host ""
    Write-Host "🔧 OPTIMIZATION SUGGESTIONS ($($optimizationSuggestions.Count)):" -ForegroundColor Green
    foreach ($suggestion in $optimizationSuggestions) {
        Write-Host "   $suggestion" -ForegroundColor Green
    }
}

# Detailed analysis
if ($Detailed) {
    Write-Host ""
    Write-Host "📋 DETAILED RECOMMENDATIONS:" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "🚀 Performance Best Practices for HealthKit Apps:" -ForegroundColor Green
    Write-Host "   • Use HKQuery predicates to limit data fetching" -ForegroundColor White
    Write-Host "   • Batch HealthKit operations when possible" -ForegroundColor White
    Write-Host "   • Cache frequently accessed health data" -ForegroundColor White
    Write-Host "   • Use background queues for heavy computations" -ForegroundColor White
    Write-Host "   • Implement proper memory management with [weak self]" -ForegroundColor White

    Write-Host ""
    Write-Host "📱 SwiftUI Performance Tips:" -ForegroundColor Green
    Write-Host "   • Use @StateObject for complex observable objects" -ForegroundColor White
    Write-Host "   • Avoid heavy computations in view body" -ForegroundColor White
    Write-Host "   • Use LazyVStack/LazyHStack for large lists" -ForegroundColor White
    Write-Host "   • Implement proper view identifiers for animations" -ForegroundColor White
    Write-Host "   • Minimize @State variables in views" -ForegroundColor White

    Write-Host ""
    Write-Host "🔗 Network Optimization:" -ForegroundColor Green
    Write-Host "   • Use async/await for network operations" -ForegroundColor White
    Write-Host "   • Implement proper error handling and retries" -ForegroundColor White
    Write-Host "   • Cache network responses when appropriate" -ForegroundColor White
    Write-Host "   • Use URLSession with proper configuration" -ForegroundColor White
    Write-Host "   • Implement request batching for multiple API calls" -ForegroundColor White
}

# Export report
if ($ExportReport) {
    $reportData = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        summary = @{
            totalFiles = $swiftFiles.Count
            totalIssues = $totalIssues
            criticalIssues = $performanceIssues.Critical.Count
            warnings = $performanceIssues.Warning.Count
            suggestions = $performanceIssues.Info.Count
        }
        issues = $performanceIssues
        memoryIssues = $memoryIssues
        networkIssues = $networkIssues
        optimizations = $optimizationSuggestions
    }

    $reportPath = "performance-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    switch ($OutputFormat.ToLower()) {
        "json" {
            $jsonPath = "$reportPath.json"
            $reportData | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
            Write-Host ""
            Write-Host "📄 JSON report exported to: $jsonPath" -ForegroundColor Green
        }
        "html" {
            $htmlPath = "$reportPath.html"
            $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Swift Performance Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .critical { color: #dc2626; } .warning { color: #d97706; } .info { color: #059669; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #e5e7eb; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9fafb; border-radius: 6px; }
    </style>
</head>
<body>
    <h1 class="header">🚀 Swift Performance Analysis Report</h1>
    <p><strong>Generated:</strong> $($reportData.timestamp)</p>

    <div class="section">
        <h2>📊 Summary</h2>
        <div class="metric"><strong>Files Analyzed:</strong> $($reportData.summary.totalFiles)</div>
        <div class="metric"><strong>Total Issues:</strong> $($reportData.summary.totalIssues)</div>
        <div class="metric critical"><strong>Critical:</strong> $($reportData.summary.criticalIssues)</div>
        <div class="metric warning"><strong>Warnings:</strong> $($reportData.summary.warnings)</div>
        <div class="metric info"><strong>Suggestions:</strong> $($reportData.summary.suggestions)</div>
    </div>

    $(if ($performanceIssues.Critical.Count -gt 0) {
        "<div class='section'><h2 class='critical'>🚨 Critical Issues</h2><ul>" +
        ($performanceIssues.Critical | ForEach-Object { "<li>$_</li>" }) -join "" +
        "</ul></div>"
    })

    $(if ($performanceIssues.Warning.Count -gt 0) {
        "<div class='section'><h2 class='warning'>⚠️ Warnings</h2><ul>" +
        ($performanceIssues.Warning | ForEach-Object { "<li>$_</li>" }) -join "" +
        "</ul></div>"
    })

    $(if ($performanceIssues.Info.Count -gt 0) {
        "<div class='section'><h2 class='info'>💡 Optimization Opportunities</h2><ul>" +
        ($performanceIssues.Info | ForEach-Object { "<li>$_</li>" }) -join "" +
        "</ul></div>"
    })
</body>
</html>
"@
            $html | Set-Content $htmlPath -Encoding UTF8
            Write-Host ""
            Write-Host "📄 HTML report exported to: $htmlPath" -ForegroundColor Green
        }
        default {
            $textPath = "$reportPath.txt"
            $textReport = @"
Swift Performance Analysis Report
Generated: $($reportData.timestamp)

SUMMARY
=======
Files Analyzed: $($reportData.summary.totalFiles)
Total Issues: $($reportData.summary.totalIssues)
Critical Issues: $($reportData.summary.criticalIssues)
Warnings: $($reportData.summary.warnings)
Suggestions: $($reportData.summary.suggestions)

CRITICAL ISSUES
===============
$($performanceIssues.Critical -join "`n")

WARNINGS
========
$($performanceIssues.Warning -join "`n")

OPTIMIZATION OPPORTUNITIES
=========================
$($performanceIssues.Info -join "`n")

MEMORY ISSUES
=============
$($memoryIssues -join "`n")

NETWORK ISSUES
==============
$($networkIssues -join "`n")
"@
            $textReport | Set-Content $textPath -Encoding UTF8
            Write-Host ""
            Write-Host "📄 Text report exported to: $textPath" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Address critical issues (🚨) immediately" -ForegroundColor White
Write-Host "  2. Review and fix warnings (⚠️) for better performance" -ForegroundColor White
Write-Host "  3. Consider optimization suggestions (💡) for enhanced efficiency" -ForegroundColor White
Write-Host "  4. Re-run analysis after fixes to track improvements" -ForegroundColor White

Write-Host ""
Write-Host "🛠️  Available Options:" -ForegroundColor Cyan
Write-Host "  -Detailed              # Show detailed recommendations" -ForegroundColor White
Write-Host "  -ExportReport          # Export analysis to file" -ForegroundColor White
Write-Host "  -OutputFormat json|html|text  # Report format (default: text)" -ForegroundColor White

if ($performanceIssues.Critical.Count -gt 0) {
    exit 1
} else {
    exit 0
}
