# Build & Deployment Documentation

This folder contains documentation for building, testing, and deploying the VitalSense iOS app.

## 📋 Contents

- **[BUILD_SCRIPTS.md](./BUILD_SCRIPTS.md)** - Build automation and script documentation
- **[XCODE_FINALIZATION_CHECKLIST.md](./XCODE_FINALIZATION_CHECKLIST.md)** - Pre-release checklist and validation

## 🔨 Build Process

### Development Builds

- Simulator builds for rapid testing
- Device builds for comprehensive testing
- Debug configurations with full symbol information

### Release Builds

- Optimized builds for App Store submission
- Code signing and provisioning profile management
- Archive creation and validation

## 🚀 Deployment Pipeline

### Pre-Release Checklist

The finalization checklist ensures all critical items are completed before release:

- Code quality validation
- UI/UX testing across devices
- Performance benchmarking
- Accessibility compliance
- App Store requirements verification

### Build Scripts

Automated scripts streamline the build process:

- Environment setup automation
- Dependency management
- Build configuration validation
- Archive and export processes

## 📱 Target Platforms

- **iOS App** - Main application target
- **Apple Watch App** - Companion watchOS application
- **Widgets** - Home screen widget extensions
- **Tests** - Unit and UI test targets

## 🔧 Build Requirements

- **Xcode 15.0+** - Latest development environment
- **iOS 17.0+ SDK** - Target platform SDK
- **watchOS 10.0+ SDK** - Watch target SDK
- **Apple Developer Account** - For code signing and distribution

## 📊 Quality Assurance

- **SwiftLint** - Code quality enforcement
- **Unit Tests** - Automated test coverage
- **UI Tests** - User interface validation
- **Performance Testing** - Memory and CPU profiling

---

*For specific build and deployment procedures, see the individual guides in this folder.*
