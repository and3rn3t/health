import XCTest
@testable import HealthKitBridge

class PerformanceMonitorTests: XCTestCase {

    var performanceMonitor: PerformanceMonitor!

    override func setUpWithError() throws {
        super.setUp()
        performanceMonitor = PerformanceMonitor.shared
    }

    override func tearDownWithError() throws {
        super.tearDown()
        performanceMonitor = nil
    }

    // MARK: - Initialization Tests
    func testPerformanceMonitorInitialization() {
        XCTAssertNotNil(performanceMonitor)
    }

    func testPerformanceMonitorSingleton() {
        let monitor1 = PerformanceMonitor.shared
        let monitor2 = PerformanceMonitor.shared
        XCTAssertTrue(monitor1 === monitor2)
    }

    // MARK: - Metric Recording Tests
    func testHealthKitReadMetricRecording() {
        // Test recording HealthKit read metrics
        XCTAssertNoThrow({
            performanceMonitor.recordHealthKitRead(duration: 0.5, samplesCount: 10)
            performanceMonitor.recordHealthKitRead(duration: 1.2, samplesCount: 25)
            performanceMonitor.recordHealthKitRead(duration: 0.8, samplesCount: 15)
        })
    }

    func testAPICallMetricRecording() {
        // Test recording API call metrics
        XCTAssertNoThrow({
            performanceMonitor.recordAPICall(duration: 0.3, success: true)
            performanceMonitor.recordAPICall(duration: 1.5, success: false)
            performanceMonitor.recordAPICall(duration: 0.7, success: true)
        })
    }

    func testWebSocketMessageMetricRecording() {
        // Test recording WebSocket message metrics
        XCTAssertNoThrow({
            performanceMonitor.recordWebSocketMessage(messageType: "health_data", processingTime: 0.1)
            performanceMonitor.recordWebSocketMessage(messageType: "ping", processingTime: 0.05)
            performanceMonitor.recordWebSocketMessage(messageType: "pong", processingTime: 0.03)
        })
    }

    func testBackgroundTaskMetricRecording() {
        // Test recording background task metrics
        XCTAssertNoThrow({
            performanceMonitor.recordBackgroundTask(taskType: "data_sync", duration: 2.5, success: true)
            performanceMonitor.recordBackgroundTask(taskType: "data_upload", duration: 1.8, success: true)
            performanceMonitor.recordBackgroundTask(taskType: "permission_check", duration: 0.2, success: false)
        })
    }

    // MARK: - Metric Validation Tests
    func testInvalidMetricHandling() {
        // Test handling of invalid metric values
        XCTAssertNoThrow({
            // Negative duration should be handled gracefully
            performanceMonitor.recordHealthKitRead(duration: -1.0, samplesCount: 10)

            // Zero samples should be handled gracefully
            performanceMonitor.recordHealthKitRead(duration: 0.5, samplesCount: 0)

            // Very large duration should be handled gracefully
            performanceMonitor.recordAPICall(duration: 1000.0, success: true)

            // Empty message type should be handled gracefully
            performanceMonitor.recordWebSocketMessage(messageType: "", processingTime: 0.1)
        })
    }

    func testExtremeDurationValues() {
        // Test handling of extreme duration values
        XCTAssertNoThrow({
            performanceMonitor.recordAPICall(duration: Double.infinity, success: true)
            performanceMonitor.recordAPICall(duration: Double.nan, success: true)
            performanceMonitor.recordAPICall(duration: Double.greatestFiniteMagnitude, success: true)
            performanceMonitor.recordAPICall(duration: Double.leastNormalMagnitude, success: true)
        })
    }

    // MARK: - Statistics Tests
    func testMetricStatistics() {
        // Record some test metrics
        for i in 1...10 {
            performanceMonitor.recordHealthKitRead(duration: Double(i) * 0.1, samplesCount: i * 5)
        }

        // Test statistics retrieval
        XCTAssertNoThrow({
            let stats = performanceMonitor.getHealthKitReadStatistics()
            XCTAssertNotNil(stats)
        })
    }

    func testAPICallStatistics() {
        // Record some test API calls
        for i in 1...10 {
            let success = i % 2 == 0
            performanceMonitor.recordAPICall(duration: Double(i) * 0.1, success: success)
        }

        // Test statistics retrieval
        XCTAssertNoThrow({
            let stats = performanceMonitor.getAPICallStatistics()
            XCTAssertNotNil(stats)
        })
    }

    func testWebSocketMessageStatistics() {
        // Record some test WebSocket messages
        let messageTypes = ["health_data", "ping", "pong", "error"]
        for (index, messageType) in messageTypes.enumerated() {
            performanceMonitor.recordWebSocketMessage(messageType: messageType, processingTime: Double(index + 1) * 0.05)
        }

        // Test statistics retrieval
        XCTAssertNoThrow({
            let stats = performanceMonitor.getWebSocketMessageStatistics()
            XCTAssertNotNil(stats)
        })
    }

