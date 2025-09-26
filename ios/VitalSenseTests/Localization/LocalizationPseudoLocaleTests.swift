import XCTest
@testable import VitalSense

final class LocalizationPseudoLocaleTests: XCTestCase {
    func testPseudoLocaleTransforms() {
        setPseudoLocaleEnabled(true)
        let transformed = loc("settings_toggle_enable_haptics")
        XCTAssertTrue(transformed.contains("[¡¡"), "Expected pseudo wrapper when enabled")
        setPseudoLocaleEnabled(false)
        let normal = loc("settings_toggle_enable_haptics")
        XCTAssertFalse(normal.contains("[¡¡"), "Expected normal string when disabled")
    }
}
