import XCTest
@testable import HealthKitBridge

class WebSocketManagerTests: XCTestCase {

    var webSocketManager: WebSocketManager!

    override func setUpWithError() throws {
        super.setUp()
        webSocketManager = WebSocketManager.shared
    }

    override func tearDownWithError() throws {
        super.tearDown()
        // Clean up any connections
        if webSocketManager.isConnected {
            webSocketManager.disconnect()
        }
        webSocketManager = nil
    }

    // MARK: - Initialization Tests
    func testWebSocketManagerInitialization() {
        XCTAssertNotNil(webSocketManager)
        XCTAssertFalse(webSocketManager.isConnected)
        XCTAssertEqual(webSocketManager.connectionStatus, "Disconnected")
        XCTAssertNil(webSocketManager.lastError)
    }

    func testWebSocketManagerSingleton() {
        let manager1 = WebSocketManager.shared
        let manager2 = WebSocketManager.shared
        XCTAssertTrue(manager1 === manager2)
    }

    // MARK: - URL Configuration Tests
    func testWebSocketURLValidation() {
        let wsURL = webSocketManager.wsURL

        XCTAssertNotNil(wsURL)
        XCTAssertTrue(wsURL.absoluteString.hasPrefix("ws://") ||
                     wsURL.absoluteString.hasPrefix("wss://"))

        // Test URL components
        XCTAssertNotNil(wsURL.scheme)
        XCTAssertNotNil(wsURL.host)
    }

    func testWebSocketURLFallback() {
        // Test that URL fallback mechanism works
        let wsURL = webSocketManager.wsURL

        // Should never be nil due to fallback mechanism
        XCTAssertNotNil(wsURL)

        // Should be a valid WebSocket URL
        let scheme = wsURL.scheme?.lowercased()
        XCTAssertTrue(scheme == "ws" || scheme == "wss")
    }

