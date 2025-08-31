# 🔧 iOS Development Setup for Windows
# Installs and configures iOS development tools that work on Windows

param(
    [switch]$InstallExtensions = $false,
    [switch]$SetupLinting = $false,
    [switch]$All = $false
)

if ($All) {
    $InstallExtensions = $true
    $SetupLinting = $true
}

Write-Host "🔧 iOS Development Setup for Windows" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$iosPath = Join-Path $PSScriptRoot ".."
if (Test-Path $iosPath) {
    Set-Location $iosPath
    Write-Host "📁 Working in: $((Get-Location).Path)" -ForegroundColor Green
} else {
    Write-Host "❌ Could not find iOS directory" -ForegroundColor Red
    exit 1
}

# Function to check if VS Code is installed
function Test-VSCode {
    try {
        $null = Get-Command code -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Function to install VS Code extension
function Install-VSCodeExtension {
    param([string]$ExtensionId, [string]$DisplayName)

    Write-Host "📦 Installing: $DisplayName" -ForegroundColor Yellow
    try {
        & code --install-extension $ExtensionId --force
        Write-Host "  ✅ Installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to install: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    return $true
}

# Install VS Code extensions for iOS development
if ($InstallExtensions) {
    Write-Host "🎯 Installing VS Code Extensions for iOS Development" -ForegroundColor Green
    Write-Host ""

    if (-not (Test-VSCode)) {
        Write-Host "❌ VS Code not found in PATH" -ForegroundColor Red
        Write-Host "Please install VS Code first: https://code.visualstudio.com/" -ForegroundColor Yellow
        exit 1
    }

    $extensions = @(
        @{ Id = "ms-vscode.swift"; Name = "Swift Language Support" },
        @{ Id = "ms-vscode.vscode-ios"; Name = "iOS Development" },
        @{ Id = "sswg.swift-lang"; Name = "Swift Language Server" },
        @{ Id = "github.copilot"; Name = "GitHub Copilot" },
        @{ Id = "github.copilot-chat"; Name = "GitHub Copilot Chat" },
        @{ Id = "ms-vscode.vscode-json"; Name = "JSON Language Support" },
        @{ Id = "redhat.vscode-yaml"; Name = "YAML Language Support" },
        @{ Id = "ms-python.python"; Name = "Python (for scripts)" },
        @{ Id = "ms-vscode.powershell"; Name = "PowerShell" }
    )

    $installed = 0
    foreach ($ext in $extensions) {
        if (Install-VSCodeExtension -ExtensionId $ext.Id -DisplayName $ext.Name) {
            $installed++
        }
    }

    Write-Host ""
    Write-Host "📊 Installed $installed of $($extensions.Count) extensions" -ForegroundColor Cyan
}

# Setup linting and validation tools
if ($SetupLinting) {
    Write-Host "🔍 Setting up Swift Linting and Validation" -ForegroundColor Green
    Write-Host ""

    # Create .vscode settings if they don't exist
    $vscodePath = ".vscode"
    if (-not (Test-Path $vscodePath)) {
        New-Item -Path $vscodePath -ItemType Directory | Out-Null
        Write-Host "📁 Created .vscode directory" -ForegroundColor Green
    }

    # Create VS Code settings for Swift
    $settingsPath = Join-Path $vscodePath "settings.json"
    $settings = @{
        "swift.path" = ""
        "swift.SDK" = ""
        "files.associations" = @{
            "*.swift" = "swift"
            "*.plist" = "xml"
        }
        "editor.tabSize" = 2
        "editor.insertSpaces" = $true
        "editor.detectIndentation" = $false
        "files.trimTrailingWhitespace" = $true
        "files.insertFinalNewline" = $true
        "files.trimFinalNewlines" = $true
        "[swift]" = @{
            "editor.defaultFormatter" = "ms-vscode.swift"
            "editor.formatOnSave" = $true
            "editor.codeActionsOnSave" = @{
                "source.organizeImports" = $true
            }
        }
        "swift.diagnostics" = $true
        "swift.buildOnSave" = $false
    } | ConvertTo-Json -Depth 4

    Set-Content -Path $settingsPath -Value $settings -Encoding UTF8
    Write-Host "⚙️  Created VS Code settings for Swift" -ForegroundColor Green

    # Create tasks.json for Swift operations
    $tasksPath = Join-Path $vscodePath "tasks.json"
    $tasks = @{
        version = "2.0.0"
        tasks = @(
            @{
                label = "Swift Lint"
                type = "shell"
                command = "pwsh"
                args = @("-NoProfile", "-File", "scripts/swift-lint-windows.ps1")
                group = "build"
                presentation = @{
                    echo = $true
                    reveal = "always"
                    focus = $false
                    panel = "shared"
                }
                problemMatcher = @()
            },
            @{
                label = "Swift Format"
                type = "shell"
                command = "pwsh"
                args = @("-NoProfile", "-File", "scripts/swift-format-windows.ps1")
                group = "build"
                presentation = @{
                    echo = $true
                    reveal = "always"
                    focus = $false
                    panel = "shared"
                }
            },
            @{
                label = "Swift Check Errors"
                type = "shell"
                command = "pwsh"
                args = @("-NoProfile", "-File", "HealthKitBridge/scripts/Check-SwiftErrors.ps1")
                group = "test"
                presentation = @{
                    echo = $true
                    reveal = "always"
                    focus = $false
                    panel = "shared"
                }
            }
        )
    } | ConvertTo-Json -Depth 4

    Set-Content -Path $tasksPath -Value $tasks -Encoding UTF8
    Write-Host "📋 Created VS Code tasks for Swift development" -ForegroundColor Green

    # Update .gitignore to exclude build artifacts
    $gitignorePath = ".gitignore"
    $gitignoreContent = @"
# Xcode
build/
DerivedData/
*.xcworkspace/xcuserdata/
*.xcodeproj/xcuserdata/
*.xccheckout
*.moved-aside

# Swift Package Manager
.build/
Packages/
Package.resolved

# iOS/macOS
*.dSYM.zip
*.ipa

# VS Code
.vscode/launch.json

# Windows
Thumbs.db
Desktop.ini

"@

    if (Test-Path $gitignorePath) {
        $existing = Get-Content $gitignorePath -Raw
        if ($existing -notmatch "# Xcode") {
            Add-Content -Path $gitignorePath -Value "`n$gitignoreContent"
            Write-Host "📝 Updated .gitignore with iOS patterns" -ForegroundColor Green
        }
    } else {
        Set-Content -Path $gitignorePath -Value $gitignoreContent -Encoding UTF8
        Write-Host "📝 Created .gitignore with iOS patterns" -ForegroundColor Green
    }
}

# Validate current setup
Write-Host "🔍 Validating Current Setup" -ForegroundColor Green
Write-Host ""

$checks = @()

# Check for required scripts
$requiredScripts = @(
    "scripts/swift-lint-windows.ps1",
    "scripts/swift-format-windows.ps1",
    "HealthKitBridge/scripts/Check-SwiftErrors.ps1"
)

foreach ($script in $requiredScripts) {
    if (Test-Path $script) {
        $checks += "✅ $script exists"
    } else {
        $checks += "❌ $script missing"
    }
}

# Check for SwiftLint config
if (Test-Path ".swiftlint.yml") {
    $checks += "✅ SwiftLint configuration exists"
} else {
    $checks += "❌ SwiftLint configuration missing"
}

# Check VS Code setup
if (Test-Path ".vscode/settings.json") {
    $checks += "✅ VS Code settings configured"
} else {
    $checks += "❌ VS Code settings not configured"
}

if (Test-Path ".vscode/tasks.json") {
    $checks += "✅ VS Code tasks configured"
} else {
    $checks += "❌ VS Code tasks not configured"
}

# Display results
foreach ($check in $checks) {
    if ($check.StartsWith("✅")) {
        Write-Host $check -ForegroundColor Green
    } else {
        Write-Host $check -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🛠️  Available Commands:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "PowerShell Scripts:" -ForegroundColor White
Write-Host "  .\scripts\swift-lint-windows.ps1           # Lint all Swift files" -ForegroundColor Gray
Write-Host "  .\scripts\swift-format-windows.ps1         # Format all Swift files" -ForegroundColor Gray
Write-Host "  .\scripts\swift-format-windows.ps1 -DryRun # Preview formatting changes" -ForegroundColor Gray
Write-Host "  .\HealthKitBridge\scripts\Check-SwiftErrors.ps1 # Detailed error analysis" -ForegroundColor Gray
Write-Host ""
Write-Host "VS Code Commands (Ctrl+Shift+P):" -ForegroundColor White
Write-Host "  'Tasks: Run Task' -> 'Swift Lint'          # Run linting" -ForegroundColor Gray
Write-Host "  'Tasks: Run Task' -> 'Swift Format'        # Run formatting" -ForegroundColor Gray
Write-Host "  'Tasks: Run Task' -> 'Swift Check Errors'  # Check for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\scripts\swift-lint-windows.ps1" -ForegroundColor White
Write-Host "  2. Fix any issues found" -ForegroundColor White
Write-Host "  3. Run: .\scripts\swift-format-windows.ps1" -ForegroundColor White
Write-Host "  4. Open project in Xcode and build" -ForegroundColor White
Write-Host ""
Write-Host "🎯 For full setup, run:" -ForegroundColor Yellow
Write-Host "  .\scripts\setup-ios-dev-windows.ps1 -All" -ForegroundColor White
