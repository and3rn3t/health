import XCTest
@testable import VitalSense

final class WebSocketManagerReconnectLiveTests: XCTestCase {
    func test_reconnectAttemptsIncreaseAndDelayOverrideApplied() async {
        #if DEBUG
        let manager = WebSocketManager.shared
        manager.test_resetDebugState()
        manager.test_setToken("LIVE_TOKEN")
        // Provide small deterministic delays so test runs quickly
        WebSocketManager.test_reconnectDelayOverride = { attempt in 0.01 * Double(attempt) }
        WebSocketManager.test_skipActualReconnect = false
        // Force two connection loss cycles
        await manager.test_forceHandleConnectionLoss()
        await manager.test_forceHandleConnectionLoss()
        XCTAssertEqual(WebSocketManager.test_recordedDelays.count, 2)
        XCTAssertEqual(WebSocketManager.test_recordedDelays[0], 0.01, accuracy: 0.0001)
        XCTAssertEqual(WebSocketManager.test_recordedDelays[1], 0.02, accuracy: 0.0001)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
