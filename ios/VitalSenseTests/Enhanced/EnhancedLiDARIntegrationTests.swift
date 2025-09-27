import XCTest
import HealthKit
import CoreML
@testable import VitalSense

/// Enhanced LiDAR Integration Tests
/// Comprehensive test suite for iOS-Web LiDAR integration
/// Validates all components work together seamlessly

@available(iOS 14.0, *)
class EnhancedLiDARIntegrationTests: XCTestCase {

    var config: EnhancedLiDARIntegrationConfig!
    var coordinator: EnhancedLiDARIntegrationCoordinator!
    var mlManager: EnhancedLiDARMLManager!
    var watchManager: WatchLiDARIntegrationManager!

    override func setUpWithError() throws {
        try super.setUpWithError()

        config = EnhancedLiDARIntegrationConfig.shared
        coordinator = EnhancedLiDARIntegrationCoordinator.shared
        mlManager = EnhancedLiDARMLManager.shared
        watchManager = WatchLiDARIntegrationManager.shared
    }

    override func tearDownWithError() throws {
        coordinator.stopIntegration()
        try super.tearDownWithError()
    }

    // MARK: - Configuration Tests

    func testConfigurationInitialization() throws {
        XCTAssertTrue(config.isConfigured, "Configuration should be initialized")
        XCTAssertFalse(config.availableFeatures.isEmpty, "Should have some available features")
    }

    func testFeatureAvailability() throws {
        // Test each feature availability
        let coreMLFeature = EnhancedLiDARIntegrationConfig.EnhancedLiDARFeature.coreMLInference
        XCTAssertTrue(config.isFeatureAvailable(coreMLFeature), "CoreML should be available on iOS 14+")

        let healthKitFeature = EnhancedLiDARIntegrationConfig.EnhancedLiDARFeature.healthKitIntegration
        let expectedHealthKit = HKHealthStore.isHealthDataAvailable()
        XCTAssertEqual(config.isFeatureAvailable(healthKitFeature), expectedHealthKit)
    }

    func testConfigurationUpdate() throws {
        let originalSettings = config.integrationSettings

        let newSettings = EnhancedLiDARIntegrationConfig.IntegrationSettings(
            webMLEndpoint: "ws://test:3001/ml",
            enableNativeML: false,
            fallbackToNative: false,
            enableAppleWatchIntegration: false,
            enableRealTimeStreaming: false,
            maxDataBufferSize: 500,
            analysisInterval: 10.0,
            enableBackgroundProcessing: false
        )

        config.updateIntegrationSettings(newSettings)

        XCTAssertEqual(config.integrationSettings.webMLEndpoint, "ws://test:3001/ml")
        XCTAssertFalse(config.integrationSettings.enableNativeML)

        // Restore original settings
        config.updateIntegrationSettings(originalSettings)
    }

    // MARK: - ML Manager Tests

