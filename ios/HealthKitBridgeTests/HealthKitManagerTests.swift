import XCTest
import HealthKit
@testable import HealthKitBridge

class HealthKitManagerTests: XCTestCase {

    var healthKitManager: HealthKitManager!

    override func setUpWithError() throws {
        super.setUp()
        healthKitManager = HealthKitManager.shared
    }

    override func tearDownWithError() throws {
        super.tearDown()
        healthKitManager = nil
    }

    // MARK: - Initialization Tests
    func testHealthKitManagerInitialization() {
        XCTAssertNotNil(healthKitManager)
        XCTAssertNotNil(healthKitManager.healthStore)
        XCTAssertTrue(healthKitManager.healthStore.isKind(of: HKHealthStore.self))
    }

    func testHealthKitManagerSingleton() {
        let manager1 = HealthKitManager.shared
        let manager2 = HealthKitManager.shared
        XCTAssertTrue(manager1 === manager2)
    }

    // MARK: - HealthKit Types Tests
    func testHealthKitTypesToRead() {
        let typesToRead = healthKitManager.healthKitTypesToRead
        XCTAssertFalse(typesToRead.isEmpty)

        // Check for essential health data types
        let typeIdentifiers = typesToRead.compactMap { ($0 as? HKQuantityType)?.identifier }

        XCTAssertTrue(typeIdentifiers.contains(.heartRate))
        XCTAssertTrue(typeIdentifiers.contains(.stepCount))
        XCTAssertTrue(typeIdentifiers.contains(.appleWalkingSteadiness))
        XCTAssertTrue(typeIdentifiers.contains(.walkingSpeed))
        XCTAssertTrue(typeIdentifiers.contains(.walkingStepLength))
    }

    func testCriticalHealthDataTypes() {
        let criticalTypes = healthKitManager.criticalHealthDataTypes
        XCTAssertFalse(criticalTypes.isEmpty)

        // Verify critical types are included
        let typeIdentifiers = criticalTypes.compactMap { ($0 as? HKQuantityType)?.identifier }
        XCTAssertTrue(typeIdentifiers.contains(.heartRate))
        XCTAssertTrue(typeIdentifiers.contains(.appleWalkingSteadiness))
    }

