# VitalSense Auth0 Configuration
# Copy this file to auth0-config.local.ps1 and fill in your values

# Auth0 Tenant Configuration
$Auth0Config = @{
  # Your Auth0 tenant domain (e.g., "vitalsense-health.auth0.com")
  Domain       = 'your-tenant.auth0.com'

  # Your Auth0 application client ID
  ClientId     = 'your-client-id'

  # Your Auth0 application client secret (for Management API access)
  ClientSecret = 'your-client-secret'

  # Environment settings
  Environment  = 'production'  # development, staging, production

  # Application URLs
  BaseUrl      = 'https://health.andernet.dev'
  CallbackUrl  = 'https://health.andernet.dev/callback'
  LogoutUrl    = 'https://health.andernet.dev/login'

  # Custom branding settings
  Branding     = @{
    PrimaryColor    = '#2563eb'
    AccentColor     = '#0891b2'
    BackgroundColor = '#f8fafc'
    LogoUrl         = 'https://health.andernet.dev/logo.svg'
    FaviconUrl      = 'https://health.andernet.dev/favicon.ico'
    FontUrl         = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  }

  # Security settings
  Security     = @{
    EnableMFA                = $true
    EnableSocialLogins       = @('google-oauth2', 'apple')
    RequireEmailVerification = $true
    PasswordPolicy           = 'excellent'
    SessionTimeout           = 3600  # 1 hour in seconds
  }

  # Compliance settings
  Compliance   = @{
    EnableHIPAAMode     = $true
    EnableAuditLogs     = $true
    DataRetentionDays   = 2555  # 7 years for HIPAA
    EnableSOCCompliance = $true
  }
}

# Export configuration for use in scripts
if (-not $global:VitalSenseAuth0Config) {
  $global:VitalSenseAuth0Config = $Auth0Config
}

Write-Host '✅ VitalSense Auth0 configuration loaded' -ForegroundColor Green
Write-Host "Domain: $($Auth0Config.Domain)" -ForegroundColor Cyan
Write-Host "Environment: $($Auth0Config.Environment)" -ForegroundColor Cyan
Write-Host "Base URL: $($Auth0Config.BaseUrl)" -ForegroundColor Cyan
