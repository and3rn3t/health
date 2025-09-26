import XCTest
@testable import VitalSense

final class WebSocketManagerSendBufferTests: XCTestCase {
    func testBufferedMessagesFlushOnConnect() async throws {
        let manager = WebSocketManager.shared
        // Ensure clean state
        manager.disconnect()
        // Queue some synthetic envelopes before adapter injection
        for i in 0..<5 {
            struct Dummy: Encodable { let v: Int }
            manager.send(type: "dummy_type", data: Dummy(v: i))
        }
        XCTAssertEqual(manager.test_getBufferedSendCount(), 5, "Expected 5 messages buffered before connection")
        let adapter = TestWebSocketTaskAdapter()
        manager.test_injectTaskAdapter(adapter)
        manager.test_forceFlushBuffer()
        // Data messages should now be present in adapter
        let dataMessages = adapter.drainSentDataMessages()
        XCTAssertEqual(dataMessages.count, 5, "All buffered messages should flush through adapter")
        XCTAssertEqual(manager.test_getBufferedSendCount(), 0, "Buffer should be empty after flush")
    }
}
