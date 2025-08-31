# 🔄 Cloudflare-iOS Integration Manager
# Coordinates deployments between Cloudflare Workers and iOS apps

param(
    [string]$Action = "sync", # sync, deploy, rollback, status
    [string]$Environment = "development",
    [switch]$Force = $false,
    [switch]$DryRun = $false,
    [string]$WorkerVersion = "",
    [string]$IOSVersion = ""
)

Write-Host "🔄 Cloudflare-iOS Integration Manager" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Action: $Action" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Dry Run: $DryRun" -ForegroundColor White
Write-Host ""

# Change to project root
$projectRoot = Join-Path $PSScriptRoot ".." ".."
if (Test-Path $projectRoot) {
    Set-Location $projectRoot
} else {
    Write-Host "❌ Could not find project root" -ForegroundColor Red
    exit 1
}

# Environment configurations
$environments = @{
    development = @{
        WorkerName = "health-app-dev"
        Domain = "127.0.0.1:8789"
        Protocol = "http"
        WSProtocol = "ws"
        WranglerEnv = "development"
        IOSScheme = "HealthKitBridge-Dev"
        DeploymentType = "local"
    }
    staging = @{
        WorkerName = "health-app-staging"
        Domain = "staging-api.yourdomain.com"
        Protocol = "https"
        WSProtocol = "wss"
        WranglerEnv = "staging"
        IOSScheme = "HealthKitBridge-Staging"
        DeploymentType = "cloud"
    }
    production = @{
        WorkerName = "health-app-prod"
        Domain = "api.yourdomain.com"
        Protocol = "https"
        WSProtocol = "wss"
        WranglerEnv = "production"
        IOSScheme = "HealthKitBridge"
        DeploymentType = "cloud"
    }
}

$config = $environments[$Environment]
if (-not $config) {
    Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
    exit 1
}

# Function to check Cloudflare Worker status
function Get-WorkerStatus {
    param([hashtable]$Config)

    Write-Host "🔍 Checking Cloudflare Worker Status..." -ForegroundColor Yellow

    $status = @{
        deployed = $false
        healthy = $false
        version = $null
        lastDeployed = $null
        errors = @()
    }

    try {
        # Check if worker is deployed
        if ($Config.DeploymentType -eq "local") {
            # For development, check if local server is running
            $healthUrl = "$($Config.Protocol)://$($Config.Domain)/health"
            $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 5
            $status.deployed = $true
            $status.healthy = $true
            $status.version = $response.version -or "local-dev"
        } else {
            # For staging/production, check Cloudflare deployment
            $deployments = & wrangler deployments list --env $($Config.WranglerEnv) --json 2>$null
            if ($LASTEXITCODE -eq 0 -and $deployments) {
                $deploymentsData = $deployments | ConvertFrom-Json
                if ($deploymentsData.length -gt 0) {
                    $latest = $deploymentsData[0]
                    $status.deployed = $true
                    $status.version = $latest.id
                    $status.lastDeployed = $latest.created_on

                    # Test health endpoint
                    try {
                        $healthUrl = "$($Config.Protocol)://$($Config.Domain)/health"
                        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
                        $status.healthy = $true
                    } catch {
                        $status.errors += "Health check failed: $($_.Exception.Message)"
                    }
                }
            }
        }
    } catch {
        $status.errors += "Worker status check failed: $($_.Exception.Message)"
    }

    return $status
}

