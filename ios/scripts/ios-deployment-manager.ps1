# 🚀 iOS App Deployment Manager for Cloudflare Integration
# Manages iOS app deployments across multiple environments with Cloudflare backends

param(
    [string]$Environment = "development", # development, staging, production
    [string]$AppVariant = "main", # main, beta, internal
    [switch]$ValidateConfig = $false,
    [switch]$GenerateConfigs = $false,
    [switch]$DeploymentReport = $false,
    [string]$BundleId = "",
    [string]$AppVersion = ""
)

Write-Host "🚀 iOS App Deployment Manager" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "App Variant: $AppVariant" -ForegroundColor White
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

# Define deployment configurations
$deploymentConfigs = @{
    development = @{
        CloudflareWorker = "health-app-dev"
        ApiBaseUrl = "http://127.0.0.1:8789"
        WebSocketUrl = "ws://localhost:3001"
        BundleIdSuffix = ".dev"
        AppDisplayNameSuffix = " (Dev)"
        ProvisioningProfile = "development"
        CodeSignIdentity = "Apple Development"
        AllowedOrigins = "http://localhost:5173,http://127.0.0.1:5173"
        Environment = "development"
    }
    staging = @{
        CloudflareWorker = "health-app-staging"
        ApiBaseUrl = "https://staging-api.yourdomain.com"
        WebSocketUrl = "wss://staging-api.yourdomain.com/ws"
        BundleIdSuffix = ".staging"
        AppDisplayNameSuffix = " (Staging)"
        ProvisioningProfile = "adhoc"
        CodeSignIdentity = "Apple Distribution"
        AllowedOrigins = "https://staging.yourdomain.com"
        Environment = "staging"
    }
    production = @{
        CloudflareWorker = "health-app-prod"
        ApiBaseUrl = "https://api.yourdomain.com"
        WebSocketUrl = "wss://api.yourdomain.com/ws"
        BundleIdSuffix = ""
        AppDisplayNameSuffix = ""
        ProvisioningProfile = "appstore"
        CodeSignIdentity = "Apple Distribution"
        AllowedOrigins = "https://yourdomain.com"
        Environment = "production"
    }
}

