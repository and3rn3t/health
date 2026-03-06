# VitalSense terminal banner and profile bootstrap
# Runs with -NoProfile to avoid global pollution, then imports repo profile

$ErrorActionPreference = 'SilentlyContinue'

# Brand the terminal
Write-Host "💙 VitalSense Developer Terminal" -ForegroundColor Cyan
Write-Host "Ready • pwsh $(Get-Host).Version • $(Get-Date -Format 'HH:mm')" -ForegroundColor DarkCyan

# Prefer ANSI in VS Code
if ($env:TERM_PROGRAM -eq 'vscode') {
  try {
    $env:PSStyle_OutputRendering = 'Ansi'
    $PSStyle.OutputRendering = 'Ansi'
  } catch { }
}

# Load the repo profile to bring in functions and task helpers
$repoProfile = Join-Path $PSScriptRoot 'PowerShell-Profile.ps1'
if (-not (Test-Path $repoProfile)) {
  # Fallback to workspace root if script not colocated
  $repoProfile = Join-Path $PSScriptRoot 'PowerShell-Profile.ps1'
}
if (Test-Path $repoProfile) {
  try { . $repoProfile } catch { }
}

# Helpful hint
Write-Host "Tip: type 'Show-DevEnv' or 'dev' to get started" -ForegroundColor DarkGray

$ErrorActionPreference = 'Continue'
