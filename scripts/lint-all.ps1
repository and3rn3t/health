#!/usr/bin/env pwsh
# Unified linting script for both TypeScript/React and Swift code
# Maintains consistency across all IDE configurations

param(
    [switch]$Fix,
    [switch]$Strict,
    [switch]$SwiftOnly,
    [switch]$TSOnly,
    [string]$Path = "."
)

Write-Host "🔍 Running unified linting across project..." -ForegroundColor Cyan

$hasErrors = $false

# TypeScript/React linting
if (-not $SwiftOnly) {
    Write-Host "`n📝 Checking TypeScript/React code..." -ForegroundColor Yellow

    if ($Fix) {
        Write-Host "🔧 Auto-fixing ESLint issues..." -ForegroundColor Green
        npm run lint -- --fix
        if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
    } else {
        npm run lint
        if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
    }

    Write-Host "🎨 Checking Prettier formatting..." -ForegroundColor Yellow
    npx prettier --check "src/**/*.{ts,tsx,js,jsx}"
    if ($LASTEXITCODE -ne 0) {
        $hasErrors = $true
        if ($Fix) {
            Write-Host "🔧 Auto-fixing Prettier issues..." -ForegroundColor Green
            npx prettier --write "src/**/*.{ts,tsx,js,jsx}"
        }
    }
}

# Swift linting
if (-not $TSOnly -and (Test-Path "ios")) {
    Write-Host "`n🍎 Checking Swift code..." -ForegroundColor Yellow

    Push-Location "ios"

    if (Get-Command swiftlint -ErrorAction SilentlyContinue) {
        if ($Fix) {
            Write-Host "🔧 Auto-fixing SwiftLint issues..." -ForegroundColor Green
            swiftlint --fix
        }

        if ($Strict) {
            swiftlint lint --strict
        } else {
            swiftlint lint
        }

        if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
    } else {
        Write-Host "⚠️  SwiftLint not found. Install via: brew install swiftlint" -ForegroundColor Yellow
    }

    Pop-Location
}

# Summary
Write-Host "`n" -NoNewline
if ($hasErrors) {
    Write-Host "❌ Linting completed with issues" -ForegroundColor Red
    Write-Host "💡 Run with -Fix to automatically fix issues where possible" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ All linting checks passed!" -ForegroundColor Green
    exit 0
}
