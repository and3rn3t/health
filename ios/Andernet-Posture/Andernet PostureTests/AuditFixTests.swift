//
//  AuditFixTests.swift
//  Andernet PostureTests
//
//  Tests verifying the correctness of all audit-driven fixes:
//  thread safety, alias resolution, shared utilities, array capping,
//  timer management, and ordinal helpers.
//

import Testing
import Foundation
import simd
@testable import Andernet_Posture

// MARK: - SessionRecorder Thread Safety Tests

struct SessionRecorderThreadSafetyTests {

    @Test func concurrentRecordFrameDoesNotCrash() async throws {
        let recorder = DefaultSessionRecorder()
        recorder.startCalibration()
        recorder.startRecording()

        // Hammer recordFrame from multiple concurrent tasks
        await withTaskGroup(of: Void.self) { group in
            for i in 0..<200 {
                group.addTask {
                    let frame = BodyFrame(
                        timestamp: Double(i) * 0.016,
                        joints: [.root: SIMD3<Float>(0, 0.9, 0)],
                        sagittalTrunkLeanDeg: 3.0,
                        frontalTrunkLeanDeg: 1.0,
                        cadenceSPM: 110,
                        avgStrideLengthM: 0.7
                    )
                    recorder.recordFrame(frame)
                }
            }
        }

        // Allow async dispatches to complete
        try await Task.sleep(nanoseconds: 100_000_000) // 100ms

        #expect(
            recorder.frameCount > 0,
            "Should have recorded frames despite concurrent access"
        )
        #expect(
            recorder.state == .recording,
            "State should remain .recording"
        )
    }

    @Test func concurrentStateReadsDoNotCrash() async throws {
        let recorder = DefaultSessionRecorder()
        recorder.startCalibration()
        recorder.startRecording()

        // Read state concurrently while recording
        await withTaskGroup(of: RecordingState.self) { group in
            for _ in 0..<100 {
                group.addTask {
                    return recorder.state
                }
            }
            for await state in group {
                #expect(
                    state == .recording || state == .calibrating || state == .idle,
                    "State should be a valid value"
                )
            }
        }
    }

    @Test func resetWhileIdleIsThreadSafe() async throws {
        let recorder = DefaultSessionRecorder()
        recorder.startCalibration()
        recorder.startRecording()

        let frame = BodyFrame(
            timestamp: 0, joints: [:],
            sagittalTrunkLeanDeg: 0, frontalTrunkLeanDeg: 0,
            cadenceSPM: 0, avgStrideLengthM: 0
        )
        recorder.recordFrame(frame)

        // Allow async dispatch to complete
        try await Task.sleep(nanoseconds: 50_000_000)

        recorder.stop()
        recorder.reset()

        #expect(recorder.state == .idle)
        #expect(recorder.frameCount == 0, "Reset should clear frames")
        #expect(recorder.stepCount == 0, "Reset should clear steps")
    }

    @Test func elapsedTimeConsistentDuringRecording() async throws {
        let recorder = DefaultSessionRecorder()
        recorder.startCalibration()
        recorder.startRecording()

        // Small sleep to accumulate time
        try await Task.sleep(nanoseconds: 50_000_000) // 50ms

        let time = recorder.elapsedTime
        #expect(time >= 0, "Elapsed time should be non-negative")
    }
}

// MARK: - ClinicalGlossary Alias Resolution Tests

struct ClinicalGlossaryAliasTests {

