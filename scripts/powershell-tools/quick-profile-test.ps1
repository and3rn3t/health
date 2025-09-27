# Quick Profile Test - Non-blocking version
# Tests the enhanced profile loading without hanging

param(
  [switch]$Verbose
)

Write-Host '🧪 Quick Enhanced Profile Test' -ForegroundColor Cyan
Write-Host '==============================' -ForegroundColor Cyan

# Test basic function availability
$functions = @('dev', 'probe', 'ctx', 'root', 'ios', 'reload')
$aliases = @('sa', 'sl', 'sf', 'sb', 'sd', 'ss')

Write-Host '📋 Testing Core Functions:' -ForegroundColor Blue
foreach ($func in $functions) {
  if (Get-Command $func -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ $func" -ForegroundColor Green
  } else {
    Write-Host "  ❌ $func" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '🍎 Testing Swift Aliases:' -ForegroundColor Blue
foreach ($alias in $aliases) {
  if (Get-Command $alias -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ $alias" -ForegroundColor Green
  } else {
    Write-Host "  ❌ $alias" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '🔧 Testing Swift Integration Status:' -ForegroundColor Blue
if ($global:SwiftIntegrationLoaded) {
  Write-Host '  ✅ Swift integration loaded' -ForegroundColor Green
} else {
  Write-Host '  ❌ Swift integration not loaded' -ForegroundColor Red
}

Write-Host ''
Write-Host '✨ Test completed!' -ForegroundColor Green
