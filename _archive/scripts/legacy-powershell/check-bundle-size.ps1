# VitalSense Bundle Size Monitor
# Quick PowerShell script to check bundle sizes and performance

param(
    [switch]$Detailed,
    [switch]$JSON,
    [switch]$Save,
    [string]$OutputFile = "bundle-size-report.json"
)

Write-Host "📦 VitalSense Bundle Size Monitor" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if build files exist
$distPath = "dist"
$workerPath = "dist-worker"

if (-not (Test-Path $distPath) -or -not (Test-Path $workerPath)) {
    Write-Host "❌ Build files not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Get file sizes
try {
    $appFile = Get-Item "$distPath/main.js" -ErrorAction Stop
    $cssFile = Get-Item "$distPath/main.css" -ErrorAction Stop
    $workerFile = Get-Item "$workerPath/index.js" -ErrorAction Stop
    $htmlFile = Get-Item "$distPath/index.html" -ErrorAction Stop

    $appSize = $appFile.Length
    $cssSize = $cssFile.Length
    $workerSize = $workerFile.Length
    $htmlSize = $htmlFile.Length
    $totalSize = $appSize + $cssSize + $workerSize + $htmlSize

    # Display results
    Write-Host "📊 Bundle Sizes:" -ForegroundColor Yellow
    Write-Host "   React App:     $([math]::Round($appSize/1KB, 1)) KB" -ForegroundColor White
    Write-Host "   CSS Bundle:    $([math]::Round($cssSize/1KB, 1)) KB" -ForegroundColor White
    Write-Host "   Worker:        $([math]::Round($workerSize/1KB, 1)) KB" -ForegroundColor White
    Write-Host "   HTML:          $([math]::Round($htmlSize/1KB, 1)) KB" -ForegroundColor White
    Write-Host "   Total:         $([math]::Round($totalSize/1KB, 1)) KB ($([math]::Round($totalSize/1MB, 2)) MB)" -ForegroundColor Cyan
    Write-Host ""

    # Performance analysis
    Write-Host "📈 Performance Analysis:" -ForegroundColor Yellow

    # Thresholds
    $appThreshold = 250KB
    $cssThreshold = 50KB
    $workerThreshold = 100KB
    $totalThreshold = 400KB

    # App bundle analysis
    if ($appSize -le $appThreshold) {
        Write-Host "   🟢 App Bundle: Excellent" -ForegroundColor Green
    } elseif ($appSize -le ($appThreshold * 1.5)) {
        Write-Host "   🟡 App Bundle: Good" -ForegroundColor Yellow
    } elseif ($appSize -le ($appThreshold * 2)) {
        Write-Host "   🟠 App Bundle: Fair" -ForegroundColor DarkYellow
    } else {
        Write-Host "   🔴 App Bundle: Needs Optimization" -ForegroundColor Red
    }

    # CSS bundle analysis
    if ($cssSize -le $cssThreshold) {
        Write-Host "   🟢 CSS Bundle: Excellent" -ForegroundColor Green
    } elseif ($cssSize -le ($cssThreshold * 2)) {
        Write-Host "   🟡 CSS Bundle: Good" -ForegroundColor Yellow
    } else {
        Write-Host "   🟠 CSS Bundle: Could be optimized" -ForegroundColor DarkYellow
    }

    # Worker analysis
    if ($workerSize -le $workerThreshold) {
        Write-Host "   🟢 Worker: Excellent" -ForegroundColor Green
    } elseif ($workerSize -le ($workerThreshold * 1.5)) {
        Write-Host "   🟡 Worker: Good" -ForegroundColor Yellow
    } else {
        Write-Host "   🟠 Worker: Could be optimized" -ForegroundColor DarkYellow
    }

    # Total size analysis
    if ($totalSize -le $totalThreshold) {
        Write-Host "   🟢 Total Size: Excellent" -ForegroundColor Green
    } elseif ($totalSize -le ($totalThreshold * 1.5)) {
        Write-Host "   🟡 Total Size: Good" -ForegroundColor Yellow
    } elseif ($totalSize -le ($totalThreshold * 2)) {
        Write-Host "   🟠 Total Size: Fair" -ForegroundColor DarkYellow
    } else {
        Write-Host "   🔴 Total Size: Critical - Needs Optimization" -ForegroundColor Red
    }

    Write-Host ""

    # Gzip estimates
    Write-Host "📉 Estimated Gzipped Sizes:" -ForegroundColor Yellow
    $gzipRatio = 0.3
    Write-Host "   App: $([math]::Round($appSize * $gzipRatio / 1KB, 1)) KB" -ForegroundColor White
    Write-Host "   CSS: $([math]::Round($cssSize * $gzipRatio / 1KB, 1)) KB" -ForegroundColor White
    Write-Host "   Total: $([math]::Round($totalSize * $gzipRatio / 1KB, 1)) KB" -ForegroundColor Cyan
    Write-Host ""

    # Recommendations
    Write-Host "💡 Recommendations:" -ForegroundColor Yellow
    $recommendations = @()

    if ($appSize -gt ($appThreshold * 2)) {
        $recommendations += "🔴 App bundle is very large - implement lazy loading and code splitting"
    } elseif ($appSize -gt $appThreshold) {
        $recommendations += "🟡 App bundle could be optimized - consider dynamic imports"
    }

    if ($cssSize -gt ($cssThreshold * 2)) {
        $recommendations += "🟠 CSS bundle is large - implement PurgeCSS or remove unused styles"
    }

    if ($totalSize -gt ($totalThreshold * 2)) {
        $recommendations += "🔴 Total bundle size is critical - requires immediate optimization"
    } elseif ($totalSize -gt $totalThreshold) {
        $recommendations += "🟡 Total bundle size exceeds target - optimize where possible"
    }

    if ($recommendations.Count -eq 0) {
        $recommendations += "✅ Bundle sizes are well optimized!"
    }

    foreach ($rec in $recommendations) {
        Write-Host "   $rec" -ForegroundColor White
    }

    # Historical comparison (if previous report exists)
    if (Test-Path $OutputFile) {
        try {
            $previousReport = Get-Content $OutputFile | ConvertFrom-Json
            $previousTotal = $previousReport.totalBytes
            $change = (($totalSize - $previousTotal) / $previousTotal) * 100

            Write-Host ""
            Write-Host "📊 Change from last check:" -ForegroundColor Yellow
            if ($change -gt 5) {
                Write-Host "   🔴 Bundle size increased by $([math]::Round($change, 1))%" -ForegroundColor Red
            } elseif ($change -gt 0) {
                Write-Host "   🟡 Bundle size increased by $([math]::Round($change, 1))%" -ForegroundColor Yellow
            } elseif ($change -lt -5) {
                Write-Host "   🟢 Bundle size decreased by $([math]::Round([math]::Abs($change), 1))%" -ForegroundColor Green
            } else {
                Write-Host "   ▫️ Bundle size stable ($([math]::Round($change, 1))% change)" -ForegroundColor Gray
            }
        } catch {
            # Previous report exists but can't be parsed, ignore
        }
    }

    # Create report object
    $report = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        bundles = @{
            app = @{
                bytes = $appSize
                kb = [math]::Round($appSize/1KB, 1)
                path = "dist/main.js"
            }
            css = @{
                bytes = $cssSize
                kb = [math]::Round($cssSize/1KB, 1)
                path = "dist/main.css"
            }
            worker = @{
                bytes = $workerSize
                kb = [math]::Round($workerSize/1KB, 1)
                path = "dist-worker/index.js"
            }
            html = @{
                bytes = $htmlSize
                kb = [math]::Round($htmlSize/1KB, 1)
                path = "dist/index.html"
            }
        }
        totalBytes = $totalSize
        totalKB = [math]::Round($totalSize/1KB, 1)
        totalMB = [math]::Round($totalSize/1MB, 2)
        gzipEstimate = @{
            totalKB = [math]::Round($totalSize * $gzipRatio / 1KB, 1)
        }
        performance = @{
            appStatus = if ($appSize -le $appThreshold) { "excellent" } elseif ($appSize -le ($appThreshold * 1.5)) { "good" } elseif ($appSize -le ($appThreshold * 2)) { "fair" } else { "poor" }
            cssStatus = if ($cssSize -le $cssThreshold) { "excellent" } elseif ($cssSize -le ($cssThreshold * 2)) { "good" } else { "fair" }
            totalStatus = if ($totalSize -le $totalThreshold) { "excellent" } elseif ($totalSize -le ($totalThreshold * 1.5)) { "good" } elseif ($totalSize -le ($totalThreshold * 2)) { "fair" } else { "poor" }
        }
        recommendations = $recommendations
    }

    # Save report if requested
    if ($Save) {
        $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-Host ""
        Write-Host "📄 Report saved to: $OutputFile" -ForegroundColor Green
    }

    # JSON output
    if ($JSON) {
        Write-Host ""
        Write-Host "📋 JSON Output:" -ForegroundColor Yellow
        $report | ConvertTo-Json -Depth 10
    }

    Write-Host ""
    Write-Host "=================================" -ForegroundColor Cyan

    # Exit with appropriate code
    if ($report.performance.totalStatus -eq "poor") {
        Write-Host "❌ Bundle size critical - optimization required" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Bundle analysis completed" -ForegroundColor Green
        exit 0
    }

} catch {
    Write-Host "❌ Error analyzing bundle sizes: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
