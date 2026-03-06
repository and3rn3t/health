# VitalSense Unified Profile Loader
# Automatically detects context and loads appropriate development profile
# Created: September 27, 2025

function Initialize-VitalSenseEnvironment {
  param(
    [string]$WorkspaceRoot = $PWD,
    [switch]$Verbose
  )

  $iOSProfilePath = Join-Path $WorkspaceRoot 'ios\scripts\SwiftDevelopmentProfile.ps1'
  $bannerPath = Join-Path $WorkspaceRoot 'scripts\vitalsense-banner.ps1'

  # Check current directory context
  $currentPath = $PWD.Path
  $isInIOSContext = $currentPath -like '*\ios*' -or $currentPath -like '*ios'

  if ($Verbose) {
    Write-Host '🔍 Context Detection:' -ForegroundColor Cyan
    Write-Host "   Current Path: $currentPath" -ForegroundColor Gray
    Write-Host "   iOS Context: $isInIOSContext" -ForegroundColor Gray
    Write-Host "   iOS Profile: $(Test-Path $iOSProfilePath)" -ForegroundColor Gray
  }

  # Load appropriate profile based on context
  if ((Test-Path $iOSProfilePath) -and $isInIOSContext) {
    if ($Verbose) { Write-Host '📱 Loading Swift Development Profile...' -ForegroundColor Blue }
    try {
      . $iOSProfilePath
      Write-Host '🍎 Swift Development Environment Loaded' -ForegroundColor Green
      Write-Host '   Commands: sa, sd, ss, Get-iOS26Features, Get-SwiftProjectStatus' -ForegroundColor Gray
    } catch {
      if ($Verbose) { Write-Warning "Failed to load Swift profile: $($_.Exception.Message)" }
      Write-Host '💙 VitalSense Development Environment (Swift profile failed)' -ForegroundColor Blue
    }
  } elseif (Test-Path $iOSProfilePath) {
    if ($Verbose) { Write-Host '📱 Loading Swift Development Profile (iOS available)...' -ForegroundColor Blue }
    try {
      # Change to iOS directory temporarily to load the profile, then return
      $originalLocation = $PWD
      Set-Location (Join-Path $WorkspaceRoot 'ios')
      . $iOSProfilePath
      Set-Location $originalLocation
      Write-Host '🍎 VitalSense + Swift Development Environment' -ForegroundColor Green
    } catch {
      Set-Location $originalLocation  # Ensure we return to original location on error
      if ($Verbose) { Write-Warning "Failed to load Swift profile: $($_.Exception.Message)" }
      Write-Host '💙 VitalSense Development Environment (Swift profile unavailable)' -ForegroundColor Blue
    }
  } elseif (Test-Path $bannerPath) {
    if ($Verbose) { Write-Host '🌐 Loading VitalSense Banner...' -ForegroundColor Blue }
    try {
      . $bannerPath
    } catch {
      if ($Verbose) { Write-Warning "Failed to load banner: $($_.Exception.Message)" }
      Write-Host '💙 VitalSense Development Environment' -ForegroundColor Blue
    }
  } else {
    Write-Host '💙 VitalSense Development Environment' -ForegroundColor Blue
    Write-Host "   Workspace: $(Split-Path $WorkspaceRoot -Leaf)" -ForegroundColor Gray
  }

  # Additional environment setup
  if ($env:POWERSHELL_TELEMETRY_OPTOUT -ne '1') {
    $env:POWERSHELL_TELEMETRY_OPTOUT = '1'
  }

  # Set helpful aliases for all contexts (force override existing aliases)
  function global:Invoke-Reload {
    . "$PSScriptRoot\unified-profile-loader.ps1"
  }
  Set-Alias -Name 'reload' -Value 'Invoke-Reload' -Scope Global -Force -Description 'Reload VitalSense profile'

  function global:Get-CurrentContext {
    Write-Host '📍 Current Context:' -ForegroundColor Cyan
    Write-Host "   Path: $PWD" -ForegroundColor Gray
    Write-Host "   iOS Available: $(Test-Path 'ios')" -ForegroundColor Gray
    Write-Host "   In iOS: $($PWD.Path -like '*\ios*')" -ForegroundColor Gray
  }
  Set-Alias -Name 'ctx' -Value 'Get-CurrentContext' -Scope Global -Force -Description 'Show current context'

  # iOS-specific context switching
  function global:Set-IOSContext {
    if (Test-Path "$PWD\ios") {
      Set-Location 'ios'
      . "$PSScriptRoot\unified-profile-loader.ps1"
    } elseif (Test-Path '..\scripts\unified-profile-loader.ps1') {
      # Already in iOS or subdirectory
      . '..\scripts\unified-profile-loader.ps1'
    } else {
      Write-Warning 'iOS directory not found in current location'
    }
  }
  Set-Alias -Name 'ios' -Value 'Set-IOSContext' -Scope Global -Force -Description 'Switch to iOS development context'

  function global:Set-RootContext {
    while ($PWD.Path -ne (Get-Item $PWD).Root.FullName) {
      if ((Test-Path 'package.json') -or (Test-Path 'health.code-workspace')) {
        break
      }
      Set-Location '..'
    }
    $scriptPath = if (Test-Path 'scripts\unified-profile-loader.ps1') {
      'scripts\unified-profile-loader.ps1'
    } else {
      "$PSScriptRoot\unified-profile-loader.ps1"
    }
    . $scriptPath
  }
  Set-Alias -Name 'root' -Value 'Set-RootContext' -Scope Global -Force -Description 'Return to project root'

  # Verify aliases are set
  if ($Verbose) {
    Write-Host '🔗 Aliases Loaded:' -ForegroundColor Green
    @('reload', 'ctx', 'ios', 'root') | ForEach-Object {
      $alias = Get-Alias -Name $_ -ErrorAction SilentlyContinue
      if ($alias) {
        Write-Host "   ✅ $_" -ForegroundColor Gray
      } else {
        Write-Host "   ❌ $_" -ForegroundColor Red
      }
    }
  }
}

# Auto-initialize when script is loaded
$workspaceRoot = if ($PSScriptRoot -like '*\scripts*') {
  $PSScriptRoot.Replace('\scripts\powershell-tools', '').Replace('\scripts', '')
} else {
  $PSScriptRoot
}

if ($args -contains '-Verbose') {
  Initialize-VitalSenseEnvironment -WorkspaceRoot $workspaceRoot -Verbose
} else {
  Initialize-VitalSenseEnvironment -WorkspaceRoot $workspaceRoot
}