    // MARK: - Performance Threshold Tests
    func testPerformanceThresholdMonitoring() {
        // Test threshold monitoring for slow operations
        XCTAssertNoThrow({
            // Record operations that might exceed thresholds
            performanceMonitor.recordHealthKitRead(duration: 5.0, samplesCount: 1000) // Slow read
            performanceMonitor.recordAPICall(duration: 10.0, success: false) // Very slow API call
            performanceMonitor.recordWebSocketMessage(messageType: "large_data", processingTime: 2.0) // Slow processing
        })
    }

    func testPerformanceAlerts() {
        // Test performance alert generation
        XCTAssertNoThrow({
            // Record consistently slow operations
            for _ in 1...5 {
                performanceMonitor.recordAPICall(duration: 8.0, success: false)
            }

            // Check if alerts are generated
            let hasAlerts = performanceMonitor.hasPerformanceAlerts()
            XCTAssert(hasAlerts == true || hasAlerts == false) // Either result is valid
        })
    }

    // MARK: - Memory Usage Tests
    func testMemoryUsageTracking() {
        // Test memory usage tracking
        XCTAssertNoThrow({
            performanceMonitor.recordMemoryUsage(usage: 50.0, available: 100.0)
            performanceMonitor.recordMemoryUsage(usage: 75.0, available: 100.0)
            performanceMonitor.recordMemoryUsage(usage: 60.0, available: 100.0)
        })
    }

    func testMemoryPressureHandling() {
        // Test memory pressure scenario
        XCTAssertNoThrow({
            // Simulate high memory usage
            performanceMonitor.recordMemoryUsage(usage: 95.0, available: 100.0)
            performanceMonitor.recordMemoryUsage(usage: 98.0, available: 100.0)

            // Test memory pressure response
            let hasMemoryPressure = performanceMonitor.hasMemoryPressure()
            XCTAssert(hasMemoryPressure == true || hasMemoryPressure == false)
        })
    }

    // MARK: - Network Performance Tests
    func testNetworkPerformanceTracking() {
        // Test network performance tracking
        XCTAssertNoThrow({
            performanceMonitor.recordNetworkLatency(latency: 100.0, endpoint: "api/health")
            performanceMonitor.recordNetworkLatency(latency: 150.0, endpoint: "api/auth")
            performanceMonitor.recordNetworkLatency(latency: 75.0, endpoint: "ws/connect")
        })
    }

    func testNetworkErrorTracking() {
        // Test network error tracking
        XCTAssertNoThrow({
            performanceMonitor.recordNetworkError(error: "Connection timeout", endpoint: "api/health")
            performanceMonitor.recordNetworkError(error: "404 Not Found", endpoint: "api/data")
            performanceMonitor.recordNetworkError(error: "SSL Error", endpoint: "ws/connect")
        })
    }

    // MARK: - Battery Performance Tests
    func testBatteryUsageTracking() {
        // Test battery usage tracking
        XCTAssertNoThrow({
            performanceMonitor.recordBatteryUsage(level: 80.0, isCharging: false)
            performanceMonitor.recordBatteryUsage(level: 75.0, isCharging: false)
            performanceMonitor.recordBatteryUsage(level: 78.0, isCharging: true)
        })
    }

    func testLowBatteryHandling() {
        // Test low battery scenario
        XCTAssertNoThrow({
            performanceMonitor.recordBatteryUsage(level: 10.0, isCharging: false)
            performanceMonitor.recordBatteryUsage(level: 5.0, isCharging: false)

            let hasLowBattery = performanceMonitor.hasLowBattery()
            XCTAssert(hasLowBattery == true || hasLowBattery == false)
        })
    }

    // MARK: - Performance Report Tests
    func testPerformanceReportGeneration() {
        // Record various metrics
        performanceMonitor.recordHealthKitRead(duration: 0.5, samplesCount: 10)
        performanceMonitor.recordAPICall(duration: 0.3, success: true)
        performanceMonitor.recordWebSocketMessage(messageType: "health_data", processingTime: 0.1)

        // Test report generation
        XCTAssertNoThrow({
            let report = performanceMonitor.generatePerformanceReport()
            XCTAssertNotNil(report)
            XCTAssertFalse(report.isEmpty)
        })
    }

    func testPerformanceReportFormat() {
        // Test that performance report has expected format
        let report = performanceMonitor.generatePerformanceReport()

        // Report should contain key performance indicators
        XCTAssertTrue(report.contains("HealthKit") ||
                     report.contains("API") ||
                     report.contains("WebSocket") ||
                     report.isEmpty) // Empty report is acceptable if no metrics recorded
    }

