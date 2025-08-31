# 📱 iOS Build Simulator for Windows
# Simulates Xcode build process and identifies potential issues before building

param(
    [switch]$Verbose = $false,
    [switch]$FixIssues = $false,
    [string]$Configuration = "Debug"
)

Write-Host "📱 iOS Build Simulation" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Configuration: $Configuration" -ForegroundColor White
Write-Host "Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

# Change to iOS directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

$buildIssues = @()
$warnings = @()
$suggestions = @()

# Check Xcode project structure
Write-Host "🏗️  Analyzing Xcode Project Structure" -ForegroundColor Green
Write-Host ""

$projectFile = "HealthKitBridge.xcodeproj/project.pbxproj"
if (Test-Path $projectFile) {
    Write-Host "✅ Xcode project file exists" -ForegroundColor Green

    $projectContent = Get-Content $projectFile -Raw

    # Check for common project issues
    if ($projectContent -match "DEVELOPMENT_TEAM = ") {
        Write-Host "✅ Development team configured" -ForegroundColor Green
    } else {
        $buildIssues += "❌ Development team not configured - required for device builds"
    }

    if ($projectContent -match "PRODUCT_BUNDLE_IDENTIFIER") {
        Write-Host "✅ Bundle identifier configured" -ForegroundColor Green
    } else {
        $buildIssues += "❌ Bundle identifier missing"
    }

    # Check for HealthKit entitlements
    if ($projectContent -match "HealthKit") {
        Write-Host "✅ HealthKit framework referenced" -ForegroundColor Green
    } else {
        $warnings += "⚠️  HealthKit framework may not be properly linked"
    }

} else {
    $buildIssues += "❌ Xcode project file missing: $projectFile"
}

# Check entitlements
Write-Host ""
Write-Host "🔐 Checking Entitlements and Permissions" -ForegroundColor Green

$entitlementsFile = "HealthKitBridge/HealthKitBridge.entitlements"
if (Test-Path $entitlementsFile) {
    Write-Host "✅ Entitlements file exists" -ForegroundColor Green

    $entitlements = Get-Content $entitlementsFile -Raw
    if ($entitlements -match "com.apple.developer.healthkit") {
        Write-Host "✅ HealthKit entitlement configured" -ForegroundColor Green
    } else {
        $buildIssues += "❌ HealthKit entitlement missing in entitlements file"
    }
} else {
    $buildIssues += "❌ Entitlements file missing: $entitlementsFile"
}

# Check Info.plist
Write-Host ""
Write-Host "📄 Analyzing Info.plist Configuration" -ForegroundColor Green

$infoPlistFile = "Info.plist"
if (Test-Path $infoPlistFile) {
    Write-Host "✅ Info.plist exists" -ForegroundColor Green

    $infoPlist = Get-Content $infoPlistFile -Raw

    # Check for required HealthKit usage descriptions
    $requiredKeys = @(
        "NSHealthShareUsageDescription",
        "NSHealthUpdateUsageDescription"
    )

    foreach ($key in $requiredKeys) {
        if ($infoPlist -match $key) {
            Write-Host "✅ $key configured" -ForegroundColor Green
        } else {
            $buildIssues += "❌ Missing required key: $key"
        }
    }

    # Check for app transport security
    if ($infoPlist -match "NSAppTransportSecurity") {
        if ($infoPlist -match "NSAllowsArbitraryLoads.*true") {
            $warnings += "⚠️  ATS allows arbitrary loads - consider restricting for production"
        } else {
            Write-Host "✅ App Transport Security configured" -ForegroundColor Green
        }
    } else {
        $suggestions += "💡 Consider configuring App Transport Security for network requests"
    }

} else {
    $buildIssues += "❌ Info.plist missing: $infoPlistFile"
}

# Check Swift source files for build issues
Write-Host ""
Write-Host "📝 Analyzing Swift Source Files" -ForegroundColor Green

$swiftFiles = Get-ChildItem -Path "HealthKitBridge" -Filter "*.swift" -Recurse
$importIssues = @()
$deprecationWarnings = @()

foreach ($file in $swiftFiles) {
    if ($file.FullName) {
        $content = Get-Content $file.FullName -Raw
        $fileName = $file.Name

        # Check for missing imports
        if ($content -match "@Published|@StateObject|@ObservedObject" -and $content -notmatch "import SwiftUI") {
            $importIssues += "❌ ${fileName}: Uses SwiftUI features without importing SwiftUI"
        }

        if ($content -match "HKHealthStore|HKQuantity|HKSample" -and $content -notmatch "import HealthKit") {
            $importIssues += "❌ ${fileName}: Uses HealthKit without importing HealthKit"
        }

        # Check for deprecated patterns
        if ($content -match "UIApplication\.shared\.windows") {
            $deprecationWarnings += "⚠️  ${fileName}: Uses deprecated UIApplication.shared.windows"
        }

        if ($content -match "\.makeUIViewController") {
            $suggestions += "💡 ${fileName}: Consider using newer UIViewControllerRepresentable patterns"
        }

        # Check for memory leaks patterns
        if ($content -match "\[self\]" -and $content -notmatch "\[weak self\]|\[unowned self\]") {
            $warnings += "⚠️  ${fileName}: Strong self capture in closure may cause memory leaks"
        }
    }
}

