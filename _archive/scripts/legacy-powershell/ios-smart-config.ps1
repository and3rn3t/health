#!/usr/bin/env pwsh

<#
.SYNOPSIS
    iOS Smart Configuration Manager with Auto-Optimization

.DESCRIPTION
    Intelligent configuration management that automatically selects optimal
    environments based on context, performance metrics, and usage patterns.

.PARAMETER AutoOptimize
    Automatically select the best environment based on current conditions

.PARAMETER AnalyzePerformance
    Analyze current environment performance and suggest optimizations

.PARAMETER CompareAll
    Compare all environments and rank by performance

.PARAMETER RecommendBest
    Get recommendation for best environment based on current context

.PARAMETER Context
    Specify context: Development, Testing, Demo, Production

.EXAMPLE
    ./ios-smart-config.ps1 -AutoOptimize -Context Development

.EXAMPLE
    ./ios-smart-config.ps1 -AnalyzePerformance -RecommendBest
#>

param(
    [switch]$AutoOptimize,
    [switch]$AnalyzePerformance,
    [switch]$CompareAll,
    [switch]$RecommendBest,
    [ValidateSet("Development", "Testing", "Demo", "Production")]
    [string]$Context = "Development",
    [switch]$SaveAnalysis
)

# Import the base configuration manager functions
$configManagerPath = Join-Path $PSScriptRoot "ios-config-manager.ps1"
if (Test-Path $configManagerPath) {
    . $configManagerPath
}

$SmartConfig = @{
    Performance = @{}
    Usage = @{}
    Recommendations = @{}
    History = @{}
}

function Write-SmartHeader {
    param([string]$Title)
    Write-Host "`n🧠 VitalSense Smart iOS Configuration" -ForegroundColor Cyan
    Write-Host "=" * 50
    Write-Host $Title -ForegroundColor Yellow
}

