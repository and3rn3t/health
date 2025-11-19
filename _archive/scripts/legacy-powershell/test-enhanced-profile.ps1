# Test script to verify the enhanced VitalSense profile loads correctly
# This helps diagnose profile loading issues

param(
  [switch]$Verbose
)

Write-Host '🔍 Testing Enhanced VitalSense Profile Loading...' -ForegroundColor Cyan
Write-Host ''

$WorkspaceRoot = Split-Path $PSScriptRoot -Parent
$ProfilePath = Join-Path $WorkspaceRoot 'scripts\enhanced-vitalsense-profile.ps1'

if (-not (Test-Path $ProfilePath)) {
  Write-Host "❌ Profile not found at: $ProfilePath" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Profile found at: $ProfilePath" -ForegroundColor Green
Write-Host "📂 Workspace root: $WorkspaceRoot" -ForegroundColor Cyan
Write-Host ''

# Test execution policy
$executionPolicy = Get-ExecutionPolicy -Scope CurrentUser
Write-Host "🔒 Current execution policy (CurrentUser): $executionPolicy" -ForegroundColor Blue

if ($executionPolicy -eq 'Restricted') {
  Write-Host '⚠️  Execution policy is Restricted - this may cause issues' -ForegroundColor Yellow
  Write-Host '   Consider running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser' -ForegroundColor Gray
}

Write-Host ''
Write-Host '🧪 Loading profile with error capture...' -ForegroundColor Blue

try {
  # Load the profile in a controlled way
  $originalErrorPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  . $ProfilePath -WorkspaceRoot $WorkspaceRoot -Verbose:$Verbose

  Write-Host '✅ Profile loaded successfully!' -ForegroundColor Green

  # Test core functions
  Write-Host ''
  Write-Host '🧪 Testing core functions...' -ForegroundColor Blue

  $coreFunctions = @('dev', 'probe', 'ctx', 'root', 'ios', 'reload')
  foreach ($func in $coreFunctions) {
    if (Get-Command $func -ErrorAction SilentlyContinue) {
      Write-Host "  ✅ $func - Available" -ForegroundColor Green
    } else {
      Write-Host "  ❌ $func - Not found" -ForegroundColor Red
    }
  }

  # Test Swift functions if available
  if ($global:SwiftIntegrationLoaded) {
    Write-Host ''
    Write-Host '🍎 Testing Swift functions...' -ForegroundColor Blue

    $swiftFunctions = @('Swift-Lint', 'Swift-Format', 'Swift-Build', 'Swift-All', 'Swift-Doctor', 'Swift-Setup')
    foreach ($func in $swiftFunctions) {
      if (Get-Command $func -ErrorAction SilentlyContinue) {
        Write-Host "  ✅ $func - Available" -ForegroundColor Green
      } else {
        Write-Host "  ❌ $func - Not found" -ForegroundColor Red
      }
    }

    # Test aliases
    $swiftAliases = @('sa', 'sl', 'sf', 'sb', 'sd', 'ss')
    foreach ($alias in $swiftAliases) {
      if (Get-Alias $alias -ErrorAction SilentlyContinue) {
        Write-Host "  ✅ $alias - Alias available" -ForegroundColor Green
      } else {
        Write-Host "  ❌ $alias - Alias not found" -ForegroundColor Red
      }
    }
  } else {
    Write-Host ''
    Write-Host '⚠️  Swift integration not loaded' -ForegroundColor Yellow
  }

} catch {
  Write-Host '❌ Profile loading failed!' -ForegroundColor Red
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($Verbose) {
    Write-Host "Full error: $($_.Exception.ToString())" -ForegroundColor Gray
  }
} finally {
  $ErrorActionPreference = $originalErrorPreference
}

Write-Host ''
Write-Host '🏁 Profile test completed' -ForegroundColor Cyan
