Write-Host "Finding the correct Worker URL..." -ForegroundColor Green

# Common worker URL patterns to test
$possibleUrls = @(
    "https://health-app-prod.workers.dev",
    "https://health-app.workers.dev",
    "https://health-prod.workers.dev",
    "https://health.workers.dev",
    # Account-specific patterns (we'll try common account names)
    "https://health-app-prod.and3rn3t.workers.dev",
    "https://health-app.and3rn3t.workers.dev",
    "https://health-app-prod.andernet.workers.dev",
    "https://health-app.andernet.workers.dev"
)

Write-Host "Testing possible worker URLs..." -ForegroundColor Cyan

foreach ($url in $possibleUrls) {
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    try {
        # Use a shorter timeout for faster testing
        $response = Invoke-WebRequest -Uri "$url/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "📝 Response: $($response.Content)" -ForegroundColor White
        Write-Host "🎯 WORKING URL FOUND: $url" -ForegroundColor Green
        break
    }
    catch {
        Write-Host "❌ Failed: $($_.Exception.Message.Split('.')[0])" -ForegroundColor Red
    }
}

Write-Host "`nTesting custom domain..." -ForegroundColor Cyan
try {
    $customResponse = Invoke-WebRequest -Uri "https://health.andernet.dev/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Custom domain works! Status: $($customResponse.StatusCode)" -ForegroundColor Green
    Write-Host "📝 Response: $($customResponse.Content)" -ForegroundColor White
}
catch {
    Write-Host "❌ Custom domain failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nURL discovery complete!" -ForegroundColor Green
