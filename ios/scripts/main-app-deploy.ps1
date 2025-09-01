# 🎯 Main App Deployment Workflow
# Streamlined deployment for the main health iOS app with Cloudflare integration

param(
    [string]$Environment = "development", # development, staging, production
    [switch]$Deploy = $false,
    [switch]$Status = $false,
    [switch]$Sync = $false,
    [switch]$Quick = $false
)

Write-Host "🎯 Health App Deployment" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Change to project root
$projectRoot = Join-Path $PSScriptRoot ".." ".."
if (Test-Path $projectRoot) {
    Set-Location $projectRoot
} else {
    Write-Host "❌ Could not find project root" -ForegroundColor Red
    exit 1
}

# Environment configurations for main app
$envConfigs = @{
    development = @{
        ApiBaseUrl = "http://127.0.0.1:8789"
        WebSocketUrl = "ws://localhost:3001"
        WranglerEnv = "development"
        Description = "Local development with hot reload"
        SetupSteps = @(
            "Start Cloudflare Worker: npm run cf:dev",
            "Start WebSocket server: npm run start:server",
            "Open iOS project: open ios/HealthKitBridge.xcodeproj",
            "Build and run on simulator"
        )
    }
    staging = @{
        ApiBaseUrl = "https://staging-api.andernet.dev"
        WebSocketUrl = "wss://staging-api.andernet.dev/ws"
        WranglerEnv = "staging"
        Description = "Staging environment for testing"
        SetupSteps = @(
            "Deploy worker: wrangler deploy --env staging",
            "Build iOS app for TestFlight",
            "Upload to App Store Connect",
            "Distribute to internal testers"
        )
    }
    production = @{
        ApiBaseUrl = "https://health.andernet.dev/api"
        WebSocketUrl = "wss://health.andernet.dev/ws"
        WranglerEnv = "production"
        Description = "Production environment"
        SetupSteps = @(
            "Deploy worker: wrangler deploy --env production",
            "Build iOS app for App Store",
            "Upload to App Store Connect",
            "Submit for review"
        )
    }
}

$config = $envConfigs[$Environment]
if (-not $config) {
    Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Valid environments: development, staging, production" -ForegroundColor Yellow
    exit 1
}

# Function to update iOS configuration
function Update-IOSConfig {
    param([hashtable]$Config)

    Write-Host "📝 Updating iOS Configuration..." -ForegroundColor Green

    $configPath = "ios/HealthKitBridge/Config.plist"
    if (-not (Test-Path $configPath)) {
        Write-Host "❌ Config.plist not found: $configPath" -ForegroundColor Red
        return $false
    }

    try {
        $configContent = Get-Content $configPath -Raw

        # Update API URL
        $configContent = $configContent -replace "(<key>apiBaseURL</key>\s*<string>).*?(</string>)", "`$1$($Config.ApiBaseUrl)`$2"
        # Update WebSocket URL
        $configContent = $configContent -replace "(<key>webSocketURL</key>\s*<string>).*?(</string>)", "`$1$($Config.WebSocketUrl)`$2"
        # Update environment
        $configContent = $configContent -replace "(<key>environment</key>\s*<string>).*?(</string>)", "`$1$Environment`$2"

        Set-Content -Path $configPath -Value $configContent -Encoding UTF8

        Write-Host "✅ Updated Config.plist" -ForegroundColor Green
        Write-Host "   API: $($Config.ApiBaseUrl)" -ForegroundColor Gray
        Write-Host "   WebSocket: $($Config.WebSocketUrl)" -ForegroundColor Gray

        return $true
    } catch {
        Write-Host "❌ Error updating Config.plist: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check Cloudflare Worker status
function Test-CloudflareWorker {
    param([hashtable]$Config)

    Write-Host "🔍 Testing Cloudflare Worker..." -ForegroundColor Yellow

    try {
        $healthUrl = "$($Config.ApiBaseUrl)/health"
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10

        Write-Host "✅ Worker is healthy" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "⚠️  Worker health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   This is normal if the worker isn't running yet" -ForegroundColor Gray
        return $false
    }
}

# Function to validate iOS project
function Test-IOSProject {
    Write-Host "🔍 Validating iOS Project..." -ForegroundColor Yellow

    $issues = @()

    # Check required files
    $requiredFiles = @(
        "ios/HealthKitBridge.xcodeproj/project.pbxproj",
        "ios/HealthKitBridge/Config.plist",
        "ios/HealthKitBridge/HealthKitBridgeApp.swift",
        "ios/HealthKitBridge/HealthKitManager.swift"
    )

    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file" -ForegroundColor Green
        } else {
            $issues += "❌ Missing: $file"
        }
    }

    # Check Config.plist content
    $configPath = "ios/HealthKitBridge/Config.plist"
    if (Test-Path $configPath) {
        $configContent = Get-Content $configPath -Raw

        if ($configContent -match "apiBaseURL.*<string>(.*?)</string>") {
            $currentApi = $Matches[1]
            if ($currentApi -eq $config.ApiBaseUrl) {
                Write-Host "✅ API URL configured correctly" -ForegroundColor Green
            } else {
                $issues += "⚠️  API URL needs update: $currentApi → $($config.ApiBaseUrl)"
            }
        }

        if ($configContent -match "webSocketURL.*<string>(.*?)</string>") {
            $currentWS = $Matches[1]
            if ($currentWS -eq $config.WebSocketUrl) {
                Write-Host "✅ WebSocket URL configured correctly" -ForegroundColor Green
            } else {
                $issues += "⚠️  WebSocket URL needs update: $currentWS → $($config.WebSocketUrl)"
            }
        }
    }

    return $issues
}

