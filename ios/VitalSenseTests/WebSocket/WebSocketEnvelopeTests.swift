import XCTest
@testable import VitalSense

final class WebSocketEnvelopeTests: XCTestCase {
    func testGaitEnvelopeShape() throws {
        var metrics = GaitMetrics()
        metrics.averageWalkingSpeed = 1.25
        metrics.averageStepLength = 0.65
        metrics.stepFrequency = 100
        let payload = GaitDataPayload(
            deviceId: "test-device", userId: "user-1", sessionId: "sess-123", gaitMetrics: metrics, assessment: nil, rawSensorData: nil, meta: ["protocol": "free_walk"]
        )

        #if DEBUG
        let ws = WebSocketManager.shared
        guard let envelope = ws.buildGaitEnvelopeForTest(payload) else {
            return XCTFail("Failed to build envelope")
        }
        XCTAssertEqual(envelope["type"] as? String, "gait_analysis")
        XCTAssertNotNil(envelope["timestamp"])
        XCTAssertEqual(envelope["source"] as? String, "ios-native")

        guard let data = envelope["data"] as? [String: Any] else {
            return XCTFail("Missing data object")
        }
        XCTAssertEqual(data["deviceId"] as? String, "test-device")
        XCTAssertEqual(data["userId"] as? String, "user-1")
        XCTAssertEqual(data["sessionId"] as? String, "sess-123")
        XCTAssertNotNil(data["timestamp"]) // auto-stamped on init

        guard let gait = data["gaitMetrics"] as? [String: Any] else {
            return XCTFail("Missing gaitMetrics")
        }
        XCTAssertEqual(gait["averageWalkingSpeed"] as? Double, 1.25)
        XCTAssertEqual(gait["averageStepLength"] as? Double, 0.65)
        XCTAssertEqual(gait["stepFrequency"] as? Double, 100)

        if let meta = data["meta"] as? [String: String] {
            XCTAssertEqual(meta["protocol"], "free_walk")
        } else {
            XCTFail("Missing meta in payload")
        }
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