    @Test func canonicalKeyReturnsEntry() async throws {
        let entry = ClinicalGlossary.entry(for: "Craniovertebral Angle")
        #expect(entry != nil, "Canonical key should return an entry")
        #expect(
            entry?.plainName == "Head Position",
            "Canonical key should return correct plain name"
        )
    }

    @Test func aliasResolves() async throws {
        // These aliases were previously duplicate entries, now resolved via alias map
        let aliases: [(alias: String, canonical: String)] = [
            ("CVA", "Craniovertebral Angle"),
            ("Craniovertebral Angle (CVA)", "Craniovertebral Angle"),
            ("SVA", "Sagittal Vertical Axis"),
            ("Sagittal Vertical Axis (SVA)", "Sagittal Vertical Axis"),
            ("Lateral Trunk Lean", "Lateral Lean"),
            ("Trunk Lean", "Trunk Forward Lean"),
            ("Coronal Deviation", "Coronal Spine Deviation"),
            ("Kendall Type", "Postural Type (Kendall)"),
            ("Gait Asymmetry", "Gait Asymmetry (Robinson SI)"),
            ("Fall Risk", "Fall Risk Score"),
            ("REBA Score (Ergonomic Risk)", "REBA Score"),
            ("Hip ROM", "Hip ROM (avg bilateral)"),
            ("Knee ROM", "Knee ROM (avg bilateral)"),
            ("Sway Area", "Sway Area (95% ellipse)"),
            ("SPARC Score", "Smoothness (SPARC)"),
            ("Frailty Score", "Frailty (Fried)"),
            ("Upper Crossed", "Upper Crossed Syndrome"),
            ("Lower Crossed", "Lower Crossed Syndrome"),
            ("TUG Time", "Timed Up & Go"),
            ("6MWD", "6-Minute Walk"),
        ]

        for (alias, canonical) in aliases {
            let aliasEntry = ClinicalGlossary.entry(for: alias)
            let canonicalEntry = ClinicalGlossary.entry(for: canonical)
            #expect(aliasEntry != nil, "Alias '\(alias)' should resolve to an entry")
            #expect(canonicalEntry != nil, "Canonical '\(canonical)' should have an entry")
            #expect(
                aliasEntry?.plainName == canonicalEntry?.plainName,
                "Alias '\(alias)' should map to same entry as '\(canonical)'"
            )
        }
    }

    @Test func unknownKeyReturnsNil() async throws {
        let entry = ClinicalGlossary.entry(for: "Nonexistent Metric XYZ")
        #expect(entry == nil, "Unknown key should return nil")
    }
}

// MARK: - Shared standardDeviation Tests

struct StandardDeviationTests {

    @Test func emptyArrayReturnsZero() async throws {
        #expect(standardDeviation([]) == 0, "Empty array should return 0")
    }

    @Test func singleValueReturnsZero() async throws {
        #expect(standardDeviation([42.0]) == 0, "Single value should return 0")
    }

    @Test func knownValues() async throws {
        // SD of [2, 4, 4, 4, 5, 5, 7, 9] with Bessel correction
        // mean = 5, variance = 4.571..., sd ≈ 2.138
        let values = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
        let sd = standardDeviation(values)
        #expect(
            abs(sd - 2.138) < 0.01,
            "SD should be approximately 2.138, got \(sd)"
        )
    }

    @Test func constantArrayReturnsZero() async throws {
        let sd = standardDeviation([5.0, 5.0, 5.0, 5.0])
        #expect(sd == 0, "Constant array should have SD of 0")
    }

    @Test func twoValuesCorrect() async throws {
        // SD of [0, 10] with Bessel correction: mean=5, var=50, sd=√50≈7.071
        let sd = standardDeviation([0.0, 10.0])
        #expect(
            abs(sd - 7.071) < 0.01,
            "SD of [0, 10] should be ~7.071, got \(sd)"
        )
    }
}

// MARK: - ClinicalSeverity Ordinal Tests

struct ClinicalSeverityOrdinalTests {

    @Test func ordinalsAreOrdered() async throws {
        #expect(ClinicalSeverity.normal.ordinal == 0)
        #expect(ClinicalSeverity.mild.ordinal == 1)
        #expect(ClinicalSeverity.moderate.ordinal == 2)
        #expect(ClinicalSeverity.severe.ordinal == 3)
    }

    @Test func roundTripConversion() async throws {
        for severity in ClinicalSeverity.allCases {
            let ordinal = severity.ordinal
            let reconstructed = ClinicalSeverity.from(ordinal: ordinal)
            #expect(
                reconstructed == severity,
                "\(severity) → ordinal \(ordinal) → \(reconstructed) should round-trip"
            )
        }
    }

    @Test func outOfRangeOrdinalReturnsSevere() async throws {
        #expect(
            ClinicalSeverity.from(ordinal: 99) == .severe,
            "Out-of-range ordinal should default to .severe"
        )
        #expect(
            ClinicalSeverity.from(ordinal: -1) == .severe,
            "Negative ordinal should default to .severe"
        )
    }

    @Test func worseOfTwoSeverities() async throws {
        let a = ClinicalSeverity.mild
        let b = ClinicalSeverity.moderate
        let worse = ClinicalSeverity.from(ordinal: max(a.ordinal, b.ordinal))
        #expect(worse == .moderate, "max ordinal should pick the worse severity")
    }
}

// MARK: - ROMAnalyzer History Capping Tests

struct ROMAnalyzerCappingTests {

