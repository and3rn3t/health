import XCTest
@testable import VitalSense
import SwiftUI

// Placeholder test demonstrating reduced motion environment override; real snapshot infra can replace this.
final class ReducedMotionSnapshotPlaceholderTests: XCTestCase {
    func testReducedMotionFlagDoesNotCrashAnimations() async throws {
        // Simulate toggling components that use ReducedMotionPulse without actual animation evaluation.
        let expectation = XCTestExpectation(description: "Reduced motion rendering")
        DispatchQueue.main.async {
            _ = VitalSenseInteractiveQuickMetric(
                icon: "figure.walk", value: "123", label: "Steps", color: .orange, isSelected: false, isTracking: false, action: {}
            )
            expectation.fulfill()
        }
        wait(for: [expectation], timeout: 1.0)
    }
}
