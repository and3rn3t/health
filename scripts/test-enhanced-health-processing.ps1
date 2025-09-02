#!/usr/bin/env pwsh
<#
.SYNOPSIS
Test enhanced health data processing endpoints

.DESCRIPTION
Tests the new health data processing endpoints with realistic health metrics

.PARAMETER Port
The port to test against (default: 8789)

.PARAMETER BaseUrl
The base URL for testing (default: http://127.0.0.1)
#>

param(
  [int]$Port = 8789,
  [string]$BaseUrl = 'http://127.0.0.1'
)

$ErrorActionPreference = 'Stop'

function Write-TestHeader($title) {
  Write-Host "`n🧪 Testing: $title" -ForegroundColor Cyan
  Write-Host '═' * 50 -ForegroundColor DarkCyan
}

function Write-TestResult($success, $message) {
  if ($success) {
    Write-Host "✅ $message" -ForegroundColor Green
  } else {
    Write-Host "❌ $message" -ForegroundColor Red
  }
}

function Test-HealthEndpoint {
  try {
    $response = Invoke-RestMethod -Uri "$BaseUrl`:$Port/health" -Method GET -TimeoutSec 10
    Write-TestResult $true 'Health check passed'
    return $true
  } catch {
    Write-TestResult $false "Health check failed: $($_.Exception.Message)"
    return $false
  }
}

function Test-ProcessSingleMetric {
  Write-TestHeader 'Process Single Health Metric'

  $testMetric = @{
    type       = 'heart_rate'
    value      = 72
    unit       = 'bpm'
    timestamp  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    deviceId   = 'test-device-001'
    userId     = 'test-user-123'
    source     = 'Apple Watch'
    confidence = 0.95
  }

  try {
    $response = Invoke-RestMethod -Uri "$BaseUrl`:$Port/api/health-data/process" `
      -Method POST `
      -ContentType 'application/json' `
      -Body ($testMetric | ConvertTo-Json -Depth 10) `
      -TimeoutSec 10

    Write-TestResult $true 'Single metric processed successfully'
    Write-Host "   📊 Health Score: $($response.analytics.healthScore)" -ForegroundColor Yellow
    Write-Host "   🚨 Fall Risk: $($response.analytics.fallRisk)" -ForegroundColor Yellow
    Write-Host "   🔍 Anomaly Score: $($response.analytics.anomalyScore)" -ForegroundColor Yellow

    if ($response.analytics.alert) {
      Write-Host "   ⚠️  Alert: $($response.analytics.alert.level) - $($response.analytics.alert.message)" -ForegroundColor Orange
    }

    return $true
  } catch {
    Write-TestResult $false "Single metric processing failed: $($_.Exception.Message)"
    return $false
  }
}

function Test-ProcessBatchMetrics {
  Write-TestHeader 'Process Batch Health Metrics'

  $testBatch = @{
    metrics    = @(
      @{
        type       = 'heart_rate'
        value      = 75
        unit       = 'bpm'
        timestamp  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        deviceId   = 'test-device-001'
        userId     = 'test-user-123'
        source     = 'Apple Watch'
        confidence = 0.95
      },
      @{
        type       = 'walking_steadiness'
        value      = 85
        unit       = 'percent'
        timestamp  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        deviceId   = 'test-device-001'
        userId     = 'test-user-123'
        source     = 'Apple Watch'
        confidence = 0.88
      },
      @{
        type       = 'steps'
        value      = 8500
        unit       = 'count'
        timestamp  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        deviceId   = 'test-device-001'
        userId     = 'test-user-123'
        source     = 'iPhone'
        confidence = 0.92
      }
    )
    uploadedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    deviceInfo = @{
      deviceId   = 'test-device-001'
      deviceType = 'iPhone'
      osVersion  = '17.5'
      appVersion = '1.0.0'
    }
  }

  try {
    $response = Invoke-RestMethod -Uri "$BaseUrl`:$Port/api/health-data/batch" `
      -Method POST `
      -ContentType 'application/json' `
      -Body ($testBatch | ConvertTo-Json -Depth 10) `
      -TimeoutSec 10

    Write-TestResult $true 'Batch metrics processed successfully'
    Write-Host "   📈 Processed: $($response.processed)/$($response.total) metrics" -ForegroundColor Yellow

    if ($response.errors) {
      Write-Host "   ⚠️  Errors: $($response.errors.Count)" -ForegroundColor Orange
      $response.errors | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
    }

    return $true
  } catch {
    Write-TestResult $false "Batch processing failed: $($_.Exception.Message)"
    return $false
  }
}

function Test-GetAnalytics {
  Write-TestHeader 'Get Health Analytics'

  try {
    $response = Invoke-RestMethod -Uri "$BaseUrl`:$Port/api/health-data/analytics/test-user-123" `
      -Method GET `
      -TimeoutSec 10

    Write-TestResult $true 'Analytics retrieved successfully'

    if ($response.analytics) {
      Write-Host "   📊 Total Data Points: $($response.analytics.totalDataPoints)" -ForegroundColor Yellow
      Write-Host "   📅 Last 24h: $($response.analytics.last24Hours)" -ForegroundColor Yellow
      Write-Host "   📈 Average Health Score: $($response.analytics.averageHealthScore)" -ForegroundColor Yellow
      Write-Host "   🚨 Critical Alerts: $($response.analytics.alerts.critical)" -ForegroundColor Yellow
      Write-Host "   ⚠️  Warning Alerts: $($response.analytics.alerts.warning)" -ForegroundColor Yellow
      Write-Host "   🔍 Data Quality Score: $($response.analytics.dataQualityScore)" -ForegroundColor Yellow
      Write-Host "   📋 Metric Types: $($response.analytics.metricTypes -join ', ')" -ForegroundColor Yellow
    } else {
      Write-Host '   ℹ️  No analytics data available yet' -ForegroundColor Blue
    }

    return $true
  } catch {
    Write-TestResult $false "Analytics retrieval failed: $($_.Exception.Message)"
    return $false
  }
}

function Test-GetHealthData {
  Write-TestHeader 'Get Health Data (existing endpoint)'

  try {
    $response = Invoke-RestMethod -Uri "$BaseUrl`:$Port/api/health-data" `
      -Method GET `
      -TimeoutSec 10

    Write-TestResult $true 'Health data retrieved successfully'
    Write-Host "   📊 Data points returned: $($response.data.Count)" -ForegroundColor Yellow

    if ($response.nextCursor) {
      Write-Host "   📄 Has more data (cursor: $($response.nextCursor.Substring(0, 20))...)" -ForegroundColor Yellow
    }

    return $true
  } catch {
    Write-TestResult $false "Health data retrieval failed: $($_.Exception.Message)"
    return $false
  }
}

# Main test execution
Write-Host '🧪 Enhanced Health Data Processing Test Suite' -ForegroundColor Magenta
Write-Host "Testing against: $BaseUrl`:$Port" -ForegroundColor Cyan

$testResults = @()

# Test 1: Health check
$testResults += Test-HealthEndpoint

# Test 2: Process single metric
$testResults += Test-ProcessSingleMetric

# Test 3: Process batch metrics
$testResults += Test-ProcessBatchMetrics

# Test 4: Get analytics
$testResults += Test-GetAnalytics

# Test 5: Get health data (existing)
$testResults += Test-GetHealthData

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Magenta
Write-Host '═' * 30 -ForegroundColor DarkMagenta

$passed = ($testResults | Where-Object { $_ -eq $true }).Count
$total = $testResults.Count

Write-Host "✅ Passed: $passed/$total tests" -ForegroundColor Green

if ($passed -eq $total) {
  Write-Host '🎉 All tests passed! Enhanced health data processing is working correctly.' -ForegroundColor Green
  exit 0
} else {
  Write-Host '⚠️  Some tests failed. Check the output above for details.' -ForegroundColor Yellow
  exit 1
}
