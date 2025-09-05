# VitalSense Auth0 Local Config
# NOTE:
# - Use the M2M application Client ID here (authorized for the Auth0 Management API with client_credentials grant).
# - Keep ClientSecret empty in the file; the deploy script will read it from $env:AUTH0_CLIENT_SECRET at runtime.
$global:VitalSenseAuth0Config = @{
  Domain       = 'dev-qjdpc81dzr7xrnlu.us.auth0.com'
  # M2M Client ID (not the SPA client):
  ClientId     = 'FcJf6YZcCsVL78Sxt3oPlDXagMffTYMy'
  ClientSecret = ''
  Environment  = 'production'
  BaseUrl      = 'https://health.andernet.dev'
  # SPA Application Client ID (used for test URL and Classic UL fallback):
  AppClientId  = 'YyCHkHZ11713YG7QsB518lHrCFE3bW1s'
}
Write-Host '✅ Loaded VitalSense Auth0 local config' -ForegroundColor Green