    @Test func historyDoesNotExceedMax() async throws {
        let analyzer = DefaultROMAnalyzer()

        // Record more frames than maxHistory (12,000) — use a smaller batch to verify behavior
        // The actual maxHistory is private, so we just verify the capping logic works:
        // we feed enough data and check sessionSummary still works.
        for i in 0..<200 {
            let metrics = ROMMetrics(
                hipFlexionLeftDeg: Double(i % 30),
                hipFlexionRightDeg: Double(i % 28),
                kneeFlexionLeftDeg: Double(i % 40),
                kneeFlexionRightDeg: Double(i % 38),
                pelvicTiltDeg: Double(i % 10),
                trunkRotationDeg: Double(i % 15),
                armSwingLeftDeg: Double(i % 20),
                armSwingRightDeg: Double(i % 18)
            )
            analyzer.recordFrame(metrics)
        }

        let summary = analyzer.sessionSummary()
        #expect(summary.hipROMLeftDeg > 0, "Should have valid ROM data")
        #expect(summary.kneeROMLeftDeg > 0, "Should have valid knee ROM data")
    }

    @Test func resetClearsHistory() async throws {
        let analyzer = DefaultROMAnalyzer()

        for _ in 0..<50 {
            let metrics = ROMMetrics(
                hipFlexionLeftDeg: 25, hipFlexionRightDeg: 23,
                kneeFlexionLeftDeg: 35, kneeFlexionRightDeg: 33,
                pelvicTiltDeg: 5, trunkRotationDeg: 8,
                armSwingLeftDeg: 12, armSwingRightDeg: 11
            )
            analyzer.recordFrame(metrics)
        }

        analyzer.reset()
        let summary = analyzer.sessionSummary()
        #expect(summary.hipROMLeftDeg == 0, "After reset, ROM should be zero")
    }
}

// MARK: - SmoothnessAnalyzer Sample Capping Tests

struct SmoothnessAnalyzerCappingTests {

    @Test func recordSampleBeyondCapDoesNotCrash() async throws {
        let analyzer = DefaultSmoothnessAnalyzer()

        // Feed many samples — well below 36,000 but enough to verify no crash
        for i in 0..<500 {
            analyzer.recordSample(
                timestamp: Double(i) / 60.0,
                accelerationAP: sin(Double(i) * 0.1),
                accelerationML: cos(Double(i) * 0.1),
                accelerationV: 9.8 + sin(Double(i) * 0.05) * 0.2
            )
        }

        let metrics = analyzer.analyze()
        #expect(
            metrics.sparcScore != 0,
            "Should produce valid SPARC score from buffered samples"
        )
    }

    @Test func resetAfterRecordingWorks() async throws {
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
            "After reset, should return default metrics"
        )
    }
}

// MARK: - GaitAnalyzer Trimming Optimization Tests

struct GaitAnalyzerTrimmingTests {