# Function to show deployment status
function Show-Status {
    param([hashtable]$Config)

    Write-Host "📊 DEPLOYMENT STATUS" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "🌐 Environment: $Environment" -ForegroundColor Yellow
    Write-Host "   Description: $($Config.Description)" -ForegroundColor Gray
    Write-Host "   API: $($Config.ApiBaseUrl)" -ForegroundColor Gray
    Write-Host "   WebSocket: $($Config.WebSocketUrl)" -ForegroundColor Gray
    Write-Host ""

    # Test worker
    $workerHealthy = Test-CloudflareWorker -Config $Config

    # Test iOS project
    $iosIssues = Test-IOSProject

    Write-Host "📱 iOS Project Status" -ForegroundColor Yellow
    if ($iosIssues.Count -eq 0) {
        Write-Host "   ✅ All checks passed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Issues found:" -ForegroundColor Yellow
        foreach ($issue in $iosIssues) {
            Write-Host "   $issue" -ForegroundColor Red
        }
    }
    Write-Host ""

    # Overall status
    $ready = $workerHealthy -and ($iosIssues.Count -eq 0)
    Write-Host "🎯 Overall Status: $(if ($ready) { '✅ Ready' } else { '⚠️  Needs Attention' })" -ForegroundColor $(if ($ready) { 'Green' } else { 'Yellow' })

    return @{
        WorkerHealthy = $workerHealthy
        IOSIssues = $iosIssues
        Ready = $ready
    }
}

# Function to run deployment workflow
function Start-Deployment {
    param([hashtable]$Config)

    Write-Host "🚀 Starting Deployment Workflow..." -ForegroundColor Green
    Write-Host ""

    # Step 1: Update iOS configuration
    Write-Host "📋 Step 1: Update iOS Configuration" -ForegroundColor Cyan
    $configUpdated = Update-IOSConfig -Config $Config

    if (-not $configUpdated) {
        Write-Host "❌ Failed to update iOS configuration" -ForegroundColor Red
        return $false
    }

    # Step 2: Show next steps
    Write-Host ""
    Write-Host "📋 Step 2: Next Steps for $Environment" -ForegroundColor Cyan
    Write-Host ""

    for ($i = 0; $i -lt $Config.SetupSteps.Count; $i++) {
        Write-Host "   $($i + 1). $($Config.SetupSteps[$i])" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
    Write-Host "Your iOS app is now configured for $Environment environment" -ForegroundColor Green

    return $true
}

# Function for quick check
function Start-QuickCheck {
    Write-Host "⚡ Quick Health Check" -ForegroundColor Green
    Write-Host ""

    # Basic file checks
    $coreFiles = @(
        "ios/HealthKitBridge.xcodeproj/project.pbxproj",
        "ios/HealthKitBridge/Config.plist"
    )

    $allGood = $true
    foreach ($file in $coreFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file" -ForegroundColor Green
        } else {
            Write-Host "❌ $file" -ForegroundColor Red
            $allGood = $false
        }
    }

    # Quick worker test if development
    if ($Environment -eq "development") {
        Write-Host ""
        Test-CloudflareWorker -Config $config | Out-Null
    }

    Write-Host ""
    if ($allGood) {
        Write-Host "✅ Quick check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Issues found - run with -Status for details" -ForegroundColor Yellow
    }

    return $allGood
}

# Main execution
Write-Host "🎯 Target: $($config.Description)" -ForegroundColor White
Write-Host ""

if ($Quick) {
    $result = Start-QuickCheck
    exit $(if ($result) { 0 } else { 1 })
}

if ($Status) {
    $status = Show-Status -Config $config
    exit $(if ($status.Ready) { 0 } else { 1 })
}

if ($Sync) {
    $synced = Update-IOSConfig -Config $config
    exit $(if ($synced) { 0 } else { 1 })
}

if ($Deploy) {
    $deployed = Start-Deployment -Config $config
    exit $(if ($deployed) { 0 } else { 1 })
}

# Default: Show status
$status = Show-Status -Config $config

Write-Host ""
Write-Host "💡 Available Commands:" -ForegroundColor Cyan
Write-Host "   -Deploy        # Update iOS config and show deployment steps" -ForegroundColor White
Write-Host "   -Status        # Show detailed status (default)" -ForegroundColor White
Write-Host "   -Sync          # Just update iOS configuration" -ForegroundColor White
Write-Host "   -Quick         # Quick health check" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Examples:" -ForegroundColor Cyan
Write-Host "   .\main-app-deploy.ps1 -Deploy" -ForegroundColor Gray
Write-Host "   .\main-app-deploy.ps1 -Environment production -Deploy" -ForegroundColor Gray
Write-Host "   .\main-app-deploy.ps1 -Quick" -ForegroundColor Gray

exit $(if ($status.Ready) { 0 } else { 1 })