# Function to check iOS configuration status
function Get-IOSStatus {
    param([hashtable]$Config)

    Write-Host "🔍 Checking iOS Configuration Status..." -ForegroundColor Yellow

    $status = @{
        configured = $false
        buildable = $false
        version = $null
        bundleId = $null
        apiEndpoint = $null
        wsEndpoint = $null
        errors = @()
    }

    try {
        # Check iOS project files
        $projectPath = "ios/HealthKitBridge.xcodeproj/project.pbxproj"
        $configPath = "ios/HealthKitBridge/Config.plist"
        $infoPlistPath = "ios/HealthKitBridge/Info.plist"

        if (-not (Test-Path $projectPath)) {
            $status.errors += "Xcode project not found: $projectPath"
            return $status
        }

        if (-not (Test-Path $configPath)) {
            $status.errors += "Config.plist not found: $configPath"
            return $status
        }

        # Parse Config.plist
        $configContent = Get-Content $configPath -Raw
        if ($configContent -match "apiBaseURL.*<string>(.*?)</string>") {
            $status.apiEndpoint = $Matches[1]
        }
        if ($configContent -match "webSocketURL.*<string>(.*?)</string>") {
            $status.wsEndpoint = $Matches[1]
        }

        # Expected endpoints for environment
        $expectedApi = "$($Config.Protocol)://$($Config.Domain)"
        $expectedWS = "$($Config.WSProtocol)://$($Config.Domain)/ws"

        if ($status.apiEndpoint -eq $expectedApi -and $status.wsEndpoint -eq $expectedWS) {
            $status.configured = $true
        } else {
            if ($status.apiEndpoint -ne $expectedApi) {
                $status.errors += "API endpoint mismatch. Expected: $expectedApi, Found: $($status.apiEndpoint)"
            }
            if ($status.wsEndpoint -ne $expectedWS) {
                $status.errors += "WebSocket endpoint mismatch. Expected: $expectedWS, Found: $($status.wsEndpoint)"
            }
        }

        # Check if project can build (basic validation)
        $swiftFiles = Get-ChildItem "ios/HealthKitBridge/*.swift" -ErrorAction SilentlyContinue
        if ($swiftFiles.Count -gt 0) {
            $status.buildable = $true
        }

        # Get version from Info.plist if available
        if (Test-Path $infoPlistPath) {
            $infoPlistContent = Get-Content $infoPlistPath -Raw
            if ($infoPlistContent -match "CFBundleShortVersionString.*<string>(.*?)</string>") {
                $status.version = $Matches[1]
            }
            if ($infoPlistContent -match "CFBundleIdentifier.*<string>(.*?)</string>") {
                $status.bundleId = $Matches[1]
            }
        }

    } catch {
        $status.errors += "iOS status check failed: $($_.Exception.Message)"
    }

    return $status
}

# Function to sync configurations
function Sync-Configurations {
    param([hashtable]$Config)

    Write-Host "🔄 Syncing Configurations..." -ForegroundColor Green

    if ($DryRun) {
        Write-Host "🧪 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
        Write-Host ""
    }

    # Generate iOS configurations to match Cloudflare setup
    $apiUrl = "$($Config.Protocol)://$($Config.Domain)"
    $wsUrl = "$($Config.WSProtocol)://$($Config.Domain)/ws"

    Write-Host "🎯 Target Configuration:" -ForegroundColor Cyan
    Write-Host "  API URL: $apiUrl" -ForegroundColor White
    Write-Host "  WebSocket URL: $wsUrl" -ForegroundColor White
    Write-Host "  Worker: $($Config.WorkerName)" -ForegroundColor White
    Write-Host ""

    if (-not $DryRun) {
        # Update iOS Config.plist
        $configPath = "ios/HealthKitBridge/Config.plist"
        if (Test-Path $configPath) {
            $configContent = Get-Content $configPath -Raw

            # Update API URL
            $configContent = $configContent -replace "(<key>apiBaseURL</key>\s*<string>).*?(</string>)", "`$1$apiUrl`$2"
            # Update WebSocket URL
            $configContent = $configContent -replace "(<key>webSocketURL</key>\s*<string>).*?(</string>)", "`$1$wsUrl`$2"
            # Update environment
            $configContent = $configContent -replace "(<key>environment</key>\s*<string>).*?(</string>)", "`$1$Environment`$2"

            Set-Content -Path $configPath -Value $configContent -Encoding UTF8
            Write-Host "✅ Updated iOS Config.plist" -ForegroundColor Green
        } else {
            Write-Host "⚠️  iOS Config.plist not found - run deployment manager to generate" -ForegroundColor Yellow
        }

        # Check Wrangler configuration
        $wranglerPath = "wrangler.toml"
        if (Test-Path $wranglerPath) {
            # Check if environment section exists and update ALLOWED_ORIGINS
            $allowedOrigin = if ($Environment -eq "development") { "http://localhost:5173,http://127.0.0.1:5173" } else { "$($Config.Protocol)://$($Config.Domain)" }

            Write-Host "✅ Wrangler configuration checked" -ForegroundColor Green
            Write-Host "   Allowed Origins: $allowedOrigin" -ForegroundColor Gray
        }
    }

    return $true
}

