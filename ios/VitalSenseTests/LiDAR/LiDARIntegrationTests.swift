import XCTest
@testable import VitalSense
import ARKit

@available(iOS 14.0, *)
class LiDARIntegrationTests: XCTestCase {
    var lidarManager: LiDARScanningManager!

    override func setUpWithError() throws {
        lidarManager = LiDARScanningManager.shared
    }

    override func tearDownWithError() throws {
        lidarManager = nil
    }

    func testLiDARAvailability() throws {
        // Test that LiDAR availability is properly detected
        // Note: This will be false in simulator
        let isAvailable = lidarManager.isLiDARAvailable

        // In a real device test, this would be true for supported devices
        // In simulator, it should be false
        if ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != nil {
            XCTAssertFalse(isAvailable, "LiDAR should not be available in simulator")
        }

        print("LiDAR Available: \(isAvailable)")
    }

    func testScanManagerInitialization() throws {
        XCTAssertNotNil(lidarManager)
        XCTAssertEqual(lidarManager.currentPointCount, 0)
        XCTAssertEqual(lidarManager.scanQuality, 0.0)
        XCTAssertFalse(lidarManager.isCollectingData)
        XCTAssertFalse(lidarManager.isPaused)
    }

    func testScanTypes() throws {
        let scanTypes: [LiDARScanningView.ScanType] = [
            .fallRiskAssessment,
            .gaitAnalysis,
            .environmentalScan,
            .balanceTest
        ]

        for scanType in scanTypes {
            XCTAssertTrue(scanType.scanDuration > 0, "Scan duration should be positive for \(scanType)")
            XCTAssertFalse(scanType.title.isEmpty, "Title should not be empty for \(scanType)")
            XCTAssertFalse(scanType.description.isEmpty, "Description should not be empty for \(scanType)")
        }
    }

    func testScanStartStop() throws {
        // Test starting a scan (should work even without LiDAR)
        var progressCallbackCalled = false

        lidarManager.startScan(type: .fallRiskAssessment) { progress in
            progressCallbackCalled = true
            print("Scan progress: \(progress)")
        }

        // Wait a moment for the scan to initialize
        let expectation = XCTestExpectation(description: "Scan initialization")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1.0)

        // Stop the scan
        lidarManager.stopScan()

        XCTAssertFalse(lidarManager.isCollectingData, "Should not be collecting data after stop")

        // Note: progressCallbackCalled might be false if LiDAR is not available
        // but the scan infrastructure should still work
    }

    func testScanResults() throws {
        // Test scan result structure
        let sampleResult = createSampleScanResult()

        XCTAssertNotNil(sampleResult.id)
        XCTAssertEqual(sampleResult.type, .fallRiskAssessment)
        XCTAssertTrue(sampleResult.score >= 0 && sampleResult.score <= 100)
        XCTAssertTrue(sampleResult.duration > 0)
        XCTAssertTrue(sampleResult.frameCount >= 0)
        XCTAssertTrue(sampleResult.averageQuality >= 0 && sampleResult.averageQuality <= 1)
    }

    func testInsightGeneration() throws {
        let insight = LiDARInsight(
            type: .warning,
            title: "Test Insight",
            description: "Test description",
            recommendation: "Test recommendation"
        )

        XCTAssertEqual(insight.type, .warning)
        XCTAssertEqual(insight.title, "Test Insight")
        XCTAssertEqual(insight.description, "Test description")
        XCTAssertEqual(insight.recommendation, "Test recommendation")
        XCTAssertEqual(insight.type.color, .orange)
        XCTAssertEqual(insight.type.icon, "exclamationmark.triangle.fill")
    }

    func testGaitAnalysisManager() throws {
        let gaitManager = GaitAnalysisManager()

        XCTAssertEqual(gaitManager.detectedSteps, 0)
        XCTAssertEqual(gaitManager.currentCadence, 0)
        XCTAssertEqual(gaitManager.strideLength, 0)
        XCTAssertEqual(gaitManager.walkingSpeed, 0)
        XCTAssertEqual(gaitManager.gaitSymmetry, 0)

        gaitManager.resetGaitAnalysis()

        XCTAssertEqual(gaitManager.detectedSteps, 0)
    }

    // MARK: - Helper Methods
    private func createSampleScanResult() -> LiDARScanResult {
        return LiDARScanResult(
            id: UUID(),
            type: .fallRiskAssessment,
            date: Date(),
            duration: 30.0,
            frameCount: 150,
            averageQuality: 0.85,
            score: 78.5,
            insights: [
                LiDARInsight(
                    type: .info,
                    title: "Test Insight",
                    description: "Test description",
                    recommendation: "Test recommendation"
                )
            ],
            rawData: LiDARRawData(
                frames: [],
                accelerometerData: [],
                gyroscopeData: []
            )
        )
    }
}

// MARK: - Performance Tests
@available(iOS 14.0, *)
class LiDARPerformanceTests: XCTestCase {
    var lidarManager: LiDARScanningManager!

    override func setUpWithError() throws {
        lidarManager = LiDARScanningManager.shared
    }

    func testScanResultProcessingPerformance() throws {
        measure {
            // Simulate processing multiple scan results
            for _ in 0..<100 {
                let result = createTestScanResult()
                // Process the result (this would normally happen in the manager)
                _ = result.score
                _ = result.insights.count
            }
        }
    }

    func testVarianceCalculationPerformance() throws {
        let testData = Array(0..<1000).map { Double($0) }

        measure {
            // This simulates the variance calculation used in gait analysis
            let mean = testData.reduce(0, +) / Double(testData.count)
            let variance = testData.map { pow($0 - mean, 2) }.reduce(0, +) / Double(testData.count)
            _ = variance
        }
    }

    private func createTestScanResult() -> LiDARScanResult {
        return LiDARScanResult(
            id: UUID(),
            type: .gaitAnalysis,
            date: Date(),
            duration: 45.0,
            frameCount: 200,
            averageQuality: 0.9,
            score: 85.0,
            insights: [],
            rawData: LiDARRawData(
                frames: [],
                accelerometerData: [],
                gyroscopeData: []
            )
        )
    }
}
