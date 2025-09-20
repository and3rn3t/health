Param(
    [string]$Root = "ios/HealthKitBridge",
    [string[]]$ExcludeDirs = @('Pods','DerivedData','.build','.git','Carthage','vendor','node_modules'),
    [int]$MaxFileSizeKB = 1024,
    [int]$MaxFiles = 0,
    [switch]$FailOnDuplicates,
    [switch]$VerboseOutput
)

Write-Host "🔎 Scanning Swift sources for duplicate type declarations..." -ForegroundColor Cyan

try {
    $Root = (Resolve-Path -LiteralPath $Root).Path
} catch {
    Write-Error "Root path not found: $Root"
    exit 2
}

$swiftFiles = Get-ChildItem -Path $Root -Recurse -File -Filter *.swift -Force |
    Where-Object {
        # Exclude heavy/third-party/generated dirs
        $full = $_.FullName
        $normalized = $full -replace '\\','/'
        -not ($ExcludeDirs | Where-Object { $normalized -match "/$($_)/" })
    } |
    Where-Object {
        # Skip very large files to avoid memory spikes
        $MaxFileSizeKB -le 0 -or [int]([math]::Ceiling($_.Length / 1KB)) -le $MaxFileSizeKB
    }

if ($MaxFiles -gt 0) {
    $swiftFiles = $swiftFiles | Select-Object -First $MaxFiles
}

if (-not $swiftFiles) {
    Write-Warning "No Swift files found under '$Root'"
    exit 0
}

# Regex captures: access? final? kind (class|struct|enum|protocol) name
$typeRegex = '^(\s*(?:public|internal|open|fileprivate|private)?\s*(?:final\s+)?(class|struct|enum|protocol)\s+([A-Za-z_][A-Za-z0-9_]*))\b'

$map = @{}

foreach ($file in $swiftFiles) {
    # Reset per-file parsing state to avoid cross-file bleed
    $typeStack = @() # stack of @{ Name; Kind; StartDepth }
    $braceDepth = 0
    $insideBlockComment = $false

    # Stream line-by-line to reduce memory usage
    $lines = Get-Content -LiteralPath $file.FullName -ReadCount 1 -ErrorAction SilentlyContinue
    if (-not $lines) { continue }

    $lineNumber = 0
    foreach ($line in $lines) {
        $lineNumber++

        # Update brace depth and pop types whose scope ended on previous line
        $closingCount = ([regex]::Matches($line, '\}')).Count
        for ($c = 0; $c -lt $closingCount; $c++) {
            if ($typeStack.Count -gt 0 -and $braceDepth -le $typeStack[-1].StartDepth) {
                if ($typeStack.Count -gt 1) { $typeStack = $typeStack[0..($typeStack.Count-2)] } else { $typeStack = @() }
            }
            $braceDepth -= 1
        }

        # Skip block comments basic heuristic
        if ($line -match '/\*') { $insideBlockComment = $true }
        if ($insideBlockComment) {
            if ($line -match '\*/') { $insideBlockComment = $false }
            continue
        }

        # Skip single-line comments
        if ($line.TrimStart().StartsWith('//')) { continue }

        $m = [regex]::Match($line, $typeRegex)
        if ($m.Success) {
            $kind = $m.Groups[2].Value
            $name = $m.Groups[3].Value

            # Skip common SwiftUI Preview structs
            if ($name -match 'Preview(s)?Provider$') { continue }

            # Determine current parent scope path
            $parentPath = ($typeStack | ForEach-Object { $_.Name }) -join '.'
            $isTopLevel = [string]::IsNullOrEmpty($parentPath)

            # Compose scoped key (parentPath.name) to distinguish nested types
            $key = if ($isTopLevel) { $name } else { "$parentPath.$name" }
            if (-not $map.ContainsKey($key)) { $map[$key] = @() }
            $map[$key] += [PSCustomObject]@{
                Kind = $kind
                File = $file.FullName
                Line = $lineNumber
                Path = ($file.FullName.Substring($Root.Length).TrimStart('\','/'))
                Name = $name
                Parent = $parentPath
                IsTopLevel = $isTopLevel
            }

            # Push this type onto the stack; its body starts after the next '{'
            $typeStack += [PSCustomObject]@{ Name = if ($isTopLevel) { $name } else { "$parentPath.$name" }; Kind = $kind; StartDepth = $braceDepth }
        }

        # Increase depth for any opening braces on this line
        $openingCount = ([regex]::Matches($line, '\{')).Count
        $braceDepth += $openingCount
    }
}

# Only consider duplicates where the type is top-level (no parent path)
$duplicates = $map.GetEnumerator() |
    ForEach-Object {
        $name = $_.Key
        $decls = $_.Value
        # If any declaration entry is not top-level, treat as distinct; group by (IsTopLevel, ScopedName)
        $topLevelDecls = $decls | Where-Object { $_.IsTopLevel }
        if ($topLevelDecls.Count -gt 1) {
            [PSCustomObject]@{ Key = $name; Decls = $topLevelDecls; Count = $topLevelDecls.Count }
        }
    } |
    Where-Object { $_ -ne $null } |
    Sort-Object Count -Descending

if (-not $duplicates -or $duplicates.Count -eq 0) {
    Write-Host "✅ No duplicate top-level type names found." -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Potential duplicate type declarations detected:" -ForegroundColor Yellow
foreach ($entry in $duplicates) {
    # For reporting, use the simple type name (last segment after dot)
    $firstDecl = $entry.Decls | Select-Object -First 1
    $simpleName = $firstDecl.Name
    $decls = $entry.Decls
    Write-Host (" - {0} (x{1})" -f $simpleName, $decls.Count) -ForegroundColor Yellow
    foreach ($d in $decls) {
        if ($VerboseOutput) {
            Write-Host ("    • {0} {1}:{2}" -f $d.Kind, $d.Path, $d.Line) -ForegroundColor DarkYellow
        } else {
            Write-Host ("    • {0}" -f $d.Path) -ForegroundColor DarkYellow
        }
    }
}

if ($FailOnDuplicates) {
    Write-Error "Duplicate type names found. Failing as requested."
    exit 3
}

exit 0
