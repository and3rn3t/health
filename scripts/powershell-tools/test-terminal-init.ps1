# Test Terminal Initialization
# This script tests if the terminal initialization is working correctly

Write-Host '🧪 Testing VitalSense Terminal Initialization...' -ForegroundColor Cyan
Write-Host ''

# Test 1: Check if unified profile loader exists
$unifiedProfilePath = Join-Path $PSScriptRoot 'unified-profile-loader.ps1'
if (Test-Path $unifiedProfilePath) {
  Write-Host "✅ Unified profile loader found at: $unifiedProfilePath" -ForegroundColor Green
} else {
  Write-Host "❌ Unified profile loader NOT found at: $unifiedProfilePath" -ForegroundColor Red
}

# Test 2: Check if terminal-init.ps1 exists
$terminalInitPath = Join-Path $PSScriptRoot 'terminal-init.ps1'
if (Test-Path $terminalInitPath) {
  Write-Host "✅ Terminal init script found at: $terminalInitPath" -ForegroundColor Green
} else {
  Write-Host "❌ Terminal init script NOT found at: $terminalInitPath" -ForegroundColor Red
}

# Test 3: Test loading the unified profile
try {
  Write-Host '🔄 Testing unified profile loading...' -ForegroundColor Yellow
  . $unifiedProfilePath -Verbose
  Write-Host '✅ Unified profile loaded successfully' -ForegroundColor Green
} catch {
  Write-Host "❌ Error loading unified profile: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check if aliases are available
Write-Host ''
Write-Host '🔗 Checking aliases:' -ForegroundColor Cyan
@('reload', 'ctx', 'ios', 'root') | ForEach-Object {
  $alias = Get-Alias -Name $_ -ErrorAction SilentlyContinue
  if ($alias) {
    Write-Host "   ✅ $_" -ForegroundColor Green
  } else {
    Write-Host "   ❌ $_" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host '🎯 Test completed!' -ForegroundColor Cyan
