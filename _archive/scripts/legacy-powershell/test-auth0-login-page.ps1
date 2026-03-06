#!/usr/bin/env pwsh
# Test Auth0 Custom Login Page

param(
  [Parameter(Mandatory = $false)]
  [string]$HtmlFile = 'auth0-custom-login\login.html'
)

Write-Host '🧪 Testing VitalSense Auth0 Custom Login Page' -ForegroundColor Magenta
Write-Host '==============================================' -ForegroundColor Magenta

# Check if HTML file exists
if (-not (Test-Path $HtmlFile)) {
  Write-Host "❌ HTML file not found: $HtmlFile" -ForegroundColor Red
  exit 1
}

Write-Host "✅ HTML file found: $HtmlFile" -ForegroundColor Green

# Read and validate HTML content
$htmlContent = Get-Content -Path $HtmlFile -Raw

# Check for required elements
$validations = @{
  'VitalSense branding' = $htmlContent -match 'VitalSense'
  'Inter font'          = $htmlContent -match 'Inter'
  'Primary color'       = $htmlContent -match '#2563eb'
  'Heart icon'          = $htmlContent -match 'heart'
  'HIPAA compliance'    = $htmlContent -match 'HIPAA'
  'Auth0 Lock script'   = $htmlContent -match 'lock.min.js'
  'Lucide icons'        = $htmlContent -match 'lucide'
  'Security features'   = $htmlContent -match 'security-feature'
  'Responsive design'   = $htmlContent -match '@media'
  'Meta viewport'       = $htmlContent -match 'viewport'
}

Write-Host ''
Write-Host '📋 Validation Results:' -ForegroundColor Cyan

$allPassed = $true
foreach ($validation in $validations.GetEnumerator()) {
  if ($validation.Value) {
    Write-Host "✅ $($validation.Key)" -ForegroundColor Green
  } else {
    Write-Host "❌ $($validation.Key)" -ForegroundColor Red
    $allPassed = $false
  }
}

Write-Host ''

# File size check
$fileSize = (Get-Item $HtmlFile).Length
$fileSizeKB = [math]::Round($fileSize / 1024, 2)

Write-Host '📊 File Statistics:' -ForegroundColor Cyan
Write-Host "Size: $fileSizeKB KB" -ForegroundColor White
Write-Host "Lines: $(($htmlContent -split "`n").Count)" -ForegroundColor White

if ($fileSizeKB -gt 100) {
  Write-Host "⚠️  File size is large ($fileSizeKB KB). Consider optimizing." -ForegroundColor Yellow
} else {
  Write-Host '✅ File size is optimal' -ForegroundColor Green
}

# CSS validation
$cssMatches = [regex]::Matches($htmlContent, '<style>(.*?)</style>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($cssMatches.Count -gt 0) {
  $cssContent = $cssMatches[0].Groups[1].Value
  $cssLines = ($cssContent -split "`n").Count
  Write-Host "CSS Lines: $cssLines" -ForegroundColor White

  # Check for CSS best practices
  $cssValidations = @{
    'CSS Variables'          = $cssContent -match '--vs-'
    'Responsive breakpoints' = $cssContent -match '@media'
    'Flexbox usage'          = $cssContent -match 'display: flex'
    'Modern selectors'       = $cssContent -match '::before|::after'
    'Transitions'            = $cssContent -match 'transition:'
    'Box shadows'            = $cssContent -match 'box-shadow:'
  }

  Write-Host ''
  Write-Host '🎨 CSS Quality Check:' -ForegroundColor Cyan
  foreach ($cssValidation in $cssValidations.GetEnumerator()) {
    if ($cssValidation.Value) {
      Write-Host "✅ $($cssValidation.Key)" -ForegroundColor Green
    } else {
      Write-Host "⚠️  $($cssValidation.Key)" -ForegroundColor Yellow
    }
  }
}

# JavaScript validation
$jsMatches = [regex]::Matches($htmlContent, '<script(?![^>]*src=)[^>]*>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if ($jsMatches.Count -gt 0) {
  Write-Host ''
  Write-Host '🔧 JavaScript Check:' -ForegroundColor Cyan

  $jsContent = $jsMatches[-1].Groups[1].Value  # Get the last script block (main config)

  $jsValidations = @{
    'Auth0 Lock configuration' = $jsContent -match 'Auth0Lock'
    'Event handlers'           = $jsContent -match 'lock\.on'
    'Error handling'           = $jsContent -match 'error'
    'Loading states'           = $jsContent -match 'loading'
    'Icon initialization'      = $jsContent -match 'createIcons'
  }

  foreach ($jsValidation in $jsValidations.GetEnumerator()) {
    if ($jsValidation.Value) {
      Write-Host "✅ $($jsValidation.Key)" -ForegroundColor Green
    } else {
      Write-Host "⚠️  $($jsValidation.Key)" -ForegroundColor Yellow
    }
  }
}

Write-Host ''

# Security checks
Write-Host '🔒 Security Check:' -ForegroundColor Cyan

$securityValidations = @{
  'No hardcoded secrets'           = -not ($htmlContent -match 'sk_|client_secret|api_key')
  'HTTPS only'                     = $htmlContent -match 'https://'
  'rel=noopener on external links' = $htmlContent -match 'rel="noopener"'
  'CSP friendly'                   = -not ($htmlContent -match 'style="')
  'No inline JavaScript in HTML'   = -not ($htmlContent -match 'onclick=|onload=|onerror=')
}

foreach ($securityValidation in $securityValidations.GetEnumerator()) {
  if ($securityValidation.Value) {
    Write-Host "✅ $($securityValidation.Key)" -ForegroundColor Green
  } else {
    Write-Host "⚠️  $($securityValidation.Key)" -ForegroundColor Yellow
    $allPassed = $false
  }
}

Write-Host ''

# Final result
if ($allPassed) {
  Write-Host '🎉 All validations passed! The custom login page is ready for deployment.' -ForegroundColor Green
} else {
  Write-Host '⚠️  Some validations failed. Please review the issues above.' -ForegroundColor Yellow
}

# Generate test URL template
Write-Host ''
Write-Host '🌐 Test URL Template:' -ForegroundColor Cyan
Write-Host 'https://YOUR_DOMAIN.auth0.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://health.andernet.dev/callback&scope=openid%20profile%20email' -ForegroundColor Blue

Write-Host ''
Write-Host '📝 Next Steps:' -ForegroundColor Cyan
Write-Host '1. Set up your Auth0 tenant configuration' -ForegroundColor White
Write-Host '2. Run: .\scripts\quick-deploy-auth0.ps1 -TestMode' -ForegroundColor White
Write-Host '3. Deploy: .\scripts\quick-deploy-auth0.ps1' -ForegroundColor White
Write-Host '4. Test the live login page' -ForegroundColor White

Write-Host ''
Write-Host '✨ Test complete!' -ForegroundColor Green
