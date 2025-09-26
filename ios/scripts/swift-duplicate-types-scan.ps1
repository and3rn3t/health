#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Swift duplicate types scanner for VitalSense iOS project
.DESCRIPTION
    Scans Swift files for duplicate type definitions that could cause compilation errors
.PARAMETER Root
    Root directory to scan (default: current directory)
.PARAMETER VerboseOutput
    Enable verbose output
#>

param(
    [string]$Root = ".",
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 VitalSense Swift Duplicate Types Scanner" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if (!(Test-Path $Root)) {
    Write-Error "Root directory '$Root' does not exist"
    exit 1
}

Write-Host "📁 Scanning directory: $((Resolve-Path $Root).Path)" -ForegroundColor Yellow

# Find all Swift files
$swiftFiles = Get-ChildItem -Path $Root -Recurse -Filter "*.swift" -File

if ($swiftFiles.Count -eq 0) {
    Write-Host "⚠️  No Swift files found in '$Root'" -ForegroundColor Yellow
    exit 0
}

Write-Host "📄 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green

# Track type definitions
$typeDefinitions = @{}
$duplicates = @()

foreach ($file in $swiftFiles) {
    if ($VerboseOutput) {
        Write-Host "  Scanning: $($file.Name)" -ForegroundColor Gray
    }

    try {
        $content = Get-Content $file.FullName -ErrorAction Stop
        $lineNumber = 0

        foreach ($line in $content) {
            $lineNumber++

            # Match class, struct, enum, protocol definitions
            if ($line -match '^\s*(public\s+|private\s+|internal\s+|fileprivate\s+)?(class|struct|enum|protocol)\s+(\w+)') {
                $visibility = $matches[1]?.Trim()
                $type = $matches[2]
                $name = $matches[3]
                $fullName = "$type $name"

                $definition = @{
                    File = $file.FullName
                    RelativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\', '/')
                    Line = $lineNumber
                    Type = $type
                    Name = $name
                    FullName = $fullName
                    Visibility = $visibility
                    LineContent = $line.Trim()
                }

                if ($typeDefinitions.ContainsKey($fullName)) {
                    # Found duplicate
                    if ($VerboseOutput) {
                        Write-Host "    ⚠️  Duplicate found: $fullName" -ForegroundColor Red
                    }
                    $duplicates += $definition
                    $duplicates += $typeDefinitions[$fullName]
                } else {
                    $typeDefinitions[$fullName] = $definition
                }
            }
        }
    }
    catch {
        Write-Warning "Failed to scan $($file.Name): $($_.Exception.Message)"
    }
}

# Report results
Write-Host "`n📊 Scan Results:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "Total types found: $($typeDefinitions.Count)" -ForegroundColor Green

if ($duplicates.Count -eq 0) {
    Write-Host "✅ No duplicate types found!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $($duplicates.Count / 2) duplicate type(s):" -ForegroundColor Red

    $duplicates | Group-Object FullName | ForEach-Object {
        Write-Host "`n🔴 Duplicate: $($_.Name)" -ForegroundColor Red
        $_.Group | ForEach-Object {
            Write-Host "   📁 $($_.RelativePath):$($_.Line)" -ForegroundColor Yellow
            Write-Host "      $($_.LineContent)" -ForegroundColor Gray
        }
    }

    Write-Host "`n💡 To fix: Remove duplicate type definitions or rename them to avoid conflicts." -ForegroundColor Yellow
    exit 1
}
