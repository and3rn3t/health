//
//  AnalyzerTests.swift
//  Andernet PostureTests
//
//  Phase 11: Comprehensive unit tests for analyzer services.
//

import Testing
import simd
@testable import Andernet_Posture

// MARK: - Test Helpers

/// Builds an upright standing skeleton with anatomically reasonable positions.
private func uprightJoints() -> [JointName: SIMD3<Float>] {
    [
        .root:          SIMD3<Float>(0.00, 0.90, 0.00),
        .hips:          SIMD3<Float>(0.00, 0.92, 0.00),
        .spine1:        SIMD3<Float>(0.00, 1.00, 0.00),
        .spine7:        SIMD3<Float>(0.00, 1.35, 0.00),
        .neck1:         SIMD3<Float>(0.00, 1.42, 0.00),
        .head:          SIMD3<Float>(0.00, 1.55, 0.00),
        .leftShoulder:  SIMD3<Float>(-0.18, 1.38, 0.00),
        .leftArm:       SIMD3<Float>(-0.25, 1.10, 0.00),
        .leftForearm:   SIMD3<Float>(-0.25, 0.85, 0.00),
        .leftHand:      SIMD3<Float>(-0.25, 0.70, 0.00),
        .rightShoulder: SIMD3<Float>( 0.18, 1.38, 0.00),
        .rightArm:      SIMD3<Float>( 0.25, 1.10, 0.00),
        .rightForearm:  SIMD3<Float>( 0.25, 0.85, 0.00),
        .rightHand:     SIMD3<Float>( 0.25, 0.70, 0.00),
        .leftUpLeg:     SIMD3<Float>(-0.10, 0.85, 0.00),
        .leftLeg:       SIMD3<Float>(-0.10, 0.45, 0.00),
        .leftFoot:      SIMD3<Float>(-0.10, 0.05, 0.10),
        .leftToeEnd:    SIMD3<Float>(-0.10, 0.00, 0.20),
        .rightUpLeg:    SIMD3<Float>( 0.10, 0.85, 0.00),
        .rightLeg:      SIMD3<Float>( 0.10, 0.45, 0.00),
        .rightFoot:     SIMD3<Float>( 0.10, 0.05, 0.10),
        .rightToeEnd:   SIMD3<Float>( 0.10, 0.00, 0.20),
    ]
}

// MARK: - BalanceAnalyzer Tests

struct BalanceAnalyzerTests {

    @Test func stationaryPositionLowSway() async throws {
        let analyzer = DefaultBalanceAnalyzer()
        let pos = SIMD3<Float>(0, 0.9, 0)

        // Feed identical root position for 60 frames over 2 seconds
        var lastMetrics: BalanceMetrics?
        for i in 0..<60 {
            let t = Double(i) / 30.0
            lastMetrics = analyzer.processFrame(rootPosition: pos, timestamp: t)
        }

        #expect(lastMetrics != nil, "Should produce metrics")
        #expect(
            lastMetrics!.swayVelocityMMS < 5,
            "Stationary position should have near-zero sway velocity"
        )
    }

    @Test func movingPositionHighSway() async throws {
        let analyzer = DefaultBalanceAnalyzer()

        // Oscillate root position side-to-side (20mm ML amplitude)
        var lastMetrics: BalanceMetrics?
        for i in 0..<180 {
            let t = Double(i) / 30.0
            let xOffset = Float(sin(t * 2 * .pi) * 0.02)
            let pos = SIMD3<Float>(xOffset, 0.9, 0)
            lastMetrics = analyzer.processFrame(rootPosition: pos, timestamp: t)
        }

        #expect(lastMetrics != nil, "Should produce metrics")
        #expect(
            lastMetrics!.swayVelocityMMS > 1,
            "Oscillating position should show measurable sway velocity"
        )
    }

    @Test func rombergTestFlow() async throws {
        let analyzer = DefaultBalanceAnalyzer()
        let basePos = SIMD3<Float>(0, 0.9, 0)

        // Eyes open phase — low sway
        analyzer.startRombergEyesOpen()
        for i in 0..<150 {
            let t = Double(i) / 30.0
            let small = Float(sin(t * 3) * 0.002)
            let pos = SIMD3<Float>(small, 0.9, 0)
            _ = analyzer.processFrame(rootPosition: pos, timestamp: t)
        }

        // Eyes closed phase — higher sway
        analyzer.startRombergEyesClosed()
        for i in 150..<300 {
            let t = Double(i) / 30.0
            let larger = Float(sin(t * 3) * 0.008)
            let pos = SIMD3<Float>(larger, 0.9, 0)
            _ = analyzer.processFrame(rootPosition: pos, timestamp: t)
        }

        let result = analyzer.completeRomberg()
        #expect(result != nil, "Romberg result should not be nil")
        #expect(
            result!.ratio >= 1.0,
            "Eyes-closed sway should be >= eyes-open sway"
        )
    }

    @Test func resetClearsHistory() async throws {
        let analyzer = DefaultBalanceAnalyzer()
        let pos = SIMD3<Float>(0.02, 0.9, 0)

        // Accumulate some data
        for i in 0..<60 {
            _ = analyzer.processFrame(
                rootPosition: pos, timestamp: Double(i) / 30.0
            )
        }

        analyzer.reset()

        // After reset, first frame should give baseline metrics
        let m = analyzer.processFrame(rootPosition: pos, timestamp: 100.0)
        #expect(
            m.swayVelocityMMS == 0 || m.swayAreaCm2 == 0,
            "After reset, initial metrics should be zero or near-zero"
        )
    }
}

