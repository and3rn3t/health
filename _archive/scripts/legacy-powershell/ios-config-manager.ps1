#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Automated iOS Configuration Manager for VitalSense

.DESCRIPTION
    Switches between different iOS app configurations (Production, Development, Staging, Testing)
    with automated validation, backup, and restoration capabilities.

.PARAMETER Environment
    Target environment: Production, Development, Staging, Testing

.PARAMETER Backup
    Create backup of current configuration before switching

.PARAMETER Validate
    Run comprehensive validation after switching

.PARAMETER Force
    Force switch without confirmation prompts

.PARAMETER Restore
    Restore from backup instead of switching

.EXAMPLE
    ./ios-config-manager.ps1 -Environment Production -Validate

.EXAMPLE
    ./ios-config-manager.ps1 -Environment Development -Backup -Force

.EXAMPLE
    ./ios-config-manager.ps1 -Restore
#>

param(
    [ValidateSet("Production", "Development", "Staging", "Testing")]
    [string]$Environment,

    [switch]$Backup,
    [switch]$Validate,
    [switch]$Force,
    [switch]$Restore,
    [switch]$Status
)

# Configuration paths
$ConfigBasePath = "ios/VitalSense/Resources"
$BackupPath = "$ConfigBasePath/Backups"
$CurrentConfigPath = "$ConfigBasePath/Config.plist"

$Configurations = @{
    "Production" = @{
        File = "$ConfigBasePath/Config.production.plist"
        ApiUrl = "https://health.andernet.dev/api"
        WsUrl = "wss://health.andernet.dev/ws"
        UserId = "vitalsense-user-prod"
        Description = "Live production environment"
        ValidationEndpoints = @(
            "https://health.andernet.dev/health",
            "https://health.andernet.dev/api/health"
        )
    }
    "Development" = @{
        File = "$ConfigBasePath/Config.development.plist"
        ApiUrl = "http://127.0.0.1:8789/api"
        WsUrl = "ws://localhost:3001/ws"
        UserId = "vitalsense-user-dev"
        Description = "Local development environment"
        ValidationEndpoints = @(
            "http://127.0.0.1:8789/health",
            "http://127.0.0.1:8789/api/health"
        )
    }
    "Staging" = @{
        File = "$ConfigBasePath/Config.staging.plist"
        ApiUrl = "https://staging.health.andernet.dev/api"
        WsUrl = "wss://staging.health.andernet.dev/ws"
        UserId = "vitalsense-user-staging"
        Description = "Staging environment for pre-production testing"
        ValidationEndpoints = @(
            "https://staging.health.andernet.dev/health",
            "https://staging.health.andernet.dev/api/health"
        )
    }
    "Testing" = @{
        File = "$ConfigBasePath/Config.testing.plist"
        ApiUrl = "https://test.health.andernet.dev/api"
        WsUrl = "wss://test.health.andernet.dev/ws"
        UserId = "vitalsense-user-test"
        Description = "Automated testing environment"
        ValidationEndpoints = @(
            "https://test.health.andernet.dev/health",
            "https://test.health.andernet.dev/api/health"
        )
    }
}

function Write-Header {
    param([string]$Title)
    Write-Host "`n🔧 VitalSense iOS Configuration Manager" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host $Title -ForegroundColor Yellow
}

function Get-CurrentEnvironment {
    if (-not (Test-Path $CurrentConfigPath)) {
        return "None"
    }

    $content = Get-Content $CurrentConfigPath -Raw
    foreach ($env in $Configurations.Keys) {
        $config = $Configurations[$env]
        if ($content -match [regex]::Escape($config.ApiUrl)) {
            return $env
        }
    }
    return "Unknown"
}

