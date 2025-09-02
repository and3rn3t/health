#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy VitalSense WebSocket Server to Production

.DESCRIPTION
    Deploys the WebSocket server to various cloud platforms for remote iOS testing

.PARAMETER Platform
    Deployment platform: railway, fly, vercel, or render

.PARAMETER Domain
    Custom domain for the WebSocket server (optional)

.PARAMETER TestDeploy
    Run in test mode without actual deployment

.EXAMPLE
    .\deploy-websocket-server.ps1 -Platform railway

.EXAMPLE
    .\deploy-websocket-server.ps1 -Platform fly -Domain ws.vitalsense.app
#>

param(
    [Parameter(Mandatory)]
    [ValidateSet("railway", "fly", "vercel", "render")]
    [string]$Platform,

    [string]$Domain,
    [switch]$TestDeploy
)

Write-Host "🚀 VitalSense WebSocket Server Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
$originalLocation = Get-Location
Set-Location "$PSScriptRoot\..\server"

try {
    Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
    Write-Host "   Platform: $Platform" -ForegroundColor Gray
    Write-Host "   Domain: $(if($Domain){"$Domain"}else{"Auto-generated"})" -ForegroundColor Gray
    Write-Host "   Test Mode: $TestDeploy" -ForegroundColor Gray
    Write-Host ""

    # Validate dependencies
    Write-Host "🔍 Checking Dependencies..." -ForegroundColor Yellow

    if (-not (Test-Path "package.json")) {
        throw "package.json not found in server directory"
    }

    if (-not (Test-Path "websocket-server.js")) {
        throw "websocket-server.js not found in server directory"
    }

    Write-Host "   ✅ Server files found" -ForegroundColor Green

    # Platform-specific deployment
    switch ($Platform) {
        "railway" {
            Write-Host "🚂 Deploying to Railway..." -ForegroundColor Cyan

            # Check Railway CLI
            $railwayCli = Get-Command "railway" -ErrorAction SilentlyContinue
            if (-not $railwayCli) {
                Write-Host "   📦 Installing Railway CLI..." -ForegroundColor Yellow
                npm install -g @railway/cli
            }

            Write-Host "   ✅ Railway CLI ready" -ForegroundColor Green

            if ($TestDeploy) {
                Write-Host "   🧪 Test Mode: Would run 'railway deploy'" -ForegroundColor Yellow
            } else {
                Write-Host "   🚀 Deploying to Railway..." -ForegroundColor Cyan
                railway deploy

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Railway deployment successful!" -ForegroundColor Green
                    $deployUrl = railway domain
                    Write-Host "   🌐 WebSocket URL: wss://$deployUrl" -ForegroundColor Cyan
                } else {
                    throw "Railway deployment failed"
                }
            }
        }

        "fly" {
            Write-Host "🪰 Deploying to Fly.io..." -ForegroundColor Cyan

            # Check Fly CLI
            $flyCli = Get-Command "fly" -ErrorAction SilentlyContinue
            if (-not $flyCli) {
                Write-Host "   📦 Installing Fly CLI..." -ForegroundColor Yellow
                Write-Host "   💡 Please install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/" -ForegroundColor Gray
                throw "Fly CLI not found. Please install it first."
            }

            Write-Host "   ✅ Fly CLI ready" -ForegroundColor Green

            if ($TestDeploy) {
                Write-Host "   🧪 Test Mode: Would run 'fly deploy'" -ForegroundColor Yellow
            } else {
                Write-Host "   🚀 Deploying to Fly.io..." -ForegroundColor Cyan
                fly deploy

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Fly.io deployment successful!" -ForegroundColor Green
                    $deployUrl = "vitalsense-websocket.fly.dev"
                    Write-Host "   🌐 WebSocket URL: wss://$deployUrl" -ForegroundColor Cyan
                } else {
                    throw "Fly.io deployment failed"
                }
            }
        }

        "vercel" {
            Write-Host "▲ Deploying to Vercel..." -ForegroundColor Cyan

            # Check Vercel CLI
            $vercelCli = Get-Command "vercel" -ErrorAction SilentlyContinue
            if (-not $vercelCli) {
                Write-Host "   📦 Installing Vercel CLI..." -ForegroundColor Yellow
                npm install -g vercel
            }

            Write-Host "   ✅ Vercel CLI ready" -ForegroundColor Green
            Write-Host "   ⚠️  Note: Vercel has limitations with WebSocket connections" -ForegroundColor Yellow

            if ($TestDeploy) {
                Write-Host "   🧪 Test Mode: Would run 'vercel --prod'" -ForegroundColor Yellow
            } else {
                Write-Host "   🚀 Deploying to Vercel..." -ForegroundColor Cyan
                vercel --prod

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Vercel deployment successful!" -ForegroundColor Green
                    Write-Host "   ⚠️  WebSocket functionality may be limited on Vercel" -ForegroundColor Yellow
                } else {
                    throw "Vercel deployment failed"
                }
            }
        }

        "render" {
            Write-Host "🎨 Deploying to Render..." -ForegroundColor Cyan
            Write-Host "   💡 Manual deployment required:" -ForegroundColor Yellow
            Write-Host "   1. Go to https://render.com" -ForegroundColor Gray
            Write-Host "   2. Connect your GitHub repository" -ForegroundColor Gray
            Write-Host "   3. Create a new Web Service" -ForegroundColor Gray
            Write-Host "   4. Set build command: npm install" -ForegroundColor Gray
            Write-Host "   5. Set start command: npm start" -ForegroundColor Gray
            Write-Host "   6. Set environment: NODE_ENV=production" -ForegroundColor Gray
        }
    }

    # Update iOS Config
    Write-Host ""
    Write-Host "📱 iOS Configuration Update" -ForegroundColor Magenta
    Write-Host "===========================" -ForegroundColor Magenta

    if (-not $TestDeploy -and $Platform -ne "render") {
        $wsUrl = switch ($Platform) {
            "railway" { "wss://vitalsense-websocket-production.up.railway.app" }
            "fly" { "wss://vitalsense-websocket.fly.dev" }
            "vercel" { "wss://vitalsense-websocket.vercel.app" }
        }

        if ($Domain) {
            $wsUrl = "wss://$Domain"
        }

        Write-Host "🔧 Update iOS Config.plist with:" -ForegroundColor Yellow
        Write-Host "   WS_URL: $wsUrl" -ForegroundColor Cyan
        Write-Host "   API_BASE_URL: $(($wsUrl -replace 'wss://', 'https://') -replace '/ws', '')/api" -ForegroundColor Cyan

        # Optionally update the config file automatically
        $configPath = "..\ios\HealthKitBridge\Config.plist"
        if (Test-Path $configPath) {
            Write-Host ""
            Write-Host "🤖 Auto-update iOS Config.plist? (y/N): " -ForegroundColor Yellow -NoNewline
            $response = Read-Host

            if ($response -eq 'y' -or $response -eq 'Y') {
                # Update the config file
                $config = Get-Content $configPath -Raw
                $config = $config -replace '<string>wss://[^<]+</string>', "<string>$wsUrl</string>"
                $config = $config -replace '<string>https://[^<]+/api</string>', "<string>$(($wsUrl -replace 'wss://', 'https://') -replace '/ws', '')/api</string>"
                Set-Content $configPath -Value $config

                Write-Host "   ✅ iOS Config.plist updated!" -ForegroundColor Green
            }
        }
    }

    Write-Host ""
    Write-Host "🎉 Deployment Summary" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ WebSocket server deployed to $Platform" -ForegroundColor Green
    Write-Host "📱 iOS app can now connect remotely" -ForegroundColor Green
    Write-Host "🧪 Test from any device with internet connection" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Update iOS Config.plist with new WebSocket URL" -ForegroundColor Gray
    Write-Host "   2. Build and install iOS app on device" -ForegroundColor Gray
    Write-Host "   3. Test WebSocket connection from remote device" -ForegroundColor Gray
    Write-Host "   4. Monitor real-time health data streaming" -ForegroundColor Gray

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location $originalLocation
}
