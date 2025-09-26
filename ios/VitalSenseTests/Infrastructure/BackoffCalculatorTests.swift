import XCTest
@testable import VitalSense

final class BackoffCalculatorTests: XCTestCase {
    func testBackoffProgression() {
        #if DEBUG
        // Attempts start at 1
        let d1 = WebSocketManager.computeBackoffDelayForTest(attempt: 1, jitter: 0)
        let d2 = WebSocketManager.computeBackoffDelayForTest(attempt: 2, jitter: 0)
        let d3 = WebSocketManager.computeBackoffDelayForTest(attempt: 3, jitter: 0)
        XCTAssertTrue(d2 > d1)
        XCTAssertTrue(d3 > d2)

        // Cap behavior
        let d10 = WebSocketManager.computeBackoffDelayForTest(attempt: 10, jitter: 0)
        XCTAssertLessThanOrEqual(d10, 20.0)

        // Jitter addition
        let dj = WebSocketManager.computeBackoffDelayForTest(attempt: 2, jitter: 0.75)
        XCTAssertEqual(dj, d2 + 0.75, accuracy: 0.0001)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
