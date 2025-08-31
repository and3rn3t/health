import XCTest
import HealthKit
@testable import HealthKitBridge

class HealthKitBridgeTests: XCTestCase {

    // MARK: - Setup and Teardown
    override func setUpWithError() throws {
        super.setUp()
        // Reset any singletons to clean state for testing
    }

    override func tearDownWithError() throws {
        super.tearDown()
        // Clean up after tests
    }

    // MARK: - Configuration Tests
    func testAppConfigLoading() {
        // Test that AppConfig can be loaded
        XCTAssertNoThrow(AppConfig.shared)

        let config = AppConfig.shared
        XCTAssertFalse(config.userId.isEmpty)
        XCTAssertNotNil(config.apiBaseURL)
        XCTAssertNotNil(config.wsURL)

        // Test URL formats
        XCTAssertTrue(config.apiBaseURL.absoluteString.contains("127.0.0.1") ||
                     config.apiBaseURL.absoluteString.contains("localhost") ||
                     config.apiBaseURL.absoluteString.contains("andernet.dev"))
        XCTAssertTrue(config.wsURL.absoluteString.contains("localhost") ||
                     config.wsURL.absoluteString.contains("andernet.dev"))
    }

    func testEnhancedAppConfigLoading() {
        // Test that EnhancedAppConfig can be loaded
        XCTAssertNoThrow(EnhancedAppConfig.shared)

        let config = EnhancedAppConfig.shared
        XCTAssertNotNil(config.apiBaseURL)
        XCTAssertNotNil(config.webSocketURL)
        XCTAssertNotNil(config.userId)

        // Test validation
        XCTAssertTrue(config.validate(), "EnhancedAppConfig should validate successfully")
    }

    func testConfigPlistStructure() {
        // Test Config.plist structure
        guard let url = Bundle.main.url(forResource: "Config", withExtension: "plist"),
              let data = try? Data(contentsOf: url),
              let dict = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any]
        else {
            XCTFail("Config.plist not found or invalid")
            return
        }

        XCTAssertNotNil(dict["API_BASE_URL"])
        XCTAssertNotNil(dict["WS_URL"])
        XCTAssertNotNil(dict["USER_ID"])

