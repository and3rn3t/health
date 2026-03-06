#!/usr/bin/env pwsh
# 🪝 Git Hooks Setup Script

Write-Host "🪝 Setting up Git hooks..." -ForegroundColor Cyan

$hooksPath = ".git/hooks"

# Ensure hooks directory exists
if (-not (Test-Path $hooksPath)) {
    New-Item -ItemType Directory -Path $hooksPath -Force | Out-Null
}

# Make pre-commit hook executable (if on Unix-like system)
if ($IsLinux -or $IsMacOS) {
    chmod +x "$hooksPath/pre-commit"
    Write-Host "✅ Made pre-commit hook executable" -ForegroundColor Green
}

# Test the pre-commit hook
Write-Host "🧪 Testing pre-commit hook..." -ForegroundColor Yellow
try {
    if (Test-Path "$hooksPath/pre-commit") {
        Write-Host "✅ Pre-commit hook file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Pre-commit hook file missing" -ForegroundColor Red
        exit 1
    }

    if (Test-Path "$hooksPath/pre-commit.ps1") {
        Write-Host "✅ PowerShell hook script exists" -ForegroundColor Green
    } else {
        Write-Host "❌ PowerShell hook script missing" -ForegroundColor Red
        exit 1
    }

    # Test PowerShell execution
    $testResult = & "$hooksPath/pre-commit.ps1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pre-commit hook test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pre-commit hook test had issues (may be normal if no files staged)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Error testing pre-commit hook: $($_.Exception.Message)" -ForegroundColor Red
}

# Configure Git to use hooks
try {
    git config core.hooksPath ".git/hooks"
    Write-Host "✅ Git hooks path configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not configure Git hooks path" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Git hooks setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next time you commit, the hook will:" -ForegroundColor White
Write-Host "  • Run Swift linting for iOS files" -ForegroundColor Gray
Write-Host "  • Run TypeScript linting for TS files" -ForegroundColor Gray
Write-Host "  • Check service status" -ForegroundColor Gray
Write-Host ""
Write-Host "To test manually: git commit -m 'test'" -ForegroundColor Yellow