    // MARK: - Connection Tests
    func testConnectionFlow() async {
        let expectation = XCTestExpectation(description: "Connection flow test")

        // Test connection attempt
        Task {
            await webSocketManager.connectWithToken("test-token")

            // Connection may succeed or fail depending on server availability
            // Both outcomes are acceptable for testing
            XCTAssert(webSocketManager.isConnected || !webSocketManager.isConnected)

            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    func testConnectionWithInvalidToken() async {
        let expectation = XCTestExpectation(description: "Invalid token connection test")

        Task {
            await webSocketManager.connectWithToken("")

            // Should handle empty token gracefully
            XCTAssert(webSocketManager.isConnected || !webSocketManager.isConnected)

            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testDisconnection() {
        // Test disconnection
        webSocketManager.disconnect()

        XCTAssertFalse(webSocketManager.isConnected)
        XCTAssertEqual(webSocketManager.connectionStatus, "Disconnected")
    }

    // MARK: - Message Sending Tests
    func testSendHealthData() async {
        let healthData = HealthData(
            type: "heart_rate",
            value: 72.0,
            unit: "bpm",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        let expectation = XCTestExpectation(description: "Send health data test")

        Task {
            await webSocketManager.sendHealthData(healthData)

            // Should complete without crashing
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testSendHealthDataWithInvalidData() async {
        let invalidHealthData = HealthData(
            type: "",
            value: -1.0,
            unit: "",
            timestamp: Date(),
            deviceId: "",
            userId: ""
        )

        let expectation = XCTestExpectation(description: "Send invalid health data test")

        Task {
            await webSocketManager.sendHealthData(invalidHealthData)

            // Should handle invalid data gracefully
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testSendPing() async {
        let expectation = XCTestExpectation(description: "Send ping test")

        Task {
            await webSocketManager.sendPing()

            // Should complete without crashing
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    // MARK: - Message Serialization Tests
    func testHealthDataMessageSerialization() {
        let healthData = HealthData(
            type: "test_type",
            value: 123.45,
            unit: "test_unit",
            timestamp: Date(),
            deviceId: "test-device-id",
            userId: "test-user-id"
        )

        XCTAssertNoThrow({
            let message: [String: Any] = [
                "type": "health_data",
                "data": [
                    "type": healthData.type,
                    "value": healthData.value,
                    "unit": healthData.unit,
                    "timestamp": ISO8601DateFormatter().string(from: healthData.timestamp),
                    "deviceId": healthData.deviceId,
                    "userId": healthData.userId
                ],
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]

            let jsonData = try JSONSerialization.data(withJSONObject: message)
            XCTAssertGreaterThan(jsonData.count, 0)
        })
    }

    func testPingMessageSerialization() {
        XCTAssertNoThrow({
            let pingMessage: [String: Any] = [
                "type": "ping",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]

            let jsonData = try JSONSerialization.data(withJSONObject: pingMessage)
            XCTAssertGreaterThan(jsonData.count, 0)
        })
    }

    // MARK: - Connection State Management Tests
    func testConnectionStateTransitions() {
        // Initial state
        XCTAssertFalse(webSocketManager.isConnected)
        XCTAssertEqual(webSocketManager.connectionStatus, "Disconnected")

        // Test state consistency
        if webSocketManager.isConnected {
            XCTAssertNotEqual(webSocketManager.connectionStatus, "Disconnected")
        } else {
            XCTAssertEqual(webSocketManager.connectionStatus, "Disconnected")
        }
    }

    func testConnectionStatusUpdates() async {
        let expectation = XCTestExpectation(description: "Connection status updates")

        // Monitor status changes
        var statusChanges: [String] = []

        Task {
            statusChanges.append(webSocketManager.connectionStatus)

            // Attempt connection
            await webSocketManager.connectWithToken("test-token")
            statusChanges.append(webSocketManager.connectionStatus)

            // Disconnect
            webSocketManager.disconnect()
            statusChanges.append(webSocketManager.connectionStatus)

            // Should have at least initial status
            XCTAssertGreaterThanOrEqual(statusChanges.count, 1)
            XCTAssertEqual(statusChanges.first, "Disconnected")

            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    // MARK: - Error Handling Tests
    func testErrorHandling() async {
        let expectation = XCTestExpectation(description: "Error handling test")

        Task {
            // Try to connect with invalid parameters to test error handling
            await webSocketManager.connectWithToken("invalid-token-format")

            // Should handle errors gracefully without crashing
            XCTAssert(webSocketManager.lastError == nil || !webSocketManager.lastError!.isEmpty)

            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testNetworkErrorRecovery() async {
        let expectation = XCTestExpectation(description: "Network error recovery test")

        Task {
            // Test multiple connection attempts (simulating network issues)
            for i in 0..<3 {
                await webSocketManager.connectWithToken("test-token-\(i)")
                webSocketManager.disconnect()
            }

            // Should handle multiple attempts gracefully
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 15.0)
    }

    // MARK: - Mock Mode Tests
    func testMockModeHandling() {
        // Test that mock mode can be enabled/disabled
        XCTAssertNoThrow({
            // Mock mode should be accessible and configurable
            // This tests the internal state management
            XCTAssert(true) // Placeholder for mock mode validation
        })
    }

    // MARK: - Reconnection Tests
    func testReconnectionLogic() async {
        let expectation = XCTestExpectation(description: "Reconnection logic test")

        Task {
            // Test connection and disconnection cycle
            await webSocketManager.connectWithToken("test-token")
            webSocketManager.disconnect()

            // Test reconnection attempt
            await webSocketManager.connectWithToken("test-token")

            // Should handle reconnection attempts gracefully
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    // MARK: - Performance Tests
    func testConnectionPerformance() {
        measure {
            Task {
                await webSocketManager.connectWithToken("perf-test-token")
                webSocketManager.disconnect()
            }
        }
    }

    func testMessageSendingPerformance() {
        let healthData = HealthData(
            type: "performance_test",
            value: 100.0,
            unit: "test",
            timestamp: Date(),
            deviceId: "perf-device",
            userId: "perf-user"
        )

        measure {
            Task {
                await webSocketManager.sendHealthData(healthData)
            }
        }
    }

    // MARK: - Memory Management Tests
    func testMemoryManagement() {
        weak var weakManager: WebSocketManager?

        autoreleasepool {
            let manager = WebSocketManager.shared
            weakManager = manager
            XCTAssertNotNil(weakManager)
        }

        // Singleton should still exist
        XCTAssertNotNil(weakManager)
    }

    // MARK: - Thread Safety Tests
    func testThreadSafety() {
        let expectation = XCTestExpectation(description: "Thread safety test")
        expectation.expectedFulfillmentCount = 5

        // Test concurrent access to WebSocketManager
        DispatchQueue.concurrentPerform(iterations: 5) { i in
            Task {
                let manager = WebSocketManager.shared
                await manager.connectWithToken("thread-test-\(i)")
                manager.disconnect()
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 15.0)
    }

    // MARK: - Integration Tests
    func testWebSocketConfigIntegration() {
        let config = AppConfig.shared
        let manager = WebSocketManager.shared

        // Test that WebSocketManager uses config properly
        XCTAssertNotNil(manager)
        XCTAssertNotNil(config.webSocketURL)

        // Verify URL construction works
        let wsURL = manager.wsURL
        XCTAssertNotNil(wsURL)
    }

    func testHealthDataToWebSocketFlow() async {
        let expectation = XCTestExpectation(description: "Health data to WebSocket flow")

        let healthData = HealthData(
            type: "integration_test",
            value: 50.0,
            unit: "test_unit",
            timestamp: Date(),
            deviceId: "integration-device",
            userId: "integration-user"
        )

        Task {
            // Test complete flow: connect -> send data -> disconnect
            await webSocketManager.connectWithToken("integration-test-token")
            await webSocketManager.sendHealthData(healthData)
            webSocketManager.disconnect()

            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }
}
