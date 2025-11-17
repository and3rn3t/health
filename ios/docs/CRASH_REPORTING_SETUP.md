# Crash Reporting Setup Guide

This guide explains how to integrate crash reporting SDKs (Sentry or Firebase Crashlytics) into VitalSense.

## 🛠️ Current Implementation

The app includes a `CrashReportingManager` that provides a unified interface for crash reporting. It supports:
- Multiple providers (Sentry, Firebase Crashlytics, local logger)
- Error reporting with context
- User identification
- Breadcrumbs for debugging
- Custom context and tags

## 📦 SDK Integration Options

### Option 1: Firebase Crashlytics (Recommended)

**Advantages:**
- Free tier available
- Integrated with Firebase ecosystem
- Easy setup
- Good for iOS apps

**Setup Steps:**

1. **Add Firebase SDK via Swift Package Manager:**
   ```
   Package URL: https://github.com/firebase/firebase-ios-sdk
   ```

2. **Add Firebase to your Xcode project:**
   - File > Add Packages...
   - Search for `firebase-ios-sdk`
   - Add `FirebaseCrashlytics` product

3. **Add Firebase Configuration File:**
   - Download `GoogleService-Info.plist` from Firebase Console
   - Add to Xcode project
   - Ensure it's included in the app target

4. **Update CrashReportingManager.swift:**
   - Uncomment `FirebaseCrashlyticsProvider` class
   - Add `import FirebaseCrashlytics`
   - Uncomment setup code in `setupFirebaseCrashlytics()`

5. **Initialize Firebase in VitalSenseApp.swift:**
   ```swift
   import FirebaseCore
   
   // In initializeApp(), before crash reporting:
   FirebaseApp.configure()
   ```

6. **Configure Build Settings:**
   - Add `-FIRDebugEnabled` to Other Swift Flags for Debug builds
   - Add run script phase for dSYM upload:
     ```bash
     "${PODS_ROOT}/FirebaseCrashlytics/run"
     ```

### Option 2: Sentry

**Advantages:**
- Open source
- Self-hosted option
- Advanced features
- Good for production apps

**Setup Steps:**

1. **Add Sentry SDK via Swift Package Manager:**
   ```
   Package URL: https://github.com/getsentry/sentry-cocoa
   ```

2. **Add Sentry to your Xcode project:**
   - File > Add Packages...
   - Search for `sentry-cocoa`
   - Add `Sentry` product

3. **Get Sentry DSN:**
   - Create account at https://sentry.io
   - Create new project
   - Copy DSN from project settings

4. **Update CrashReportingManager.swift:**
   - Uncomment `SentryProvider` class
   - Add `import Sentry`
   - Update DSN in `setupSentry()`:
     ```swift
     options.dsn = "YOUR_SENTRY_DSN_HERE"
     ```

5. **Configure Build Settings:**
   - Set `SENTRY_ENABLED = YES` in build configuration
   - Add Sentry to Info.plist if needed

## 🔧 Configuration

### Build Configuration Flags

Add these to your `.xcconfig` files:

**Development.xcconfig:**
```
ENABLE_CRASH_REPORTING = NO
FIREBASE_CRASHLYTICS_ENABLED = NO
SENTRY_ENABLED = NO
```

**Production.xcconfig:**
```
ENABLE_CRASH_REPORTING = YES
FIREBASE_CRASHLYTICS_ENABLED = YES
SENTRY_ENABLED = NO
```

Or for Sentry:
```
ENABLE_CRASH_REPORTING = YES
FIREBASE_CRASHLYTICS_ENABLED = NO
SENTRY_ENABLED = YES
```

### Environment Variables

Set in Xcode scheme:
- `FIREBASE_CRASHLYTICS_ENABLED = YES/NO`
- `SENTRY_ENABLED = YES/NO`

## 📝 Usage Examples

### Basic Error Reporting

```swift
// Automatic error handling (already integrated)
CrashReportingManager.shared.reportError(
    error,
    context: "User action failed",
    level: .error
)
```

### User Identification

```swift
// Set user for crash reports (already in app init)
CrashReportingManager.shared.setUser(
    userId: appConfig.userId,
    email: userEmail,
    username: userName
)
```

### Adding Breadcrumbs

```swift
// Add breadcrumb for debugging
CrashReportingManager.shared.addBreadcrumb(
    "User tapped gait analysis button",
    category: "user_interaction",
    level: .info
)
```

### Setting Context

```swift
// Add custom context
CrashReportingManager.shared.setContext("app_version", value: appVersion)
CrashReportingManager.shared.setTag("environment", value: "production")
```

## 🔐 Privacy Considerations

- User data is automatically scrubbed
- No PII is included in crash reports by default
- User identification is optional
- All data collection follows privacy manifest

## 📊 Viewing Crash Reports

### Firebase Crashlytics:
1. Go to Firebase Console
2. Navigate to Crashlytics section
3. View crashes, stack traces, and user impact

### Sentry:
1. Go to Sentry dashboard
2. Navigate to Issues
3. View crash details, stack traces, and affected users

## ✅ Testing

### Test Crash Reporting:

1. **Force a crash (DEBUG only):**
   ```swift
   fatalError("Test crash - remove in production")
   ```

2. **Test error reporting:**
   ```swift
   let error = NSError(domain: "Test", code: -1, userInfo: [NSLocalizedDescriptionKey: "Test error"])
   CrashReportingManager.shared.reportError(error, context: "Testing")
   ```

3. **Verify in dashboard:**
   - Check that crash appears in dashboard
   - Verify stack trace is complete
   - Confirm context and breadcrumbs are present

## 🚨 Important Notes

- Crash reporting should be disabled in DEBUG builds (optional)
- Never commit API keys or DSNs to version control
- Use environment variables or Config.plist for sensitive data
- Test crash reporting in TestFlight before production
- Monitor crash rate in production dashboard

## 📚 Additional Resources

- [Firebase Crashlytics Documentation](https://firebase.google.com/docs/crashlytics)
- [Sentry iOS Documentation](https://docs.sentry.io/platforms/apple/)
- [Apple Crash Reporting Best Practices](https://developer.apple.com/documentation/xcode/improving-your-app-s-diagnostic-data)
