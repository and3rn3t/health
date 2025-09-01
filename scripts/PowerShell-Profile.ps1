# Enhanced PowerShell Profile for VS Code and Copilot Integration
# This profile optimizes the PowerShell experience for development work

# Import utilities if available
$projectUtilities = Join-Path $PWD 'scripts\VSCodeIntegration.psm1'
if (Test-Path $projectUtilities) {
  Import-Module $projectUtilities -Force
}

# Enhanced prompt with git and project info
function prompt {
  $location = Get-Location
  $projectRoot = $null

  # Find project root
  $current = $location
  while ($current -and -not (Test-Path (Join-Path $current 'package.json'))) {
    $current = Split-Path $current -Parent
  }
  if ($current) {
    $projectRoot = Split-Path $current -Leaf
  }

  # Git branch info
  $gitBranch = ''
  try {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($branch) {
      $status = git status --porcelain 2>$null
      $indicator = if ($status) { '*' } else { '' }
      $gitBranch = " ($branch$indicator)"
    }
  } catch {
    # Git not available or not in a repo
  }

  # Build prompt
  $prompt = ''
  if ($projectRoot) {
    $prompt += "[$projectRoot] "
  }

  $prompt += "PS $(Split-Path $location -Leaf)"
  $prompt += $gitBranch
  $prompt += '> '

  return $prompt
}

# Useful aliases for development
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name la -Value 'Get-ChildItem -Force'
Set-Alias -Name grep -Value Select-String
Set-Alias -Name which -Value Get-Command

# Quick navigation functions
function .. { Set-Location .. }
function ... { Set-Location ..\.. }
function .... { Set-Location ..\..\.. }

# Development helper functions
function dev {
  if (Test-Path 'scripts\run-task.ps1') {
    & 'scripts\run-task.ps1' -Task dev @args
  } else {
    Write-Warning 'No task runner found. Run from project root.'
  }
}

function test-app {
  if (Test-Path 'scripts\run-task.ps1') {
    & 'scripts\run-task.ps1' -Task test @args
  } else {
    Write-Warning 'No task runner found. Run from project root.'
  }
}

function build-app {
  if (Test-Path 'scripts\run-task.ps1') {
    & 'scripts\run-task.ps1' -Task build @args
  } else {
    Write-Warning 'No task runner found. Run from project root.'
  }
}

function probe {
  if (Test-Path 'scripts\probe.ps1') {
    & 'scripts\probe.ps1' @args
  } else {
    Write-Warning 'No probe script found. Run from project root.'
  }
}

function Get-Context {
  if (Test-Path 'scripts\get-copilot-context.ps1') {
    & 'scripts\get-copilot-context.ps1' @args
  } else {
    Write-Warning 'No context script found. Run from project root.'
  }
}

# Git helpers
function gs { git status }
function gd { git diff }
function gl { git log --oneline -10 }
function gb { git branch }
function gco { git checkout $args }

# Process management helpers
function Get-Port([int]$Port) {
  Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess |
  ForEach-Object {
    $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    $_ | Add-Member -NotePropertyName ProcessName -NotePropertyValue $process.ProcessName -PassThru
  }
}

function Kill-Port([int]$Port) {
  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    try {
      Stop-Process -Id $conn.OwningProcess -Force
      Write-Host "Killed process $($conn.OwningProcess) using port $Port" -ForegroundColor Green
    } catch {
      Write-Warning "Could not kill process $($conn.OwningProcess): $($_.Exception.Message)"
    }
  }
}

# VS Code integration
function code-here { code . }
function code-workspace {
  if (Test-Path '*.code-workspace') {
    $workspace = Get-ChildItem '*.code-workspace' | Select-Object -First 1
    code $workspace.FullName
  } else {
    code .
  }
}

# Environment info for Copilot
function Show-DevEnv {
  Write-Host '=== Development Environment ===' -ForegroundColor Cyan
  Write-Host "PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor Green
  Write-Host "Platform: $([System.Environment]::OSVersion.Platform)" -ForegroundColor Green
  Write-Host "Location: $(Get-Location)" -ForegroundColor Green

  if (Get-Command git -ErrorAction SilentlyContinue) {
    try {
      $branch = git rev-parse --abbrev-ref HEAD 2>$null
      if ($branch) {
        Write-Host "Git Branch: $branch" -ForegroundColor Green
      }
    } catch {
      Write-Host 'Git: Not in repository' -ForegroundColor Yellow
    }
  }

  # Check for common development servers
  $ports = @(3000, 8787, 8788, 8789, 5173)
  foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
      Write-Host "Port $port: In use" -ForegroundColor Yellow
    }
  }
}

# Welcome message for VS Code
if ($env:TERM_PROGRAM -eq 'vscode') {
  Write-Host 'PowerShell enhanced for VS Code and Copilot' -ForegroundColor Cyan
  Write-Host "Type 'Show-DevEnv' for environment info" -ForegroundColor DarkCyan
  Write-Host 'Available commands: dev, test-app, build-app, probe, Get-Context' -ForegroundColor DarkCyan
}

# PSReadLine configuration for better experience
if (Get-Module -ListAvailable PSReadLine) {
  Import-Module PSReadLine

  Set-PSReadLineOption -PredictionSource History
  Set-PSReadLineOption -PredictionViewStyle ListView
  Set-PSReadLineOption -EditMode Windows
  Set-PSReadLineKeyHandler -Key Tab -Function Complete
  Set-PSReadLineKeyHandler -Key 'Ctrl+d' -Function DeleteChar
  Set-PSReadLineKeyHandler -Key 'Ctrl+w' -Function BackwardDeleteWord
}
