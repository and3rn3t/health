import XCTest
@testable import VitalSense

final class PseudoLocaleFormatTests: XCTestCase {
    override func tearDown() { setPseudoLocaleEnabled(false) }

    func testFormatSpecifiersPreserved() {
        setPseudoLocaleEnabled(true)
        let template = loc("gait_progress_optimal_format") // contains %d%%
        XCTAssertTrue(template.contains("%d"), "Expected %d token present after pseudo transform")
        XCTAssertTrue(template.contains("%%"), "Expected escaped percent %% present")
    }
}
