import XCTest
@testable import VitalSense

final class TelemetryTests: XCTestCase {
    func testRecordInsertsEvent() async {
        await MainActor.run {
            let initial = Telemetry.shared.recent.count
            Telemetry.shared.record(.gaitLoad("loading"))
            XCTAssertEqual(Telemetry.shared.recent.count, initial + 1)
        }
    }
}
