Write-Host "🏥 Comprehensive Health Platform API Test" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

$workerUrls = @(
    "https://health-app-prod.workers.dev",
    "https://health.andernet.dev"
)

# All API endpoints from the worker and documentation
$endpoints = @(
    @{ Path = "/health"; Method = "GET"; Description = "Health check endpoint" },
    @{ Path = "/"; Method = "GET"; Description = "React app main page" },
    @{ Path = "/api/health-data"; Method = "GET"; Description = "Get health data (with pagination)" },
    @{ Path = "/api/health-data?limit=10"; Method = "GET"; Description = "Health data with limit" },
    @{ Path = "/api/health-data?metric=heart_rate"; Method = "GET"; Description = "Filter by heart rate metric" },
    @{ Path = "/api/_selftest"; Method = "GET"; Description = "Crypto/auth self-test (non-prod)" },
    @{ Path = "/api/_admin/purge-health"; Method = "POST"; Description = "Admin purge endpoint (non-prod)" },
    @{ Path = "/ws"; Method = "GET"; Description = "WebSocket endpoint info" }
)

# Additional endpoints for POST tests
$postEndpoints = @(
    @{ Path = "/api/health-data"; Method = "POST"; Description = "Submit health data";
       Body = @{
           type = "heart_rate"
           value = 72
           unit = "bpm"
           timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
           source = "test_client"
       }
    }
)

foreach ($baseUrl in $workerUrls) {
    Write-Host "`n🌐 Testing Base URL: $baseUrl" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Gray

    $successCount = 0
    $totalTests = $endpoints.Count + $postEndpoints.Count

    # Test GET endpoints
    foreach ($endpoint in $endpoints) {
        $url = "$baseUrl$($endpoint.Path)"
        Write-Host "`n📡 [$($endpoint.Method)] Testing: $url" -ForegroundColor Yellow
        Write-Host "   Description: $($endpoint.Description)" -ForegroundColor Gray

        try {
            $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -TimeoutSec 15 -ErrorAction Stop
            Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green

            $contentType = $response.Headers['Content-Type']
            if ($contentType) {
                Write-Host "   📄 Content-Type: $contentType" -ForegroundColor Gray
            }

            if ($response.Content.Length -lt 1000) {
                $content = $response.Content
                # Try to format JSON nicely
                try {
                    $json = $content | ConvertFrom-Json
                    $formatted = $json | ConvertTo-Json -Depth 3 -Compress
                    Write-Host "   📝 Response: $formatted" -ForegroundColor White
                } catch {
                    Write-Host "   📝 Response: $content" -ForegroundColor White
                }
            } else {
                Write-Host "   📝 Response: [Large response - $($response.Content.Length) chars]" -ForegroundColor White
            }
            $successCount++
        }
        catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                Write-Host "   📊 Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
            }
        }
    }

    # Test POST endpoints
    foreach ($endpoint in $postEndpoints) {
        $url = "$baseUrl$($endpoint.Path)"
        Write-Host "`n📤 [$($endpoint.Method)] Testing: $url" -ForegroundColor Yellow
        Write-Host "   Description: $($endpoint.Description)" -ForegroundColor Gray

        try {
            $body = $endpoint.Body | ConvertTo-Json -Depth 3
            Write-Host "   📦 Request Body: $body" -ForegroundColor Gray

            $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -Body $body -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
            Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green

            if ($response.Content.Length -lt 1000) {
                try {
                    $json = $response.Content | ConvertFrom-Json
                    $formatted = $json | ConvertTo-Json -Depth 3 -Compress
                    Write-Host "   📝 Response: $formatted" -ForegroundColor White
                } catch {
                    Write-Host "   📝 Response: $($response.Content)" -ForegroundColor White
                }
            }
            $successCount++
        }
        catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                Write-Host "   📊 Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
                # Try to read error response
                try {
                    $errorStream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($errorStream)
                    $errorContent = $reader.ReadToEnd()
                    if ($errorContent) {
                        Write-Host "   📝 Error Response: $errorContent" -ForegroundColor Red
                    }
                } catch {
                    # Ignore error reading error response
                }
            }
        }
    }

    # Summary for this URL
    $successRate = [math]::Round(($successCount / $totalTests) * 100, 1)
    Write-Host "`n📊 Summary for $baseUrl" -ForegroundColor Cyan
    Write-Host "   ✅ Successful: $successCount / $totalTests ($successRate%)" -ForegroundColor Green

    if ($successRate -ge 80) {
        Write-Host "   🎉 Status: EXCELLENT" -ForegroundColor Green
    } elseif ($successRate -ge 60) {
        Write-Host "   ⚠️  Status: GOOD" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Status: NEEDS ATTENTION" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Comprehensive API Test Complete!" -ForegroundColor Green
Write-Host "💡 Check the logs above for any issues that need addressing." -ForegroundColor Yellow
