# VitalSense Terminal Initializer
# This script is called by VS Code terminal profiles to initialize the VitalSense development environment
# Created: September 27, 2025

param(
    [string]$WorkspaceRoot = $PWD,
    [switch]$Verbose
)

# Clear any existing profiles to avoid conflicts
if ($PROFILE -and (Test-Path $PROFILE)) {
    Write-Host "🔄 Bypassing global PowerShell profile..." -ForegroundColor Yellow
}

# Load VitalSense unified profile
$unifiedProfilePath = Join-Path $WorkspaceRoot "scripts\unified-profile-loader.ps1"

if (Test-Path $unifiedProfilePath) {
    if ($Verbose) {
        Write-Host "📂 Loading VitalSense profile from: $unifiedProfilePath" -ForegroundColor Cyan
    }
    . $unifiedProfilePath
} else {
    Write-Warning "VitalSense profile not found at: $unifiedProfilePath"
    Write-Host "💙 VitalSense Development Environment (Basic)" -ForegroundColor Blue
}

# Display welcome message
Write-Host ""
Write-Host "🚀 VitalSense Terminal Ready!" -ForegroundColor Green
Write-Host "   Available commands: reload, ctx, ios, root" -ForegroundColor Gray
Write-Host "   Swift commands: sa, sd, ss, Get-iOS26Features" -ForegroundColor Gray
Write-Host ""
