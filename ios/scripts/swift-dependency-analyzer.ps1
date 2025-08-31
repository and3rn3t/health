# 🔗 Swift Dependency Analyzer
# Analyzes Swift imports, dependencies, and potential circular references

param(
    [switch]$ShowGraph = $false,
    [switch]$CheckCircular = $false,
    [switch]$ExportJson = $false
)

Write-Host "🔗 Swift Dependency Analysis" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Change to iOS directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

$dependencies = @{}
$imports = @{}
$files = @{}

# Analyze all Swift files
$swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse

Write-Host "📂 Analyzing $($swiftFiles.Count) Swift files..." -ForegroundColor Green
Write-Host ""

foreach ($file in $swiftFiles) {
    if ($file.FullName) {
        $fileName = $file.BaseName
        $content = Get-Content $file.FullName -Raw

        # Extract imports
        $fileImports = @()
        $importMatches = [regex]::Matches($content, "import\s+(\w+)")
        foreach ($match in $importMatches) {
            $fileImports += $match.Groups[1].Value
        }

        # Extract class/struct/enum/protocol declarations
        $declarations = @()
        $declMatches = [regex]::Matches($content, "(class|struct|enum|protocol)\s+(\w+)")
        foreach ($match in $declMatches) {
            $declarations += @{
                Type = $match.Groups[1].Value
                Name = $match.Groups[2].Value
            }
        }

        # Find references to other types in the project
        $references = @()
        foreach ($otherFile in $swiftFiles) {
            if ($otherFile.BaseName -ne $fileName) {
                $otherContent = Get-Content $otherFile.FullName -Raw
                $otherDecls = [regex]::Matches($otherContent, "(class|struct|enum|protocol)\s+(\w+)")
                foreach ($decl in $otherDecls) {
                    $typeName = $decl.Groups[2].Value
                    if ($content -match "\b$typeName\b" -and $typeName -notin $fileImports) {
                        $references += @{
                            File = $otherFile.BaseName
                            Type = $typeName
                        }
                    }
                }
            }
        }

        $files[$fileName] = @{
            Path = $file.FullName
            Imports = $fileImports
            Declarations = $declarations
            References = $references
            LineCount = ($content -split "`n").Count
        }

        Write-Host "✅ $fileName" -ForegroundColor Green
        if ($fileImports.Count -gt 0) {
            Write-Host "   📦 Imports: $($fileImports -join ', ')" -ForegroundColor Gray
        }
        if ($declarations.Count -gt 0) {
            $declStrings = $declarations | ForEach-Object { "$($_.Type) $($_.Name)" }
            Write-Host "   🏗️  Declares: $($declStrings -join ', ')" -ForegroundColor Gray
        }
        if ($references.Count -gt 0) {
            Write-Host "   🔗 References: $($references.Count) internal types" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "📊 DEPENDENCY ANALYSIS RESULTS" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Framework usage analysis
Write-Host ""
Write-Host "📦 Framework Usage:" -ForegroundColor Green
$allImports = $files.Values | ForEach-Object { $_.Imports } | Sort-Object | Get-Unique
$importCounts = @{}
foreach ($import in $allImports) {
    $count = ($files.Values | Where-Object { $_.Imports -contains $import }).Count
    $importCounts[$import] = $count
}

foreach ($import in ($importCounts.Keys | Sort-Object)) {
    $count = $importCounts[$import]
    $percentage = [math]::Round(($count / $swiftFiles.Count) * 100, 1)
    Write-Host "   $import - Used in $count/$($swiftFiles.Count) files ($percentage%)" -ForegroundColor White
}

# Internal dependencies
Write-Host ""
Write-Host "🔗 Internal Dependencies:" -ForegroundColor Green
$totalReferences = ($files.Values | ForEach-Object { $_.References }).Count
Write-Host "   Total internal references: $totalReferences" -ForegroundColor White

$mostReferenced = @{}
foreach ($file in $files.Values) {
    foreach ($ref in $file.References) {
        if (-not $mostReferenced.ContainsKey($ref.File)) {
            $mostReferenced[$ref.File] = 0
        }
        $mostReferenced[$ref.File]++
    }
}

if ($mostReferenced.Count -gt 0) {
    Write-Host "   Most referenced files:" -ForegroundColor White
    $topReferenced = $mostReferenced.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5
    foreach ($ref in $topReferenced) {
        Write-Host "     $($ref.Key) - $($ref.Value) references" -ForegroundColor Gray
    }
}

# Circular dependency check
if ($CheckCircular) {
    Write-Host ""
    Write-Host "🔄 Checking for Circular Dependencies..." -ForegroundColor Yellow

    $circularDeps = @()
    foreach ($fileName in $files.Keys) {
        $visited = @()
        $stack = @($fileName)

        while ($stack.Count -gt 0) {
            $current = $stack[-1]
            $stack = $stack[0..($stack.Count-2)]

            if ($current -in $visited) {
                if ($current -eq $fileName) {
                    $circularDeps += "Circular dependency detected: $fileName"
                }
                continue
            }

            $visited += $current
            if ($files.ContainsKey($current)) {
                foreach ($ref in $files[$current].References) {
                    if ($ref.File -notin $visited) {
                        $stack += $ref.File
                    }
                }
            }
        }
    }

    if ($circularDeps.Count -eq 0) {
        Write-Host "✅ No circular dependencies found" -ForegroundColor Green
    } else {
        Write-Host "❌ Found $($circularDeps.Count) circular dependencies:" -ForegroundColor Red
        foreach ($dep in $circularDeps) {
            Write-Host "   $dep" -ForegroundColor Red
        }
    }
}

# File complexity analysis
Write-Host ""
Write-Host "📏 File Complexity Analysis:" -ForegroundColor Green
$avgLineCount = ($files.Values | Measure-Object -Property LineCount -Average).Average
$largeFiles = $files.Values | Where-Object { $_.LineCount -gt ($avgLineCount * 1.5) }

Write-Host "   Average file size: $([math]::Round($avgLineCount, 1)) lines" -ForegroundColor White
if ($largeFiles.Count -gt 0) {
    Write-Host "   Large files (>$([math]::Round($avgLineCount * 1.5, 1)) lines):" -ForegroundColor Yellow
    foreach ($file in ($largeFiles | Sort-Object LineCount -Descending)) {
        $fileName = (Split-Path $file.Path -Leaf) -replace "\.swift$", ""
        Write-Host "     $fileName - $($file.LineCount) lines" -ForegroundColor Gray
    }
}

# Dependency graph
if ($ShowGraph) {
    Write-Host ""
    Write-Host "🗺️  Dependency Graph:" -ForegroundColor Green
    Write-Host ""

    foreach ($fileName in $files.Keys) {
        Write-Host "$fileName" -ForegroundColor Cyan
        $file = $files[$fileName]

        if ($file.References.Count -gt 0) {
            foreach ($ref in $file.References) {
                Write-Host "  └── depends on $($ref.File) ($($ref.Type))" -ForegroundColor Gray
            }
        } else {
            Write-Host "  └── no internal dependencies" -ForegroundColor Green
        }
    }
}

# Export to JSON
if ($ExportJson) {
    $jsonOutput = @{
        metadata = @{
            analysisDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            totalFiles = $swiftFiles.Count
            totalReferences = $totalReferences
            averageLineCount = [math]::Round($avgLineCount, 1)
        }
        files = $files
        frameworkUsage = $importCounts
        circularDependencies = if ($CheckCircular) { $circularDeps } else { @() }
    }

    $jsonPath = "dependency-analysis.json"
    $jsonOutput | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
    Write-Host ""
    Write-Host "📄 Analysis exported to: $jsonPath" -ForegroundColor Green
}

# Recommendations
Write-Host ""
Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$recommendations = @()

# Check for missing standard imports
if (-not ($allImports -contains "Foundation")) {
    $recommendations += "Consider importing Foundation in files that use basic Swift types"
}

# Check for over-dependencies
$highDependencyFiles = $files.Values | Where-Object { $_.References.Count -gt 3 }
if ($highDependencyFiles.Count -gt 0) {
    $recommendations += "Consider refactoring files with many dependencies: $($highDependencyFiles | ForEach-Object { Split-Path $_.Path -Leaf } | Select-Object -First 3 | Join-String ', ')"
}

# Check for unused frameworks
$lightlyUsedFrameworks = $importCounts.GetEnumerator() | Where-Object { $_.Value -eq 1 } | ForEach-Object { $_.Key }
if ($lightlyUsedFrameworks.Count -gt 2) {
    $recommendations += "Review frameworks used in only one file: $($lightlyUsedFrameworks -join ', ')"
}

if ($recommendations.Count -eq 0) {
    Write-Host "🎉 No major dependency issues found!" -ForegroundColor Green
} else {
    foreach ($rec in $recommendations) {
        Write-Host "💡 $rec" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🛠️  Available Options:" -ForegroundColor Cyan
Write-Host "  -ShowGraph     # Display dependency graph" -ForegroundColor White
Write-Host "  -CheckCircular # Check for circular dependencies" -ForegroundColor White
Write-Host "  -ExportJson    # Export analysis to JSON file" -ForegroundColor White
