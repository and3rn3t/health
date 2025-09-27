# Modern Cloudflare Production Infrastructure Setup

param(
  [switch]$Deploy,
  [switch]$SetupKV,
  [switch]$SetupR2,
  [switch]$ConfigureDNS,
  [switch]$SetupWAF,
  [switch]$All,
  [switch]$Verify
)

# Import shared utilities
Import-Module "$PSScriptRoot\VSCodeIntegration.psm1" -Force

function Deploy-Production {
  Write-TaskStart 'Deploying VitalSense to Production'

  try {
    # Build the application
    Write-Host '🏗️ Building application...' -ForegroundColor Cyan
    npx vite build --config vite.config.simple.ts
    if ($LASTEXITCODE -ne 0) { throw 'Build failed' }

    npx vite build --config vite.worker.config.ts
    if ($LASTEXITCODE -ne 0) { throw 'Worker build failed' }

    # Deploy to production with enhanced config
    Write-Host '🚀 Deploying to Cloudflare Workers...' -ForegroundColor Cyan
    wrangler deploy --config wrangler.production.toml --env production
    if ($LASTEXITCODE -ne 0) { throw 'Deployment failed' }

    Write-TaskComplete 'Production deployment successful'
    return $true
  } catch {
    Write-TaskError "Deployment failed: $_"
    return $false
  }
}

function Setup-KVNamespaces {
  Write-TaskStart 'Setting up KV namespaces'

  try {
    Write-Host '🗄️ Creating production KV namespaces...' -ForegroundColor Cyan

    # Create KV namespaces using correct syntax
    Write-Host 'Creating SESSION_KV namespace...' -ForegroundColor Yellow
    $sessionResult = wrangler kv namespace create 'SESSION_KV' --env production 2>&1
    Write-Host $sessionResult

    Write-Host 'Creating CACHE_KV namespace...' -ForegroundColor Yellow
    $cacheResult = wrangler kv namespace create 'CACHE_KV' --env production 2>&1
    Write-Host $cacheResult

    Write-Host '📝 Update wrangler.production.toml with the namespace IDs above' -ForegroundColor Green

    Write-TaskComplete 'KV namespaces created'
    return $true
  } catch {
    Write-TaskError "KV setup failed: $_"
    return $false
  }
}

function Setup-R2Buckets {
  Write-TaskStart 'Setting up R2 buckets'

  try {
    Write-Host '🪣 Creating R2 buckets...' -ForegroundColor Cyan

    # Create R2 buckets
    Write-Host 'Creating vitalsense-health-files bucket...' -ForegroundColor Yellow
    wrangler r2 bucket create vitalsense-health-files 2>&1

    Write-Host 'Creating vitalsense-audit-logs bucket...' -ForegroundColor Yellow
    wrangler r2 bucket create vitalsense-audit-logs 2>&1

    Write-Host '🔒 Note: Object Lock must be enabled manually in Cloudflare Dashboard' -ForegroundColor Yellow
    Write-Host '   Go to R2 > vitalsense-audit-logs > Settings > Object Lock' -ForegroundColor Yellow

    Write-TaskComplete 'R2 buckets created'
    return $true
  } catch {
    Write-TaskError "R2 setup failed: $_"
    return $false
  }
}

function Configure-DNS {
  Write-TaskStart 'Configuring DNS for production'

  try {
    Write-Host '🌐 DNS configuration instructions...' -ForegroundColor Cyan

    Write-Host 'Manual DNS Setup Required:' -ForegroundColor Yellow
    Write-Host '1. Go to Cloudflare Dashboard > DNS' -ForegroundColor White
    Write-Host '2. Add CNAME record: health.andernet.dev → vitalsense-health-prod.workers.dev' -ForegroundColor White
    Write-Host '3. Add CNAME record: vitalsense.andernet.dev → vitalsense-health-prod.workers.dev' -ForegroundColor White
    Write-Host '4. Ensure Proxy status is enabled (orange cloud)' -ForegroundColor White
    Write-Host "5. SSL/TLS mode set to 'Full (strict)'" -ForegroundColor White

    Write-TaskComplete 'DNS configuration instructions provided'
    return $true
  } catch {
    Write-TaskError "DNS configuration failed: $_"
    return $false
  }
}

