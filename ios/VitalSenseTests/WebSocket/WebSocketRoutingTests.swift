import XCTest
@testable import VitalSense

final class WebSocketRoutingTests: XCTestCase {
    func testRoutesConnectionEstablishedEnvelope() throws {
        let manager = WebSocketManager.shared
        var received: ConnectionEstablished?
        let exp = expectation(description: "connection established routed")
        _ = manager.onConnectionEstablished { msg in
            received = msg
            exp.fulfill()
        }
        let json: [String: Any] = [
            "type": "connection_established",
            "data": [
                "connectionId": "abc123",
                "timestamp": "2025-01-01T00:00:00Z",
                "server": "test"
            ]
        ]
        let data = try JSONSerialization.data(withJSONObject: json)
        manager.test_routeRawMessage(data)
        wait(for: [exp], timeout: 1)
        XCTAssertEqual(received?.connectionId, "abc123")
        XCTAssertEqual(received?.server, "test")
    }

    func testUnknownTypeDoesNotCrashOrDispatch() throws {
        let manager = WebSocketManager.shared
        var callCount = 0
        _ = manager.onConnectionEstablished { _ in callCount += 1 }
        let json: [String: Any] = [
            "type": "totally_unknown_type",
            "data": ["foo": "bar"]
        ]
        let data = try JSONSerialization.data(withJSONObject: json)
        manager.test_routeRawMessage(data)
        XCTAssertEqual(callCount, 0)
    }

    func testMalformedJSONIsIgnored() {
        let manager = WebSocketManager.shared
        // Missing type field
        let malformed = Data("{\"data\":{}}".utf8)
        // Should not throw / crash
        manager.test_routeRawMessage(malformed)
        // Nothing to assert beyond no crash; adding a sanity assert
        XCTAssertTrue(true)
    }
}
