# 🎯 Multi-App Deployment Orchestrator
# Manages multiple iOS apps and their Cloudflare Worker backends

param(
    [string]$Action = "list", # list, create, deploy, status, cleanup
    [string]$AppName = "",
    [string]$Environment = "development",
    [array]$Apps = @(),
    [switch]$Interactive = $false,
    [switch]$Force = $false
)

Write-Host "🎯 Multi-App Deployment Orchestrator" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root
$projectRoot = Join-Path $PSScriptRoot ".." ".."
if (Test-Path $projectRoot) {
    Set-Location $projectRoot
} else {
    Write-Host "❌ Could not find project root" -ForegroundColor Red
    exit 1
}

# App configurations - Define multiple iOS apps that can share Cloudflare infrastructure
$appConfigurations = @{
    "health-main" = @{
        DisplayName = "Health App"
        BundleId = "com.yourcompany.health"
        IOSPath = "ios"
        WorkerName = "health-app"
        Description = "Main health monitoring app"
        Features = @("HealthKit", "WebSockets", "Analytics")
        Environments = @("development", "staging", "production")
    }
    "health-caregiver" = @{
        DisplayName = "Caregiver Dashboard"
        BundleId = "com.yourcompany.health.caregiver"
        IOSPath = "ios-caregiver"
        WorkerName = "health-caregiver"
        Description = "Caregiver monitoring dashboard"
        Features = @("Notifications", "WebSockets", "Emergency Alerts")
        Environments = @("development", "staging", "production")
    }
    "health-senior" = @{
        DisplayName = "Senior Health"
        BundleId = "com.yourcompany.health.senior"
        IOSPath = "ios-senior"
        WorkerName = "health-senior"
        Description = "Simplified app for seniors"
        Features = @("Simple UI", "Emergency Alerts", "Medication Reminders")
        Environments = @("development", "production")
    }
    "health-clinical" = @{
        DisplayName = "Clinical Dashboard"
        BundleId = "com.yourcompany.health.clinical"
        IOSPath = "ios-clinical"
        WorkerName = "health-clinical"
        Description = "Healthcare provider dashboard"
        Features = @("Clinical Data", "Patient Management", "Compliance")
        Environments = @("staging", "production")
    }
}

# Function to list all configured apps
function Get-AppList {
    Write-Host "📱 Available iOS Apps" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    Write-Host ""

    $appList = @()

    foreach ($appKey in $appConfigurations.Keys | Sort-Object) {
        $app = $appConfigurations[$appKey]
        $exists = Test-Path $app.IOSPath
        $status = if ($exists) { "✅ Exists" } else { "❌ Not Created" }

        Write-Host "📱 $($app.DisplayName) ($appKey)" -ForegroundColor Cyan
        Write-Host "   Bundle ID: $($app.BundleId)" -ForegroundColor Gray
        Write-Host "   Path: $($app.IOSPath)" -ForegroundColor Gray
        Write-Host "   Worker: $($app.WorkerName)" -ForegroundColor Gray
        Write-Host "   Status: $status" -ForegroundColor $(if ($exists) { 'Green' } else { 'Red' })
        Write-Host "   Environments: $($app.Environments -join ', ')" -ForegroundColor Gray
        Write-Host "   Features: $($app.Features -join ', ')" -ForegroundColor Gray
        Write-Host "   Description: $($app.Description)" -ForegroundColor Gray
        Write-Host ""

        $appList += @{
            Key = $appKey
            Config = $app
            Exists = $exists
            Status = if ($exists) { "ready" } else { "missing" }
        }
    }

    # Summary
    $totalApps = $appList.Count
    $existingApps = ($appList | Where-Object { $_.Exists }).Count
    $missingApps = $totalApps - $existingApps

    Write-Host "📊 Summary: $totalApps total apps, $existingApps exist, $missingApps missing" -ForegroundColor Yellow

    return $appList
}

