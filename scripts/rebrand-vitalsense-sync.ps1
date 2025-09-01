#!/usr/bin/env pwsh
# VitalSense Sync Rebranding Script
# Updates all project files to reflect new app name and bundle ID

param(
  [switch]$DryRun = $false,
  [switch]$Verbose = $false
)

Write-Host '🔄 VitalSense Sync Rebranding Tool' -ForegroundColor Cyan
Write-Host '===================================' -ForegroundColor Cyan
Write-Host 'Converting: HealthKitBridge → VitalSense Sync' -ForegroundColor White
Write-Host 'Bundle ID: dev.andernet.HealthKitBridge → dev.andernet.VitalSense.sync' -ForegroundColor White
Write-Host "Dry Run: $DryRun" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ''

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$updatedFiles = @()
$errors = @()

function Write-Update {
  param([string]$File, [string]$Description, [string]$Status = 'INFO')
  $color = switch ($Status) {
    'SUCCESS' { 'Green' }
    'WARNING' { 'Yellow' }
    'ERROR' { 'Red' }
    default { 'White' }
  }
  $icon = switch ($Status) {
    'SUCCESS' { '✅' }
    'WARNING' { '⚠️' }
    'ERROR' { '❌' }
    default { '📝' }
  }
  Write-Host "$icon $Description" -ForegroundColor $color
  if ($Verbose) {
    Write-Host "   File: $File" -ForegroundColor Gray
  }
}

function Update-FileContent {
  param(
    [string]$FilePath,
    [hashtable]$Replacements,
    [string]$Description
  )

  if (-not (Test-Path $FilePath)) {
    Write-Update $FilePath 'File not found - skipping' 'WARNING'
    return $false
  }

  try {
    $content = Get-Content $FilePath -Raw -ErrorAction Stop
    $originalContent = $content

    foreach ($replacement in $Replacements.GetEnumerator()) {
      $content = $content -replace [regex]::Escape($replacement.Key), $replacement.Value
    }

    if ($content -ne $originalContent) {
      if (-not $DryRun) {
        Set-Content $FilePath $content -NoNewline -ErrorAction Stop
      }
      Write-Update $FilePath $Description 'SUCCESS'
      $script:updatedFiles += $FilePath
      return $true
    } else {
      Write-Update $FilePath 'No changes needed' 'INFO'
      return $false
    }
  } catch {
    $script:errors += "Failed to update $FilePath`: $($_.Exception.Message)"
    Write-Update $FilePath "Update failed: $($_.Exception.Message)" 'ERROR'
    return $false
  }
}

# Define all text replacements
$AppNameReplacements = @{
  'HealthKit Bridge'                = 'VitalSense Sync'
  'HealthKitBridge'                 = 'VitalSense Sync'
  'VitalSense - Fall Risk Monitor' = 'VitalSense Sync'
  'VitalSense - Health Monitor'    = 'VitalSense Sync'
}

$BundleIdReplacements = @{
  'dev.andernet.HealthKitBridge' = 'dev.andernet.VitalSense.sync'
  'dev.andernet.healthkitbridge' = 'dev.andernet.VitalSense.sync'
}

$DescriptionReplacements = @{
  'Transform your Apple Health data into actionable insights with VitalSense - the comprehensive health monitoring app designed to keep you safe and informed.' = 'VitalSense Sync seamlessly bridges your Apple Health data with the VitalSense monitoring platform, providing secure health data synchronization and basic emergency detection.'
}

Write-Host '📱 Updating iOS Project Files' -ForegroundColor Cyan
Write-Host '=============================' -ForegroundColor Cyan

# Update Info.plist (already done, but check)
$infoPlist = Join-Path $ProjectRoot 'ios\Info.plist'
Update-FileContent $infoPlist $AppNameReplacements 'iOS Info.plist display name'

# Update Xcode project file
$xcodeProjFile = Join-Path $ProjectRoot 'ios\HealthKitBridge.xcodeproj\project.pbxproj'
$xcodeReplacements = $BundleIdReplacements + $AppNameReplacements
Update-FileContent $xcodeProjFile $xcodeReplacements 'Xcode project bundle identifiers'

# Update Swift app file
$appSwiftFile = Join-Path $ProjectRoot 'ios\HealthKitBridge\HealthKitBridgeApp.swift'
$swiftReplacements = @{
  'struct HealthKitBridgeApp' = 'struct VitalSenseSyncApp'
}
Update-FileContent $appSwiftFile $swiftReplacements 'Swift app struct name'

