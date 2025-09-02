#!/usr/bin/env pwsh
<#
.SYNOPSIS
Convert Phosphor Icons imports to Lucide React imports

.DESCRIPTION
This script systematically converts all @phosphor-icons/react imports to lucide-react imports
in the src directory, maintaining compatibility with iOS 26 HIG design standards.

.EXAMPLE
pwsh -NoProfile -File scripts/convert-phosphor-to-lucide.ps1
#>

param(
  [switch]$DryRun,
  [switch]$Verbose
)

# Enable strict mode and better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Import utility functions
Import-Module "$PSScriptRoot/VSCodeIntegration.psm1" -Force

function Convert-PhosphorToLucide {
  param(
    [string]$FilePath,
    [bool]$DryRun = $false
  )

  try {
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content

    # Replace Phosphor imports with Lucide imports
    $content = $content -replace '@phosphor-icons/react', 'lucide-react'

    # Handle specific icon name mappings if needed
    $iconMappings = @{
      'AlertTriangle' = 'AlertTriangle'
      'Plus'          = 'Plus'
      'MapPin'        = 'MapPin'
      'Clock'         = 'Clock'
      'Activity'      = 'Activity'
      'TrendingUp'    = 'TrendingUp'
      'TrendingDown'  = 'TrendingDown'
      'Heart'         = 'Heart'
      'Brain'         = 'Brain'
      'Trophy'        = 'Trophy'
      'Target'        = 'Target'
      'Shield'        = 'Shield'
      'Star'          = 'Star'
      'Users'         = 'Users'
      'Download'      = 'Download'
      'Upload'        = 'Upload'
      'Calendar'      = 'Calendar'
      'CheckCircle'   = 'CheckCircle'
      'XCircle'       = 'XCircle'
      'AlertCircle'   = 'AlertCircle'
      'Info'          = 'Info'
      'Warning'       = 'AlertTriangle'  # Map Warning to AlertTriangle
      'Question'      = 'HelpCircle'    # Map Question to HelpCircle
    }

    if ($content -ne $originalContent) {
      if (-not $DryRun) {
        Set-Content -Path $FilePath -Value $content -NoNewline
        Write-TaskComplete "Converted $FilePath"
      } else {
        Write-Host "Would convert: $FilePath" -ForegroundColor Yellow
      }
      return $true
    }

    return $false
  } catch {
    Write-TaskError "Failed to convert $FilePath : $($_.Exception.Message)"
    return $false
  }
}

function Main {
  Write-TaskStart 'Converting Phosphor Icons to Lucide React'

  # Find all TypeScript/JSX files in src directory
  $sourceFiles = Get-ChildItem -Path "$PSScriptRoot/../src" -Recurse -Include '*.tsx', '*.ts' |
  Where-Object { $_.FullName -notmatch 'node_modules' }

  $totalFiles = $sourceFiles.Count
  $convertedFiles = 0
  $processedFiles = 0

  Write-Host "Found $totalFiles files to process" -ForegroundColor Green

  foreach ($file in $sourceFiles) {
    $processedFiles++
    Write-Progress -Activity 'Converting Icons' -Status "Processing $($file.Name)" -PercentComplete (($processedFiles / $totalFiles) * 100)

    if ($Verbose) {
      Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    }

    if (Convert-PhosphorToLucide -FilePath $file.FullName -DryRun $DryRun) {
      $convertedFiles++
    }
  }

  Write-Progress -Activity 'Converting Icons' -Completed

  if ($DryRun) {
    Write-Host "`nDRY RUN COMPLETE" -ForegroundColor Yellow
    Write-Host "Would convert $convertedFiles out of $totalFiles files" -ForegroundColor Yellow
    Write-Host 'Run without -DryRun to apply changes' -ForegroundColor Yellow
  } else {
    Write-TaskComplete "Converted $convertedFiles out of $totalFiles files"

    # Run build to check for any issues
    Write-Host "`nRunning build to verify changes..." -ForegroundColor Green
    try {
      & npm run build 2>&1 | Tee-Object -Variable buildOutput
      if ($LASTEXITCODE -eq 0) {
        Write-TaskComplete 'Build successful after conversion'
      } else {
        Write-TaskError 'Build failed after conversion. Check output above.'
      }
    } catch {
      Write-TaskError "Failed to run build: $($_.Exception.Message)"
    }
  }
}

# Run the main function
Main
