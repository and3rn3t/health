# GitHub Copilot Instructions for HealthKit Bridge

## 📱 Project Overview

HealthKit Bridge is a **medical-grade iOS application** specializing in fall risk assessment, gait analysis, and walking behavior monitoring for healthcare data collection and analysis. The app bridges HealthKit data to external medical systems via real-time WebSocket connections.

**Target Users**: Healthcare providers, researchers, elderly care facilities, physical therapy clinics
**Primary Use Case**: Continuous mobility monitoring and fall prevention
**Data Sensitivity**: HIPAA-aware medical data handling

## 🏗️ Architecture & Tech Stack

### Core Technologies
- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI (iOS 16.0+)
- **Health Framework**: HealthKit + CoreMotion
- **Watch Integration**: WatchConnectivity + watchOS 9.0+
- **Data Transmission**: WebSocket (URLSessionWebSocketTask)
- **Background Processing**: BackgroundTasks framework
- **Security**: End-to-end encryption, privacy-first design

### Architecture Pattern
- **MVVM**: SwiftUI views with ObservableObject view models
- **Singleton Managers**: Shared managers for core functionality (`ManagerName.shared`)
- **Dependency Injection**: Environment objects for SwiftUI views
- **Reactive Programming**: Published properties with Combine framework

### Key Frameworks Used
```swift
import SwiftUI           // UI layer
import HealthKit         // Health data access
import CoreMotion        // Motion sensors (Apple Watch)
import WatchConnectivity // iPhone-Watch communication
import BackgroundTasks   // Background data processing
import Foundation        // Core Swift functionality
```

## 📋 Coding Standards & Best Practices

### Swift Code Style

#### 1. Manager Classes (Singleton Pattern)
```swift
class ManagerName: ObservableObject {
    static let shared = ManagerName()
    
    @Published var property: Type = defaultValue
    
    private init() {
        // Initialization logic
    }
    
    // MARK: - Public Methods
    func publicMethod() async {
        // Implementation
    }
    
    // MARK: - Private Methods
    private func privateMethod() {
        // Implementation
    }
}
```

#### 2. SwiftUI Views
```swift
struct ViewName: View {
    @StateObject private var manager = Manager.shared
    @EnvironmentObject private var environmentManager: EnvironmentManager
    @State private var localState = false
    
    var body: some View {
        // View implementation
    }
    
    // MARK: - Helper Methods
    private func helperMethod() {
        // Implementation
    }
}
```

#### 3. Data Models (Medical Data)
```swift
struct MedicalDataModel: Codable {
    let timestamp: Date
    let value: Double
    let unit: String
    let userId: String
    let deviceId: String
    
    // Medical thresholds as static constants
    static let normalRange = 1.2...1.4
    static let criticalThreshold = 0.8
}
```

#### 4. Error Handling
```swift
enum HealthKitError: Error, LocalizedError {
    case authorizationDenied
    case dataUnavailable(String)
    case queryFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .authorizationDenied:
            return "HealthKit authorization denied"
        case .dataUnavailable(let message):
            return "Health data unavailable: \(message)"
        case .queryFailed(let message):
            return "Query failed: \(message)"
        }
    }
}
```

### Naming Conventions

#### Files & Classes
- **Managers**: `HealthKitManager.swift`, `WebSocketManager.swift`
- **Views**: `ContentView.swift`, `FallRiskDashboardView.swift`
- **Models**: `GaitAnalysisModels.swift`, `HealthData.swift`
- **Extensions**: `HealthKitExtensions.swift`, `DateExtensions.swift`

#### Properties & Methods
```swift
// Published properties (camelCase)
@Published var isMonitoring = false
@Published var currentGaitMetrics: GaitMetrics?
@Published var fallRiskScore: FallRiskScore?

// Methods (verbs, descriptive)
func startGaitMonitoring() async
func assessFallRisk() async
func sendHealthDataToServer(_ data: HealthData) async throws
```

#### Constants
```swift
// Medical thresholds (uppercase with underscores)
static let NORMAL_WALKING_SPEED_MIN = 1.2
static let FALL_RISK_CRITICAL_THRESHOLD = 3.5
static let GAIT_ASYMMETRY_NORMAL_MAX = 3.0

// Configuration keys (uppercase)
private let HEALTH_DATA_SYNC_IDENTIFIER = "com.healthkitbridge.healthsync"
private let GAIT_MONITORING_IDENTIFIER = "com.healthkitbridge.gaitmonitoring"
```

## 🏥 Medical Data Handling

### HealthKit Data Types
```swift
// Core gait analysis types
let gaitDataTypes: Set<HKObjectType> = [
    HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
    HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!,
    HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
    HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
    HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
    HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed)!
]
```

