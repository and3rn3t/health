#!/usr/bin/env pwsh
# Quick Deploy Script for VitalSense Auth0 Custom Login Page

param(
  [Parameter(Mandatory = $false)]
  [switch]$TestMode = $false,

  [Parameter(Mandatory = $false)]
  [string]$ConfigFile = 'auth0-custom-login\auth0-config.local.ps1'
)

# Import utilities
Import-Module "$PSScriptRoot\VSCodeIntegration.psm1" -Force -ErrorAction SilentlyContinue

Write-Host '🎨 VitalSense Auth0 Custom Login Page Quick Deploy' -ForegroundColor Magenta
Write-Host '===================================================' -ForegroundColor Magenta

# Load configuration
if (Test-Path $ConfigFile) {
  Write-Host "📋 Loading configuration from: $ConfigFile" -ForegroundColor Cyan
  . $ConfigFile
  $config = $global:VitalSenseAuth0Config
} else {
  Write-Host "⚠️  Configuration file not found: $ConfigFile" -ForegroundColor Yellow
  Write-Host 'Creating example configuration file...' -ForegroundColor Yellow

  # Copy example config
  $exampleConfig = "$PSScriptRoot\..\auth0-custom-login\auth0-config.example.ps1"
  if (Test-Path $exampleConfig) {
    Copy-Item $exampleConfig $ConfigFile
    Write-Host "✅ Created: $ConfigFile" -ForegroundColor Green
    Write-Host '📝 Please edit this file with your Auth0 credentials and run again' -ForegroundColor Yellow
    return
  } else {
    Write-Host '❌ Example configuration not found' -ForegroundColor Red
    return
  }
}

# Validate configuration
if (-not $config -or -not $config.Domain -or -not $config.ClientId -or -not $config.ClientSecret) {
  Write-Host '❌ Invalid configuration. Please check your auth0-config.local.ps1 file' -ForegroundColor Red
  return
}

# Show configuration summary
Write-Host ''
Write-Host '📊 Configuration Summary:' -ForegroundColor Cyan
Write-Host "Domain: $($config.Domain)" -ForegroundColor White
Write-Host "Client ID: $($config.ClientId)" -ForegroundColor White
Write-Host "Environment: $($config.Environment)" -ForegroundColor White
Write-Host "Base URL: $($config.BaseUrl)" -ForegroundColor White

if ($TestMode) {
  Write-Host '🧪 TEST MODE: No changes will be made' -ForegroundColor Yellow
}

Write-Host ''

# Run the deployment script
$deployScript = "$PSScriptRoot\deploy-auth0-custom-login.ps1"
if (Test-Path $deployScript) {
  $params = @{
    Auth0Domain       = $config.Domain
    Auth0ClientId     = $config.ClientId
    Auth0ClientSecret = $config.ClientSecret
    LoginPagePath     = "$PSScriptRoot\..\auth0-custom-login\login.html"
  }

  if ($TestMode) {
    $params.TestMode = $true
  }

  Write-Host '🚀 Running deployment script...' -ForegroundColor Green
  & $deployScript @params
} else {
  Write-Host "❌ Deployment script not found: $deployScript" -ForegroundColor Red
}

Write-Host ''
Write-Host '🎉 Quick deploy complete!' -ForegroundColor Green
