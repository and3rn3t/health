# Quick Shell Integration Reload
# Run this in any terminal to reload shell integration

Write-Host "`n🔄 Reloading VitalSense Profile with Shell Integration..." -ForegroundColor Cyan

# Determine which profile to reload
$profilePath = $null
if (Test-Path "$PSScriptRoot\fast-vitalsense-profile.ps1") {
  $profilePath = "$PSScriptRoot\fast-vitalsense-profile.ps1"
} elseif (Test-Path "$PSScriptRoot\enhanced-vitalsense-profile.ps1") {
  $profilePath = "$PSScriptRoot\enhanced-vitalsense-profile.ps1"
} else {
  # Try to find from workspace root
  $workspaceRoot = $env:VITALSENSE_WORKSPACE_ROOT
  if (-not $workspaceRoot) {
    $workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  }
  $profilePath = Join-Path $workspaceRoot 'scripts\powershell-tools\fast-vitalsense-profile.ps1'
}

if ($profilePath -and (Test-Path $profilePath)) {
  Write-Host "📄 Loading profile: $profilePath" -ForegroundColor Gray
  . $profilePath -WorkspaceRoot $global:VitalSenseWorkspaceRoot -Verbose
  Write-Host '✅ Profile reloaded successfully!' -ForegroundColor Green

  # Test shell integration
  Write-Host "`n🔍 Testing shell integration..." -ForegroundColor Yellow
  if (Test-Path function:__vsc_prompt_cmd_original) {
    Write-Host '✅ Shell integration is ACTIVE' -ForegroundColor Green
    Write-Host '   Copilot can now capture terminal output' -ForegroundColor Gray
  } else {
    Write-Host '⚠️  Shell integration not detected' -ForegroundColor Yellow
    Write-Host '   You may need to:' -ForegroundColor Gray
    Write-Host '   1. Close this terminal' -ForegroundColor White
    Write-Host "   2. Open a new terminal (Ctrl+Shift+`)" -ForegroundColor White
  }
} else {
  Write-Host "❌ Profile not found at: $profilePath" -ForegroundColor Red
  Write-Host '   Please run from workspace root or check file location' -ForegroundColor Yellow
}

Write-Host ''
