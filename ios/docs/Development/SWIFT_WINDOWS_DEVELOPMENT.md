# Swift Development on Windows Guide

## 🚀 Overview

This guide provides comprehensive Swift development support for Windows using Docker containerization, VS Code integration, and PowerShell automation.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#️-prerequisites)
- [Development Tools](#-development-tools)
- [VS Code Integration](#️-vs-code-integration)
- [SwiftLint Configuration](#-swiftlint-configuration)
- [Docker-based Development](#-docker-based-development)
- [Troubleshooting](#-troubleshooting)

## ⚡ Quick Start

1. **Setup Environment**:

   ```powershell
   .\scripts\swift-windows-toolkit.ps1 -Action setup
   ```

2. **Run Environment Diagnostics**:

   ```powershell
   .\scripts\swift-windows-toolkit.ps1 -Action doctor
   ```

3. **Lint Swift Code**:

   ```powershell
   .\scripts\swift-windows-toolkit.ps1 -Action lint -UseDocker
   ```

4. **Complete Development Workflow**:

   ```powershell
   .\scripts\swift-windows-toolkit.ps1 -Action all -UseDocker
   ```

## 🛠️ Prerequisites

### Required Tools

- **Docker Desktop**: For containerized Swift tooling
- **PowerShell 7+**: For automation scripts
- **VS Code**: With Swift extension support
- **Git**: For version control

### Installation Steps

1. **Install Docker Desktop**:
   - Download from [docker.com](https://docker.com/products/docker-desktop)
   - Enable Windows Subsystem for Linux (WSL2)

2. **Install PowerShell 7**:

   ```powershell
   winget install Microsoft.PowerShell
   ```

3. **Install VS Code Extensions**:
   - Swift Language Support
   - Apple Swift Format
   - Docker Integration
   - PowerShell Extension

## 🧰 Development Tools

### Swift Windows Toolkit

The `swift-windows-toolkit.ps1` script provides unified Swift development capabilities:

| Action | Description | Usage |
|--------|-------------|-------|
| `setup` | Install Docker images and setup environment | `.\scripts\swift-windows-toolkit.ps1 -Action setup` |
| `doctor` | Diagnose environment issues | `.\scripts\swift-windows-toolkit.ps1 -Action doctor` |
| `lint` | Run SwiftLint with Docker | `.\scripts\swift-windows-toolkit.ps1 -Action lint -UseDocker` |
| `format` | Format Swift code | `.\scripts\swift-windows-toolkit.ps1 -Action format -UseDocker` |
| `build` | Build Swift project | `.\scripts\swift-windows-toolkit.ps1 -Action build -UseDocker` |
| `all` | Complete workflow | `.\scripts\swift-windows-toolkit.ps1 -Action all -UseDocker` |

### Key Features

✅ **Docker Integration**: Containerized Swift tooling for Windows  
✅ **SwiftLint Support**: Code quality and style checking  
✅ **Swift Format**: Automatic code formatting  
✅ **VS Code Integration**: Tasks, debugging, and IntelliSense  
✅ **Problem Matching**: Errors and warnings in VS Code Problems panel  
✅ **Batch Processing**: Process multiple Swift files efficiently  

## 🖥️ VS Code Integration

### Available Tasks

Access via `Ctrl+Shift+P` → "Tasks: Run Task":

- **🚀 Swift: Complete Workflow** - Lint + Format + Build (Default)
- **🔍 Swift: Lint Only** - Quick linting check
- **🔧 Swift: Lint + Fix** - Auto-fix lint violations
- **🎨 Swift: Format Files** - Format code using swift-format
- **🔨 Swift: Build Project** - Docker-based build
- **⚙️ Swift: Setup Environment** - Install Docker images
- **🩺 Swift: Environment Doctor** - Diagnose issues
- **📊 Swift: Analyze Code Quality** - Codebase statistics
- **🔍 Swift: Find iOS 26 Features** - Scan for iOS 26 enhancements

### Keyboard Shortcuts

- `Ctrl+Shift+P` → "Swift: Complete Workflow" (Default build task)
- `Ctrl+Shift+\`` → Open integrated terminal with Swift environment
- `F5` → Launch Swift debugging configuration

### Editor Features

- **Syntax Highlighting**: Full Swift syntax support
- **IntelliSense**: Code completion and navigation
- **Error Highlighting**: Real-time error detection
- **Format on Save**: Automatic code formatting
- **Problem Panel**: Integrated SwiftLint warnings and errors

## 📏 SwiftLint Configuration

### Current Rules

The `.swiftlint.yml` configuration includes:

```yaml
# Key Rules for VitalSense
line_length: 150  # Maximum line length
type_body_length: 800  # Maximum type length
file_length: 600  # Maximum file length
identifier_name:
  min_length: 2
  max_length: 60
```

### Important Rules for iOS 26 Code

- **Line length**: Keep under 150 characters (120 preferred)
- **Multi-line arguments**: Break long function calls
- **Conditional returns**: Put return statements on new lines
- **Force unwrapping**: Use safe unwrapping patterns

### Example Compliant Code

```swift
// ✅ GOOD - SwiftLint Compliant
let payload = GaitAnalysisPayload(
    userId: userId,
    deviceId: "combined_iphone_watch",
    gait: watchGaitMetrics,
    fallRisk: fallRisk,
    balance: balanceAssessment,
    mobility: dailyMobilityTrends
)

// ✅ GOOD - iOS 26 Variable Draw Animation
if #available(iOS 26.0, *) {
    Image(systemName: "heart.fill")
        .symbolEffect(
            .variableColor.iterative.dimInactiveLayers.nonReversing,
            options: .speed(1.0),
            value: animationTrigger
        )
}
```

## 🐳 Docker-based Development

### Supported Containers

1. **SwiftLint Container**:

   ```bash
   ghcr.io/realm/swiftlint:latest
   ```

2. **Swift Development Container**:

   ```bash
   swift:latest
   ```

### Volume Mounting

Scripts automatically mount the project directory:

```bash
docker run --rm -v "C:/git/health/ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace
```

### Benefits

- **Consistent Environment**: Same tools across all Windows machines
- **No Local Installation**: Swift tools run in containers
- **Latest Versions**: Always use latest SwiftLint and Swift tools
- **Isolation**: Development tools don't affect host system

## 🚨 Troubleshooting

### Common Issues

#### 1. Docker Not Found

**Error**: `docker: command not found`

**Solution**:

```powershell
# Install Docker Desktop
winget install Docker.DockerDesktop

# Restart VS Code after installation
```

#### 2. SwiftLint Container Fails

**Error**: `Failed to pull SwiftLint image`

**Solution**:

```powershell
# Manual pull
docker pull ghcr.io/realm/swiftlint:latest

# Check Docker daemon is running
docker version
```

#### 3. Line Length Violations

**Error**: `Line should be 120 characters or less: currently 156 characters`

**Solution**:

```swift
// Break long lines using continuation
let longFunctionCall = someFunction(
    parameter1: value1,
    parameter2: value2,
    parameter3: value3
)
```

#### 4. Path Issues on Windows

**Error**: `Cannot find path '/workspace'`

**Solution**:

- Ensure Docker Desktop is using WSL2 backend
- Check Windows path format in scripts
- Verify volume mounting syntax

### Environment Diagnostics

Run diagnostics to identify issues:

```powershell
.\scripts\swift-windows-toolkit.ps1 -Action doctor
```

Expected output:

```text
✅ Docker: Available
✅ SwiftLint Image: Available  
✅ Swift Image: Available
✅ Native SwiftLint: Available
📁 Swift Files: 47 found
✅ SwiftLint Config: Found
🎉 All checks passed! Swift development environment is ready.
```

### Performance Tips

1. **Use Docker BuildKit**: Enable for faster builds
2. **Volume Caching**: Docker volumes improve performance
3. **Incremental Linting**: Only lint changed files when possible
4. **VS Code Settings**: Configure file watchers to exclude build directories

## 📖 Additional Resources

- [SwiftLint Documentation](https://github.com/realm/SwiftLint)
- [Swift Format Guide](https://github.com/apple/swift-format)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/)
- [VS Code Swift Extension](https://marketplace.visualstudio.com/items?itemName=swift-server.swift)

## 🎯 Next Steps

1. Run initial setup: `.\scripts\swift-windows-toolkit.ps1 -Action setup`
2. Verify environment: `.\scripts\swift-windows-toolkit.ps1 -Action doctor`
3. Start development with VS Code tasks
4. Configure custom SwiftLint rules as needed
5. Set up continuous integration with GitHub Actions

---

*This guide enables comprehensive Swift development on Windows using modern containerization and VS Code integration.*
