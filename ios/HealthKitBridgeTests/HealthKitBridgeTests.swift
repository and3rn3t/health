import XCTest
import HealthKit
@testable import HealthKitBridge

class HealthKitBridgeTests: XCTestCase {

    func testAppConfigLoading() {
        // Test that AppConfig can be loaded
        XCTAssertNoThrow(AppConfig.shared)

        let config = AppConfig.shared
        XCTAssertFalse(config.userId.isEmpty)
        XCTAssertNotNil(config.apiBaseURL)
        XCTAssertNotNil(config.wsURL)

        // Test URL formats
        XCTAssertTrue(config.apiBaseURL.absoluteString.contains("127.0.0.1"))
        XCTAssertTrue(config.wsURL.absoluteString.contains("localhost"))
    }

    func testApiClientSingleton() {
        // Test that ApiClient singleton works
        let client1 = ApiClient.shared
        let client2 = ApiClient.shared
        XCTAssertTrue(client1 === client2) // Same instance
    }

    func testHealthKitAvailability() {
        // Test HealthKit availability
        XCTAssertTrue(HKHealthStore.isHealthDataAvailable())
    }

    func testHealthKitDataTypes() {
        // Test that required health data types are available
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .heartRate))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .stepCount))
        XCTAssertNotNil(HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness))
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
}
