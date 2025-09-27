# 🔍 VitalSense Rebranding Verification Script

$ErrorActionPreference = 'Stop'

Write-Host '🔍 VitalSense Rebranding Verification' -ForegroundColor Cyan
Write-Host '====================================' -ForegroundColor Cyan

# Search for any remaining HealthGuard references
Write-Host "`n🔎 Searching for remaining 'HealthGuard' references..." -ForegroundColor Yellow

$healthGuardMatches = Select-String -Path '*.md', '*.tsx', '*.ts', '*.json', '*.ps1' -Pattern 'HealthGuard' -Recurse | Where-Object { $_.Filename -notlike '*node_modules*' -and $_.Filename -notlike '*dist*' }

if ($healthGuardMatches) {
  Write-Host '⚠️  Found remaining HealthGuard references:' -ForegroundColor Red
  foreach ($match in $healthGuardMatches) {
    Write-Host "   📄 $($match.Filename):$($match.LineNumber) - $($match.Line.Trim())" -ForegroundColor Yellow
  }
} else {
  Write-Host "✅ No remaining 'HealthGuard' references found!" -ForegroundColor Green
}

# Search for healthguard (lowercase)
Write-Host "`n🔎 Searching for remaining 'healthguard' references..." -ForegroundColor Yellow

$healthguardMatches = Select-String -Path '*.md', '*.tsx', '*.ts', '*.json', '*.ps1' -Pattern 'healthguard' -Recurse | Where-Object { $_.Filename -notlike '*node_modules*' -and $_.Filename -notlike '*dist*' }

if ($healthguardMatches) {
  Write-Host '⚠️  Found remaining healthguard references:' -ForegroundColor Red
  foreach ($match in $healthguardMatches) {
    Write-Host "   📄 $($match.Filename):$($match.LineNumber) - $($match.Line.Trim())" -ForegroundColor Yellow
  }
} else {
  Write-Host "✅ No remaining 'healthguard' references found!" -ForegroundColor Green
}

# Verify VitalSense references
Write-Host "`n✅ Verifying VitalSense branding..." -ForegroundColor Green

$vitalSenseFiles = @(
  @{ File = 'src/App.tsx'; Expected = 'VitalSense' },
  @{ File = 'index.html'; Expected = 'VitalSense' },
  @{ File = 'package.json'; Expected = 'vitalsense-app' },
  @{ File = 'README.md'; Expected = 'VitalSense' },
  @{ File = 'ios/Info.plist'; Expected = 'VitalSense Sync' },
  @{ File = 'vitalsense-sync-metadata.json'; Expected = 'VitalSense Sync' },
  @{ File = 'terms-of-service.md'; Expected = 'VitalSense' },
  @{ File = 'privacy-policy.md'; Expected = 'VitalSense' }
)

foreach ($check in $vitalSenseFiles) {
  if (Test-Path $check.File) {
    $content = Get-Content $check.File -Raw
    if ($content -like "*$($check.Expected)*") {
      Write-Host "   ✓ $($check.File) contains '$($check.Expected)'" -ForegroundColor Green
    } else {
      Write-Host "   ✗ $($check.File) missing '$($check.Expected)'" -ForegroundColor Red
    }
  } else {
    Write-Host "   ⚠ File not found: $($check.File)" -ForegroundColor Yellow
  }
}

Write-Host "`n🎯 Summary:" -ForegroundColor Cyan
if (-not $healthGuardMatches -and -not $healthguardMatches) {
  Write-Host '🎉 VitalSense rebranding is COMPLETE!' -ForegroundColor Green
  Write-Host '✅ All HealthGuard references have been successfully updated to VitalSense' -ForegroundColor Green
  Write-Host '🚀 Your platform is ready for deployment!' -ForegroundColor Green
} else {
  Write-Host '⚠️  Rebranding is incomplete. Please review the references above.' -ForegroundColor Yellow
  Write-Host '🔧 Run individual replacements for any remaining files.' -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host '1. Build and test: npm run build' -ForegroundColor White
Write-Host '2. Deploy platform: wrangler deploy' -ForegroundColor White
Write-Host '3. Submit iOS app using APP_STORE_TODAY_PLAN.md' -ForegroundColor White
Write-Host '4. Review VITALSENSE_BRANDING.md for brand guidelines' -ForegroundColor White

Write-Host "`n💙 VitalSense - Where vital data becomes actionable insights!" -ForegroundColor Blue
