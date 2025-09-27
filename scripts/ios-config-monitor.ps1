#!/usr/bin/env pwsh

<#
.SYNOPSIS
    iOS Configuration Monitoring and Health Alerting System

.DESCRIPTION
    Continuous monitoring of iOS app configurations with real-time health checks,
    performance tracking, and automated alerting for issues.

.PARAMETER Continuous
    Run continuous monitoring (default: 5 minute intervals)

.PARAMETER Interval
    Monitoring interval in seconds (default: 300)

.PARAMETER AlertThreshold
    Response time threshold for alerts in milliseconds (default: 2000)

.PARAMETER EmailAlerts
    Enable email alerts (requires SMTP configuration)

.PARAMETER SlackWebhook
    Slack webhook URL for notifications

.PARAMETER LogFile
    Path to monitoring log file

.EXAMPLE
    ./ios-config-monitor.ps1 -Continuous -AlertThreshold 1500

.EXAMPLE
    ./ios-config-monitor.ps1 -Interval 60 -LogFile "monitoring.log"
#>

param(
    [switch]$Continuous,
    [int]$Interval = 300,  # 5 minutes
    [int]$AlertThreshold = 2000,  # 2 seconds
    [string]$EmailAlerts,
    [string]$SlackWebhook,
    [string]$LogFile = "ios-config-monitoring.log",
    [switch]$Dashboard,
    [int]$HistoryDays = 7
)

# Import configuration manager
$configManagerPath = Join-Path $PSScriptRoot "ios-config-manager.ps1"
if (Test-Path $configManagerPath) {
    . $configManagerPath
}

$MonitoringState = @{
    StartTime = Get-Date
    CheckCount = 0
    Alerts = @()
    History = @()
    CurrentStatus = @{}
}

function Write-MonitorHeader {
    param([string]$Title)
    Write-Host "`n🔍 VitalSense iOS Configuration Monitor" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host $Title -ForegroundColor Yellow
}

function Write-LogEntry {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Environment = "",
        [hashtable]$Data = @{}
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = @{
        Timestamp = $timestamp
        Level = $Level
        Environment = $Environment
        Message = $Message
        Data = $Data
    }

    # Console output with colors
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "Gray" }
    }

    $envText = if ($Environment) { "[$Environment] " } else { "" }
    Write-Host "[$timestamp] $envText$Message" -ForegroundColor $color

    # File logging
    if ($LogFile) {
        $logLine = "[$timestamp] [$Level] $envText$Message"
        if ($Data.Count -gt 0) {
            $logLine += " | Data: $($Data | ConvertTo-Json -Compress)"
        }
        Add-Content -Path $LogFile -Value $logLine -Encoding UTF8
    }

    # Add to monitoring history
    $MonitoringState.History += $logEntry

    # Trim history to keep only recent entries
    if ($MonitoringState.History.Count -gt 1000) {
        $MonitoringState.History = $MonitoringState.History | Select-Object -Last 500
    }
}

function Test-EndpointHealth {
    param(
        [string]$Environment,
        [string]$Url,
        [string]$Type = "Health"
    )

    $result = @{
        Environment = $Environment
        Url = $Url
        Type = $Type
        Success = $false
        ResponseTime = $null
        StatusCode = $null
        Error = $null
        Timestamp = Get-Date
    }

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -SkipHttpErrorCheck
        $stopwatch.Stop()

        $result.ResponseTime = $stopwatch.ElapsedMilliseconds
        $result.StatusCode = $response.StatusCode
        $result.Success = $response.StatusCode -lt 400 -or $response.StatusCode -eq 401  # 401 is expected for API endpoints

        if ($result.Success) {
            Write-LogEntry -Message "$Type endpoint responded in $($result.ResponseTime)ms" -Level "SUCCESS" -Environment $Environment -Data @{
                ResponseTime = $result.ResponseTime
                StatusCode = $result.StatusCode
                Url = $Url
            }
        } else {
            Write-LogEntry -Message "$Type endpoint returned HTTP $($result.StatusCode)" -Level "WARN" -Environment $Environment -Data @{
                ResponseTime = $result.ResponseTime
                StatusCode = $result.StatusCode
                Url = $Url
            }
        }

    } catch {
        $result.Error = $_.Exception.Message
        Write-LogEntry -Message "$Type endpoint failed: $($result.Error)" -Level "ERROR" -Environment $Environment -Data @{
            Url = $Url
            Error = $result.Error
        }
    }

    return $result
}

