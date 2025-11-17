# App Store Assets Guide

This guide outlines all App Store assets needed for submitting VitalSense to the App Store.

## 📱 Required App Store Assets

### 1. App Screenshots

**iPhone Screenshots (Required):**
- 6.7" (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796 pixels
- 6.5" (iPhone 11 Pro Max, XS Max): 1242 x 2688 pixels
- 5.5" (iPhone 8 Plus, 7 Plus, 6s Plus): 1242 x 2208 pixels

**iPad Screenshots (Required if supporting iPad):**
- 12.9" iPad Pro (3rd gen): 2048 x 2732 pixels
- 12.9" iPad Pro (2nd gen): 2048 x 2732 pixels
- 11" iPad Pro: 1668 x 2388 pixels
- 10.5" iPad Pro: 1668 x 2224 pixels
- 9.7" iPad: 1536 x 2048 pixels

**Required Screenshot Sets:**
- App Store Connect requires at least 1 screenshot per device size
- Recommended: 3-5 screenshots showing key features

**Screenshot Recommendations:**
1. **Hero Shot**: Dashboard with health metrics overview
2. **Gait Analysis**: Gait analysis interface with real-time data
3. **Health Metrics**: Detailed health metrics view with charts
4. **Notifications**: Notification center showing health alerts
5. **Settings**: Settings screen showing customization options

**File Naming Convention:**
```
iPhone_6.7_Dashboard.png
iPhone_6.7_GaitAnalysis.png
iPhone_6.7_HealthMetrics.png
iPad_12.9_Dashboard.png
iPad_12.9_GaitAnalysis.png
```

### 2. App Preview Video

**iPhone Video Requirements:**
- 6.7": 886 x 1920 pixels, 30fps, H.264, max 500MB
- 6.5": 886 x 1920 pixels, 30fps, H.264, max 500MB
- 5.5": 1080 x 1920 pixels, 30fps, H.264, max 500MB

**iPad Video Requirements:**
- 12.9": 1200 x 1600 pixels, 30fps, H.264, max 500MB
- 11": 1200 x 1600 pixels, 30fps, H.264, max 500MB

**Video Content Suggestions:**
- 15-30 seconds showcasing key features
- Show: Dashboard → Gait Analysis → Health Alerts → Settings
- Include text overlays highlighting features
- Use smooth transitions between screens

**Recommended Video Script:**
1. Opening: "Monitor your health 24/7"
2. Dashboard: "Real-time health insights"
3. Gait Analysis: "AI-powered fall prevention"
4. Alerts: "Smart health notifications"
5. Closing: "VitalSense - Your health companion"

### 3. App Icon

**Required Sizes:**
- 1024 x 1024 pixels (required for App Store)
- PNG format, no transparency
- Square format (will be rounded by iOS)

**Design Guidelines:**
- Simple, recognizable design
- Works at small sizes
- No text (except in logo if integral)
- Use brand colors
- No transparency or rounded corners (iOS handles this)

**File:**
```
AppIcon_1024x1024.png
```

### 4. App Description

**App Store Name:**
- Maximum 30 characters
- Example: "VitalSense - Health Monitor"

**Subtitle:**
- Maximum 30 characters
- Example: "AI-Powered Fall Prevention"

**Description (Required):**
- Maximum 4000 characters
- First 2-3 sentences visible without "More"
- Include:
  - Key features
  - Benefits
  - Use cases
  - Privacy assurance

**Keywords (Required):**
- Maximum 100 characters
- Comma-separated
- Example: "health,fall prevention,gait analysis,health monitoring,healthkit"

**Promotional Text:**
- Maximum 170 characters
- Can be updated without new app version
- For special offers, new features, etc.

### 5. What's New (Version Release Notes)

**For Each Update:**
- Maximum 4000 characters
- List new features and improvements
- Be concise and user-focused

**Example Template:**
```
Version 1.0
- Initial release of VitalSense
- Real-time health monitoring
- AI-powered gait analysis
- Fall risk assessment
- Health data export (JSON, CSV, PDF)
- Comprehensive notification center
- Caregiver dashboard
- Cognitive health assessments
- Advanced analytics with correlation charts
```

### 6. Privacy Information

**Privacy Policy URL (Required):**
- Must be accessible without login
- Example: `https://vitalsense.com/privacy`

**Privacy Choices URL (Optional):**
- For users to manage data
- Example: `https://vitalsense.com/privacy/choices`

### 7. App Store Preview Image

**Required:**
- 1242 x 2208 pixels (iPhone)
- Used for App Store preview card
- Similar to first screenshot but optimized

### 8. Marketing Graphics

**Apple Watch App Screenshots (if applicable):**
- 312 x 390 pixels (40mm)
- 368 x 448 pixels (44mm)
- 272 x 340 pixels (38mm)
- 312 x 390 pixels (42mm)

