# PowerShell - VS Code - Copilot Integration Guide

This guide explains the enhanced PowerShell integration with VS Code and GitHub Copilot to provide optimal development experience.

## Overview

The enhanced integration provides:

- **Consistent logging and status reporting** across all PowerShell scripts
- **Better error handling** with detailed context for Copilot
- **Progress tracking** for long-running tasks
- **Background task management** with proper cleanup
- **VS Code task integration** with enhanced output formatting
- **Copilot-optimized output** with structured data and clear status indicators

## Key Features

### 1. Enhanced Logging System

All scripts now use consistent logging functions:

```powershell
Write-TaskStart "Task Name" "Description"
Write-TaskComplete "Task Name" "Result details"
Write-TaskError "Task Name" "Error message"
Write-Info "Information message"
Write-Warning "Warning message"
Write-Success "Success message"
```

Benefits:

- Timestamped output for debugging
- Color-coded messages for quick visual parsing
- Consistent format that Copilot can understand
- VS Code terminal integration with clickable links

### 2. Improved Task Configuration

Tasks now include:

- **Presentation settings** for better terminal management
- **Problem matchers** for automatic error detection
- **Instance limits** to prevent duplicate processes
- **Execution policies** for consistent PowerShell behavior

Example task configuration:

```json
{
  "label": "probe-health",
  "type": "shell",
  "command": "pwsh",
  "args": ["-NoProfile", "-ExecutionPolicy", "Bypass"],
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared",
    "clear": false
  }
}
```

### 3. PowerShell Script Analyzer Integration

Configured PSScriptAnalyzer with:

- Consistent formatting rules
- Code quality checks
- Alignment and whitespace standards
- Copilot-friendly code patterns

### 4. Background Task Management

Enhanced background task handling:

```powershell
$process = Start-BackgroundTask -Command "wrangler" -Arguments @("dev") -LogFile "dev.log"
Wait-ForProcess -Process $process -TimeoutSeconds 30
```

Features:

- Automatic log file creation
- Process monitoring and cleanup
- Timeout handling
- Output redirection

## VS Code Configuration

### Terminal Settings

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "args": ["-NoLogo", "-NoProfile"]
    }
  },
  "terminal.integrated.scrollback": 10000,
  "powershell.scriptAnalysis.enable": true
}
```

### Task Optimization

```json
{
  "task.verboseLogging": true,
  "task.allowAutomaticTasks": "on",
  "task.reconnection": true
}
```

### Copilot Enhancement

```json
{
  "github.copilot.enable": {
    "powershell": true
  },
  "github.copilot.editor.enableCodeActions": true
}
```

## Command Line Tools

### Enhanced Probe Script

```powershell
# Basic usage
./scripts/probe.ps1

# With verbose output
./scripts/probe.ps1 -Verbose

# JSON output for automation
./scripts/probe.ps1 -JSON

# Custom port
./scripts/probe.ps1 -Port 8789
```

### Task Runner

```powershell
# Start development server
./scripts/run-task.ps1 -Task dev

# Run tests with verbose output
./scripts/run-task.ps1 -Task test -Verbose

# Background deployment
./scripts/run-task.ps1 -Task deploy -Background
```

## Troubleshooting Common Issues

### 1. Commands Hanging

**Problem**: PowerShell commands appear to hang without output.

**Solutions**:

- Use `-NoProfile` flag to skip profile loading
- Check for background processes with `Get-Process`
- Use task timeout settings
- Enable verbose logging with `-Verbose`

### 2. Copilot Context Issues

**Problem**: Copilot doesn't understand script output or context.

**Solutions**:

- Use structured output with `-JSON` flag
- Include environment information with `-Verbose`
- Use consistent logging functions
- Add descriptive comments and documentation

### 3. VS Code Integration Problems

**Problem**: Tasks don't show proper status or output.

**Solutions**:

- Check task presentation settings
- Verify PowerShell execution policy
- Use shared terminal panels
- Enable task verbose logging

## Best Practices

### 1. Script Structure

```powershell
# Always start with parameter validation
param([string]$Required, [switch]$Optional)

# Import utilities
Import-Module "./VSCodeIntegration.psm1" -Force

# Set error handling
$ErrorActionPreference = 'Stop'

# Use consistent logging
Write-TaskStart "Script Name" "What it does"
try {
  # Main logic here
  Write-TaskComplete "Script Name" "Success details"
} catch {
  Write-TaskError "Script Name" $_.Exception.Message
  exit 1
}
```

### 2. Error Handling

```powershell
# Provide context for errors
try {
  Invoke-RestMethod -Uri $url
} catch {
  Write-TaskError "API Call" "Failed to connect to $url: $($_.Exception.Message)"
  # Include retry logic if appropriate
}
```

### 3. Progress Reporting

```powershell
# For long-running operations
Write-TaskStart "Build Process" "Compiling TypeScript..."
# ... build steps ...
Write-TaskComplete "Build Process" "Generated 15 files in dist/"
```

### 4. VS Code Task Integration

```powershell
# Make scripts VS Code task-friendly
if ($env:VSCODE_TASK_ID) {
  # Running from VS Code task
  $IsVSCodeTask = $true
}
```

## Monitoring and Debugging

### Log Files

All background tasks create log files in `logs/` directory:

- `dev_20250901_143022.log` - Development server logs
- `probe_20250901_143025.log` - Health probe logs

### Process Management

```powershell
# List running background processes
Get-Process | Where-Object { $_.ProcessName -match "wrangler|node" }

# Kill hanging processes
Stop-Process -Name "wrangler" -Force
```

### VS Code Output Channels

- **Tasks**: Shows task execution output
- **PowerShell**: Shows PowerShell extension logs
- **GitHub Copilot**: Shows Copilot interaction logs

## Integration with Development Workflow

### Pre-commit Hooks

Enhanced scripts integrate with Git hooks:

```powershell
# In .git/hooks/pre-commit
pwsh -NoProfile -File scripts/run-task.ps1 -Task test -JSON
```

### CI/CD Integration

Scripts provide JSON output for automation:

```yaml
# GitHub Actions example
- name: Health Check
  run: |
    $result = pwsh -File scripts/probe.ps1 -JSON | ConvertFrom-Json
    if (-not $result.success) { exit 1 }
```

### Copilot Context Enhancement

Scripts now provide rich context for Copilot:

- Environment information
- Process status
- Error details
- Performance metrics
- Configuration state

This allows Copilot to provide better suggestions and understand the development environment state.
