# PowerShell Profile for Swift Development on Windows
# Sourced by: https://github.com/realm/SwiftLint + Docker Desktop
# Purpose: Provide convenient aliases and functions for Swift iOS development

# Set execution policy for scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Import Swift Windows Toolkit functions
$ToolkitPath = Join-Path $PSScriptRoot "swift-windows-toolkit.ps1"

# Verify toolkit exists
if (-not (Test-Path $ToolkitPath)) {
    Write-Host "❌ Swift Windows Toolkit not found at: $ToolkitPath" -ForegroundColor Red
    Write-Host "Please ensure swift-windows-toolkit.ps1 is in the scripts directory" -ForegroundColor Yellow
    return
}

# Swift Development Functions with proper path resolution
function Swift-Lint {
    param(
        [string[]]$lintArgs = @()
    )

    if ($lintArgs.Count -eq 0) {
        & $ToolkitPath -Action lint -UseDocker
    }
    else {
        & $ToolkitPath -Action lint -UseDocker @lintArgs
    }
}

function Swift-Format {
    param(
        [string[]]$formatArgs = @()
    )

    if ($formatArgs.Count -eq 0) {
        & $ToolkitPath -Action format -UseDocker
    }
    else {
        & $ToolkitPath -Action format -UseDocker @formatArgs
    }
}

function Swift-Build {
    param(
        [string[]]$buildArgs = @()
    )

    if ($buildArgs.Count -eq 0) {
        & $ToolkitPath -Action build -UseDocker
    }
    else {
        & $ToolkitPath -Action build -UseDocker @buildArgs
    }
}

function Swift-All {
    param(
        [string[]]$allArgs = @()
    )

    if ($allArgs.Count -eq 0) {
        & $ToolkitPath -Action all -UseDocker
    }
    else {
        & $ToolkitPath -Action all -UseDocker @allArgs
    }
}

function Swift-Doctor {
    param(
        [string[]]$doctorArgs = @()
    )

    if ($doctorArgs.Count -eq 0) {
        & $ToolkitPath -Action doctor
    }
    else {
        & $ToolkitPath -Action doctor @doctorArgs
    }
}

function Swift-Setup {
    param(
        [string[]]$setupArgs = @()
    )

    if ($setupArgs.Count -eq 0) {
        & $ToolkitPath -Action setup
    }
    else {
        & $ToolkitPath -Action setup @setupArgs
    }
}

# Convenient aliases for rapid development
Set-Alias -Name sl -Value Swift-Lint
Set-Alias -Name sf -Value Swift-Format
Set-Alias -Name sb -Value Swift-Build
Set-Alias -Name sa -Value Swift-All
Set-Alias -Name sd -Value Swift-Doctor
Set-Alias -Name ss -Value Swift-Setup

# Productivity functions
function Get-SwiftProjectStatus {
    Write-Host "🔍 Swift Project Status Check" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan

    # Check Docker
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerStatus = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker Desktop: Running" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Docker Desktop: Not running" -ForegroundColor Red
        }
    }
    else {
        Write-Host "❌ Docker: Not installed" -ForegroundColor Red
    }

    # Count Swift files
    $swiftFiles = Get-ChildItem -Path "." -Recurse -Filter "*.swift" | Measure-Object
    Write-Host "📄 Swift files detected: $($swiftFiles.Count)" -ForegroundColor Blue

    # Check for VitalSense branding
    $brandingFiles = Get-ChildItem -Path "." -Recurse -Filter "*.swift" | Select-String -Pattern "VitalSense" | Select-Object -First 5
    if ($brandingFiles) {
        Write-Host "✅ VitalSense branding detected in Swift files" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  VitalSense branding not found in Swift files" -ForegroundColor Yellow
    }

    Write-Host "`n🎯 Use aliases: sl (lint), sf (format), sb (build), sa (all), sd (doctor), ss (setup)" -ForegroundColor Magenta
}

# iOS 26 Feature Detection
function Get-iOS26Features {
    Write-Host "🍎 iOS 26 Feature Detection" -ForegroundColor Cyan
    Write-Host "===========================" -ForegroundColor Cyan

    $features = @(
        @{ Name = "Variable Draw"; Pattern = "variableDraw|VariableDraw|variable.*draw" },
        @{ Name = "Liquid Glass"; Pattern = "liquidGlass|LiquidGlass|liquid.*glass" },
        @{ Name = "Magic Replace"; Pattern = "magicReplace|MagicReplace|magic.*replace" },
        @{ Name = "SF Symbols 7"; Pattern = "sfSymbols.*7|SFSymbols.*7|SF7|SFSymbols7Integration" },
        @{ Name = "Auto Gradients"; Pattern = "autoGradient|AutoGradient|auto.*gradient" }
    )

    foreach ($feature in $features) {
        $matches = Get-ChildItem -Path "." -Recurse -Filter "*.swift" | Select-String -Pattern $feature.Pattern
        if ($matches) {
            Write-Host "✅ $($feature.Name): Found in $($matches.Count) files" -ForegroundColor Green
        }
        else {
            Write-Host "❌ $($feature.Name): Not implemented" -ForegroundColor Red
        }
    }
}

# Create convenient aliases for Swift development (with error handling)
try { Set-Alias -Name "sl" -Value "Swift-Lint" -Scope Global -Force -Description "Swift Lint via Docker" } catch { Write-Warning "Could not create alias 'sl'" }
try { Set-Alias -Name "sf" -Value "Swift-Format" -Scope Global -Force -Description "Swift Format via Docker" } catch { Write-Warning "Could not create alias 'sf'" }
try { Set-Alias -Name "sb" -Value "Swift-Build" -Scope Global -Force -Description "Swift Build project" } catch { Write-Warning "Could not create alias 'sb'" }
try { Set-Alias -Name "sa" -Value "Swift-All" -Scope Global -Force -Description "Swift All (lint + format + build)" } catch { Write-Warning "Could not create alias 'sa'" }
try { Set-Alias -Name "sd" -Value "Swift-Doctor" -Scope Global -Force -Description "Swift Doctor diagnostics" } catch { Write-Warning "Could not create alias 'sd'" }
try { Set-Alias -Name "ss" -Value "Swift-Setup" -Scope Global -Force -Description "Swift Setup dependencies" } catch { Write-Warning "Could not create alias 'ss'" }

# Welcome message
Write-Host "`n🚀 Swift Development Profile Loaded!" -ForegroundColor Green
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  sl  - Swift Lint (SwiftLint via Docker)" -ForegroundColor White
Write-Host "  sf  - Swift Format (swift-format via Docker)" -ForegroundColor White
Write-Host "  sb  - Swift Build (project build)" -ForegroundColor White
Write-Host "  sa  - Swift All (lint + format + build)" -ForegroundColor White
Write-Host "  sd  - Swift Doctor (environment diagnostics)" -ForegroundColor White
Write-Host "  ss  - Swift Setup (install dependencies)" -ForegroundColor White
Write-Host "  Get-SwiftProjectStatus - Project status overview" -ForegroundColor White
Write-Host "  Get-iOS26Features - Detect iOS 26 enhancements" -ForegroundColor White
Write-Host ""
