#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Interactive iOS Environment Quick Switch Tool

.DESCRIPTION
    Interactive menu-driven tool for fast environment switching with
    real-time validation and performance insights.

.PARAMETER Interactive
    Launch interactive menu mode

.PARAMETER FastSwitch
    Skip confirmations for faster switching

.PARAMETER ShowPerformance
    Display performance metrics during selection

.EXAMPLE
    ./ios-quick-switch.ps1 -Interactive

.EXAMPLE
    ./ios-quick-switch.ps1 -Interactive -ShowPerformance -FastSwitch
#>

param(
    [switch]$Interactive,
    [switch]$FastSwitch,
    [switch]$ShowPerformance
)

# Import required modules
$configManagerPath = Join-Path $PSScriptRoot "ios-config-manager.ps1"
if (Test-Path $configManagerPath) {
    . $configManagerPath
}

function Show-InteractiveMenu {
    Clear-Host
    Write-Host "⚡ VitalSense iOS Quick Environment Switch" -ForegroundColor Cyan
    Write-Host "=" * 50

    # Get current environment
    $currentEnv = Get-CurrentEnvironment
    Write-Host "Current Environment: " -NoNewline
    if ($currentEnv -eq "None") {
        Write-Host "No configuration found" -ForegroundColor Red
    } elseif ($currentEnv -eq "Unknown") {
        Write-Host "Unknown configuration" -ForegroundColor Yellow
    } else {
        Write-Host $currentEnv -ForegroundColor Green
    }

    Write-Host "`n📱 Available Environments:" -ForegroundColor Yellow

    $menuItems = @()
    $index = 1

    foreach ($envName in $Configurations.Keys | Sort-Object) {
        $config = $Configurations[$envName]
        $exists = Test-Path $config.File
        $status = if ($exists) { "✅" } else { "❌" }
        $current = if ($envName -eq $currentEnv) { " (current)" } else { "" }

        Write-Host "  $index. $status $envName$current" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })

        if ($ShowPerformance -and $exists) {
            $perfInfo = Get-QuickPerformanceInfo -Environment $envName
            Write-Host "     $perfInfo" -ForegroundColor Gray
        }

        $menuItems += @{
            Index = $index
            Environment = $envName
            Exists = $exists
            IsCurrent = ($envName -eq $currentEnv)
        }
        $index++
    }

    Write-Host "`n🛠️  Quick Actions:" -ForegroundColor Yellow
    Write-Host "  s. Show Status & Backups" -ForegroundColor Cyan
    Write-Host "  p. Performance Benchmark" -ForegroundColor Cyan
    Write-Host "  r. Restore from Backup" -ForegroundColor Cyan
    Write-Host "  m. Monitor Health" -ForegroundColor Cyan
    Write-Host "  q. Quit" -ForegroundColor Gray

    return $menuItems
}

function Get-QuickPerformanceInfo {
    param([string]$Environment)

    $config = $Configurations[$Environment]
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $config.HealthUrl -TimeoutSec 3 -SkipHttpErrorCheck
        $stopwatch.Stop()

        if ($response.StatusCode -eq 200) {
            return "⚡ $($stopwatch.ElapsedMilliseconds)ms"
        } else {
            return "⚠️  HTTP $($response.StatusCode)"
        }
    } catch {
        return "❌ Unreachable"
    }
}

