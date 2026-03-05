# Apple Device Sync - iOS Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Apple Device Sync feature into your iOS app.

## Prerequisites

- iOS 14.0+
- Xcode 14.0+
- HealthKit framework
- WebSocket support

## Setup

### 1. Add Required Frameworks

In your `Info.plist`, add:

```xml
<key>NSHealthShareUsageDescription</key>
<string>VitalSense needs access to your health data to sync with the web dashboard.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>VitalSense may write health data for monitoring purposes.</string>
<key>NSMotionUsageDescription</key>
<string>Motion data is required for gait analysis and fall detection.</string>
```

### 2. Configure WebSocket Connection

```swift
import Foundation
import Combine

class DeviceSyncManager: ObservableObject {
    private var webSocket: URLSessionWebSocketTask?
    private let webSocketURL = URL(string: "wss://your-server.com/ws")!
    
    @Published var isConnected = false
    @Published var devices: [Device] = []
    
    func connect() {
        let session = URLSession.shared
        webSocket = session.webSocketTask(with: webSocketURL)
        webSocket?.resume()
        receiveMessage()
    }
}
```

## Device Connection

### 1. Detect Device Capabilities

```swift
import HealthKit
import CoreMotion

struct DeviceCapabilities {
    let healthKit: Bool
    let lidar: Bool
    let motionSensors: Bool
    let heartRate: Bool
    let fallDetection: Bool
    let backgroundSync: Bool
    let watchConnectivity: Bool
    let arKit: Bool
    
    static func detect() -> DeviceCapabilities {
        return DeviceCapabilities(
            healthKit: HKHealthStore.isHealthDataAvailable(),
            lidar: ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh),
            motionSensors: CMMotionManager().isDeviceMotionAvailable,
            heartRate: true, // Available on iOS devices
            fallDetection: true, // Available on iPhone/Watch
            backgroundSync: true,
            watchConnectivity: WCSession.isSupported(),
            arKit: ARWorldTrackingConfiguration.isSupported
        )
    }
}
```

### 2. Register Device with Web App

```swift
func registerDevice() {
    let deviceInfo: [String: Any] = [
        "id": UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString,
        "name": UIDevice.current.name,
        "type": "iphone",
        "model": UIDevice.current.model,
        "osVersion": UIDevice.current.systemVersion,
        "capabilities": [
            "healthKit": DeviceCapabilities.detect().healthKit,
            "lidar": DeviceCapabilities.detect().lidar,
            "motionSensors": DeviceCapabilities.detect().motionSensors,
            "heartRate": DeviceCapabilities.detect().heartRate,
            "fallDetection": DeviceCapabilities.detect().fallDetection,
            "backgroundSync": DeviceCapabilities.detect().backgroundSync,
            "watchConnectivity": DeviceCapabilities.detect().watchConnectivity,
            "arKit": DeviceCapabilities.detect().arKit
        ],
        "connectionStatus": "connected",
        "batteryLevel": UIDevice.current.batteryLevel >= 0 ? Int(UIDevice.current.batteryLevel * 100) : nil,
        "isCharging": UIDevice.current.batteryState == .charging
    ]
    
    // Dispatch to web view
    webView.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('apple-device-connected', {
            detail: \(jsonString(from: deviceInfo))
        }));
    """)
}
```

## Health Data Sync

### 1. Request HealthKit Permissions

```swift
import HealthKit

class HealthKitManager {
    private let healthStore = HKHealthStore()
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw NSError(domain: "HealthKit", code: -1)
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .appleWalkingSteadiness)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!,
        ]
        
        try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
    }
}
```

### 2. Collect Health Data

```swift
func collectHealthData() {
    // Heart Rate
    let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
    let heartRateQuery = HKAnchoredObjectQuery(
        type: heartRateType,
        predicate: nil,
        anchor: nil,
        limit: HKObjectQueryNoLimit
    ) { query, samples, deletedObjects, anchor, error in
        guard let samples = samples as? [HKQuantitySample] else { return }
        
        for sample in samples {
            let value = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
            self.sendHealthData(
                metricType: "heart_rate",
                value: value,
                unit: "bpm",
                confidence: 0.95
            )
        }
    }
    
    healthStore.execute(heartRateQuery)
}
```

