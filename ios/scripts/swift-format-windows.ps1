#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Swift formatting checker for VitalSense iOS project
.DESCRIPTION
    Checks Swift code formatting using swift-format tool
.PARAMETER DryRun
    Only check formatting without making changes
#>

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "🎨 VitalSense Swift Format Checker" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Check if swift-format is available
$formatTool = $null
try {
    swift-format --version 2>$null | Out-Null
    $formatTool = "swift-format"
    Write-Host "✅ swift-format found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  swift-format not found, checking alternatives..." -ForegroundColor Yellow

    # Check for swiftformat
    try {
        swiftformat --version 2>$null | Out-Null
        $formatTool = "swiftformat"
        Write-Host "✅ swiftformat found as alternative" -ForegroundColor Green
    } catch {
        Write-Host "❌ No Swift formatting tool found" -ForegroundColor Red
        Write-Host "💡 Install swift-format: https://github.com/apple/swift-format" -ForegroundColor Yellow
        Write-Host "💡 Or install swiftformat: brew install swiftformat" -ForegroundColor Yellow
        exit 1
    }
}

$rootDir = Get-Location
Write-Host "📁 Formatting directory: $rootDir" -ForegroundColor Yellow

# Find all Swift files
$swiftFiles = Get-ChildItem -Recurse -Filter "*.swift" -File

if ($swiftFiles.Count -eq 0) {
    Write-Host "⚠️  No Swift files found" -ForegroundColor Yellow
    exit 0
}

Write-Host "📄 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green

$issues = 0

if ($DryRun) {
    Write-Host "🔍 Checking formatting (dry run)..." -ForegroundColor Yellow

    foreach ($file in $swiftFiles) {
        if ($formatTool -eq "swift-format") {
            $result = swift-format --mode diff $file.FullName 2>$null
            if ($result) {
                $issues++
                Write-Host "📄 $($file.Name) needs formatting" -ForegroundColor Yellow
            }
        } elseif ($formatTool -eq "swiftformat") {
            $result = swiftformat --dryrun --quiet $file.FullName 2>$null
            if ($LASTEXITCODE -ne 0) {
                $issues++
                Write-Host "📄 $($file.Name) needs formatting" -ForegroundColor Yellow
            }
        }
    }

    if ($issues -eq 0) {
        Write-Host "✅ All files are properly formatted!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $issues file(s) need formatting" -ForegroundColor Yellow
        Write-Host "💡 Run without -DryRun to apply formatting" -ForegroundColor Cyan
    }
} else {
    Write-Host "🎨 Applying formatting..." -ForegroundColor Yellow

    foreach ($file in $swiftFiles) {
        if ($formatTool -eq "swift-format") {
            swift-format --in-place $file.FullName
        } elseif ($formatTool -eq "swiftformat") {
            swiftformat $file.FullName
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Formatted: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to format: $($file.Name)" -ForegroundColor Red
            $issues++
        }
    }

    if ($issues -eq 0) {
        Write-Host "🎉 All files formatted successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $issues file(s) had formatting issues" -ForegroundColor Yellow
    }
}

exit $issues