function Invoke-QuickSwitch {
    param([string]$TargetEnvironment)

    $currentEnv = Get-CurrentEnvironment

    if ($TargetEnvironment -eq $currentEnv) {
        Write-Host "`n✅ Already using $TargetEnvironment environment!" -ForegroundColor Green
        return $true
    }

    Write-Host "`n🔄 Switching to $TargetEnvironment..." -ForegroundColor Yellow

    # Quick performance check if not fast switch
    if (-not $FastSwitch) {
        Write-Host "   Checking target environment..." -NoNewline
        $perfInfo = Get-QuickPerformanceInfo -Environment $TargetEnvironment
        Write-Host " $perfInfo" -ForegroundColor Gray
    }

    # Perform the switch
    $success = Switch-Environment -TargetEnvironment $TargetEnvironment

    if ($success) {
        Write-Host "✅ Successfully switched to $TargetEnvironment!" -ForegroundColor Green

        # Quick validation unless fast switch
        if (-not $FastSwitch) {
            Write-Host "   Running quick validation..." -NoNewline
            $config = $Configurations[$TargetEnvironment]
            try {
                $response = Invoke-WebRequest -Uri $config.HealthUrl -TimeoutSec 5 -SkipHttpErrorCheck
                if ($response.StatusCode -eq 200) {
                    Write-Host " ✅ Validated" -ForegroundColor Green
                } else {
                    Write-Host " ⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host " ❌ Validation failed" -ForegroundColor Red
            }
        }

        return $true
    } else {
        Write-Host "❌ Switch failed!" -ForegroundColor Red
        return $false
    }
}

function Show-QuickStatus {
    Write-Host "`n📊 Quick Status Overview" -ForegroundColor Cyan
    Write-Host "-" * 30

    $currentEnv = Get-CurrentEnvironment
    Write-Host "Current: $currentEnv" -ForegroundColor Green

    Write-Host "`nEnvironment Health:" -ForegroundColor Yellow
    foreach ($envName in $Configurations.Keys | Sort-Object) {
        $config = $Configurations[$envName]
        if (Test-Path $config.File) {
            Write-Host "  ${envName}: " -NoNewline -ForegroundColor White
            $perfInfo = Get-QuickPerformanceInfo -Environment $envName
            Write-Host $perfInfo -ForegroundColor Gray
        }
    }

   # Show recent backups
    $backupPath = "ios/VitalSense/Resources/Backups"
    if (Test-Path $backupPath) {
        $backups = Get-ChildItem "$backupPath/*.plist" | Sort-Object LastWriteTime -Descending | Select-Object -First 3
        if ($backups) {
            Write-Host "`nRecent Backups:" -ForegroundColor Yellow
            foreach ($backup in $backups) {
                Write-Host "  📄 $($backup.Name)" -ForegroundColor Gray
            }
        }
    }
}

function Start-QuickMonitoring {
    Write-Host "`n🔍 Starting Quick Health Monitor..." -ForegroundColor Cyan
    Write-Host "Press any key to stop monitoring" -ForegroundColor Gray

    $currentEnv = Get-CurrentEnvironment
    if ($currentEnv -eq "None" -or $currentEnv -eq "Unknown") {
        Write-Host "❌ No valid environment configured for monitoring" -ForegroundColor Red
        return
    }

    $checkCount = 0

    try {
        while (-not [Console]::KeyAvailable) {
            $checkCount++
            Write-Host "`r🔍 Check #$checkCount - " -NoNewline -ForegroundColor Cyan

            $perfInfo = Get-QuickPerformanceInfo -Environment $currentEnv
            Write-Host "${currentEnv}: $perfInfo" -NoNewline -ForegroundColor Gray

            Start-Sleep -Seconds 2
        }
    } finally {
        # Clear the key press
        if ([Console]::KeyAvailable) {
            [Console]::ReadKey($true) | Out-Null
        }
        Write-Host "`n✅ Monitoring stopped" -ForegroundColor Green
    }
}

function Invoke-QuickBenchmark {
    Write-Host "`n📊 Running Quick Performance Benchmark..." -ForegroundColor Cyan

    $results = @()
    foreach ($envName in $Configurations.Keys) {
        $config = $Configurations[$envName]
        if (Test-Path $config.File) {
            Write-Host "  Testing $envName..." -NoNewline -ForegroundColor Gray

            $total = 0
            $successful = 0

            for ($i = 0; $i -lt 3; $i++) {
                try {
                    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                    $response = Invoke-WebRequest -Uri $config.HealthUrl -TimeoutSec 5 -SkipHttpErrorCheck
                    $stopwatch.Stop()

                    if ($response.StatusCode -eq 200) {
                        $total += $stopwatch.ElapsedMilliseconds
                        $successful++
                    }
                } catch {
                    # Ignore failures for quick test
                }
                Start-Sleep -Milliseconds 100
            }

            if ($successful -gt 0) {
                $avgTime = [Math]::Round($total / $successful, 0)
                Write-Host " ✅ ${avgTime}ms avg" -ForegroundColor Green
                $results += @{ Environment = $envName; AvgTime = $avgTime; Success = $true }
            } else {
                Write-Host " ❌ Failed" -ForegroundColor Red
                $results += @{ Environment = $envName; Success = $false }
            }
        }
    }

    # Show ranking
    Write-Host "`n🏆 Performance Ranking:" -ForegroundColor Yellow
    $successfulResults = $results | Where-Object { $_.Success } | Sort-Object AvgTime
    for ($i = 0; $i -lt $successfulResults.Count; $i++) {
        $result = $successfulResults[$i]
        $medal = switch ($i) {
            0 { "🥇" }
            1 { "🥈" }
            2 { "🥉" }
            default { "  " }
        }
        Write-Host "  $medal $($result.Environment): $($result.AvgTime)ms" -ForegroundColor Gray
    }
}

function Start-InteractiveMode {
    do {
        $menuItems = Show-InteractiveMenu

        Write-Host "`nSelect option: " -NoNewline -ForegroundColor White
        $selection = Read-Host

        switch ($selection.ToLower()) {
            "s" {
                Show-QuickStatus
                Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
                Read-Host | Out-Null
            }
            "p" {
                Invoke-QuickBenchmark
                Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
                Read-Host | Out-Null
            }
            "r" {
                Write-Host "`n💾 Restoring from backup..." -ForegroundColor Yellow
                Restore-FromBackup | Out-Null
                Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
                Read-Host | Out-Null
            }
            "m" {
                Start-QuickMonitoring
            }
            "q" {
                Write-Host "`n👋 Goodbye!" -ForegroundColor Cyan
                return
            }
            default {
                # Try to parse as environment selection
                try {
                    $envIndex = [int]$selection
                    $selectedItem = $menuItems | Where-Object { $_.Index -eq $envIndex }

                    if ($selectedItem) {
                        if (-not $selectedItem.Exists) {
                            Write-Host "`n❌ Configuration file for $($selectedItem.Environment) not found!" -ForegroundColor Red
                            Write-Host "Create it first using: ./ios-config-manager.ps1 -Environment $($selectedItem.Environment)" -ForegroundColor Gray
                        } elseif ($selectedItem.IsCurrent) {
                            Write-Host "`n✅ Already using $($selectedItem.Environment) environment!" -ForegroundColor Green
                        } else {
                            if ($FastSwitch -or (Read-Host "`nSwitch to $($selectedItem.Environment)? (y/N)").ToLower() -eq 'y') {
                                Invoke-QuickSwitch -TargetEnvironment $selectedItem.Environment
                            }
                        }

                        if (-not $FastSwitch) {
                            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
                            Read-Host | Out-Null
                        }
                    } else {
                        Write-Host "`n❌ Invalid selection" -ForegroundColor Red
                        Start-Sleep -Seconds 1
                    }
                } catch {
                    Write-Host "`n❌ Invalid selection" -ForegroundColor Red
                    Start-Sleep -Seconds 1
                }
            }
        }
    } while ($true)
}

# Main execution
if (-not $Interactive) {
    Write-Host "❌ This tool requires -Interactive parameter" -ForegroundColor Red
    Write-Host "Usage: ./ios-quick-switch.ps1 -Interactive [-FastSwitch] [-ShowPerformance]" -ForegroundColor Gray
    exit 1
}

Start-InteractiveMode
