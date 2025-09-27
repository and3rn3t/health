<#
  .SYNOPSIS
    Diagnose local Node.js + pnpm + nvm-windows environment issues (PATH, execution policy, versions).

  .DESCRIPTION
    Runs a series of checks to determine why `node`, `pnpm`, or `nvm` might not be available.
    Safe to run multiple times. Produces a summary & remediation hints at the end.

  .OUTPUTS
    Colorized console output (non-fatal warnings) and an optional JSON summary (use -Json for machine reading).

  .EXAMPLES
    pwsh -NoProfile -File scripts/diagnose-node-env.ps1
    pwsh -NoProfile -File scripts/diagnose-node-env.ps1 -Json | ConvertFrom-Json

  .NOTES
    Designed for Windows + PowerShell 7. Works without Node installed.
#>

param(
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'SilentlyContinue'

function Write-Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m) { Write-Host "[FAIL] $m" -ForegroundColor Red }
function Write-Ok($m) { Write-Host "[OK]   $m" -ForegroundColor Green }

$result = [ordered]@{
  timestamp = (Get-Date).ToString('s')
  powershell_version = $PSVersionTable.PSVersion.ToString()
  execution_policy = (Get-ExecutionPolicy -Scope CurrentUser)
  path_entries = @()
  node = [ordered]@{ present = $false; version = $null; location = $null }
  pnpm = [ordered]@{ present = $false; version = $null; location = $null; blockedByPolicy = $false }
  nvm = [ordered]@{ present = $false; version = $null; location = $null; nvm_home = $env:NVM_HOME; nvm_symlink = $env:NVM_SYMLINK }
  common_dirs = [ordered]@{}
  recommendations = @()
}

Write-Section 'Execution Policy'
$policy = Get-ExecutionPolicy -Scope CurrentUser
if ($policy -in 'Undefined','Restricted','AllSigned') {
  Write-Warn "Execution policy ($policy) may block running pnpm shim scripts (.ps1)."
  $result.recommendations += 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'
} else { Write-Ok "Execution policy is $policy" }

Write-Section 'PATH Scan'
$pathSegments = ($env:Path -split ';' | Where-Object { $_ -and (Test-Path $_) })
$idx = 0
foreach ($seg in $pathSegments) {
  $idx++
  if ($seg -match 'nodejs' -or $seg -match 'nvm' -or $seg -match 'pnpm') {
    Write-Host ("[$idx] * " + $seg) -ForegroundColor Magenta
  } else {
    Write-Host "[$idx]   $seg"
  }
}
$result.path_entries = $pathSegments

Write-Section 'Common Install Directories'
$dirs = @(
  'C:\Program Files\nodejs',
  'C:\Program Files (x86)\nodejs',
  "$env:USERPROFILE\AppData\Local\Programs\node", # winget style
  'C:\Program Files\nvm',
  "$env:USERPROFILE\AppData\Roaming\nvm",
  "$env:USERPROFILE\scoop\apps\nodejs-lts\current",
  "$env:USERPROFILE\scoop\apps\nodejs-current\current"
)
foreach ($d in $dirs) {
  $exists = Test-Path $d
  $result.common_dirs[$d] = $exists
  if ($exists) { Write-Ok "$d" } else { Write-Warn "$d (missing)" }
}

Write-Section 'nvm'
$nvmCmd = Get-Command nvm -ErrorAction SilentlyContinue
if ($nvmCmd) {
  $result.nvm.present = $true
  $result.nvm.location = $nvmCmd.Source
  $nvmVersion = (& nvm version) 2>$null
  if ($LASTEXITCODE -eq 0 -and $nvmVersion) {
    Write-Ok "nvm version: $nvmVersion"
    $result.nvm.version = $nvmVersion.Trim()
  } else { Write-Warn 'nvm detected but failed to read version' }
  Write-Host 'Installed versions:'
  (& nvm list) 2>$null | ForEach-Object { Write-Host '  ' $_ }
} else {
  Write-Warn 'nvm not found on PATH.'
  $result.recommendations += 'Install nvm-windows: https://github.com/coreybutler/nvm-windows/releases'
}

Write-Section 'Node'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
  $result.node.present = $true
  $result.node.location = $nodeCmd.Source
  $ver = (& node -v) 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Ok "node version $ver"; $result.node.version = $ver.Trim() } else { Write-Warn 'Node present but version check failed' }
} else {
  Write-Err 'node NOT found on PATH'
  $result.recommendations += 'Install with nvm: nvm install 20.19.0 && nvm use 20.19.0'
}

Write-Section 'pnpm'
$pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
if ($pnpmCmd) {
  try {
    $ver = (& pnpm -v) 2>$null
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "pnpm version $ver"
      $result.pnpm.present = $true
      $result.pnpm.location = $pnpmCmd.Source
      $result.pnpm.version = $ver.Trim()
    } else { Write-Warn 'pnpm on PATH but failed to execute (maybe execution policy)'; $result.pnpm.blockedByPolicy = $true }
  } catch {
    Write-Warn 'pnpm invocation blocked (execution policy?)'
    $result.pnpm.blockedByPolicy = $true
    $result.recommendations += 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned'
  }
} else { Write-Warn 'pnpm not found'; $result.recommendations += 'Enable corepack: corepack enable' }

Write-Section 'Repository Version Requirements'
$nvmrcPath = Join-Path $PSScriptRoot '..' '.nvmrc' | Resolve-Path -ErrorAction SilentlyContinue
if ($nvmrcPath) {
  $target = Get-Content $nvmrcPath -ErrorAction SilentlyContinue | Select-Object -First 1
  Write-Host "Expected Node (from .nvmrc): $target" -ForegroundColor Cyan
  $result.expected_node = $target
  if ($result.node.version -and $target -and ($result.node.version -notlike "v$target")) {
    Write-Warn "Active node $($result.node.version) != expected v$target"
    $result.recommendations += "nvm use $target"
  }
}

Write-Section 'Summary'
if (-not $result.node.present) { Write-Err 'Node missing' }
elseif ($result.node.version -and $result.expected_node -and ($result.node.version -notlike "v$($result.expected_node)")) { Write-Warn 'Node version mismatch' } else { Write-Ok 'Node version satisfies .nvmrc' }
if ($result.pnpm.blockedByPolicy) { Write-Warn 'pnpm blocked by execution policy' }

if ($result.recommendations.Count -gt 0) {
  Write-Host '`nRecommended Actions:' -ForegroundColor Cyan
  $result.recommendations | Select-Object -Unique | ForEach-Object { Write-Host ' - ' $_ }
} else { Write-Ok 'No remediation needed' }

if ($Json) {
  $result | ConvertTo-Json -Depth 6
}
