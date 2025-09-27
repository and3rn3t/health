#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Comprehensive Swift development toolkit for Windows
.DESCRIPTION
    Unified toolkit for Swift development on Windows including linting, formatting,
    building, and testing with Docker containerization support
.PARAMETER Action
    The action to perform: lint, format, build, test, setup, doctor
.PARAMETER Fix
    Automatically fix issues where possible
.PARAMETER Verbose
    Enable verbose output
.PARAMETER DryRun
    Preview changes without applying them
.PARAMETER UseDocker
    Use Docker containers for Swift tooling (recommended for Windows)
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("lint", "format", "build", "test", "setup", "doctor", "all")]
    [string]$Action,

    [switch]$Fix,
    [switch]$VerboseOutputOutput,
    [switch]$DryRun,
    [switch]$UseDocker = $true
)$ErrorActionPreference = "Stop"

# Configuration
$Config = @{
    DockerImage      = "ghcr.io/realm/swiftlint:latest"
    SwiftFormatImage = "swift:latest"
    ProjectRoot      = Get-Location
    SwiftPaths       = @(
        "HealthKitBridge",
        "VitalSense",
        "VitalSenseWidgets",
        "VitalSenseWatch Watch App"
    )
    ExcludePaths     = @(
        "build",
        "*Tests*",
        "Pods",
        ".build",
        "DerivedData"
    )
}

# Helper Functions
function Write-ToolkitHeader {
    param([string]$Title)
    Write-Host "`n🚀 VitalSense Swift Windows Toolkit" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "Action: $Title" -ForegroundColor Yellow
    Write-Host "Docker: $(if ($UseDocker) { 'Enabled ✅' } else { 'Disabled ❌' })" -ForegroundColor $(if ($UseDocker) { 'Green' } else { 'Red' })
    Write-Host "Verbose: $(if ($VerboseOutputOutput) { 'Enabled ✅' } else { 'Disabled ❌' })" -ForegroundColor $(if ($VerboseOutputOutput) { 'Green' } else { 'Red' })
    Write-Host ""
}

