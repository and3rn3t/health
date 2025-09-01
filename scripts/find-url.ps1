Write-Host "Finding Worker URL..." -ForegroundColor Green

$urls = @(
    "https://health-app-prod.workers.dev/health",
    "https://health-app.workers.dev/health",
    "https://health.workers.dev/health",
    "https://health.andernet.dev/health"
)

foreach ($url in $urls) {
    Write-Host "Testing: $url" -ForegroundColor Yellow
    try {
        $r = Invoke-WebRequest -Uri $url -TimeoutSec 5
        Write-Host "SUCCESS: $($r.StatusCode) - $($r.Content)" -ForegroundColor Green
        break
    }
    catch {
        Write-Host "Failed: DNS or connection error" -ForegroundColor Red
    }
}

Write-Host "Done!" -ForegroundColor Green
