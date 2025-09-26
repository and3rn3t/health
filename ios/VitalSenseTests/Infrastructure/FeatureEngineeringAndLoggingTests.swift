import XCTest
@testable import VitalSense

final class FeatureEngineeringAndLoggingTests: XCTestCase {

    // MARK: - GaitFeatureEngineer
    func testStrideTimeCVRequiresEnoughSamples() {
        let fe = GaitFeatureEngineer()
        // Fewer than 5 stride time samples -> nil
        for i in 0..<4 { fe.ingest(sample: .init(timestamp: Double(i), strideTime: 1.0 + Double(i)*0.01, cadence: 100, toeClearance: 0.02, stepLengthCV: 0.03)) }
        XCTAssertNil(fe.strideTimeCV, "Expected nil CV with <5 samples")
        fe.ingest(sample: .init(timestamp: 5, strideTime: 1.04, cadence: 101, toeClearance: 0.021, stepLengthCV: 0.03))
        XCTAssertNotNil(fe.strideTimeCV, "CV should compute with >=5 samples")
    }

    func testHarmonicRatioWithAndWithoutStepLengthCV() {
        let fe = GaitFeatureEngineer()
        // Provide stride times to stabilize CV
        for i in 0..<6 { fe.ingest(sample: .init(timestamp: Double(i), strideTime: 1.0, cadence: 100, toeClearance: 0.02, stepLengthCV: 0.02)) }
        let hrWith = fe.harmonicRatio(stepLengthCV: 0.04)
        let hrNoSL = fe.harmonicRatio(stepLengthCV: nil)
        XCTAssertNotNil(hrWith)
        XCTAssertNotNil(hrNoSL)
        // Without step length CV we scale differently; plausibly higher due to default path
        if let with = hrWith, let noSL = hrNoSL { XCTAssertNotEqual(with, noSL, accuracy: 0.0001) }
    }

    func testNearTripEventDetection() {
        let fe = GaitFeatureEngineer()
        // Build baseline toe clearance ~0.025 with stable cadence 100
        for i in 0..<10 { fe.ingest(sample: .init(timestamp: Double(i), strideTime: 1.1, cadence: 100, toeClearance: 0.025, stepLengthCV: 0.03)) }
        let baseline = fe.baselineToeClearance
        XCTAssertNotNil(baseline)
        let preTrips = fe.nearTripEvents
        // Inject a dip (toe clearance < baseline*0.6) plus a cadence spike >5%
        fe.ingest(sample: .init(timestamp: 11, strideTime: 1.09, cadence: 107, toeClearance: (baseline ?? 0.025) * 0.5, stepLengthCV: 0.03))
        XCTAssertEqual(fe.nearTripEvents, preTrips + 1, "Near-trip should increment when dip + spike present")
        // Provide a dip without cadence spike -> no increment
        fe.ingest(sample: .init(timestamp: 12, strideTime: 1.08, cadence: 102, toeClearance: (baseline ?? 0.025) * 0.5, stepLengthCV: 0.03))
        XCTAssertEqual(fe.nearTripEvents, preTrips + 1, "No extra event without cadence spike")
    }

    func testToeClearanceBaselineEMAConverges() {
        let fe = GaitFeatureEngineer()
        var lastBaseline: Double? = nil
        for i in 0..<30 {
            fe.ingest(sample: .init(timestamp: Double(i), strideTime: 1.1, cadence: 100, toeClearance: 0.03, stepLengthCV: 0.02))
            lastBaseline = fe.baselineToeClearance
        }
        XCTAssertNotNil(lastBaseline)
        XCTAssertEqual(lastBaseline ?? 0, 0.03, accuracy: 0.005, "EMA baseline should converge near input value")
    }

    // MARK: - FeatureVectorLogger
    func testFeatureVectorLoggerCapturesLatestMetrics() {
        let logger = FeatureVectorLogger.shared
        logger._reset()
        var m = GaitMetrics()
        m.averageWalkingSpeed = 1.1
        m.averageStepLength = 0.62
        m.stepFrequency = 102
        m.doubleSupportTime = 12
        m.walkingSpeedVariability = 0.04
        m.stepLengthVariability = 0.05
        m.strideTimeVariability = 0.02
        m.harmonicRatio = 1.2
        m.mediolateralSwayProxy = 0.15
        m.averageToeClearance = 0.024
        m.nearTripEvents = 2
        let risk = GaitRiskAssessment(score: 45, level: .moderate, confidence: 0.7)
        logger.log(from: m, risk: risk)
        XCTAssertEqual(logger._count(), 1)
        let last = logger._last()
        XCTAssertEqual(last?.speed, 1.1)
        XCTAssertEqual(last?.riskLevel, RiskLevel.moderate.rawValue)
        XCTAssertEqual(last?.nearTripEvents, 2)
    }

    func testFeatureVectorLoggerRingBufferCapacity() {
        let logger = FeatureVectorLogger.shared
        logger._reset()
        // Overfill beyond capacity (250)
        for i in 0..<300 {
            var m = GaitMetrics()
            m.averageWalkingSpeed = Double(i) * 0.01
            logger.log(from: m, risk: nil)
        }
        XCTAssertEqual(logger._count(), 250, "Ring buffer should cap at 250 entries")
    }
}