function Test-DockerAvailable {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-SwiftLintNative {
    try {
        swiftlint version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Get-SwiftFiles {
    $allFiles = @()
    foreach ($path in $Config.SwiftPaths) {
        $fullPath = Join-Path $Config.ProjectRoot $path
        if (Test-Path $fullPath) {
            $files = Get-ChildItem -Path $fullPath -Recurse -Filter "*.swift" -File
            $allFiles += $files
        }
    }

    # Filter out excluded paths
    $filteredFiles = $allFiles | Where-Object {
        $filePath = $_.FullName
        $shouldExclude = $false
        foreach ($excludePath in $Config.ExcludePaths) {
            if ($filePath -like "*$excludePath*") {
                $shouldExclude = $true
                break
            }
        }
        return -not $shouldExclude
    }

    return $filteredFiles
}

function Invoke-SwiftLintDocker {
    param(
        [string[]]$Files,
        [switch]$Fix
    )

    Write-Host "🔍 Running SwiftLint via Docker..." -ForegroundColor Yellow

    $mountPath = $Config.ProjectRoot -replace '\\', '/'
    $fixArg = if ($Fix) { "--fix" } else { "" }

    $dockerCmd = @(
        "run", "--rm",
        "-v", "${mountPath}:/workspace",
        $Config.DockerImage,
        "swiftlint", "/workspace"
    )

    if ($Fix) {
        $dockerCmd += "--fix"
    }

    if ($VerboseOutput) {
        $dockerCmd += "--verbose"
    }

    try {
        & docker @dockerCmd
        return $LASTEXITCODE
    }
    catch {
        Write-Host "❌ Docker SwiftLint failed: $_" -ForegroundColor Red
        return 1
    }
}

function Invoke-SwiftLintNative {
    param(
        [string[]]$Files,
        [switch]$Fix
    )

    Write-Host "🔍 Running SwiftLint natively..." -ForegroundColor Yellow

    $args = @("lint")
    if ($Fix) { $args += "--fix" }
    if ($VerboseOutput) { $args += "--verbose" }

    try {
        & swiftlint @args
        return $LASTEXITCODE
    }
    catch {
        Write-Host "❌ Native SwiftLint failed: $_" -ForegroundColor Red
        return 1
    }
}

function Invoke-SwiftFormat {
    param(
        [string[]]$Files,
        [switch]$Fix
    )

    Write-Host "🎨 Running Swift Format..." -ForegroundColor Yellow

    if ($UseDocker) {
        $mountPath = $Config.ProjectRoot -replace '\\', '/'

        foreach ($file in $Files) {
            $relativePath = $file -replace [regex]::Escape($Config.ProjectRoot), ""
            $relativePath = $relativePath -replace '\\', '/' -replace '^/', ""

            $formatArgs = @(
                "run", "--rm",
                "-v", "${mountPath}:/workspace",
                $Config.SwiftFormatImage,
                "swift-format", "format"
            )

            # Use --in-place for actual formatting, no --mode parameter needed
            if ($Fix) {
                $formatArgs += "--in-place"
            }

            $formatArgs += "/workspace/$relativePath"

            if ($VerboseOutput) {
                Write-Host "Formatting: $relativePath" -ForegroundColor Gray
            }

            try {
                & docker @formatArgs
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Formatted: $relativePath" -ForegroundColor Green
                }
                else {
                    Write-Host "⚠️  Format issues in: $relativePath" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "❌ Format failed for: $relativePath - $_" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "⚠️  Native Swift format not implemented yet" -ForegroundColor Yellow
        Write-Host "💡 Use --UseDocker for format support" -ForegroundColor Cyan
    }
}

function Invoke-SwiftBuild {
    Write-Host "🔨 Building Swift project..." -ForegroundColor Yellow

    if ($UseDocker) {
        $mountPath = $Config.ProjectRoot -replace '\\', '/'

        $buildArgs = @(
            "run", "--rm",
            "-v", "${mountPath}:/workspace",
            "-w", "/workspace",
            $Config.SwiftFormatImage,
            "swift", "build"
        )

        if ($VerboseOutput) {
            $buildArgs += "--verbose"
        }

        try {
            & docker @buildArgs
            return $LASTEXITCODE
        }
        catch {
            Write-Host "❌ Docker Swift build failed: $_" -ForegroundColor Red
            return 1
        }
    }
    else {
        Write-Host "⚠️  Native Swift build requires Xcode on macOS" -ForegroundColor Yellow
        Write-Host "💡 Use --UseDocker for cross-platform build support" -ForegroundColor Cyan
        return 0
    }
}

function Invoke-Setup {
    Write-Host "⚙️  Setting up Swift development environment..." -ForegroundColor Yellow

    # Check Docker
    if (-not (Test-DockerAvailable)) {
        Write-Host "❌ Docker not found" -ForegroundColor Red
        Write-Host "💡 Install Docker Desktop: https://docker.com/products/docker-desktop" -ForegroundColor Cyan
        return 1
    }
    else {
        Write-Host "✅ Docker available" -ForegroundColor Green
    }

    # Pull Docker images
    Write-Host "📦 Pulling SwiftLint Docker image..." -ForegroundColor Yellow
    try {
        docker pull $Config.DockerImage
        Write-Host "✅ SwiftLint image ready" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to pull SwiftLint image" -ForegroundColor Red
    }

    Write-Host "📦 Pulling Swift Docker image..." -ForegroundColor Yellow
    try {
        docker pull $Config.SwiftFormatImage
        Write-Host "✅ Swift image ready" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to pull Swift image" -ForegroundColor Red
    }

    # Check native tools
    if (Test-SwiftLintNative) {
        Write-Host "✅ Native SwiftLint available" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Native SwiftLint not found (Docker will be used)" -ForegroundColor Yellow
    }

    Write-Host "✅ Setup complete!" -ForegroundColor Green
    return 0
}

function Invoke-Doctor {
    Write-Host "🩺 Running Swift development environment diagnostics..." -ForegroundColor Yellow

    $issues = 0

    # Check Docker
    if (Test-DockerAvailable) {
        Write-Host "✅ Docker: Available" -ForegroundColor Green

        # Check images
        try {
            docker image inspect $Config.DockerImage | Out-Null
            Write-Host "✅ SwiftLint Image: Available" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  SwiftLint Image: Not found" -ForegroundColor Yellow
            Write-Host "   Run: docker pull $($Config.DockerImage)" -ForegroundColor Gray
            $issues++
        }

        try {
            docker image inspect $Config.SwiftFormatImage | Out-Null
            Write-Host "✅ Swift Image: Available" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Swift Image: Not found" -ForegroundColor Yellow
            Write-Host "   Run: docker pull $($Config.SwiftFormatImage)" -ForegroundColor Gray
            $issues++
        }
    }
    else {
        Write-Host "❌ Docker: Not available" -ForegroundColor Red
        Write-Host "   Install Docker Desktop from https://docker.com" -ForegroundColor Gray
        $issues++
    }

    # Check native tools
    if (Test-SwiftLintNative) {
        Write-Host "✅ Native SwiftLint: Available" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Native SwiftLint: Not found" -ForegroundColor Yellow
        Write-Host "   Install: brew install swiftlint (or use Docker)" -ForegroundColor Gray
    }

    # Check project structure
    $swiftFiles = Get-SwiftFiles
    Write-Host "📁 Swift Files: $($swiftFiles.Count) found" -ForegroundColor $(if ($swiftFiles.Count -gt 0) { 'Green' } else { 'Red' })

    if ($swiftFiles.Count -eq 0) {
        Write-Host "   No Swift files found in expected paths" -ForegroundColor Gray
        $issues++
    }

    # Check configuration
    $configPath = Join-Path $Config.ProjectRoot ".swiftlint.yml"
    if (Test-Path $configPath) {
        Write-Host "✅ SwiftLint Config: Found" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  SwiftLint Config: Not found" -ForegroundColor Yellow
        Write-Host "   Create .swiftlint.yml for custom rules" -ForegroundColor Gray
    }

    Write-Host ""
    if ($issues -eq 0) {
        Write-Host "🎉 All checks passed! Swift development environment is ready." -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Found $issues issue$(if ($issues -gt 1) { 's' }). See recommendations above." -ForegroundColor Yellow
    }

    return $issues
}

# Main execution
switch ($Action) {
    "setup" {
        Write-ToolkitHeader "Environment Setup"
        $exitCode = Invoke-Setup
    }

    "doctor" {
        Write-ToolkitHeader "Environment Diagnostics"
        $exitCode = Invoke-Doctor
    }

    "lint" {
        Write-ToolkitHeader "Swift Linting"
        $swiftFiles = Get-SwiftFiles

        if ($swiftFiles.Count -eq 0) {
            Write-Host "❌ No Swift files found" -ForegroundColor Red
            $exitCode = 1
        }
        else {
            Write-Host "📁 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green

            if ($UseDocker -and (Test-DockerAvailable)) {
                $exitCode = Invoke-SwiftLintDocker -Files $swiftFiles.FullName -Fix:$Fix
            }
            elseif (Test-SwiftLintNative) {
                $exitCode = Invoke-SwiftLintNative -Files $swiftFiles.FullName -Fix:$Fix
            }
            else {
                Write-Host "❌ No SwiftLint available (native or Docker)" -ForegroundColor Red
                Write-Host "💡 Run with --Action setup to configure Docker" -ForegroundColor Cyan
                $exitCode = 1
            }
        }
    }

    "format" {
        Write-ToolkitHeader "Swift Formatting"
        $swiftFiles = Get-SwiftFiles

        if ($swiftFiles.Count -eq 0) {
            Write-Host "❌ No Swift files found" -ForegroundColor Red
            $exitCode = 1
        }
        else {
            Write-Host "📁 Found $($swiftFiles.Count) Swift files" -ForegroundColor Green
            Invoke-SwiftFormat -Files $swiftFiles.FullName -Fix:$Fix
            $exitCode = 0
        }
    }

    "build" {
        Write-ToolkitHeader "Swift Build"
        $exitCode = Invoke-SwiftBuild
    }

    "test" {
        Write-ToolkitHeader "Swift Testing"
        Write-Host "🧪 Swift testing not implemented yet" -ForegroundColor Yellow
        $exitCode = 0
    }

    "all" {
        Write-ToolkitHeader "Complete Swift Workflow"

        Write-Host "🔍 Step 1: Linting..." -ForegroundColor Cyan
        $swiftFiles = Get-SwiftFiles
        if ($UseDocker -and (Test-DockerAvailable)) {
            $lintResult = Invoke-SwiftLintDocker -Files $swiftFiles.FullName -Fix:$Fix
        }
        elseif (Test-SwiftLintNative) {
            $lintResult = Invoke-SwiftLintNative -Files $swiftFiles.FullName -Fix:$Fix
        }
        else {
            $lintResult = 1
        }

        Write-Host "🎨 Step 2: Formatting..." -ForegroundColor Cyan
        Invoke-SwiftFormat -Files $swiftFiles.FullName -Fix:$Fix

        Write-Host "🔨 Step 3: Building..." -ForegroundColor Cyan
        $buildResult = Invoke-SwiftBuild

        $exitCode = [Math]::Max($lintResult, $buildResult)
    }
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Swift toolkit completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "❌ Swift toolkit completed with errors (exit code: $exitCode)" -ForegroundColor Red
}

exit $exitCode