function Test-AllEnvironments {
    $results = @()

    foreach ($envName in $Configurations.Keys) {
        $config = $Configurations[$envName]

        # Skip if configuration file doesn't exist
        if (-not (Test-Path $config.File)) {
            Write-LogEntry -Message "Configuration file not found, skipping" -Level "WARN" -Environment $envName
            continue
        }

        Write-Host "   Testing $envName..." -NoNewline -ForegroundColor Gray

        # Test health endpoint
        $healthResult = Test-EndpointHealth -Environment $envName -Url $config.HealthUrl -Type "Health"
        $results += $healthResult

        # Test API endpoint
        $apiResult = Test-EndpointHealth -Environment $envName -Url "$($config.ApiUrl)/health" -Type "API"
        $results += $apiResult

        # Update current status
        $MonitoringState.CurrentStatus[$envName] = @{
            Health = $healthResult
            API = $apiResult
            LastCheck = Get-Date
            IsHealthy = $healthResult.Success -and $apiResult.Success
        }

        $status = if ($MonitoringState.CurrentStatus[$envName].IsHealthy) { "✅" } else { "❌" }
        Write-Host " $status" -ForegroundColor $(if ($MonitoringState.CurrentStatus[$envName].IsHealthy) { "Green" } else { "Red" })
    }

    return $results
}

function Check-AlertConditions {
    param([array]$Results)

    $newAlerts = @()

    foreach ($result in $Results) {
        $alertData = @{
            Environment = $result.Environment
            Type = $result.Type
            Timestamp = $result.Timestamp
            Severity = "INFO"
            Message = ""
            Data = $result
        }

        # Check for failures
        if (-not $result.Success) {
            $alertData.Severity = "ERROR"
            $alertData.Message = "$($result.Environment) $($result.Type) endpoint is down"
            $newAlerts += $alertData
        }
        # Check for slow response times
        elseif ($result.ResponseTime -and $result.ResponseTime -gt $AlertThreshold) {
            $alertData.Severity = "WARN"
            $alertData.Message = "$($result.Environment) $($result.Type) endpoint is slow ($($result.ResponseTime)ms > $($AlertThreshold)ms)"
            $newAlerts += $alertData
        }
    }

    # Add new alerts to monitoring state
    $MonitoringState.Alerts += $newAlerts

    # Trim old alerts (keep last 100)
    if ($MonitoringState.Alerts.Count -gt 100) {
        $MonitoringState.Alerts = $MonitoringState.Alerts | Select-Object -Last 50
    }

    return $newAlerts
}

function Send-AlertNotifications {
    param([array]$Alerts)

    if ($Alerts.Count -eq 0) { return }

    foreach ($alert in $Alerts) {
        Write-LogEntry -Message $alert.Message -Level $alert.Severity -Environment $alert.Environment

        # Slack notifications
        if ($SlackWebhook) {
            Send-SlackAlert -Alert $alert -WebhookUrl $SlackWebhook
        }

        # Email notifications
        if ($EmailAlerts) {
            Send-EmailAlert -Alert $alert -EmailAddress $EmailAlerts
        }
    }
}

