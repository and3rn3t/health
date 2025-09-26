import XCTest
@testable import VitalSense

final class WebSocketSubscriptionsTests: XCTestCase {
    func testSubscribeUnsubscribeLifecycle() throws {
        let webSocket = WebSocketManager.shared
        let firstSubscription = webSocket.subscribe(
            type: "connection_established", as: ConnectionEstablished.self
        ) { _ in } 
        webSocket.unsubscribe(firstSubscription, from: "connection_established")
        // No direct accessor, but ensure unsubscribe doesn't crash and can re-add
        let secondSubscription = webSocket.subscribe(
            type: "connection_established", as: ConnectionEstablished.self
        ) { _ in } 
        webSocket.unsubscribe(secondSubscription, from: "connection_established")
    }
}
