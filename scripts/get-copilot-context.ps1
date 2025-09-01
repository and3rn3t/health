# Copilot Context Enhancement Script
# This script gathers and formats development environment information
# to provide better context for GitHub Copilot interactions.

param(
  [switch]$Full,
  [switch]$JSON,
  [switch]$Clipboard
)

# Import utilities
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $scriptRoot 'VSCodeIntegration.psm1') -Force

function Get-GitStatus {
  try {
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    $status = git status --porcelain 2>$null
    $lastCommit = git log -1 --format="%h %s" 2>$null

    return @{
      branch     = $branch
      hasChanges = $status.Count -gt 0
      changes    = $status
      lastCommit = $lastCommit
    }
  } catch {
    return @{ error = 'Not a git repository or git not available' }
  }
}

function Get-DevelopmentServerStatus {
  $servers = @()

  # Check common development ports
  $ports = @(3000, 8787, 8788, 8789, 5173)
  foreach ($port in $ports) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
      $servers += @{
        port   = $port
        status = 'running'
        health = 'healthy'
      }
    } catch {
      # Check if port is in use
      $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -ErrorAction SilentlyContinue
      if ($connection) {
        $servers += @{
          port   = $port
          status = 'running'
          health = 'unknown'
        }
      }
    }
  }

  return $servers
}

function Get-VSCodeContext {
  $context = @{
    workspaceRoot = Get-ProjectRoot
    openFolders   = @()
    extensions    = @()
  }

  # Try to detect open VS Code instances
  $vscodeProcesses = Get-Process -Name 'Code' -ErrorAction SilentlyContinue
  if ($vscodeProcesses) {
    $context.vscodeRunning = $true
    $context.processCount = $vscodeProcesses.Count
  }

  return $context
}

function Get-ProjectStructure {
  $root = Get-ProjectRoot
  $structure = @{
    hasPackageJson  = Test-Path (Join-Path $root 'package.json')
    hasWranglerToml = Test-Path (Join-Path $root 'wrangler.toml')
    hasDockerfile   = Test-Path (Join-Path $root 'Dockerfile')
    hasReadme       = Test-Path (Join-Path $root 'README.md')
  }

  # Count key file types
  $structure.tsFiles = (Get-ChildItem -Path $root -Recurse -Include '*.ts', '*.tsx' -ErrorAction SilentlyContinue).Count
  $structure.jsFiles = (Get-ChildItem -Path $root -Recurse -Include '*.js', '*.jsx' -ErrorAction SilentlyContinue).Count
  $structure.psFiles = (Get-ChildItem -Path $root -Recurse -Include '*.ps1', '*.psm1' -ErrorAction SilentlyContinue).Count

  return $structure
}

function Get-RecentActivity {
  $activity = @{
    recentFiles   = @()
    recentCommits = @()
    recentTasks   = @()
  }

  try {
    # Recent git commits
    $commits = git log --oneline -10 2>$null
    if ($commits) {
      $activity.recentCommits = $commits
    }

    # Recent log files
    $logsDir = Join-Path (Get-ProjectRoot) 'logs'
    if (Test-Path $logsDir) {
      $recentLogs = Get-ChildItem -Path $logsDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5
      $activity.recentLogs = $recentLogs | ForEach-Object {
        @{
          name         = $_.Name
          lastModified = $_.LastWriteTime
          size         = $_.Length
        }
      }
    }
  } catch {
    Write-Warning "Could not gather recent activity: $($_.Exception.Message)"
  }

  return $activity
}

# Main execution
Write-TaskStart 'Copilot Context' 'Gathering development environment information'

$context = @{
  timestamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  environment = Get-EnvironmentInfo
  git         = Get-GitStatus
  servers     = Get-DevelopmentServerStatus
  vscode      = Get-VSCodeContext
  project     = Get-ProjectStructure
}

if ($Full) {
  $context.activity = Get-RecentActivity

  # Add package.json info if available
  $packageJsonPath = Join-Path (Get-ProjectRoot) 'package.json'
  if (Test-Path $packageJsonPath) {
    try {
      $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
      $context.packageInfo = @{
        name         = $packageJson.name
        version      = $packageJson.version
        dependencies = $packageJson.dependencies.PSObject.Properties.Name
        scripts      = $packageJson.scripts.PSObject.Properties.Name
      }
    } catch {
      Write-Warning 'Could not parse package.json'
    }
  }
}

$output = ''

if ($JSON) {
  $output = $context | ConvertTo-Json -Depth 10
} else {
  # Human-readable format
  $output = @"
=== GitHub Copilot Development Context ===
Generated: $($context.timestamp)

ENVIRONMENT:
- PowerShell: $($context.environment.PowerShellVersion)
- Platform: $($context.environment.Platform)
- User: $($context.environment.UserName)
- Machine: $($context.environment.MachineName)
- Working Directory: $($context.environment.WorkingDirectory)

GIT STATUS:
- Branch: $($context.git.branch)
- Has Changes: $($context.git.hasChanges)
- Last Commit: $($context.git.lastCommit)

DEVELOPMENT SERVERS:
$($context.servers | ForEach-Object { "- Port $($_.port): $($_.status) ($($_.health))" } | Out-String)

PROJECT STRUCTURE:
- TypeScript Files: $($context.project.tsFiles)
- JavaScript Files: $($context.project.jsFiles)
- PowerShell Files: $($context.project.psFiles)
- Has Package.json: $($context.project.hasPackageJson)
- Has Wrangler Config: $($context.project.hasWranglerToml)

VS CODE:
- Running: $($context.vscode.vscodeRunning)
- Workspace Root: $($context.vscode.workspaceRoot)
"@

  if ($Full -and $context.activity.recentCommits) {
    $output += "`n`nRECENT COMMITS:`n"
    $output += ($context.activity.recentCommits | ForEach-Object { "- $_" }) -join "`n"
  }
}

Write-Output $output

if ($Clipboard) {
  $output | Set-Clipboard
  Write-Success 'Context information copied to clipboard'
}

Write-TaskComplete 'Copilot Context' 'Context information generated'
