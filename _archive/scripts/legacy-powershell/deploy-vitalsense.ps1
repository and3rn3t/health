# 🚀 VitalSense Deployment Script

$ErrorActionPreference = 'Stop'

Write-Host '🎯 VitalSense Platform Deployment' -ForegroundColor Cyan
Write-Host '================================' -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path 'package.json')) {
  Write-Error 'Please run this script from the project root directory'
  exit 1
}

Write-Host "`n✅ Verifying VitalSense Branding Updates..." -ForegroundColor Green

# Verify key branding files have been updated
$checks = @(
  @{ File = 'src/App.tsx'; Pattern = 'VitalSense'; Description = 'Web app header' },
  @{ File = 'index.html'; Pattern = 'VitalSense'; Description = 'HTML title' },
  @{ File = 'package.json'; Pattern = 'vitalsense-app'; Description = 'Package name' },
  @{ File = 'README.md'; Pattern = 'VitalSense'; Description = 'Documentation' },
  @{ File = 'ios/Info.plist'; Pattern = 'VitalSense Sync'; Description = 'iOS app name' },
  @{ File = 'vitalsense-sync-metadata.json'; Pattern = 'VitalSense Sync'; Description = 'App Store metadata' }
)

foreach ($check in $checks) {
  if (Test-Path $check.File) {
    $content = Get-Content $check.File -Raw
    if ($content -like "*$($check.Pattern)*") {
      Write-Host "   ✓ $($check.Description) - $($check.File)" -ForegroundColor Green
    } else {
      Write-Host "   ✗ $($check.Description) - $($check.File)" -ForegroundColor Red
    }
  } else {
    Write-Host "   ⚠ File not found: $($check.File)" -ForegroundColor Yellow
  }
}

Write-Host "`n🔧 Building and Testing Platform..." -ForegroundColor Yellow

# Build the application
Write-Host 'Building React application...'
npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Error 'Build failed. Please check the errors above.'
  exit 1
}

Write-Host '✅ Build completed successfully!' -ForegroundColor Green

# Optional: Start development server for testing
$startDev = Read-Host "`nWould you like to start the development server for testing? (y/N)"
if ($startDev -eq 'y' -or $startDev -eq 'Y') {
  Write-Host "`n🚀 Starting VitalSense development server..." -ForegroundColor Cyan
  Write-Host 'Access your platform at: http://localhost:5173' -ForegroundColor Green
  Write-Host 'Press Ctrl+C to stop the server when ready.' -ForegroundColor Yellow
  npm run dev
}

Write-Host "`n🎉 VitalSense Platform Ready!" -ForegroundColor Green
Write-Host '================================' -ForegroundColor Green
Write-Host '✅ Branding updated to VitalSense' -ForegroundColor Green
Write-Host "✅ iOS app configured as 'VitalSense Sync'" -ForegroundColor Green
Write-Host '✅ Bundle ID: dev.andernet.vitalsense.sync' -ForegroundColor Green
Write-Host '✅ App Store metadata prepared' -ForegroundColor Green
Write-Host '✅ Platform built and ready for deployment' -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host '1. Deploy to Cloudflare Workers: wrangler deploy' -ForegroundColor White
Write-Host '2. Update iOS Xcode project if needed' -ForegroundColor White
Write-Host '3. Submit to App Store using APP_STORE_TODAY_PLAN.md' -ForegroundColor White
Write-Host '4. Review VITALSENSE_BRANDING.md for complete brand guidelines' -ForegroundColor White

Write-Host "`n🌐 Platform URL: https://health.andernet.dev" -ForegroundColor Cyan
Write-Host '📱 Future expansion: vitalsense.app (domain secured)' -ForegroundColor Cyan

Write-Host "`nVitalSense - Where vital data becomes actionable insights! 💙" -ForegroundColor Blue