// MARK: - ROMAnalyzer Tests

struct ROMAnalyzerTests {

    @Test func neutralStandingMinimalROM() async throws {
        let analyzer = DefaultROMAnalyzer()
        let joints = uprightJoints()
        let metrics = analyzer.analyze(joints: joints)

        // Standing upright → low hip and knee flexion
        #expect(
            metrics.hipFlexionLeftDeg < 20,
            "Upright stance should have minimal hip flexion"
        )
        #expect(
            metrics.kneeFlexionLeftDeg < 20,
            "Upright stance should have minimal knee flexion"
        )
    }

    @Test func hipFlexionDetected() async throws {
        let analyzer = DefaultROMAnalyzer()
        var joints = uprightJoints()

        // Move left knee forward to simulate hip flexion (~45°)
        joints[.leftLeg] = SIMD3<Float>(-0.10, 0.55, 0.35)
        joints[.leftFoot] = SIMD3<Float>(-0.10, 0.10, 0.40)

        let metrics = analyzer.analyze(joints: joints)
        #expect(
            metrics.hipFlexionLeftDeg > metrics.hipFlexionRightDeg,
            "Left hip with forward knee should show greater flexion"
        )
    }

    @Test func sessionSummaryAfterRecording() async throws {
        let analyzer = DefaultROMAnalyzer()
        let joints = uprightJoints()

        // Record multiple frames with varying positions
        for i in 0..<10 {
            var modified = joints
            let offset = Float(i) * 0.03
            modified[.leftLeg] = SIMD3<Float>(-0.10, 0.45, offset)
            let metrics = analyzer.analyze(joints: modified)
            analyzer.recordFrame(metrics)
        }

        let summary = analyzer.sessionSummary()
        #expect(
            summary.hipROMLeftDeg >= 0,
            "Hip ROM should be non-negative"
        )
        #expect(
            summary.kneeROMLeftDeg >= 0,
            "Knee ROM should be non-negative"
        )
    }

    @Test func resetClearsAccumulatedData() async throws {
        let analyzer = DefaultROMAnalyzer()
        let metrics = analyzer.analyze(joints: uprightJoints())
        analyzer.recordFrame(metrics)
        analyzer.recordFrame(metrics)

        analyzer.reset()

        let summary = analyzer.sessionSummary()
        #expect(
            summary.hipROMLeftDeg == 0 && summary.hipROMRightDeg == 0,
            "After reset, ROM summary should be zero"
        )
    }
}

// MARK: - ErgonomicScorer Tests

struct ErgonomicScorerTests {

    @Test func uprightPostureLowREBA() async throws {
        let scorer = DefaultErgonomicScorer()
        let result = scorer.computeREBA(joints: uprightJoints())

        #expect(
            result.score <= 8,
            "Good posture should produce moderate or lower REBA score, got \(result.score)"
        )
        #expect(
            result.riskLevel == .negligible || result.riskLevel == .low || result.riskLevel == .medium,
            "Good posture should be at most medium risk"
        )
    }

    @Test func poorPostureHighREBA() async throws {
        let scorer = DefaultErgonomicScorer()
        var joints = uprightJoints()

        // Severely flexed trunk (leaning forward ~45°)
        joints[.spine7] = SIMD3<Float>(0.00, 1.15, 0.35)
        joints[.neck1] = SIMD3<Float>(0.00, 1.20, 0.40)
        joints[.head] = SIMD3<Float>(0.00, 1.25, 0.50)
        // Arms raised high
        joints[.leftArm] = SIMD3<Float>(-0.25, 1.50, 0.10)
        joints[.rightArm] = SIMD3<Float>( 0.25, 1.50, 0.10)

        let result = scorer.computeREBA(joints: joints)
        #expect(
            result.score > 3,
            "Poor posture should produce elevated REBA score"
        )
    }

    @Test func scoreRange() async throws {
        let scorer = DefaultErgonomicScorer()

        // Test with minimal joints — should still produce valid range
        let result = scorer.computeREBA(joints: uprightJoints())
        #expect(result.score >= 1, "REBA score minimum is 1")
        #expect(result.score <= 15, "REBA score maximum is 15")
    }
}

// MARK: - FatigueAnalyzer Tests

