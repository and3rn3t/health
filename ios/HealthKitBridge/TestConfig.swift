import Foundation

/// Test configuration helper for accessing test-specific settings
struct TestConfig {
    static let shared = TestConfig()

    private init() {}

    // MARK: - Environment Variables

    var testHostURL: String {
        ProcessInfo.processInfo.environment["TEST_HOST_URL"] ?? "http://127.0.0.1:8789"
    }

    var testWebSocketURL: String {
        ProcessInfo.processInfo.environment["TEST_WEBSOCKET_URL"] ?? "ws://localhost:3001"
    }

    var testTimeout: TimeInterval {
        if let timeoutString = ProcessInfo.processInfo.environment["TEST_TIMEOUT"],
           let timeout = TimeInterval(timeoutString) {
            return timeout
        }
        return 30.0
    }

    var isUnitTestMode: Bool {
        ProcessInfo.processInfo.environment["UNIT_TEST_MODE"] == "1"
    }

    var isUITestMode: Bool {
        ProcessInfo.processInfo.environment["UI_TEST_MODE"] == "1"
    }

    var isPerformanceTestMode: Bool {
        ProcessInfo.processInfo.environment["PERFORMANCE_TEST_MODE"] == "1"
    }

    // MARK: - Mock Configuration

    var shouldMockHealthKitData: Bool {
        ProcessInfo.processInfo.environment["MOCK_HEALTHKIT_DATA"] == "YES"
    }

    var shouldMockAPIResponses: Bool {
        ProcessInfo.processInfo.environment["MOCK_API_RESPONSES"] == "YES"
    }

    var shouldMockWebSocketResponses: Bool {
        ProcessInfo.processInfo.environment["MOCK_WEBSOCKET_RESPONSES"] == "YES"
    }

    // MARK: - Performance Thresholds

    var maxMemoryUsageMB: Double {
        if let memoryString = ProcessInfo.processInfo.environment["MAX_MEMORY_USAGE_MB"],
           let memory = Double(memoryString) {
            return memory
        }
        return 100.0
    }

    var maxCPUUsagePercent: Double {
        if let cpuString = ProcessInfo.processInfo.environment["MAX_CPU_USAGE_PERCENT"],
           let cpu = Double(cpuString) {
            return cpu
        }
        return 80.0
    }

    var maxResponseTimeMS: Double {
        if let responseString = ProcessInfo.processInfo.environment["MAX_RESPONSE_TIME_MS"],
           let responseTime = Double(responseString) {
            return responseTime
        }
        return 2000.0
    }

    var maxStartupTimeMS: Double {
        if let startupString = ProcessInfo.processInfo.environment["MAX_STARTUP_TIME_MS"],
           let startupTime = Double(startupString) {
            return startupTime
        }
        return 5000.0
    }

    // MARK: - Test Data

    var testUserID: String {
        ProcessInfo.processInfo.environment["TEST_USER_ID"] ?? "test-user-123"
    }

    var testDeviceToken: String {
        ProcessInfo.processInfo.environment["TEST_DEVICE_TOKEN"] ?? "test-device-token-456"
    }

    var testAPIKey: String {
        ProcessInfo.processInfo.environment["TEST_API_KEY"] ?? "test-api-key-789"
    }

    // MARK: - Debugging

    var logLevel: String {
        ProcessInfo.processInfo.environment["LOG_LEVEL"] ?? "INFO"
    }

    var enableTestLogging: Bool {
        ProcessInfo.processInfo.environment["ENABLE_TEST_LOGGING"] == "YES"
    }

    var captureScreenshots: Bool {
        ProcessInfo.processInfo.environment["CAPTURE_SCREENSHOTS"] == "YES"
    }

    var saveTestArtifacts: Bool {
        ProcessInfo.processInfo.environment["SAVE_TEST_ARTIFACTS"] == "YES"
    }

    // MARK: - Helper Methods

    func isRunningTests() -> Bool {
        return NSClassFromString("XCTest") != nil
    }

    func testDataDirectory() -> URL? {
        guard let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return nil
        }
        return documentsURL.appendingPathComponent("TestData")
    }

    func ensureTestDataDirectory() throws {
        guard let testDataDir = testDataDirectory() else {
            throw TestConfigError.failedToCreateTestDirectory
        }

        if !FileManager.default.fileExists(atPath: testDataDir.path) {
            try FileManager.default.createDirectory(at: testDataDir, withIntermediateDirectories: true)
        }
    }

    func cleanupTestData() throws {
        guard let testDataDir = testDataDirectory() else { return }

        if FileManager.default.fileExists(atPath: testDataDir.path) {
            try FileManager.default.removeItem(at: testDataDir)
        }
    }
}

enum TestConfigError: Error {
    case failedToCreateTestDirectory
    case testDataCleanupFailed

    var localizedDescription: String {
        switch self {
        case .failedToCreateTestDirectory:
            return "Failed to create test data directory"
        case .testDataCleanupFailed:
            return "Failed to cleanup test data"
        }
    }
}
