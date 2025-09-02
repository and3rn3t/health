#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates and ensures all configuration files are properly set up
.DESCRIPTION
    Checks all ignore files, configuration files, and ensures they are consistent and complete
.PARAMETER Fix
    Automatically fix any issues found
.PARAMETER Verbose
    Show detailed output
.EXAMPLE
    .\scripts\validate-configs.ps1 -Verbose
    .\scripts\validate-configs.ps1 -Fix
#>

param(
  [switch]$Fix,
  [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Status {
  param([string]$Message, [string]$Type = 'Info')

  $color = switch ($Type) {
    'Success' { 'Green' }
    'Warning' { 'Yellow' }
    'Error' { 'Red' }
    default { 'Cyan' }
  }

  Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Test-ConfigFile {
  param(
    [string]$Path,
    [string]$Description,
    [string[]]$RequiredContent = @()
  )

  if (-not (Test-Path $Path)) {
    Write-Status "Missing: $Description at $Path" 'Error'
    return $false
  }

  if ($RequiredContent.Count -gt 0) {
    $content = Get-Content $Path -Raw
    foreach ($required in $RequiredContent) {
      if ($content -notmatch [regex]::Escape($required)) {
        Write-Status "Missing content in ${Description}: $required" 'Warning'
        return $false
      }
    }
  }

  Write-Status "✓ $Description" 'Success'
  return $true
}

Write-Status 'Validating project configuration files...' 'Info'

# Define expected files and their required content
$configChecks = @(
  @{
    Path            = '.gitignore'
    Description     = 'Git ignore file'
    RequiredContent = @('node_modules', '.wrangler', 'dist-worker', '.env', '.DS_Store')
  },
  @{
    Path            = '.prettierignore'
    Description     = 'Prettier ignore file'
    RequiredContent = @('node_modules', 'dist', 'build')
  },
  @{
    Path            = '.eslintignore'
    Description     = 'ESLint ignore file'
    RequiredContent = @('node_modules', 'dist', '.wrangler')
  },
  @{
    Path            = '.editorconfig'
    Description     = 'EditorConfig file'
    RequiredContent = @('[*]', 'indent_style = space', 'end_of_line = lf')
  },
  @{
    Path            = '.prettierrc'
    Description     = 'Prettier configuration'
    RequiredContent = @('singleQuote', 'trailingComma')
  },
  @{
    Path            = '.nvmrc'
    Description     = 'Node.js version file'
    RequiredContent = @()
  },
  @{
    Path            = '.npmrc'
    Description     = 'npm configuration'
    RequiredContent = @('save-exact', 'registry')
  },
  @{
    Path            = 'eslint.config.js'
    Description     = 'ESLint configuration'
    RequiredContent = @('ignores', 'typescript-eslint')
  },
  @{
    Path            = '.vscode/settings.json'
    Description     = 'VS Code settings'
    RequiredContent = @('editor.formatOnSave', 'eslint.workingDirectories')
  },
  @{
    Path            = '.vscode/PSScriptAnalyzerSettings.psd1'
    Description     = 'PowerShell Script Analyzer settings'
    RequiredContent = @('IncludeDefaultRules', 'PSUseConsistentIndentation')
  },
  @{
    Path            = '.sonarlint/settings.json'
    Description     = 'SonarLint configuration'
    RequiredContent = @('rules', 'typescript:S6478')
  },
  @{
    Path            = 'ios/.gitignore'
    Description     = 'iOS Git ignore file'
    RequiredContent = @('DerivedData', 'Pods', '*.xcuserdata')
  }
)

$allPassed = $true

foreach ($check in $configChecks) {
  $result = Test-ConfigFile -Path $check.Path -Description $check.Description -RequiredContent $check.RequiredContent
  if (-not $result) {
    $allPassed = $false
  }
}

# Check package.json engines
if (Test-Path 'package.json') {
  $packageJson = Get-Content 'package.json' | ConvertFrom-Json
  if (-not $packageJson.engines) {
    Write-Status 'Missing engines field in package.json' 'Warning'
    $allPassed = $false
  } else {
    Write-Status '✓ Package.json engines field' 'Success'
  }
} else {
  Write-Status 'Missing package.json' 'Error'
  $allPassed = $false
}

# Check TypeScript configuration
$tsConfigFiles = @('tsconfig.json', 'vitest.config.ts', 'vite.config.ts')
foreach ($tsFile in $tsConfigFiles) {
  if (Test-Path $tsFile) {
    Write-Status "✓ $tsFile found" 'Success'
  } else {
    Write-Status "Missing $tsFile" 'Warning'
    $allPassed = $false
  }
}

# Check if ignore patterns are consistent
Write-Status 'Checking ignore pattern consistency...' 'Info'

$gitIgnoreContent = if (Test-Path '.gitignore') { Get-Content '.gitignore' } else { @() }
$eslintIgnoreContent = if (Test-Path '.eslintignore') { Get-Content '.eslintignore' } else { @() }
$prettierIgnoreContent = if (Test-Path '.prettierignore') { Get-Content '.prettierignore' } else { @() }

$commonPatterns = @('node_modules', 'dist', 'build', '.wrangler', 'coverage')
foreach ($pattern in $commonPatterns) {
  $inGit = $gitIgnoreContent -contains $pattern -or $gitIgnoreContent -match "^$pattern/"
  $inEslint = $eslintIgnoreContent -contains $pattern -or $eslintIgnoreContent -match "^$pattern/"
  $inPrettier = $prettierIgnoreContent -contains $pattern -or $prettierIgnoreContent -match "^$pattern/"

  if (-not ($inGit -and $inEslint -and $inPrettier)) {
    Write-Status "Inconsistent ignore pattern: $pattern" 'Warning'
    if ($Verbose) {
      Write-Host "  Git: $inGit, ESLint: $inEslint, Prettier: $inPrettier"
    }
    $allPassed = $false
  }
}

# Summary
Write-Host "`n" -NoNewline
if ($allPassed) {
  Write-Status 'All configuration files are properly set up!' 'Success'
  exit 0
} else {
  Write-Status 'Some configuration issues found. Use -Fix to automatically resolve them.' 'Warning'
  if ($Fix) {
    Write-Status 'Auto-fix functionality not yet implemented. Please review and fix issues manually.' 'Info'
  }
  exit 1
}