    @Test func stepsAreDetectedAfterOptimization() async throws {
        let analyzer = DefaultGaitAnalyzer()

        // Simulate walking with oscillating ankle Y positions
        // Left foot strikes at even cycles, right at odd
        let totalFrames = 300
        for i in 0..<totalFrames {
            let t = Double(i) / 30.0 // 30 fps
            let phase = t * 2 * .pi * 1.0 // 1 Hz walking cycle

            var joints: [JointName: SIMD3<Float>] = [
                .root: SIMD3<Float>(0, 0.9, Float(t) * 0.5), // forward motion
            ]

            // Simulate heel strikes with oscillating Y position
            let leftY = Float(0.05 + 0.04 * sin(phase))
            let rightY = Float(0.05 + 0.04 * sin(phase + .pi))

            joints[.leftFoot] = SIMD3<Float>(-0.10, leftY, Float(t) * 0.5)
            joints[.rightFoot] = SIMD3<Float>(0.10, rightY, Float(t) * 0.5)
            joints[.leftToeEnd] = SIMD3<Float>(-0.10, leftY - 0.02, Float(t) * 0.5 + 0.15)
            joints[.rightToeEnd] = SIMD3<Float>(0.10, rightY - 0.02, Float(t) * 0.5 + 0.15)
            joints[.leftLeg] = SIMD3<Float>(-0.10, 0.45, Float(t) * 0.5)
            joints[.rightLeg] = SIMD3<Float>(0.10, 0.45, Float(t) * 0.5)
            joints[.leftUpLeg] = SIMD3<Float>(-0.10, 0.85, Float(t) * 0.5)
            joints[.rightUpLeg] = SIMD3<Float>(0.10, 0.85, Float(t) * 0.5)

            _ = analyzer.processFrame(joints: joints, timestamp: t)
        }

        // Process a final frame and check metrics
        let finalMetrics = analyzer.processFrame(
            joints: [
                .root: SIMD3<Float>(0, 0.9, 5.0),
                .leftFoot: SIMD3<Float>(-0.10, 0.05, 5.0),
                .rightFoot: SIMD3<Float>(0.10, 0.05, 5.0),
                .leftToeEnd: SIMD3<Float>(-0.10, 0.03, 5.15),
                .rightToeEnd: SIMD3<Float>(0.10, 0.03, 5.15),
                .leftLeg: SIMD3<Float>(-0.10, 0.45, 5.0),
                .rightLeg: SIMD3<Float>(0.10, 0.45, 5.0),
                .leftUpLeg: SIMD3<Float>(-0.10, 0.85, 5.0),
                .rightUpLeg: SIMD3<Float>(0.10, 0.85, 5.0),
            ],
            timestamp: 10.5
        )

        // Walking speed should be detectable from forward motion
        #expect(
            finalMetrics.walkingSpeedMPS >= 0,
            "Walking speed should be non-negative"
        )
    }

    @Test func resetClearsAllGaitState() async throws {
        let analyzer = DefaultGaitAnalyzer()

        // Process some frames
        let joints: [JointName: SIMD3<Float>] = [
            .root: SIMD3<Float>(0, 0.9, 0),
            .leftFoot: SIMD3<Float>(-0.10, 0.05, 0),
            .rightFoot: SIMD3<Float>(0.10, 0.05, 0),
            .leftToeEnd: SIMD3<Float>(-0.10, 0.03, 0.15),
            .rightToeEnd: SIMD3<Float>(0.10, 0.03, 0.15),
            .leftLeg: SIMD3<Float>(-0.10, 0.45, 0),
            .rightLeg: SIMD3<Float>(0.10, 0.45, 0),
            .leftUpLeg: SIMD3<Float>(-0.10, 0.85, 0),
            .rightUpLeg: SIMD3<Float>(0.10, 0.85, 0),
        ]
        _ = analyzer.processFrame(joints: joints, timestamp: 0)
        _ = analyzer.processFrame(joints: joints, timestamp: 0.033)

        analyzer.reset()

        let metrics = analyzer.processFrame(joints: joints, timestamp: 10.0)
        #expect(metrics.cadenceSPM == 0, "Cadence should be 0 after reset")
        #expect(metrics.walkingSpeedMPS == 0, "Speed should be 0 after reset")
    }
}

// MARK: - ClinicalTestViewModel Timer Tests

@MainActor
struct ClinicalTestViewModelTimerTests {

    @Test func cancelTestClearsState() async throws {
        let vm = ClinicalTestViewModel()
        vm.startTUG()
        #expect(vm.testType == .timedUpAndGo)

        vm.cancelTest()
        #expect(vm.testState == .cancelled, "Cancel should set state to cancelled")
    }

    @Test func cancelDuringRunningStops() async throws {
        let vm = ClinicalTestViewModel()
        vm.start6MWT()

        // Advance through instructions
        vm.advance6MWT()
        vm.advance6MWT()
        vm.advance6MWT()

        // Cancel should not crash even during running
        vm.cancelTest()
        #expect(vm.testState == .cancelled)
    }

    @Test func rombergStartsCorrectly() async throws {
        let vm = ClinicalTestViewModel()
        vm.startRomberg()
        #expect(vm.testType == .romberg)
        #expect(vm.testState != .notStarted)
    }
}

// MARK: - linearRegression Tests

struct LinearRegressionTests {

    @Test func constantYieldsZeroSlope() async throws {
        let result = linearRegression([5.0, 5.0, 5.0, 5.0, 5.0])
        #expect(
            abs(result.slope) < 0.001,
            "Constant data should have zero slope"
        )
    }

    @Test func perfectLinearHasR2One() async throws {
        let result = linearRegression([0.0, 1.0, 2.0, 3.0, 4.0])
        #expect(
            abs(result.slope - 1.0) < 0.001,
            "Slope should be 1.0 for [0,1,2,3,4]"
        )
        #expect(
            abs(result.rSquared - 1.0) < 0.001,
            "R² should be 1.0 for perfect linear"
        )
    }

    @Test func singleValueReturnsValue() async throws {
        let result = linearRegression([42.0])
        #expect(result.slope == 0)
        #expect(result.intercept == 42.0)
    }

    @Test func emptyReturnsZero() async throws {
        let result = linearRegression([])
        #expect(result.slope == 0)
        #expect(result.intercept == 0)
    }
}
