Param(
    [string]$Root = "ios/HealthKitBridge",
    [switch]$FailOnError
)

Write-Host "🧪 Running swiftc -typecheck across source files (best-effort)..." -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftc = Get-Command swiftc -ErrorAction SilentlyContinue
if (-not $swiftc) {
    Write-Warning "swiftc not found in PATH. Install Swift toolchain or run on macOS."
    exit 0
}

$swiftFiles = Get-ChildItem -Path $Root -Recurse -Include *.swift | Where-Object { -not $_.PSIsContainer }
if (-not $swiftFiles) {
    Write-Host "No Swift files found."
    exit 0
}

$errors = 0
foreach ($f in $swiftFiles) {
    Write-Host (" - Checking: {0}" -f $f.FullName) -ForegroundColor DarkCyan
    # Note: This is a naive typecheck without full module maps; intended for quick syntax/type sanity.
    $proc = Start-Process -FilePath $swiftc.Source -ArgumentList @('-typecheck', $f.FullName) -NoNewWindow -PassThru -Wait -RedirectStandardError temp.err -RedirectStandardOutput temp.out
    if ($proc.ExitCode -ne 0) {
        $errors++
        Write-Host "   ❌ Failed" -ForegroundColor Red
        Get-Content temp.err | ForEach-Object { Write-Host "     > $_" -ForegroundColor DarkRed }
    }
}

Remove-Item -ErrorAction SilentlyContinue temp.err, temp.out

if ($errors -eq 0) {
    Write-Host "✅ swiftc typecheck passed with no errors." -ForegroundColor Green
    exit 0
}

Write-Host ("⚠️  swiftc typecheck encountered {0} file(s) with issues." -f $errors) -ForegroundColor Yellow
if ($FailOnError) { exit 1 } else { exit 0 }