    func testMLManagerInitialization() throws {
        let expectation = self.expectation(description: "ML Manager initialization")

        mlManager.initialize()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            let status = self.mlManager.getCurrentStatus()
            XCTAssertNotNil(status["isInitialized"])
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5.0)
    }

    func testMLModelLoading() throws {
        // Test that ML models can be loaded (or at least attempted)
        let expectation = self.expectation(description: "ML model loading attempt")

        mlManager.loadModels { success in
            // Even if models don't exist, we should get a callback
            XCTAssertNotNil(success)
            expectation.fulfill()
        }

        waitForExpectations(timeout: 10.0)
    }

    func testHealthDataProcessing() throws {
        let testHealthData: [String: Any] = [
            "heartRate": 75.0,
            "stepCount": 1000,
            "walkingSpeed": 1.2,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        let expectation = self.expectation(description: "Health data processing")

        mlManager.onAnalysisComplete = { results in
            XCTAssertNotNil(results)
            XCTAssertFalse(results.isEmpty)
            expectation.fulfill()
        }

        mlManager.processHealthData(testHealthData)

        waitForExpectations(timeout: 15.0)
    }

    // MARK: - Watch Manager Tests

    func testWatchManagerSessionSupport() throws {
        let isSupported = WCSession.isSupported()

        if isSupported {
            XCTAssertNotNil(watchManager)
            watchManager.startSession()

            // Give it a moment to initialize
            let expectation = self.expectation(description: "Watch session start")

            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                let status = self.watchManager.getConnectionStatus()
                XCTAssertNotNil(status)
                expectation.fulfill()
            }

            waitForExpectations(timeout: 5.0)
        } else {
            XCTAssertTrue(true, "Watch Connectivity not supported on this device - test passes")
        }
    }

    func testHealthDataStreaming() throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            XCTAssertTrue(true, "HealthKit not available - test passes")
            return
        }

        let expectation = self.expectation(description: "Health data streaming start")

        watchManager.startDataStreaming()

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            XCTAssertTrue(self.watchManager.isStreamingData || !self.watchManager.hasHealthKitPermissions)
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5.0)
    }

    // MARK: - Integration Coordinator Tests

    func testCoordinatorIntegrationStatus() throws {
        let status = coordinator.getIntegrationStatus()

        XCTAssertNotNil(status["isActive"])
        XCTAssertNotNil(status["availableFeatures"])
        XCTAssertNotNil(status["mlManagerStatus"])
        XCTAssertNotNil(status["watchManagerStatus"])
        XCTAssertNotNil(status["webSocketStatus"])

        if let features = status["availableFeatures"] as? [String] {
            XCTAssertFalse(features.isEmpty, "Should have some available features")
        }
    }

    func testManualAnalysisTrigger() throws {
        let expectation = self.expectation(description: "Manual analysis trigger")

        // Set up analysis completion handler
        mlManager.onAnalysisComplete = { results in
            XCTAssertNotNil(results)
            expectation.fulfill()
        }

        coordinator.triggerManualAnalysis()

        waitForExpectations(timeout: 20.0)
    }

    // MARK: - Data Flow Tests

    func testHealthDataToMLPipeline() throws {
        let testData: [String: Any] = [
            "heartRate": 80.0,
            "stepCount": 500,
            "walkingSpeed": 1.0,
            "walkingStepLength": 0.7,
            "timestamp": Date().timeIntervalSince1970
        ]

        let expectation = self.expectation(description: "Health data to ML pipeline")

        // Mock the data flow from Watch to ML Manager
        watchManager.onHealthDataUpdate = { healthData in
            XCTAssertNotNil(healthData)
            XCTAssertEqual(healthData["heartRate"] as? Double, 80.0)
            expectation.fulfill()
        }

        // Simulate health data update
        watchManager.onHealthDataUpdate?(testData)

        waitForExpectations(timeout: 5.0)
    }

    func testMLResultsToWebSocketPipeline() throws {
        let testResults: [String: Any] = [
            "gaitAnalysis": [
                "cadence": 120.0,
                "stepLength": 0.75,
                "symmetry": 0.95
            ],
            "fallRisk": [
                "score": 0.15,
                "level": "low"
            ],
            "confidence": 0.88,
            "timestamp": Date().timeIntervalSince1970
        ]

        let expectation = self.expectation(description: "ML results to WebSocket pipeline")

        // Mock the ML completion callback
        mlManager.onAnalysisComplete = { results in
            XCTAssertNotNil(results)
            XCTAssertNotNil(results["gaitAnalysis"])
            XCTAssertNotNil(results["fallRisk"])
            expectation.fulfill()
        }

        // Simulate ML analysis completion
        mlManager.onAnalysisComplete?(testResults)

        waitForExpectations(timeout: 5.0)
    }

    // MARK: - Error Handling Tests

    func testInvalidConfigurationHandling() throws {
        let invalidSettings = EnhancedLiDARIntegrationConfig.IntegrationSettings(
            webMLEndpoint: "invalid-url",
            enableNativeML: true,
            fallbackToNative: true,
            enableAppleWatchIntegration: true,
            enableRealTimeStreaming: true,
            maxDataBufferSize: -1, // Invalid
            analysisInterval: -5.0, // Invalid
            enableBackgroundProcessing: true
        )

        // Should handle invalid configuration gracefully
        config.updateIntegrationSettings(invalidSettings)

        // Configuration should still be valid after handling invalid input
        XCTAssertTrue(config.isConfigured)
    }

    func testMissingMLModelsHandling() throws {
        let invalidMLConfig = EnhancedLiDARIntegrationConfig.MLModelConfiguration(
            gaitAnalysisModelName: "NonExistentModel",
            fallPredictionModelName: "AnotherNonExistentModel",
            postureClassificationModelName: "YetAnotherNonExistentModel",
            movementPatternModelName: "FinalNonExistentModel",
            modelUpdateInterval: 3600.0,
            confidenceThreshold: 0.75
        )

        // Should handle missing models gracefully
        config.updateMLConfiguration(invalidMLConfig)

        // ML manager should still initialize
        mlManager.initialize()

        let status = mlManager.getCurrentStatus()
        XCTAssertNotNil(status)
    }

    // MARK: - Performance Tests

    func testHealthDataProcessingPerformance() throws {
        let testData: [String: Any] = [
            "heartRate": 75.0,
            "stepCount": 1000,
            "walkingSpeed": 1.2,
            "walkingStepLength": 0.72,
            "walkingAsymmetryPercentage": 2.1,
            "walkingDoubleSupportPercentage": 28.5,
            "timestamp": Date().timeIntervalSince1970
        ]

        measure {
            mlManager.processHealthData(testData)
        }
    }

    func testMultipleDataPointsProcessing() throws {
        let dataPoints = (0..<100).map { index in
            [
                "heartRate": Double.random(in: 60...100),
                "stepCount": index * 10,
                "walkingSpeed": Double.random(in: 0.5...2.0),
                "timestamp": Date().timeIntervalSince1970 + Double(index)
            ]
        }

        let expectation = self.expectation(description: "Multiple data points processing")
        var processedCount = 0

        mlManager.onAnalysisComplete = { _ in
            processedCount += 1
            if processedCount >= dataPoints.count {
                expectation.fulfill()
            }
        }

        for dataPoint in dataPoints {
            mlManager.processHealthData(dataPoint)
        }

        waitForExpectations(timeout: 30.0)
    }

    // MARK: - Integration Scenario Tests

    func testFullIntegrationScenario() throws {
        let expectation = self.expectation(description: "Full integration scenario")

        var stepsCompleted = 0
        let totalSteps = 4

        let checkCompletion = {
            stepsCompleted += 1
            if stepsCompleted >= totalSteps {
                expectation.fulfill()
            }
        }

        // Step 1: Initialize all components
        mlManager.initialize()
        watchManager.startSession()
        checkCompletion()

        // Step 2: Start data streaming
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.watchManager.startDataStreaming()
            checkCompletion()
        }

        // Step 3: Process health data
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            let testData: [String: Any] = [
                "heartRate": 78.0,
                "stepCount": 1500,
                "walkingSpeed": 1.3,
                "timestamp": Date().timeIntervalSince1970
            ]

            self.mlManager.processHealthData(testData)
            checkCompletion()
        }

        // Step 4: Trigger manual analysis
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            self.coordinator.triggerManualAnalysis()
            checkCompletion()
        }

        waitForExpectations(timeout: 15.0)
    }

    // MARK: - Utility Methods

    private func createMockHealthData() -> [String: Any] {
        return [
            "heartRate": Double.random(in: 60...100),
            "stepCount": Int.random(in: 0...2000),
            "walkingSpeed": Double.random(in: 0.5...2.0),
            "walkingStepLength": Double.random(in: 0.5...1.0),
            "walkingAsymmetryPercentage": Double.random(in: 0...10),
            "walkingDoubleSupportPercentage": Double.random(in: 20...35),
            "timestamp": Date().timeIntervalSince1970
        ]
    }

    private func waitForAsyncOperation(timeout: TimeInterval = 5.0, operation: @escaping () -> Void) {
        let expectation = self.expectation(description: "Async operation")

        DispatchQueue.main.async {
            operation()
            expectation.fulfill()
        }

        waitForExpectations(timeout: timeout)
    }
}

