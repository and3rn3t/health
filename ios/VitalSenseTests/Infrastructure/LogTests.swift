import XCTest
@testable import VitalSense

final class LogTests: XCTestCase {
    func testRecentContainsLatestEntries() {
        // Generate unique markers
        let base = UUID().uuidString
        let markers = (0..<10).map { "TEST-\(base)-\($0)" }
        markers.forEach { Log.debug($0, category: "test") }
        #if DEBUG
        Log._test_barrier()
        #endif
        let recent = Log.recent(20).joined(separator: "\n")
        XCTAssertTrue(recent.contains(markers.last!), "Expected most recent marker present")
    }

    func testRingBufferCapNotExceeded() {
        // Assumes current implementation cap=600; write cap+50 unique entries
        let cap = Log._test_cap
        let base = UUID().uuidString
        let total = cap + 50
        for i in 0..<total { Log.debug("RB-\(base)-\(i)", category: "ring") }
        #if DEBUG
        Log._test_barrier()
        #endif
        let lines = Log.recent(cap + 200) // request more than cap
        XCTAssertLessThanOrEqual(lines.count, cap, "Ring buffer should not exceed cap")
        XCTAssertTrue(lines.last?.contains("RB-\(base)-\(total - 1)") == true, "Last inserted marker missing")
        // Earliest newly inserted (i=0) should have been evicted
        let evictedMarker = "RB-\(base)-0"
        XCTAssertFalse(lines.contains { $0.contains(evictedMarker) }, "Oldest marker should be evicted when over cap")
    }
}