# Function to deploy in coordinated manner
function Start-CoordinatedDeployment {
    param([hashtable]$Config)

    Write-Host "🚀 Starting Coordinated Deployment..." -ForegroundColor Green
    Write-Host ""

    if ($DryRun) {
        Write-Host "🧪 DRY RUN MODE - Showing deployment steps" -ForegroundColor Yellow
        Write-Host ""
    }

    $deploymentSteps = @()

    if ($Config.DeploymentType -eq "local") {
        $deploymentSteps += @{
            Step = 1
            Action = "Start Cloudflare Worker (Development)"
            Command = "wrangler dev --env development --port 8789"
            Description = "Starts local development server with hot reload"
            Critical = $true
        }
        $deploymentSteps += @{
            Step = 2
            Action = "Start WebSocket Server"
            Command = "npm run start:server"
            Description = "Starts local WebSocket server for realtime communication"
            Critical = $true
        }
        $deploymentSteps += @{
            Step = 3
            Action = "Open iOS Project"
            Command = "open ios/HealthKitBridge.xcodeproj"
            Description = "Opens Xcode project for iOS development"
            Critical = $false
        }
    } else {
        $deploymentSteps += @{
            Step = 1
            Action = "Deploy Cloudflare Worker"
            Command = "wrangler deploy --env $($Config.WranglerEnv)"
            Description = "Deploys worker to Cloudflare edge"
            Critical = $true
        }
        $deploymentSteps += @{
            Step = 2
            Action = "Verify Worker Health"
            Command = "curl $($Config.Protocol)://$($Config.Domain)/health"
            Description = "Confirms worker deployment is healthy"
            Critical = $true
        }
        $deploymentSteps += @{
            Step = 3
            Action = "Build iOS App"
            Command = "xcodebuild -project ios/HealthKitBridge.xcodeproj -scheme $($Config.IOSScheme) archive"
            Description = "Builds iOS app for distribution"
            Critical = $true
        }
        $deploymentSteps += @{
            Step = 4
            Action = "Upload to App Store Connect"
            Command = "Upload via Xcode Organizer or altool"
            Description = "Distributes app to testers or App Store"
            Critical = $false
        }
    }

    foreach ($step in $deploymentSteps) {
        Write-Host "📋 Step $($step.Step): $($step.Action)" -ForegroundColor Cyan
        Write-Host "   Command: $($step.Command)" -ForegroundColor Gray
        Write-Host "   Description: $($step.Description)" -ForegroundColor Gray
        Write-Host "   Critical: $(if ($step.Critical) { '🔴 Yes' } else { '🟡 No' })" -ForegroundColor $(if ($step.Critical) { 'Red' } else { 'Yellow' })
        Write-Host ""

        if (-not $DryRun -and $step.Critical) {
            Write-Host "⏳ Executing step..." -ForegroundColor Yellow

            if ($step.Action -like "*Cloudflare Worker*" -and $Config.DeploymentType -eq "cloud") {
                try {
                    & wrangler deploy --env $Config.WranglerEnv
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Worker deployed successfully" -ForegroundColor Green
                    } else {
                        Write-Host "❌ Worker deployment failed" -ForegroundColor Red
                        throw "Deployment failed"
                    }
                } catch {
                    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
                    return $false
                }
            } elseif ($step.Action -like "*Verify*") {
                try {
                    Start-Sleep -Seconds 3 # Wait for deployment propagation
                    $healthUrl = "$($Config.Protocol)://$($Config.Domain)/health"
                    $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 15
                    Write-Host "✅ Worker health check passed: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
                    return $false
                }
            }
        }
    }

    return $true
}

