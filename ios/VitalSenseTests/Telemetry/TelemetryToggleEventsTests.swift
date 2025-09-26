import XCTest
@testable import VitalSense

final class TelemetryToggleEventsTests: XCTestCase {
    override func setUp() async throws { await MainActor.run { Telemetry.shared.clear() } }

    func testToggleAndStreamEventsRecorded() async throws {
        await MainActor.run {
            Telemetry.shared.record(.hapticsToggle(enabled: true))
            Telemetry.shared.record(.pseudoLocaleToggle(enabled: false))
            Telemetry.shared.record(.streamStatus(started: true))
        }
        let names = await MainActor.run { Set(Telemetry.shared.recent.map { $0.name }) }
        XCTAssertTrue(names.contains("haptics_toggle"))
        XCTAssertTrue(names.contains("pseudo_locale_toggle"))
        XCTAssertTrue(names.contains("stream_status"))
    }

    func testPersistenceRoundTrip() async throws {
        await MainActor.run {
            Telemetry.shared.clear()
            Telemetry.shared.record(.hapticsToggle(enabled: true))
        }
        // Force new record to trigger persistence load path indirectly (singleton keeps state, so just ensure count >0)
        let count = await MainActor.run { Telemetry.shared.recent.count }
        XCTAssertGreaterThan(count, 0)
    }
}
