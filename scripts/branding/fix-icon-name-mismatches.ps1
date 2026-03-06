#!/usr/bin/env pwsh
<#
.SYNOPSIS
Fix icon name mismatches between Phosphor and Lucide icons

.DESCRIPTION
This script fixes specific icon name differences between Phosphor and Lucide React icons.

.EXAMPLE
pwsh -NoProfile -File scripts/fix-icon-name-mismatches.ps1
#>

# Enable strict mode and better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Import utility functions
Import-Module "$PSScriptRoot/VSCodeIntegration.psm1" -Force

function Fix-IconNameMismatches {
  param(
    [string]$FilePath
  )

  try {
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content

    # Fix icon name mismatches
    $iconMappings = @{
      'TrendUp'         = 'TrendingUp'
      'TrendDown'       = 'TrendingDown'
      'ChartLine'       = 'LineChart'
      'WifiX'           = 'WifiOff'
      'CloudArrowUp'    = 'CloudUpload'
      'BellRinging'     = 'Bell'
      'DeviceMobile'    = 'Smartphone'
      'GearSix'         = 'Settings'
      'Gear'            = 'Settings'
      'Envelope'        = 'Mail'
      'MagnifyingGlass' = 'Search'
      'ArrowsClockwise' = 'RotateCcw'
      'Sparkle'         = 'Sparkles'
      'Stethoscope'     = 'Heart'  # Lucide doesn't have stethoscope, use heart
      'TestTube'        = 'FlaskConical'
      'Network'         = 'Network'
      'Pulse'           = 'Activity'
      'FunnelSimple'    = 'Filter'
      'CalendarBlank'   = 'Calendar'
      'Waves'           = 'Waves'
    }

    foreach ($oldIcon in $iconMappings.Keys) {
      $newIcon = $iconMappings[$oldIcon]

      # Replace import statements
      $content = $content -replace "\b$oldIcon\b", $newIcon
    }

    if ($content -ne $originalContent) {
      Set-Content -Path $FilePath -Value $content -NoNewline
      Write-TaskComplete "Fixed icon names in $FilePath"
      return $true
    }

    return $false
  } catch {
    Write-TaskError "Failed to fix $FilePath : $($_.Exception.Message)"
    return $false
  }
}

function Main {
  Write-TaskStart 'Fixing icon name mismatches'

  # Find all TypeScript/JSX files in src directory
  $sourceFiles = Get-ChildItem -Path "$PSScriptRoot/../src" -Recurse -Include '*.tsx', '*.ts' |
  Where-Object { $_.FullName -notmatch 'node_modules' }

  $fixedFiles = 0

  foreach ($file in $sourceFiles) {
    if (Fix-IconNameMismatches -FilePath $file.FullName) {
      $fixedFiles++
    }
  }

  Write-TaskComplete "Fixed icon names in $fixedFiles files"

  # Run build to check for any remaining issues
  Write-Host "`nRunning build to verify changes..." -ForegroundColor Green
  try {
    & npm run build
    if ($LASTEXITCODE -eq 0) {
      Write-TaskComplete 'Build successful after fixing icon names'
    } else {
      Write-TaskError 'Build failed. There may be remaining icon issues.'
    }
  } catch {
    Write-TaskError "Failed to run build: $($_.Exception.Message)"
  }
}

# Run the main function
Main