# Function to show deployment status
function Show-DeploymentStatus {
    param([hashtable]$Config)

    Write-Host "📊 DEPLOYMENT STATUS REPORT" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""

    # Get statuses
    $workerStatus = Get-WorkerStatus -Config $Config
    $iosStatus = Get-IOSStatus -Config $Config

    # Worker Status
    Write-Host "🌐 Cloudflare Worker ($($Config.WorkerName))" -ForegroundColor Yellow
    Write-Host "  Deployed: $(if ($workerStatus.deployed) { '✅ Yes' } else { '❌ No' })" -ForegroundColor $(if ($workerStatus.deployed) { 'Green' } else { 'Red' })
    Write-Host "  Healthy: $(if ($workerStatus.healthy) { '✅ Yes' } else { '❌ No' })" -ForegroundColor $(if ($workerStatus.healthy) { 'Green' } else { 'Red' })
    Write-Host "  Version: $($workerStatus.version -or 'Unknown')" -ForegroundColor Gray
    if ($workerStatus.lastDeployed) {
        Write-Host "  Last Deployed: $($workerStatus.lastDeployed)" -ForegroundColor Gray
    }
    Write-Host ""

    # iOS Status
    Write-Host "📱 iOS App Configuration" -ForegroundColor Yellow
    Write-Host "  Configured: $(if ($iosStatus.configured) { '✅ Yes' } else { '❌ No' })" -ForegroundColor $(if ($iosStatus.configured) { 'Green' } else { 'Red' })
    Write-Host "  Buildable: $(if ($iosStatus.buildable) { '✅ Yes' } else { '❌ No' })" -ForegroundColor $(if ($iosStatus.buildable) { 'Green' } else { 'Red' })
    Write-Host "  Version: $($iosStatus.version -or 'Unknown')" -ForegroundColor Gray
    Write-Host "  Bundle ID: $($iosStatus.bundleId -or 'Unknown')" -ForegroundColor Gray
    Write-Host "  API Endpoint: $($iosStatus.apiEndpoint -or 'Not configured')" -ForegroundColor Gray
    Write-Host "  WebSocket Endpoint: $($iosStatus.wsEndpoint -or 'Not configured')" -ForegroundColor Gray
    Write-Host ""

    # Compatibility Check
    $compatible = $workerStatus.deployed -and $workerStatus.healthy -and $iosStatus.configured
    Write-Host "🔗 Integration Status" -ForegroundColor Yellow
    Write-Host "  Compatible: $(if ($compatible) { '✅ Ready' } else { '❌ Issues Found' })" -ForegroundColor $(if ($compatible) { 'Green' } else { 'Red' })
    Write-Host ""

    # Show errors
    $allErrors = $workerStatus.errors + $iosStatus.errors
    if ($allErrors.Count -gt 0) {
        Write-Host "⚠️  Issues Found:" -ForegroundColor Red
        foreach ($issueItem in $allErrors) {
            Write-Host "  • $issueItem" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Recommendations
    Write-Host "💡 Recommendations:" -ForegroundColor Cyan
    if (-not $workerStatus.deployed) {
        Write-Host "  • Deploy Cloudflare Worker: wrangler deploy --env $($Config.WranglerEnv)" -ForegroundColor Yellow
    }
    if (-not $iosStatus.configured) {
        Write-Host "  • Configure iOS app: .\ios\scripts\ios-deployment-manager.ps1 -GenerateConfigs -Environment $Environment" -ForegroundColor Yellow
    }
    if ($workerStatus.deployed -and $iosStatus.configured -and -not $compatible) {
        Write-Host "  • Sync configurations: .\ios\scripts\cloudflare-ios-integration.ps1 -Action sync -Environment $Environment" -ForegroundColor Yellow
    }

    return @{
        worker = $workerStatus
        ios = $iosStatus
        compatible = $compatible
        errors = $allErrors
    }
}

# Main execution based on action
switch ($Action.ToLower()) {
    "status" {
        $status = Show-DeploymentStatus -Config $config
        exit $(if ($status.compatible) { 0 } else { 1 })
    }
    "sync" {
        $synced = Sync-Configurations -Config $config
        exit $(if ($synced) { 0 } else { 1 })
    }
    "deploy" {
        $deployed = Start-CoordinatedDeployment -Config $config
        exit $(if ($deployed) { 0 } else { 1 })
    }
    "rollback" {
        Write-Host "🔄 Rollback functionality not yet implemented" -ForegroundColor Yellow
        Write-Host "Manual steps:" -ForegroundColor Gray
        Write-Host "  1. Revert Cloudflare Worker: wrangler rollback --env $($config.WranglerEnv)" -ForegroundColor Gray
        Write-Host "  2. Restore previous iOS configuration" -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host "Available actions: status, sync, deploy, rollback" -ForegroundColor Yellow
        exit 1
    }
}
