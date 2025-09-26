import XCTest
@testable import VitalSense

final class CalibrationQualityInstrumentationTests: XCTestCase {

    // Helper to build metrics
    private func metrics(speed: Double?, step: Double?, cadence: Double?, ds: Double?) -> GaitMetrics {
        var m = GaitMetrics()
        m.averageWalkingSpeed = speed
        m.averageStepLength = step
        m.stepFrequency = cadence
        m.doubleSupportTime = ds
        return m
    }

    func testCalibrationBaselineAndDeviations() {
        #if DEBUG
        let cal = GaitCalibrationManager(window: 0.5) // small window
        cal.startIfNeeded()
        // Feed metrics inside window
        cal.ingest(metrics: metrics(speed: 1.0, step: 0.6, cadence: 100, ds: 10))
        cal.ingest(metrics: metrics(speed: 0.9, step: 0.58, cadence: 98, ds: 11))
        // Force finalize via backdating time
        cal._forceFinalize()
        XCTAssertTrue(cal.isComplete)
        let base = cal.baseline
        XCTAssertNotNil(base)
        XCTAssertEqual(base?.speed ?? 0, (1.0 + 0.9)/2.0, accuracy: 0.0001)
        // Deviations using a later metric
        let dev = cal.deviations(for: metrics(speed: 0.8, step: 0.55, cadence: 85, ds: 15))
        XCTAssertLessThan(dev.speedPct ?? 0, 0) // speed lower
        XCTAssertLessThan(dev.stepLengthPct ?? 0, 0)
        XCTAssertLessThan(dev.cadencePct ?? 0, 0)
        XCTAssertGreaterThan(dev.doubleSupportPct ?? 0, 0)
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }

    func testQualityMetaFrameDropAndPointDensity() {
        #if DEBUG
        let mgr = LiDARSessionManager.shared
        mgr.startGaitSession(duration: 2, simulate: true, protocolTag: "test_proto")
        // Inject some frames (simulate partial capture)
        mgr._testInjectFrame(pointCount: 1500)
        mgr._testInjectFrame(pointCount: 1200)
        mgr._testInjectFrame(pointCount: 1800)
        // Access meta snapshot
        let meta = mgr._testQualityMeta() ?? [:]
        XCTAssertNotNil(meta["frame_drop_pct"]) // planned frames vs injected
        XCTAssertEqual(meta["point_density_min"], "1200")
        XCTAssertEqual(meta["point_density_max"], "1800")
        XCTAssertNotNil(meta["point_density_avg"])
        // Baseline keys may not yet exist (calibration window not complete) – that's acceptable
        // Stop session to clean up
        mgr.stopSession()
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }

    func testQualityScoreDeviationsPenalties() {
        #if DEBUG
        let mgr = LiDARSessionManager.shared
        // Build metrics in normal range baseline
        var m = metrics(speed: 1.0, step: 0.6, cadence: 100, ds: 12)
        // Establish baseline by starting a short simulated session (so internal state exists)
        mgr.startGaitSession(duration: 1, simulate: true)
        // Force baseline finalize quickly
        mgr._testForceCalibrationBaseline(metrics: m)
        // Reference quality score with neutral deviations
        let baseScore = mgr._testComputeQualityScore(m)
        // Apply large negative speed deviation and high double support & erratic cadence
        mgr._testSetCalibrationDeviations(speed: -25, step: 0, cadence: 40, ds: 25)
        let penalized = mgr._testComputeQualityScore(m)
        XCTAssertLessThan(penalized, baseScore, "Expected penalties applied to quality score")
        mgr.stopSession()
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }
}
