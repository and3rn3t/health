Param(
    [string]$Root = "ios/HealthKitBridge",
    [switch]$FailOnFindings
)

Write-Host "🔎 Checking for platform-specific APIs missing availability/conditional guards..." -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftFiles = Get-ChildItem -Path $Root -Recurse -Include *.swift | Where-Object { -not $_.PSIsContainer }
if (-not $swiftFiles) {
    Write-Warning "No Swift files found under '$Root'"
    exit 0
}

# Naive patterns for watchOS-only and ActivityKit usage.
$watchApis = @(
    'HKLiveWorkoutBuilder',
    'HKWorkoutSession',
    'WKInterface',
    'WatchKit'
)

$liveActivitiesApis = @('Activity<', 'ActivityKit')

$issues = @()

foreach ($file in $swiftFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $hasWatchGuard = $content -match '#if\s+os\(watchOS\)'
    $hasActivityGuard = $content -match '#if\s+canImport\(ActivityKit\)'

    foreach ($api in $watchApis) {
        if ($content -match [regex]::Escape($api)) {
            if (-not $hasWatchGuard) {
                $issues += [PSCustomObject]@{
                    File = $file.FullName
                    API  = $api
                    Note = 'Detected watchOS-specific API without #if os(watchOS) guard'
                }
            }
        }
    }

    foreach ($api in $liveActivitiesApis) {
        if ($content -match [regex]::Escape($api)) {
            if (-not $hasActivityGuard) {
                $issues += [PSCustomObject]@{
                    File = $file.FullName
                    API  = $api
                    Note = 'Detected ActivityKit usage without #if canImport(ActivityKit) guard'
                }
            }
        }
    }
}

if ($issues.Count -eq 0) {
    Write-Host "✅ No unguarded platform-specific APIs found." -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Unguarded platform-specific API usages:" -ForegroundColor Yellow
$issues | Group-Object File | ForEach-Object {
    Write-Host (" - {0}" -f ($_.Name.Substring((Resolve-Path ".").Path.Length + 1))) -ForegroundColor Yellow
    $_.Group | ForEach-Object {
        Write-Host ("    • API: {0} — {1}" -f $_.API, $_.Note) -ForegroundColor DarkYellow
    }
}

if ($FailOnFindings) {
    Write-Error "Availability guard check found issues. Failing as requested."
    exit 3
}

exit 0
