# VitalSense Final Xcode Configuration Walkthrough

## 🎯 **Phase 1: Link Build Configuration Files (5 minutes)**

### Step 1: Navigate to Build Settings
1. In Xcode's Project Navigator (left panel), click on "VitalSense" at the top (blue project icon)
2. In the main editor, you'll see project and targets list
3. Select each target one by one: **VitalSense**, **VitalSenseWatch**, **VitalSenseWidgets**

### Step 2: Link xcconfig files for each target
For **EACH TARGET** (do this 3 times):

**A. VitalSense Target:**
1. Click "VitalSense" target in the targets list
2. Click "Build Settings" tab at the top
3. Click "All" and "Levels" buttons to show the configuration levels view
4. Look for "Debug" and "Release" rows in the configuration columns
5. For Debug row: Click and set to "VitalSense/Configuration/Debug"
6. For Release row: Click and set to "VitalSense/Configuration/Release"

**B. VitalSenseWatch Target:**
1. Click "VitalSenseWatch" target
2. Repeat the same Build Settings process
3. Set Debug → "VitalSense/Configuration/Debug"  
4. Set Release → "VitalSense/Configuration/Release"

**C. VitalSenseWidgets Target:**
1. Click "VitalSenseWidgets" target
2. Repeat the same Build Settings process
3. Set Debug → "VitalSense/Configuration/Debug"
4. Set Release → "VitalSense/Configuration/Release"

---

## 🎯 **Phase 2: Verify Bundle Identifiers (2 minutes)**

### For each target, check the General tab:
**VitalSense target:**
- General tab → Bundle Identifier should be: `dev.andernet.VitalSense`

**VitalSenseWatch target:**
- General tab → Bundle Identifier should be: `dev.andernet.VitalSense.watchkitapp`

**VitalSenseWidgets target:**
- General tab → Bundle Identifier should be: `dev.andernet.VitalSense.widgets`

---

## 🎯 **Phase 3: Code Signing Setup (3 minutes)**

### For ALL THREE targets:
1. Select target → "Signing & Capabilities" tab
2. **Team**: Change from "C8U3P6AJ6L" to YOUR Apple Developer Team
   - If you don't have one, you can use "Personal Team" for testing
3. **Automatically manage signing**: Ensure this is CHECKED ✅
4. Resolve any red warning messages that appear

---

## 🎯 **Phase 4: Enable Health Capabilities (2 minutes)**

### ONLY for the main VitalSense target:
1. Select "VitalSense" target → "Signing & Capabilities" tab
2. Click the "+ Capability" button
3. Add these capabilities:
   - **HealthKit** ✅
   - **App Groups** ✅
     - Set identifier: `group.dev.andernet.VitalSense`
   - **Background Modes** ✅
     - Check: "Background processing"
     - Check: "Background app refresh"  
     - Check: "Audio, AirPlay, and Picture in Picture"

---

## 🎯 **Phase 5: First Build Test (1 minute)**

### Build and Test:
1. Select the VitalSense scheme (top-left dropdown next to play button)
2. Choose "iPhone 15 Pro Simulator" or your preferred simulator
3. Press **Cmd+B** to build
4. If build succeeds, press **Cmd+R** to run

---

## 🚨 **Common Issues & Quick Fixes:**

### Issue: "No signing certificate"
- **Fix**: Go to Xcode → Preferences → Accounts → Add your Apple ID

### Issue: "Bundle identifier already in use"  
- **Fix**: Add a suffix like `.dev` to make it unique: `dev.andernet.VitalSense.dev`

### Issue: "Missing frameworks"
- **Fix**: Select target → Build Phases → Link Binary → Add HealthKit.framework, CoreMotion.framework

### Issue: "Simulator fails to launch"
- **Fix**: Try iPhone 15 simulator or reset simulator (Device → Erase All Content)

---

## ✅ **Success Indicators:**

You'll know it's working when:
- ✅ Build completes without errors
- ✅ App launches in simulator  
- ✅ You see the VitalSense app interface
- ✅ No red errors in the console
- ✅ HealthKit permission dialog appears when testing health features

---

## 📱 **Next Steps After Successful Build:**

1. Test basic app navigation
2. Verify HealthKit permissions prompt appears
3. Test widget functionality
4. Run unit tests: **Cmd+U**
5. Check SwiftUI previews work

**Estimated Total Time: 10-15 minutes**