### 3. Send Health Data to Web

```swift
func sendHealthData(metricType: String, value: Double, unit: String, confidence: Double) {
    let healthData: [String: Any] = [
        "deviceId": deviceId,
        "timestamp": ISO8601DateFormatter().string(from: Date()),
        "metrics": [[
            "metricType": metricType,
            "value": value,
            "unit": unit,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "deviceId": deviceId,
            "confidence": confidence,
            "source": "apple_watch"
        ]],
        "deviceInfo": [
            "batteryLevel": Int(UIDevice.current.batteryLevel * 100)
        ]
    ]
    
    webView.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('apple-health-data', {
            detail: \(jsonString(from: healthData))
        }));
    """)
}
```

## Background Sync

### 1. Enable Background Modes

In `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>healthkit</string>
    <string>processing</string>
</array>
```

### 2. Setup Background Delivery

```swift
func setupBackgroundDelivery() {
    let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
    
    healthStore.enableBackgroundDelivery(
        for: heartRateType,
        frequency: .immediate
    ) { success, error in
        if let error = error {
            print("Background delivery error: \(error)")
        }
    }
}
```

### 3. Handle Background Updates

```swift
func application(_ application: UIApplication, 
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Register for background health updates
    NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleHealthUpdate),
        name: .healthKitDataUpdate,
        object: nil
    )
    
    return true
}

@objc func handleHealthUpdate() {
    // Collect and send health data
    collectHealthData()
}
```

## Device Disconnection

```swift
func disconnectDevice() {
    let disconnectInfo: [String: Any] = [
        "deviceId": deviceId
    ]
    
    webView.evaluateJavaScript("""
        window.dispatchEvent(new CustomEvent('apple-device-disconnected', {
            detail: \(jsonString(from: disconnectInfo))
        }));
    """)
}
```

## Error Handling

```swift
func handleSyncError(error: Error, deviceId: String) {
    let errorInfo: [String: Any] = [
        "deviceId": deviceId,
        "errorType": "connection",
        "message": error.localizedDescription,
        "timestamp": ISO8601DateFormatter().string(from: Date())
    ]
    
    // Log error
    print("Sync error: \(error)")
    
    // Notify web app if needed
    // webView.evaluateJavaScript(...)
}
```

## Helper Functions

### JSON Serialization

```swift
func jsonString(from object: Any) -> String {
    guard let data = try? JSONSerialization.data(withJSONObject: object, options: []),
          let string = String(data: data, encoding: .utf8) else {
        return "{}"
    }
    return string
}
```

## Testing

### Unit Test Example

```swift
import XCTest
@testable import YourApp

class DeviceSyncManagerTests: XCTestCase {
    var manager: DeviceSyncManager!
    
    override func setUp() {
        super.setUp()
        manager = DeviceSyncManager()
    }
    
    func testDeviceRegistration() {
        let capabilities = DeviceCapabilities.detect()
        XCTAssertTrue(capabilities.healthKit)
    }
    
    func testHealthDataCollection() {
        // Test health data collection
    }
}
```

## Best Practices

1. **Request Permissions Early**: Request HealthKit permissions on app launch
2. **Handle Errors Gracefully**: Implement retry logic for failed syncs
3. **Optimize Battery**: Use appropriate sync intervals
4. **Validate Data**: Ensure data quality before sending
5. **Monitor Connection**: Track connection status and handle reconnection

## Troubleshooting

### Device Not Connecting

- Verify WebSocket URL is correct
- Check network connectivity
- Ensure web view is loaded

### Health Data Not Syncing

- Verify HealthKit permissions are granted
- Check data collection queries are active
- Ensure background delivery is enabled

### High Battery Usage

- Increase sync interval
- Reduce data collection frequency
- Optimize query efficiency

---

*Last Updated: January 2024*
