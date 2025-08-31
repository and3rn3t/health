# 🎨 Swift Code Formatter for Windows
# Applies consistent formatting to Swift files without requiring Xcode

param(
    [string]$File = "",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "🎨 Swift Code Formatter" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Change to iOS directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

function Format-SwiftFile {
    param(
        [string]$FilePath,
        [bool]$Apply = $true
    )

    $fileName = Split-Path $FilePath -Leaf
    Write-Host "🔧 Processing: $fileName" -ForegroundColor Yellow

    if (-not (Test-Path $FilePath)) {
        Write-Host "  ❌ File not found: $FilePath" -ForegroundColor Red
        return $false
    }

    $content = Get-Content $FilePath -Raw
    $originalContent = $content
    $changes = 0

    # 1. Normalize line endings to LF
    $content = $content -replace "`r`n", "`n"
    if ($content -ne $originalContent) { $changes++ }

    # 2. Remove trailing whitespace
    $content = $content -replace "[ `t]+`n", "`n"
    if ($content -ne $originalContent) { $changes++ }

    # 3. Ensure single blank line at end of file
    $content = $content.TrimEnd() + "`n"

    # 4. Fix spacing around operators
    $content = $content -replace "([a-zA-Z0-9_)])([+\-*/=<>!]+)([a-zA-Z0-9_(])", '$1 $2 $3'
    $content = $content -replace "([+\-*/=<>!]+)([a-zA-Z0-9_(])", '$1 $2'
    $content = $content -replace "([a-zA-Z0-9_)])([+\-*/=<>!]+)", '$1 $2'

    # 5. Fix spacing after commas
    $content = $content -replace ",([a-zA-Z0-9_])", ', $1'

    # 6. Fix spacing around colons in type annotations
    $content = $content -replace ":([a-zA-Z])", ': $1'
    $content = $content -replace "([a-zA-Z0-9_)] *):", '$1:'

    # 7. Normalize brace spacing
    $content = $content -replace " +{", ' {'
    $content = $content -replace "}{", '} {'

    # 8. Fix import grouping (basic)
    $lines = $content -split "`n"
    $imports = @()
    $nonImports = @()
    $inImportSection = $true

    foreach ($line in $lines) {
        if ($line -match "^import ") {
            if ($inImportSection) {
                $imports += $line
            } else {
                $nonImports += $line
            }
        } elseif ($line.Trim() -eq "" -and $inImportSection) {
            # Keep empty lines in import section
        } else {
            $inImportSection = $false
            $nonImports += $line
        }
    }

    # Sort imports
    $imports = $imports | Sort-Object

    # Rebuild content with sorted imports
    if ($imports.Count -gt 0) {
        $content = ($imports -join "`n") + "`n`n" + ($nonImports -join "`n")
    }

    # 9. Basic indentation fix (convert 4-space to 2-space)
    $lines = $content -split "`n"
    $indentedLines = @()

    foreach ($line in $lines) {
        if ($line -match "^    ") {
            # Convert 4-space indentation to 2-space
            $indentLevel = 0
            $i = 0
            while ($i -lt $line.Length -and $line[$i] -eq ' ') {
                $indentLevel++
                $i++
            }
            $newIndent = ' ' * [math]::Floor($indentLevel / 2)
            $line = $newIndent + $line.Substring($i)
        }
        $indentedLines += $line
    }
    $content = $indentedLines -join "`n"

    # Count actual changes
    $actualChanges = if ($content -ne $originalContent) { 1 } else { 0 }

    if ($Verbose) {
        if ($actualChanges -gt 0) {
            Write-Host "  📝 Formatting changes applied" -ForegroundColor Green
        } else {
            Write-Host "  ✅ Already properly formatted" -ForegroundColor Green
        }
    }

    # Apply changes or show diff
    if ($Apply -and $actualChanges -gt 0) {
        try {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  ✅ Formatted successfully" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "  ❌ Failed to write file: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } elseif ($actualChanges -gt 0) {
        Write-Host "  📋 Would apply formatting changes (use without -DryRun to apply)" -ForegroundColor Yellow
        return $true
    } else {
        if (-not $Verbose) {
            Write-Host "  ✅ No changes needed" -ForegroundColor Green
        }
        return $true
    }
}

# Main execution
$success = $true

if ($File) {
    # Format specific file
    $filePath = if ([System.IO.Path]::IsPathRooted($File)) { $File } else { Join-Path (Get-Location) $File }
    $success = Format-SwiftFile -FilePath $filePath -Apply (-not $DryRun)
} else {
    # Format all Swift files
    $swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse | Where-Object { $_.Name -notmatch "\.fixed\.swift$" }

    if ($swiftFiles.Count -eq 0) {
        Write-Host "❌ No Swift files found in HealthKitBridge/" -ForegroundColor Red
        exit 1
    }

    Write-Host "📝 Found $($swiftFiles.Count) Swift files to format" -ForegroundColor Green
    if ($DryRun) {
        Write-Host "🔍 DRY RUN - No files will be modified" -ForegroundColor Yellow
    }
    Write-Host ""

    $formattedCount = 0
    $errorCount = 0

    foreach ($file in $swiftFiles) {
        if ($file.FullName -and (Test-Path $file.FullName)) {
            $result = Format-SwiftFile -FilePath $file.FullName -Apply (-not $DryRun)
            if ($result) {
                $formattedCount++
            } else {
                $errorCount++
                $success = $false
            }
        } else {
            Write-Host "⚠️  Skipping invalid file: $($file.Name)" -ForegroundColor Yellow
            $errorCount++
            $success = $false
        }
    }

    Write-Host ""
    Write-Host "📊 SUMMARY" -ForegroundColor Cyan
    Write-Host "=========" -ForegroundColor Cyan
    Write-Host "Processed: $($swiftFiles.Count) files" -ForegroundColor White
    Write-Host "Formatted: $formattedCount files" -ForegroundColor Green
    if ($errorCount -gt 0) {
        Write-Host "Errors: $errorCount files" -ForegroundColor Red
    }

    if ($DryRun) {
        Write-Host ""
        Write-Host "💡 Run without -DryRun to apply changes" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🛠️  Swift Formatting Rules Applied:" -ForegroundColor Cyan
Write-Host "  ✓ Normalized line endings" -ForegroundColor White
Write-Host "  ✓ Removed trailing whitespace" -ForegroundColor White
Write-Host "  ✓ Fixed operator spacing" -ForegroundColor White
Write-Host "  ✓ Fixed comma spacing" -ForegroundColor White
Write-Host "  ✓ Fixed colon spacing" -ForegroundColor White
Write-Host "  ✓ Normalized brace spacing" -ForegroundColor White
Write-Host "  ✓ Sorted import statements" -ForegroundColor White
Write-Host "  ✓ Converted to 2-space indentation" -ForegroundColor White

if (-not $success) {
    exit 1
}
