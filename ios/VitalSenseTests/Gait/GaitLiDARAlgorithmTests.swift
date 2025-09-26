import XCTest
@testable import VitalSense

final class GaitLiDARAlgorithmTests: XCTestCase {

    func testAggregatorComputesCadenceSpeedDoubleSupport() throws {
        let agg = GaitMetricsAggregator()
        let base: TimeInterval = 1_000.0
        // Synthetic alternating steps every 0.6s, stride time 1.2s, step length ~0.6m, stride length ~1.2m
        // left (L1), right (R1), left (L2)
        let l1 = StepEvent(foot: .left, timestamp: base, position: .zero, stepLength: 0.6, strideLength: nil, stanceDuration: nil, swingDuration: 0.5, toeClearance: 0.025)
        _ = agg.ingest(step: l1)
        let r1 = StepEvent(foot: .right, timestamp: base + 0.6, position: .zero, stepLength: 0.6, strideLength: nil, stanceDuration: nil, swingDuration: 0.5, toeClearance: 0.024)
        _ = agg.ingest(step: r1)
        // Provide stride length on second left strike
        let l2 = StepEvent(foot: .left, timestamp: base + 1.2, position: .zero, stepLength: 0.6, strideLength: 1.2, stanceDuration: nil, swingDuration: 0.5, toeClearance: 0.026)
        // Inject double support intervals (two overlaps 0.15s & 0.16s) before ingesting last step
        agg.ingestDoubleSupportDurations([0.15, 0.16])
        let aggregate = agg.ingest(step: l2)

        // Cadence: (3-1)/1.2 * 60 = 100 spm
        XCTAssertNotNil(aggregate.cadence)
        XCTAssertEqual(aggregate.cadence!, 100, accuracy: 2.0)

        // Walking speed: strideLen / strideTime = 1.2 / 1.2 = 1.0 m/s
        XCTAssertEqual(aggregate.walkingSpeed!, 1.0, accuracy: 0.05)

        // Average step length ~0.6
        XCTAssertEqual(aggregate.averageStepLength!, 0.6, accuracy: 0.05)

        // Double support percentage ~ avg(0.155)/1.2 *100 ~= 12.9%
        XCTAssertNotNil(aggregate.doubleSupportPercentage)
        if let ds = aggregate.doubleSupportPercentage { XCTAssertEqual(ds, 12.9, accuracy: 2.0) }

        // Toe clearance average ~0.025
        XCTAssertNotNil(aggregate.averageToeClearance)
        if let tc = aggregate.averageToeClearance { XCTAssertEqual(tc, 0.025, accuracy: 0.005) }
    }

    func testRiskScorerThresholds() throws {
        let scorer = GaitRiskScorer()
        // Low risk inputs
        let low = GaitRiskScorer.Inputs(
            walkingSpeed: 1.2,
            cadence: 110,
            doubleSupport: 10,
            stepLengthCV: 0.02,
            speedCV: 0.02,
            asymmetryStepLength: 2,
            toeClearance: 0.025,
            stabilityIndex: 90
        )
        let lowScore = scorer.score(low)
        XCTAssertLessThan(lowScore.score, 25)
        XCTAssertEqual(lowScore.level, .low)

        // High / critical risk inputs
        let high = GaitRiskScorer.Inputs(
            walkingSpeed: 0.5, // very slow
            cadence: 70, // low
            doubleSupport: 28, // high
            stepLengthCV: 0.15, // very high variability
            speedCV: 0.16,
            asymmetryStepLength: 12, // high asymmetry
            toeClearance: 0.008, // very low
            stabilityIndex: 50 // low stability
        )
        let highScore = scorer.score(high)
        XCTAssertGreaterThanOrEqual(highScore.score, 75) // expect high or critical
        XCTAssertTrue(highScore.level == .high || highScore.level == .critical)
    }

    func testFloorEstimatorConvergence() throws {
        let floor = FloorEstimator()
        // Simulate 200 samples; true floor ~0.0 with slight noise.
        var heights: [Float] = []
        for i in 0..<200 {
            let base: Float = 0
            let noise: Float = (i % 5 == 0) ? 0.003 : Float(i % 3) * 0.001 // small variations
            // Simulate two feet (min used internally); right foot slightly higher sometimes.
            floor.ingest(leftY: base + noise, rightY: base + noise + 0.002)
            heights.append(base + noise)
        }
        XCTAssertNotNil(floor.floorY)
        if let y = floor.floorY { XCTAssertLessThan(y, 0.005, "Floor baseline should converge near 0 (") }
        if let std = floor.floorStd { XCTAssertLessThan(std, 0.003, "Floor std should be small (") }
    }
}