### Clinical Thresholds
```swift
// Walking speed assessment (m/s)
// Normal: 1.2-1.4, Concerning: 1.0-1.2, High Risk: <1.0
func assessWalkingSpeedRisk(_ speed: Double) -> FallRiskLevel {
    if speed >= 1.2 { return .low }
    else if speed >= 1.0 { return .moderate }
    else if speed >= 0.8 { return .high }
    else { return .critical }
}

// Gait asymmetry assessment (%)
// Normal: <3%, Concerning: 3-5%, High Risk: >5%
func assessGaitAsymmetryRisk(_ asymmetry: Double) -> FallRiskLevel {
    if asymmetry <= 3.0 { return .low }
    else if asymmetry <= 5.0 { return .moderate }
    else if asymmetry <= 8.0 { return .high }
    else { return .critical }
}
```

### Data Transmission Format
```json
{
  "type": "gait_analysis",
  "data": {
    "userId": "user-identifier",
    "deviceId": "device-identifier",
    "timestamp": "2025-09-02T19:30:00Z",
    "gaitMetrics": {
      "averageWalkingSpeed": 1.25,
      "walkingAsymmetry": 2.1,
      "doubleSupportTime": 22.5,
      "mobilityStatus": "good"
    },
    "fallRiskAssessment": {
      "overallScore": 1.8,
      "riskLevel": "Low Risk",
      "riskFactors": [...],
      "recommendations": [...]
    }
  }
}
```

## 🔧 Project-Specific Patterns

### Environment Object Injection
```swift
// Always inject managers as environment objects in App.swift
@StateObject private var fallRiskGaitManager = FallRiskGaitManager.shared
@StateObject private var iPhoneWatchBridge = iPhoneWatchBridge.shared

WindowGroup {
    ContentView()
        .environmentObject(fallRiskGaitManager)
        .environmentObject(iPhoneWatchBridge)
}
```

### Background Task Registration
```swift
// Register all background tasks during app initialization
private func registerBackgroundTasks() {
    BGTaskScheduler.shared.register(
        forTaskWithIdentifier: "com.healthkitbridge.gaitmonitoring",
        using: nil
    ) { task in
        self.handleGaitMonitoring(task: task as! BGAppRefreshTask)
    }
}
```

### WebSocket Data Transmission
```swift
// Always provide structured data transmission methods
func sendGaitAnalysis(_ payload: GaitAnalysisPayload) async throws {
    let message: [String: Any] = [
        "type": "gait_analysis",
        "data": try payload.toDictionary()
    ]
    try await sendJSON(message)
}
```

### Apple Watch Communication
```swift
// iPhone-Watch bridge pattern for real-time data
func sendMessageToWatch(_ type: String, data: [String: Any] = [:]) {
    guard let session = session, session.isReachable else { return }
    
    var message = data
    message["type"] = type
    
    session.sendMessage(message, replyHandler: nil) { error in
        print("❌ Failed to send message to watch: \(error)")
    }
}
```

## 📁 File Organization

### Core Managers
- `HealthKitManager.swift` - HealthKit data collection and authorization
- `FallRiskGaitManager.swift` - Gait analysis and fall risk assessment
- `WebSocketManager.swift` - Real-time data transmission
- `BackgroundTaskManager.swift` - Background processing coordination
- `iPhoneWatchBridge.swift` - iPhone-Apple Watch communication

### Data Models
- `GaitAnalysisModels.swift` - Medical data structures and transmission payloads
- `HealthData.swift` - Core health data models
- `AppConfig.swift` - Configuration management

### UI Components
- `ContentView.swift` - Main dashboard interface
- `FallRiskGaitDashboardView.swift` - Detailed medical analysis view
- `ModernDesignSystem.swift` - Reusable UI components

### Apple Watch
- `WatchApp.swift` - Watch app main structure and UI
- `AppleWatchGaitMonitor.swift` - Real-time gait monitoring on watch

## 🔒 Security & Privacy

### HealthKit Authorization
```swift
// Always request specific permissions with clear usage descriptions
func requestGaitAuthorization() async {
    let gaitTypes: Set<HKSampleType> = [
        HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
        // ... other gait types
    ]
    
    do {
        try await healthStore.requestAuthorization(toShare: [], read: gaitTypes)
    } catch {
        print("❌ HealthKit authorization failed: \(error)")
    }
}
```

### Data Privacy
- **Local Processing First**: Perform analysis on-device when possible
- **Minimal Data Transmission**: Only send essential medical data
- **User Consent**: Explicit consent for all data sharing
- **Encryption**: All WebSocket communications encrypted

