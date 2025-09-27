# Test VS Code Shell Integration
# This script tests if shell integration features are working

Write-Host '🔍 VS Code Shell Integration Test' -ForegroundColor Cyan
Write-Host '==================================' -ForegroundColor Cyan

# Test 1: Check if we're in VS Code
if ($env:TERM_PROGRAM -eq 'vscode') {
  Write-Host '✅ Running in VS Code terminal' -ForegroundColor Green
} else {
  Write-Host '❌ Not running in VS Code' -ForegroundColor Red
}

# Test 2: Check if shell integration is loaded
if (Get-Command __vsc_prompt_cmd_original -ErrorAction SilentlyContinue) {
  Write-Host '✅ VS Code shell integration is active' -ForegroundColor Green
} else {
  Write-Host '⚠️ VS Code shell integration may not be loaded' -ForegroundColor Yellow
}

# Test 3: Check PSReadLine
if (Get-Module PSReadLine) {
  Write-Host '✅ PSReadLine is loaded' -ForegroundColor Green
  $version = (Get-Module PSReadLine).Version
  Write-Host "   Version: $version" -ForegroundColor Gray
} else {
  Write-Host '❌ PSReadLine not loaded' -ForegroundColor Red
}

# Test 4: Check ANSI support
if ($env:PSStyle_OutputRendering -eq 'Ansi') {
  Write-Host '✅ ANSI rendering enabled' -ForegroundColor Green
} else {
  Write-Host '⚠️ ANSI rendering not configured' -ForegroundColor Yellow
}

# Test 5: Test command decorations (this command should show with decorations)
Write-Host '✅ Testing command that should succeed' -ForegroundColor Green

# Test 6: Test command that fails (for error decoration)
try {
  Get-Item 'NonExistentFile.txt' -ErrorAction Stop
} catch {
  Write-Host '✅ Error decoration test (this error is expected)' -ForegroundColor Green
}

Write-Host ''
Write-Host '🎯 Shell Integration Features to Look For:' -ForegroundColor Blue
Write-Host '  • Command decorations (colored dots before commands)' -ForegroundColor Gray
Write-Host "  • Right-click context menu with 'Run in Terminal'" -ForegroundColor Gray
Write-Host '  • Command navigation (Ctrl+Up/Down)' -ForegroundColor Gray
Write-Host '  • Command palette integration' -ForegroundColor Gray
Write-Host ''
Write-Host '✨ Shell integration test completed!' -ForegroundColor Green
