# VS Code Workspace Profile Setup for VitalSense
# This script configures VS Code with optimal settings for VitalSense development
# Created: September 27, 2025

param(
  [switch]$InstallExtensions,
  [switch]$ConfigureSettings,
  [switch]$SetupTasks,
  [switch]$All,
  [switch]$Force,
  [switch]$Verbose
)

if ($All) {
  $InstallExtensions = $true
  $ConfigureSettings = $true
  $SetupTasks = $true
}

$WorkspaceRoot = $PWD

Write-Host '🚀 VitalSense VS Code Workspace Setup' -ForegroundColor Cyan
Write-Host '====================================' -ForegroundColor Cyan
Write-Host ''

# Check if VS Code is installed
if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "❌ VS Code 'code' command not found in PATH" -ForegroundColor Red
  Write-Host "   Please install VS Code and ensure 'code' is in your PATH" -ForegroundColor Yellow
  exit 1
}

# Recommended extensions for VitalSense development
$RecommendedExtensions = @(
  @{ Id = 'ms-vscode.powershell'; Name = 'PowerShell'; Description = 'PowerShell language support' },
  @{ Id = 'github.copilot'; Name = 'GitHub Copilot'; Description = 'AI-powered code completion' },
  @{ Id = 'github.copilot-chat'; Name = 'GitHub Copilot Chat'; Description = 'AI chat assistant' },
  @{ Id = 'cloudflare.vscode-cloudflare-workers'; Name = 'Cloudflare Workers'; Description = 'Cloudflare Workers development' },
  @{ Id = 'ms-vscode.vscode-typescript-next'; Name = 'TypeScript Next'; Description = 'Latest TypeScript features' },
  @{ Id = 'sswg.swift-lang'; Name = 'Swift'; Description = 'Swift language support' },
  @{ Id = 'esbenp.prettier-vscode'; Name = 'Prettier'; Description = 'Code formatter' },
  @{ Id = 'bradlc.vscode-tailwindcss'; Name = 'Tailwind CSS'; Description = 'Tailwind CSS IntelliSense' },
  @{ Id = 'ms-vscode.vscode-yaml'; Name = 'YAML'; Description = 'YAML language support' },
  @{ Id = 'tamasfe.even-better-toml'; Name = 'Better TOML'; Description = 'TOML language support' },
  @{ Id = 'redhat.vscode-xml'; Name = 'XML'; Description = 'XML language support' },
  @{ Id = 'formulahendry.auto-rename-tag'; Name = 'Auto Rename Tag'; Description = 'Automatically rename paired HTML/XML tags' },
  @{ Id = 'streetsidesoftware.code-spell-checker'; Name = 'Code Spell Checker'; Description = 'Spelling checker for source code' }
)

