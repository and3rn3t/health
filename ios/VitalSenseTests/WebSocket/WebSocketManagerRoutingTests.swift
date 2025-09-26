import XCTest
@testable import VitalSense

#if DEBUG // Guard use of debug-only helpers
final class WebSocketManagerRoutingTests: XCTestCase {

    struct DummyPayload: Codable, Equatable { let value: Int }
    struct DifferentPayload: Codable { let other: String }

    private let eventType = "test_event"
    private let differentType = "different_event"

    override func setUp() {
        super.setUp()
        // Ensure shared manager exists (singleton already created lazily).
    }

    func testRoutesMessageToSingleSubscriber() throws {
        let exp = expectation(description: "Single subscriber invoked")
        let id = WebSocketManager.shared.subscribe(type: eventType, as: DummyPayload.self) { payload in
            XCTAssertEqual(payload.value, 42)
            exp.fulfill()
        }
        defer { WebSocketManager.shared.unsubscribe(id, from: eventType) }
        try routeDummy(value: 42, type: eventType)
        wait(for: [exp], timeout: 0.5)
    }

    func testRoutesMessageToMultipleSubscribers() throws {
        let exp1 = expectation(description: "Subscriber 1")
        let exp2 = expectation(description: "Subscriber 2")
        let id1 = WebSocketManager.shared.subscribe(type: eventType, as: DummyPayload.self) { _ in exp1.fulfill() }
        let id2 = WebSocketManager.shared.subscribe(type: eventType, as: DummyPayload.self) { _ in exp2.fulfill() }
        defer {
            WebSocketManager.shared.unsubscribe(id1, from: eventType)
            WebSocketManager.shared.unsubscribe(id2, from: eventType)
        }
        try routeDummy(value: 99, type: eventType)
        wait(for: [exp1, exp2], timeout: 0.5)
    }

    func testUnsubscribePreventsFurtherDelivery() throws {
        let exp = expectation(description: "Should NOT be called")
        exp.isInverted = true
        let id = WebSocketManager.shared.subscribe(type: eventType, as: DummyPayload.self) { _ in exp.fulfill() }
        WebSocketManager.shared.unsubscribe(id, from: eventType)
        try routeDummy(value: 1, type: eventType)
        wait(for: [exp], timeout: 0.3)
    }

    func testDecodeFailureDoesNotCallHandler() throws {
        let exp = expectation(description: "Handler should not fire on decode failure")
        exp.isInverted = true
        // Subscribe expecting DifferentPayload but send DummyPayload shape
        let id = WebSocketManager.shared.subscribe(type: eventType, as: DifferentPayload.self) { _ in exp.fulfill() }
        defer { WebSocketManager.shared.unsubscribe(id, from: eventType) }
        try routeDummy(value: 7, type: eventType)
        wait(for: [exp], timeout: 0.3)
    }

    func testUnknownTypeIgnoredGracefully() throws {
        // No subscribers for differentType; ensure no crash
        XCTAssertNoThrow(try routeDummy(value: 5, type: differentType))
    }

    // MARK: - Helper
    private func routeDummy(value: Int, type: String) throws {
        guard let envelope = WebSocketManager.buildEnvelopeForTest(type: type, data: DummyPayload(value: value)) else {
            XCTFail("Failed to build envelope")
            return
        }
        let data = try JSONSerialization.data(withJSONObject: envelope, options: [])
        WebSocketManager.shared.test_routeRawMessage(data)
    }
}
#endif
