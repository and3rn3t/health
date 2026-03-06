# VitalSense Terminal Initializer
# This script is called by VS Code terminal profiles to initialize the VitalSense development environment
# Created: September 27, 2025

param(
  [string]$WorkspaceRoot = $PWD,
  [switch]$Verbose
)

# Clear any existing profiles to avoid conflicts
if ($PROFILE -and (Test-Path $PROFILE)) {
  Write-Host '🔄 Bypassing global PowerShell profile...' -ForegroundColor Yellow
}

# Load VitalSense unified profile
$unifiedProfilePath = Join-Path $WorkspaceRoot 'scripts\powershell-tools\unified-profile-loader.ps1'
$simpleProfilePath = Join-Path $WorkspaceRoot 'scripts\powershell-tools\simple-profile-loader.ps1'

if (Test-Path $unifiedProfilePath) {
  if ($Verbose) {
    Write-Host "📂 Loading VitalSense unified profile from: $unifiedProfilePath" -ForegroundColor Cyan
  }
  try {
    . $unifiedProfilePath -Verbose:$Verbose
  } catch {
    Write-Warning "Failed to load unified profile: $($_.Exception.Message)"
    if (Test-Path $simpleProfilePath) {
      Write-Host '🔄 Falling back to simple profile loader...' -ForegroundColor Yellow
      . $simpleProfilePath -Verbose:$Verbose
    }
  }
} elseif (Test-Path $simpleProfilePath) {
  if ($Verbose) {
    Write-Host "📂 Loading VitalSense simple profile from: $simpleProfilePath" -ForegroundColor Cyan
  }
  . $simpleProfilePath -Verbose:$Verbose
} else {
  Write-Warning 'No VitalSense profile found'
  Write-Host '💙 VitalSense Development Environment (Basic)' -ForegroundColor Blue
}

# Display welcome message
Write-Host ''
Write-Host '🚀 VitalSense Terminal Ready!' -ForegroundColor Green
Write-Host '   Available commands: reload, ctx, ios, root' -ForegroundColor Gray
Write-Host '   Swift commands: sa, sd, ss, Get-iOS26Features' -ForegroundColor Gray
Write-Host ''