function Show-Status {
    Write-Header "Configuration Status"

    $currentEnv = Get-CurrentEnvironment
    Write-Host "`n📍 Current Environment: " -NoNewline
    if ($currentEnv -eq "None") {
        Write-Host "No configuration found" -ForegroundColor Red
    } elseif ($currentEnv -eq "Unknown") {
        Write-Host "Unknown configuration" -ForegroundColor Yellow
    } else {
        Write-Host $currentEnv -ForegroundColor Green
        $config = $Configurations[$currentEnv]
        Write-Host "   API: $($config.ApiUrl)" -ForegroundColor Gray
        Write-Host "   WebSocket: $($config.WsUrl)" -ForegroundColor Gray
    }

    Write-Host "`n📁 Available Configurations:" -ForegroundColor Cyan
    foreach ($env in $Configurations.Keys) {
        $config = $Configurations[$env]
        $exists = Test-Path $config.File
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "   $status $env - $($config.Description)" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }

    # Show recent backups
    if (Test-Path $BackupPath) {
        $backups = Get-ChildItem "$BackupPath/*.plist" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
        if ($backups) {
            Write-Host "`n💾 Recent Backups:" -ForegroundColor Cyan
            foreach ($backup in $backups) {
                Write-Host "   📄 $($backup.Name) - $($backup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
            }
        }
    }
}

