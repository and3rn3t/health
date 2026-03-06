#!/usr/bin/env pwsh
# Debug script to test device auth endpoint like CI does

param(
  [string]$BaseUrl = 'http://127.0.0.1:8787'
)

Write-Host "Testing device auth endpoint at $BaseUrl" -ForegroundColor Yellow

# Test the request body that probe.ps1 sends
$body = @{
  userId     = 'ci-user'
  clientType = 'ios_app'
  ttlSec     = 600
} | ConvertTo-Json

Write-Host 'Request body:' -ForegroundColor Cyan
Write-Host $body

try {
  $headers = @{
    'Content-Type' = 'application/json'
  }

  Write-Host "`nSending POST request..." -ForegroundColor Yellow
  $response = Invoke-RestMethod -Uri "$BaseUrl/api/device/auth" -Method Post -Body $body -Headers $headers -TimeoutSec 10

  Write-Host 'Success!' -ForegroundColor Green
  Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
  Write-Host 'Error!' -ForegroundColor Red
  Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red

  if ($_.Exception.Response) {
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $responseBody = $reader.ReadToEnd()
      Write-Host "Response body: $responseBody" -ForegroundColor Red
    } catch {
      Write-Host 'Could not read response body'
    }
  }
}
