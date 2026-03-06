Write-Host "🏥 Testing Health Platform Deployment" -ForegroundColor Green

$workerUrls = @(
    "https://health-app-prod.workers.dev",
    "https://health.andernet.dev"
)

$endpoints = @(
    "/health",
    "/",
    "/api/health-data"
)

foreach ($baseUrl in $workerUrls) {
    Write-Host "`n🌐 Testing Base URL: $baseUrl" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray

    foreach ($endpoint in $endpoints) {
        $url = "$baseUrl$endpoint"
        Write-Host "`n📡 Testing: $url" -ForegroundColor Yellow

        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
            Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "📄 Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray

            if ($response.Content.Length -lt 500) {
                Write-Host "📝 Response: $($response.Content)" -ForegroundColor White
            } else {
                Write-Host "📝 Response: $($response.Content.Substring(0, 200))..." -ForegroundColor White
            }
        }
        catch {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n🎯 Test complete!" -ForegroundColor Green