if ($InstallExtensions) {
  Write-Host '📦 Installing VS Code Extensions...' -ForegroundColor Blue
  Write-Host ''

  foreach ($extension in $RecommendedExtensions) {
    try {
      $installed = code --list-extensions | Where-Object { $_ -eq $extension.Id }
      if ($installed -and -not $Force) {
        Write-Host "✅ $($extension.Name) - Already installed" -ForegroundColor Green
      } else {
        Write-Host "⏳ Installing $($extension.Name)..." -ForegroundColor Yellow
        $result = code --install-extension $extension.Id --force
        if ($LASTEXITCODE -eq 0) {
          Write-Host "✅ $($extension.Name) - Installed successfully" -ForegroundColor Green
        } else {
          Write-Host "❌ $($extension.Name) - Installation failed" -ForegroundColor Red
        }
      }
    } catch {
      Write-Host "❌ $($extension.Name) - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
  Write-Host ''
}

if ($ConfigureSettings) {
  Write-Host '⚙️ Configuring VS Code Settings...' -ForegroundColor Blue
  Write-Host ''

  # Verify workspace file exists
  $workspaceFile = Join-Path $WorkspaceRoot 'health.code-workspace'
  if (Test-Path $workspaceFile) {
    Write-Host '✅ Workspace file found: health.code-workspace' -ForegroundColor Green
  } else {
    Write-Host '❌ Workspace file not found: health.code-workspace' -ForegroundColor Red
    Write-Host '   Please run this script from the VitalSense project root' -ForegroundColor Yellow
  }

  # Verify enhanced profile exists
  $profileFile = Join-Path $WorkspaceRoot 'scripts\enhanced-vitalsense-profile.ps1'
  if (Test-Path $profileFile) {
    Write-Host '✅ Enhanced VitalSense profile found' -ForegroundColor Green
  } else {
    Write-Host '❌ Enhanced VitalSense profile not found' -ForegroundColor Red
    Write-Host "   Profile should be at: $profileFile" -ForegroundColor Yellow
  }

  # Check VS Code settings
  $vscodeSettingsFile = Join-Path $WorkspaceRoot '.vscode\settings.json'
  if (Test-Path $vscodeSettingsFile) {
    Write-Host '✅ VS Code settings file found' -ForegroundColor Green

    # Check if enhanced profile is configured
    $settingsContent = Get-Content $vscodeSettingsFile -Raw
    if ($settingsContent -like '*enhanced-vitalsense-profile*') {
      Write-Host '✅ Enhanced VitalSense profile configured in settings' -ForegroundColor Green
    } else {
      Write-Host '⚠️  Enhanced VitalSense profile not configured in settings' -ForegroundColor Yellow
    }
  } else {
    Write-Host '❌ VS Code settings file not found' -ForegroundColor Red
  }

  Write-Host ''
}

if ($SetupTasks) {
  Write-Host '📋 Verifying VS Code Tasks...' -ForegroundColor Blue
  Write-Host ''

  $tasksFile = Join-Path $WorkspaceRoot '.vscode\tasks.json'
  if (Test-Path $tasksFile) {
    Write-Host '✅ VS Code tasks file found' -ForegroundColor Green

    # Count available tasks
    try {
      $tasksContent = Get-Content $tasksFile -Raw | ConvertFrom-Json
      $taskCount = $tasksContent.tasks.Count
      Write-Host "📊 Available tasks: $taskCount" -ForegroundColor Cyan

      # Highlight key tasks
      $keyTasks = @(
        '🚀 Node.js Development Workflow',
        '⚡ Quick Health Check',
        '🧪 Full Test Suite',
        'iOS: Swift Lint',
        '💎 VitalSense Deploy'
      )

      foreach ($keyTask in $keyTasks) {
        $taskExists = $tasksContent.tasks | Where-Object { $_.label -eq $keyTask }
        if ($taskExists) {
          Write-Host "  ✅ $keyTask" -ForegroundColor Green
        } else {
          Write-Host "  ❌ $keyTask" -ForegroundColor Red
        }
      }
    } catch {
      Write-Host '⚠️  Could not parse tasks.json' -ForegroundColor Yellow
    }
  } else {
    Write-Host '❌ VS Code tasks file not found' -ForegroundColor Red
  }

  Write-Host ''
}

# Display setup summary
Write-Host '📋 Setup Summary' -ForegroundColor Cyan
Write-Host '================' -ForegroundColor Cyan
Write-Host ''

Write-Host '🎯 Next Steps:' -ForegroundColor Blue
if ($InstallExtensions) {
  Write-Host '  1. ✅ Extensions installed/verified' -ForegroundColor Green
} else {
  Write-Host '  1. 🔄 Run with -InstallExtensions to install recommended extensions' -ForegroundColor Yellow
}

Write-Host '  2. 🔄 Restart VS Code to apply all changes' -ForegroundColor Yellow
Write-Host '  3. 💙 Open workspace: File > Open Workspace from File > health.code-workspace' -ForegroundColor Cyan
Write-Host '  4. 🖥️ Terminal will automatically use VitalSense Enhanced profile' -ForegroundColor Cyan
Write-Host ''

Write-Host '🚀 Available Terminal Profiles:' -ForegroundColor Blue
Write-Host '  • VitalSense Enhanced    - Full web + Swift development environment' -ForegroundColor Green
Write-Host '  • Swift Development      - Focused Swift/iOS development' -ForegroundColor Magenta
Write-Host '  • Legacy VitalSense      - Previous configuration' -ForegroundColor Gray
Write-Host '  • PowerShell 7           - Clean PowerShell environment' -ForegroundColor Blue
Write-Host ''

Write-Host '🎯 Quick Commands After Setup:' -ForegroundColor Blue
Write-Host '  dev          - Start development server' -ForegroundColor Gray
Write-Host '  probe        - Health check endpoints' -ForegroundColor Gray
Write-Host '  sa           - Swift All (lint + format + build)' -ForegroundColor Gray
Write-Host '  ctx          - Get development context' -ForegroundColor Gray
Write-Host '  reload       - Reload profile' -ForegroundColor Gray
Write-Host ''

Write-Host '✨ VitalSense VS Code workspace is ready!' -ForegroundColor Green
