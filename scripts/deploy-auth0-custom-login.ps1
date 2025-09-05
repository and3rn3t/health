# Auth0 Custom Login Page Deployment Script
# This script uploads the custom branded login page to your Auth0 tenant

param(
  [Parameter(Mandatory = $true)]
  [string]$Auth0Domain,

  [Parameter(Mandatory = $true)]
  [string]$Auth0ClientId,

  [Parameter(Mandatory = $false)]
  [string]$Auth0ClientSecret,

  [Parameter(Mandatory = $false)]
  [string]$LoginPagePath = 'auth0-custom-login\login.html',

  # Optional SPA app client ID used for Classic customization fallback and test URL
  [Parameter(Mandatory = $false)]
  [string]$AppClientId,

  [Parameter(Mandatory = $false)]
  [switch]$TestMode = $false
)

# Import required modules
Import-Module "$PSScriptRoot\VSCodeIntegration.psm1" -Force

function Get-Auth0ManagementToken {
  param($Domain, $ClientId, $ClientSecret)

  Write-TaskStart 'Getting Auth0 Management API token'

  if (-not $ClientSecret) {
    Write-TaskError 'Client secret is empty. Set $env:AUTH0_CLIENT_SECRET or pass -Auth0ClientSecret.'
    throw 'Missing client secret'
  }

  $body = @{
    client_id     = $ClientId
    client_secret = $ClientSecret
    audience      = "https://$Domain/api/v2/"
    grant_type    = 'client_credentials'
  } | ConvertTo-Json

  try {
    $response = Invoke-RestMethod -Uri "https://$Domain/oauth/token" -Method POST -Body $body -ContentType 'application/json'
    Write-TaskComplete 'Auth0 Management API token acquired'
    return $response.access_token
  } catch {
    Write-TaskError "Failed to get Auth0 Management API token: $($_.Exception.Message)"
    throw
  }
}

