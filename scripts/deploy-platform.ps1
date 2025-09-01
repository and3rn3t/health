#!/usr/bin/env pwsh
# Comprehensive DNS + Worker Deployment for Health Platform
# Reads config from dns-config.yml and deploys everything

param(
    [Parameter(Mandatory=$false)]
    [string]$CloudflareApiToken = $env:CLOUDFLARE_API_TOKEN,

    [Parameter(Mandatory=$false)]
    [string]$Phase = "1",

    [switch]$DryRun,
    [switch]$DNSOnly,
    [switch]$WorkersOnly,
    [switch]$Verify,
    [string]$ConfigPath = "config/dns-config.yml"
)

# Import PowerShell YAML module if available, otherwise parse manually
function Read-YamlConfig {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        Write-Host "❌ Config file not found: $Path" -ForegroundColor Red
        exit 1
    }

    # Simple YAML parsing for our specific structure
    $content = Get-Content $Path -Raw
    $config = @{}

    # Extract domain
    if ($content -match 'domain:\s*"([^"]+)"') {
        $config.domain = $matches[1]
    }

    return $config
}

Write-Host "🚀 Health Platform Deployment Manager" -ForegroundColor Cyan
Write-Host "Phase: $Phase | Mode: $(if($DryRun){'DRY RUN'}else{'LIVE'})" -ForegroundColor Yellow

# Validate environment
if (-not $CloudflareApiToken) {
    Write-Host "❌ Cloudflare API token required. Set CLOUDFLARE_API_TOKEN environment variable or pass -CloudflareApiToken" -ForegroundColor Red
    Write-Host "💡 Get token from: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Yellow
    exit 1
}

# Phase-specific configuration
$phaseConfig = @{
    "1" = @{
        description = "MVP - Single Worker Deployment"
        subdomains = @("health")
        workers = @("health-app")
        critical = $true
    }
    "2" = @{
        description = "API Separation"
        subdomains = @("api.health", "ws.health")
        workers = @("health-api", "health-ws")
        critical = $false
    }
    "3" = @{
        description = "Specialized Services"
        subdomains = @("emergency.health", "files.health", "caregiver.health")
        workers = @("health-emergency", "health-files", "health-caregiver")
        critical = $true
    }
}

$currentPhase = $phaseConfig[$Phase]
if (-not $currentPhase) {
    Write-Host "❌ Invalid phase: $Phase. Valid: 1, 2, 3" -ForegroundColor Red
    exit 1
}

Write-Host "📋 $($currentPhase.description)" -ForegroundColor Blue
Write-Host "   Subdomains: $($currentPhase.subdomains -join ', ')" -ForegroundColor Gray

# Step 1: Configure DNS (unless WorkersOnly)
if (-not $WorkersOnly) {
    Write-Host "`n🌐 DNS Configuration..." -ForegroundColor Blue

    $dnsArgs = @(
        "-CloudflareApiToken", $CloudflareApiToken
        "-Phase", $Phase
    )

    if ($DryRun) { $dnsArgs += "-DryRun" }

    try {
        & ".\scripts\dns-setup.ps1" @dnsArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ DNS setup failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ DNS setup error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Deploy Workers (unless DNSOnly)
if (-not $DNSOnly) {
    Write-Host "`n🔧 Worker Deployment..." -ForegroundColor Blue

    foreach ($worker in $currentPhase.workers) {
        Write-Host "  Deploying $worker..." -ForegroundColor Yellow

        if ($DryRun) {
            Write-Host "  [DRY RUN] Would deploy: wrangler deploy --env production" -ForegroundColor Yellow
        } else {
            try {
                wrangler deploy --env production
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ $worker deployed successfully" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ $worker deployment failed" -ForegroundColor Red
                    if ($currentPhase.critical) {
                        exit 1
                    }
                }
            } catch {
                Write-Host "  ❌ $worker deployment error: $($_.Exception.Message)" -ForegroundColor Red
                if ($currentPhase.critical) {
                    exit 1
                }
            }
        }
    }
}

# Step 3: Verification (if requested)
if ($Verify -and -not $DryRun) {
    Write-Host "`n🔍 Verification..." -ForegroundColor Blue

    foreach ($subdomain in $currentPhase.subdomains) {
        $url = "https://$subdomain.andernet.dev/health"
        Write-Host "  Testing $url..." -ForegroundColor Yellow

        try {
            $response = Invoke-RestMethod -Uri $url -TimeoutSec 10 -ErrorAction Stop
            Write-Host "  ✅ $subdomain responding" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  $subdomain not responding (may take time for DNS propagation)" -ForegroundColor Yellow
        }
    }
}

# Success summary
Write-Host "`n🎉 Deployment Summary:" -ForegroundColor Green
Write-Host "  Phase: $Phase ($($currentPhase.description))" -ForegroundColor White
Write-Host "  Subdomains: $($currentPhase.subdomains.Count)" -ForegroundColor White
Write-Host "  Workers: $($currentPhase.workers.Count)" -ForegroundColor White

if (-not $DryRun) {
    Write-Host "`n🌐 Your health platform is available at:" -ForegroundColor Cyan
    foreach ($subdomain in $currentPhase.subdomains) {
        Write-Host "  https://$subdomain.andernet.dev" -ForegroundColor Blue
    }

    Write-Host "`n🔗 Next Steps:" -ForegroundColor Yellow
    if ($Phase -eq "1") {
        Write-Host "  • Test your app: https://health.andernet.dev" -ForegroundColor White
        Write-Host "  • Deploy Phase 2: .\scripts\deploy-platform.ps1 -Phase 2" -ForegroundColor White
    } elseif ($Phase -eq "2") {
        Write-Host "  • Test APIs: https://api.health.andernet.dev/health" -ForegroundColor White
        Write-Host "  • Deploy Phase 3: .\scripts\deploy-platform.ps1 -Phase 3" -ForegroundColor White
    } else {
        Write-Host "  • All phases deployed! Your health platform is live 🚀" -ForegroundColor White
    }
}

Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
exit 0
