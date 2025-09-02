#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deployment verification and troubleshooting script for Cloudflare Workers
.DESCRIPTION
    Verifies build outputs, configuration, and prepares for GitHub Actions deployment
.PARAMETER Environment
    Target environment (development or production)
.PARAMETER Deploy
    Actually deploy to Cloudflare (otherwise just verify)
.PARAMETER Fix
    Attempt to fix common deployment issues
.EXAMPLE
    .\scripts\deploy-verify.ps1 -Environment production
    .\scripts\deploy-verify.ps1 -Environment production -Deploy
#>

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('development', 'production')]
  [string]$Environment,

  [switch]$Deploy,
  [switch]$Fix
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Status {
  param([string]$Message, [string]$Type = 'Info')

  $color = switch ($Type) {
    'Success' { 'Green' }
    'Warning' { 'Yellow' }
    'Error' { 'Red' }
    default { 'Cyan' }
  }

  Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Test-DeploymentPrerequisites {
  Write-Status 'Checking deployment prerequisites...' 'Info'

  # Check Node.js version
  $nodeVersion = node --version
  Write-Status "Node.js version: $nodeVersion" 'Info'

  # Check npm version
  $npmVersion = npm --version
  Write-Status "npm version: $npmVersion" 'Info'

  # Check if .nvmrc matches
  if (Test-Path '.nvmrc') {
    $nvmrcVersion = Get-Content '.nvmrc' -Raw | Trim
    Write-Status ".nvmrc specifies: v$nvmrcVersion" 'Info'
  }

  # Check package.json engines
  if (Test-Path 'package.json') {
    $packageJson = Get-Content 'package.json' | ConvertFrom-Json
    if ($packageJson.engines) {
      Write-Status "Package.json engines: Node $($packageJson.engines.node), npm $($packageJson.engines.npm)" 'Info'
    }
  }

  # Check wrangler.toml
  if (-not (Test-Path 'wrangler.toml')) {
    Write-Status 'Missing wrangler.toml configuration' 'Error'
    return $false
  }

  Write-Status '✓ Prerequisites check passed' 'Success'
  return $true
}

function Test-BuildOutputs {
  Write-Status 'Verifying build outputs...' 'Info'

  # Check main app build
  if (-not (Test-Path 'dist/index.html')) {
    Write-Status 'Missing dist/index.html - app build failed' 'Error'
    return $false
  }

  if (-not (Test-Path 'dist/assets')) {
    Write-Status 'Missing dist/assets directory' 'Error'
    return $false
  }

  # Check worker build
  if (-not (Test-Path 'dist-worker/index.js')) {
    Write-Status 'Missing dist-worker/index.js - worker build failed' 'Error'
    return $false
  }

  # Check file sizes
  $workerSize = (Get-Item 'dist-worker/index.js').Length
  $workerSizeMB = [math]::Round($workerSize / 1MB, 2)
  Write-Status "Worker bundle size: $workerSizeMB MB" 'Info'

  if ($workerSize -gt 25MB) {
    Write-Status 'Worker bundle is too large (>25MB limit)' 'Warning'
  }

  Write-Status '✓ Build outputs verified' 'Success'
  return $true
}

function Test-WranglerConfig {
  param([string]$Env)

  Write-Status "Testing Wrangler configuration for $Env..." 'Info'

  try {
    # Test wrangler config parsing
    $configTest = npx wrangler deploy --dry-run --env $Env 2>&1

    if ($LASTEXITCODE -ne 0) {
      Write-Status 'Wrangler configuration test failed' 'Error'
      Write-Status "Output: $configTest" 'Error'
      return $false
    }

    Write-Status '✓ Wrangler configuration valid' 'Success'
    return $true
  } catch {
    Write-Status "Wrangler test failed: $($_.Exception.Message)" 'Error'
    return $false
  }
}

function Invoke-Build {
  Write-Status 'Building project...' 'Info'

  try {
    npm run build

    if ($LASTEXITCODE -ne 0) {
      Write-Status 'Build failed' 'Error'
      return $false
    }

    Write-Status '✓ Build completed successfully' 'Success'
    return $true
  } catch {
    Write-Status "Build error: $($_.Exception.Message)" 'Error'
    return $false
  }
}

function Invoke-Deploy {
  param([string]$Env)

  Write-Status "Deploying to $Env environment..." 'Info'

  try {
    npx wrangler deploy --env $Env

    if ($LASTEXITCODE -ne 0) {
      Write-Status 'Deployment failed' 'Error'
      return $false
    }

    Write-Status '✓ Deployment completed successfully' 'Success'
    return $true
  } catch {
    Write-Status "Deployment error: $($_.Exception.Message)" 'Error'
    return $false
  }
}

function Fix-CommonIssues {
  Write-Status 'Attempting to fix common deployment issues...' 'Info'

  # Clean node_modules and reinstall
  if (Test-Path 'node_modules') {
    Write-Status 'Cleaning node_modules...' 'Info'
    Remove-Item 'node_modules' -Recurse -Force
  }

  Write-Status 'Reinstalling dependencies...' 'Info'
  npm ci --prefer-offline

  # Clean build outputs
  if (Test-Path 'dist') {
    Remove-Item 'dist' -Recurse -Force
  }
  if (Test-Path 'dist-worker') {
    Remove-Item 'dist-worker' -Recurse -Force
  }

  Write-Status '✓ Common issues fixed' 'Success'
}

# Main execution
Write-Status "Starting deployment verification for $Environment environment" 'Info'

if ($Fix) {
  Fix-CommonIssues
}

if (-not (Test-DeploymentPrerequisites)) {
  exit 1
}

if (-not (Invoke-Build)) {
  exit 1
}

if (-not (Test-BuildOutputs)) {
  exit 1
}

if (-not (Test-WranglerConfig -Env $Environment)) {
  exit 1
}

if ($Deploy) {
  if (-not (Invoke-Deploy -Env $Environment)) {
    exit 1
  }

  Write-Status "🎉 Deployment to $Environment completed successfully!" 'Success'
} else {
  Write-Status "🎯 All verification checks passed! Ready for deployment to $Environment" 'Success'
  Write-Status 'Run with -Deploy flag to actually deploy' 'Info'
}

exit 0
