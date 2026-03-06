#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Enable WebSocket Support in Cloudflare Workers

.DESCRIPTION
    Deploys WebSocket functionality to the existing Cloudflare Workers infrastructure

.PARAMETER Environment
    Environment to deploy to (development or production)

.PARAMETER TestDeploy
    Run in test mode without actual deployment

.EXAMPLE
    .\enable-cloudflare-websockets.ps1 -Environment production
#>

param(
    [Parameter(Mandatory)]
    [ValidateSet("development", "production")]
    [string]$Environment,

    [switch]$TestDeploy
)

Write-Host "🔌 Enabling WebSocket Support in Cloudflare Workers" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Environment: $Environment" -ForegroundColor Gray
Write-Host "   Test Mode: $TestDeploy" -ForegroundColor Gray
Write-Host ""

try {
    # Check prerequisites
    Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Yellow

    # Check wrangler
    $wrangler = Get-Command "wrangler" -ErrorAction SilentlyContinue
    if (-not $wrangler) {
        throw "Wrangler CLI not found. Please install: npm install -g wrangler"
    }
    Write-Host "   ✅ Wrangler CLI found" -ForegroundColor Green

    # Check if logged in to Cloudflare
    try {
        $whoami = wrangler whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Not logged in to Cloudflare"
        }
        Write-Host "   ✅ Cloudflare authentication verified" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Please log in to Cloudflare: wrangler login" -ForegroundColor Yellow
        throw "Cloudflare authentication required"
    }

    # Build the worker
    Write-Host ""
    Write-Host "🏗️  Building Worker with WebSocket Support..." -ForegroundColor Yellow

    if ($TestDeploy) {
        Write-Host "   🧪 Test Mode: Would run 'npm run build'" -ForegroundColor Yellow
    } else {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Host "   ✅ Build successful" -ForegroundColor Green
    }

    # Deploy to Cloudflare
    Write-Host ""
    Write-Host "🚀 Deploying to Cloudflare Workers..." -ForegroundColor Yellow

    if ($TestDeploy) {
        Write-Host "   🧪 Test Mode: Would run 'wrangler deploy --env $Environment'" -ForegroundColor Yellow
    } else {
        wrangler deploy --env $Environment
        if ($LASTEXITCODE -ne 0) {
            throw "Deployment failed"
        }
        Write-Host "   ✅ Deployment successful!" -ForegroundColor Green
    }

    # Get the WebSocket URL
    $wsUrl = if ($Environment -eq "production") {
        "wss://health.andernet.dev/ws"
    } else {
        "wss://health-app-dev.andernet.dev/ws"  # Adjust based on your dev domain
    }

    Write-Host ""
    Write-Host "🎉 WebSocket Support Enabled!" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 WebSocket Endpoint: $wsUrl" -ForegroundColor Cyan
    Write-Host ""

    # Test the WebSocket endpoint
    Write-Host "🧪 Testing WebSocket Endpoint..." -ForegroundColor Yellow

    if (-not $TestDeploy) {
        try {
            $testResult = curl.exe -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" $($wsUrl -replace 'wss://', 'https://') 2>&1

            if ($testResult -match "101") {
                Write-Host "   ✅ WebSocket upgrade successful!" -ForegroundColor Green
            } elseif ($testResult -match "426") {
                Write-Host "   ⚠️  Still returning 426 - deployment may need a moment to propagate" -ForegroundColor Yellow
            } else {
                Write-Host "   📊 Response: $testResult" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ⚠️  Test failed (this is normal if deployment is still propagating): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    # iOS Configuration
    Write-Host ""
    Write-Host "📱 iOS App Configuration Update" -ForegroundColor Magenta
    Write-Host "===============================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "🔧 Update your iOS Config.plist with:" -ForegroundColor Yellow
    Write-Host "   WS_URL: $wsUrl" -ForegroundColor Cyan
    Write-Host "   API_BASE_URL: $(($wsUrl -replace 'wss://', 'https://') -replace '/ws', '/api')" -ForegroundColor Cyan
    Write-Host ""

    # Optionally update the config file
    $configPath = "ios\HealthKitBridge\Config.plist"
    if (Test-Path $configPath) {
        Write-Host "🤖 Auto-update iOS Config.plist? (y/N): " -ForegroundColor Yellow -NoNewline
        $response = Read-Host

        if ($response -eq 'y' -or $response -eq 'Y') {
            # Read and update the config
            $config = Get-Content $configPath -Raw

            # Update WebSocket URL
            $config = $config -replace '<key>WS_URL</key>\s*<string>[^<]*</string>', "<key>WS_URL</key>`n    <string>$wsUrl</string>"
            $config = $config -replace '<key>webSocketURL</key>\s*<string>[^<]*</string>', "<key>webSocketURL</key>`n    <string>$wsUrl</string>"

            # Update API URL
            $apiUrl = ($wsUrl -replace 'wss://', 'https://') -replace '/ws', '/api'
            $config = $config -replace '<key>API_BASE_URL</key>\s*<string>[^<]*</string>', "<key>API_BASE_URL</key>`n    <string>$apiUrl</string>"
            $config = $config -replace '<key>apiBaseURL</key>\s*<string>[^<]*</string>', "<key>apiBaseURL</key>`n    <string>$apiUrl</string>"

            Set-Content $configPath -Value $config
            Write-Host "   ✅ iOS Config.plist updated!" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Wait 1-2 minutes for deployment to fully propagate" -ForegroundColor Gray
    Write-Host "   2. Update iOS app with new WebSocket URL (if not done automatically)" -ForegroundColor Gray
    Write-Host "   3. Build and install iOS app on device" -ForegroundColor Gray
    Write-Host "   4. Test WebSocket connection from remote device" -ForegroundColor Gray
    Write-Host "   5. Monitor real-time health data streaming" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 To test WebSocket connection:" -ForegroundColor Cyan
    Write-Host "   curl -i -H 'Connection: Upgrade' -H 'Upgrade: websocket' \\" -ForegroundColor Gray
    Write-Host "        -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: test' \\" -ForegroundColor Gray
    Write-Host "        $($wsUrl -replace 'wss://', 'https://')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✨ WebSocket support successfully enabled in Cloudflare Workers!" -ForegroundColor Green

} catch {
    Write-Host "❌ Failed to enable WebSocket support: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
