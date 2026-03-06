# VitalSense Simple Profile Loader
# A simpler version that avoids security issues with iOS profile loading
# Created: September 27, 2025

function Initialize-SimpleVitalSenseEnvironment {
  param(
    [string]$WorkspaceRoot = $PWD,
    [switch]$Verbose
  )

  if ($Verbose) {
    Write-Host '🔍 VitalSense Environment Setup:' -ForegroundColor Cyan
    Write-Host "   Workspace: $WorkspaceRoot" -ForegroundColor Gray
    Write-Host "   Current Path: $PWD" -ForegroundColor Gray
  }

  # Disable telemetry
  if ($env:POWERSHELL_TELEMETRY_OPTOUT -ne '1') {
    $env:POWERSHELL_TELEMETRY_OPTOUT = '1'
  }

  # Set helpful aliases for all contexts (force override existing aliases)
  function global:Invoke-Reload {
    $scriptPath = Join-Path $WorkspaceRoot 'scripts\powershell-tools\simple-profile-loader.ps1'
    if (Test-Path $scriptPath) {
      . $scriptPath -Verbose
    } else {
      Write-Warning "Profile script not found at: $scriptPath"
    }
  }
  Set-Alias -Name 'reload' -Value 'Invoke-Reload' -Scope Global -Force -Description 'Reload VitalSense profile'

  function global:Get-CurrentContext {
    Write-Host '📍 Current Context:' -ForegroundColor Cyan
    Write-Host "   Path: $PWD" -ForegroundColor Gray
    Write-Host "   iOS Available: $(Test-Path 'ios')" -ForegroundColor Gray
    Write-Host "   In iOS: $($PWD.Path -like '*\ios*')" -ForegroundColor Gray
    Write-Host "   Git Status: $(if (Test-Path '.git') { 'Repository' } else { 'Not a repo' })" -ForegroundColor Gray
  }
  Set-Alias -Name 'ctx' -Value 'Get-CurrentContext' -Scope Global -Force -Description 'Show current context'

  # iOS-specific context switching
  function global:Set-IOSContext {
    if (Test-Path "$PWD\ios") {
      Set-Location 'ios'
      Write-Host '📱 Switched to iOS context' -ForegroundColor Blue
    } elseif ($PWD.Path -like '*\ios*') {
      Write-Host '📱 Already in iOS context' -ForegroundColor Blue
    } else {
      Write-Warning 'iOS directory not found in current location'
    }
  }
  Set-Alias -Name 'ios' -Value 'Set-IOSContext' -Scope Global -Force -Description 'Switch to iOS development context'

  function global:Set-RootContext {
    $maxDepth = 10
    $depth = 0
    while ($PWD.Path -ne (Get-Item $PWD).Root.FullName -and $depth -lt $maxDepth) {
      if ((Test-Path 'package.json') -or (Test-Path 'health.code-workspace') -or (Test-Path 'wrangler.toml')) {
        Write-Host "🏠 Found project root: $PWD" -ForegroundColor Green
        break
      }
      Set-Location '..'
      $depth++
    }
    if ($depth -eq $maxDepth) {
      Write-Warning "Could not find project root within $maxDepth levels"
    }
  }
  Set-Alias -Name 'root' -Value 'Set-RootContext' -Scope Global -Force -Description 'Return to project root'

  # Verification
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

  Write-Host '💙 VitalSense Development Environment Ready' -ForegroundColor Blue
  Write-Host '   Commands: reload, ctx, ios, root' -ForegroundColor Gray
}

# Auto-initialize when script is loaded
$workspaceRoot = if ($PSScriptRoot -like '*\scripts*') {
  $PSScriptRoot.Replace('\scripts\powershell-tools', '').Replace('\scripts', '')
} else {
  $PSScriptRoot
}

if ($args -contains '-Verbose') {
  Initialize-SimpleVitalSenseEnvironment -WorkspaceRoot $workspaceRoot -Verbose
} else {
  Initialize-SimpleVitalSenseEnvironment -WorkspaceRoot $workspaceRoot
}
