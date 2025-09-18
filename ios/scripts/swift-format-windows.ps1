param(
    [switch]$InPlace
)

Write-Host "🎨 Swift Format (Windows) Wrapper" -ForegroundColor Cyan

# Prefer SwiftFormat if available locally
$swiftformat = Get-Command swiftformat -ErrorAction SilentlyContinue
if ($swiftformat) {
    $sfArgs = @()
    if ($InPlace) { $sfArgs += '--quiet' }
    & $swiftformat.Source . @sfArgs
    exit $LASTEXITCODE
}

# Fallback to SwiftLint --fix via docker wrapper
$lintWrapper = Join-Path $PSScriptRoot 'swift-lint-windows.ps1'
if (Test-Path $lintWrapper) {
    Write-Host "SwiftFormat not found; falling back to SwiftLint --fix" -ForegroundColor Yellow
    & $lintWrapper -Fix
    exit $LASTEXITCODE
}

Write-Host "No formatter available (swiftformat or SwiftLint)." -ForegroundColor Yellow
exit 0
