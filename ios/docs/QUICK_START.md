# VitalSense Quick Start Guide

*Tags: #setup #quickstart #development #5min*

## 🚀 5-Minute Setup

Get VitalSense running on your development machine in under 5 minutes.

## ✅ Prerequisites

- **macOS 14.0+** (Sonoma or later)
- **Xcode 15.0+** with iOS 17.0+ SDK
- **Apple Developer Account** (for device testing)
- **Git** (for version control)

## 📥 Step 1: Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/VitalSense.git
cd VitalSense

# Run the enhanced development environment setup
./Scripts/Build/setup-enhanced-dev-env.sh

# Install dependencies (if using Ruby gems for fastlane)
bundle install
```

## 🔧 Step 2: Xcode Configuration

### Open the Workspace (Important!)
```bash
# Always use the workspace, not the project file
open VitalSense.xcworkspace
```

### Configure Signing
1. Select **VitalSense** project in navigator
2. For each target (iOS App, Watch App, Widget, Tests):
   - Set your **Team** in Signing & Capabilities
   - Verify **Bundle Identifier** (should be `com.yourteam.vitalsense.*`)
   - Ensure capabilities match:
     - **iOS App:** HealthKit, App Groups
     - **Watch App:** HealthKit, App Groups, Background Modes
     - **Widget:** App Groups

## 🏃‍♂️ Step 3: Build & Run

### Quick Build Test
```bash
# Run preflight checks
./Scripts/Build/preflight-xcode-finalization.sh

# Quick build and deploy to simulator
./Scripts/Build/build-and-run.sh
```

### Manual Build (Alternative)
1. In Xcode, select **VitalSense** scheme
2. Choose iOS Simulator (iPhone 15 Pro recommended)
3. Press **⌘R** to build and run

## 📱 Step 4: Verify Installation

### iOS App Should Show:
- ✅ Health permissions request screen
- ✅ Dashboard with placeholder data
- ✅ Navigation to gait session screens
- ✅ Settings and permissions management

### Apple Watch (if available):
- ✅ Companion app installation
- ✅ Workout processing capabilities
- ✅ Health data synchronization

## 🔍 Step 5: Development Verification

### SwiftUI Previews
1. Open any View file in `VitalSense/UI/`
2. Press **⌘⌥P** to start previews
3. Verify previews load without errors

### Widget Testing
1. Run the app once on simulator
2. Long-press home screen → Add Widget
3. Find VitalSense widget and add it
4. Verify widget displays correctly

## ⚡ Quick Commands Reference

```bash
# Development shortcuts
./Scripts/Build/fast-build.sh              # Fast incremental build
./Scripts/Build/build-and-run.sh           # Build and run on simulator
./Scripts/Build/deploy-to-device.sh        # Deploy to connected device

# Maintenance
./Scripts/Build/optimize-xcode.sh          # Clean and optimize Xcode
./Scripts/Build/signing-audit.sh           # Check signing configuration
```

## 🧪 Testing Your Setup

### Unit Tests
```bash
# Run all unit tests
xcodebuild test -workspace VitalSense.xcworkspace -scheme VitalSense -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### UI Tests (Optional)
```bash
# Run UI tests (takes longer)
xcodebuild test -workspace VitalSense.xcworkspace -scheme VitalSenseUITests -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## 🎯 Next Steps

Once you have VitalSense running:

1. **Read the [Developer Guide](DEVELOPER_GUIDE.md)** - Understand the architecture
2. **Check [NOW_TASKS.md](../VitalSense/ProjectInfo/NOW_TASKS.md)** - Current development priorities
3. **Review [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md)** - AI assistant context
4. **Explore the codebase** - Start with `VitalSense/UI/` for UI components

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clean build folder and derived data
./Scripts/Build/optimize-xcode.sh
```

**Signing Issues:**
```bash
# Audit signing configuration
./Scripts/Build/signing-audit.sh
```

**Health Permissions Not Working:**
- Ensure HealthKit capability is enabled
- Check `Info.plist` for health usage descriptions
- Reset simulator: Device → Erase All Content and Settings

**Project Corruption:**
```bash
# Use recovery tools if needed
./Scripts/Recovery/check_project_health.sh
```

### Get Help

- **Documentation:** Check other files in `Documentation/`
- **Recovery Guide:** See `RECOVERY_GUIDE.md` for project issues
- **Build Scripts:** Review `Scripts/Build/` for automation tools

## 🎉 Success!

If you can build and run VitalSense with health permissions working, you're ready to start development!

**Next recommended read:** [Developer Guide](DEVELOPER_GUIDE.md)

---

**Estimated Setup Time:** 3-5 minutes  
**Last Updated:** September 25, 2025  
**For:** VitalSense v1.0.0