function Get-PerformanceMetrics {
    param([string]$Environment)

    Write-Host "   Analyzing $Environment performance..." -NoNewline

    $config = $Configurations[$Environment]
    $metrics = @{
        Environment = $Environment
        ResponseTime = $null
        Availability = 0
        ThroughputScore = 0
        ReliabilityScore = 0
        OverallScore = 0
        LastChecked = Get-Date
    }

    try {
        # Test primary health endpoint
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $config.HealthUrl -TimeoutSec 5 -SkipHttpErrorCheck
        $stopwatch.Stop()

        if ($response.StatusCode -eq 200) {
            $metrics.ResponseTime = $stopwatch.ElapsedMilliseconds
            $metrics.Availability = 100

            # Calculate performance scores
            $metrics.ThroughputScore = [Math]::Max(0, 100 - ($metrics.ResponseTime / 20))  # 2000ms = 0 score
            $metrics.ReliabilityScore = 100  # Successful response

            Write-Host " ✅ $($metrics.ResponseTime)ms" -ForegroundColor Green
        } else {
            $metrics.Availability = 50  # Partial availability
            $metrics.ReliabilityScore = 50
            Write-Host " ⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }

    } catch {
        $metrics.Availability = 0
        $metrics.ReliabilityScore = 0
        Write-Host " ❌ Failed" -ForegroundColor Red
    }

    # Calculate overall score (weighted average)
    $metrics.OverallScore = [Math]::Round(
        ($metrics.ThroughputScore * 0.4) +
        ($metrics.ReliabilityScore * 0.4) +
        ($metrics.Availability * 0.2), 1
    )

    return $metrics
}

function Get-ContextualRecommendation {
    param(
        [string]$Context,
        [array]$PerformanceData
    )

    $recommendation = @{
        RecommendedEnvironment = $null
        Reason = ""
        Confidence = 0
        Alternatives = @()
    }

    # Sort environments by performance score
    $sortedEnvs = $PerformanceData | Sort-Object OverallScore -Descending

    switch ($Context) {
        "Development" {
            # Prefer local development, fallback to fastest available
            $localEnv = $sortedEnvs | Where-Object { $_.Environment -eq "Development" } | Select-Object -First 1
            if ($localEnv -and $localEnv.OverallScore -gt 50) {
                $recommendation.RecommendedEnvironment = "Development"
                $recommendation.Reason = "Local development environment preferred for development context"
                $recommendation.Confidence = 90
            } else {
                $recommendation.RecommendedEnvironment = $sortedEnvs[0].Environment
                $recommendation.Reason = "Local development unavailable, using fastest alternative: $($sortedEnvs[0].Environment)"
                $recommendation.Confidence = 70
            }
        }

        "Testing" {
            # Prefer staging or testing environment
            $testEnv = $sortedEnvs | Where-Object { $_.Environment -in @("Staging", "Testing") } | Select-Object -First 1
            if ($testEnv) {
                $recommendation.RecommendedEnvironment = $testEnv.Environment
                $recommendation.Reason = "Dedicated testing environment provides isolation"
                $recommendation.Confidence = 85
            } else {
                $recommendation.RecommendedEnvironment = $sortedEnvs[0].Environment
                $recommendation.Reason = "No dedicated test environment, using best available: $($sortedEnvs[0].Environment)"
                $recommendation.Confidence = 60
            }
        }

        "Demo" {
            # Prefer production-like environment with good performance
            $prodLikeEnvs = $sortedEnvs | Where-Object { $_.Environment -in @("Production", "Staging") -and $_.OverallScore -gt 80 }
            if ($prodLikeEnvs) {
                $recommendation.RecommendedEnvironment = $prodLikeEnvs[0].Environment
                $recommendation.Reason = "Production-quality environment ensures reliable demo experience"
                $recommendation.Confidence = 95
            } else {
                $recommendation.RecommendedEnvironment = $sortedEnvs[0].Environment
                $recommendation.Reason = "Using highest performing available environment for demo"
                $recommendation.Confidence = 75
            }
        }

        "Production" {
            # Must use production environment
            $prodEnv = $sortedEnvs | Where-Object { $_.Environment -eq "Production" } | Select-Object -First 1
            if ($prodEnv -and $prodEnv.OverallScore -gt 70) {
                $recommendation.RecommendedEnvironment = "Production"
                $recommendation.Reason = "Production environment required and performing well"
                $recommendation.Confidence = 100
            } else {
                $recommendation.RecommendedEnvironment = "Production"
                $recommendation.Reason = "Production environment required but may have performance issues"
                $recommendation.Confidence = 50
            }
        }
    }

    # Add alternatives (top 2 other environments)
    $recommendation.Alternatives = $sortedEnvs |
        Where-Object { $_.Environment -ne $recommendation.RecommendedEnvironment } |
        Select-Object -First 2 -ExpandProperty Environment

    return $recommendation
}

function Show-PerformanceAnalysis {
    param([array]$PerformanceData)

    Write-Host "`n📊 Performance Analysis Results" -ForegroundColor Cyan
    Write-Host "-" * 40

    $sortedData = $PerformanceData | Sort-Object OverallScore -Descending

    foreach ($env in $sortedData) {
        $scoreColor = switch ($env.OverallScore) {
            { $_ -gt 80 } { "Green" }
            { $_ -gt 60 } { "Yellow" }
            default { "Red" }
        }

        $status = if ($env.ResponseTime) { "$($env.ResponseTime)ms" } else { "Failed" }

        Write-Host "`n🎯 $($env.Environment) Environment" -ForegroundColor White
        Write-Host "   Overall Score: $($env.OverallScore)/100" -ForegroundColor $scoreColor
        Write-Host "   Response Time: $status" -ForegroundColor Gray
        Write-Host "   Availability: $($env.Availability)%" -ForegroundColor Gray
        Write-Host "   Reliability: $($env.ReliabilityScore)/100" -ForegroundColor Gray

        # Performance recommendations
        if ($env.OverallScore -lt 70) {
            if ($env.ResponseTime -gt 1000) {
                Write-Host "   ⚠️  High latency detected - consider optimization" -ForegroundColor Yellow
            }
            if ($env.Availability -lt 100) {
                Write-Host "   ⚠️  Availability issues detected" -ForegroundColor Yellow
            }
        }
    }

    # Overall recommendations
    Write-Host "`n💡 Performance Insights:" -ForegroundColor Cyan

    $fastestEnv = $sortedData | Where-Object { $_.ResponseTime -ne $null } | Sort-Object ResponseTime | Select-Object -First 1
    if ($fastestEnv) {
        Write-Host "   • Fastest environment: $($fastestEnv.Environment) ($($fastestEnv.ResponseTime)ms)" -ForegroundColor Green
    }

    $slowEnvs = $sortedData | Where-Object { $_.ResponseTime -gt 1000 }
    if ($slowEnvs) {
        Write-Host "   • Slow environments needing optimization: $($slowEnvs.Environment -join ', ')" -ForegroundColor Yellow
    }

    $failedEnvs = $sortedData | Where-Object { $_.Availability -eq 0 }
    if ($failedEnvs) {
        Write-Host "   • Unavailable environments: $($failedEnvs.Environment -join ', ')" -ForegroundColor Red
    }
}

function Invoke-AutoOptimization {
    param(
        [string]$Context,
        [array]$PerformanceData
    )

    Write-Host "`n🎯 Auto-Optimization Process" -ForegroundColor Cyan
    Write-Host "-" * 40

    # Get current environment
    $currentEnv = Get-CurrentEnvironment
    Write-Host "Current Environment: $currentEnv" -ForegroundColor Gray

    # Get recommendation
    $recommendation = Get-ContextualRecommendation -Context $Context -PerformanceData $PerformanceData

    Write-Host "`n🤖 Smart Recommendation:" -ForegroundColor Yellow
    Write-Host "   Recommended: $($recommendation.RecommendedEnvironment)" -ForegroundColor Green
    Write-Host "   Reason: $($recommendation.Reason)" -ForegroundColor Gray
    Write-Host "   Confidence: $($recommendation.Confidence)%" -ForegroundColor Gray

    if ($recommendation.Alternatives) {
        Write-Host "   Alternatives: $($recommendation.Alternatives -join ', ')" -ForegroundColor Gray
    }

    # Auto-switch if different from current and high confidence
    if ($recommendation.RecommendedEnvironment -ne $currentEnv -and $recommendation.Confidence -gt 80) {
        Write-Host "`n🔄 Auto-switching to optimal environment..." -ForegroundColor Yellow

        $switchResult = Switch-Environment -TargetEnvironment $recommendation.RecommendedEnvironment
        if ($switchResult) {
            Write-Host "✅ Successfully auto-optimized to $($recommendation.RecommendedEnvironment)" -ForegroundColor Green

            # Validate the switch
            $validation = Test-Configuration -Environment $recommendation.RecommendedEnvironment
            if ($validation) {
                Write-Host "✅ Configuration validated and ready" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Auto-optimization failed, staying with $currentEnv" -ForegroundColor Red
        }
    } elseif ($recommendation.RecommendedEnvironment -eq $currentEnv) {
        Write-Host "✅ Current environment is already optimal!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Confidence too low for auto-switch. Manual review recommended." -ForegroundColor Yellow
    }
}

function Save-AnalysisResults {
    param([hashtable]$Results, [string]$FilePath = "ios-smart-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').json")

    try {
        $Results | ConvertTo-Json -Depth 10 | Set-Content -Path $FilePath -Encoding UTF8
        Write-Host "`n💾 Analysis saved to: $FilePath" -ForegroundColor Green
    } catch {
        Write-Host "`n❌ Failed to save analysis: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
Write-SmartHeader "Smart Configuration Analysis"

$performanceResults = @()
$analysisResults = @{
    Timestamp = Get-Date
    Context = $Context
    Performance = @()
    Recommendation = $null
    AutoOptimized = $false
}

# Analyze all available environments
Write-Host "`n🔍 Analyzing Environment Performance..." -ForegroundColor Yellow

foreach ($envName in $Configurations.Keys) {
    $config = $Configurations[$envName]
    if (Test-Path $config.File) {
        $metrics = Get-PerformanceMetrics -Environment $envName
        $performanceResults += $metrics
        $analysisResults.Performance += $metrics
    }
}

if ($CompareAll -or $AnalyzePerformance) {
    Show-PerformanceAnalysis -PerformanceData $performanceResults
}

if ($RecommendBest -or $AutoOptimize) {
    $recommendation = Get-ContextualRecommendation -Context $Context -PerformanceData $performanceResults
    $analysisResults.Recommendation = $recommendation

    if (-not $CompareAll) {
        Write-Host "`n🎯 Smart Recommendation for '$Context' Context:" -ForegroundColor Cyan
        Write-Host "   Environment: $($recommendation.RecommendedEnvironment)" -ForegroundColor Green
        Write-Host "   Reason: $($recommendation.Reason)" -ForegroundColor Gray
        Write-Host "   Confidence: $($recommendation.Confidence)%" -ForegroundColor Gray
    }
}

if ($AutoOptimize) {
    Invoke-AutoOptimization -Context $Context -PerformanceData $performanceResults
    $analysisResults.AutoOptimized = $true
}

if ($SaveAnalysis) {
    Save-AnalysisResults -Results $analysisResults
}

Write-Host "`n🎉 Smart configuration analysis complete!" -ForegroundColor Green
Write-Host "`nUse insights to optimize your iOS development workflow and ensure optimal performance." -ForegroundColor Cyan
