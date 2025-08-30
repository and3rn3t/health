# Start WebSocket Server - PowerShell Script
# ==========================================

Write-Host "🚀 Starting Health Monitoring WebSocket Server..." -ForegroundColor Cyan

# Check if server directory exists
if (-Not (Test-Path "server")) {
    Write-Host "❌ Server directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Navigate to server directory and start
try {
    Push-Location server
    Write-Host "📁 Changed to server directory" -ForegroundColor Green

    # Check if node_modules exists
    if (-Not (Test-Path "node_modules")) {
        Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
        npm install
    }

    Write-Host "🔄 Starting WebSocket server on port 3001..." -ForegroundColor Yellow
    Write-Host "🌐 WebSocket endpoint: ws://localhost:3001" -ForegroundColor Cyan
    Write-Host "🔗 REST API endpoint: http://localhost:3001/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""

    # Start the server
    node websocket-server.js

} catch {
    Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