Write-Host ''
Write-Host '📄 Updating App Store Materials' -ForegroundColor Cyan
Write-Host '===============================' -ForegroundColor Cyan

# Update App Store submission guide
$submissionGuide = Join-Path $ProjectRoot 'APP_STORE_SUBMISSION_GUIDE.md'
$guideReplacements = $AppNameReplacements + $BundleIdReplacements + @{
  'VitalSense - Fall Risk Monitor' = 'VitalSense Sync'
  'Health insights & fall safety'   = 'Health Data Bridge'
}
Update-FileContent $submissionGuide $guideReplacements 'App Store submission guide'

# Update today's action plan
$todayPlan = Join-Path $ProjectRoot 'APP_STORE_TODAY_PLAN.md'
$planReplacements = $AppNameReplacements + $BundleIdReplacements + @{
  'VitalSense - Fall Risk Monitor' = 'VitalSense Sync'
  'Fall Risk Monitor'               = 'Sync'
}
Update-FileContent $todayPlan $planReplacements "Today's action plan"

# Update app store prep script
$prepScript = Join-Path $ProjectRoot 'scripts\app-store-prep.ps1'
$scriptReplacements = $AppNameReplacements + $BundleIdReplacements + @{
  'VitalSense - Fall Risk Monitor' = 'VitalSense Sync'
  'Health insights & fall safety'   = 'Health Data Bridge'
}
Update-FileContent $prepScript $scriptReplacements 'App store prep script'

Write-Host ''
Write-Host '📋 Updating Metadata Files' -ForegroundColor Cyan
Write-Host '===========================' -ForegroundColor Cyan

# Update app metadata JSON
$metadataFile = Join-Path $ProjectRoot 'app-store-metadata.json'
if (Test-Path $metadataFile) {
  $metadataReplacements = $AppNameReplacements + $BundleIdReplacements + @{
    '"AppName": "VitalSense - Fall Risk Monitor"' = '"AppName": "VitalSense Sync"'
    '"Subtitle": "Health insights & fall safety"'  = '"Subtitle": "Health Data Bridge"'
    '"BundleId": "dev.andernet.healthkitbridge"'   = '"BundleId": "dev.andernet.VitalSense.sync"'
    '"Category": "Medical"'                        = '"Category": "Medical"'
  }
  Update-FileContent $metadataFile $metadataReplacements 'App metadata JSON'
}

Write-Host ''
Write-Host '📊 REBRANDING SUMMARY' -ForegroundColor Cyan
Write-Host '=====================' -ForegroundColor Cyan

if ($updatedFiles.Count -gt 0) {
  Write-Host "✅ Successfully updated $($updatedFiles.Count) files:" -ForegroundColor Green
  foreach ($file in $updatedFiles) {
    $relativePath = $file -replace [regex]::Escape($ProjectRoot), ''
    Write-Host "   • $relativePath" -ForegroundColor White
  }
} else {
  Write-Host 'ℹ️ No files needed updates' -ForegroundColor Yellow
}

if ($errors.Count -gt 0) {
  Write-Host ''
  Write-Host '❌ Errors encountered:' -ForegroundColor Red
  foreach ($error in $errors) {
    Write-Host "   • $error" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '🎯 NEXT STEPS' -ForegroundColor Cyan
Write-Host '=============' -ForegroundColor Cyan

if ($DryRun) {
  Write-Host '💡 This was a dry run. To apply changes, run:' -ForegroundColor Yellow
  Write-Host '   pwsh -File scripts/rebrand-VitalSense-sync.ps1' -ForegroundColor White
} else {
  Write-Host '✅ Rebranding complete! Updated app name and bundle ID.' -ForegroundColor Green
  Write-Host ''
  Write-Host '📱 Updated App Identity:' -ForegroundColor White
  Write-Host '   Name: VitalSense Sync' -ForegroundColor Green
  Write-Host '   Bundle ID: dev.andernet.VitalSense.sync' -ForegroundColor Green
  Write-Host '   Category: Medical' -ForegroundColor Green
  Write-Host '   Purpose: Health data sync and basic monitoring' -ForegroundColor Green
  Write-Host ''
  Write-Host '🚀 Ready for App Store submission with new branding!' -ForegroundColor Green
  Write-Host ''
  Write-Host 'Next: Open Xcode and verify project builds correctly' -ForegroundColor Yellow
  Write-Host 'Command: open ios/HealthKitBridge.xcodeproj' -ForegroundColor White
}

Write-Host ''
Write-Host '📋 For complete ecosystem plan, see: VitalSense_ECOSYSTEM_PLAN.md' -ForegroundColor Cyan
