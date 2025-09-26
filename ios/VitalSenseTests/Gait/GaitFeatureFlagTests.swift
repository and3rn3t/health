import XCTest
@testable import VitalSense

final class GaitFeatureFlagTests: XCTestCase {

    func testMLRiskScorerForceLoadedAdjustsScoreAndConfidence() throws {
        // Baseline heuristic scorer
        let heuristic = GaitRiskScorer()
        let inputs = GaitRiskScorer.Inputs(
            walkingSpeed: 0.9,
            cadence: 95,
            doubleSupport: 18,
            stepLengthCV: 0.06,
            speedCV: 0.05,
            asymmetryStepLength: 4,
            toeClearance: 0.014, // triggers ML boost
            stabilityIndex: 72
        )
        let base = heuristic.score(inputs)
        let ml = GaitMLRiskScorer(fallback: heuristic, forceModelLoaded: true).score(inputs)

        // ML score should generally differ (boost or scaled) and confidence slightly higher
        XCTAssertNotEqual(base.score, ml.score, "ML adjusted score should differ from heuristic")
        XCTAssertGreaterThanOrEqual(ml.confidence, base.confidence, "ML confidence should be >= heuristic")
    }

    func testMLRiskScorerFallbackWhenNotLoaded() throws {
        let heuristic = GaitRiskScorer()
        let inputs = GaitRiskScorer.Inputs(
            walkingSpeed: 1.2,
            cadence: 110,
            doubleSupport: 10,
            stepLengthCV: 0.03,
            speedCV: 0.03,
            asymmetryStepLength: 2,
            toeClearance: 0.025,
            stabilityIndex: 85
        )
        let base = heuristic.score(inputs)
        let mlFallback = GaitMLRiskScorer(fallback: heuristic, forceModelLoaded: false).score(inputs)
        XCTAssertEqual(base.score, mlFallback.score, accuracy: 0.0001)
        XCTAssertEqual(base.confidence, mlFallback.confidence, accuracy: 0.0001)
    }

    func testCadenceFusionFreshAndStale() throws {
        let fusion = CadenceFusionManager.shared
        fusion._testEnableFusion(true)
        // Provide watch cadence
        fusion.updateWatchCadence(118)
        // Fuse with LiDAR cadence 110
        let fused1 = fusion.fuse(lidarCadence: 110)
        XCTAssertNotNil(fused1)
        XCTAssertTrue(fusion.lastFusionApplied, "Fusion should apply when watch cadence is fresh")
        XCTAssertTrue(fusion.isWatchCadenceFresh)

        // Advance (backdate) watch timestamp beyond freshness window (5s) and fuse again with new LiDAR cadence
        fusion._testBackdateWatch(seconds: 10)
        let fused2 = fusion.fuse(lidarCadence: 112)
        XCTAssertEqual(fused2, 112, "When stale, fused cadence should revert to LiDAR raw")
        XCTAssertFalse(fusion.lastFusionApplied, "Fusion should not apply when watch cadence stale")
    }
}
