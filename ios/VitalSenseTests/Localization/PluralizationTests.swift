import XCTest
@testable import VitalSense

final class PluralizationTests: XCTestCase {
    func testStepsPluralizationStringsDict() {
        XCTAssertEqual(locPlural(baseKey: "steps_count", count: 1), "1 step")
        XCTAssertEqual(locPlural(baseKey: "steps_count", count: 3), "3 steps")
    }

    func testHoursPluralizationStringsDict() {
        XCTAssertEqual(locPlural(baseKey: "hours_count", count: 1), "1 hour")
        XCTAssertEqual(locPlural(baseKey: "hours_count", count: 5), "5 hours")
    }

    func testLegacyFallbackWhenMissing() {
        // Use a fake key with legacy pattern to ensure fallback path returns raw number if no keys exist
        let result = locPlural(baseKey: "__nonexistent_key__", count: 7)
        XCTAssertEqual(result, "7")
    }
}