### 9. Supporting Materials

**Support URL (Required):**
- Example: `https://vitalsense.com/support`

**Marketing URL (Optional):**
- Example: `https://vitalsense.com`

**Age Rating:**
- Must complete age rating questionnaire
- Health apps typically rated 4+

**App Categories:**
- Primary: Health & Fitness
- Secondary: Medical (if applicable)

**App Review Information:**
- Demo account credentials (if needed)
- Review notes explaining features
- Contact information for reviewer questions

## 📐 Asset Creation Guidelines

### Screenshot Creation

1. **Use Real Devices:**
   - Best quality comes from actual devices
   - Use iOS Simulator for development screenshots

2. **Design Tips:**
   - Remove status bar personal info (use generic date/time)
   - Hide sensitive user data
   - Use real content, not placeholders
   - Ensure text is readable
   - Show key features prominently

3. **Consistent Design:**
   - Same app state across screenshots
   - Consistent styling and colors
   - Professional appearance

### Video Creation

1. **Recording Tools:**
   - QuickTime Player (macOS)
   - iOS Simulator video recording
   - Third-party screen recording tools

2. **Editing Tips:**
   - Keep transitions smooth (0.5-1 second)
   - Add text overlays for key points
   - Use subtle animations
   - Include app name/logo at beginning/end
   - Keep it concise (15-30 seconds)

3. **Content Tips:**
   - Show actual usage, not just UI
   - Demonstrate real value
   - Include diverse health scenarios
   - Show both positive and informative content

## 📁 Recommended File Structure

```
ios/AppStoreAssets/
├── Screenshots/
│   ├── iPhone/
│   │   ├── 6.7_inch/
│   │   │   ├── 01_Dashboard.png
│   │   │   ├── 02_GaitAnalysis.png
│   │   │   ├── 03_HealthMetrics.png
│   │   │   ├── 04_Notifications.png
│   │   │   └── 05_Settings.png
│   │   ├── 6.5_inch/
│   │   └── 5.5_inch/
│   └── iPad/
│       └── 12.9_inch/
├── Videos/
│   ├── iPhone_6.7_Preview.mov
│   └── iPad_12.9_Preview.mov
├── Icons/
│   └── AppIcon_1024x1024.png
├── Descriptions/
│   ├── en-US.txt
│   └── en-US_Keywords.txt
└── Marketing/
    └── Preview_1242x2208.png
```

## 🎨 Asset Templates

### Screenshot Templates

Create screenshot templates with:
- Consistent branding
- Feature callouts
- Text overlays
- App name/logo
- Version indicator (optional)

### Video Storyboard

1. **Opening (2-3s):**
   - App logo animation
   - Tagline: "Your Health Companion"

2. **Feature 1 (5-7s):**
   - Dashboard navigation
   - Key metrics display

3. **Feature 2 (5-7s):**
   - Gait analysis demonstration
   - Real-time data visualization

4. **Feature 3 (3-5s):**
   - Notification center
   - Health alerts

5. **Closing (2-3s):**
   - App name/logo
   - Call to action

## ✅ Pre-Submission Checklist

- [ ] All required screenshot sizes created
- [ ] App preview video created (optional but recommended)
- [ ] 1024x1024 app icon ready
- [ ] App description written and reviewed
- [ ] Keywords selected and optimized
- [ ] Privacy policy URL ready
- [ ] Support URL ready
- [ ] Age rating completed
- [ ] App categories selected
- [ ] Review information prepared
- [ ] All assets follow Apple guidelines
- [ ] No placeholder text in screenshots
- [ ] No personal/sensitive data visible
- [ ] All text is readable at small sizes

## 🔗 Apple Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/apps/)
- [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)

## 📝 Content Guidelines

**DO:**
- Use real, meaningful content
- Show actual app functionality
- Highlight unique features
- Use clear, readable text
- Follow Apple's design guidelines
- Keep content fresh and updated

**DON'T:**
- Use placeholder text
- Show personal/sensitive information
- Include pricing information
- Make misleading claims
- Use copyrighted material without permission
- Include contact information (unless required)
- Show device frames (Apple provides these)

## 🚀 Quick Start

1. **Create Screenshots:**
   - Use iOS Simulator or device
   - Capture key screens
   - Edit for consistency

2. **Create Video:**
   - Record app usage
   - Edit with transitions
   - Add text overlays

3. **Write Copy:**
   - Compelling description
   - Optimized keywords
   - Clear feature list

4. **Prepare Icons:**
   - 1024x1024 PNG
   - Simple, recognizable design

5. **Upload to App Store Connect:**
   - Upload all assets
   - Complete metadata
   - Submit for review
