# 🍎 iOS Development Optimization on Windows

This document outlines the iOS development tools and optimizations set up for the Health app that work on Windows without requiring Xcode.

## 🛠️ Tools & Scripts Created

### 1. Swift Linting (`swift-lint-windows.ps1`)

**Location**: `ios/scripts/swift-lint-windows.ps1`

**Features**:

- ✅ Cross-platform Swift syntax validation
- ✅ Brace matching detection
- ✅ Import statement validation
- ✅ SwiftUI/UIKit pattern checking
- ✅ Async/await usage validation
- ✅ Force unwrap detection (warns if >5 per file)
- ✅ HealthKit authorization pattern checking
- ✅ WebSocket error handling validation
- ✅ Line length checks (120 char limit)
- ✅ Project structure validation

**Usage**:

```powershell
# Lint all Swift files
.\ios\scripts\swift-lint-windows.ps1

# Lint specific file
.\ios\scripts\swift-lint-windows.ps1 -File "ContentView.swift"

# Detailed analysis
.\ios\scripts\swift-lint-windows.ps1 -Detailed
```

### 2. Swift Formatting (`swift-format-windows.ps1`)

**Location**: `ios/scripts/swift-format-windows.ps1`

**Features**:

- 🎨 Normalizes line endings to LF
- 🎨 Removes trailing whitespace
- 🎨 Fixes operator spacing
- 🎨 Fixes comma and colon spacing
- 🎨 Normalizes brace spacing
- 🎨 Sorts import statements
- 🎨 Converts 4-space to 2-space indentation
- 🎨 Ensures single blank line at end of file

**Usage**:

```powershell
# Format all Swift files
.\ios\scripts\swift-format-windows.ps1

# Preview changes without applying
.\ios\scripts\swift-format-windows.ps1 -DryRun

# Format specific file
.\ios\scripts\swift-format-windows.ps1 -File "ApiClient.swift"
```

### 3. Development Setup (`setup-ios-dev-windows.ps1`)

**Location**: `ios/scripts/setup-ios-dev-windows.ps1`

**Features**:

- 📦 Installs VS Code extensions for iOS development
- ⚙️ Configures VS Code settings for Swift
- 📋 Creates VS Code tasks for Swift operations
- 📝 Updates .gitignore with iOS patterns
- ✅ Validates current setup

**Usage**:

```powershell
# Full setup (recommended first run)
.\ios\scripts\setup-ios-dev-windows.ps1 -All

# Install extensions only
.\ios\scripts\setup-ios-dev-windows.ps1 -InstallExtensions

# Setup linting only
.\ios\scripts\setup-ios-dev-windows.ps1 -SetupLinting
```

### 4. Enhanced Error Checking (`Check-SwiftErrors.ps1`)

**Location**: `ios/HealthKitBridge/scripts/Check-SwiftErrors.ps1` (already existed, enhanced)

**Features**:

- 🔍 Detailed Swift compilation error analysis
- 📂 Required file validation
- ⚙️ Config.plist validation
- 🎯 Specific error pattern detection

## 🎯 VS Code Integration

### Tasks Available (Ctrl+Shift+P → "Tasks: Run Task")

- **iOS: Setup Development Tools** - Complete iOS dev environment setup
- **iOS: Swift Lint** - Run Swift linting on all files
- **iOS: Swift Format** - Format all Swift files
- **iOS: Check Swift Errors** - Detailed error analysis
- **iOS: Format Check (Dry Run)** - Preview formatting changes

### NPM Scripts (from project root)

```bash
npm run ios:setup    # Complete iOS development setup
npm run ios:lint     # Swift linting
npm run ios:format   # Swift formatting
npm run ios:check    # Swift error checking
```

## 📦 VS Code Extensions Installed

The setup script installs these extensions:

- `ms-vscode.swift` - Swift Language Support
- `ms-vscode.vscode-ios` - iOS Development Tools
- `sswg.swift-lang` - Swift Language Server
- `github.copilot` - GitHub Copilot
- `github.copilot-chat` - GitHub Copilot Chat
- `ms-vscode.vscode-json` - JSON support
- `redhat.vscode-yaml` - YAML support
- `ms-python.python` - Python (for scripts)
- `ms-vscode.powershell` - PowerShell support

## ⚙️ Configuration Files

### VS Code Settings (`ios/.vscode/settings.json`)

```json
{
  "swift.path": "",
  "swift.SDK": "",
  "files.associations": {
    "*.swift": "swift",
    "*.plist": "xml"
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "[swift]": {
    "editor.defaultFormatter": "ms-vscode.swift",
    "editor.formatOnSave": true
  }
}
```

### SwiftLint Configuration (`.swiftlint.yml`)

Already configured with:

- ✅ 40+ Swift linting rules
- ✅ HealthKit-specific custom rules
- ✅ WebSocket error handling rules
- ✅ Proper file/line length limits
- ✅ Force unwrapping warnings

## 🔍 Validation Rules

### Syntax Validation

- Brace matching
- Import statement presence
- Basic Swift syntax patterns

### SwiftUI/UIKit Patterns

- `@StateObject` with `ObservableObject` conformance
- `@Published` property validation
- Async/await pattern checking

### HealthKit Specific

- Authorization checks before HealthKit operations
- Proper error handling patterns

### Code Quality

- Force unwrap detection (warns if >5 per file)
- Line length enforcement (120 chars)
- Consistent spacing and formatting

## 🚀 Workflow

### Daily Development

1. **Before coding**: `npm run ios:lint` to check current state
2. **During coding**: VS Code will show Swift syntax highlighting and basic errors
3. **Before committing**:
   - `npm run ios:format` to format code
   - `npm run ios:lint` to validate
   - `npm run ios:check` for detailed error analysis

### Troubleshooting Build Issues

1. Run `npm run ios:check` for detailed diagnostics
2. Review any missing files or configuration issues
3. Fix errors and re-run validation
4. Build in Xcode

## 🎯 Benefits

### For Windows Development

- ✅ No need for Xcode to validate Swift code
- ✅ Consistent code formatting across team
- ✅ Early error detection before Xcode build
- ✅ Integrated with existing VS Code workflow

### Code Quality

- ✅ Enforces consistent Swift style
- ✅ Catches common SwiftUI/HealthKit issues
- ✅ Validates project structure
- ✅ Ensures proper error handling patterns

### Team Collaboration

- ✅ Standardized formatting rules
- ✅ Automated validation in CI/CD (future)
- ✅ Clear error reporting and fixes
- ✅ Documentation of iOS-specific patterns

## 📚 Learning Resources

The linting rules help teach:

- Swift best practices
- SwiftUI state management patterns
- HealthKit authorization flows
- Async/await proper usage
- Error handling patterns

## 🔧 Customization

### Adding Custom Rules

Edit `.swiftlint.yml` to add project-specific rules:

```yaml
custom_rules:
  your_custom_rule:
    name: 'Your Rule Name'
    regex: 'pattern_to_match'
    message: 'Error message'
    severity: warning
```

### Modifying Formatting

Adjust `swift-format-windows.ps1` to change:

- Indentation (currently 2-space)
- Line length limits
- Spacing rules
- Import organization

This setup provides comprehensive iOS development support on Windows, helping maintain code quality and catch issues early in the development process.