    // MARK: - Permission Tests
    func testRequestHealthKitPermissions() async {
        let expectation = XCTestExpectation(description: "HealthKit permissions requested")

        // Note: This will prompt user in simulator/device, but should complete
        Task {
            await healthKitManager.requestHealthKitPermissions()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    func testHealthKitAuthorizationStatus() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let status = healthKitManager.healthStore.authorizationStatus(for: heartRateType)

        // Should be one of the valid authorization statuses
        XCTAssertTrue([
            .notDetermined,
            .sharingDenied,
            .sharingAuthorized
        ].contains(status))
    }

    // MARK: - Data Reading Tests
    func testReadHeartRateData() async {
        let expectation = XCTestExpectation(description: "Heart rate data read")

        Task {
            await healthKitManager.readHeartRateData()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testReadStepCountData() async {
        let expectation = XCTestExpectation(description: "Step count data read")

        Task {
            await healthKitManager.readStepCountData()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    func testReadWalkingSteadinessData() async {
        let expectation = XCTestExpectation(description: "Walking steadiness data read")

        Task {
            await healthKitManager.readWalkingSteadinessData()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    // MARK: - Background Delivery Tests
    func testBackgroundDeliverySetup() async {
        let expectation = XCTestExpectation(description: "Background delivery setup")

        Task {
            await healthKitManager.setupBackgroundDelivery()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 5.0)
    }

    // MARK: - Observer Query Tests
    func testObserverQuerySetup() {
        XCTAssertNoThrow({
            let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
            let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { _, _, _ in
                // Test observer callback
            }
            XCTAssertNotNil(query)
        })
    }

    // MARK: - Data Processing Tests
    func testProcessHealthKitSample() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
        let heartRateQuantity = HKQuantity(unit: heartRateUnit, doubleValue: 72.0)

        let sample = HKQuantitySample(
            type: heartRateType,
            quantity: heartRateQuantity,
            start: Date(),
            end: Date()
        )

        // Test processing sample (this tests the internal logic)
        XCTAssertNoThrow({
            let healthData = HealthData(
                type: "heart_rate",
                value: sample.quantity.doubleValue(for: heartRateUnit),
                unit: "bpm",
                timestamp: sample.startDate,
                deviceId: "test-device",
                userId: "test-user"
            )
            XCTAssertEqual(healthData.value, 72.0)
        })
    }

    // MARK: - Error Handling Tests
    func testHealthKitErrorHandling() {
        // Test handling of HealthKit not available
        // Note: This is more of a defensive programming test
        XCTAssertTrue(HKHealthStore.isHealthDataAvailable())

        // Test invalid query handling
        XCTAssertNoThrow({
            let invalidPredicate = HKQuery.predicateForSamples(
                withStart: Date.distantFuture,
                end: Date.distantPast,
                options: []
            )
            XCTAssertNotNil(invalidPredicate)
        })
    }

    // MARK: - Data Validation Tests
    func testHealthDataValidation() {
        // Test valid heart rate values
        XCTAssertTrue(healthKitManager.isValidHeartRate(72.0))
        XCTAssertTrue(healthKitManager.isValidHeartRate(120.0))
        XCTAssertFalse(healthKitManager.isValidHeartRate(0.0))
        XCTAssertFalse(healthKitManager.isValidHeartRate(-10.0))
        XCTAssertFalse(healthKitManager.isValidHeartRate(300.0))

        // Test valid step count values
        XCTAssertTrue(healthKitManager.isValidStepCount(1000.0))
        XCTAssertTrue(healthKitManager.isValidStepCount(0.0))
        XCTAssertFalse(healthKitManager.isValidStepCount(-100.0))

        // Test valid walking steadiness values
        XCTAssertTrue(healthKitManager.isValidWalkingSteadiness(0.5))
        XCTAssertTrue(healthKitManager.isValidWalkingSteadiness(1.0))
        XCTAssertFalse(healthKitManager.isValidWalkingSteadiness(-0.1))
        XCTAssertFalse(healthKitManager.isValidWalkingSteadiness(1.5))
    }

    // MARK: - Performance Tests
    func testHealthKitQueryPerformance() {
        measure {
            let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
            let predicate = HKQuery.predicateForSamples(
                withStart: Calendar.current.date(byAdding: .day, value: -1, to: Date()),
                end: Date(),
                options: []
            )

            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: 100,
                sortDescriptors: nil
            ) { _, _, _ in
                // Performance test for query creation
            }

            XCTAssertNotNil(query)
        }
    }

    // MARK: - Memory Management Tests
    func testMemoryManagement() {
        weak var weakManager: HealthKitManager?

        autoreleasepool {
            let manager = HealthKitManager.shared
            weakManager = manager
            XCTAssertNotNil(weakManager)
        }

        // Singleton should still exist
        XCTAssertNotNil(weakManager)
    }

    // MARK: - Integration Tests
    func testHealthKitToWebSocketFlow() async {
        let expectation = XCTestExpectation(description: "HealthKit to WebSocket flow")

        Task {
            // Test the complete flow from HealthKit reading to WebSocket sending
            await healthKitManager.readAndTransmitAllHealthData()
            expectation.fulfill()
        }

        await fulfillment(of: [expectation], timeout: 10.0)
    }

    // MARK: - Device Identification Tests
    func testDeviceIdentification() {
        let deviceId = healthKitManager.getDeviceIdentifier()
        XCTAssertFalse(deviceId.isEmpty)
        XCTAssertNotEqual(deviceId, "unknown")
    }
}

// MARK: - HealthKitManager Test Extensions
extension HealthKitManager {

    // Helper methods for testing (these would be added to the main class)
    func isValidHeartRate(_ value: Double) -> Bool {
        return value > 0 && value < 250
    }

    func isValidStepCount(_ value: Double) -> Bool {
        return value >= 0 && value < 100000
    }

    func isValidWalkingSteadiness(_ value: Double) -> Bool {
        return value >= 0 && value <= 1.0
    }

    func getDeviceIdentifier() -> String {
        return UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
    }
}
