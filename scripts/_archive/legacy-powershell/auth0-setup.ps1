#!/usr/bin/env pwsh
# VitalSense Auth0 Setup Helper
# This script helps configure Auth0 credentials for the VitalSense Health App

param(
  [Parameter(Mandatory = $false)]
  [string]$Auth0Domain,

  [Parameter(Mandatory = $false)]
  [string]$Auth0ClientId,

  [switch]$UseSecrets,
  [switch]$UpdateConfig,
  [switch]$Test
)

Write-Host '🔐 VitalSense Auth0 Setup Helper' -ForegroundColor Cyan
Write-Host '================================' -ForegroundColor Cyan

# Function to validate Auth0 domain format
function Test-Auth0Domain {
  param($domain)
  # Accept both .auth0.com and regional domains like .us.auth0.com, .eu.auth0.com, etc.
  return $domain -match '^[a-zA-Z0-9-]+\.(us\.|eu\.|au\.)?auth0\.com$'
}

# Function to validate Auth0 Client ID format
function Test-Auth0ClientId {
  param($clientId)
  # Auth0 Client IDs can be various formats - just check it's not empty and has reasonable length
  return $clientId.Length -ge 20 -and $clientId -match '^[a-zA-Z0-9_-]+$'
}

if (-not $Auth0Domain -or -not $Auth0ClientId) {
  Write-Host '📝 Please provide your Auth0 credentials:' -ForegroundColor Yellow
  Write-Host ''

  if (-not $Auth0Domain) {
    do {
      $Auth0Domain = Read-Host 'Enter your Auth0 Domain (e.g., vitalsense-health.auth0.com)'
      if (-not (Test-Auth0Domain $Auth0Domain)) {
        Write-Host '❌ Invalid format. Please enter a valid Auth0 domain (ending in .auth0.com)' -ForegroundColor Red
      }
    } while (-not (Test-Auth0Domain $Auth0Domain))
  }

  if (-not $Auth0ClientId) {
    do {
      $Auth0ClientId = Read-Host 'Enter your Auth0 Client ID'
      if (-not (Test-Auth0ClientId $Auth0ClientId)) {
        Write-Host '❌ Invalid format. Client ID should be at least 20 characters and contain only letters, numbers, underscores, or hyphens' -ForegroundColor Red
      }
    } while (-not (Test-Auth0ClientId $Auth0ClientId))
  }
}

Write-Host ''
Write-Host '✅ Credentials provided:' -ForegroundColor Green
Write-Host "   Domain: $Auth0Domain" -ForegroundColor White
Write-Host "   Client ID: $Auth0ClientId" -ForegroundColor White

if ($UseSecrets) {
  Write-Host ''
  Write-Host '🔒 Setting up Wrangler secrets (recommended for production)...' -ForegroundColor Blue

  # Set Auth0 domain as secret
  Write-Host 'Setting AUTH0_DOMAIN...' -ForegroundColor Gray
  $Auth0Domain | wrangler secret put AUTH0_DOMAIN --env production

  if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ AUTH0_DOMAIN secret set successfully' -ForegroundColor Green
  } else {
    Write-Host '❌ Failed to set AUTH0_DOMAIN secret' -ForegroundColor Red
    exit 1
  }

  # Set Auth0 client ID as secret
  Write-Host 'Setting AUTH0_CLIENT_ID...' -ForegroundColor Gray
  $Auth0ClientId | wrangler secret put AUTH0_CLIENT_ID --env production

  if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ AUTH0_CLIENT_ID secret set successfully' -ForegroundColor Green
  } else {
    Write-Host '❌ Failed to set AUTH0_CLIENT_ID secret' -ForegroundColor Red
    exit 1
  }

} elseif ($UpdateConfig) {
  Write-Host ''
  Write-Host '📝 Updating wrangler.toml configuration...' -ForegroundColor Blue

  $wranglerPath = 'wrangler.toml'

  if (Test-Path $wranglerPath) {
    $content = Get-Content $wranglerPath -Raw

    # Replace Auth0 domain
    $content = $content -replace 'AUTH0_DOMAIN = ".*"', "AUTH0_DOMAIN = `"$Auth0Domain`""

    # Replace Auth0 client ID
    $content = $content -replace 'AUTH0_CLIENT_ID = ".*"', "AUTH0_CLIENT_ID = `"$Auth0ClientId`""

    # Write back to file
    $content | Set-Content $wranglerPath -Encoding UTF8

    Write-Host '✅ wrangler.toml updated successfully' -ForegroundColor Green
  } else {
    Write-Host '❌ wrangler.toml not found' -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host ''
  Write-Host '🤔 How would you like to configure these credentials?' -ForegroundColor Yellow
  Write-Host ''
  Write-Host '1. Use Wrangler secrets (recommended for production)' -ForegroundColor White
  Write-Host '2. Update wrangler.toml file (easier for development)' -ForegroundColor White
  Write-Host ''

  do {
    $choice = Read-Host 'Enter your choice (1 or 2)'
  } while ($choice -ne '1' -and $choice -ne '2')

  if ($choice -eq '1') {
    & $PSCommandPath -Auth0Domain $Auth0Domain -Auth0ClientId $Auth0ClientId -UseSecrets
  } else {
    & $PSCommandPath -Auth0Domain $Auth0Domain -Auth0ClientId $Auth0ClientId -UpdateConfig
  }
  return
}

if ($Test) {
  Write-Host ''
  Write-Host '🧪 Testing configuration...' -ForegroundColor Blue

  # Build and deploy
  Write-Host 'Building worker...' -ForegroundColor Gray
  npm run build:worker

  if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ Worker built successfully' -ForegroundColor Green

    Write-Host 'Deploying to production...' -ForegroundColor Gray
    wrangler deploy --env production

    if ($LASTEXITCODE -eq 0) {
      Write-Host '✅ Deployed successfully' -ForegroundColor Green
      Write-Host ''
      Write-Host '🎉 Test your Auth0 integration:' -ForegroundColor Green
      Write-Host '   1. Visit: https://health.andernet.dev' -ForegroundColor White
      Write-Host '   2. Try to sign in' -ForegroundColor White
      Write-Host '   3. Check the login page shows your Auth0 credentials' -ForegroundColor White
    } else {
      Write-Host '❌ Deployment failed' -ForegroundColor Red
    }
  } else {
    Write-Host '❌ Build failed' -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '🎯 Next Steps:' -ForegroundColor Cyan
Write-Host '1. Make sure your Auth0 application is configured with these URLs:' -ForegroundColor White
Write-Host '   - Allowed Callback URLs: https://health.andernet.dev/callback' -ForegroundColor Gray
Write-Host '   - Allowed Logout URLs: https://health.andernet.dev/login' -ForegroundColor Gray
Write-Host '   - Allowed Web Origins: https://health.andernet.dev' -ForegroundColor Gray
Write-Host '   - Allowed Origins (CORS): https://health.andernet.dev' -ForegroundColor Gray
Write-Host ''
Write-Host '2. Deploy and test:' -ForegroundColor White
Write-Host '   ./scripts/auth0-setup.ps1 -Test' -ForegroundColor Gray
Write-Host ''
Write-Host '3. Visit https://health.andernet.dev and try signing in!' -ForegroundColor White

Write-Host ''
Write-Host '✨ VitalSense Auth0 setup complete!' -ForegroundColor Green
