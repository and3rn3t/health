# 🚀 VitalSense - Quick Start Guide

> **Get up and running in 15 minutes with the complete VitalSense system**

## ✅ Prerequisites

- **Node.js 18+** and **npm 9+**
- **For iOS development**: Mac with **Xcode 15+**
- **Optional**: Physical iOS device (HealthKit doesn't work in simulator)

## 🌐 Web Application Setup (5 minutes)

### 1. Install Dependencies

```bash
git clone <repository-url>
cd health
npm install
```

### 2. Start Development Servers

```bash
# Terminal 1 - React Web App
npm run dev          # → http://localhost:5173

# Terminal 2 - Cloudflare Worker API
npm run cf:dev       # → http://localhost:8787

# Terminal 3 - WebSocket Server (Real-time)
npm run ws:dev       # → ws://localhost:3001
```

### 3. Verify Web Setup

Visit [http://localhost:5173](http://localhost:5173) and you should see:

- ✅ **Health Dashboard** with sample data
- ✅ **Connection Status** showing all services online
- ✅ **Real-time Updates** via WebSocket

## 📱 iOS Application Setup (10 minutes on Mac)

### 1. Create iOS Project

1. **Open Xcode** (Xcode 15+ required)
2. **Create new project**: iOS > App
3. **Configure**:
   - Product Name: `HealthKitBridge` (or your choice)
   - Bundle ID: `com.yourname.healthkitbridge`
   - Language: **Swift**
   - Interface: **SwiftUI**
   - iOS Deployment: **16.0+**

### 2. Add HealthKit Capability

1. Select your project in navigator
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **HealthKit**
5. Enable **Background Delivery** ✅

### 3. Configure Permissions

Add to your `Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app reads your health data to provide fall risk monitoring and emergency response.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app may write health data for comprehensive health monitoring.</string>
<key>UIBackgroundModes</key>
<array>
    <string>background-processing</string>
    <string>health-kit</string>
</array>
```

### 4. Add Project Files

Copy these files from `ios/HealthKitBridge/` to your Xcode project:

- ✅ `HealthKitManager.swift`
- ✅ `WebSocketManager.swift`
- ✅ `ApiClient.swift`
- ✅ `AppConfig.swift`
- ✅ `Config.plist`
- ✅ `HealthKitBridgeApp.swift`
- ✅ `ContentView.swift`

**Important**: When adding files:

- Choose **"Copy items if needed"** ✅
- Add to your **app target** ✅

### 5. Update App Entry Point

Replace your main app file content with:

```swift
import SwiftUI
import HealthKit

@main
struct HealthKitBridgeApp: App {
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthManager)
                .environmentObject(webSocketManager)
                .onAppear {
                    setupHealthMonitoring()
                }
        }
    }

    private func setupHealthMonitoring() {
        Task {
            await healthManager.requestAuthorization()
            await webSocketManager.connect()
        }
    }
}
```

### 6. Build and Test

1. **Connect physical iOS device** (HealthKit requires real device)
2. **Select your device** in Xcode
3. **Build and Run** (⌘+R)

## 🎉 Expected Results

### Web Dashboard

- ✅ Health analytics dashboard
- ✅ Real-time data visualization
- ✅ Fall risk monitoring interface
- ✅ Emergency alert system

### iOS App

- ✅ HealthKit permission request
- ✅ Connection to your web servers
- ✅ Real-time health data streaming
- ✅ Beautiful UI showing sync status

### Integration

- ✅ iOS health data appears in web dashboard
- ✅ Real-time updates via WebSocket
- ✅ End-to-end encrypted data flow
- ✅ Emergency alert system ready

## 🐛 Quick Troubleshooting

### Common Issues

| Problem                              | Solution                                        |
| ------------------------------------ | ----------------------------------------------- |
| **"Cannot find AppConfig in scope"** | Use `AppConfig.shared` instead of `AppConfig()` |
| **HealthKit not working**            | Must use physical device, not simulator         |
| **WebSocket connection fails**       | Check all 3 development servers are running     |
| **Permission denied**                | Verify HealthKit capability is enabled          |
| **Build errors**                     | Ensure all Swift files are added to app target  |

### Health Check Commands

```bash
# Test API health
curl http://127.0.0.1:8787/health

# Test device authentication
curl -X POST http://127.0.0.1:8787/api/device/auth \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-user","deviceType":"ios_app"}'

# Full integration test
npm run test:integration
```

## 🚀 Next Steps

### Immediate (5 minutes)

- **Generate test data** in iOS Health app
- **Watch real-time sync** in web dashboard
- **Test emergency alerts** with mock fall detection

### Short-term (30 minutes)

- **Customize UI** with your branding
- **Configure alert contacts** for emergency response
- **Set up Apple Watch** companion app

### Production (1-2 hours)

- **Deploy to Cloudflare Workers** production
- **Configure SSL certificates** for HTTPS
- **Set up monitoring** and analytics
- **Submit to App Store** (if needed)

## 📖 Detailed Documentation

- **[Complete Setup Guide](SETUP_GUIDE.md)** - Detailed step-by-step instructions
- **[Build Troubleshooting](BUILD_TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture Overview](ARCHITECTURE.md)** - System design and components
- **[Problem Solutions Database](PROBLEM_SOLUTIONS_DATABASE.md)** - Comprehensive troubleshooting

## 🆘 Need Help?

- **Check the [Problem Solutions Database](PROBLEM_SOLUTIONS_DATABASE.md)** for known issues
- **Review [Build Troubleshooting](BUILD_TROUBLESHOOTING.md)** for specific errors
- **Read the [Complete Setup Guide](SETUP_GUIDE.md)** for detailed instructions

---

**🎯 Goal**: Complete health monitoring system running in 15 minutes!

**🏥 Result**: Real Apple HealthKit data flowing to your sophisticated web dashboard with fall risk monitoring and emergency alerts.
