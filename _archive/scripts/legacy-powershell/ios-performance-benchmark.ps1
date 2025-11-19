#!/usr/bin/env pwsh

<#
.SYNOPSIS
    iOS Performance Benchmark and Environment Comparison Tool

.DESCRIPTION
    Benchmarks iOS app performance across different environments, measures
    endpoint response times, and provides optimization recommendations.

.PARAMETER CompareEnvironments
    Compare performance across all available environments

.PARAMETER Environment
    Benchmark specific environment only

.PARAMETER Detailed
    Run detailed performance analysis including network latency breakdown

.PARAMETER SaveResults
    Save benchmark results to JSON file for historical tracking

.EXAMPLE
    ./ios-performance-benchmark.ps1 -CompareEnvironments -SaveResults

.EXAMPLE
    ./ios-performance-benchmark.ps1 -Environment Production -Detailed
#>

param(
    [switch]$CompareEnvironments,
    [ValidateSet("Production", "Development", "Staging", "Testing")]
    [string]$Environment,
    [switch]$Detailed,
    [switch]$SaveResults,
    [int]$Iterations = 5
)

$Environments = @{
    "Production" = @{
        ApiUrl = "https://health.andernet.dev/api"
        HealthUrl = "https://health.andernet.dev/health"
        WsUrl = "wss://health.andernet.dev/ws"
    }
    "Development" = @{
        ApiUrl = "http://127.0.0.1:8789/api"
        HealthUrl = "http://127.0.0.1:8789/health"
        WsUrl = "ws://localhost:3001/ws"
    }
    "Staging" = @{
        ApiUrl = "https://staging.health.andernet.dev/api"
        HealthUrl = "https://staging.health.andernet.dev/health"
        WsUrl = "wss://staging.health.andernet.dev/ws"
    }
    "Testing" = @{
        ApiUrl = "https://test.health.andernet.dev/api"
        HealthUrl = "https://test.health.andernet.dev/health"
        WsUrl = "wss://test.health.andernet.dev/ws"
    }
}

function Write-Header {
    param([string]$Title)
    Write-Host "`n📊 VitalSense iOS Performance Benchmark" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host $Title -ForegroundColor Yellow
}

function Measure-EndpointPerformance {
    param(
        [string]$Url,
        [int]$Iterations = 5,
        [switch]$Detailed
    )

    $results = @()
    $successCount = 0
    $totalTime = 0

    Write-Host "   Testing $Url..." -NoNewline

    for ($i = 0; $i -lt $Iterations; $i++) {
        try {
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -SkipHttpErrorCheck
            $stopwatch.Stop()

            $result = @{
                Iteration = $i + 1
                ResponseTime = $stopwatch.ElapsedMilliseconds
                StatusCode = $response.StatusCode
                Success = $response.StatusCode -lt 400
                ContentLength = $response.Content.Length
                Headers = $response.Headers
            }

            if ($result.Success -or $response.StatusCode -eq 401) {  # 401 is expected for API endpoints
                $successCount++
                $totalTime += $result.ResponseTime
            }

            $results += $result

        } catch {
            $results += @{
                Iteration = $i + 1
                ResponseTime = $null
                StatusCode = $null
                Success = $false
                Error = $_.Exception.Message
            }
        }

        # Brief pause between requests
        Start-Sleep -Milliseconds 100
    }

    # Calculate statistics
    $successfulResults = $results | Where-Object { $_.Success -eq $true -or $_.StatusCode -eq 401 }
    $responseTimes = $successfulResults | Where-Object { $_.ResponseTime -ne $null } | ForEach-Object { $_.ResponseTime }

    if ($responseTimes.Count -gt 0) {
        $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
        $minResponseTime = ($responseTimes | Measure-Object -Minimum).Minimum
        $maxResponseTime = ($responseTimes | Measure-Object -Maximum).Maximum
        $successRate = ($successCount / $Iterations) * 100

        Write-Host " ✅ Avg: $([math]::Round($avgResponseTime, 0))ms" -ForegroundColor Green

        return @{
            Url = $Url
            Iterations = $Iterations
            SuccessRate = $successRate
            AverageResponseTime = $avgResponseTime
            MinResponseTime = $minResponseTime
            MaxResponseTime = $maxResponseTime
            Results = $results
        }
    } else {
        Write-Host " ❌ Failed" -ForegroundColor Red
        return @{
            Url = $Url
            Iterations = $Iterations
            SuccessRate = 0
            AverageResponseTime = $null
            Results = $results
        }
    }
}

