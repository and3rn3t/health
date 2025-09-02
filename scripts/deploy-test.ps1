#!/usr/bin/env pwsh
# Simple deployment verification script

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('development', 'production')]
  [string]$Environment
)

Write-Host "🚀 Testing deployment for $Environment" -ForegroundColor Cyan

# Check build outputs
Write-Host 'Checking build outputs...' -ForegroundColor Yellow
if (Test-Path 'dist/index.html') {
  Write-Host '✅ App build found' -ForegroundColor Green
} else {
  Write-Host '❌ App build missing' -ForegroundColor Red
  exit 1
}

if (Test-Path 'dist-worker/index.js') {
  Write-Host '✅ Worker build found' -ForegroundColor Green
} else {
  Write-Host '❌ Worker build missing' -ForegroundColor Red
  exit 1
}

# Check wrangler config
Write-Host 'Testing Wrangler configuration...' -ForegroundColor Yellow
try {
  $null = npx wrangler deploy --dry-run --env $Environment 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host '✅ Wrangler config valid' -ForegroundColor Green
  } else {
    Write-Host '❌ Wrangler config invalid' -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "❌ Wrangler test failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host '🎯 All checks passed! Ready for deployment' -ForegroundColor Green