function Create-Backup {
    param([string]$Reason = "Manual backup")

    if (-not (Test-Path $CurrentConfigPath)) {
        Write-Host "⚠️  No current configuration to backup" -ForegroundColor Yellow
        return $false
    }

    # Ensure backup directory exists
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $currentEnv = Get-CurrentEnvironment
    $backupFile = "$BackupPath/Config-$currentEnv-$timestamp.plist"

    try {
        Copy-Item $CurrentConfigPath $backupFile
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
        Write-Host "   Reason: $Reason" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Switch-Environment {
    param([string]$TargetEnvironment)

    $config = $Configurations[$TargetEnvironment]

    if (-not (Test-Path $config.File)) {
        Write-Host "❌ Configuration file not found: $($config.File)" -ForegroundColor Red

        # Offer to create the configuration
        if (-not $Force) {
            $create = Read-Host "Would you like to create this configuration? (y/N)"
            if ($create.ToLower() -ne 'y') {
                return $false
            }
        }

        Create-ConfigurationFile -Environment $TargetEnvironment
    }

    # Create backup if requested or if current config exists
    if ($Backup -or (Test-Path $CurrentConfigPath)) {
        if (-not (Create-Backup -Reason "Before switching to $TargetEnvironment")) {
            if (-not $Force) {
                Write-Host "❌ Backup failed. Use -Force to continue anyway." -ForegroundColor Red
                return $false
            }
        }
    }

    # Perform the switch
    try {
        Copy-Item $config.File $CurrentConfigPath -Force
        Write-Host "✅ Switched to $TargetEnvironment environment" -ForegroundColor Green
        Write-Host "   API: $($config.ApiUrl)" -ForegroundColor Gray
        Write-Host "   WebSocket: $($config.WsUrl)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ Switch failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Create-ConfigurationFile {
    param([string]$Environment)

    $config = $Configurations[$Environment]

    $plistContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>USER_ID</key>
    <string>$($config.UserId)</string>
    <key>API_BASE_URL</key>
    <string>$($config.ApiUrl)</string>
    <key>WS_URL</key>
    <string>$($config.WsUrl)</string>
    <key>useMLGaitRiskScorer</key>
    <true/>
    <key>useWatchCadenceFusion</key>
    <true/>
    <key>Environment</key>
    <string>$Environment</string>
</dict>
</plist>
"@

    try {
        Set-Content -Path $config.File -Value $plistContent -Encoding UTF8
        Write-Host "✅ Created configuration file: $($config.File)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to create configuration: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-Configuration {
    param([string]$Environment)

    Write-Host "`n🧪 Validating $Environment configuration..." -ForegroundColor Yellow

    $config = $Configurations[$Environment]
    $allPassed = $true

    foreach ($endpoint in $config.ValidationEndpoints) {
        Write-Host "   Testing $endpoint..." -NoNewline
        try {
            $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -SkipHttpErrorCheck
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
                Write-Host " ✅ $($response.StatusCode)" -ForegroundColor Green
            } else {
                Write-Host " ⚠️  $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " ❌ Failed" -ForegroundColor Red
            Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
            $allPassed = $false
        }
    }

    if ($allPassed) {
        Write-Host "✅ All validation tests passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Some validation tests failed" -ForegroundColor Yellow
    }

    return $allPassed
}

function Restore-FromBackup {
    if (-not (Test-Path $BackupPath)) {
        Write-Host "❌ No backup directory found" -ForegroundColor Red
        return $false
    }

    $backups = Get-ChildItem "$BackupPath/*.plist" | Sort-Object LastWriteTime -Descending
    if (-not $backups) {
        Write-Host "❌ No backup files found" -ForegroundColor Red
        return $false
    }

    Write-Host "`n💾 Available backups:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min($backups.Count, 10); $i++) {
        $backup = $backups[$i]
        Write-Host "   $($i + 1). $($backup.Name) - $($backup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
    }

    if (-not $Force) {
        $selection = Read-Host "`nSelect backup to restore (1-$([Math]::Min($backups.Count, 10)))"
        try {
            $index = [int]$selection - 1
            if ($index -lt 0 -or $index -ge $backups.Count) {
                Write-Host "❌ Invalid selection" -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "❌ Invalid selection" -ForegroundColor Red
            return $false
        }
    } else {
        $index = 0  # Restore latest backup when using -Force
    }

    $selectedBackup = $backups[$index]

    try {
        Copy-Item $selectedBackup.FullName $CurrentConfigPath -Force
        Write-Host "✅ Restored from backup: $($selectedBackup.Name)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Restore failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
if ($Status) {
    Show-Status
    exit 0
}

if ($Restore) {
    Write-Header "Restoring Configuration"
    if (Restore-FromBackup) {
        if ($Validate) {
            $env = Get-CurrentEnvironment
            if ($env -ne "None" -and $env -ne "Unknown") {
                Test-Configuration -Environment $env
            }
        }
    }
    exit 0
}

if (-not $Environment) {
    Write-Host "❌ Environment parameter is required" -ForegroundColor Red
    Write-Host "Usage: ./ios-config-manager.ps1 -Environment <Production|Development|Staging|Testing>" -ForegroundColor Gray
    Write-Host "       ./ios-config-manager.ps1 -Status" -ForegroundColor Gray
    Write-Host "       ./ios-config-manager.ps1 -Restore" -ForegroundColor Gray
    exit 1
}

Write-Header "Switching to $Environment Environment"

# Confirmation prompt (unless -Force is used)
if (-not $Force) {
    $currentEnv = Get-CurrentEnvironment
    if ($currentEnv -ne "None") {
        Write-Host "Current environment: $currentEnv" -ForegroundColor Yellow
    }
    Write-Host "Target environment: $Environment" -ForegroundColor Green
    $confirm = Read-Host "Continue with switch? (y/N)"
    if ($confirm.ToLower() -ne 'y') {
        Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Perform the switch
if (Switch-Environment -TargetEnvironment $Environment) {
    Write-Host "`n🎉 Successfully switched to $Environment environment!" -ForegroundColor Green

    # Run validation if requested
    if ($Validate) {
        Test-Configuration -Environment $Environment
    }

    # Show next steps
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Build iOS app: xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense build" -ForegroundColor Gray
    Write-Host "   2. Test configuration: ./validate-ios-production-config.ps1" -ForegroundColor Gray
    Write-Host "   3. Validate functionality: Run app and test key features" -ForegroundColor Gray

} else {
    Write-Host "`n❌ Failed to switch to $Environment environment" -ForegroundColor Red
    exit 1
}