function Test-WebSocketConnection {
    param([string]$WsUrl)

    Write-Host "   Testing WebSocket $WsUrl..." -NoNewline

    # For now, just test if the host is reachable
    $uri = [System.Uri]$WsUrl
    $host = $uri.Host
    $port = if ($uri.Port -eq -1) { if ($uri.Scheme -eq "wss") { 443 } else { 80 } } else { $uri.Port }

    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect($host, $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)

        if ($wait) {
            $tcpClient.EndConnect($connect)
            $tcpClient.Close()
            Write-Host " ✅ Reachable" -ForegroundColor Green
            return @{ Success = $true; Reachable = $true }
        } else {
            Write-Host " ❌ Timeout" -ForegroundColor Red
            return @{ Success = $false; Reachable = $false; Error = "Connection timeout" }
        }
    } catch {
        Write-Host " ❌ Failed" -ForegroundColor Red
        return @{ Success = $false; Reachable = $false; Error = $_.Exception.Message }
    }
}

function Get-NetworkDiagnostics {
    param([string]$Hostname)

    if ($Hostname -eq "127.0.0.1" -or $Hostname -eq "localhost") {
        return @{
            DNS = "N/A (localhost)"
            Ping = "N/A (localhost)"
            Traceroute = "N/A (localhost)"
        }
    }

    Write-Host "   Network diagnostics for $Hostname..." -ForegroundColor Gray

    # DNS resolution
    try {
        $dnsStart = Get-Date
        $dnsResult = Resolve-DnsName $Hostname -ErrorAction Stop
        $dnsTime = ((Get-Date) - $dnsStart).TotalMilliseconds
        $dnsStatus = "✅ $([math]::Round($dnsTime, 0))ms"
    } catch {
        $dnsStatus = "❌ Failed"
    }

    # Ping test
    try {
        $pingResult = Test-Connection $Hostname -Count 3 -ErrorAction Stop
        $avgPing = ($pingResult | Measure-Object -Property ResponseTime -Average).Average
        $pingStatus = "✅ $([math]::Round($avgPing, 0))ms avg"
    } catch {
        $pingStatus = "❌ Failed"
    }

    return @{
        DNS = $dnsStatus
        Ping = $pingStatus
    }
}

function Benchmark-Environment {
    param(
        [string]$EnvName,
        [hashtable]$Config,
        [switch]$Detailed
    )

    Write-Host "`n🏃 Benchmarking $EnvName Environment" -ForegroundColor Cyan
    Write-Host "-" * 40

    $results = @{
        Environment = $EnvName
        Timestamp = Get-Date
        HealthEndpoint = $null
        ApiEndpoint = $null
        WebSocket = $null
        NetworkDiagnostics = $null
    }

    # Test health endpoint
    $results.HealthEndpoint = Measure-EndpointPerformance -Url $Config.HealthUrl -Iterations $Iterations -Detailed:$Detailed

    # Test API endpoint
    $results.ApiEndpoint = Measure-EndpointPerformance -Url "$($Config.ApiUrl)/health" -Iterations $Iterations -Detailed:$Detailed

    # Test WebSocket connectivity
    $results.WebSocket = Test-WebSocketConnection -WsUrl $Config.WsUrl

    # Network diagnostics if detailed
    if ($Detailed) {
        $uri = [System.Uri]$Config.HealthUrl
        $results.NetworkDiagnostics = Get-NetworkDiagnostics -Hostname $uri.Host

        Write-Host "   DNS Resolution: $($results.NetworkDiagnostics.DNS)" -ForegroundColor Gray
        Write-Host "   Ping: $($results.NetworkDiagnostics.Ping)" -ForegroundColor Gray
    }

    # Performance summary
    $healthAvg = if ($results.HealthEndpoint.AverageResponseTime) { [math]::Round($results.HealthEndpoint.AverageResponseTime, 0) } else { "N/A" }
    $apiAvg = if ($results.ApiEndpoint.AverageResponseTime) { [math]::Round($results.ApiEndpoint.AverageResponseTime, 0) } else { "N/A" }

    Write-Host "`n📋 Summary for $EnvName:" -ForegroundColor Yellow
    Write-Host "   Health Endpoint: ${healthAvg}ms avg" -ForegroundColor Gray
    Write-Host "   API Endpoint: ${apiAvg}ms avg" -ForegroundColor Gray
    Write-Host "   WebSocket: $(if ($results.WebSocket.Success) { 'Connected' } else { 'Failed' })" -ForegroundColor Gray
    Write-Host "   Success Rate: $([math]::Round($results.HealthEndpoint.SuccessRate, 1))%" -ForegroundColor Gray

    return $results
}