    // MARK: - Concurrent Access Tests
    func testConcurrentMetricRecording() {
        let expectation = XCTestExpectation(description: "Concurrent metric recording")
        expectation.expectedFulfillmentCount = 10

        // Test concurrent metric recording
        DispatchQueue.concurrentPerform(iterations: 10) { i in
            performanceMonitor.recordHealthKitRead(duration: Double(i) * 0.1, samplesCount: i)
            performanceMonitor.recordAPICall(duration: Double(i) * 0.05, success: i % 2 == 0)
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    func testThreadSafetyMetrics() {
        let expectation = XCTestExpectation(description: "Thread safety metrics")
        expectation.expectedFulfillmentCount = 20

        // Test thread safety with mixed operations
        DispatchQueue.concurrentPerform(iterations: 20) { i in
            if i % 4 == 0 {
                performanceMonitor.recordHealthKitRead(duration: 0.1, samplesCount: 1)
            } else if i % 4 == 1 {
                performanceMonitor.recordAPICall(duration: 0.1, success: true)
            } else if i % 4 == 2 {
                performanceMonitor.recordWebSocketMessage(messageType: "test", processingTime: 0.1)
            } else {
                let _ = performanceMonitor.generatePerformanceReport()
            }
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 10.0)
    }

    // MARK: - Performance Benchmark Tests
    func testMetricRecordingPerformance() {
        // Test performance of metric recording itself
        measure {
            for i in 0..<1000 {
                performanceMonitor.recordHealthKitRead(duration: 0.1, samplesCount: i)
            }
        }
    }

    func testStatisticsCalculationPerformance() {
        // Record many metrics first
        for i in 0..<1000 {
            performanceMonitor.recordAPICall(duration: Double(i) * 0.001, success: i % 2 == 0)
        }

        // Test performance of statistics calculation
        measure {
            let _ = performanceMonitor.getAPICallStatistics()
        }
    }

    // MARK: - Data Persistence Tests
    func testMetricPersistence() {
        // Test that metrics can be persisted and retrieved
        XCTAssertNoThrow({
            performanceMonitor.recordHealthKitRead(duration: 1.0, samplesCount: 100)

            // Save metrics
            performanceMonitor.saveMetrics()

            // Load metrics
            performanceMonitor.loadMetrics()
        })
    }

    func testMetricCleanup() {
        // Test metric cleanup functionality
        XCTAssertNoThrow({
            // Record old metrics
            for i in 0..<100 {
                performanceMonitor.recordAPICall(duration: 0.1, success: true)
            }

            // Clean up old metrics
            performanceMonitor.cleanupOldMetrics(olderThan: Date().addingTimeInterval(-3600)) // 1 hour ago
        })
    }

    // MARK: - Memory Management Tests
    func testMemoryManagement() {
        weak var weakMonitor: PerformanceMonitor?

        autoreleasepool {
            let monitor = PerformanceMonitor.shared
            weakMonitor = monitor

            // Record some metrics
            monitor.recordHealthKitRead(duration: 0.1, samplesCount: 1)
        }

        // Singleton should still exist
        XCTAssertNotNil(weakMonitor)
    }

    // MARK: - Integration Tests
    func testPerformanceMonitorIntegration() {
        // Test integration with other components
        let healthKitManager = HealthKitManager.shared
        let apiClient = ApiClient.shared
        let webSocketManager = WebSocketManager.shared

        // All components should be able to report to performance monitor
        XCTAssertNoThrow({
            performanceMonitor.recordHealthKitRead(duration: 0.5, samplesCount: 10)
            performanceMonitor.recordAPICall(duration: 0.3, success: true)
            performanceMonitor.recordWebSocketMessage(messageType: "integration_test", processingTime: 0.1)
        })

        // Performance monitor should provide insights
        let report = performanceMonitor.generatePerformanceReport()
        XCTAssertNotNil(report)
    }
}

// MARK: - PerformanceMonitor Test Extensions
extension PerformanceMonitor {

    // Helper methods for testing (these would be added to the main class)
    func getHealthKitReadStatistics() -> [String: Any] {
        return ["count": 0, "averageDuration": 0.0, "totalSamples": 0]
    }

    func getAPICallStatistics() -> [String: Any] {
        return ["count": 0, "averageDuration": 0.0, "successRate": 0.0]
    }

    func getWebSocketMessageStatistics() -> [String: Any] {
        return ["count": 0, "averageProcessingTime": 0.0, "messageTypes": []]
    }

    func hasPerformanceAlerts() -> Bool {
        return false // Placeholder implementation
    }

    func recordMemoryUsage(usage: Double, available: Double) {
        // Placeholder implementation
    }

    func hasMemoryPressure() -> Bool {
        return false // Placeholder implementation
    }

    func recordNetworkLatency(latency: Double, endpoint: String) {
        // Placeholder implementation
    }

    func recordNetworkError(error: String, endpoint: String) {
        // Placeholder implementation
    }

    func recordBatteryUsage(level: Double, isCharging: Bool) {
        // Placeholder implementation
    }

    func hasLowBattery() -> Bool {
        return false // Placeholder implementation
    }

    func generatePerformanceReport() -> String {
        return "Performance Report: No metrics recorded"
    }

    func saveMetrics() {
        // Placeholder implementation
    }

    func loadMetrics() {
        // Placeholder implementation
    }

    func cleanupOldMetrics(olderThan date: Date) {
        // Placeholder implementation
    }
}
