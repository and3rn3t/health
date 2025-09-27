#!/usr/bin/env pwsh
# Auth0 Configuration Script for VitalSense Health App
# This script configures Auth0 application settings for the custom domain

param(
  [switch]$Test,
  [switch]$Configure,
  [switch]$Help
)

# VitalSense branding and configuration
$VitalSenseConfig = @{
  AppName        = 'VitalSense Health Platform'
  Domain         = 'https://health.andernet.dev'
  LoginUrl       = 'https://health.andernet.dev/login'
  CallbackUrls   = @(
    'https://health.andernet.dev/callback',
    'https://health.andernet.dev/auth/callback',
    'https://health.andernet.dev/'
  )
  LogoutUrls     = @(
    'https://health.andernet.dev/',
    'https://health.andernet.dev/login'
  )
  WebOrigins     = @(
    'https://health.andernet.dev'
  )
  AllowedOrigins = @(
    'https://health.andernet.dev'
  )
}

# Auth0 Configuration (from environment variables)
$Auth0Config = @{
  Domain   = 'dev-qjdpc81dzr7xrnlu.us.auth0.com'
  ClientId = '3SWqx7E8dFSIWapIikjppEKQ5ksNxRAQ'
  TenantId = 'dev-qjdpc81dzr7xrnlu'
}

function Show-Help {
  Write-Host 'VitalSense Auth0 Configuration Script' -ForegroundColor Blue
  Write-Host '=====================================' -ForegroundColor Blue
  Write-Host ''
  Write-Host 'Usage:'
  Write-Host '  .\auth0-config.ps1 -Test       # Test current Auth0 configuration'
  Write-Host '  .\auth0-config.ps1 -Configure  # Configure Auth0 application'
  Write-Host '  .\auth0-config.ps1 -Help       # Show this help'
  Write-Host ''
  Write-Host 'Configuration Details:' -ForegroundColor Green
  Write-Host "  Domain: $($Auth0Config.Domain)"
  Write-Host "  Client ID: $($Auth0Config.ClientId)"
  Write-Host "  Login URL: $($VitalSenseConfig.LoginUrl)"
  Write-Host "  Callback URLs: $($VitalSenseConfig.CallbackUrls -join ', ')"
}

function Test-Auth0Configuration {
  Write-Host 'Testing Auth0 Configuration...' -ForegroundColor Yellow

  # Test 1: Check if Auth0 domain is accessible
  Write-Host '1. Testing Auth0 domain accessibility...' -ForegroundColor Cyan
  try {
    $response = Invoke-WebRequest -Uri "https://$($Auth0Config.Domain)/.well-known/openid_configuration" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
      Write-Host '   ✅ Auth0 domain is accessible' -ForegroundColor Green
      $config = $response.Content | ConvertFrom-Json
      Write-Host "   📍 Authorization Endpoint: $($config.authorization_endpoint)" -ForegroundColor Gray
      Write-Host "   📍 Token Endpoint: $($config.token_endpoint)" -ForegroundColor Gray
    }
  } catch {
    Write-Host "   ❌ Auth0 domain not accessible: $($_.Exception.Message)" -ForegroundColor Red
  }

  # Test 2: Check if our login page is working
  Write-Host '2. Testing VitalSense login page...' -ForegroundColor Cyan
  try {
    $response = Invoke-WebRequest -Uri $VitalSenseConfig.LoginUrl -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content -like '*VitalSense*') {
      Write-Host '   ✅ VitalSense login page is working' -ForegroundColor Green
    }
  } catch {
    Write-Host "   ❌ VitalSense login page not accessible: $($_.Exception.Message)" -ForegroundColor Red
  }

  # Test 3: Check main app
  Write-Host '3. Testing main application...' -ForegroundColor Cyan
  try {
    $response = Invoke-WebRequest -Uri $VitalSenseConfig.Domain -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content -like '*VitalSense*') {
      Write-Host '   ✅ Main application is working' -ForegroundColor Green
    }
  } catch {
    Write-Host "   ❌ Main application not accessible: $($_.Exception.Message)" -ForegroundColor Red
  }
}

function Set-Auth0Configuration {
  Write-Host 'Configuring Auth0 Application...' -ForegroundColor Yellow

  Write-Host 'Manual Auth0 Configuration Required:' -ForegroundColor Red
  Write-Host 'Please navigate to your Auth0 Dashboard and configure the following:' -ForegroundColor White
  Write-Host ''
  Write-Host '🔗 Auth0 Dashboard: https://manage.auth0.com/dashboard' -ForegroundColor Blue
  Write-Host ''
  Write-Host "Application Settings for Client ID: $($Auth0Config.ClientId)" -ForegroundColor Green
  Write-Host '================================================' -ForegroundColor Green
  Write-Host ''
  Write-Host 'Application Name:' -ForegroundColor Cyan
  Write-Host "  $($VitalSenseConfig.AppName)" -ForegroundColor White
  Write-Host ''
  Write-Host 'Allowed Callback URLs:' -ForegroundColor Cyan
  foreach ($url in $VitalSenseConfig.CallbackUrls) {
    Write-Host "  $url" -ForegroundColor White
  }
  Write-Host ''
  Write-Host 'Allowed Logout URLs:' -ForegroundColor Cyan
  foreach ($url in $VitalSenseConfig.LogoutUrls) {
    Write-Host "  $url" -ForegroundColor White
  }
  Write-Host ''
  Write-Host 'Allowed Web Origins:' -ForegroundColor Cyan
  foreach ($url in $VitalSenseConfig.WebOrigins) {
    Write-Host "  $url" -ForegroundColor White
  }
  Write-Host ''
  Write-Host 'Allowed Origins (CORS):' -ForegroundColor Cyan
  foreach ($url in $VitalSenseConfig.AllowedOrigins) {
    Write-Host "  $url" -ForegroundColor White
  }
  Write-Host ''
  Write-Host 'Application Type:' -ForegroundColor Cyan
  Write-Host '  Single Page Application (SPA)' -ForegroundColor White
  Write-Host ''
  Write-Host 'Token Endpoint Authentication Method:' -ForegroundColor Cyan
  Write-Host '  None' -ForegroundColor White
  Write-Host ''

  # Create a summary file
  $configSummary = @"
VitalSense Auth0 Configuration Summary
=====================================

Auth0 Domain: $($Auth0Config.Domain)
Client ID: $($Auth0Config.ClientId)

Application Settings:
- Name: $($VitalSenseConfig.AppName)
- Type: Single Page Application (SPA)
- Token Endpoint Authentication: None

URLs to Configure:
- Allowed Callback URLs: $($VitalSenseConfig.CallbackUrls -join ', ')
- Allowed Logout URLs: $($VitalSenseConfig.LogoutUrls -join ', ')
- Allowed Web Origins: $($VitalSenseConfig.WebOrigins -join ', ')
- Allowed Origins (CORS): $($VitalSenseConfig.AllowedOrigins -join ', ')

Test URLs:
- Login Page: $($VitalSenseConfig.LoginUrl)
- Main App: $($VitalSenseConfig.Domain)

Generated on: $(Get-Date)
"@

  $configSummary | Out-File -FilePath 'auth0-config-summary.txt' -Encoding UTF8
  Write-Host 'Configuration summary saved to: auth0-config-summary.txt' -ForegroundColor Green
}

# Main execution
if ($Help) {
  Show-Help
} elseif ($Test) {
  Test-Auth0Configuration
} elseif ($Configure) {
  Set-Auth0Configuration
} else {
  Show-Help
  Write-Host ''
  Write-Host 'Running quick test...' -ForegroundColor Yellow
  Test-Auth0Configuration
}
