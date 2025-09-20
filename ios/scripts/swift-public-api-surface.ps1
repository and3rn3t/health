Param(
    [string]$Root = "ios/HealthKitBridge",
    [string]$OutFile,
    [switch]$Json
)

Write-Host "📋 Building public API surface (Swift) from '$Root'..." -ForegroundColor Cyan

if (-not (Test-Path $Root)) {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftFiles = Get-ChildItem -Path $Root -Recurse -Include *.swift | Where-Object { -not $_.PSIsContainer }
if (-not $swiftFiles) {
    Write-Host "No Swift files found."
    exit 0
}

$declsByFile = @{}

# Regex patterns for public/open declarations
$typeDecl = '^(\s*)(public|open)\s+(final\s+)?(class|struct|enum|protocol)\s+([A-Za-z_][A-Za-z0-9_]*)'
$funcDecl = '^(\s*)(public|open)\s+func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\('
$varDecl  = '^(\s*)(public|open)\s+(let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(:|=)'

foreach ($file in $swiftFiles) {
    $lines = Get-Content -LiteralPath $file.FullName -ErrorAction SilentlyContinue
    if (-not $lines) { continue }

    $list = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line.TrimStart().StartsWith('//')) { continue }

        $m = [regex]::Match($line, $typeDecl)
        if ($m.Success) {
            $list += [PSCustomObject]@{
                Kind = $m.Groups[4].Value
                Name = $m.Groups[5].Value
                Sig  = $line.Trim()
                Line = ($i + 1)
            }
            continue
        }

        $m = [regex]::Match($line, $funcDecl)
        if ($m.Success) {
            $list += [PSCustomObject]@{
                Kind = 'func'
                Name = $m.Groups[3].Value
                Sig  = $line.Trim()
                Line = ($i + 1)
            }
            continue
        }

        $m = [regex]::Match($line, $varDecl)
        if ($m.Success) {
            $list += [PSCustomObject]@{
                Kind = $m.Groups[3].Value # let/var
                Name = $m.Groups[4].Value
                Sig  = $line.Trim()
                Line = ($i + 1)
            }
            continue
        }
    }

    if ($list.Count -gt 0) {
        $rel = $file.FullName.Substring((Resolve-Path ".").Path.Length + 1)
        $declsByFile[$rel] = $list
    }
}

if ($declsByFile.Count -eq 0) {
    Write-Host "✅ No public/open API declarations found (or files are empty)." -ForegroundColor Green
    exit 0
}

if ($Json) {
    $json = $declsByFile | ConvertTo-Json -Depth 6
    if ($OutFile) {
        Set-Content -LiteralPath $OutFile -Value $json -Encoding UTF8
        Write-Host "✅ Wrote JSON API surface to $OutFile" -ForegroundColor Green
    } else {
        Write-Output $json
    }
    exit 0
}

foreach ($kv in $declsByFile.GetEnumerator() | Sort-Object Key) {
    Write-Host ("\n📄 {0}" -f $kv.Key) -ForegroundColor Yellow
    foreach ($d in $kv.Value) {
        Write-Host ("  • [{0}] {1} — {2}" -f $d.Kind, $d.Name, $d.Sig) -ForegroundColor DarkYellow
    }
}

Write-Host "\n✅ Public API surface listed." -ForegroundColor Green
exit 0
