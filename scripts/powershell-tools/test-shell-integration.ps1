# Test VS Code Shell Integration
# This script verifies that shell integration is working properly

Write-Host "`n🔍 VS Code Shell Integration Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if running in VS Code
Write-Host "`n1. Environment Check:" -ForegroundColor Yellow
Write-Host "   TERM_PROGRAM: $env:TERM_PROGRAM"
Write-Host "   VSCODE_SHELL_INTEGRATION: $env:VSCODE_SHELL_INTEGRATION"
Write-Host "   PWD: $PWD"

# Check if code command is available
Write-Host "`n2. VS Code CLI Check:" -ForegroundColor Yellow
$codeCmd = Get-Command code -ErrorAction SilentlyContinue
if ($codeCmd) {
  Write-Host "   ✅ code command found at: $($codeCmd.Source)" -ForegroundColor Green
  
  # Try to locate shell integration
  try {
    $integrationPath = code --locate-shell-integration-path pwsh 2>$null
    if ($integrationPath) {
      Write-Host "   ✅ Shell integration path: $integrationPath" -ForegroundColor Green
      if (Test-Path $integrationPath) {
        Write-Host "   ✅ Shell integration script exists" -ForegroundColor Green
      } else {
        Write-Host "   ❌ Shell integration script not found at path" -ForegroundColor Red
      }
    } else {
      Write-Host "   ⚠️  No shell integration path returned" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "   ❌ Error locating shell integration: $_" -ForegroundColor Red
  }
} else {
  Write-Host "   ❌ code command not found in PATH" -ForegroundColor Red
}

# Check for fallback paths
Write-Host "`n3. Fallback Path Check:" -ForegroundColor Yellow
$fallbackPaths = @(
  "$env:VSCODE_SHELL_INTEGRATION",
  "$env:APPDATA\Code\User\shellIntegration\shell-integration.ps1",
  "$env:LOCALAPPDATA\Programs\Microsoft VS Code\resources\app\out\vs\workbench\contrib\terminal\browser\media\shellIntegration.ps1"
)

foreach ($path in $fallbackPaths) {
  if ($path) {
    if (Test-Path $path) {
      Write-Host "   ✅ Found: $path" -ForegroundColor Green
    } else {
      Write-Host "   ❌ Not found: $path" -ForegroundColor DarkGray
    }
  }
}

# Check PowerShell version and features
Write-Host "`n4. PowerShell Features:" -ForegroundColor Yellow
Write-Host "   Version: $($PSVersionTable.PSVersion)"
Write-Host "   Edition: $($PSVersionTable.PSEdition)"
Write-Host "   PSStyle: $(if ($PSStyle) { '✅ Available' } else { '❌ Not available' })"
Write-Host "   PSStyle.OutputRendering: $(if ($PSStyle) { $PSStyle.OutputRendering } else { 'N/A' })"

# Check if shell integration markers are present
Write-Host "`n5. Shell Integration Status:" -ForegroundColor Yellow
if (Test-Path function:__vsc_prompt_cmd_original) {
  Write-Host "   ✅ Shell integration is LOADED (__vsc_prompt_cmd_original exists)" -ForegroundColor Green
} else {
  Write-Host "   ❌ Shell integration NOT loaded (function not found)" -ForegroundColor Red
}

if (Get-Variable -Name __VSCode* -ErrorAction SilentlyContinue) {
  Write-Host "   ✅ VSCode variables present:" -ForegroundColor Green
  Get-Variable -Name __VSCode* | ForEach-Object {
    Write-Host "      - $($_.Name) = $($_.Value)" -ForegroundColor Gray
  }
} else {
  Write-Host "   ⚠️  No VSCode variables found" -ForegroundColor Yellow
}

# Test a simple command to verify output capture
Write-Host "`n6. Output Capture Test:" -ForegroundColor Yellow
Write-Host "   Running: Write-Output 'Test output'" -ForegroundColor Gray
$testOutput = Write-Output 'Test output'
Write-Host "   Result: $testOutput" -ForegroundColor Gray
Write-Host "   ✅ Basic output working" -ForegroundColor Green

Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Diagnostics complete. " -NoNewline -ForegroundColor Cyan
if (Test-Path function:__vsc_prompt_cmd_original) {
  Write-Host "Shell integration is WORKING ✅" -ForegroundColor Green
} else {
  Write-Host "Shell integration needs attention ⚠️" -ForegroundColor Yellow
  Write-Host "`nTo fix:" -ForegroundColor Cyan
  Write-Host "1. Restart VS Code" -ForegroundColor White
  Write-Host "2. Open a new terminal (Ctrl+Shift+`)" -ForegroundColor White
  Write-Host "3. Ensure you're using 'VitalSense Enhanced' profile" -ForegroundColor White
}
Write-Host ""
