# Enhanced PowerShell utilities for better VS Code and Copilot integration
# This module provides consistent logging, error handling, and status reporting
# for all PowerShell scripts in the project.

#region Logging Functions
function Write-TaskStart {
  param([string]$TaskName, [string]$Description = '')
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "▶ $TaskName" -ForegroundColor Cyan
  if ($Description) {
    Write-Host "  $Description" -ForegroundColor DarkCyan
  }
}

function Write-TaskComplete {
  param([string]$TaskName, [string]$Result = '')
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "✓ $TaskName" -ForegroundColor Green
  if ($Result) {
    Write-Host "  $Result" -ForegroundColor DarkGreen
  }
}

function Write-TaskError {
  param([string]$TaskName, [string]$Error)
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "✗ $TaskName" -ForegroundColor Red
  Write-Host "  $Error" -ForegroundColor DarkRed
}

function Write-Info {
  param([string]$Message)
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Warning {
  param([string]$Message)
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Success {
  param([string]$Message)
  $timestamp = Get-Date -Format 'HH:mm:ss'
  Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
  Write-Host "✓ $Message" -ForegroundColor Green
}
#endregion

#region HTTP Utilities
function Invoke-SafeRestMethod {
  param(
    [string]$Uri,
    [string]$Method = 'GET',
    [hashtable]$Headers = @{},
    [object]$Body = $null,
    [int]$TimeoutSec = 30,
    [string]$ContentType = 'application/json'
  )

  try {
    $params = @{
      Uri         = $Uri
      Method      = $Method
      Headers     = $Headers
      TimeoutSec  = $TimeoutSec
      ContentType = $ContentType
    }

    if ($Body) {
      if ($Body -is [string]) {
        $params.Body = $Body
      } else {
        $params.Body = $Body | ConvertTo-Json -Depth 10
      }
    }

    Write-Info "HTTP $Method $Uri"
    $response = Invoke-RestMethod @params
    Write-Success "HTTP $Method $Uri - Success"
    return $response
  } catch {
    $errorMessage = $_.Exception.Message

    # Try to get the response body for better debugging
    if ($_.Exception.Response) {
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        Write-TaskError "HTTP $Method $Uri" "$errorMessage - Response: $responseBody"
      } catch {
        Write-TaskError "HTTP $Method $Uri" $errorMessage
      }
    } else {
      Write-TaskError "HTTP $Method $Uri" $errorMessage
    }
    throw
  }
}

function Test-Endpoint {
  param(
    [string]$Url,
    [int]$TimeoutSec = 5,
    [string]$ExpectedStatus = '200'
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -Method Head
    if ($response.StatusCode -eq $ExpectedStatus) {
      Write-Success "Endpoint $Url is healthy (${ExpectedStatus})"
      return $true
    } else {
      Write-Warning "Endpoint $Url returned status $($response.StatusCode), expected $ExpectedStatus"
      return $false
    }
  } catch {
    Write-TaskError "Endpoint Check $Url" $_.Exception.Message
    return $false
  }
}
#endregion

#region Process Management
function Start-BackgroundTask {
  param(
    [string]$Command,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path,
    [string]$LogFile = $null
  )

  try {
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $Command
    $processInfo.Arguments = $Arguments -join ' '
    $processInfo.WorkingDirectory = $WorkingDirectory
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.CreateNoWindow = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo

    if ($LogFile) {
      $outputHandler = {
        param($sender, $e)
        if (-not [string]::IsNullOrEmpty($e.Data)) {
          Add-Content -Path $LogFile -Value "$(Get-Date -Format 'HH:mm:ss') OUT: $($e.Data)"
        }
      }
      $errorHandler = {
        param($sender, $e)
        if (-not [string]::IsNullOrEmpty($e.Data)) {
          Add-Content -Path $LogFile -Value "$(Get-Date -Format 'HH:mm:ss') ERR: $($e.Data)"
        }
      }

      $process.add_OutputDataReceived($outputHandler)
      $process.add_ErrorDataReceived($errorHandler)
    }

    Write-TaskStart 'Background Process' "$Command $($Arguments -join ' ')"
    $process.Start()

    if ($LogFile) {
      $process.BeginOutputReadLine()
      $process.BeginErrorReadLine()
    }

    return $process
  } catch {
    Write-TaskError 'Start Background Process' $_.Exception.Message
    throw
  }
}

function Wait-ForProcess {
  param(
    [System.Diagnostics.Process]$Process,
    [int]$TimeoutSeconds = 30
  )

  try {
    Write-Info "Waiting for process $($Process.Id) to complete..."
    if ($Process.WaitForExit($TimeoutSeconds * 1000)) {
      Write-Success "Process $($Process.Id) completed with exit code $($Process.ExitCode)"
      return $Process.ExitCode
    } else {
      Write-Warning "Process $($Process.Id) timed out after $TimeoutSeconds seconds"
      $Process.Kill()
      return -1
    }
  } catch {
    Write-TaskError 'Wait For Process' $_.Exception.Message
    throw
  }
}
#endregion

#region Environment Helpers
function Get-ProjectRoot {
  $current = Get-Location
  while ($current -and -not (Test-Path (Join-Path $current 'package.json'))) {
    $current = Split-Path $current -Parent
  }
  if (-not $current) {
    throw 'Could not find project root (looking for package.json)'
  }
  return $current
}

function Test-RequiredTools {
  param([string[]]$Tools)

  $missing = @()
  foreach ($tool in $Tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
      $missing += $tool
    }
  }

  if ($missing.Count -gt 0) {
    Write-TaskError 'Missing Tools' "Required tools not found: $($missing -join ', ')"
    return $false
  }

  Write-Success "All required tools are available: $($Tools -join ', ')"
  return $true
}

function Get-EnvironmentInfo {
  return @{
    PowerShellVersion = $PSVersionTable.PSVersion.ToString()
    Platform          = [System.Environment]::OSVersion.Platform
    WorkingDirectory  = (Get-Location).Path
    UserName          = [System.Environment]::UserName
    MachineName       = [System.Environment]::MachineName
    Timestamp         = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  }
}
#endregion

#region VS Code Integration
function Send-VSCodeNotification {
  param(
    [string]$Message,
    [ValidateSet('info', 'warning', 'error')]$Type = 'info'
  )

  # This function can be extended to integrate with VS Code's notification system
  # For now, it uses consistent console output that VS Code can parse
  switch ($Type) {
    'info' { Write-Info $Message }
    'warning' { Write-Warning $Message }
    'error' { Write-TaskError 'Notification' $Message }
  }
}

function Set-VSCodeStatusBar {
  param([string]$Text)

  # Placeholder for VS Code status bar integration
  Write-Info "Status: $Text"
}
#endregion

# Export functions for use in other scripts
Export-ModuleMember -Function @(
  'Write-TaskStart', 'Write-TaskComplete', 'Write-TaskError',
  'Write-Info', 'Write-Warning', 'Write-Success',
  'Invoke-SafeRestMethod', 'Test-Endpoint',
  'Start-BackgroundTask', 'Wait-ForProcess',
  'Get-ProjectRoot', 'Test-RequiredTools', 'Get-EnvironmentInfo',
  'Send-VSCodeNotification', 'Set-VSCodeStatusBar'
)
