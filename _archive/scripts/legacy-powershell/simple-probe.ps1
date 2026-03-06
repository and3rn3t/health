# Simple health probe script for VS Code tasks
param(
  [string]$Port = '8787'
)

$url = "http://127.0.0.1:$Port/health"

try {
  Write-Host "Testing endpoint: $url" -ForegroundColor Cyan
  $response = Invoke-RestMethod -Uri $url -TimeoutSec 5
  $response | ConvertTo-Json -Depth 5
  Write-Host 'Health check passed' -ForegroundColor Green
} catch {
  Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
