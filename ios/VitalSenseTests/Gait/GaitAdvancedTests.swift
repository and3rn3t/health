import XCTest
@testable import VitalSense

final class GaitAdvancedTests: XCTestCase {

    func testHeadingProjectionFallback() throws {
        #if canImport(ARKit)
        let detector = StepEventDetector()
        // Inject a forward heading roughly along +Z
        detector._testSetHeading(SIMD2<Float>(0, 1))
        let other = SIMD3<Float>(0, 0, 0)
        // Current foot displaced mostly lateral (x) with small forward component
        let currentMostlyLateral = SIMD3<Float>(0.3, 0, 0.05)
        // Projection should fallback to Euclidean because forward component small (<30% of euclid)
        let len1 = detector._testProjectedLength(current: currentMostlyLateral, other: other)!
        XCTAssertGreaterThan(len1, 0.28) // near euclidean ~0.304

        // Now strong forward component
        let currentForward = SIMD3<Float>(0.1, 0, 0.6)
        let len2 = detector._testProjectedLength(current: currentForward, other: other)!
        // Euclidean ~0.608, projected ~0.6 => should be close but not fallback
        XCTAssertEqual(len2, 0.6, accuracy: 0.05)
        #endif
    }

    func testOutlierFilteringRejectsExtremeStepLength() {
        let agg = GaitMetricsAggregator()
        let baseTime: TimeInterval = 1_000
        var t = baseTime
        // Feed normal step lengths 0.6m alternating feet
        for i in 0..<10 {
            let foot: FootSide = (i % 2 == 0) ? .left : .right
            let ev = StepEvent(foot: foot, timestamp: t, position: .zero, stepLength: 0.6, strideLength: nil, stanceDuration: nil, swingDuration: 0.5, toeClearance: nil)
            _ = agg.ingest(step: ev)
            t += 0.6
        }
        // Inject extreme outlier 2.2m (should be outside physiologic bounds and rejected)
        let outlier = StepEvent(foot: .left, timestamp: t, position: .zero, stepLength: 2.2, strideLength: nil, stanceDuration: nil, swingDuration: 0.5, toeClearance: nil)
        let aggregate = agg.ingest(step: outlier)
        // Average step length should remain close to 0.6
        XCTAssertNotNil(aggregate.averageStepLength)
        if let avg = aggregate.averageStepLength { XCTAssertEqual(avg, 0.6, accuracy: 0.05) }
    }

    func testQualityConfidenceComputation() throws {
        #if canImport(ARKit)
        let analyzer = GaitLiDARAnalyzer()
        // Start and manually adjust using debug helper (no AR session run)
        analyzer._testUpdateQuality(total: 100, withBoth: 80)
        XCTAssertEqual(analyzer.qualityConfidence, 0.8, accuracy: 0.0001)
        analyzer._testUpdateQuality(total: 25, withBoth: 5)
        XCTAssertEqual(analyzer.qualityConfidence, 0.2, accuracy: 0.0001)
        #endif
    }
}
