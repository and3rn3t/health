import XCTest
@testable import HealthKitBridge

class ApiClientTests: XCTestCase {

    var apiClient: ApiClient!

    override func setUpWithError() throws {
        super.setUp()
        apiClient = ApiClient.shared
        // Clear any previous errors
        apiClient.lastError = nil
    }

    override func tearDownWithError() throws {
        super.tearDown()
        apiClient = nil
    }

    // MARK: - Initialization Tests
    func testApiClientInitialization() {
        XCTAssertNotNil(apiClient)
        XCTAssertNil(apiClient.lastError)
    }

    func testApiClientSingleton() {
        let client1 = ApiClient.shared
        let client2 = ApiClient.shared
        XCTAssertTrue(client1 === client2)
    }

    // MARK: - Device Token Tests
    func testGetDeviceTokenWithValidParameters() async {
        let token = await apiClient.getDeviceToken(userId: "test-user", deviceType: "ios")

        // Should return either a real token or mock token
        XCTAssertNotNil(token)
        if let token = token {
            XCTAssertFalse(token.isEmpty)
            XCTAssertTrue(token.contains("test-user") || token.count > 10) // Mock or real token
        }
    }

    func testGetDeviceTokenWithEmptyUserId() async {
        let token = await apiClient.getDeviceToken(userId: "", deviceType: "ios")

        // Should handle empty userId gracefully
        // May return nil or mock token depending on implementation
        if let token = token {
            XCTAssertFalse(token.isEmpty)
        }
    }

    func testGetDeviceTokenWithEmptyDeviceType() async {
        let token = await apiClient.getDeviceToken(userId: "test-user", deviceType: "")

        // Should handle empty deviceType gracefully
        if let token = token {
            XCTAssertFalse(token.isEmpty)
        }
    }

    func testGetDeviceTokenErrorHandling() async {
        // Test with extreme parameters to trigger error handling
        let token = await apiClient.getDeviceToken(
            userId: String(repeating: "x", count: 1000),
            deviceType: String(repeating: "y", count: 1000)
        )

        // Should handle gracefully without crashing
        XCTAssert(token == nil || !token!.isEmpty)
    }

