# 🔧 Swift Build Error Troubleshooting Guide

## 🚨 Common Swift Errors and Fixes

### 1. **"Cannot find 'ApiClient' in scope"**

**Fix**: Use the fixed version of ApiClient with proper singleton pattern

```swift
// Replace your ApiClient.swift with ApiClient.fixed.swift
// Make sure to rename it back to ApiClient.swift in Xcode
```

### 2. **"Cannot find 'AppConfig' in scope"**

**Fix**: Use the fixed AppConfig with proper singleton pattern

```swift
// Replace AppConfig.swift with AppConfig.fixed.swift
// Access via AppConfig.shared instead of AppConfig.load()
```

### 3. **"Value of type 'HealthKitManager' has no member 'startLiveDataStreaming'"**

**Problem**: Method signature mismatch
**Fix**: Update HealthKitManager.swift method to be async:

```swift
func startLiveDataStreaming(webSocketManager: WebSocketManager) async {
    // Implementation
}
```

### 4. **"Cannot pass parameter of type 'WebSocketManager' to parameter of type 'WebSocketManager'"**

**Fix**: Ensure WebSocketManager is properly imported and initialized

### 5. **"Missing Config.plist"**

**Fixes**:

- [ ] Ensure Config.plist is added to your Xcode project target
- [ ] Check Config.plist is in "Copy Bundle Resources" build phase
- [ ] Verify Config.plist contains all required keys:

  ```xml
  <key>API_BASE_URL</key>
  <string>http://127.0.0.1:8789</string>
  <key>WS_URL</key>
  <string>ws://localhost:3001</string>
  <key>USER_ID</key>
  <string>demo-user</string>
  ```

## 🛠️ Step-by-Step Error Resolution

### Method 1: Use Fixed Files

1. **In Xcode**: Delete problematic Swift files
2. **Add fixed versions**:
   - `ApiClient.fixed.swift` → rename to `ApiClient.swift`
   - `AppConfig.fixed.swift` → rename to `AppConfig.swift`
   - `HealthKitBridgeApp.fixed.swift` → rename to `HealthKitBridgeApp.swift`
3. **Clean and rebuild**: ⇧⌘K then ⌘B

### Method 2: Manual Fixes

#### Fix ApiClient.swift

```swift
class ApiClient: ObservableObject {
    static let shared = ApiClient()

    private init() {
        let config = AppConfig.shared
        self.baseURL = config.apiBaseURL
    }

    func getDeviceToken(userId: String, deviceType: String) async -> String? {
        // Implementation
    }
}
```

#### Fix AppConfig.swift

```swift
class AppConfig: ObservableObject {
    static let shared = AppConfig()

    private init() {
        // Load from Config.plist
    }
}
```

#### Fix HealthKitBridgeApp.swift

```swift
private func setupHealthMonitoring() {
    Task {
        await healthManager.requestAuthorization()

        let appConfig = AppConfig.shared
        if let token = await ApiClient.shared.getDeviceToken(
            userId: appConfig.userId,
            deviceType: "ios_app"
        ) {
            await webSocketManager.connect(with: token)
            await healthManager.startLiveDataStreaming(webSocketManager: webSocketManager)
        }
    }
}
```

## 🧪 Testing Your Build

### Run the Swift Linter

```bash
cd ios
chmod +x swift-lint.sh
./swift-lint.sh
```

### Quick Build Test

1. **Clean Build Folder**: Product → Clean Build Folder (⇧⌘K)
2. **Build**: ⌘B
3. **Check for errors** in Xcode's Issue Navigator
4. **Run**: ⌘R (on connected iPhone)

## ✅ Build Success Checklist

- [ ] No red errors in Xcode
- [ ] Config.plist added to target
- [ ] HealthKit capability enabled
- [ ] iPhone connected and trusted
- [ ] App builds without errors (⌘B)
- [ ] App runs on device (⌘R)
- [ ] HealthKit permissions requested
- [ ] Console shows connection logs

## 🎯 Expected Console Output

When working correctly:

```
🚀 Starting Health Monitoring Setup...
📋 Requesting HealthKit authorization...
✅ AppConfig loaded:
   API: http://127.0.0.1:8789
   WebSocket: ws://localhost:3001
   User ID: demo-user
✅ Device token received
✅ Got device token, connecting to WebSocket...
📊 Starting health data streaming...
```

## 🆘 Still Having Issues?

1. **Start fresh**: Create new Xcode project
2. **Add files one by one**: Start with just the fixed versions
3. **Test incrementally**: Build after adding each file
4. **Check dependencies**: Ensure all imports are correct
5. **Verify Config.plist**: Double-check it's in the right target

The fixed Swift files should resolve most build issues. Your backend is ready and waiting! 🚀
