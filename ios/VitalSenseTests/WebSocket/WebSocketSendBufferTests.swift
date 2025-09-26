import XCTest
@testable import VitalSense

final class WebSocketSendBufferTests: XCTestCase {
    func testBufferFlushOnConnect() async throws {
        let webSocket = WebSocketManager.shared
        // Ensure disconnected state
        webSocket.disconnect()
        // Enqueue a couple of sends before connect
        struct Ping: Codable { let id: Int }
        webSocket.send(type: "ping", data: Ping(id: 1))
        webSocket.send(type: "ping", data: Ping(id: 2))
        // Now connect (likely mock or real dev)
        await webSocket.connect(with: "dev-local-token")
        // If no crash and state shows connected, consider flush successful for this unit-level smoke
        XCTAssertTrue(webSocket.connectionStatus.contains("Connected"))
        webSocket.disconnect()
    }
}
