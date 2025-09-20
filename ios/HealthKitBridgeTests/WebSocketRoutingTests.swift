import XCTest
@testable import HealthKitBridge

final class WebSocketRoutingTests: XCTestCase {
    func testRouteLiveHealthUpdate() throws {
        let webSocket = WebSocketManager.shared
        let expect = expectation(description: "live_health_update received")
        struct Update: Codable { let metric: String; let value: Double }
        let subscriptionId = webSocket.subscribe(type: "live_health_update", as: Update.self) { update in
            XCTAssertEqual(update.metric, "hr")
            XCTAssertEqual(update.value, 72)
            expect.fulfill()
        }

        // Build envelope
        let payload = ["metric": "hr", "value": 72.0]
        let env: [String: Any] = [
            "type": "live_health_update", "timestamp": ISO8601DateFormatter().string(from: Date()), "source": "test", "data": payload
        ]
        // Send via private channel by enqueueing through public sendJSON path
    Task { try? await webSocket.connect(with: "dev-local-token") } 
        // Give a moment for connection to settle in mock mode if needed
    let settle = expectation(description: "settle")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { settle.fulfill() } 
    wait(for: [settle], timeout: 1.0)

        // Use DEBUG test hook to route the message through internal dispatcher
        let data = try JSONSerialization.data(withJSONObject: env)
        webSocket.test_routeRawMessage(data)
        webSocket.unsubscribe(subscriptionId, from: "live_health_update")
        webSocket.disconnect()
        wait(for: [expect], timeout: 1.0)
    }
}
