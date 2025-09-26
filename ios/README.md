# VitalSense

A comprehensive iOS and watchOS health monitoring application focused on gait analysis and real-time health data tracking using HealthKit integration.

## 🎯 Quick Start

```bash
# Clone and setup
git clone https://github.com/your-org/VitalSense.git
cd VitalSense

# Validate environment
./Tools/dev-env-validator.sh

# Setup development environment
./Scripts/Build/setup-enhanced-dev-env.sh

# Open workspace (always use workspace!)
open VitalSense.xcworkspace
```

## 📱 Project Overview

VitalSense is a multi-platform health monitoring application that provides:

- **Real-time gait analysis** during walks and runs
- **Comprehensive health dashboards** with HealthKit data visualization  
- **Apple Watch integration** for workout processing and monitoring
- **Home screen widgets** for quick health insights
- **Privacy-first approach** to sensitive health information

### Platform Support
- **iOS 17.0+** - Primary interface and data management
- **watchOS 10.0+** - Workout processing and companion features
- **WidgetKit** - Home screen and lock screen widgets

## 🏗️ Architecture

- **Language:** Swift 5.9+
- **UI Framework:** SwiftUI
- **Architecture Pattern:** MVVM
- **Health Integration:** HealthKit
- **Build System:** Xcode Workspace + Swift Package Manager
- **Automation:** Fastlane + Custom Build Scripts

## 📁 Project Structure

```
VitalSense/
├── CODEOWNERS              # Code review assignments
├── Configuration/          # Build configurations
│   └── Project/           # Debug/Release xcconfig files
├── Docs/                  # Comprehensive documentation
│   ├── COPILOT_INSTRUCTIONS.md  # AI assistant context
│   ├── QUICK_START.md     # 5-minute setup guide
│   └── ...
├── Scripts/               # Build automation
│   ├── Build/            # Development and deployment scripts
│   └── Recovery/         # Project recovery tools
├── Tools/                # Development utilities
│   ├── dev-env-validator.sh     # Environment validation
│   ├── project-health-check.sh # Project health monitoring
│   └── development-aliases.sh  # Command shortcuts
├── VitalSense/           # Main app source code
│   ├── Core/            # Business logic and data models
│   ├── Features/        # Feature-specific modules
│   ├── UI/              # SwiftUI views and components
│   └── Support/         # Utilities and helpers
└── fastlane/            # Deployment automation
```

## 🚀 Development Workflow

### Daily Development
```bash
# Check project health
./Tools/project-health-check.sh

# Quick build and run
./Scripts/Build/build-and-run.sh

# Fast incremental build
./Scripts/Build/fast-build.sh
```

### Before Major Changes
```bash
# Validate environment
./Tools/dev-env-validator.sh

# Run preflight checks
./Scripts/Build/preflight-xcode-finalization.sh

# Audit code signing
./Scripts/Build/signing-audit.sh
```

### Code Quality
```bash
# SwiftLint check
./Scripts/Build/swiftlint-precheck.ps1

# Run unit tests
./Scripts/Build/ios-test-runner.ps1
```

## 🔧 Key Capabilities

### iOS App
- HealthKit integration
- App Groups for data sharing
- Comprehensive gait analysis UI

### watchOS App  
- HealthKit integration
- App Groups for data sharing
- Background Modes (workout-processing)
- Real-time workout monitoring

### Widget
- App Groups for data access
- Quick health insights
- Multiple widget sizes

## 🏥 HealthKit Integration

VitalSense prioritizes user privacy and follows Apple's HealthKit guidelines:

- **On-device processing** - Health data stays on user's device
- **Explicit permissions** - Clear usage descriptions and user consent
- **Secure synchronization** - Cross-device sync via App Groups
- **Privacy compliance** - Full adherence to health data regulations

## 🛠️ Development Tools

### Essential Scripts
- `setup-enhanced-dev-env.sh` - Complete development environment setup
- `preflight-xcode-finalization.sh` - Pre-build validation and health check
- `build-and-run.sh` - Quick build and simulator deployment
- `optimize-xcode.sh` - Clean and optimize Xcode environment

### Quality Assurance
- `swiftlint-precheck.ps1` - Code style enforcement
- `swift-duplicate-types-scan.ps1` - Detect naming conflicts
- `monitor-performance.sh` - Track build and runtime performance

### Recovery Tools
- `check_project_health.sh` - Validate project integrity
- `ultimate_recovery.sh` - Comprehensive project recovery
- `project_stability_toolkit.sh` - Advanced stability checks

## 📚 Documentation

Complete documentation is available in the `Docs/` directory:

- **[Quick Start Guide](Docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Copilot Instructions](Docs/COPILOT_INSTRUCTIONS.md)** - AI assistant context and guidelines
- **[Build Scripts Reference](Docs/BUILD_SCRIPTS.md)** - Complete automation guide
- **[AI Development Prompts](Docs/AI_PROMPTS.md)** - Pre-written AI assistant prompts

## 🔄 CI/CD

Automated workflows via GitHub Actions:
- **Build validation** on push and pull requests
- **Unit and UI testing** across iOS simulators
- **Security scanning** for hardcoded secrets
- **HealthKit compliance** validation

## 🚨 Important Notes

### Always Use Workspace
```bash
# ✅ Correct
open VitalSense.xcworkspace

# ❌ Never use
open VitalSense.xcodeproj
```

### Health Data Privacy
- All health data processing happens on-device
- User consent required for HealthKit access
- No health data transmitted to external servers
- Full compliance with health data regulations

### Cross-Platform Considerations
- iOS and watchOS have different capabilities
- Watch app has strict battery and processing constraints
- Widget updates are system-controlled
- App Groups enable secure data sharing

## 🤝 Contributing

1. **Environment Setup:** Run `./Tools/dev-env-validator.sh`
2. **Code Quality:** Follow SwiftLint guidelines
3. **Testing:** Ensure all tests pass before commits
4. **Documentation:** Update relevant docs with changes
5. **Health Data:** Extra caution with HealthKit integration

## 📞 Support

- **Documentation:** Check `Docs/` directory first
- **Build Issues:** Run `./Scripts/Build/preflight-xcode-finalization.sh`
- **Project Corruption:** Use recovery tools in `Scripts/Recovery/`
- **Environment Problems:** Run `./Tools/dev-env-validator.sh`

## 📄 License

[Add your license information here]

---

**VitalSense** - Making health monitoring accessible, private, and actionable through innovative mobile technology.

*Last Updated: September 25, 2025*