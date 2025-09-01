Write-Host "Health Platform API Test" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Cyan

$urls = @(
    "https://health-app-prod.workers.dev",
    "https://health.andernet.dev"
)

$tests = @(
    @{ Path = "/health"; Method = "GET"; Desc = "Health check" },
    @{ Path = "/"; Method = "GET"; Desc = "Main app" },
    @{ Path = "/api/health-data"; Method = "GET"; Desc = "Health data list" },
    @{ Path = "/api/health-data?limit=5"; Method = "GET"; Desc = "Health data with limit" },
    @{ Path = "/api/_selftest"; Method = "GET"; Desc = "Self-test endpoint" },
    @{ Path = "/ws"; Method = "GET"; Desc = "WebSocket info" }
)

foreach ($baseUrl in $urls) {
    Write-Host "`nTesting: $baseUrl" -ForegroundColor Cyan
    Write-Host "=" * 50

    $success = 0
    $total = $tests.Count

    foreach ($test in $tests) {
        $url = "$baseUrl$($test.Path)"
        Write-Host "`n[$($test.Method)] $($test.Desc)" -ForegroundColor Yellow
        Write-Host "URL: $url" -ForegroundColor Gray

        try {
            $response = Invoke-WebRequest -Uri $url -Method $test.Method -TimeoutSec 10
            Write-Host "Status: $($response.StatusCode) - SUCCESS" -ForegroundColor Green

            if ($response.Content.Length -lt 300) {
                Write-Host "Response: $($response.Content)" -ForegroundColor White
            } else {
                Write-Host "Response: [Large - $($response.Content.Length) chars]" -ForegroundColor White
            }
            $success++
        }
        catch {
            Write-Host "Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host "`nSummary: $success/$total successful" -ForegroundColor Cyan
}

Write-Host "`nTest Complete!" -ForegroundColor Green