### Info.plist Privacy Descriptions
```xml
<key>NSHealthShareUsageDescription</key>
<string>HealthKitBridge needs access to your health data to monitor and analyze your movement patterns, fall risk indicators, and overall health metrics for comprehensive health tracking and analysis.</string>

<key>NSMotionUsageDescription</key>
<string>HealthKitBridge needs access to motion and fitness activity to analyze gait patterns, walking stability, and fall risk assessment for comprehensive mobility monitoring.</string>
```

## 🧪 Testing Guidelines

### Unit Testing Patterns
```swift
class HealthKitManagerTests: XCTestCase {
    var healthManager: HealthKitManager!
    
    override func setUp() {
        super.setUp()
        healthManager = HealthKitManager.shared
    }
    
    func testGaitDataCollection() async {
        // Test gait data collection logic
        await healthManager.fetchGaitMetrics()
        XCTAssertNotNil(healthManager.currentGaitMetrics)
    }
}
```

### Mock Data for Testing
```swift
// Provide realistic medical test data
static let mockGaitMetrics = GaitMetrics(
    timestamp: Date(),
    averageWalkingSpeed: 1.25, // Normal range
    walkingAsymmetry: 2.1,     // Normal range
    doubleSupportTime: 22.5,   // Normal range
    mobilityStatus: .good
)
```

## 🚀 Performance Optimization

### Battery Optimization
```swift
// Adaptive monitoring based on battery level
func shouldReduceMonitoring() -> Bool {
    return UIDevice.current.batteryLevel < 0.2 && 
           UIDevice.current.batteryState != .charging
}

// Optimized sync intervals
var optimizedSyncInterval: TimeInterval {
    return shouldReduceMonitoring() ? 120.0 : 60.0
}
```

### Background Efficiency
```swift
// Efficient background data processing
private func handleGaitMonitoring(task: BGAppRefreshTask) {
    task.expirationHandler = {
        queue.cancelAllOperations()
    }
    
    let gaitOperation = BlockOperation {
        Task {
            await FallRiskGaitManager.shared.fetchGaitMetrics()
            await FallRiskGaitManager.shared.assessFallRisk()
        }
    }
    
    gaitOperation.completionBlock = {
        task.setTaskCompleted(success: !gaitOperation.isCancelled)
    }
}
```

## 🐛 Debugging & Logging

### Consistent Logging
```swift
// Use emoji prefixes for easy log filtering
print("🏃‍♂️ Starting gait monitoring")
print("📊 Processing health data")
print("❌ Error occurred: \(error)")
print("✅ Operation completed successfully")
print("⚠️ Warning: Low battery, reducing monitoring")
```

### Error Handling Pattern
```swift
do {
    try await riskyOperation()
    print("✅ Operation completed")
} catch HealthKitError.authorizationDenied {
    print("❌ HealthKit authorization denied")
    // Handle authorization error
} catch {
    print("❌ Unexpected error: \(error)")
    // Handle generic error
}
```

## 📚 Documentation Standards

### Code Comments
```swift
// MARK: - Fall Risk Assessment
/// Calculates fall risk score based on multiple gait parameters
/// - Returns: FallRiskScore with assessment and recommendations
/// - Note: Uses clinical thresholds from geriatric medicine research
func assessFallRisk() async -> FallRiskScore {
    // Implementation
}
```

### README Updates
When adding new features, update:
1. Core Features section with medical capabilities
2. Integration status in `INTEGRATION_STATUS.md`
3. API documentation for WebSocket payloads
4. Clinical metrics and thresholds documentation

## 🎯 Medical Domain Knowledge

### Fall Risk Factors
- **Walking Speed**: Primary predictor of fall risk in older adults
- **Gait Asymmetry**: Indicates balance or neurological issues
- **Double Support Time**: Increased time suggests instability
- **Step Length**: Reduced length indicates caution or mobility limitation

### Clinical Assessment Scales
- **Fall Risk Score**: 1.0-4.0 scale (Low/Moderate/High/Critical)
- **Balance Assessment**: 0-10 clinical scale
- **Mobility Status**: Categorical assessment (Excellent/Good/Concerning/Impaired)

### Evidence-Based Thresholds
All medical thresholds in the app are based on published geriatric medicine research. When modifying thresholds, reference clinical literature and document sources.

## 🔄 Continuous Integration

### Code Quality
- Follow Swift API Design Guidelines
- Use SwiftLint for consistent formatting
- Maintain >80% test coverage for critical health logic
- Document all public APIs with proper Swift documentation

### Deployment
- Test on physical devices (iPhone + Apple Watch)
- Validate HealthKit permissions on iOS
- Test real-time data transmission
- Verify medical analysis accuracy with known datasets

---

**Remember: This is a medical application handling sensitive health data. Always prioritize privacy, security, and clinical accuracy in all development decisions.**