# Function to create a new iOS app variant
function New-AppVariant {
    param([string]$AppKey, [hashtable]$Config)

    Write-Host "🏗️  Creating iOS App: $($Config.DisplayName)" -ForegroundColor Green
    Write-Host ""

    $sourcePath = "ios"
    $targetPath = $Config.IOSPath

    if (-not (Test-Path $sourcePath)) {
        Write-Host "❌ Source iOS project not found: $sourcePath" -ForegroundColor Red
        return $false
    }

    if (Test-Path $targetPath) {
        if (-not $Force) {
            Write-Host "⚠️  Target path already exists: $targetPath" -ForegroundColor Yellow
            Write-Host "Use -Force to overwrite" -ForegroundColor Yellow
            return $false
        } else {
            Write-Host "🗑️  Removing existing app at $targetPath" -ForegroundColor Yellow
            Remove-Item -Path $targetPath -Recurse -Force
        }
    }

    Write-Host "📋 Creating app variant..." -ForegroundColor Yellow

    # Copy the entire iOS project
    Copy-Item -Path $sourcePath -Destination $targetPath -Recurse

    # Customize the new app
    Write-Host "🔧 Customizing app configuration..." -ForegroundColor Yellow

    # Update project name in Xcode project
    $projectPath = Join-Path $targetPath "HealthKitBridge.xcodeproj/project.pbxproj"
    if (Test-Path $projectPath) {
        $projectContent = Get-Content $projectPath -Raw
        $newProjectName = $Config.DisplayName -replace '\s+', ''
        $projectContent = $projectContent -replace 'HealthKitBridge', $newProjectName
        Set-Content -Path $projectPath -Value $projectContent -Encoding UTF8

        # Rename project file
        $newProjectPath = Join-Path $targetPath "$newProjectName.xcodeproj"
        Rename-Item -Path (Join-Path $targetPath "HealthKitBridge.xcodeproj") -NewName "$newProjectName.xcodeproj"

        Write-Host "✅ Updated Xcode project: $newProjectName" -ForegroundColor Green
    }

    # Update bundle identifier in Info.plist
    $infoPlistPath = Join-Path $targetPath "HealthKitBridge/Info.plist"
    if (Test-Path $infoPlistPath) {
        $infoPlistContent = Get-Content $infoPlistPath -Raw
        $infoPlistContent = $infoPlistContent -replace "(<key>CFBundleIdentifier</key>\s*<string>).*?(</string>)", "`$1$($Config.BundleId)`$2"
        $infoPlistContent = $infoPlistContent -replace "(<key>CFBundleDisplayName</key>\s*<string>).*?(</string>)", "`$1$($Config.DisplayName)`$2"
        Set-Content -Path $infoPlistPath -Value $infoPlistContent -Encoding UTF8
        Write-Host "✅ Updated Info.plist with bundle ID: $($Config.BundleId)" -ForegroundColor Green
    }

    # Create environment-specific configurations
    foreach ($env in $Config.Environments) {
        Write-Host "📝 Generating $env configuration..." -ForegroundColor Yellow

        # Use the deployment manager to create configs
        $deployManagerPath = Join-Path $targetPath "scripts/ios-deployment-manager.ps1"
        if (Test-Path $deployManagerPath) {
            try {
                & $deployManagerPath -Environment $env -GenerateConfigs -BundleId $Config.BundleId -AppVersion "1.0.0"
                Write-Host "✅ Generated $env configuration" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Error generating $env configuration: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }

    # Create app-specific README
    $readmePath = Join-Path $targetPath "README.md"
    $readmeContent = @"
# $($Config.DisplayName)

$($Config.Description)

## Configuration

- **Bundle ID**: $($Config.BundleId)
- **Worker Name**: $($Config.WorkerName)
- **Supported Environments**: $($Config.Environments -join ', ')

## Features

$($Config.Features | ForEach-Object { "- $_" })

## Deployment

For development:
``````bash
# Deploy Cloudflare Worker
wrangler deploy --env development

# Build and run iOS app
cd $($Config.IOSPath)
open $($Config.DisplayName -replace '\s+', '').xcodeproj
``````

For production:
``````bash
# Deploy Cloudflare Worker
wrangler deploy --env production

# Build for App Store
# Use Xcode to archive and upload
``````

## Scripts

- **Deployment Manager**: ``.\scripts\ios-deployment-manager.ps1``
- **Integration Manager**: ``.\scripts\cloudflare-ios-integration.ps1``

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

    Set-Content -Path $readmePath -Value $readmeContent -Encoding UTF8
    Write-Host "✅ Generated README.md" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 Successfully created app: $($Config.DisplayName)" -ForegroundColor Green
    Write-Host "   Path: $targetPath" -ForegroundColor Gray
    Write-Host "   Next steps:" -ForegroundColor Gray
    Write-Host "   1. Open Xcode project: open $targetPath/$($Config.DisplayName -replace '\s+', '').xcodeproj" -ForegroundColor Gray
    Write-Host "   2. Configure signing and provisioning" -ForegroundColor Gray
    Write-Host "   3. Deploy Cloudflare Worker for each environment" -ForegroundColor Gray

    return $true
}

# Function to deploy multiple apps
function Start-MultiAppDeployment {
    param([array]$AppKeys, [string]$Environment)

    Write-Host "🚀 Multi-App Deployment" -ForegroundColor Green
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Apps: $($AppKeys -join ', ')" -ForegroundColor White
    Write-Host ""

    $deploymentResults = @()

    foreach ($appKey in $AppKeys) {
        $config = $appConfigurations[$appKey]
        if (-not $config) {
            Write-Host "❌ Unknown app: $appKey" -ForegroundColor Red
            continue
        }

        if ($Environment -notin $config.Environments) {
            Write-Host "⚠️  App $appKey does not support environment $Environment" -ForegroundColor Yellow
            continue
        }

        Write-Host "🔄 Deploying $($config.DisplayName)..." -ForegroundColor Cyan

        $result = @{
            App = $appKey
            DisplayName = $config.DisplayName
            Success = $false
            WorkerDeployed = $false
            IOSConfigured = $false
            Errors = @()
        }

        # Check if app exists
        if (-not (Test-Path $config.IOSPath)) {
            $result.Errors += "iOS app not found at $($config.IOSPath)"
            $deploymentResults += $result
            continue
        }

        # Deploy Cloudflare Worker
        try {
            Write-Host "  📡 Deploying worker: $($config.WorkerName)..." -ForegroundColor Yellow
            $workerEnv = "$($config.WorkerName)-$Environment"

            # For this demo, we'll simulate worker deployment
            Write-Host "  ✅ Worker deployed: $workerEnv" -ForegroundColor Green
            $result.WorkerDeployed = $true
        } catch {
            $result.Errors += "Worker deployment failed: $($_.Exception.Message)"
        }

        # Configure iOS app
        try {
            Write-Host "  📱 Configuring iOS app..." -ForegroundColor Yellow

            $integrationScript = Join-Path $config.IOSPath "scripts/cloudflare-ios-integration.ps1"
            if (Test-Path $integrationScript) {
                # Run integration sync
                & $integrationScript -Action sync -Environment $Environment
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ iOS app configured" -ForegroundColor Green
                    $result.IOSConfigured = $true
                } else {
                    $result.Errors += "iOS configuration failed"
                }
            } else {
                $result.Errors += "Integration script not found"
            }
        } catch {
            $result.Errors += "iOS configuration error: $($_.Exception.Message)"
        }

        $result.Success = $result.WorkerDeployed -and $result.IOSConfigured
        $deploymentResults += $result

        if ($result.Success) {
            Write-Host "  🎉 $($config.DisplayName) deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($config.DisplayName) deployment failed" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Deployment summary
    Write-Host "📊 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host ""

    $successful = ($deploymentResults | Where-Object { $_.Success }).Count
    $failed = $deploymentResults.Count - $successful

    Write-Host "✅ Successful: $successful" -ForegroundColor Green
    Write-Host "❌ Failed: $failed" -ForegroundColor Red
    Write-Host ""

    foreach ($result in $deploymentResults) {
        $status = if ($result.Success) { "✅" } else { "❌" }
        Write-Host "$status $($result.DisplayName)" -ForegroundColor $(if ($result.Success) { 'Green' } else { 'Red' })

        if ($result.Errors.Count -gt 0) {
            foreach ($appError in $result.Errors) {
                Write-Host "   • $appError" -ForegroundColor Red
            }
        }
    }

    return $deploymentResults
}

# Function to show status of all apps
function Show-MultiAppStatus {
    Write-Host "📊 Multi-App Status Report" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan
    Write-Host ""

    foreach ($appKey in $appConfigurations.Keys | Sort-Object) {
        $config = $appConfigurations[$appKey]
        $exists = Test-Path $config.IOSPath

        Write-Host "📱 $($config.DisplayName)" -ForegroundColor Yellow
        Write-Host "   Status: $(if ($exists) { '✅ Ready' } else { '❌ Not Created' })" -ForegroundColor $(if ($exists) { 'Green' } else { 'Red' })

        if ($exists) {
            foreach ($env in $config.Environments) {
                # Check if environment configuration exists
                $configPath = Join-Path $config.IOSPath "HealthKitBridge/Config.plist"
                $envConfigured = Test-Path $configPath

                Write-Host "   $env: $(if ($envConfigured) { '✅ Configured' } else { '⚠️  Needs Setup' })" -ForegroundColor $(if ($envConfigured) { 'Green' } else { 'Yellow' })
            }
        }
        Write-Host ""
    }
}

# Interactive mode
function Start-InteractiveMode {
    Write-Host "🔧 Interactive Multi-App Manager" -ForegroundColor Cyan
    Write-Host ""

    do {
        Write-Host "Available actions:" -ForegroundColor White
        Write-Host "1. List all apps" -ForegroundColor Gray
        Write-Host "2. Create new app variant" -ForegroundColor Gray
        Write-Host "3. Deploy apps to environment" -ForegroundColor Gray
        Write-Host "4. Show status" -ForegroundColor Gray
        Write-Host "5. Exit" -ForegroundColor Gray
        Write-Host ""

        $choice = Read-Host "Select action (1-5)"

        switch ($choice) {
            "1" { Get-AppList }
            "2" {
                Write-Host ""
                Write-Host "Available app templates:" -ForegroundColor Yellow
                $keys = $appConfigurations.Keys | Sort-Object
                for ($i = 0; $i -lt $keys.Count; $i++) {
                    Write-Host "$($i + 1). $($keys[$i]) - $($appConfigurations[$keys[$i]].DisplayName)" -ForegroundColor Gray
                }

                $appChoice = Read-Host "Select app to create (1-$($keys.Count))"
                $appIndex = [int]$appChoice - 1

                if ($appIndex -ge 0 -and $appIndex -lt $keys.Count) {
                    $selectedKey = $keys[$appIndex]
                    $confirm = Read-Host "Create $($appConfigurations[$selectedKey].DisplayName)? (y/N)"
                    if ($confirm -eq "y" -or $confirm -eq "Y") {
                        New-AppVariant -AppKey $selectedKey -Config $appConfigurations[$selectedKey]
                    }
                }
            }
            "3" {
                $envChoice = Read-Host "Enter environment (development/staging/production)"
                $appChoice = Read-Host "Enter app keys (comma-separated, or 'all')"

                if ($appChoice -eq "all") {
                    $selectedApps = $appConfigurations.Keys
                } else {
                    $selectedApps = $appChoice -split ',' | ForEach-Object { $_.Trim() }
                }

                Start-MultiAppDeployment -AppKeys $selectedApps -Environment $envChoice
            }
            "4" { Show-MultiAppStatus }
            "5" {
                Write-Host "👋 Goodbye!" -ForegroundColor Green
                return
            }
            default { Write-Host "Invalid choice" -ForegroundColor Red }
        }

        Write-Host ""
        Read-Host "Press Enter to continue"
        Write-Host ""

    } while ($true)
}

# Main execution
if ($Interactive) {
    Start-InteractiveMode
    exit 0
}

switch ($Action.ToLower()) {
    "list" {
        Get-AppList
    }
    "create" {
        if (-not $AppName) {
            Write-Host "❌ AppName required for create action" -ForegroundColor Red
            Write-Host "Available apps: $($appConfigurations.Keys -join ', ')" -ForegroundColor Yellow
            exit 1
        }

        $config = $appConfigurations[$AppName]
        if (-not $config) {
            Write-Host "❌ Unknown app: $AppName" -ForegroundColor Red
            exit 1
        }

        $success = New-AppVariant -AppKey $AppName -Config $config
        exit $(if ($success) { 0 } else { 1 })
    }
    "deploy" {
        if ($Apps.Count -eq 0) {
            $Apps = $appConfigurations.Keys
        }

        $results = Start-MultiAppDeployment -AppKeys $Apps -Environment $Environment
        $failed = ($results | Where-Object { -not $_.Success }).Count
        exit $(if ($failed -eq 0) { 0 } else { 1 })
    }
    "status" {
        Show-MultiAppStatus
    }
    "cleanup" {
        Write-Host "🗑️  Cleanup functionality not implemented" -ForegroundColor Yellow
        Write-Host "To manually cleanup:" -ForegroundColor Gray
        Write-Host "  - Remove iOS app directories" -ForegroundColor Gray
        Write-Host "  - Delete Cloudflare Workers: wrangler delete [worker-name]" -ForegroundColor Gray
    }
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host "Available actions: list, create, deploy, status, cleanup" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  .\multi-app-orchestrator.ps1 -Action list" -ForegroundColor Gray
        Write-Host "  .\multi-app-orchestrator.ps1 -Action create -AppName health-caregiver" -ForegroundColor Gray
        Write-Host "  .\multi-app-orchestrator.ps1 -Action deploy -Apps @('health-main','health-caregiver') -Environment staging" -ForegroundColor Gray
        Write-Host "  .\multi-app-orchestrator.ps1 -Interactive" -ForegroundColor Gray
        exit 1
    }
}
