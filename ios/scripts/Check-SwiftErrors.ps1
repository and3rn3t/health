#!/usr/bin/env pwsh#!/usr/bin/env pwsh

#Requires -Version 7.0#Requires -Version 7.0



<#<#

.SYNOPSIS.SYNOPSIS

    Swift error checker for VitalSense iOS project    Swift error checker for VitalSense iOS project

.DESCRIPTION.DESCRIPTION

    Checks Swift files for common syntax errors and compilation issues    Checks Swift files for common syntax errors and compilation issues

#>.PARAMETER Root

    Root directory to scan (default: current directory)

$ErrorActionPreference = "Stop".PARAMETER VerboseOutput

    Enable verbose output

Write-Host "🔍 VitalSense Swift Error Checker" -ForegroundColor Cyan#>

Write-Host "==================================" -ForegroundColor Cyan

param(

# Check if we have Swift installed    [string]$Root = ".",

try {    [switch]$VerboseOutput

    $swiftVersion = swift --version 2>$null)

    if ($swiftVersion) {

        Write-Host "✅ Swift found: $($swiftVersion.Split("`n")[0])" -ForegroundColor Green$ErrorActionPreference = "Stop"

    }

} catch {Write-Host "🔍 VitalSense Swift Error Checker" -ForegroundColor Cyan

    Write-Host "⚠️  Swift compiler not in PATH, but continuing with basic checks" -ForegroundColor YellowWrite-Host "==================================" -ForegroundColor Cyan

}

# Check if we have Swift installed

$rootDir = Get-Locationtry {

Write-Host "📁 Scanning directory: $rootDir" -ForegroundColor Yellow    $swiftVersion = swift --version 2>$null

    if ($swiftVersion) {

# Find all Swift files        Write-Host "✅ Swift found: $($swiftVersion.Split("`n")[0])" -ForegroundColor Green

$swiftFiles = Get-ChildItem -Recurse -Filter "*.swift" -File    }

} catch {

if ($swiftFiles.Count -eq 0) {    Write-Host "⚠️  Swift compiler not found in PATH" -ForegroundColor Yellow

    Write-Host "⚠️  No Swift files found" -ForegroundColor Yellow}

    exit 0

}if (!(Test-Path $Root)) {

    Write-Error "Root directory '$Root' does not exist"

Write-Host "📄 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green    exit 1

}

$issues = @()

Write-Host "📁 Scanning directory: $((Resolve-Path $Root).Path)" -ForegroundColor Yellow

foreach ($file in $swiftFiles) {

    try {# Find all Swift files

        $content = Get-Content $file.FullName -ErrorAction Stop$swiftFiles = Get-ChildItem -Path $Root -Recurse -Filter "*.swift" -File

        $lineNumber = 0

        if ($swiftFiles.Count -eq 0) {

        foreach ($line in $content) {    Write-Host "⚠️  No Swift files found in '$Root'" -ForegroundColor Yellow

            $lineNumber++    exit 0

            }

            # Check for invalid characters or encoding issues

            if ($line -match '[^\x00-\x7F]' -and $line -notmatch '[\u0080-\uFFFF]') {Write-Host "📄 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green

                $issues += [PSCustomObject]@{

                    File = $file.Name$issues = @()

                    Line = $lineNumber

                    Type = "Encoding"foreach ($file in $swiftFiles) {

                    Message = "Potential encoding issue detected"    if ($VerboseOutput) {

                    Content = $line.Trim()        Write-Host "  Checking: $($file.Name)" -ForegroundColor Gray

                }    }

            }

        }    try {

    }        $content = Get-Content $file.FullName -ErrorAction Stop

    catch {        $lineNumber = 0

        $issues += [PSCustomObject]@{

            File = $file.Name        foreach ($line in $content) {

            Line = 0            $lineNumber++

            Type = "File Access"

            Message = "Failed to read file: $($_.Exception.Message)"            # Check for common issues

            Content = ""

        }            # Invalid characters or encoding issues

    }            if ($line -match '[^\x00-\x7F]' -and $line -notmatch '[\u0080-\uFFFF]') {

}                $issues += @{

                    File = $file.FullName

# Report results                    Line = $lineNumber

Write-Host "`n📊 Basic Analysis Results:" -ForegroundColor Cyan                    Type = "Encoding"

Write-Host "===========================" -ForegroundColor Cyan                    Message = "Potential encoding issue detected"

                    Content = $line.Trim()

if ($issues.Count -eq 0) {                }

    Write-Host "✅ No basic syntax issues detected!" -ForegroundColor Green

    Write-Host "💡 For comprehensive analysis, build the project in Xcode." -ForegroundColor Yellow            # Incomplete function declarations

    exit 0            if ($line -match '^\s*func\s+\w+\s*\(' -and $line -notmatch '{\s*$' -and $line -notmatch '}\s*$') {

} else {                # Check if next line exists and contains opening brace

    Write-Host "⚠️  Found $($issues.Count) potential issue(s):" -ForegroundColor Yellow                if ($lineNumber -lt $content.Count) {

                        $nextLine = $content[$lineNumber]

    foreach ($issue in $issues) {                    if ($nextLine -notmatch '^\s*{') {

        Write-Host "📁 $($issue.File) - Line $($issue.Line): [$($issue.Type)] $($issue.Message)" -ForegroundColor Red                        $issues += @{

        if ($issue.Content) {                            File = $file.FullName

            Write-Host "   $($issue.Content)" -ForegroundColor Gray                            Line = $lineNumber

        }                            Type = "Syntax"

    }                            Message = "Possible incomplete function declaration"

                                Content = $line.Trim()

    Write-Host "`n💡 Build in Xcode for detailed error messages." -ForegroundColor Yellow                        }

    exit 1                    }

}                }
            }
        }
    }
    catch {
        $issues += @{
            File = $file.FullName
            Line = 0
            Type = "File Access"
            Message = "Failed to read file: $($_.Exception.Message)"
            Content = ""
        }
    }
}
    }
}

# Report results
Write-Host "`n📊 Analysis Results:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "✅ No obvious syntax issues found!" -ForegroundColor Green
    Write-Host "💡 Note: This is a basic check. For comprehensive analysis, build the project in Xcode." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "⚠️  Found $($issues.Count) potential issue(s):" -ForegroundColor Yellow

    $issues | Group-Object File | ForEach-Object {
        Write-Host "`n📁 $($_.Name)" -ForegroundColor Yellow
        $_.Group | ForEach-Object {
            Write-Host "   Line $($_.Line): [$($_.Type)] $($_.Message)" -ForegroundColor Red
            if ($_.Content) {
                Write-Host "      $($_.Content)" -ForegroundColor Gray
            }
        }
    }

    Write-Host "`n💡 Please review these issues and build in Xcode for detailed error messages." -ForegroundColor Yellow
    exit 1
}
