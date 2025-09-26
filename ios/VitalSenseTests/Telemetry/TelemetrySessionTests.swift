import XCTest
@testable import VitalSense

final class TelemetrySessionTests: XCTestCase {
    override func setUp() async throws { await MainActor.run { Telemetry.shared.clear() } }

    func testSessionIdConsistentAcrossEvents() async throws {
        await MainActor.run {
            Telemetry.shared.record(.metricSelect(name: "duration"))
            Telemetry.shared.record(.metricSelect(name: "distance"))
        }
        let metas = await MainActor.run { Telemetry.shared.recent.prefix(2).compactMap { $0.metadata } }
        let sessionIds = Set(metas.compactMap { $0["session_id"] })
        XCTAssertEqual(sessionIds.count, 1, "Expected single session id across events")
    }
}
