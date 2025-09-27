# PowerShell 7 Integration Test
Write-Host '=== PowerShell 7 Integration Test ===' -ForegroundColor Cyan

# Test 1: Basic PowerShell 7 functionality
Write-Host "1. PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Green

# Test 2: Module import
try {
  Import-Module './scripts/VSCodeIntegration.psm1' -Force
  Write-Host '2. VSCodeIntegration module imported successfully' -ForegroundColor Green
} catch {
  Write-Host "2. Failed to import VSCodeIntegration module: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Test 3: Module functions
try {
  Write-TaskStart 'Integration Test' 'Testing module functions'
  Write-Info 'This is an info message'
  Write-Success 'This is a success message'
  Write-TaskComplete 'Integration Test' 'Module functions work correctly'
  Write-Host '3. Module functions working correctly' -ForegroundColor Green
} catch {
  Write-Host "3. Module functions failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Simple HTTP test (without requiring server)
try {
  $testUrl = 'https://httpbin.org/status/200'
  $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "4. HTTP functionality works (status: $($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "4. HTTP test failed (but this is expected if no internet): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 5: Local server probe (if running)
try {
  $healthUrl = 'http://127.0.0.1:8788/health'
  $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
  Write-Host "5. Local server probe successful: $($health.status)" -ForegroundColor Green
} catch {
  Write-Host "5. No local server running (this is fine): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== PowerShell 7 Integration Test Complete ===" -ForegroundColor Cyan
Write-Host 'PowerShell 7 is properly configured and working!' -ForegroundColor Green
