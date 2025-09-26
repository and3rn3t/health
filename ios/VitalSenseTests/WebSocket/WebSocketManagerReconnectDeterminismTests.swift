import XCTest
@testable import VitalSense

final class WebSocketManagerReconnectDeterminismTests: XCTestCase {
    func test_reconnectDelayOverrideRecordsSequenceAndSkipsActualReconnect() async {
        #if DEBUG
        let manager = WebSocketManager.shared
        // Ensure clean slate
        await manager.disconnect()
        WebSocketManager.test_recordedDelays.removeAll()
        WebSocketManager.test_skipActualReconnect = true
        // Provide deterministic sequence: delay == attemptIndex * 0.25
        WebSocketManager.test_reconnectDelayOverride = { attempt in Double(attempt) * 0.25 }
        // Inject token so reconnect path is taken
        manager.test_setToken("TEST_TOKEN")

        // Force three connection loss handling cycles
        await manager.test_forceHandleConnectionLoss()
        await manager.test_forceHandleConnectionLoss()
        await manager.test_forceHandleConnectionLoss()

        XCTAssertEqual(WebSocketManager.test_recordedDelays.count, 3, "Should have recorded three delays")
        XCTAssertEqual(WebSocketManager.test_recordedDelays, [0.25, 0.50, 0.75], accuracy: 0.0001)
        #else
        throw XCTSkip("Deterministic reconnect tests only run in DEBUG builds")
        #endif
    }
}
