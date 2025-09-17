param(
    [string]$Scheme = "HealthKitBridge",
    [string]$Destination = "platform=iOS Simulator,name=iPhone 15,OS=latest"
)

Write-Host "🧪 iOS Test Runner" -ForegroundColor Cyan

# Only run on macOS with xcodebuild available
if ($IsWindows) {
    Write-Host "Skipping: xcodebuild not available on Windows" -ForegroundColor Yellow
    exit 0
}

if (-not (Get-Command xcodebuild -ErrorAction SilentlyContinue)) {
    Write-Host "xcodebuild not found. Install Xcode command line tools." -ForegroundColor Red
    exit 1
}

$proj = Resolve-Path "$PSScriptRoot/../HealthKitBridge.xcodeproj" -ErrorAction SilentlyContinue
if (-not $proj) {
    Write-Host "Xcode project not found." -ForegroundColor Red
    exit 1
}

$cmd = @(
    'xcodebuild',
    'test',
    '-scheme', $Scheme,
    '-destination', $Destination
)

Write-Host "Running: $($cmd -join ' ')" -ForegroundColor DarkGray
& $cmd[0] $cmd[1..($cmd.Length-1)]
$code = $LASTEXITCODE
if ($code -eq 0) {
    Write-Host "✅ Tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed (exit $code)" -ForegroundColor Red
}
exit $code