function Show-ComparisonResults {
    param([array]$Results)

    Write-Host "`n📊 Environment Comparison" -ForegroundColor Cyan
    Write-Host "=" * 50

    # Sort by performance (health endpoint response time)
    $sortedResults = $Results | Sort-Object { $_.HealthEndpoint.AverageResponseTime }

    Write-Host "`n🏆 Performance Ranking (by response time):" -ForegroundColor Yellow
    for ($i = 0; $i -lt $sortedResults.Count; $i++) {
        $result = $sortedResults[$i]
        $rank = $i + 1
        $healthTime = if ($result.HealthEndpoint.AverageResponseTime) {
            "$([math]::Round($result.HealthEndpoint.AverageResponseTime, 0))ms"
        } else {
            "Failed"
        }

        $medal = switch ($rank) {
            1 { "🥇" }
            2 { "🥈" }
            3 { "🥉" }
            default { "  " }
        }

        Write-Host "   $medal $rank. $($result.Environment) - $healthTime" -ForegroundColor Gray
    }

    # Performance recommendations
    Write-Host "`n💡 Performance Recommendations:" -ForegroundColor Cyan

    $fastestEnv = $sortedResults[0]
    $slowestEnv = $sortedResults[-1]

    if ($fastestEnv.HealthEndpoint.AverageResponseTime -and $slowestEnv.HealthEndpoint.AverageResponseTime) {
        $difference = $slowestEnv.HealthEndpoint.AverageResponseTime - $fastestEnv.HealthEndpoint.AverageResponseTime
        Write-Host "   • $($fastestEnv.Environment) is $([math]::Round($difference, 0))ms faster than $($slowestEnv.Environment)" -ForegroundColor Green
    }

    # Check for failed environments
    $failedEnvs = $Results | Where-Object { $_.HealthEndpoint.SuccessRate -lt 100 }
    if ($failedEnvs) {
        Write-Host "   • Investigate connectivity issues in: $($failedEnvs.Environment -join ', ')" -ForegroundColor Red
    }

    # Response time thresholds
    $slowEnvs = $Results | Where-Object { $_.HealthEndpoint.AverageResponseTime -gt 1000 }
    if ($slowEnvs) {
        Write-Host "   • Consider optimization for slow environments: $($slowEnvs.Environment -join ', ')" -ForegroundColor Yellow
    }
}

function Save-BenchmarkResults {
    param([array]$Results, [string]$FilePath = "ios-performance-benchmark-$(Get-Date -Format 'yyyyMMdd-HHmmss').json")

    $output = @{
        Timestamp = Get-Date
        TestConfiguration = @{
            Iterations = $Iterations
            Detailed = $Detailed.IsPresent
        }
        Results = $Results
    }

    try {
        $output | ConvertTo-Json -Depth 10 | Set-Content -Path $FilePath -Encoding UTF8
        Write-Host "`n💾 Results saved to: $FilePath" -ForegroundColor Green
    } catch {
        Write-Host "`n❌ Failed to save results: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
if (-not $CompareEnvironments -and -not $Environment) {
    Write-Host "❌ Specify either -CompareEnvironments or -Environment parameter" -ForegroundColor Red
    exit 1
}

Write-Header "iOS Performance Benchmarking"

$allResults = @()

if ($CompareEnvironments) {
    Write-Host "Running performance comparison across all environments..." -ForegroundColor Green
    Write-Host "Iterations per endpoint: $Iterations" -ForegroundColor Gray

    foreach ($envName in $Environments.Keys) {
        $config = $Environments[$envName]
        $result = Benchmark-Environment -EnvName $envName -Config $config -Detailed:$Detailed
        $allResults += $result
    }

    Show-ComparisonResults -Results $allResults

} else {
    Write-Host "Benchmarking $Environment environment..." -ForegroundColor Green
    Write-Host "Iterations per endpoint: $Iterations" -ForegroundColor Gray

    $config = $Environments[$Environment]
    $result = Benchmark-Environment -EnvName $Environment -Config $config -Detailed:$Detailed
    $allResults += $result
}

if ($SaveResults) {
    Save-BenchmarkResults -Results $allResults
}

Write-Host "`n🎉 Benchmarking complete!" -ForegroundColor Green
Write-Host "`nUse results to optimize iOS app configuration and identify performance bottlenecks." -ForegroundColor Cyan
