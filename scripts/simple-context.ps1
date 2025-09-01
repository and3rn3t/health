# Simple context gathering script for Copilot
Write-Host '=== Development Environment Context ===' -ForegroundColor Cyan

# Basic environment info
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Green
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Green
Write-Host "Working Directory: $PWD" -ForegroundColor Green
Write-Host "User: $env:USERNAME" -ForegroundColor Green

# Project info
if (Test-Path 'package.json') {
  Write-Host 'Project: Health Monitoring App (found package.json)' -ForegroundColor Green
} else {
  Write-Host 'Project: Unknown (no package.json found)' -ForegroundColor Yellow
}

# Check for running servers
Write-Host "`n=== Server Status ===" -ForegroundColor Cyan
$ports = @(3000, 8787, 8788, 8789, 5173)
foreach ($port in $ports) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "Port ${port}: Server running (HTTP $($response.StatusCode))" -ForegroundColor Green
  } catch {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -ErrorAction SilentlyContinue
    if ($connection) {
      Write-Host "Port ${port}: Service running (no health endpoint)" -ForegroundColor Yellow
    } else {
      Write-Host "Port ${port}: Not in use" -ForegroundColor DarkGray
    }
  }
}

# Git status
Write-Host "`n=== Git Status ===" -ForegroundColor Cyan
try {
  $branch = git rev-parse --abbrev-ref HEAD 2>$null
  $status = git status --porcelain 2>$null
  Write-Host "Branch: $branch" -ForegroundColor Green
  if ($status) {
    Write-Host "Changes: $($status.Count) modified files" -ForegroundColor Yellow
  } else {
    Write-Host 'Changes: Clean working directory' -ForegroundColor Green
  }
} catch {
  Write-Host 'Git: Not available or not in repository' -ForegroundColor Yellow
}

Write-Host "`n=== Context Complete ===" -ForegroundColor Cyan
