import XCTest
@testable import VitalSense

final class WebSocketManagerBufferOverflowTests: XCTestCase {
    func test_bufferOverflowDropsOldest() async throws {
        #if DEBUG
        let manager = WebSocketManager.shared
        // Ensure disconnected to force buffering (pretend not connected)
        await manager.disconnect()
        // Inject token so reconnect logic path not engaged here
        manager.test_setToken("TOKEN")
        let cap = manager.test_getSendBufferMax()
        // Enqueue cap + 5 messages; mark first and last with identifiers
        for i in 0..<(cap + 5) {
            let payload: [String: Any] = ["type": "test", "seq": i]
            let data = try JSONSerialization.data(withJSONObject: payload)
            // Directly access private queue via send API (which will enqueue because not connected)
            try await manager.enqueueTestPayload(data)
        }
        // Dump buffer
        let snapshot = manager.test_dumpBuffer()
        XCTAssertEqual(snapshot.count, cap, "Buffer should be capped at \(cap)")
        // Verify that the earliest sequences were dropped (0..4)
        var seqValues: [Int] = []
        for d in snapshot {
            if let obj = try? JSONSerialization.jsonObject(with: d) as? [String: Any], let seq = obj["seq"] as? Int { seqValues.append(seq) }
        }
        XCTAssertFalse(seqValues.contains(0), "Oldest element (seq 0) should have been dropped")
        XCTAssertFalse(seqValues.contains(1), "Oldest element (seq 1) should have been dropped")
        XCTAssertTrue(seqValues.contains(cap + 4 - 5), "Newest element should still exist")
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