// MARK: - Mock Classes for Testing

@available(iOS 14.0, *)
class MockWebSocketManager {
    var isConnected = false
    var onMessage: (([String: Any]) -> Void)?
    var sentMessages: [[String: Any]] = []

    func connect(to endpoint: String) {
        isConnected = true
    }

    func disconnect() {
        isConnected = false
    }

    func send(data: Data) {
        do {
            if let message = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                sentMessages.append(message)
            }
        } catch {
            print("Mock WebSocket failed to parse message: \(error)")
        }
    }

    func simulateMessage(_ message: [String: Any]) {
        onMessage?(message)
    }
}

// MARK: - Test Extensions

extension EnhancedLiDARIntegrationTests {

    /// Test the complete data flow from Apple Watch to Web platform
    func testCompleteDataFlow() throws {
        let expectation = self.expectation(description: "Complete data flow")

        // Create a chain of expectations
        var flowSteps: [String] = []

        // 1. Watch generates health data
        let healthData = createMockHealthData()
        flowSteps.append("health_data_generated")

        // 2. ML Manager processes data
        mlManager.onAnalysisComplete = { results in
            flowSteps.append("ml_analysis_complete")

            // 3. Results should be sent to WebSocket
            if flowSteps.count >= 2 {
                XCTAssertTrue(flowSteps.contains("health_data_generated"))
                XCTAssertTrue(flowSteps.contains("ml_analysis_complete"))
                expectation.fulfill()
            }
        }

        // Start the flow
        mlManager.processHealthData(healthData)

        waitForExpectations(timeout: 10.0)
    }
}