function Setup-WAF {
  Write-TaskStart 'Configuring Web Application Firewall'

  try {
    Write-Host '🛡️ WAF configuration instructions...' -ForegroundColor Cyan

    Write-Host 'Manual WAF Setup Required in Cloudflare Dashboard:' -ForegroundColor Yellow
    Write-Host '1. Go to Security > WAF' -ForegroundColor White
    Write-Host '2. Enable Managed Rules > Cloudflare Managed Ruleset' -ForegroundColor White
    Write-Host '3. Create Rate Limiting Rule:' -ForegroundColor White
    Write-Host '   - Name: API Rate Limit' -ForegroundColor White
    Write-Host "   - Expression: (http.request.uri.path matches '/api/.*')" -ForegroundColor White
    Write-Host '   - Action: Rate Limit (100 requests per minute)' -ForegroundColor White
    Write-Host '4. Enable Bot Fight Mode' -ForegroundColor White
    Write-Host "5. Set Security Level to 'High'" -ForegroundColor White

    Write-TaskComplete 'WAF configuration instructions provided'
    return $true
  } catch {
    Write-TaskError "WAF setup failed: $_"
    return $false
  }
}

function Verify-Deployment {
  Write-TaskStart 'Verifying production deployment'

  try {
    Write-Host '🔍 Running production health checks...' -ForegroundColor Cyan

    # Test main endpoints with proper error handling
    $endpoints = @(
      'https://health.andernet.dev/health',
      'https://health.andernet.dev/api/health'
    )

    foreach ($endpoint in $endpoints) {
      Write-Host "Testing: $endpoint" -ForegroundColor Yellow
      try {
        $response = Invoke-RestMethod -Uri $endpoint -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ $endpoint - OK" -ForegroundColor Green
        if ($response.status) {
          Write-Host "   Status: $($response.status)" -ForegroundColor Gray
        }
      } catch {
        Write-Host "❌ $endpoint - Failed: $($_.Exception.Message)" -ForegroundColor Red
      }
    }

    Write-TaskComplete 'Production verification complete'
    return $true
  } catch {
    Write-TaskError "Verification failed: $_"
    return $false
  }
}

function Show-NextSteps {
  Write-Host "`n🎯 Next Steps:" -ForegroundColor Green
  Write-Host '1. Update wrangler.production.toml with KV namespace IDs' -ForegroundColor White
  Write-Host '2. Configure DNS records in Cloudflare Dashboard' -ForegroundColor White
  Write-Host '3. Set up WAF rules in Security section' -ForegroundColor White
  Write-Host '4. Configure production secrets:' -ForegroundColor White
  Write-Host '   wrangler secret put AUTH0_CLIENT_SECRET --env production' -ForegroundColor Gray
  Write-Host '   wrangler secret put DEVICE_JWT_SECRET --env production' -ForegroundColor Gray
  Write-Host '   wrangler secret put ENCRYPTION_KEY --env production' -ForegroundColor Gray
  Write-Host '5. Deploy with: npm run production:deploy' -ForegroundColor White
  Write-Host '6. Verify with: npm run production:verify' -ForegroundColor White
}

function Show-Dashboard-URLs {
  Write-Host "`n🎯 Production Dashboard URLs:" -ForegroundColor Green
  Write-Host '• Main App: https://health.andernet.dev' -ForegroundColor Cyan
  Write-Host '• API Health: https://health.andernet.dev/api/health' -ForegroundColor Cyan
  Write-Host '• Cloudflare Dashboard: https://dash.cloudflare.com' -ForegroundColor Cyan
  Write-Host '• Workers: https://dash.cloudflare.com/workers' -ForegroundColor Cyan
  Write-Host '• R2 Storage: https://dash.cloudflare.com/r2' -ForegroundColor Cyan
  Write-Host '• KV Storage: https://dash.cloudflare.com/workers/kv' -ForegroundColor Cyan
}

# Main execution logic
if ($All) {
  $SetupKV = $true
  $SetupR2 = $true
  $ConfigureDNS = $true
  $SetupWAF = $true
  $Deploy = $true
  $Verify = $true
}

$success = $true

if ($SetupKV) {
  $success = $success -and (Setup-KVNamespaces)
}

if ($SetupR2) {
  $success = $success -and (Setup-R2Buckets)
}

if ($ConfigureDNS) {
  $success = $success -and (Configure-DNS)
}

if ($SetupWAF) {
  $success = $success -and (Setup-WAF)
}

if ($Deploy) {
  $success = $success -and (Deploy-Production)
}

if ($Verify) {
  $success = $success -and (Verify-Deployment)
}

if ($success) {
  Show-Dashboard-URLs
  Show-NextSteps
  Write-Host "`n🎉 Production infrastructure setup complete!" -ForegroundColor Green
} else {
  Write-Host "`n❌ Some operations failed. Check the output above." -ForegroundColor Red
  exit 1
}
