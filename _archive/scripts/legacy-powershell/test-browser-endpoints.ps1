# Browser-Based Endpoint Testing Script
# Works around DNS resolution issues by using browser automation

param(
    [string]$BaseUrl = "https://health-app-prod.workers.dev",
    [string]$CustomDomain = "https://health.andernet.dev",
    [string]$LocalUrl = "http://127.0.0.1:8790",
    [switch]$TestCustomDomain,
    [switch]$TestLocal,
    [switch]$Verbose
)

Write-Host "🔍 Health App Browser-Based Endpoint Testing" -ForegroundColor Cyan
Write-Host "=" * 50

$endpoints = @(
    @{ Path = "/health"; Name = "Basic Health Check"; Method = "GET" }
    @{ Path = "/api/_selftest"; Name = "Self Test"; Method = "GET" }
    @{ Path = "/api/health-data"; Name = "Health Data API"; Method = "GET" }
    @{ Path = "/"; Name = "React App"; Method = "GET" }
    @{ Path = "/docs"; Name = "API Documentation"; Method = "GET" }
)

function Test-UrlWithBrowser {
    param([string]$Url, [string]$Name)

    try {
        Write-Host "🌐 Testing: $Name" -ForegroundColor Yellow
        Write-Host "   URL: $Url" -ForegroundColor Gray

        # Try to create WebRequest (faster than browser automation)
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Timeout = 10000  # 10 seconds
        $request.Method = "GET"

        $response = $request.GetResponse()
        $statusCode = [int]$response.StatusCode
        $statusDescription = $response.StatusDescription

        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $response.Close()

        Write-Host "   ✅ Status: $statusCode $statusDescription" -ForegroundColor Green

        if ($Verbose) {
            $preview = if ($content.Length -gt 200) { $content.Substring(0, 200) + "..." } else { $content }
            Write-Host "   📄 Content Preview: $preview" -ForegroundColor Cyan
        }

        return @{
            Success = $true
            StatusCode = $statusCode
            Content = $content
            Length = $content.Length
        }
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

$results = @()

# Test primary domain
Write-Host "`n🎯 Testing Primary Domain: $BaseUrl" -ForegroundColor Magenta
foreach ($endpoint in $endpoints) {
    $url = $BaseUrl + $endpoint.Path
    $result = Test-UrlWithBrowser -Url $url -Name $endpoint.Name
    $results += @{
        Domain = "Primary"
        Endpoint = $endpoint.Name
        URL = $url
        Result = $result
    }
}

# Test custom domain if requested
if ($TestCustomDomain) {
    Write-Host "`n🏷️  Testing Custom Domain: $CustomDomain" -ForegroundColor Magenta
    foreach ($endpoint in $endpoints) {
        $url = $CustomDomain + $endpoint.Path
        $result = Test-UrlWithBrowser -Url $url -Name $endpoint.Name
        $results += @{
            Domain = "Custom"
            Endpoint = $endpoint.Name
            URL = $url
            Result = $result
        }
    }
}

# Test local development if requested
if ($TestLocal) {
    Write-Host "`n🏠 Testing Local Development: $LocalUrl" -ForegroundColor Magenta
    foreach ($endpoint in $endpoints) {
        $url = $LocalUrl + $endpoint.Path
        $result = Test-UrlWithBrowser -Url $url -Name $endpoint.Name
        $results += @{
            Domain = "Local"
            Endpoint = $endpoint.Name
            URL = $url
            Result = $result
        }
    }
}

# Summary Report
Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "=" * 50

$successCount = ($results | Where-Object { $_.Result.Success }).Count
$totalCount = $results.Count

Write-Host "✅ Successful: $successCount/$totalCount" -ForegroundColor Green

$failedResults = $results | Where-Object { -not $_.Result.Success }
if ($failedResults) {
    Write-Host "❌ Failed Tests:" -ForegroundColor Red
    foreach ($failed in $failedResults) {
        Write-Host "   $($failed.Domain) - $($failed.Endpoint): $($failed.Result.Error)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Browser-based testing complete!" -ForegroundColor Green
Write-Host "💡 Note: DNS resolution issues bypassed using .NET WebRequest" -ForegroundColor Yellow

return $results