# Display import issues
if ($importIssues.Count -gt 0) {
    $buildIssues += $importIssues
}

# Check for asset catalog
Write-Host ""
Write-Host "🎨 Checking Assets and Resources" -ForegroundColor Green

$assetsPath = "HealthKitBridge/Assets.xcassets"
if (Test-Path $assetsPath) {
    Write-Host "✅ Asset catalog exists" -ForegroundColor Green

    $appIconPath = Join-Path $assetsPath "AppIcon.appiconset"
    if (Test-Path $appIconPath) {
        Write-Host "✅ App icon set configured" -ForegroundColor Green
    } else {
        $warnings += "⚠️  App icon set missing - may cause App Store issues"
    }
} else {
    $warnings += "⚠️  Asset catalog missing: $assetsPath"
}

# Check Config.plist for build configuration
Write-Host ""
Write-Host "⚙️  Validating Build Configuration" -ForegroundColor Green

$configFile = "HealthKitBridge/Config.plist"
if (Test-Path $configFile) {
    $config = Get-Content $configFile -Raw

    # Check for development vs production URLs
    if ($config -match "localhost|127\.0\.0\.1|\.dev") {
        if ($Configuration -eq "Release") {
            $warnings += "⚠️  Config.plist contains development URLs in Release configuration"
        } else {
            Write-Host "✅ Development configuration detected" -ForegroundColor Green
        }
    }

    # Check for required configuration keys
    $requiredConfigKeys = @("apiBaseURL", "webSocketURL", "userId")
    foreach ($key in $requiredConfigKeys) {
        if ($config -match $key) {
            Write-Host "✅ Configuration key '$key' present" -ForegroundColor Green
        } else {
            $buildIssues += "❌ Missing configuration key: $key"
        }
    }
} else {
    $buildIssues += "❌ Configuration file missing: $configFile"
}

# Generate build report
Write-Host ""
Write-Host "📊 BUILD SIMULATION REPORT" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

if ($buildIssues.Count -eq 0) {
    Write-Host "🎉 No critical build issues found!" -ForegroundColor Green
    Write-Host "🚀 Project should build successfully in Xcode" -ForegroundColor Green
} else {
    Write-Host "❌ Found $($buildIssues.Count) critical issues that will prevent building:" -ForegroundColor Red
    foreach ($issue in $buildIssues) {
        Write-Host "   $issue" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   $warning" -ForegroundColor Yellow
    }
}

if ($deprecationWarnings.Count -gt 0) {
    Write-Host ""
    Write-Host "🔄 Deprecation Warnings ($($deprecationWarnings.Count)):" -ForegroundColor Magenta
    foreach ($warning in $deprecationWarnings) {
        Write-Host "   $warning" -ForegroundColor Magenta
    }
}

if ($suggestions.Count -gt 0) {
    Write-Host ""
    Write-Host "💡 Suggestions for Improvement ($($suggestions.Count)):" -ForegroundColor Cyan
    foreach ($suggestion in $suggestions) {
        Write-Host "   $suggestion" -ForegroundColor Cyan
    }
}

# Auto-fix suggestions
if ($FixIssues -and $buildIssues.Count -gt 0) {
    Write-Host ""
    Write-Host "🔧 ATTEMPTING AUTO-FIXES" -ForegroundColor Yellow
    Write-Host "========================" -ForegroundColor Yellow

    # Here you could add auto-fix logic for common issues
    Write-Host "⚠️  Auto-fix feature not implemented yet" -ForegroundColor Yellow
    Write-Host "💡 Run with -Verbose flag for detailed fix instructions" -ForegroundColor Cyan
}

# Detailed instructions
if ($Verbose) {
    Write-Host ""
    Write-Host "🛠️  DETAILED FIX INSTRUCTIONS" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan

    if ($buildIssues -contains "❌ Development team not configured - required for device builds") {
        Write-Host ""
        Write-Host "🔧 To fix Development Team issue:" -ForegroundColor Yellow
        Write-Host "   1. Open HealthKitBridge.xcodeproj in Xcode" -ForegroundColor White
        Write-Host "   2. Select the project in navigator" -ForegroundColor White
        Write-Host "   3. Go to Signing & Capabilities tab" -ForegroundColor White
        Write-Host "   4. Select your Apple Developer team" -ForegroundColor White
    }

    foreach ($issue in $buildIssues) {
        if ($issue -match "Missing required key: (.*?)$") {
            $missingKey = $Matches[1]
            Write-Host ""
            Write-Host "🔧 To fix missing ${missingKey}:" -ForegroundColor Yellow
            Write-Host "   1. Open Info.plist in Xcode" -ForegroundColor White
            Write-Host "   2. Add key '$missingKey' with appropriate description" -ForegroundColor White
            Write-Host "   3. Provide user-friendly explanation for HealthKit usage" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Fix critical issues (❌) before building" -ForegroundColor White
Write-Host "  2. Address warnings (⚠️) for better app quality" -ForegroundColor White
Write-Host "  3. Consider suggestions (💡) for best practices" -ForegroundColor White
Write-Host "  4. Run build simulation again after fixes" -ForegroundColor White
Write-Host "  5. Build in Xcode (⌘+B)" -ForegroundColor White

if ($buildIssues.Count -gt 0) {
    exit 1
} else {
    exit 0
}