function Get-CustomLoginPageTemplate {
  param($HtmlPath)

  Write-TaskStart 'Reading custom login page template'

  if (-not (Test-Path $HtmlPath)) {
    Write-TaskError "Login page file not found: $HtmlPath"
    throw 'Login page file not found'
  }

  $content = Get-Content -Path $HtmlPath -Raw
  Write-TaskComplete "Custom login page template loaded ($(($content -split "`n").Count) lines)"
  return $content
}

function Update-Auth0CustomLoginPage {
  param($Domain, $AccessToken, $HtmlContent, $TestMode)

  if ($TestMode) {
    Write-TaskStart 'TEST MODE: Would update Auth0 custom login page'
    Write-Host 'HTML Content Preview (first 500 chars):' -ForegroundColor Cyan
    Write-Host $HtmlContent.Substring(0, [Math]::Min(500, $HtmlContent.Length)) -ForegroundColor Gray
    Write-TaskComplete 'TEST MODE: Custom login page validated'
    return @{ success = $true; test_mode = $true }
  }

  Write-TaskStart 'Updating Auth0 custom login page'

  $headers = @{
    'Authorization' = "Bearer $AccessToken"
    'Content-Type'  = 'application/json'
  }

  $body = @{
    template = 'universal_login'
    body     = $HtmlContent
    enabled  = $true
  } | ConvertTo-Json -Depth 10

  try {
    $response = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding/templates/universal-login" -Method PUT -Headers $headers -Body $body
    Write-TaskComplete 'Auth0 custom login page updated successfully'
    return $response
  } catch {
    # Try PATCH if PUT fails (depending on Auth0 API version)
    try {
      Write-Host 'PUT failed, trying PATCH method...' -ForegroundColor Yellow
      $response = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding/templates/universal-login" -Method PATCH -Headers $headers -Body $body
      Write-TaskComplete 'Auth0 custom login page updated successfully (via PATCH)'
      return $response
    } catch {
      Write-TaskError "Failed to update Auth0 custom login page: $($_.Exception.Message)"
      if ($_.Exception.Response -and $_.Exception.Response.Content) {
        Write-Host "Response content: $($_.Exception.Response.Content)" -ForegroundColor Red
      }
      throw
    }
  }
}

function Update-ClassicLoginPerClient {
  param($Domain, $AccessToken, $ClientId, $HtmlContent, $TestMode)

  if ($TestMode) {
    Write-TaskStart 'TEST MODE: Would update Classic login page on SPA client'
    Write-TaskComplete 'TEST MODE: Classic login customization validated'
    return @{ success = $true; test_mode = $true }
  }

  Write-TaskStart 'Updating Classic login page on SPA client (fallback)'
  $headers = @{ 'Authorization' = "Bearer $AccessToken"; 'Content-Type' = 'application/json' }
  $body = @{ custom_login_page_on = $true; custom_login_page = $HtmlContent } | ConvertTo-Json -Depth 10
  try {
    $resp = Invoke-RestMethod -Uri "https://$Domain/api/v2/clients/$ClientId" -Method PATCH -Headers $headers -Body $body
    Write-TaskComplete 'Classic login page updated on SPA client'
    return $resp
  } catch {
    Write-TaskError "Failed to update Classic login page: $($_.Exception.Message)"
    if ($_.Exception.Response -and $_.Exception.Response.Content) {
      Write-Host "Response content: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
    throw
  }
}

function Get-Auth0BrandingSettings {
  param($Domain, $AccessToken, $TestMode)

  Write-TaskStart 'Retrieving current Auth0 branding settings'

  if ($TestMode) {
    Write-TaskComplete 'TEST MODE: Skipping Auth0 branding settings retrieval'
    return @{ test_mode = $true }
  }

  $headers = @{
    'Authorization' = "Bearer $AccessToken"
    'Content-Type'  = 'application/json'
  }

  try {
    $response = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding" -Method GET -Headers $headers
    Write-TaskComplete 'Auth0 branding settings retrieved'
    return $response
  } catch {
    Write-TaskError "Failed to get Auth0 branding settings: $($_.Exception.Message)"
    return $null
  }
}

function Update-Auth0BrandingSettings {
  param($Domain, $AccessToken, $TestMode)

  if ($TestMode) {
    Write-TaskStart 'TEST MODE: Would update Auth0 branding settings'
    Write-TaskComplete 'TEST MODE: Branding settings validated'
    return @{ success = $true; test_mode = $true }
  }

  Write-TaskStart 'Updating Auth0 branding settings'

  $headers = @{
    'Authorization' = "Bearer $AccessToken"
    'Content-Type'  = 'application/json'
  }

  $fullBranding = @{
    colors = @{
      primary         = '#2563eb'
      page_background = '#f8fafc'
    }
    # Some tenants reject data: URLs or external font URLs. We'll try full payload first, then fallback.
    favicon_url = 'https://health.andernet.dev/favicon.ico'
    # logo_url must be an https URL; many tenants reject data URIs.
    # Provide a conservative default (commented). Set in tenant manually if desired.
    # logo_url = 'https://health.andernet.dev/logo.png'
    font = @{ url = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
  } | ConvertTo-Json -Depth 10

  try {
    $response = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding" -Method PATCH -Headers $headers -Body $fullBranding
    Write-TaskComplete 'Auth0 branding settings updated successfully'
    return $response
  } catch {
    Write-TaskError "Failed to update Auth0 branding settings (full payload): $($_.Exception.Message)"
    if ($_.Exception.Response -and $_.Exception.Response.Content) {
      Write-Host "Response content: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
    Write-Host 'Trying minimal colors-only branding update...' -ForegroundColor Yellow
    $minimalBranding = @{ colors = @{ primary = '#2563eb'; page_background = '#f8fafc' } } | ConvertTo-Json -Depth 5
    try {
      $response2 = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding" -Method PATCH -Headers $headers -Body $minimalBranding
      Write-TaskComplete 'Auth0 branding settings updated (minimal payload)'
      return $response2
    } catch {
      Write-TaskError "Branding update failed even with minimal payload: $($_.Exception.Message)"
      if ($_.Exception.Response -and $_.Exception.Response.Content) {
        Write-Host "Response content: $($_.Exception.Response.Content)" -ForegroundColor Red
      }
      Write-Host 'Proceeding without updating branding settings.' -ForegroundColor Yellow
      return $null
    }
  }
}

function Test-Auth0CustomLoginPage {
  param($Domain, $ClientId)

  Write-TaskStart 'Testing custom login page'

  $testUrl = "https://$Domain/authorize?client_id=$ClientId&response_type=code&redirect_uri=https://health.andernet.dev/callback&scope=openid profile email"

  Write-Host "Test URL: $testUrl" -ForegroundColor Cyan
  Write-Host 'You can open this URL in a browser to test the custom login page' -ForegroundColor Green

  Write-TaskComplete 'Custom login page test URL generated'
}

function Main {
  Write-Host '🚀 VitalSense Auth0 Custom Login Page Deployment' -ForegroundColor Magenta
  Write-Host '=================================================' -ForegroundColor Magenta

  try {
    # Validate parameters
    if (-not $Auth0Domain -or -not $Auth0ClientId) {
      Write-TaskError 'Missing required Auth0 domain or client ID'
      throw 'Missing required Auth0 domain or client ID'
    }

  Write-Host "Using Auth0 Domain: $Auth0Domain" -ForegroundColor Cyan
  Write-Host "Using Client ID:   $Auth0ClientId" -ForegroundColor Cyan

    # In test mode, skip Management API token retrieval (no secret required)
    if ($TestMode) {
      $accessToken = $null
      Write-TaskStart 'TEST MODE: Skipping Auth0 Management API token retrieval'
      Write-TaskComplete 'TEST MODE: Token retrieval skipped'
    } else {
      # Get Management API token
      if (-not $Auth0ClientSecret -and $env:AUTH0_CLIENT_SECRET) { $Auth0ClientSecret = $env:AUTH0_CLIENT_SECRET }
      if (-not $Auth0ClientSecret) { throw 'Auth0ClientSecret is required for live deployment' }
      $accessToken = Get-Auth0ManagementToken -Domain $Auth0Domain -ClientId $Auth0ClientId -ClientSecret $Auth0ClientSecret
    }

    # Get current branding settings
  $currentBranding = Get-Auth0BrandingSettings -Domain $Auth0Domain -AccessToken $accessToken -TestMode:$TestMode
    if ($currentBranding) {
      Write-Host 'Current branding:' -ForegroundColor Cyan
      Write-Host ($currentBranding | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    }

    # Update branding settings
    $brandingResult = Update-Auth0BrandingSettings -Domain $Auth0Domain -AccessToken $accessToken -TestMode $TestMode

    # Get and update custom login page
    $htmlContent = Get-CustomLoginPageTemplate -HtmlPath $LoginPagePath
    try {
      $loginPageResult = Update-Auth0CustomLoginPage -Domain $Auth0Domain -AccessToken $accessToken -HtmlContent $htmlContent -TestMode $TestMode
    } catch {
      # If Universal Login template endpoint is missing (404), fall back to Classic per-client customization
      $is404 = ($_.Exception.Response -and $_.Exception.Response.StatusCode -eq 404) -or ($_.Exception.Message -like '*404*Not Found*')
      if ($is404) {
        if (-not $AppClientId) { Write-TaskError 'AppClientId not provided for Classic fallback'; throw }
        Write-Host 'Falling back to Classic (per-client) login customization...' -ForegroundColor Yellow
        $loginPageResult = Update-ClassicLoginPerClient -Domain $Auth0Domain -AccessToken $accessToken -ClientId $AppClientId -HtmlContent $htmlContent -TestMode $TestMode
      } else {
        throw
      }
    }

  # Test the custom login page (prefer SPA AppClientId for test URL if provided)
  $testClientId = if ($AppClientId) { $AppClientId } else { $Auth0ClientId }
  Test-Auth0CustomLoginPage -Domain $Auth0Domain -ClientId $testClientId

    Write-Host ''
    Write-Host '✅ Auth0 Custom Login Page Deployment Complete!' -ForegroundColor Green
    Write-Host '=================================================' -ForegroundColor Green

    if ($TestMode) {
      Write-Host '🧪 TEST MODE: No actual changes were made' -ForegroundColor Yellow
      Write-Host 'Run without -TestMode to deploy the changes' -ForegroundColor Yellow
    } else {
  Write-Host '✨ Your VitalSense branded login page is now live!' -ForegroundColor Green
  $finalTestClientId = if ($AppClientId) { $AppClientId } else { $Auth0ClientId }
  Write-Host "🔗 Test at: https://$Auth0Domain/authorize?client_id=$finalTestClientId&response_type=code&redirect_uri=https://health.andernet.dev/callback&scope=openid%20profile%20email" -ForegroundColor Cyan
    }

  } catch {
    Write-TaskError "Deployment failed: $($_.Exception.Message)"
    Write-Host 'Stack trace:' -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
  }
}

# Run the main function
Main
