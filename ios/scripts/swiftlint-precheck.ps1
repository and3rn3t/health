Param(
    [string]$Root = "ios/HealthKitBridge",
    [switch]$Strict
)

Write-Host "🧹 SwiftLint precheck..." -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftlint = Get-Command swiftlint -ErrorAction SilentlyContinue
if (-not $swiftlint) {
    Write-Warning "swiftlint not found. On Windows, use the provided PowerShell wrapper: ios/scripts/swift-lint-windows.ps1"
    if ($Strict) { exit 1 } else { exit 0 }
}

Push-Location $Root
try {
    & $swiftlint.Source lint
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($code -eq 0) {
    Write-Host "✅ SwiftLint passed." -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  SwiftLint found issues (exit $code)." -ForegroundColor Yellow
if ($Strict) { exit $code } else { exit 0 }
