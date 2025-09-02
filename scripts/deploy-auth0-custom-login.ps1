# Auth0 Custom Login Page Deployment Script
# This script uploads the custom branded login page to your Auth0 tenant

param(
  [Parameter(Mandatory = $true)]
  [string]$Auth0Domain,

  [Parameter(Mandatory = $true)]
  [string]$Auth0ClientId,

  [Parameter(Mandatory = $true)]
  [string]$Auth0ClientSecret,

  [Parameter(Mandatory = $false)]
  [string]$LoginPagePath = 'auth0-custom-login\login.html',

  [Parameter(Mandatory = $false)]
  [switch]$TestMode = $false
)

# Import required modules
Import-Module "$PSScriptRoot\VSCodeIntegration.psm1" -Force

function Get-Auth0ManagementToken {
  param($Domain, $ClientId, $ClientSecret)

  Write-TaskStart 'Getting Auth0 Management API token'

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
      Write-Host "Response content: $($_.Exception.Response)" -ForegroundColor Red
      throw
    }
  }
}

function Get-Auth0BrandingSettings {
  param($Domain, $AccessToken)

  Write-TaskStart 'Retrieving current Auth0 branding settings'

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

  $brandingSettings = @{
    colors      = @{
      primary         = '#2563eb'
      page_background = '#f8fafc'
    }
    favicon_url = 'https://health.andernet.dev/favicon.ico'
    logo_url    = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwLjg0IDQuNjFhNS41IDUuNSAwIDAgMC03Ljc4IDBMMTIgNS42N2wtMS4wNi0xLjA2YTUuNSA1LjUgMCAwIDAtNy43OCAwIDUuNSA1LjUgMCAwIDAgMCA3Ljc4bDguODQgOC44NGE2IDYgMCAwIDAgOC40OSAwbDguNDktOC40OWE1LjUgNS41IDAgMCAwIDAtNy43OFoiIHN0cm9rZT0iIzI1NjNlYiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
    font        = @{
      url = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    }
  } | ConvertTo-Json -Depth 10

  try {
    $response = Invoke-RestMethod -Uri "https://$Domain/api/v2/branding" -Method PATCH -Headers $headers -Body $brandingSettings
    Write-TaskComplete 'Auth0 branding settings updated successfully'
    return $response
  } catch {
    Write-TaskError "Failed to update Auth0 branding settings: $($_.Exception.Message)"
    throw
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
    if (-not $Auth0Domain -or -not $Auth0ClientId -or -not $Auth0ClientSecret) {
      Write-TaskError 'Missing required Auth0 credentials'
      throw 'Missing required Auth0 credentials'
    }

    # Get Management API token
    $accessToken = Get-Auth0ManagementToken -Domain $Auth0Domain -ClientId $Auth0ClientId -ClientSecret $Auth0ClientSecret

    # Get current branding settings
    $currentBranding = Get-Auth0BrandingSettings -Domain $Auth0Domain -AccessToken $accessToken
    if ($currentBranding) {
      Write-Host 'Current branding:' -ForegroundColor Cyan
      Write-Host ($currentBranding | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    }

    # Update branding settings
    $brandingResult = Update-Auth0BrandingSettings -Domain $Auth0Domain -AccessToken $accessToken -TestMode $TestMode

    # Get and update custom login page
    $htmlContent = Get-CustomLoginPageTemplate -HtmlPath $LoginPagePath
    $loginPageResult = Update-Auth0CustomLoginPage -Domain $Auth0Domain -AccessToken $accessToken -HtmlContent $htmlContent -TestMode $TestMode

    # Test the custom login page
    Test-Auth0CustomLoginPage -Domain $Auth0Domain -ClientId $Auth0ClientId

    Write-Host ''
    Write-Host '✅ Auth0 Custom Login Page Deployment Complete!' -ForegroundColor Green
    Write-Host '=================================================' -ForegroundColor Green

    if ($TestMode) {
      Write-Host '🧪 TEST MODE: No actual changes were made' -ForegroundColor Yellow
      Write-Host 'Run without -TestMode to deploy the changes' -ForegroundColor Yellow
    } else {
      Write-Host '✨ Your VitalSense branded login page is now live!' -ForegroundColor Green
      Write-Host "🔗 Test at: https://$Auth0Domain/authorize?client_id=$Auth0ClientId&response_type=code&redirect_uri=https://health.andernet.dev/callback&scope=openid%20profile%20email" -ForegroundColor Cyan
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