$currentConfig = $deploymentConfigs[$Environment]
if (-not $currentConfig) {
    Write-Host "❌ Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Valid environments: development, staging, production" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 DEPLOYMENT CONFIGURATION" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host ""

foreach ($key in $currentConfig.Keys) {
    Write-Host "  $key : $($currentConfig[$key])" -ForegroundColor White
}

# Function to validate Cloudflare Worker deployment
function Test-CloudflareWorker {
    param([string]$WorkerName, [string]$Environment)

    Write-Host ""
    Write-Host "🔍 Validating Cloudflare Worker: $WorkerName" -ForegroundColor Yellow

    try {
        # Check if wrangler is available
        $wranglerVersion = & wrangler --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Wrangler CLI not found - install with: npm install -g wrangler" -ForegroundColor Red
            return $false
        }

        Write-Host "✅ Wrangler CLI available: $wranglerVersion" -ForegroundColor Green

        # List deployments to check if worker exists
        $deployments = & wrangler deployments list --env $Environment 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Worker deployments accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Cannot access worker deployments - check authentication" -ForegroundColor Yellow
        }

        # Test health endpoint if available
        $healthUrl = $currentConfig.ApiBaseUrl + "/health"
        Write-Host "🔍 Testing health endpoint: $healthUrl" -ForegroundColor Yellow

        try {
            $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
            Write-Host "✅ Health endpoint responsive: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "⚠️  Health endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
            return $false
        }

    } catch {
        Write-Host "❌ Error validating worker: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to generate iOS configuration files
function New-IOSConfigs {
    param([hashtable]$Config, [string]$Variant)

    Write-Host ""
    Write-Host "📝 Generating iOS Configuration Files" -ForegroundColor Green
    Write-Host ""

    $iosPath = "ios"
    $configPath = Join-Path $iosPath "HealthKitBridge"

    # Generate Config.plist
    $configPlistPath = Join-Path $configPath "Config.plist"
    $configPlist = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>userId</key>
    <string>$($Variant)_user</string>
    <key>apiBaseURL</key>
    <string>$($Config.ApiBaseUrl)</string>
    <key>webSocketURL</key>
    <string>$($Config.WebSocketUrl)</string>
    <key>environment</key>
    <string>$($Config.Environment)</string>
    <key>variant</key>
    <string>$Variant</string>
    <key>version</key>
    <string>$(if ($AppVersion) { $AppVersion } else { "1.0.0" })</string>
    <key>buildDate</key>
    <string>$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</string>
</dict>
</plist>
"@

    Set-Content -Path $configPlistPath -Value $configPlist -Encoding UTF8
    Write-Host "✅ Generated: $configPlistPath" -ForegroundColor Green

    # Generate environment-specific Swift configuration
    $swiftConfigPath = Join-Path $configPath "EnvironmentConfig.swift"
    $swiftConfig = @"
// Auto-generated configuration for $Environment environment
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

import Foundation

struct EnvironmentConfig {
    static let environment = "$($Config.Environment)"
    static let variant = "$Variant"
    static let apiBaseURL = "$($Config.ApiBaseUrl)"
    static let webSocketURL = "$($Config.WebSocketUrl)"
    static let bundleIdSuffix = "$($Config.BundleIdSuffix)"
    static let appDisplayNameSuffix = "$($Config.AppDisplayNameSuffix)"

    static var isProduction: Bool {
        return environment == "production"
    }

    static var isDevelopment: Bool {
        return environment == "development"
    }

    static var isStaging: Bool {
        return environment == "staging"
    }

    // Network configuration
    static let requestTimeout: TimeInterval = $(if ($Config.Environment -eq "development") { "30.0" } else { "15.0" })
    static let maxRetries = $(if ($Config.Environment -eq "development") { "5" } else { "3" })

    // Logging configuration
    static let enableVerboseLogging = $(if ($Config.Environment -eq "production") { "false" } else { "true" })
    static let enableNetworkLogging = $(if ($Config.Environment -eq "production") { "false" } else { "true" })
}

// MARK: - URL Extensions
extension EnvironmentConfig {
    static var healthEndpoint: String {
        return "\(apiBaseURL)/health"
    }

    static var authEndpoint: String {
        return "\(apiBaseURL)/auth"
    }

    static var healthDataEndpoint: String {
        return "\(apiBaseURL)/api/health-data"
    }
}

// MARK: - Debug Helpers
#if DEBUG
extension EnvironmentConfig {
    static func printConfiguration() {
        print("🔧 Environment Configuration")
        print("Environment: \(environment)")
        print("Variant: \(variant)")
        print("API Base URL: \(apiBaseURL)")
        print("WebSocket URL: \(webSocketURL)")
        print("Is Production: \(isProduction)")
        print("Verbose Logging: \(enableVerboseLogging)")
    }
}
#endif
"@

    Set-Content -Path $swiftConfigPath -Value $swiftConfig -Encoding UTF8
    Write-Host "✅ Generated: $swiftConfigPath" -ForegroundColor Green

    # Generate Xcode configuration file
    $xcconfigPath = Join-Path $iosPath "$Environment.xcconfig"
    $xcconfig = @"
// Xcode configuration for $Environment environment
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

// Bundle Identifier
PRODUCT_BUNDLE_IDENTIFIER = $(if ($BundleId) { $BundleId } else { "com.yourcompany.health" })$($Config.BundleIdSuffix)

// App Display Name
PRODUCT_NAME = Health App$($Config.AppDisplayNameSuffix)

// Code Signing
CODE_SIGN_IDENTITY = $($Config.CodeSignIdentity)
PROVISIONING_PROFILE_SPECIFIER = $($Config.ProvisioningProfile)

// Build Settings
SWIFT_ACTIVE_COMPILATION_CONDITIONS = $(if ($Config.Environment -ne "production") { "DEBUG" } else { "RELEASE" })
SWIFT_OPTIMIZATION_LEVEL = $(if ($Config.Environment -eq "production") { "-O" } else { "-Onone" })

// Custom Build Settings
ENVIRONMENT = $($Config.Environment)
VARIANT = $Variant
API_BASE_URL = $($Config.ApiBaseUrl)
WEBSOCKET_URL = $($Config.WebSocketUrl)

// Version Information
MARKETING_VERSION = $(if ($AppVersion) { $AppVersion } else { "1.0.0" })
CURRENT_PROJECT_VERSION = $(Get-Date -Format "yyyyMMddHHmm")
"@

    Set-Content -Path $xcconfigPath -Value $xcconfig -Encoding UTF8
    Write-Host "✅ Generated: $xcconfigPath" -ForegroundColor Green

    return @($configPlistPath, $swiftConfigPath, $xcconfigPath)
}

# Function to validate iOS configuration
function Test-IOSConfiguration {
    Write-Host ""
    Write-Host "🔍 Validating iOS Configuration" -ForegroundColor Yellow

    $issues = @()
    $iosPath = "ios"

    # Check required files
    $requiredFiles = @(
        "HealthKitBridge/HealthKitBridgeApp.swift",
        "HealthKitBridge/Config.plist",
        "HealthKitBridge.xcodeproj/project.pbxproj"
    )

    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $iosPath $file
        if (Test-Path $fullPath) {
            Write-Host "✅ $file exists" -ForegroundColor Green
        } else {
            $issues += "❌ Missing required file: $file"
        }
    }

    # Validate Config.plist
    $configPath = Join-Path $iosPath "HealthKitBridge/Config.plist"
    if (Test-Path $configPath) {
        $configContent = Get-Content $configPath -Raw

        # Check for required keys
        $requiredKeys = @("apiBaseURL", "webSocketURL", "userId")
        foreach ($key in $requiredKeys) {
            if ($configContent -match $key) {
                Write-Host "✅ Config.plist contains $key" -ForegroundColor Green
            } else {
                $issues += "❌ Config.plist missing key: $key"
            }
        }

        # Validate URLs
        if ($configContent -match "apiBaseURL.*<string>(.*?)</string>") {
            $apiUrl = $Matches[1]
            if ($apiUrl -eq $currentConfig.ApiBaseUrl) {
                Write-Host "✅ API URL matches environment configuration" -ForegroundColor Green
            } else {
                $issues += "⚠️  API URL mismatch - Expected: $($currentConfig.ApiBaseUrl), Found: $apiUrl"
            }
        }
    }

    return $issues
}

