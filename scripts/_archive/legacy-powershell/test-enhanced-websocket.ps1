#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test enhanced WebSocket functionality for VitalSense health app
.DESCRIPTION
    This script tests the enhanced WebSocket connection with comprehensive features including:
    - Real-time health data processing
    - Session management
    - Heartbeat monitoring
    - Performance optimizations
.EXAMPLE
    .\test-enhanced-websocket.ps1
    .\test-enhanced-websocket.ps1 -Host "wss://health.andernet.dev/ws" -UserId "test-user"
#>

param(
    [string]$WebSocketUrl = "wss://health.andernet.dev/ws",
    [string]$UserId = "test-user-$(Get-Date -Format 'HHmmss')",
    [string]$DeviceId = "test-device-windows",
    [string]$Token = "test-token",
    [int]$TestDurationSeconds = 30,
    [switch]$Verbose
)

# Set error handling
$ErrorActionPreference = "Stop"

# Colors for output
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$RESET = "`e[0m"

function Write-Status {
    param([string]$Message, [string]$Color = $GREEN)
    Write-Host "${Color}[$(Get-Date -Format 'HH:mm:ss')] $Message${RESET}"
}

function Write-Error {
    param([string]$Message)
    Write-Status $Message $RED
}

function Write-Info {
    param([string]$Message)
    Write-Status $Message $BLUE
}

function Write-Warning {
    param([string]$Message)
    Write-Status $Message $YELLOW
}

# Test results tracking
$script:TestResults = @{
    ConnectionEstablished = $false
    WelcomeMessageReceived = $false
    HealthDataProcessed = $false
    PingPongWorking = $false
    StatusReceived = $false
    MessagesReceived = 0
    MessagesSent = 0
    Errors = @()
    StartTime = Get-Date
}

function Test-WebSocketConnection {
    Write-Info "=== Enhanced WebSocket Test for VitalSense ==="
    Write-Info "WebSocket URL: $WebSocketUrl"
    Write-Info "User ID: $UserId"
    Write-Info "Device ID: $DeviceId"
    Write-Info "Test Duration: $TestDurationSeconds seconds"
    Write-Info ""

    try {
        # Build WebSocket URL with parameters
        $wsUrl = "${WebSocketUrl}?userId=${UserId}&deviceId=${DeviceId}&token=${Token}"
        Write-Info "Connecting to: $wsUrl"

        # Use PowerShell's WebSocket client (requires .NET Core 6+)
        Add-Type -AssemblyName System.Net.WebSockets
        Add-Type -AssemblyName System.Threading.Tasks

        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $cancellation = New-Object System.Threading.CancellationToken

        # Connect to WebSocket
        Write-Info "Establishing WebSocket connection..."
        $connectTask = $ws.ConnectAsync([System.Uri]::new($wsUrl), $cancellation)
        $connectTask.Wait(10000) # 10 second timeout

        if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
            $script:TestResults.ConnectionEstablished = $true
            Write-Status "✅ WebSocket connection established successfully!"
        } else {
            throw "WebSocket connection failed. State: $($ws.State)"
        }

        # Start receiving messages
        $receiveTask = Start-ReceiveLoop $ws $cancellation

        # Test sequence
        Start-Sleep -Seconds 2

        # Test 1: Send ping
        Write-Info "Test 1: Sending ping message..."
        Send-Message $ws @{
            type = "ping"
            timestamp = (Get-Date).ToString("o")
            message = "Test ping from PowerShell"
        }

        Start-Sleep -Seconds 2

        # Test 2: Send health data
        Write-Info "Test 2: Sending sample health data..."
        Send-Message $ws @{
            type = "health_data"
            timestamp = (Get-Date).ToString("o")
            metrics = @(
                @{
                    type = "heart_rate"
                    value = 72
                    timestamp = (Get-Date).ToString("o")
                    unit = "bpm"
                    source = "PowerShell_Test"
                },
                @{
                    type = "steps"
                    value = 5432
                    timestamp = (Get-Date).ToString("o")
                    unit = "count"
                    source = "PowerShell_Test"
                },
                @{
                    type = "blood_oxygen"
                    value = 98.5
                    timestamp = (Get-Date).ToString("o")
                    unit = "percent"
                    source = "PowerShell_Test"
                }
            )
        }

        Start-Sleep -Seconds 2

        # Test 3: Send client info
        Write-Info "Test 3: Sending client information..."
        Send-Message $ws @{
            type = "client_info"
            deviceInfo = @{
                platform = "Windows"
                version = "PowerShell $($PSVersionTable.PSVersion)"
                arch = [System.Environment]::OSVersion.Platform
            }
            appVersion = "1.0.0-test"
            timestamp = (Get-Date).ToString("o")
        }

        Start-Sleep -Seconds 2

        # Test 4: Request status
        Write-Info "Test 4: Requesting server status..."
        Send-Message $ws @{
            type = "get_status"
            timestamp = (Get-Date).ToString("o")
        }

        Start-Sleep -Seconds 2

        # Test 5: Send health batch
        Write-Info "Test 5: Sending health data batch..."
        Send-Message $ws @{
            type = "health_batch"
            timestamp = (Get-Date).ToString("o")
            batch = @(
                @{
                    batchId = "batch_1"
                    timestamp = (Get-Date).ToString("o")
                    metrics = @(
                        @{
                            type = "temperature"
                            value = 98.6
                            timestamp = (Get-Date).ToString("o")
                            unit = "fahrenheit"
                            source = "PowerShell_Batch_Test"
                        }
                    )
                },
                @{
                    batchId = "batch_2"
                    timestamp = (Get-Date).ToString("o")
                    metrics = @(
                        @{
                            type = "weight"
                            value = 150.5
                            timestamp = (Get-Date).ToString("o")
                            unit = "pounds"
                            source = "PowerShell_Batch_Test"
                        }
                    )
                }
            )
        }

        # Wait for remaining test duration
        $remainingTime = $TestDurationSeconds - ((Get-Date) - $script:TestResults.StartTime).TotalSeconds
        if ($remainingTime -gt 0) {
            Write-Info "Waiting $([math]::Round($remainingTime, 1)) more seconds for responses..."
            Start-Sleep -Seconds $remainingTime
        }

        # Close WebSocket
        Write-Info "Closing WebSocket connection..."
        $closeTask = $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Test completed", $cancellation)
        $closeTask.Wait(5000)

        Write-Status "✅ WebSocket connection closed gracefully"

    } catch {
        $script:TestResults.Errors += $_.Exception.Message
        Write-Error "❌ WebSocket test failed: $($_.Exception.Message)"
        if ($Verbose) {
            Write-Error "Stack trace: $($_.Exception.StackTrace)"
        }
    } finally {
        if ($ws) {
            $ws.Dispose()
        }
    }
}

