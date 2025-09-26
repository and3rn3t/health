import XCTest
@testable import VitalSense

final class WebSocketManagerHeartbeatRecoveryTests: XCTestCase {
    func test_heartbeatFailureThenRecoveryResetsMissedCount() async {
        #if DEBUG
        let manager = WebSocketManager.shared
        // Start heartbeat (uses adapter's ping simulation path in DEBUG via manual tick)
        manager.test_startHeartbeat()
        // Simulate two failed pings
        _ = manager.test_runHeartbeatTick(simulateError: true)
        _ = manager.test_runHeartbeatTick(simulateError: true)
        let afterFailures = manager.test_getMissedHeartbeats()
        XCTAssertTrue(afterFailures >= 2, "Missed heartbeats should have incremented (got: \(afterFailures))")
        // Simulate a successful ping
        _ = manager.test_runHeartbeatTick(simulateError: false)
        XCTAssertEqual(manager.test_getMissedHeartbeats(), 0, "Successful ping should reset missed heartbeat counter")
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
