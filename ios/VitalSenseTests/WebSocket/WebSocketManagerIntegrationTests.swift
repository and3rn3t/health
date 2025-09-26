import XCTest
@testable import VitalSense

final class WebSocketManagerIntegrationTests: XCTestCase {
    func testReceiveLoopRoutesMessages() throws {
        let manager = WebSocketManager.shared
        let adapter = TestWebSocketTaskAdapter()
        manager.test_injectTaskAdapter(adapter)
        manager.test_startReceiveLoop()
        let exp = expectation(description: "Received live health update")
        struct Payload: Codable { let value: Int }
        var receivedValue: Int?
        _ = manager.subscribe(type: "live_health_update", as: Payload.self) { payload in
            receivedValue = payload.value
            exp.fulfill()
        }
        // Build envelope
        let obj: [String: Any] = [
            "type": "live_health_update",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios-native",
            "data": ["value": 42]
        ]
        let data = try JSONSerialization.data(withJSONObject: obj)
        adapter.emit(.data(data))
        wait(for: [exp], timeout: 2.0)
        XCTAssertEqual(receivedValue, 42)
    }

    func testSendBufferCap() {
        let manager = WebSocketManager.shared
        manager.disconnect() // ensure not connected so buffering occurs
        let cap = manager.test_getSendBufferMax()
        struct Dummy: Encodable { let i: Int }
        for i in 0..<(cap + 25) { // exceed cap
            manager.send(type: "dummy", data: Dummy(i: i))
        }
        // Should not exceed cap
        XCTAssertLessThanOrEqual(manager.test_getBufferedSendCount(), cap, "Buffer should be capped")
    }
}