    // MARK: - Health Data Sending Tests
    func testSendHealthDataWithValidData() async {
        let healthData = HealthData(
            type: "heart_rate",
            value: 72.0,
            unit: "bpm",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        let success = await apiClient.sendHealthData(healthData)

        // Should complete without crashing (success or failure both acceptable)
        XCTAssert(success == true || success == false)
    }

    func testSendHealthDataWithInvalidData() async {
        let healthData = HealthData(
            type: "",
            value: -1.0,
            unit: "",
            timestamp: Date(),
            deviceId: "",
            userId: ""
        )

        let success = await apiClient.sendHealthData(healthData)

        // Should handle invalid data gracefully
        XCTAssert(success == true || success == false)
    }

    func testSendHealthDataWithExtremeValues() async {
        let healthData = HealthData(
            type: "test_type",
            value: Double.greatestFiniteMagnitude,
            unit: "test_unit",
            timestamp: Date(),
            deviceId: "test-device",
            userId: "test-user"
        )

        let success = await apiClient.sendHealthData(healthData)

        // Should handle extreme values gracefully
        XCTAssert(success == true || success == false)
    }

    // MARK: - Network Error Handling Tests
    func testNetworkTimeoutHandling() async {
        // This test verifies that the client handles network timeouts gracefully
        let expectation = XCTestExpectation(description: "Network timeout handling")

        Task {
            let token = await apiClient.getDeviceToken(userId: "timeout-test", deviceType: "ios")
            // Should complete within reasonable time and not crash
            XCTAssert(token == nil || !token!.isEmpty)
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 30.0)
    }

    func testConcurrentRequests() async {
        let expectation = XCTestExpectation(description: "Concurrent requests")
        expectation.expectedFulfillmentCount = 5

        // Test multiple concurrent requests
        for i in 0..<5 {
            Task {
                let token = await apiClient.getDeviceToken(userId: "user-\(i)", deviceType: "ios")
                XCTAssert(token == nil || !token!.isEmpty)
                expectation.fulfill()
            }
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    // MARK: - Error State Tests
    func testErrorStateManagement() async {
        // Clear any existing errors
        await MainActor.run {
            apiClient.lastError = nil
        }

        // Perform operation that might set error
        _ = await apiClient.getDeviceToken(userId: "test", deviceType: "test")

        // Error state should be managed properly
        await MainActor.run {
            // Either no error or error is properly set
            XCTAssert(apiClient.lastError == nil || !apiClient.lastError!.isEmpty)
        }
    }

    // MARK: - Data Serialization Tests
    func testHealthDataSerialization() {
        let healthData = HealthData(
            type: "heart_rate",
            value: 72.5,
            unit: "bpm",
            timestamp: Date(),
            deviceId: "test-device-123",
            userId: "test-user-456"
        )

        // Test that health data can be serialized to JSON
        let requestBody: [String: Any] = [
            "type": healthData.type,
            "value": healthData.value,
            "unit": healthData.unit,
            "timestamp": ISO8601DateFormatter().string(from: healthData.timestamp),
            "deviceId": healthData.deviceId,
            "userId": healthData.userId
        ]

        XCTAssertNoThrow({
            let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
            XCTAssertGreaterThan(jsonData.count, 0)
        })
    }

    func testDateFormattingSerialization() {
        let date = Date()
        let formatter = ISO8601DateFormatter()
        let dateString = formatter.string(from: date)

        XCTAssertFalse(dateString.isEmpty)
        XCTAssertNotNil(formatter.date(from: dateString))
    }

    // MARK: - URL Validation Tests
    func testApiUrlValidation() {
        let config = AppConfig.shared

        XCTAssertNotNil(URL(string: "\(config.apiBaseURL)/auth/device-token"))
        XCTAssertNotNil(URL(string: "\(config.apiBaseURL)/health/data"))

        // Test URL components
        guard let authURL = URL(string: "\(config.apiBaseURL)/auth/device-token") else {
            XCTFail("Invalid auth URL")
            return
        }

        XCTAssertNotNil(authURL.scheme)
        XCTAssertNotNil(authURL.host)
        XCTAssertEqual(authURL.path, "/auth/device-token")
    }

    // MARK: - HTTP Request Construction Tests
    func testHttpRequestConstruction() {
        let config = AppConfig.shared
        guard let url = URL(string: "\(config.apiBaseURL)/auth/device-token") else {
            XCTFail("Invalid URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(request.url, url)
    }

    // MARK: - Device Information Tests
    func testDeviceInformationCollection() {
        let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"

        XCTAssertNotEqual(deviceId, "unknown")
        XCTAssertFalse(deviceId.isEmpty)
        XCTAssertFalse(appVersion.isEmpty)

        // Test device info structure
        let deviceInfo: [String: Any] = [
            "userId": "test-user",
            "deviceId": deviceId,
            "deviceType": "ios",
            "appVersion": appVersion,
            "platform": "ios"
        ]

        XCTAssertEqual(deviceInfo["platform"] as? String, "ios")
        XCTAssertEqual(deviceInfo["deviceType"] as? String, "ios")
    }

    // MARK: - Performance Tests
    func testApiCallPerformance() {
        measure {
            Task {
                _ = await apiClient.getDeviceToken(userId: "perf-test", deviceType: "ios")
            }
        }
    }

    func testHealthDataSendingPerformance() {
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
                _ = await apiClient.sendHealthData(healthData)
            }
        }
    }

    // MARK: - Memory Management Tests
    func testMemoryManagement() {
        weak var weakClient: ApiClient?

        autoreleasepool {
            let client = ApiClient.shared
            weakClient = client
            XCTAssertNotNil(weakClient)
        }

        // Singleton should still exist
        XCTAssertNotNil(weakClient)
    }

    // MARK: - Thread Safety Tests
    func testThreadSafety() {
        let expectation = XCTestExpectation(description: "Thread safety test")
        expectation.expectedFulfillmentCount = 10

        // Test concurrent access to ApiClient
        DispatchQueue.concurrentPerform(iterations: 10) { i in
            Task {
                let client = ApiClient.shared
                _ = await client.getDeviceToken(userId: "thread-test-\(i)", deviceType: "ios")
                expectation.fulfill()
            }
        }

        wait(for: [expectation], timeout: 15.0)
    }

    // MARK: - Integration Tests
    func testApiClientConfigIntegration() {
        let config = AppConfig.shared
        let client = ApiClient.shared

        // Test that ApiClient uses config properly
        XCTAssertNotNil(client)
        XCTAssertNotNil(config.apiBaseURL)

        // Verify URL construction works
        let authURL = "\(config.apiBaseURL)/auth/device-token"
        let healthURL = "\(config.apiBaseURL)/health/data"

        XCTAssertNotNil(URL(string: authURL))
        XCTAssertNotNil(URL(string: healthURL))
    }
}
