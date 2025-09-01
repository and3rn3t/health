param(
  [string]$HostUrl = 'http://127.0.0.1',
  [int]$Port = 8787,
  [string]$UserId = 'demo-user',
  [string]$ClientType = 'ios_app',
  [int]$TtlSec = 600,
  [switch]$Verbose,
  [switch]$JSON
)

# Import VS Code integration utilities
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $scriptRoot 'VSCodeIntegration.psm1') -Force

$ErrorActionPreference = 'Stop'

# Legacy function wrappers for backward compatibility
function Write-Info($msg) { Write-Info $msg }
function Write-Ok($msg) { Write-Success $msg }
function Write-Warn($msg) { Write-Warning $msg }
function Write-Err($msg) { Write-TaskError 'Probe' $msg }

$base = "${HostUrl}:$Port"

Write-TaskStart 'Health Probe' "Testing endpoints at $base"

# Environment info for Copilot context
if ($Verbose) {
  $envInfo = Get-EnvironmentInfo
  Write-Info "Environment: PowerShell $($envInfo.PowerShellVersion) on $($envInfo.Platform)"
  Write-Info "Working Directory: $($envInfo.WorkingDirectory)"
}

$results = @{
  timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  baseUrl   = $base
  tests     = @()
}

# Probe /health
try {
  Write-TaskStart 'Health Check' "GET $base/health"
  $health = Invoke-SafeRestMethod -Uri "$base/health" -TimeoutSec 5

  $testResult = @{
    endpoint = '/health'
    method   = 'GET'
    status   = 'success'
    response = $health
  }
  $results.tests += $testResult

  if ($JSON) {
    $health | ConvertTo-Json -Depth 5 | Write-Output
  }
  Write-TaskComplete 'Health Check' "Environment: $($health.environment)"
} catch {
  $testResult = @{
    endpoint = '/health'
    method   = 'GET'
    status   = 'failed'
    error    = $_.Exception.Message
  }
  $results.tests += $testResult

  Write-TaskError 'Health Check' $_.Exception.Message
  if (-not $JSON) { exit 1 }
}

# Probe /api/device/auth
try {
  Write-TaskStart 'Device Auth' "POST $base/api/device/auth"
  $body = @{
    userId     = $UserId
    clientType = $ClientType
    ttlSec     = $TtlSec
  }

  $resp = Invoke-SafeRestMethod -Method Post -Uri "$base/api/device/auth" -Body $body -TimeoutSec 10

  $testResult = @{
    endpoint = '/api/device/auth'
    method   = 'POST'
    status   = 'success'
    response = $resp
  }
  $results.tests += $testResult

  if ($JSON) {
    $resp | ConvertTo-Json -Depth 5 | Write-Output
  }

  if (-not $resp.ok) {
    Write-Warning "Device auth returned error: $($resp.error)"
    if (-not $JSON) { exit 2 }
  } else {
    Write-TaskComplete 'Device Auth' "Token received, expiresIn=$($resp.expiresIn)s"
  }
} catch {
  $errorMessage = $_.Exception.Message
  $responseBody = $null

  # Try to get the response body from the error
  if ($_.Exception.Response) {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $responseBody = $reader.ReadToEnd()
      $reader.Close()
    } catch {
      $responseBody = 'Could not read response body'
    }
  }

  $testResult = @{
    endpoint     = '/api/device/auth'
    method       = 'POST'
    status       = 'failed'
    error        = $errorMessage
    responseBody = $responseBody
  }
  $results.tests += $testResult

  Write-TaskError 'Device Auth' $errorMessage
  if ($responseBody) {
    Write-TaskError 'Response Body' $responseBody
  }
  if (-not $JSON) { exit 1 }
}

# Summary
$successCount = ($results.tests | Where-Object { $_.status -eq 'success' }).Count
$totalCount = $results.tests.Count

Write-TaskComplete 'Probe Summary' "$successCount/$totalCount tests passed"

if ($JSON) {
  $results | ConvertTo-Json -Depth 10 | Write-Output
}

# Set exit code based on results
if ($successCount -eq $totalCount) {
  Write-Success 'All probes completed successfully'
  exit 0
} else {
  Write-TaskError 'Probe Summary' 'Some tests failed'
  exit 1
}
