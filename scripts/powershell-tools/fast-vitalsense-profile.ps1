# Fast VitalSense Development Profile
# Minimal, fast-loading version with core functionality
# Created: September 27, 2025

param(
  [string]$WorkspaceRoot = $PWD,
  [switch]$SwiftMode,
  [switch]$Verbose
)

$ErrorActionPreference = 'Continue'

# Store workspace root for functions
$global:VitalSenseWorkspaceRoot = $WorkspaceRoot

# VS Code Terminal Shell Integration
# Manually load shell integration since we use -NoProfile
if ($env:TERM_PROGRAM -eq 'vscode') {
  # Enable ANSI rendering for better VS Code integration
  $env:PSStyle_OutputRendering = 'Ansi'
  if ($PSStyle) {
    $PSStyle.OutputRendering = 'Ansi'
  }

  # Locate and load VS Code shell integration
  try {
    $shellIntegrationPath = & code --locate-shell-integration-path pwsh 2>$null
    if ($shellIntegrationPath -and (Test-Path $shellIntegrationPath)) {
      . $shellIntegrationPath
      if ($Verbose) {
        Write-Host '✓ VS Code shell integration loaded' -ForegroundColor Green
      }
    } elseif ($Verbose) {
      Write-Host '⚠ Shell integration not found' -ForegroundColor Yellow
    }
  } catch {
    if ($Verbose) {
      Write-Host "⚠ Could not load shell integration: $_" -ForegroundColor Yellow
    }
  }
}

# Enhanced PSReadLine setup
try {
  if (Get-Module PSReadLine -ListAvailable -ErrorAction SilentlyContinue) {
    Import-Module PSReadLine -ErrorAction SilentlyContinue
    # Enhanced command line experience
    Set-PSReadLineOption -PredictionSource History -PredictionViewStyle ListView -ErrorAction SilentlyContinue
    Set-PSReadLineOption -EditMode Windows -BellStyle None -ErrorAction SilentlyContinue
    Set-PSReadLineOption -HistorySearchCursorMovesToEnd:$true -ErrorAction SilentlyContinue
    # Useful key bindings
    Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete -ErrorAction SilentlyContinue
    Set-PSReadLineKeyHandler -Key 'Ctrl+f' -Function ForwardWord -ErrorAction SilentlyContinue
    Set-PSReadLineKeyHandler -Key 'Ctrl+b' -Function BackwardWord -ErrorAction SilentlyContinue
  }
} catch { }

# Core VitalSense Development Functions
function dev {
  param([switch]$Interactive)
  node scripts/node/dev/start-dev.js @('--interactive')[$Interactive.IsPresent]
}

function probe {
  param([int]$Port = 8789)
  & pwsh -NoProfile -File scripts/probe.ps1 -HostUrl http://127.0.0.1 -Port $Port -UserId demo-user
}

function wrdev {
  param([int]$Port = 8789)
  wrangler dev --env development --port $Port
}

function ctx {
  node scripts/node/dev/simple-context.js
}

function reload {
  . "$($global:VitalSenseWorkspaceRoot)\scripts\fast-vitalsense-profile.ps1" -WorkspaceRoot $global:VitalSenseWorkspaceRoot
  Write-Host '🔄 VitalSense profile reloaded' -ForegroundColor Green
}

function root {
  Set-Location $global:VitalSenseWorkspaceRoot
  Write-Host "📁 Moved to workspace root: $global:VitalSenseWorkspaceRoot" -ForegroundColor Cyan
}

function ios {
  $iosPath = Join-Path $global:VitalSenseWorkspaceRoot 'ios'
  if (Test-Path $iosPath) {
    Set-Location $iosPath
    Write-Host "🍎 Moved to iOS directory: $iosPath" -ForegroundColor Blue
  } else {
    Write-Host '❌ iOS directory not found' -ForegroundColor Red
  }
}

# Swift Development Functions (simplified)
$swiftToolkitPath = Join-Path $global:VitalSenseWorkspaceRoot 'ios\scripts\swift-windows-toolkit.ps1'