# Function to generate deployment report
function New-DeploymentReport {
    param([array]$Issues, [array]$GeneratedFiles)

    Write-Host ""
    Write-Host "📊 DEPLOYMENT REPORT" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    Write-Host ""

    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        environment = $Environment
        appVariant = $AppVariant
        configuration = $currentConfig
        issues = $Issues
        generatedFiles = $GeneratedFiles
        cloudflareWorkerStatus = $null
    }

    # Test Cloudflare Worker
    $workerStatus = Test-CloudflareWorker -WorkerName $currentConfig.CloudflareWorker -Environment $Environment
    $report.cloudflareWorkerStatus = $workerStatus

    # Display summary
    Write-Host "📋 Summary:" -ForegroundColor White
    Write-Host "  Environment: $Environment" -ForegroundColor Gray
    Write-Host "  App Variant: $AppVariant" -ForegroundColor Gray
    Write-Host "  Cloudflare Worker: $($currentConfig.CloudflareWorker)" -ForegroundColor Gray
    Write-Host "  Worker Status: $(if ($workerStatus) { '✅ Available' } else { '❌ Issues' })" -ForegroundColor $(if ($workerStatus) { 'Green' } else { 'Red' })
    Write-Host "  Configuration Issues: $($Issues.Count)" -ForegroundColor $(if ($Issues.Count -eq 0) { 'Green' } else { 'Red' })

    if ($GeneratedFiles.Count -gt 0) {
        Write-Host ""
        Write-Host "📝 Generated Files:" -ForegroundColor Green
        foreach ($file in $GeneratedFiles) {
            Write-Host "  ✅ $file" -ForegroundColor Green
        }
    }

    if ($Issues.Count -gt 0) {
        Write-Host ""
        Write-Host "⚠️  Configuration Issues:" -ForegroundColor Yellow
        foreach ($issue in $Issues) {
            Write-Host "  $issue" -ForegroundColor Red
        }
    }

    # Export report
    $reportPath = "deployment-report-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $report | ConvertTo-Json -Depth 10 | Set-Content $reportPath -Encoding UTF8
    Write-Host ""
    Write-Host "📄 Report exported: $reportPath" -ForegroundColor Green

    return $report
}

# Main execution
$generatedFiles = @()
$issues = @()

if ($GenerateConfigs) {
    $generatedFiles = New-IOSConfigs -Config $currentConfig -Variant $AppVariant
}

if ($ValidateConfig) {
    $issues = Test-IOSConfiguration
}

if ($DeploymentReport -or $ValidateConfig -or $GenerateConfigs) {
    $report = New-DeploymentReport -Issues $issues -GeneratedFiles $generatedFiles
}

# Display next steps
Write-Host ""
Write-Host "🎯 NEXT STEPS" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($Environment -eq "development") {
    Write-Host "1. Start Cloudflare Worker: npm run cf:dev" -ForegroundColor White
    Write-Host "2. Start WebSocket server: npm run start:server" -ForegroundColor White
    Write-Host "3. Open iOS project in Xcode" -ForegroundColor White
    Write-Host "4. Build and run on simulator" -ForegroundColor White
} elseif ($Environment -eq "staging") {
    Write-Host "1. Deploy worker: wrangler deploy --env staging" -ForegroundColor White
    Write-Host "2. Build iOS app for TestFlight" -ForegroundColor White
    Write-Host "3. Upload to App Store Connect" -ForegroundColor White
    Write-Host "4. Distribute to internal testers" -ForegroundColor White
} else {
    Write-Host "1. Deploy worker: wrangler deploy --env production" -ForegroundColor White
    Write-Host "2. Build iOS app for App Store" -ForegroundColor White
    Write-Host "3. Upload to App Store Connect" -ForegroundColor White
    Write-Host "4. Submit for review" -ForegroundColor White
}

Write-Host ""
Write-Host "🛠️  Available Commands:" -ForegroundColor Cyan
Write-Host "  -GenerateConfigs       # Generate environment-specific configs" -ForegroundColor White
Write-Host "  -ValidateConfig        # Validate current configuration" -ForegroundColor White
Write-Host "  -DeploymentReport      # Generate deployment report" -ForegroundColor White
Write-Host "  -Environment dev|staging|prod  # Target environment" -ForegroundColor White
Write-Host "  -AppVariant main|beta|internal # App variant" -ForegroundColor White

if ($issues.Count -gt 0) {
    exit 1
} else {
    exit 0
}
