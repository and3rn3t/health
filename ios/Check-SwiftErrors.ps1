# 🔍 Swift Error Diagnostic Script for Windows
# Run this in PowerShell to check Swift compilation errors

Write-Host "🔍 Swift Error Diagnostic Report" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host "Directory: $(Get-Location)" -ForegroundColor White
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "HealthKitBridgeApp.swift")) {
    Write-Host "❌ Error: Not in iOS project directory" -ForegroundColor Red
    Write-Host "Please navigate to the ios/ folder first" -ForegroundColor Yellow
    exit 1
}

Write-Host "📂 Swift files in directory:" -ForegroundColor Green
Get-ChildItem -Name "*.swift"
Write-Host ""

Write-Host "🔧 Checking Swift files for common issues:" -ForegroundColor Green
Write-Host ""

# Check each Swift file
$swiftFiles = Get-ChildItem "*.swift"
foreach ($file in $swiftFiles) {
    Write-Host "Checking $($file.Name)..." -ForegroundColor Yellow

    $content = Get-Content $file.FullName -Raw

    # Basic checks
    if ($content -match "import ") {
        Write-Host "✅ $($file.Name): Has import statements" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $($file.Name): No import statements found" -ForegroundColor Yellow
    }

    if ($content -match "(class|struct|enum|protocol) ") {
        Write-Host "✅ $($file.Name): Has type definitions" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $($file.Name): No type definitions found" -ForegroundColor Yellow
    }

    # Check for common errors
    if ($content -match "AppConfig\.load") {
        Write-Host "❌ $($file.Name): Uses old AppConfig.load() - should be AppConfig.shared" -ForegroundColor Red
    }

    if ($content -match "ApiClient\(\)") {
        Write-Host "❌ $($file.Name): Tries to initialize ApiClient - should use ApiClient.shared" -ForegroundColor Red
    }

    # Check for missing dependencies
    if ($content -match "HealthKitManager\(\)") {
        if (-not (Test-Path "HealthKitManager.swift")) {
            Write-Host "❌ $($file.Name): References HealthKitManager but file is missing" -ForegroundColor Red
        }
    }

    if ($content -match "WebSocketManager\(\)") {
        if (-not (Test-Path "WebSocketManager.swift")) {
            Write-Host "❌ $($file.Name): References WebSocketManager but file is missing" -ForegroundColor Red
        }
    }

    Write-Host ""
}

Write-Host "📋 Required files check:" -ForegroundColor Green
Write-Host ""

$requiredFiles = @(
    "HealthKitBridgeApp.swift",
    "ContentView.swift",
    "HealthKitManager.swift",
    "WebSocketManager.swift",
    "ApiClient.swift",
    "AppConfig.swift",
    "Config.plist"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MISSING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 Config.plist validation:" -ForegroundColor Green
if (Test-Path "Config.plist") {
    Write-Host "✅ Config.plist exists" -ForegroundColor Green
    Write-Host "📝 Config.plist contents:" -ForegroundColor White
    Get-Content "Config.plist"
} else {
    Write-Host "❌ Config.plist is missing!" -ForegroundColor Red
    Write-Host "You need to create Config.plist with:" -ForegroundColor Yellow
    Write-Host "- API_BASE_URL: http://127.0.0.1:8789" -ForegroundColor White
    Write-Host "- WS_URL: ws://localhost:3001" -ForegroundColor White
    Write-Host "- USER_ID: demo-user" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create any missing Swift files (see red X's above)" -ForegroundColor White
Write-Host "2. Fix syntax errors in existing files" -ForegroundColor White
Write-Host "3. Ensure Config.plist has correct values" -ForegroundColor White
Write-Host "4. Replace problematic files with .fixed versions" -ForegroundColor White
Write-Host "5. Try building in Xcode again" -ForegroundColor White
Write-Host ""
Write-Host "💾 This output can help diagnose the 99 errors!" -ForegroundColor Green
