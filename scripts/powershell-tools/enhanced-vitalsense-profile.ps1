# Enhanced VitalSense Development Profile
# Combines web development, Swift/iOS development, and VS Code optimization
# Created: September 27, 2025

param(
  [string]$WorkspaceRoot = $PWD,
  [switch]$SwiftMode,
  [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'  # Use Continue instead of Stop for profile loading

# VS Code Terminal Shell Integration (optimized)
try {
  if ($env:TERM_PROGRAM -eq 'vscode' -and (Get-Command code -ErrorAction SilentlyContinue)) {
    # Only try VS Code integration if code command is available
    $integrationPath = code --locate-shell-integration-path pwsh 2>$null
    if ($integrationPath -and (Test-Path $integrationPath)) {
      . $integrationPath
    }
    $env:PSStyle_OutputRendering = 'Ansi'
    $PSStyle.OutputRendering = 'Ansi'
  }
} catch {
  # Continue without VS Code integration if unavailable
}

# Import PSReadLine for enhanced command line experience
try {
  Import-Module PSReadLine -ErrorAction SilentlyContinue
  Set-PSReadLineOption -HistorySearchCursorMovesToEnd:$true -PredictionSource History -PredictionViewStyle ListView
  Set-PSReadLineOption -EditMode Windows -BellStyle None
  Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
  Set-PSReadLineKeyHandler -Key 'Ctrl+f' -Function ForwardWord
  Set-PSReadLineKeyHandler -Key 'Ctrl+b' -Function BackwardWord
} catch { }

# Import project utilities (only if needed)
$projectUtilities = Join-Path $WorkspaceRoot 'scripts\VSCodeIntegration.psm1'
if (Test-Path $projectUtilities -ErrorAction SilentlyContinue) {
  Import-Module $projectUtilities -Force -ErrorAction SilentlyContinue
}

# Store workspace root globally to avoid recalculation
$global:VitalSenseWorkspaceRoot = $WorkspaceRoot

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

function nixpath([string]$p) {
  $p -replace '\\', '/'
}

function ctx {
  node scripts/node/dev/simple-context.js
}

function reload {
  . $PSCommandPath
  Write-Host '🔄 VitalSense profile reloaded' -ForegroundColor Green
}

# Navigation helpers
function root {
  Set-Location $WorkspaceRoot
  Write-Host "📁 Moved to workspace root: $WorkspaceRoot" -ForegroundColor Cyan
}

function ios {
  $iosPath = Join-Path $WorkspaceRoot 'ios'
  if (Test-Path $iosPath) {
    Set-Location $iosPath
    Write-Host "🍎 Moved to iOS directory: $iosPath" -ForegroundColor Blue
  } else {
    Write-Host '❌ iOS directory not found' -ForegroundColor Red
  }
}

# Swift Development Integration
$swiftProfilePath = Join-Path $WorkspaceRoot 'ios\scripts\SwiftDevelopmentProfile.ps1'
$swiftToolkitPath = Join-Path $WorkspaceRoot 'ios\scripts\swift-windows-toolkit.ps1'

# Check for Swift integration availability
$swiftAvailable = $false
try {
  $swiftAvailable = (Test-Path $swiftProfilePath -ErrorAction SilentlyContinue) -and (Test-Path $swiftToolkitPath -ErrorAction SilentlyContinue)
} catch {
  $swiftAvailable = $false
}

if ($swiftAvailable) {
  # Load Swift functions with enhanced error handling
  try {
    # Swift Development Functions with proper path resolution
    function Swift-Lint {
      param([string[]]$lintArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($lintArgs.Count -eq 0) {
          & $swiftToolkitPath -Action lint -UseDocker
        } else {
          & $swiftToolkitPath -Action lint -UseDocker @lintArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    function Swift-Format {
      param([string[]]$formatArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($formatArgs.Count -eq 0) {
          & $swiftToolkitPath -Action format -UseDocker
        } else {
          & $swiftToolkitPath -Action format -UseDocker @formatArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    function Swift-Build {
      param([string[]]$buildArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($buildArgs.Count -eq 0) {
          & $swiftToolkitPath -Action build -UseDocker
        } else {
          & $swiftToolkitPath -Action build -UseDocker @buildArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    function Swift-All {
      param([string[]]$allArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($allArgs.Count -eq 0) {
          & $swiftToolkitPath -Action all -UseDocker
        } else {
          & $swiftToolkitPath -Action all -UseDocker @allArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    function Swift-Doctor {
      param([string[]]$doctorArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($doctorArgs.Count -eq 0) {
          & $swiftToolkitPath -Action doctor
        } else {
          & $swiftToolkitPath -Action doctor @doctorArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    function Swift-Setup {
      param([string[]]$setupArgs = @())
      $currentDir = Get-Location
      try {
        Set-Location (Join-Path $WorkspaceRoot 'ios')
        if ($setupArgs.Count -eq 0) {
          & $swiftToolkitPath -Action setup
        } else {
          & $swiftToolkitPath -Action setup @setupArgs
        }
      } finally {
        Set-Location $currentDir
      }
    }

    # Swift development aliases
    Set-Alias -Name sl -Value Swift-Lint -Scope Global -Force -Description 'Swift Lint via Docker'
    Set-Alias -Name sf -Value Swift-Format -Scope Global -Force -Description 'Swift Format via Docker'
    Set-Alias -Name sb -Value Swift-Build -Scope Global -Force -Description 'Swift Build project'
    Set-Alias -Name sa -Value Swift-All -Scope Global -Force -Description 'Swift All (lint + format + build)'
    Set-Alias -Name sd -Value Swift-Doctor -Scope Global -Force -Description 'Swift Doctor diagnostics'
    Set-Alias -Name ss -Value Swift-Setup -Scope Global -Force -Description 'Swift Setup dependencies'

    # Load additional Swift functions (define them directly to avoid loading issues)
    if ($Verbose) {
      Write-Host '🔧 Loading Swift project functions' -ForegroundColor Cyan
    }

    # Define Get-SwiftProjectStatus function directly
    function Global:Get-SwiftProjectStatus {
      Write-Host '🔍 Swift Project Status Check' -ForegroundColor Cyan
      Write-Host '============================' -ForegroundColor Cyan

      # Use cached workspace root for better performance
      $workspaceRoot = if ($global:VitalSenseWorkspaceRoot) { $global:VitalSenseWorkspaceRoot } else { Get-Location }

      # Check Docker
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

      $iosPath = Join-Path $workspaceRoot 'ios'
      if (-not (Test-Path $iosPath)) {
        Write-Host "❌ iOS directory not found at: $iosPath" -ForegroundColor Red
        return
      }

      # Count Swift files
      $swiftFiles = Get-ChildItem -Path $iosPath -Recurse -Filter '*.swift' -ErrorAction SilentlyContinue | Measure-Object
      Write-Host "📄 Swift files detected: $($swiftFiles.Count)" -ForegroundColor Blue

      # Check for VitalSense branding
      $brandingFiles = Get-ChildItem -Path $iosPath -Recurse -Filter '*.swift' -ErrorAction SilentlyContinue | Select-String -Pattern 'VitalSense' | Select-Object -First 5
      if ($brandingFiles) {
        Write-Host '✅ VitalSense branding detected in Swift files' -ForegroundColor Green
      } else {
        Write-Host '⚠️  VitalSense branding not found in Swift files' -ForegroundColor Yellow
      }

      Write-Host "`n🎯 Use aliases: sl (lint), sf (format), sb (build), sa (all), sd (doctor), ss (setup)" -ForegroundColor Magenta
    }

    # Define Get-iOS26Features function directly
    function Global:Get-iOS26Features {
      Write-Host '🍎 iOS 26 Feature Detection' -ForegroundColor Cyan
      Write-Host '===========================' -ForegroundColor Cyan

      # Use cached workspace root for better performance
      $workspaceRoot = if ($global:VitalSenseWorkspaceRoot) { $global:VitalSenseWorkspaceRoot } else { Get-Location }

      $features = @(
        @{ Name = 'Variable Draw'; Pattern = 'variableDraw|VariableDraw|variable.*draw' },
        @{ Name = 'Liquid Glass'; Pattern = 'liquidGlass|LiquidGlass|liquid.*glass' },
        @{ Name = 'Magic Replace'; Pattern = 'magicReplace|MagicReplace|magic.*replace' },
        @{ Name = 'SF Symbols 7'; Pattern = 'sfSymbols.*7|SFSymbols.*7|SF7|SFSymbols7Integration' },
        @{ Name = 'Auto Gradients'; Pattern = 'autoGradient|AutoGradient|auto.*gradient' }
      )

      $iosPath = Join-Path $workspaceRoot 'ios'
      if (-not (Test-Path $iosPath)) {
        Write-Host "❌ iOS directory not found at: $iosPath" -ForegroundColor Red
        return
      }

      foreach ($feature in $features) {
        $featureMatches = Get-ChildItem -Path $iosPath -Recurse -Filter '*.swift' -ErrorAction SilentlyContinue | Select-String -Pattern $feature.Pattern
        if ($featureMatches) {
          Write-Host "✅ $($feature.Name): Found in $($featureMatches.Count) files" -ForegroundColor Green
        } else {
          Write-Host "❌ $($feature.Name): Not implemented" -ForegroundColor Red
        }
      }
    }

    $global:SwiftIntegrationLoaded = $true

  } catch {
    $errorMessage = $_.Exception.Message
    $global:SwiftIntegrationLoaded = $false

    # Provide more specific error information (only for verbose mode)
    if ($Verbose) {
      if ($errorMessage -like '*execution policy*' -or $errorMessage -like '*security*') {
        Write-Host 'ℹ️  Swift integration using safe mode (execution policy bypass)' -ForegroundColor Cyan
      } elseif ($errorMessage -like '*not found*' -or $errorMessage -like '*path*') {
        Write-Host 'ℹ️  Swift integration files not found - iOS development features limited' -ForegroundColor Cyan
      } else {
        Write-Host "ℹ️  Swift integration using fallback mode: $errorMessage" -ForegroundColor Cyan
      }
    }

    if ($Verbose) {
      Write-Host "Full error details: $($_.Exception.ToString())" -ForegroundColor Gray
    }
  }
} else {
  $global:SwiftIntegrationLoaded = $false
}

# Enhanced prompt with git and project context
function prompt {
  $location = Get-Location
  $projectName = 'VitalSense'

  # Determine context
  $context = ''
  if ($location.Path -like '*\ios*') {
    $context = '🍎 iOS'
  } elseif ($location.Path -like '*\docs*') {
    $context = '📚 Docs'
  } elseif ($location.Path -like '*\scripts*') {
    $context = '⚙️ Scripts'
  } elseif ($location.Path -like '*\src*') {
    $context = '🌐 Web'
  } else {
    $context = '💙 Root'
  }

  # Git branch info (if available)
  $gitBranch = ''
  try {
    $branch = git branch --show-current 2>$null
    if ($branch) {
      $gitBranch = " (🌿 $branch)"
    }
  } catch { }

  $pathShort = Split-Path $location -Leaf
  Write-Host "$context $projectName" -NoNewline -ForegroundColor Cyan
  Write-Host $gitBranch -NoNewline -ForegroundColor Green
  Write-Host " $pathShort" -NoNewline -ForegroundColor White
  Write-Host '>' -NoNewline -ForegroundColor Yellow
  return ' '
}

# Display welcome message
Write-Host ''
Write-Host '💙 VitalSense Enhanced Development Environment' -ForegroundColor Cyan
Write-Host '===============================================' -ForegroundColor Cyan
Write-Host '🌐 Web Development:' -ForegroundColor Blue
Write-Host '   dev          - Start development server' -ForegroundColor Gray
Write-Host '   probe        - Health check endpoints' -ForegroundColor Gray
Write-Host '   wrdev        - Wrangler dev server' -ForegroundColor Gray
Write-Host '   ctx          - Get context information' -ForegroundColor Gray
Write-Host ''
Write-Host '📁 Navigation:' -ForegroundColor Blue
Write-Host '   root         - Go to workspace root' -ForegroundColor Gray
Write-Host '   ios          - Go to iOS directory' -ForegroundColor Gray
Write-Host '   reload       - Reload this profile' -ForegroundColor Gray
Write-Host ''

if ($global:SwiftIntegrationLoaded) {
  Write-Host '🍎 Swift Development:' -ForegroundColor Blue
  Write-Host '   sa           - Swift All (lint + format + build)' -ForegroundColor Gray
  Write-Host '   sl           - Swift Lint' -ForegroundColor Gray
  Write-Host '   sf           - Swift Format' -ForegroundColor Gray
  Write-Host '   sb           - Swift Build' -ForegroundColor Gray
  Write-Host '   sd           - Swift Doctor' -ForegroundColor Gray
  Write-Host '   ss           - Swift Setup' -ForegroundColor Gray
  Write-Host '   Get-SwiftProjectStatus    - Project overview' -ForegroundColor Gray
  Write-Host '   Get-iOS26Features         - iOS 26 feature detection' -ForegroundColor Gray
  Write-Host ''
}

Write-Host '🔧 Utilities:' -ForegroundColor Blue
Write-Host '   nixpath      - Convert Windows path to Unix' -ForegroundColor Gray
Write-Host ''
