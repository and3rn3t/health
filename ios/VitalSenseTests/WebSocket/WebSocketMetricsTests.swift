import XCTest
@testable import VitalSense

final class WebSocketMetricsTests: XCTestCase {

    // Helper to await async metric recording (since public record uses fire-and-forget Task)
    private func snapshot(after delay: TimeInterval = 0.05) async -> WebSocketMetrics.Snapshot {
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        return await WebSocketMetrics.shared.snapshot()
    }

    override func setUp() async throws {
        try await super.setUp()
        await WebSocketMetrics.shared.reset()
    }

    @MainActor
    func testBufferOverflowMetrics() async throws {
        #if DEBUG
        let mgr = WebSocketManager(baseURL: nil)
        mgr.disconnect() // ensure disconnected
        let payload = Data("{}".utf8)
        for _ in 0..<201 { try await mgr.enqueueTestPayload(payload) }
        let snap = await snapshot()
        XCTAssertEqual(snap.counters[.bufferDrop], 1, "Expected one bufferDrop when exceeding capacity")
        XCTAssertEqual(snap.counters[.bufferEnqueue], 201, "All enqueued messages should be counted")
        XCTAssertEqual(mgr.test_getBufferedSendCount(), mgr.test_getSendBufferMax(), "Buffer should be capped at max size")
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    @MainActor
    func testDecodeFailureMetrics() async throws {
        #if DEBUG
        let mgr = WebSocketManager(baseURL: nil)
        let bad = Data([0xFF, 0x00, 0x01])
        for _ in 0..<10 { mgr.test_routeRawMessage(bad) }
        let snap = await snapshot()
        XCTAssertEqual(snap.counters[.messageDecodeFail], 10, "All decode failures should increment metric (rate limiter only suppresses logs)")
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    @MainActor
    func testHeartbeatMissAndRecoverMetrics() async throws {
        #if DEBUG
        let mgr = WebSocketManager(baseURL: nil)
        let testAdapter = WebSocketManager.TestWebSocketTaskAdapter()
        mgr.test_injectTaskAdapter(testAdapter, markConnected: true)
        mgr.test_runHeartbeatTick(simulateError: true)  // miss
        mgr.test_runHeartbeatTick(simulateError: false) // recover
        let snap = await snapshot()
        XCTAssertEqual(snap.counters[.heartbeatPing], 2)
        XCTAssertEqual(snap.counters[.heartbeatMiss], 1)
        XCTAssertEqual(snap.counters[.heartbeatRecover], 1)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    @MainActor
    func testReconnectAttemptMetrics() async throws {
        #if DEBUG
        // Skip real reconnect and eliminate delay
        WebSocketManager.test_skipActualReconnect = true
        WebSocketManager.test_reconnectDelayOverride = { _ in 0 }
        let mgr = WebSocketManager(baseURL: nil)
        mgr.test_setToken("unit-test-token")
        await mgr.test_forceHandleConnectionLoss()
        let snap = await snapshot()
        XCTAssertEqual(snap.counters[.connectionClose], 1)
        XCTAssertEqual(snap.counters[.reconnectAttempt], 1)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