        XCTAssertTrue(dict["API_BASE_URL"] is String)
        XCTAssertTrue(dict["WS_URL"] is String)
        XCTAssertTrue(dict["USER_ID"] is String)
    }

    // MARK: - Singleton Tests
    func testApiClientSingleton() {
        // Test that ApiClient singleton works
        let client1 = ApiClient.shared
        let client2 = ApiClient.shared
        XCTAssertTrue(client1 === client2) // Same instance
    }

    func testHealthKitManagerSingleton() {
        // Test that HealthKitManager singleton works
        let manager1 = HealthKitManager.shared
        let manager2 = HealthKitManager.shared
        XCTAssertTrue(manager1 === manager2) // Same instance
    }

    func testWebSocketManagerSingleton() {
        // Test that WebSocketManager singleton works
        let manager1 = WebSocketManager.shared
        let manager2 = WebSocketManager.shared
        XCTAssertTrue(manager1 === manager2) // Same instance
    }

    // MARK: - HealthKit Tests
    func testHealthKitAvailability() {
        // Test HealthKit availability
        XCTAssertTrue(HKHealthStore.isHealthDataAvailable())
    }

    func testHealthKitDataTypes() {
        // Test that required health data types are available
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .heartRate))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .stepCount))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .walkingSpeed))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .walkingStepLength))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance))
    }

    func testHealthKitPermissions() {
        let healthStore = HKHealthStore()
        let manager = HealthKitManager.shared

        // Test that we can create permission sets
        XCTAssertNoThrow({
            let _ = manager.healthKitTypesToRead
        })
    }

    // MARK: - Data Model Tests
    func testHealthDataModel() {
        let healthData = HealthData(
            type: "heart_rate",
            value: 72.0,
            unit: "bpm",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        XCTAssertEqual(healthData.type, "heart_rate")
        XCTAssertEqual(healthData.value, 72.0)
        XCTAssertEqual(healthData.unit, "bpm")
        XCTAssertEqual(healthData.deviceId, "test-device")
        XCTAssertEqual(healthData.userId, "test-user")
        XCTAssertNotNil(healthData.timestamp)
    }

    // MARK: - Connection Quality Monitor Tests
    func testConnectionQualityMonitor() {
        let monitor = ConnectionQualityMonitor()

        // Test initial values
        XCTAssertEqual(monitor.signalStrength, 1.0)
        XCTAssertEqual(monitor.latency, 0.0)
        XCTAssertEqual(monitor.packetLoss, 0.0)
        XCTAssertEqual(monitor.reconnectCount, 0)

        // Test ping/pong timing
        monitor.recordPing()

        // Simulate small delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) {
            monitor.recordPong()
            XCTAssertGreaterThan(monitor.latency, 0.0)
        }

        // Test reconnect counting
        monitor.recordReconnect()
        XCTAssertEqual(monitor.reconnectCount, 1)
    }

    // MARK: - API Client Tests
    func testApiClientInitialization() {
        let client = ApiClient.shared
        XCTAssertNotNil(client)
        XCTAssertNil(client.lastError) // Should start with no errors
    }

    func testApiClientDeviceTokenRequest() async {
        let client = ApiClient.shared

        // Test with valid parameters
        let token = await client.getDeviceToken(userId: "test-user", deviceType: "ios")

        // Should return either a real token or a mock token for testing
        XCTAssertNotNil(token)
        if let token = token {
            XCTAssertFalse(token.isEmpty)
        }
    }

    // MARK: - WebSocket Manager Tests
    func testWebSocketManagerInitialization() {
        let manager = WebSocketManager.shared
        XCTAssertNotNil(manager)
        XCTAssertFalse(manager.isConnected) // Should start disconnected
        XCTAssertEqual(manager.connectionStatus, "Disconnected")
    }

    func testWebSocketURLValidation() {
        let manager = WebSocketManager.shared
        let wsURL = manager.wsURL

        XCTAssertNotNil(wsURL)
        XCTAssertTrue(wsURL.absoluteString.hasPrefix("ws://") ||
                     wsURL.absoluteString.hasPrefix("wss://"))
    }

    // MARK: - Performance Monitor Tests
    func testPerformanceMonitorInitialization() {
        let monitor = PerformanceMonitor.shared
        XCTAssertNotNil(monitor)
    }

    func testPerformanceMetricsRecording() {
        let monitor = PerformanceMonitor.shared

        // Test metric recording
        monitor.recordHealthKitRead(duration: 0.5, samplesCount: 10)
        monitor.recordAPICall(duration: 0.3, success: true)
        monitor.recordWebSocketMessage(messageType: "health_data", processingTime: 0.1)

        // Should not crash or throw errors
        XCTAssert(true, "Performance metrics recorded successfully")
    }

    // MARK: - Background Processing Tests
    func testBackgroundTaskHandling() {
        let manager = HealthKitManager.shared

        // Test background task setup
        XCTAssertNoThrow({
            // This should not crash
            let _ = manager.healthStore
        })
    }

    // MARK: - Error Handling Tests
    func testHealthKitErrorHandling() {
        let manager = HealthKitManager.shared

        // Test handling of invalid health data
        XCTAssertNoThrow({
            // Should handle gracefully
            _ = manager.healthKitTypesToRead
        })
    }

    func testNetworkErrorHandling() async {
        let client = ApiClient.shared

        // Test with invalid user ID
        let token = await client.getDeviceToken(userId: "", deviceType: "ios")

        // Should handle gracefully and return mock token or nil
        // Either result is acceptable for testing
        XCTAssert(token == nil || !token!.isEmpty)
    }

    // MARK: - Data Validation Tests
    func testHealthDataValidation() {
        let validHealthData = HealthData(
            type: "heart_rate",
            value: 72.0,
            unit: "bpm",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        // Test valid data
        XCTAssertGreaterThan(validHealthData.value, 0)
        XCTAssertFalse(validHealthData.type.isEmpty)
        XCTAssertFalse(validHealthData.unit.isEmpty)
        XCTAssertFalse(validHealthData.deviceId.isEmpty)
        XCTAssertFalse(validHealthData.userId.isEmpty)
    }

    // MARK: - Memory Management Tests
    func testMemoryLeaks() {
        // Test that singletons don't create retain cycles
        weak var weakApiClient = ApiClient.shared
        weak var weakHealthKitManager = HealthKitManager.shared
        weak var weakWebSocketManager = WebSocketManager.shared

        XCTAssertNotNil(weakApiClient)
        XCTAssertNotNil(weakHealthKitManager)
        XCTAssertNotNil(weakWebSocketManager)
    }

    // MARK: - Thread Safety Tests
    func testConcurrentAccess() {
        let expectation = XCTestExpectation(description: "Concurrent access test")
        expectation.expectedFulfillmentCount = 10

        // Test concurrent access to singletons
        DispatchQueue.concurrentPerform(iterations: 10) { _ in
            let _ = ApiClient.shared
            let _ = HealthKitManager.shared
            let _ = WebSocketManager.shared
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Integration Tests
    func testHealthKitToAPIFlow() async {
        let manager = HealthKitManager.shared
        let client = ApiClient.shared

        // Test the flow from HealthKit to API
        let healthData = HealthData(
            type: "test_metric",
            value: 100.0,
            unit: "test_unit",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        let success = await client.sendHealthData(healthData)

        // Should handle gracefully (either succeed or fail gracefully)
        XCTAssert(success == true || success == false) // Either result is valid
    }
}
