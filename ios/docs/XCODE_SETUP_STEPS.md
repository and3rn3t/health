# VitalSense Xcode Setup Checklist
# Quick reference for manual Xcode tasks

## 1. Project Configuration (5 min)
- [ ] Open VitalSense.xcworkspace
- [ ] Link xcconfig files to targets:
  - VitalSense target → Debug.xcconfig & Release.xcconfig
  - VitalSenseWatch target → Debug.xcconfig & Release.xcconfig  
  - VitalSenseWidgets target → Debug.xcconfig & Release.xcconfig

## 2. Bundle Identifiers (1 min)
Verify these in General tab for each target:
- [ ] VitalSense: dev.andernet.VitalSense
- [ ] VitalSenseWatch: dev.andernet.VitalSense.watchkitapp
- [ ] VitalSenseWidgets: dev.andernet.VitalSense.widgets

## 3. Code Signing (2 min)
For each target → Signing & Capabilities:
- [ ] Update Team from C8U3P6AJ6L to your Apple Developer Team
- [ ] Ensure "Automatically manage signing" is ON
- [ ] Resolve any provisioning profile warnings

## 4. Capabilities - VitalSense target only (2 min)
Click + to add capabilities:
- [ ] HealthKit
- [ ] App Groups → group.dev.andernet.VitalSense
- [ ] Background Modes → workout-processing, health-research

## 5. First Build (1 min)
- [ ] Select VitalSense scheme
- [ ] Choose target (Simulator or Device)
- [ ] Press Cmd+B to build

## Common Build Fixes:
- Missing frameworks → Link HealthKit.framework, CoreMotion.framework
- Simulator issues → Try different iOS version
- Signing errors → Check Apple Developer portal for certificates

## Success Indicators:
✅ Build succeeds without errors
✅ App launches in Simulator
✅ HealthKit permission prompts appear
✅ No console errors related to missing resources