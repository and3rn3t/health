param(
    [string]$Scheme = "HealthKitBridge",
    [string]$Destination = "platform=iOS Simulator,name=iPhone 15,OS=latest",
    [switch]$FailOnDuplicates,
    [switch]$RunDuplicateScan
)

Write-Host "🧪 iOS Test Runner" -ForegroundColor Cyan

# Always attempt auto-fix before tests (works on any OS)
Write-Host "🔧 Auto-fix pre-step: SwiftLint --fix" -ForegroundColor Cyan
$iosRoot = Resolve-Path (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'ios')
$swiftlintCmd = Get-Command swiftlint -ErrorAction SilentlyContinue
if ($swiftlintCmd) {
    Push-Location $iosRoot
    try {
        & $swiftlintCmd.Source --fix
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ SwiftLint reported issues (exit $LASTEXITCODE). Continuing..." -ForegroundColor Yellow
        }
    } finally { Pop-Location }
} else {
    # Fallback to dockerized wrapper for cross-platform environments
    $lintScript = Join-Path $PSScriptRoot 'swift-lint-windows.ps1'
    if (Test-Path $lintScript) {
        & $lintScript -Fix
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ SwiftLint (docker) reported issues (exit $LASTEXITCODE). Continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️ SwiftLint not found and wrapper missing; skipping auto-fix." -ForegroundColor Yellow
    }
}

# Duplicate type scan is optional and disabled by default to avoid long runs on Windows
if ($RunDuplicateScan) {
    $dupScan = Join-Path $PSScriptRoot 'swift-duplicate-types-scan.ps1'
    if (Test-Path $dupScan) {
        $rootAbs = (Resolve-Path (Join-Path $PSScriptRoot '..' 'HealthKitBridge')).Path
        $scanArgs = @(
            '-Root', $rootAbs,
            '-VerboseOutput',
            '-MaxFileSizeKB', '512',
            '-ExcludeDirs', 'Pods','DerivedData','.build','.git','Carthage','vendor','node_modules'
        )
        if ($FailOnDuplicates) { $scanArgs += '-FailOnDuplicates' }
        Write-Host "🔎 Running duplicate-types scan (bounded)..." -ForegroundColor Cyan
        & $dupScan @scanArgs
        $code = $LASTEXITCODE
        if ($code -ne 0 -and $FailOnDuplicates) {
            Write-Host "❌ Duplicate types detected (exit $code). Aborting tests due to -FailOnDuplicates." -ForegroundColor Red
            exit $code
        }
    } else {
        Write-Host "ℹ️ Duplicate scan script not found; skipping." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping duplicate-types scan (enable with -RunDuplicateScan)." -ForegroundColor DarkGray
}

# Only run on macOS with xcodebuild available
if ($IsWindows) {
    Write-Host "Skipping tests: xcodebuild not available on Windows" -ForegroundColor Yellow
    Write-Host "Tip: Use this runner to auto-fix and duplicate-scan on Windows; real tests run on macOS CI/local." -ForegroundColor DarkYellow
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
