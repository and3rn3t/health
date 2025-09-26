import XCTest
@testable import VitalSense

final class WebSocketManagerBackoffTests: XCTestCase {
    func testBackoffDeterministicSequence() {
        // attempt indices 1..6 (6 should cap)
        let base: Double = 1.5
        let initial: TimeInterval = 1.0
        let cap: TimeInterval = 20.0
        let expected: [TimeInterval] = [
            1.0,                    // 1
            1.0 * pow(base, 1),     // 2
            1.0 * pow(base, 2),     // 3
            1.0 * pow(base, 3),     // 4
            1.0 * pow(base, 4),     // 5
            cap                     // 6 (capped)
        ].map { min($0, cap) }

        for attempt in 1...6 {
            let value = WebSocketManager.computeBackoffDelayForTest(
                attempt: attempt,
                base: base,
                initial: initial,
                cap: cap,
                jitter: 0.0
            )
            XCTAssertEqual(value, expected[attempt - 1], accuracy: 0.0001, "Attempt \(attempt) mismatch")
        }
    }
}
