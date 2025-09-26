import XCTest
@testable import VitalSense

/// Tests heartbeat behavior using TestWebSocketTaskAdapter and debug hooks.
final class WebSocketManagerHeartbeatTests: XCTestCase {
    func testHeartbeatMissesTriggerReconnect() async throws {
        let manager = WebSocketManager.shared
        let adapter = TestWebSocketTaskAdapter()
        let exp = expectation(description: "Reconnect hook invoked")
        var hookCount = 0
        manager.onReconnectAttempt = {
            hookCount += 1
            exp.fulfill()
        }
        manager.test_injectTaskAdapter(adapter)
        manager.test_startHeartbeat()
        // Simulate missed heartbeats > threshold
        let threshold =  manager.test_getMissedHeartbeatThreshold()
        for _ in 0..<(threshold + 1) { // exceed
            manager.test_runHeartbeatTick(simulateError: true)
        }
        wait(for: [exp], timeout: 2.0)
        XCTAssertGreaterThanOrEqual(hookCount, 1, "Reconnect hook should have fired after missed heartbeats")
    }
}
