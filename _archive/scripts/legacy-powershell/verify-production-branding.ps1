# 🌐 VitalSense Production Branding Verification Script

param(
    [string]$Url = "https://health.andernet.dev",
    [switch]$LocalDev
)

$ErrorActionPreference = 'Stop'

if ($LocalDev) {
    $Url = "http://localhost:5000"
}

Write-Host '🌐 VitalSense Production Branding Verification' -ForegroundColor Cyan
Write-Host '=============================================' -ForegroundColor Cyan
Write-Host "🔗 Checking: $Url" -ForegroundColor White

# Check if the site is responding
Write-Host "`n🔍 Checking site availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Extract title
$titleMatch = [regex]::Match($response.Content, '<title>(.*?)</title>')
if ($titleMatch.Success) {
    $title = $titleMatch.Groups[1].Value
    Write-Host "📋 Page Title: $title" -ForegroundColor White
} else {
    Write-Host "⚠️  No title tag found" -ForegroundColor Yellow
}

Write-Host "`n🎯 VitalSense Branding Verification:" -ForegroundColor Cyan

# Check for VitalSense branding
$brandingChecks = @(
    @{ Name = "VitalSense in title"; Pattern = "VitalSense"; Expected = $true },
    @{ Name = "Apple Health"; Pattern = "Apple Health"; Expected = $true },
    @{ Name = "Fall Risk"; Pattern = "Fall Risk"; Expected = $true },
    @{ Name = "Health Score"; Pattern = "Health Score"; Expected = $true },
    @{ Name = "Emergency"; Pattern = "Emergency"; Expected = $true },
    @{ Name = "VitalSense components"; Pattern = "__VITALSENSE_KV_MODE"; Expected = $true },
    @{ Name = "Old HealthGuard branding"; Pattern = "HealthGuard"; Expected = $false }
)

$passedChecks = 0
$totalChecks = $brandingChecks.Count

foreach ($check in $brandingChecks) {
    $found = $response.Content -like "*$($check.Pattern)*"

    if ($check.Expected -eq $found) {
        if ($check.Expected) {
            Write-Host "   ✅ $($check.Name): Found" -ForegroundColor Green
        } else {
            Write-Host "   ✅ $($check.Name): Not found (good)" -ForegroundColor Green
        }
        $passedChecks++
    } else {
        if ($check.Expected) {
            Write-Host "   ❌ $($check.Name): Missing" -ForegroundColor Red
        } else {
            Write-Host "   ❌ $($check.Name): Found (should be removed)" -ForegroundColor Red
        }
    }
}

# Check for meta tags and other important elements
Write-Host "`n📋 Technical Verification:" -ForegroundColor Cyan

$technicalChecks = @(
    @{ Name = "Meta viewport"; Pattern = '<meta name="viewport"' },
    @{ Name = "CSS loaded"; Pattern = '/main.css' },
    @{ Name = "JavaScript loaded"; Pattern = '<script' },
    @{ Name = "React root"; Pattern = 'id="root"' },
    @{ Name = "VitalSense config"; Pattern = 'VITALSENSE_DISABLE_WEBSOCKET' }
)

foreach ($check in $technicalChecks) {
    $found = $response.Content -like "*$($check.Pattern)*"
    if ($found) {
        Write-Host "   ✅ $($check.Name): Present" -ForegroundColor Green
        $passedChecks++
    } else {
        Write-Host "   ⚠️  $($check.Name): Missing" -ForegroundColor Yellow
    }
}

$totalChecks += $technicalChecks.Count

# Summary
Write-Host "`n🎯 Verification Summary:" -ForegroundColor Cyan
Write-Host "Passed: $passedChecks / $totalChecks checks" -ForegroundColor White

if ($passedChecks -eq $totalChecks) {
    Write-Host "`n🎉 VitalSense branding is PERFECT!" -ForegroundColor Green
    Write-Host "✅ All branding elements are properly deployed" -ForegroundColor Green
    Write-Host "🚀 Production site is ready for users!" -ForegroundColor Green
} elseif ($passedChecks -ge ($totalChecks * 0.8)) {
    Write-Host "`n✅ VitalSense branding is GOOD!" -ForegroundColor Green
    Write-Host "⚠️  Minor issues detected - review warnings above" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  VitalSense branding needs attention!" -ForegroundColor Yellow
    Write-Host "🔧 Please address the failed checks above" -ForegroundColor Yellow
}

Write-Host "`n📊 Site Performance:" -ForegroundColor Cyan
Write-Host "Content Size: $([math]::Round($response.Content.Length / 1KB, 2)) KB" -ForegroundColor White

if ($title -like "*VitalSense*") {
    Write-Host "`n💙 VitalSense - Where vital data becomes actionable insights!" -ForegroundColor Blue
}
