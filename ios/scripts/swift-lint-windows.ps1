#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    SwiftLint runner for VitalSense iOS project
.DESCRIPTION
    Runs SwiftLint on Swift source files
#>

$ErrorActionPreference = "Stop"

Write-Host "🔍 VitalSense SwiftLint Runner" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check if SwiftLint is available
try {
    swiftlint version 2>$null | Out-Null
    $version = swiftlint version
    Write-Host "✅ SwiftLint found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ SwiftLint not found" -ForegroundColor Red
    Write-Host "💡 Install SwiftLint: brew install swiftlint" -ForegroundColor Yellow
    Write-Host "💡 Or download from: https://github.com/realm/SwiftLint" -ForegroundColor Yellow
    exit 1
}

$rootDir = Get-Location
Write-Host "📁 Linting directory: $rootDir" -ForegroundColor Yellow

# Check if .swiftlint.yml exists
$configFile = Join-Path $rootDir ".swiftlint.yml"
if (Test-Path $configFile) {
    Write-Host "📋 Using config: .swiftlint.yml" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .swiftlint.yml found, using default rules" -ForegroundColor Yellow
}

# Run SwiftLint
Write-Host "🔍 Running SwiftLint..." -ForegroundColor Yellow

$result = swiftlint lint --reporter emoji
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "✅ SwiftLint passed with no violations!" -ForegroundColor Green
} else {
    Write-Host "⚠️  SwiftLint found violations (exit code: $exitCode)" -ForegroundColor Yellow
    Write-Host "💡 Fix violations manually or run: swiftlint --fix" -ForegroundColor Cyan
}

exit $exitCode
