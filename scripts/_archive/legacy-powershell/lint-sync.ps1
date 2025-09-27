# Linting Configuration Sync Script
# Validates and synchronizes ESLint, SonarLint, and TypeScript configurations

param(
    [switch]$Check,
    [switch]$Fix,
    [switch]$Verbose,
    [switch]$ResetSonar
)

Write-Host "🔍 Linting Configuration Sync" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Function to check if VS Code is running
function Test-VSCodeRunning {
    $vscodeProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue
    return $vscodeProcesses.Count -gt 0
}

# Function to restart VS Code workspace
function Restart-VSCodeWorkspace {
    if ($global:VSCODE_PID) {
        Write-Host "📱 Reloading VS Code workspace..." -ForegroundColor Yellow
        # VS Code command to reload window
        code --command "workbench.action.reloadWindow"
        Start-Sleep 2
    } else {
        Write-Host "ℹ️  Manually reload VS Code window (Ctrl+Shift+P -> Developer: Reload Window)" -ForegroundColor Cyan
    }
}

# Check ESLint configuration
Write-Host "📋 ESLint Status:" -ForegroundColor Green
try {
    $eslintResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ ESLint: Passing" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ESLint: Issues found" -ForegroundColor Red
        if ($Verbose) { Write-Host $eslintResult }
    }
} catch {
    Write-Host "  ❌ ESLint: Configuration error" -ForegroundColor Red
}

# Check TypeScript compilation
Write-Host "📋 TypeScript Status:" -ForegroundColor Green
try {
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ TypeScript: No type errors" -ForegroundColor Green
    } else {
        Write-Host "  ❌ TypeScript: Type errors found" -ForegroundColor Red
        if ($Verbose) { Write-Host $tscResult }
    }
} catch {
    Write-Host "  ❌ TypeScript: Compilation error" -ForegroundColor Red
}

# Check SonarLint configuration
Write-Host "📋 SonarLint Status:" -ForegroundColor Green
$sonarlintConfig = ".sonarlint/settings.json"
if (Test-Path $sonarlintConfig) {
    Write-Host "  ✅ SonarLint: Configuration found" -ForegroundColor Green

    $config = Get-Content $sonarlintConfig | ConvertFrom-Json
    $disabledRules = ($config.rules | Get-Member -MemberType NoteProperty | Where-Object { $config.rules.$($_.Name) -eq "off" }).Count
    Write-Host "  📊 Disabled rules: $disabledRules" -ForegroundColor Cyan

    if ($Verbose) {
        Write-Host "  🔧 Disabled SonarLint rules:" -ForegroundColor Yellow
        $config.rules | Get-Member -MemberType NoteProperty | Where-Object { $config.rules.$($_.Name) -eq "off" } | ForEach-Object {
            Write-Host "    - $($_.Name)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ⚠️  SonarLint: No configuration file found" -ForegroundColor Yellow
}

# Check VS Code settings
Write-Host "📋 VS Code Settings:" -ForegroundColor Green
$vscodeSettings = ".vscode/settings.json"
if (Test-Path $vscodeSettings) {
    $settings = Get-Content $vscodeSettings -Raw | ConvertFrom-Json

    # Check SonarLint settings in VS Code
    if ($settings."sonarlint.rules") {
        $vscodeDisabledRules = ($settings."sonarlint.rules" | Get-Member -MemberType NoteProperty | Where-Object { $settings."sonarlint.rules".$($_.Name) -eq "off" }).Count
        Write-Host "  ✅ VS Code SonarLint rules: $vscodeDisabledRules disabled" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  VS Code: No SonarLint rules configured" -ForegroundColor Yellow
    }

    # Check ESLint settings
    if ($settings."eslint.validate") {
        Write-Host "  ✅ VS Code ESLint: Configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  VS Code ESLint: Not configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ VS Code: Settings file not found" -ForegroundColor Red
}

# Reset SonarLint if requested
if ($ResetSonar) {
    Write-Host "🔄 Resetting SonarLint..." -ForegroundColor Yellow

    # Clear SonarLint cache
    $sonarlintCache = "$env:USERPROFILE\.sonarlint"
    if (Test-Path $sonarlintCache) {
        Remove-Item $sonarlintCache -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Cleared SonarLint cache" -ForegroundColor Green
    }

    # Restart VS Code workspace to reload SonarLint
    Restart-VSCodeWorkspace
}

# Fix issues if requested
if ($Fix) {
    Write-Host "🔧 Fixing linting issues..." -ForegroundColor Yellow

    try {
        npm run lint:fix
        Write-Host "  ✅ ESLint auto-fix completed" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ESLint auto-fix failed" -ForegroundColor Red
    }

    try {
        npm run format
        Write-Host "  ✅ Prettier formatting completed" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Prettier formatting failed" -ForegroundColor Red
    }
}

# Summary and recommendations
Write-Host ""
Write-Host "📊 Configuration Summary:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if (Test-VSCodeRunning) {
    Write-Host "🔄 VS Code is running - configuration changes may require window reload" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Magenta
Write-Host "1. Reload VS Code window if SonarLint rules still showing" -ForegroundColor White
Write-Host "2. Check Problems panel for updated error list" -ForegroundColor White
Write-Host "3. Run 'npm run lint' to verify ESLint alignment" -ForegroundColor White
Write-Host "4. Use '-ResetSonar' flag if SonarLint cache issues persist" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Available commands:" -ForegroundColor Green
Write-Host "  lint-sync.ps1 -Check     # Check configuration status" -ForegroundColor Gray
Write-Host "  lint-sync.ps1 -Fix       # Auto-fix ESLint and format code" -ForegroundColor Gray
Write-Host "  lint-sync.ps1 -ResetSonar # Reset SonarLint cache and reload" -ForegroundColor Gray
Write-Host "  lint-sync.ps1 -Verbose   # Show detailed configuration info" -ForegroundColor Gray
