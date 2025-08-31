param(
  [string]$HostUrl = "http://127.0.0.1",
  [int]$Port = 8787,
  [string]$UserId = "demo-user",
  [string]$ClientType = "ios_app",
  [int]$TtlSec = 600
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
  Write-Host "[info] $msg" -ForegroundColor Cyan
}
function Write-Ok($msg) {
  Write-Host "[ok]   $msg" -ForegroundColor Green
}
function Write-Warn($msg) {
  Write-Host "[warn] $msg" -ForegroundColor Yellow
}
function Write-Err($msg) {
  Write-Host "[err]  $msg" -ForegroundColor Red
}

$base = "${HostUrl}:$Port"

# Probe /health
try {
  Write-Info "GET $base/health"
  $health = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 5
  $health | ConvertTo-Json -Depth 5 | Write-Output
  Write-Ok "/health ok ($($health.environment))"
} catch {
  Write-Err "GET /health failed: $($_.Exception.Message)"
  exit 1
}

# Probe /api/device/auth
try {
  Write-Info "POST $base/api/device/auth"
  $body = @{ userId = $UserId; clientType = $ClientType; ttlSec = $TtlSec } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method Post -Uri "$base/api/device/auth" -ContentType 'application/json' -Body $body -TimeoutSec 10
  $resp | ConvertTo-Json -Depth 5 | Write-Output
  if (-not $resp.ok) {
    Write-Warn "Device auth returned error: $($resp.error)"
    exit 2
  } else {
    Write-Ok "Token received, expiresIn=$($resp.expiresIn)s"
  }
} catch {
  Write-Err "POST /api/device/auth failed: $($_.Exception.Message)"
  exit 1
}

Write-Ok "Probes completed"
