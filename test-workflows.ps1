#!/usr/bin/env pwsh
# Test GitHub Workflows Configuration
# This script validates your workflow setup

param(
  [switch]$Verbose,
  [switch]$FixIssues
)

$ErrorActionPreference = "Continue"

Write-Host "🧪 GitHub Workflows Validation Test" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

$testResults = @{
  TotalTests  = 0
  PassedTests = 0
  FailedTests = 0
  Issues      = @()
}

function Test-WorkflowFile {
  param($FilePath, $WorkflowName)

  $testResults.TotalTests++
  Write-Host "`nTesting $WorkflowName..." -ForegroundColor Yellow

  if (-not (Test-Path $FilePath)) {
    $testResults.FailedTests++
    $testResults.Issues += "${WorkflowName}: File not found"
    Write-Host "  ❌ File not found: $FilePath" -ForegroundColor Red
    return $false
  }  $content = Get-Content $FilePath -Raw
  $isValid = $true

  # Test 1: Has name
  if ($content -notmatch '^\s*name:\s*(.+)$') {
    $isValid = $false
    Write-Host "  ❌ Missing workflow name" -ForegroundColor Red
  }
  else {
    Write-Host "  ✅ Has workflow name" -ForegroundColor Green
  }

  # Test 2: Has on triggers
  if ($content -notmatch '^\s*on:\s*$') {
    $isValid = $false
    Write-Host "  ❌ Missing 'on' triggers" -ForegroundColor Red
  }
  else {
    Write-Host "  ✅ Has trigger configuration" -ForegroundColor Green
  }

  # Test 3: Has jobs
  if ($content -notmatch '^\s*jobs:\s*$') {
    $isValid = $false
    Write-Host "  ❌ Missing jobs section" -ForegroundColor Red
  }
  else {
    Write-Host "  ✅ Has jobs section" -ForegroundColor Green
  }

  # Test 4: Uses modern actions
  $oldActions = @(
    'actions/checkout@v3',
    'actions/setup-node@v3',
    'actions/cache@v3',
    'actions/upload-artifact@v3'
  )

  $hasOldActions = $false
  foreach ($oldAction in $oldActions) {
    if ($content -match [regex]::Escape($oldAction)) {
      $hasOldActions = $true
      Write-Host "  ⚠️  Uses old action: $oldAction" -ForegroundColor Yellow
    }
  }

  if (-not $hasOldActions) {
    Write-Host "  ✅ Uses modern action versions" -ForegroundColor Green
  }

  if ($isValid) {
    $testResults.PassedTests++
    Write-Host "  ✅ $WorkflowName is valid" -ForegroundColor Green
  }
  else {
    $testResults.FailedTests++
    $testResults.Issues += "${WorkflowName}: Validation failed"
    Write-Host "  ❌ $WorkflowName has issues" -ForegroundColor Red
  }

  return $isValid
}

function Test-ProjectStructure {
  Write-Host "`n🏗️  Testing Project Structure..." -ForegroundColor Yellow

  $requiredFiles = @{
    'package.json'       = 'Node.js package configuration'
    '.nvmrc'             = 'Node.js version specification'
    'wrangler.toml'      = 'Cloudflare Workers configuration'
    'src/'               = 'Source code directory'
    '.github/workflows/' = 'GitHub workflows directory'
  }

  $structureValid = $true
  foreach ($file in $requiredFiles.GetEnumerator()) {
    if (Test-Path $file.Key) {
      Write-Host "  ✅ $($file.Key) - $($file.Value)" -ForegroundColor Green
    }
    else {
      Write-Host "  ❌ $($file.Key) - $($file.Value) (MISSING)" -ForegroundColor Red
      $structureValid = $false
      $testResults.Issues += "Missing required file: $($file.Key)"
    }
  }

  $testResults.TotalTests++
  if ($structureValid) {
    $testResults.PassedTests++
  }
  else {
    $testResults.FailedTests++
  }

  return $structureValid
}

