# Start Development Server - PowerShell Script
# ===========================================

Write-Host "🌐 Starting Health Monitoring Web Dashboard..." -ForegroundColor Cyan

# Check if we're in the correct directory
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow
    npm install
}

try {
    Write-Host "🔄 Starting development server..." -ForegroundColor Yellow
    Write-Host "🌐 Web dashboard will be available at: http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Make sure the WebSocket server is running on port 3001" -ForegroundColor Yellow
    Write-Host "   Use: .\start-server.ps1 in another terminal" -ForegroundColor Gray
    Write-Host "   Optionally: set window.__WS_DEVICE_TOKEN__='<jwt>' in DevTools" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the development server" -ForegroundColor Gray
    Write-Host ""

    # Start the development server
    npm run dev

} catch {
    Write-Host "❌ Failed to start development server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
