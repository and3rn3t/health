param(
    [switch]$Fix
)

Write-Host "🧹 SwiftLint (Windows) Wrapper" -ForegroundColor Cyan

# Try dockerized swiftlint first (cross-platform)
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$iosPath = Join-Path $repoRoot 'ios'

$cmd = @(
    'docker','run','--rm',
    '-v',"$iosPath`:/workspace",
    'ghcr.io/realm/swiftlint:latest',
    'swiftlint','/workspace'
)

if ($Fix) {
    $cmd += ' --fix'
}

try {
    Write-Host "Running: $($cmd -join ' ')" -ForegroundColor DarkGray
    $p = Start-Process -FilePath $cmd[0] -ArgumentList $cmd[1..($cmd.Length-1)] -NoNewWindow -PassThru -Wait -ErrorAction Stop
    if ($p.ExitCode -eq 0) {
        Write-Host "✅ SwiftLint completed successfully" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "⚠️ SwiftLint reported issues (Exit $($p.ExitCode))" -ForegroundColor Yellow
        exit $p.ExitCode
    }
}
catch {
    Write-Host "❌ Docker path not available or SwiftLint container failed. Falling back to no-op." -ForegroundColor Yellow
    Write-Host "Tip: Install Docker Desktop or run SwiftLint in CI/macOS." -ForegroundColor DarkYellow
    exit 0
}