function Test-PackageJson {
  Write-Host "`n📦 Testing package.json Configuration..." -ForegroundColor Yellow

  if (-not (Test-Path "package.json")) {
    Write-Host "  ❌ package.json not found" -ForegroundColor Red
    return $false
  }

  $package = Get-Content "package.json" | ConvertFrom-Json
  $isValid = $true

  # Check required scripts
  $requiredScripts = @('build', 'lint', 'dev')
  foreach ($script in $requiredScripts) {
    if ($package.scripts.$script) {
      Write-Host "  ✅ Has '$script' script" -ForegroundColor Green
    }
    else {
      Write-Host "  ❌ Missing '$script' script" -ForegroundColor Red
      $isValid = $false
    }
  }

  # Check for Node.js version compatibility
  if (Test-Path ".nvmrc") {
    $nodeVersion = Get-Content ".nvmrc" -Raw | ForEach-Object { $_.Trim() }
    Write-Host "  ✅ Node.js version specified: $nodeVersion" -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️  No .nvmrc file found" -ForegroundColor Yellow
  }

  $testResults.TotalTests++
  if ($isValid) {
    $testResults.PassedTests++
  }
  else {
    $testResults.FailedTests++
  }

  return $isValid
}

function Show-TestSummary {
  Write-Host "`n📊 Test Summary:" -ForegroundColor Blue
  Write-Host "================" -ForegroundColor Blue
  Write-Host "Total Tests: $($testResults.TotalTests)" -ForegroundColor White
  Write-Host "Passed: $($testResults.PassedTests)" -ForegroundColor Green
  Write-Host "Failed: $($testResults.FailedTests)" -ForegroundColor Red

  if ($testResults.Issues.Count -gt 0) {
    Write-Host "`n❌ Issues Found:" -ForegroundColor Red
    foreach ($issue in $testResults.Issues) {
      Write-Host "  • $issue" -ForegroundColor Red
    }
  }
  else {
    Write-Host "`n✅ No issues found!" -ForegroundColor Green
  }

  # Calculate score
  if ($testResults.TotalTests -gt 0) {
    $score = [math]::Round(($testResults.PassedTests / $testResults.TotalTests) * 100, 1)
    Write-Host "`n🎯 Overall Score: $score%" -ForegroundColor $(if ($score -ge 80) { "Green" } elseif ($score -ge 60) { "Yellow" } else { "Red" })
  }
}

# Run all tests
Write-Host "Starting validation tests..." -ForegroundColor Gray

# Test project structure
Test-ProjectStructure

# Test package.json
Test-PackageJson

# Test each workflow file
$workflows = @{
  '.github/workflows/smoke.yml'                 = 'Smoke Test'
  '.github/workflows/deploy.yml'                = 'Deploy'
  '.github/workflows/ios-tests.yml'             = 'iOS Tests'
  '.github/workflows/security-quality.yml'      = 'Security & Quality'
  '.github/workflows/dependency-management.yml' = 'Dependency Management'
  '.github/workflows/optimized-pipeline.yml'    = 'Optimized Pipeline'
}

foreach ($workflow in $workflows.GetEnumerator()) {
  Test-WorkflowFile -FilePath $workflow.Key -WorkflowName $workflow.Value
}

# Show summary
Show-TestSummary

# Provide recommendations
if ($testResults.FailedTests -gt 0) {
  Write-Host "`n💡 Recommendations:" -ForegroundColor Yellow
  Write-Host "• Fix the issues listed above"
  Write-Host "• Run the setup script: .\setup-workflows.ps1 -All"
  Write-Host "• Test workflows on a feature branch first"
  Write-Host "• Check the GitHub Actions tab for detailed error messages"
}
else {
  Write-Host "`n🎉 Your workflows are ready to go!" -ForegroundColor Green
  Write-Host "• Create a test branch and push to test the workflows"
  Write-Host "• Monitor the first few runs in the Actions tab"
  Write-Host "• Configure optional integrations for enhanced features"
}

Write-Host "`n🔗 Useful links:" -ForegroundColor Cyan
Write-Host "• GitHub Actions: https://github.com/$env:GITHUB_REPOSITORY/actions"
Write-Host "• Repository Settings: https://github.com/$env:GITHUB_REPOSITORY/settings"
Write-Host "• Secrets: https://github.com/$env:GITHUB_REPOSITORY/settings/secrets/actions"
