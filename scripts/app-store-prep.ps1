#!/usr/bin/env pwsh
# App Store Preparation Automation Script
# Helps prepare iOS app for App Store submission

param(
  [ValidateSet('setup', 'metadata', 'screenshots', 'build', 'submit', 'all')]
  [string]$Action = 'setup',
  [switch]$Verbose = $false
)

Write-Host '🍎 App Store Preparation Tool' -ForegroundColor Cyan
Write-Host '=============================' -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor White
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ''

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$iOSPath = Join-Path $ProjectRoot 'ios'
$AppPath = Join-Path $iOSPath 'HealthKitBridge'

function Write-Step {
  param([string]$Message, [string]$Status = 'INFO')
  $color = switch ($Status) {
    'INFO' { 'White' }
    'SUCCESS' { 'Green' }
    'WARNING' { 'Yellow' }
    'ERROR' { 'Red' }
    default { 'White' }
  }
  Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Test-AppStoreReadiness {
  Write-Step 'Checking App Store readiness...' 'INFO'

  $issues = @()
  $warnings = @()

  # Check Info.plist
  $infoPlist = Join-Path $iOSPath 'Info.plist'
  if (Test-Path $infoPlist) {
    Write-Step 'Info.plist found' 'SUCCESS'

    $content = Get-Content $infoPlist -Raw
    if ($content -match 'NSHealthShareUsageDescription') {
      Write-Step 'HealthKit permissions configured' 'SUCCESS'
    } else {
      $issues += 'Missing HealthKit usage descriptions'
    }
  } else {
    $issues += 'Info.plist not found'
  }

  # Check Config.plist for production URLs
  $configPlist = Join-Path $AppPath 'Config.plist'
  if (Test-Path $configPlist) {
    $content = Get-Content $configPlist -Raw
    if ($content -match 'health\.andernet\.dev') {
      Write-Step 'Production URLs configured' 'SUCCESS'
    } else {
      $warnings += 'Production URLs may not be configured'
    }
  }

  # Check Xcode project
  $xcodeproj = Join-Path $iOSPath 'HealthKitBridge.xcodeproj'
  if (Test-Path $xcodeproj) {
    Write-Step 'Xcode project found' 'SUCCESS'
  } else {
    $issues += 'Xcode project not found'
  }

  # Check Assets
  $assets = Join-Path $AppPath 'Assets.xcassets'
  if (Test-Path $assets) {
    Write-Step 'Assets catalog found' 'SUCCESS'

    # Check for app icon
    $appIcon = Join-Path $assets 'AppIcon.appiconset'
    if (Test-Path $appIcon) {
      Write-Step 'App icon set found' 'SUCCESS'
    } else {
      $warnings += 'App icon may need updating for App Store'
    }
  } else {
    $issues += 'Assets catalog not found'
  }

  Write-Host ''
  Write-Host '📊 READINESS REPORT' -ForegroundColor Cyan
  Write-Host '==================' -ForegroundColor Cyan

  if ($issues.Count -eq 0) {
    Write-Step '✅ No critical issues found!' 'SUCCESS'
    Write-Step 'Your app is ready for App Store preparation' 'SUCCESS'
  } else {
    Write-Step '❌ Critical issues found:' 'ERROR'
    foreach ($issue in $issues) {
      Write-Host "   • $issue" -ForegroundColor Red
    }
  }

  if ($warnings.Count -gt 0) {
    Write-Host ''
    Write-Step '⚠️ Recommendations:' 'WARNING'
    foreach ($warning in $warnings) {
      Write-Host "   • $warning" -ForegroundColor Yellow
    }
  }

  return $issues.Count -eq 0
}

function New-AppStoreMetadata {
  Write-Step 'Generating App Store metadata...' 'INFO'

  $metadata = @{
    AppName     = 'HealthGuard - Fall Risk Monitor'
    Subtitle    = 'Health insights & fall safety'
    BundleId    = 'dev.andernet.healthkitbridge'
    Version     = '1.0.0'
    BuildNumber = '1'
    Category    = 'Medical'
    Keywords    = 'health,fall detection,HealthKit,monitoring,safety,caregiver,elderly,wellness,medical'
    SupportURL  = 'https://health.andernet.dev/support'
    PrivacyURL  = 'https://health.andernet.dev/privacy'
    TermsURL    = 'https://health.andernet.dev/terms'
  }

  $metadataPath = Join-Path $ProjectRoot 'app-store-metadata.json'
  $metadata | ConvertTo-Json -Depth 10 | Out-File $metadataPath -Encoding UTF8

  Write-Step "Metadata saved to: $metadataPath" 'SUCCESS'
  Write-Step "App Name: $($metadata.AppName)" 'INFO'
  Write-Step "Bundle ID: $($metadata.BundleId)" 'INFO'
  Write-Step "Version: $($metadata.Version)" 'INFO'
}

function Show-NextSteps {
  Write-Host ''
  Write-Host '🚀 NEXT STEPS' -ForegroundColor Cyan
  Write-Host '=============' -ForegroundColor Cyan
  Write-Host ''

  Write-Host '1. 📝 Complete App Store Connect Setup:' -ForegroundColor Yellow
  Write-Host '   • Log into https://appstoreconnect.apple.com' -ForegroundColor White
  Write-Host '   • Create new app with Bundle ID: dev.andernet.healthkitbridge' -ForegroundColor White
  Write-Host '   • Set category to Medical or Health & Fitness' -ForegroundColor White
  Write-Host ''

  Write-Host '2. 📱 Prepare Screenshots:' -ForegroundColor Yellow
  Write-Host '   • Open iOS Simulator' -ForegroundColor White
  Write-Host '   • Take 6-10 screenshots per device size' -ForegroundColor White
  Write-Host '   • Include: Dashboard, Fall Risk, Emergency, Settings' -ForegroundColor White
  Write-Host ''

  Write-Host '3. 🏗️ Build for App Store:' -ForegroundColor Yellow
  Write-Host '   • Open Xcode: open ios/HealthKitBridge.xcodeproj' -ForegroundColor White
  Write-Host "   • Select 'Any iOS Device'" -ForegroundColor White
  Write-Host '   • Product → Archive' -ForegroundColor White
  Write-Host '   • Upload to App Store Connect' -ForegroundColor White
  Write-Host ''

  Write-Host '4. 📄 Legal Pages (Required):' -ForegroundColor Yellow
  Write-Host '   • Create privacy policy at health.andernet.dev/privacy' -ForegroundColor White
  Write-Host '   • Create terms of service at health.andernet.dev/terms' -ForegroundColor White
  Write-Host '   • Create support page at health.andernet.dev/support' -ForegroundColor White
  Write-Host ''

  Write-Host '5. 🎯 Submit for Review:' -ForegroundColor Yellow
  Write-Host '   • Complete all App Store Connect metadata' -ForegroundColor White
  Write-Host '   • Add app description and keywords' -ForegroundColor White
  Write-Host '   • Upload screenshots and app icon' -ForegroundColor White
  Write-Host '   • Submit for Apple review' -ForegroundColor White
  Write-Host ''

  Write-Host '⏱️ Expected Timeline:' -ForegroundColor Green
  Write-Host '   • Setup & Metadata: 2-3 hours' -ForegroundColor White
  Write-Host '   • Screenshots & Build: 2-4 hours' -ForegroundColor White
  Write-Host '   • Apple Review: 1-7 days' -ForegroundColor White
  Write-Host '   • Total to Live: 3-10 days' -ForegroundColor White
}

# Main execution
switch ($Action) {
  'setup' {
    $ready = Test-AppStoreReadiness
    if ($ready) {
      New-AppStoreMetadata
      Show-NextSteps
    }
  }
  'metadata' {
    New-AppStoreMetadata
  }
  'all' {
    Test-AppStoreReadiness
    New-AppStoreMetadata
    Show-NextSteps
  }
  default {
    Write-Step "Unknown action: $Action" 'ERROR'
    Write-Step 'Available actions: setup, metadata, screenshots, build, submit, all' 'INFO'
  }
}

Write-Host ''
Write-Host '🎉 App Store preparation tool completed!' -ForegroundColor Green
Write-Host 'For detailed guidance, see: APP_STORE_SUBMISSION_GUIDE.md' -ForegroundColor White