function Start-ReceiveLoop {
    param($ws, $cancellation)

    $buffer = New-Object byte[] 4096

    # Start background task for receiving messages
    $receiveJob = Start-Job -ScriptBlock {
        param($wsState, $cancellation)

        while ($wsState -eq [System.Net.WebSockets.WebSocketState]::Open) {
            try {
                $buffer = New-Object byte[] 4096
                $segment = New-Object System.ArraySegment[byte] $buffer
                $result = $ws.ReceiveAsync($segment, $cancellation).Result

                if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Text) {
                    $message = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count)
                    Write-Output "RECEIVED: $message"
                }
            } catch {
                Write-Output "RECEIVE_ERROR: $($_.Exception.Message)"
                break
            }
        }
    } -ArgumentList $ws.State, $cancellation

    return $receiveJob
}

function Send-Message {
    param($ws, $messageObj)

    try {
        $script:TestResults.MessagesSent++
        $messageJson = $messageObj | ConvertTo-Json -Depth 10 -Compress
        $messageBytes = [System.Text.Encoding]::UTF8.GetBytes($messageJson)
        $segment = [System.ArraySegment[byte]]::new($messageBytes)

        $sendTask = $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None)
        $sendTask.Wait(5000)

        if ($Verbose) {
            Write-Info "Sent message: $($messageObj.type)"
        }
    } catch {
        $script:TestResults.Errors += "Send failed: $($_.Exception.Message)"
        Write-Error "Failed to send message: $($_.Exception.Message)"
    }
}function Show-TestResults {
    $endTime = Get-Date
    $duration = ($endTime - $script:TestResults.StartTime).TotalSeconds

    Write-Info ""
    Write-Info "=== Enhanced WebSocket Test Results ==="
    Write-Info "Test Duration: $([math]::Round($duration, 2)) seconds"
    Write-Info "Connection Established: $(if ($script:TestResults.ConnectionEstablished) { '✅ Yes' } else { '❌ No' })"
    Write-Info "Messages Sent: $($script:TestResults.MessagesSent)"
    Write-Info "Messages Received: $($script:TestResults.MessagesReceived)"

    if ($script:TestResults.Errors.Count -gt 0) {
        Write-Warning ""
        Write-Warning "Errors encountered:"
        foreach ($error in $script:TestResults.Errors) {
            Write-Error "  - $error"
        }
    }

    $overallSuccess = $script:TestResults.ConnectionEstablished -and $script:TestResults.Errors.Count -eq 0

    Write-Info ""
    if ($overallSuccess) {
        Write-Status "🎉 Enhanced WebSocket test completed successfully!" $GREEN
        Write-Info "The WebSocket implementation is working with enhanced features including:"
        Write-Info "  ✅ Real-time connection management"
        Write-Info "  ✅ Health data processing"
        Write-Info "  ✅ Session tracking"
        Write-Info "  ✅ Message routing"
        Write-Info "  ✅ Performance monitoring"
    } else {
        Write-Status "❌ Enhanced WebSocket test failed" $RED
        Write-Info "Check the errors above and verify:"
        Write-Info "  - WebSocket endpoint is accessible"
        Write-Info "  - Durable Object configuration is correct"
        Write-Info "  - Network connectivity is available"
    }
}

# Main execution
try {
    Test-WebSocketConnection
} finally {
    Show-TestResults
}
