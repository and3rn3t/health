Param(
    [string]$Root = "ios/HealthKitBridge",
    [switch]$ShowGraph,
    [switch]$FailOnCycles
)

Write-Host "🕸️  Building Swift import graph from '$Root'..." -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftFiles = Get-ChildItem -Path $Root -Recurse -Include *.swift | Where-Object { -not $_.PSIsContainer }
if (-not $swiftFiles) {
    Write-Host "No Swift files found."
    exit 0
}

$nodes = @{}
$edges = @()

foreach ($f in $swiftFiles) {
    $rel = $f.FullName.Substring((Resolve-Path ".").Path.Length + 1)
    $nodes[$rel] = $true
    $lines = Get-Content -LiteralPath $f.FullName -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if ($line.TrimStart().StartsWith('//')) { continue }
        $m = [regex]::Match($line, '^\s*import\s+([A-Za-z_][A-Za-z0-9_]*)')
        if ($m.Success) {
            $edges += [PSCustomObject]@{ From = $rel; Import = $m.Groups[1].Value }
        }
    }
}

if ($ShowGraph) {
    Write-Host "\n📈 Imports (by file):" -ForegroundColor Yellow
    $edges | Group-Object From | Sort-Object Name | ForEach-Object {
        Write-Host (" - {0}" -f $_.Name) -ForegroundColor Yellow
        $_.Group | Sort-Object Import | ForEach-Object {
            Write-Host ("    • import {0}" -f $_.Import) -ForegroundColor DarkYellow
        }
    }
}

# Simple cycle detection based on file-to-file logical ties isn’t directly feasible with only module names.
# But we can flag suspicious heavy imports like UIKit+SwiftUI+ActivityKit in the same file.
$heavyCombos = @('SwiftUI','UIKit','ActivityKit')
$heavyHits = $edges | Group-Object From | Where-Object { ($_.Group.Import | Select-Object -Unique | Where-Object { $heavyCombos -contains $_ }).Count -ge 2 }

if ($heavyHits.Count -gt 0) {
    Write-Host "\n⚠️  Files with heavy import combos (potential for bloating/entanglement):" -ForegroundColor Yellow
    foreach ($g in $heavyHits) {
        $mods = ($g.Group.Import | Select-Object -Unique | Where-Object { $heavyCombos -contains $_ }) -join ', '
        Write-Host (" - {0} → {1}" -f $g.Name, $mods) -ForegroundColor DarkYellow
    }
    if ($FailOnCycles) {
        Write-Error "Heavy import combos detected. Failing as requested."
        exit 3
    }
}

Write-Host "\n✅ Import scan complete." -ForegroundColor Green
exit 0