function Send-SlackAlert {
    param(
        [hashtable]$Alert,
        [string]$WebhookUrl
    )

    $color = switch ($Alert.Severity) {
        "ERROR" { "danger" }
        "WARN" { "warning" }
        default { "good" }
    }

    $emoji = switch ($Alert.Severity) {
        "ERROR" { "🚨" }
        "WARN" { "⚠️" }
        default { "ℹ️" }
    }

    $payload = @{
        username = "VitalSense Monitor"
        icon_emoji = ":iphone:"
        attachments = @(
            @{
                color = $color
                title = "$emoji iOS Configuration Alert"
                text = $Alert.Message
                fields = @(
                    @{
                        title = "Environment"
                        value = $Alert.Environment
                        short = $true
                    },
                    @{
                        title = "Timestamp"
                        value = $Alert.Timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                        short = $true
                    }
                )
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $payload -ContentType "application/json"
        Write-LogEntry -Message "Slack alert sent" -Level "INFO" -Environment $Alert.Environment
    } catch {
        Write-LogEntry -Message "Failed to send Slack alert: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Show-MonitoringDashboard {
    Clear-Host
    Write-Host "🔍 VitalSense iOS Configuration Monitor Dashboard" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host "Started: $($MonitoringState.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "Checks: $($MonitoringState.CheckCount)" -ForegroundColor Gray
    Write-Host "Next check in: $($Interval - ((Get-Date) - $MonitoringState.StartTime).TotalSeconds % $Interval | ForEach-Object { [Math]::Max(0, $_) }) seconds" -ForegroundColor Gray

    Write-Host "`n📊 Environment Status:" -ForegroundColor Yellow

    foreach ($envName in $MonitoringState.CurrentStatus.Keys) {
        $status = $MonitoringState.CurrentStatus[$envName]
        $healthIcon = if ($status.IsHealthy) { "✅" } else { "❌" }
        $healthTime = if ($status.Health.ResponseTime) { "$($status.Health.ResponseTime)ms" } else { "Failed" }
        $apiTime = if ($status.API.ResponseTime) { "$($status.API.ResponseTime)ms" } else { "Failed" }

        Write-Host "`n  $healthIcon $envName" -ForegroundColor White
        Write-Host "    Health: $healthTime" -ForegroundColor Gray
        Write-Host "    API: $apiTime" -ForegroundColor Gray
        Write-Host "    Last Check: $($status.LastCheck.ToString('HH:mm:ss'))" -ForegroundColor Gray
    }

    # Show recent alerts
    $recentAlerts = $MonitoringState.Alerts | Sort-Object Timestamp -Descending | Select-Object -First 5
    if ($recentAlerts) {
        Write-Host "`n🚨 Recent Alerts:" -ForegroundColor Red
        foreach ($alert in $recentAlerts) {
            $alertIcon = switch ($alert.Severity) {
                "ERROR" { "🚨" }
                "WARN" { "⚠️" }
                default { "ℹ️" }
            }
            Write-Host "  $alertIcon $($alert.Timestamp.ToString('HH:mm:ss')) - $($alert.Message)" -ForegroundColor Gray
        }
    }

    Write-Host "`nPress Ctrl+C to stop monitoring..." -ForegroundColor Yellow
}

function Start-ContinuousMonitoring {
    Write-MonitorHeader "Starting Continuous Monitoring"
    Write-Host "Monitoring interval: $Interval seconds" -ForegroundColor Gray
    Write-Host "Alert threshold: $AlertThreshold ms" -ForegroundColor Gray
    Write-Host "Log file: $LogFile" -ForegroundColor Gray

    if ($SlackWebhook) {
        Write-Host "Slack alerts: Enabled" -ForegroundColor Green
    }

    if ($EmailAlerts) {
        Write-Host "Email alerts: $EmailAlerts" -ForegroundColor Green
    }

    Write-LogEntry -Message "iOS configuration monitoring started" -Level "INFO"

    try {
        while ($true) {
            $MonitoringState.CheckCount++

            if ($Dashboard) {
                Show-MonitoringDashboard
            } else {
                Write-Host "`n🔍 Health Check #$($MonitoringState.CheckCount) - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
            }

            # Perform health checks
            $results = Test-AllEnvironments

            # Check for alert conditions
            $newAlerts = Check-AlertConditions -Results $results

            # Send notifications
            if ($newAlerts.Count -gt 0) {
                Send-AlertNotifications -Alerts $newAlerts
            }

            if (-not $Dashboard) {
                Write-Host "Next check in $Interval seconds... (Ctrl+C to stop)" -ForegroundColor Gray
            }

            # Wait for next interval
            Start-Sleep -Seconds $Interval
        }
    } catch [System.Management.Automation.BreakException] {
        Write-Host "`n🛑 Monitoring stopped by user" -ForegroundColor Yellow
    } catch {
        Write-LogEntry -Message "Monitoring error: $($_.Exception.Message)" -Level "ERROR"
        throw
    } finally {
        Write-LogEntry -Message "iOS configuration monitoring stopped" -Level "INFO"
    }
}

# Main execution
if ($Continuous) {
    Start-ContinuousMonitoring
} else {
    Write-MonitorHeader "Single Health Check"

    $results = Test-AllEnvironments
    $alerts = Check-AlertConditions -Results $results

    if ($alerts.Count -gt 0) {
        Write-Host "`n🚨 Alerts Generated:" -ForegroundColor Red
        foreach ($alert in $alerts) {
            Write-Host "  • $($alert.Message)" -ForegroundColor Yellow
        }

        Send-AlertNotifications -Alerts $alerts
    } else {
        Write-Host "`n✅ All environments healthy!" -ForegroundColor Green
    }

    Write-Host "`nUse -Continuous for ongoing monitoring" -ForegroundColor Cyan
}