struct FatigueAnalyzerTests {

    @Test func noDataReturnsFatigueZero() async throws {
        let analyzer = DefaultFatigueAnalyzer()
        let result = analyzer.assess()

        #expect(
            result.fatigueIndex == 0,
            "No data should produce zero fatigue index"
        )
        #expect(!result.isFatigued, "Should not be fatigued with no data")
    }

    @Test func stableSessionLowFatigue() async throws {
        let analyzer = DefaultFatigueAnalyzer()

        // Feed stable metrics over 2 minutes (sampled every 2s = 60 points)
        for i in 0..<60 {
            analyzer.recordTimePoint(
                timestamp: Double(i) * 2.0,
                postureScore: 85,
                trunkLeanDeg: 5.0,
                lateralLeanDeg: 2.0,
                cadenceSPM: 110,
                walkingSpeedMPS: 1.2
            )
        }

        let result = analyzer.assess()
        #expect(
            result.fatigueIndex < 30,
            "Stable metrics should produce low fatigue index, got \(result.fatigueIndex)"
        )
    }

    @Test func degradingSessionHighFatigue() async throws {
        let analyzer = DefaultFatigueAnalyzer()

        // Feed deteriorating metrics: posture worsens, speed drops
        for i in 0..<60 {
            let t = Double(i) * 2.0
            let progress = Double(i) / 59.0 // 0 → 1
            analyzer.recordTimePoint(
                timestamp: t,
                postureScore: 90 - progress * 40,     // 90 → 50
                trunkLeanDeg: 3 + progress * 15,       // 3 → 18
                lateralLeanDeg: 1 + progress * 8,      // 1 → 9
                cadenceSPM: 115 - progress * 30,        // 115 → 85
                walkingSpeedMPS: 1.3 - progress * 0.5  // 1.3 → 0.8
            )
        }

        let result = analyzer.assess()
        #expect(
            result.fatigueIndex > 20,
            "Degrading metrics should show elevated fatigue"
        )
        #expect(
            result.postureTrendSlope < 0,
            "Posture trend should be declining"
        )
    }

    @Test func resetClearsState() async throws {
        let analyzer = DefaultFatigueAnalyzer()
        for i in 0..<30 {
            analyzer.recordTimePoint(
                timestamp: Double(i) * 2.0,
                postureScore: 80, trunkLeanDeg: 5,
                lateralLeanDeg: 2, cadenceSPM: 110,
                walkingSpeedMPS: 1.2
            )
        }

        analyzer.reset()
        let result = analyzer.assess()
        #expect(
            result.fatigueIndex == 0,
            "After reset, fatigue index should be zero"
        )
    }
}

// MARK: - SmoothnessAnalyzer Tests

struct SmoothnessAnalyzerTests {

    @Test func insufficientSamplesReturnsDefaults() async throws {
        let analyzer = DefaultSmoothnessAnalyzer()

        // Record only 50 samples (below 128 minimum)
        for i in 0..<50 {
            analyzer.recordSample(
                timestamp: Double(i) / 60.0,
                accelerationAP: 0.1,
                accelerationML: 0.05,
                accelerationV: 9.8
            )
        }

        let metrics = analyzer.analyze()
        #expect(
            metrics.sparcScore == 0,
            "Insufficient samples should return default SPARC of 0"
        )
        #expect(
            metrics.harmonicRatioAP == 0,
            "Insufficient samples should return default harmonic ratio"
        )
    }

    @Test func sinusoidalInputProducesMetrics() async throws {
        let analyzer = DefaultSmoothnessAnalyzer()

        // Generate 200 samples at 60 Hz with sinusoidal acceleration
        for i in 0..<200 {
            let t = Double(i) / 60.0
            let ap = sin(t * 2 * .pi * 2.0) * 0.5    // 2 Hz AP
            let ml = sin(t * 2 * .pi * 1.0) * 0.2     // 1 Hz ML
            let v = 9.8 + sin(t * 2 * .pi * 2.0) * 0.3 // vertical

            analyzer.recordSample(
                timestamp: t,
                accelerationAP: ap,
                accelerationML: ml,
                accelerationV: v
            )
        }

        let metrics = analyzer.analyze()
        // SPARC for smooth sinusoidal motion should be non-zero
        #expect(
            metrics.sparcScore != 0,
            "Sinusoidal input should produce non-zero SPARC score"
        )
    }

    @Test func resetClearsAccumulatedSamples() async throws {
        let analyzer = DefaultSmoothnessAnalyzer()
        for i in 0..<200 {
            analyzer.recordSample(
                timestamp: Double(i) / 60.0,
                accelerationAP: 0.5, accelerationML: 0.2,
                accelerationV: 9.8
            )
        }

        analyzer.reset()
        let metrics = analyzer.analyze()
        #expect(
            metrics.sparcScore == 0,
            "After reset, SPARC should be 0 (insufficient samples)"
        )
    }
}
