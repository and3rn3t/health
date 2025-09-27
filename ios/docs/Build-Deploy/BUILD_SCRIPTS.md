# VitalSense Build Scripts Reference

*Tags: #build #automation #scripts #deployment*

## 🛠️ Complete Build Automation Guide

This document covers all build scripts available in the `Scripts/Build/` directory for VitalSense development and deployment.

## 📁 Scripts Directory Structure

```
Scripts/Build/
├── setup-enhanced-dev-env.sh      # Development environment setup
├── preflight-xcode-finalization.sh # Pre-build validation
├── build-and-run.sh               # Quick build and deploy
├── fast-build.sh                  # Fast incremental build
├── deploy-to-device.sh            # Device deployment
├── optimize-xcode.sh              # Xcode maintenance
├── signing-audit.sh               # Signing verification
└── [additional specialized scripts]
```

## 🚀 Essential Scripts

### Development Environment Setup
```bash
./Scripts/Build/setup-enhanced-dev-env.sh
```
**Purpose:** Complete development environment initialization
- Installs required dependencies
- Configures Xcode settings
- Sets up build tools and fastlane
- Validates system requirements

### Pre-flight Validation
```bash
./Scripts/Build/preflight-xcode-finalization.sh
```
**Purpose:** Pre-build project health check
- Validates project structure
- Checks signing configuration
- Verifies asset completeness
- Identifies potential build issues
- **⚠️ Always run this before major builds**

### Quick Build & Run
```bash
./Scripts/Build/build-and-run.sh
```
**Purpose:** Fast development build and simulator deployment
- Builds all targets (iOS App, Watch App, Widget)
- Deploys to iOS Simulator
- Shows build output and errors
- Optimized for development speed

### Fast Incremental Build
```bash
./Scripts/Build/fast-build.sh
```
**Purpose:** Rapid incremental compilation
- Minimal rebuild for code changes
- Skips unnecessary steps
- Ideal for frequent testing during development

## 📱 Deployment Scripts

### Device Deployment
```bash
./Scripts/Build/deploy-to-device.sh
```
**Purpose:** Deploy to connected iOS/watchOS devices
- Builds release configuration
- Handles code signing for devices
- Deploys to all connected devices
- Includes watch app installation

### Production Build
```bash
# Via Fastlane (recommended)
bundle exec fastlane ios beta
bundle exec fastlane ios release

# Direct script
./Scripts/Build/generate-production-build.sh
```

## 🔧 Maintenance Scripts

### Xcode Optimization
```bash
./Scripts/Build/optimize-xcode.sh
```
**Purpose:** Clean and optimize Xcode environment
- Clears derived data
- Removes old simulators
- Cleans build caches
- Fixes common Xcode issues

### Signing Audit
```bash
./Scripts/Build/signing-audit.sh
```
**Purpose:** Comprehensive signing verification
- Checks all target signing configurations
- Validates certificates and provisioning profiles
- Identifies signing mismatches
- Provides fix recommendations

### Asset Generation
```bash
./Scripts/Build/generate_app_icons.py
```
**Purpose:** Generate app icons from source assets
- Creates all required icon sizes
- Generates iOS, watchOS, and widget icons
- Ensures App Store compliance
- Handles different device variants

## 🧪 Testing Scripts

### Test Runner
```bash
./Scripts/Build/ios-test-runner.ps1      # PowerShell version
# Or use Xcode directly:
xcodebuild test -workspace VitalSense.xcworkspace -scheme VitalSense
```

### Performance Monitoring
```bash
./Scripts/Build/monitor-performance.sh
```
**Purpose:** Monitor app performance during development
- Tracks build times
- Monitors memory usage
- Identifies performance bottlenecks

## 🔍 Quality Assurance Scripts

### SwiftLint Integration
```bash
./Scripts/Build/swiftlint-precheck.ps1
./Scripts/Build/swift-lint-windows.ps1
```
**Purpose:** Code quality enforcement
- Runs SwiftLint on entire codebase
- Identifies style violations
- Ensures consistent code formatting

### Duplicate Detection
```bash
./Scripts/Build/swift-duplicate-types-scan.ps1
```
**Purpose:** Find duplicate types and resolve conflicts
- Scans for duplicate Swift types
- Identifies naming conflicts
- Helps maintain clean architecture

### Import Analysis
```bash
./Scripts/Build/swift-import-graph.ps1
./Scripts/Build/swift-public-api-surface.ps1
```
**Purpose:** Analyze code dependencies and public interfaces
- Maps import dependencies
- Documents public API surface
- Identifies circular dependencies

## 📦 Specialized Build Scripts

### WebSocket Testing
```bash
./Scripts/Build/test-websocket-server.js   # Node.js version
./Scripts/Build/test-websocket-server.py   # Python version
```
**Purpose:** Test network connectivity and real-time features

### Localization Audit
```bash
./Scripts/Build/localization-audit.js
```
**Purpose:** Validate localization completeness
- Checks for missing translations
- Validates string keys
- Ensures localization consistency

### dSYM Upload
```bash
./Scripts/Build/upload-dsyms.sh
```
**Purpose:** Upload debug symbols for crash reporting
- Uploads dSYMs to crash reporting services
- Enables detailed crash analysis
- Supports multiple crash reporting platforms

## ⚙️ Configuration Files

### Export Options
- `ExportOptions-AppStore.plist` - App Store submission configuration
- Debug/Release configurations in `Configuration/Project/`

### Build Cache Management
```bash
./Scripts/Build/build-cache-manager.sh
```
**Purpose:** Optimize build performance through intelligent caching

## 🔄 CI/CD Integration

### Fastlane Integration
All scripts integrate with Fastlane for automated deployment:

```ruby
# Fastfile lanes use these scripts
lane :preflight do
  sh("../Scripts/Build/preflight-xcode-finalization.sh")
end

lane :build_and_test do
  sh("../Scripts/Build/build-and-run.sh")
  sh("../Scripts/Build/ios-test-runner.ps1")
end
```

### GitHub Actions
Scripts are designed to work in CI/CD environments with proper error handling and logging.

## 🚨 Error Handling

### Common Script Issues

**Permission Errors:**
```bash
chmod +x Scripts/Build/*.sh
```

**Path Issues:**
- Always run scripts from project root
- Use relative paths as shown in examples

**Build Failures:**
1. Run `preflight-xcode-finalization.sh` first
2. Check `optimize-xcode.sh` for cleanup
3. Verify signing with `signing-audit.sh`

### Script Dependencies
- **Ruby/Bundler** - For Fastlane integration
- **Node.js** - For JavaScript-based tools
- **Python 3** - For Python-based utilities
- **PowerShell** - For cross-platform scripts

## 📋 Best Practices

### Development Workflow
1. **Start with:** `setup-enhanced-dev-env.sh`
2. **Before builds:** `preflight-xcode-finalization.sh`
3. **Daily development:** `fast-build.sh` or `build-and-run.sh`
4. **Before commits:** `swiftlint-precheck.ps1`
5. **Weekly maintenance:** `optimize-xcode.sh`

### Production Deployment
1. **Pre-deployment:** `preflight-xcode-finalization.sh`
2. **Signing check:** `signing-audit.sh`
3. **Asset generation:** `generate_app_icons.py`
4. **Build:** Use Fastlane lanes
5. **Upload symbols:** `upload-dsyms.sh`

---

**💡 Pro Tip:** Create aliases for frequently used scripts in your shell profile for faster access.

**Last Updated:** September 25, 2025  
**For:** VitalSense v1.0.0  
**Maintained by:** Build Engineering Team