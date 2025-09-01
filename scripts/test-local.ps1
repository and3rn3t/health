Write-Host "Testing Local Development Server" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8791"
$endpoints = @("/health", "/", "/api/health-data", "/api/_selftest", "/ws")

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "`nTesting: $url" -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green

        if ($response.Content.Length -lt 500) {
            Write-Host "📝 Response: $($response.Content)" -ForegroundColor White
        } else {
            Write-Host "📝 Response: [Large - $($response.Content.Length) chars]" -ForegroundColor White
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🎯 Local test complete!" -ForegroundColor Green
