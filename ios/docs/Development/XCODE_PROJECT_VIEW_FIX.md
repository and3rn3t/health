# How to Switch from Folder View to Targets View in Xcode

## The Issue:
You're seeing folders/files in the main editor instead of the project targets and build settings.

## The Fix:

### Method 1: Click the Project Icon (Easiest)
1. In the **Project Navigator** (left sidebar), look for the blue project icon at the very top
2. It should say "VitalSense" with a blue project icon (not a folder icon)
3. **Single-click** on this blue "VitalSense" project icon
4. The main editor will switch to show PROJECT and TARGETS

### Method 2: If you don't see the blue project icon
1. Make sure you're in the **Project Navigator** (left sidebar)
   - Click the folder icon in the top-left navigator bar if needed
2. Look at the very top item - it should be "VitalSense" with a blue project icon
3. If you see files/folders instead, you might be in a different navigator view

### Method 3: Force refresh the project view
1. In Xcode menu: **File → Close Workspace**
2. **File → Open Recent → VitalSense.xcworkspace**
3. Once reopened, click the blue VitalSense project icon in the navigator

## What You Should See After the Fix:
- Main editor shows "PROJECT" section with "VitalSense" 
- Below that, "TARGETS" section with:
  - VitalSense
  - VitalSenseWatch  
  - VitalSenseWidgets
  - VitalSenseTests
  - VitalSenseUITests

## Visual Clues You're in the Right View:
✅ You see tabs: "General", "Signing & Capabilities", "Resource Tags", "Build Settings", etc.
✅ You can select different targets from the targets list  
✅ The main area shows project configuration options

## Visual Clues You're Still in Wrong View:
❌ You see mostly file listings and folder structures
❌ No "General" or "Build Settings" tabs visible
❌ Main editor shows file contents instead of project settings