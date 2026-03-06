# Enhanced task runner with VS Code integration and progress tracking
# This script provides a consistent interface for running development tasks
# with proper status reporting and Copilot-friendly output.

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'test', 'build', 'probe', 'deploy', 'clean')]
  [string]$Task,

  [string]$Environment = 'development',
  [int]$Port = 8787,
  [switch]$Background,
  [switch]$Verbose,
  [switch]$JSON
)

# Import utilities
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $scriptRoot 'VSCodeIntegration.psm1') -Force

$ErrorActionPreference = 'Stop'

# Task definitions
$tasks = @{
  dev    = @{
    name        = 'Development Server'
    description = 'Start Wrangler development server'
    command     = 'wrangler'
    args        = @('dev', '--env', $Environment, '--port', $Port.ToString())
    background  = $true
  }
  test   = @{
    name        = 'Run Tests'
    description = 'Execute test suite'
    command     = 'npm'
    args        = @('test')
    background  = $false
  }
  build  = @{
    name        = 'Build Project'
    description = 'Build application and worker'
    command     = 'npm'
    args        = @('run', 'build')
    background  = $false
  }
  probe  = @{
    name        = 'Health Probe'
    description = 'Test application endpoints'
    command     = 'pwsh'
    args        = @('-NoProfile', '-File', 'scripts/probe.ps1', '-Port', $Port.ToString())
    background  = $false
  }
  deploy = @{
    name        = 'Deploy Application'
    description = 'Deploy to Cloudflare Workers'
    command     = 'wrangler'
    args        = @('deploy', '--env', $Environment)
    background  = $false
  }
  clean  = @{
    name        = 'Clean Build'
    description = 'Clean build artifacts'
    command     = 'npm'
    args        = @('run', 'clean')
    background  = $false
  }
}

function Start-TaskWithProgress {
  param(
    [hashtable]$TaskDef,
    [bool]$IsBackground = $false
  )

  Write-TaskStart $TaskDef.name $TaskDef.description

  if ($Verbose) {
    Write-Info "Command: $($TaskDef.command) $($TaskDef.args -join ' ')"
    Write-Info "Background: $IsBackground"
  }

  try {
    if ($IsBackground -or $TaskDef.background) {
      $logFile = Join-Path (Get-ProjectRoot) 'logs' "$($Task)_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
      New-Item -Path (Split-Path $logFile) -ItemType Directory -Force | Out-Null

      $process = Start-BackgroundTask -Command $TaskDef.command -Arguments $TaskDef.args -LogFile $logFile

      Write-TaskComplete $TaskDef.name "Started in background (PID: $($process.Id))"
      Write-Info "Log file: $logFile"

      return @{
        process = $process
        logFile = $logFile
        success = $true
      }
    } else {
      $process = Start-Process -FilePath $TaskDef.command -ArgumentList $TaskDef.args -Wait -PassThru -NoNewWindow

      if ($process.ExitCode -eq 0) {
        Write-TaskComplete $TaskDef.name 'Completed successfully'
        return @{ success = $true; exitCode = $process.ExitCode }
      } else {
        Write-TaskError $TaskDef.name "Failed with exit code $($process.ExitCode)"
        return @{ success = $false; exitCode = $process.ExitCode }
      }
    }
  } catch {
    Write-TaskError $TaskDef.name $_.Exception.Message
    return @{ success = $false; error = $_.Exception.Message }
  }
}

# Main execution
try {
  Write-TaskStart 'Task Runner' "Executing task: $Task"

  # Validate environment
  $projectRoot = Get-ProjectRoot
  Set-Location $projectRoot

  if ($Verbose) {
    $envInfo = Get-EnvironmentInfo
    Write-Info "Project Root: $projectRoot"
    Write-Info "Environment: $Environment"
    Write-Info "PowerShell: $($envInfo.PowerShellVersion)"
  }

  # Check if task exists
  if (-not $tasks.ContainsKey($Task)) {
    Write-TaskError 'Task Runner' "Unknown task: $Task. Available tasks: $($tasks.Keys -join ', ')"
    exit 1
  }

  $taskDef = $tasks[$Task]

  # Override background setting if specified
  if ($Background) {
    $taskDef.background = $true
  }

  # Execute task
  $result = Start-TaskWithProgress -TaskDef $taskDef -IsBackground $Background

  if ($JSON) {
    $output = @{
      task        = $Task
      environment = $Environment
      timestamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
      result      = $result
    }
    $output | ConvertTo-Json -Depth 5 | Write-Output
  }

  if ($result.success) {
    Write-TaskComplete 'Task Runner' "Task '$Task' completed successfully"
    exit 0
  } else {
    Write-TaskError 'Task Runner' "Task '$Task' failed"
    exit 1
  }

} catch {
  Write-TaskError 'Task Runner' $_.Exception.Message
  if ($JSON) {
    @{
      task  = $Task
      error = $_.Exception.Message
      stack = $_.ScriptStackTrace
    } | ConvertTo-Json -Depth 5 | Write-Output
  }
  exit 1
}