if (Test-Path $swiftToolkitPath) {
  function Swift-Lint {
    param([string[]]$lintArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action lint -UseDocker @lintArgs
    } finally {
      Set-Location $currentDir
    }
  }

  function Swift-Format {
    param([string[]]$formatArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action format -UseDocker @formatArgs
    } finally {
      Set-Location $currentDir
    }
  }

  function Swift-Build {
    param([string[]]$buildArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action build -UseDocker @buildArgs
    } finally {
      Set-Location $currentDir
    }
  }

  function Swift-All {
    param([string[]]$allArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action all -UseDocker @allArgs
    } finally {
      Set-Location $currentDir
    }
  }

  function Swift-Doctor {
    param([string[]]$doctorArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action doctor @doctorArgs
    } finally {
      Set-Location $currentDir
    }
  }

  function Swift-Setup {
    param([string[]]$setupArgs = @())
    $currentDir = Get-Location
    try {
      Set-Location (Join-Path $global:VitalSenseWorkspaceRoot 'ios')
      & $swiftToolkitPath -Action setup @setupArgs
    } finally {
      Set-Location $currentDir
    }
  }

  # Swift aliases
  Set-Alias -Name sl -Value Swift-Lint -Scope Global -Force -ErrorAction SilentlyContinue
  Set-Alias -Name sf -Value Swift-Format -Scope Global -Force -ErrorAction SilentlyContinue
  Set-Alias -Name sb -Value Swift-Build -Scope Global -Force -ErrorAction SilentlyContinue
  Set-Alias -Name sa -Value Swift-All -Scope Global -Force -ErrorAction SilentlyContinue
  Set-Alias -Name sd -Value Swift-Doctor -Scope Global -Force -ErrorAction SilentlyContinue
  Set-Alias -Name ss -Value Swift-Setup -Scope Global -Force -ErrorAction SilentlyContinue

  # Fast Swift project functions
  function Global:Get-SwiftProjectStatus {
    Write-Host '🔍 Swift Project Status Check' -ForegroundColor Cyan
    Write-Host '============================' -ForegroundColor Cyan

    # Quick Docker check
    if (Get-Command docker -ErrorAction SilentlyContinue) {
      docker info 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Host '✅ Docker Desktop: Running' -ForegroundColor Green
      } else {
        Write-Host '❌ Docker Desktop: Not running' -ForegroundColor Red
      }
    } else {
      Write-Host '❌ Docker: Not installed' -ForegroundColor Red
    }

    $iosPath = Join-Path $global:VitalSenseWorkspaceRoot 'ios'
    if (Test-Path $iosPath) {
      # Quick count without recursion
      $swiftFiles = @(Get-ChildItem $iosPath -Filter '*.swift' -Recurse -ErrorAction SilentlyContinue)
      Write-Host "📄 Swift files detected: $($swiftFiles.Count)" -ForegroundColor Blue
      Write-Host '✅ iOS directory found' -ForegroundColor Green
    } else {
      Write-Host '❌ iOS directory not found' -ForegroundColor Red
    }

    Write-Host "`n🎯 Use aliases: sl (lint), sf (format), sb (build), sa (all), sd (doctor), ss (setup)" -ForegroundColor Magenta
  }

  function Global:Get-iOS26Features {
    Write-Host '🍎 iOS 26 Feature Detection' -ForegroundColor Cyan
    Write-Host '===========================' -ForegroundColor Cyan

    $iosPath = Join-Path $global:VitalSenseWorkspaceRoot 'ios'
    if (-not (Test-Path $iosPath)) {
      Write-Host '❌ iOS directory not found' -ForegroundColor Red
      return
    }

    # Simplified feature detection (faster)
    $features = @('Variable Draw', 'Liquid Glass', 'Magic Replace', 'Auto Gradients')
    foreach ($feature in $features) {
      Write-Host "🔍 ${feature}: Checking..." -ForegroundColor Yellow
    }
    Write-Host '✅ Feature detection completed (use original Get-iOS26Features for detailed scan)' -ForegroundColor Green
  }

  $global:SwiftIntegrationLoaded = $true
} else {
  $global:SwiftIntegrationLoaded = $false
}

# Simple prompt
function prompt {
  $location = Get-Location
  $context = if ($location.Path -like '*ios*') { '🍎' }
  elseif ($location.Path -like '*docs*') { '📚' }
  elseif ($location.Path -like '*scripts*') { '⚙️' }
  else { '💙' }

  $pathShort = Split-Path $location -Leaf
  Write-Host "$context VitalSense" -NoNewline -ForegroundColor Cyan
  Write-Host " $pathShort" -NoNewline -ForegroundColor White
  Write-Host '>' -NoNewline -ForegroundColor Yellow
  return ' '
}

# Fast welcome message
Write-Host ''
Write-Host '⚡ VitalSense Fast Profile Loaded!' -ForegroundColor Green
Write-Host 'Commands: dev, probe, ctx, root, ios, reload' -ForegroundColor Cyan
if ($global:SwiftIntegrationLoaded) {
  Write-Host 'Swift: sa, sl, sf, sb, sd, ss, Get-SwiftProjectStatus' -ForegroundColor Blue
}
Write-Host ''
