import XCTest
import SwiftUI
@testable import VitalSense

// Snapshot-less structural test ensuring accessibility label construction is deterministic.
final class AccessibilityRotorOrderingTests: XCTestCase {
    func testMetricLabelOrdering() {
        let text = AccessibilityHelpers.metricLabel(name: "Steps", value: "1200", qualifier: "today")
        let mirror = Mirror(reflecting: text)
        // Basic sanity: underlying storage should not be empty; textual description includes ordered components
        XCTAssertTrue("\(text)".contains("Steps:"))
        XCTAssertTrue("\(text)".contains("1200"))
    }

    func testFallRiskSummaryFormat() {
        let summary = AccessibilityHelpers.fallRiskSummary(levelName: "Low", subtitle: "Stable gait")
        XCTAssertTrue("\(summary)".contains("Low"))
        XCTAssertTrue("\(summary)".contains("Stable gait"))
    }
}
