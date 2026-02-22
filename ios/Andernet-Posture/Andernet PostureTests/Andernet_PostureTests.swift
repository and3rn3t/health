//
//  Andernet_PostureTests.swift
//  Andernet PostureTests
//
//  Created by Matt on 2/8/26.
//

import Testing
import Foundation
import simd
@testable import Andernet_Posture

// MARK: - PostureAnalyzer Tests

struct PostureAnalyzerTests {

    let analyzer = DefaultPostureAnalyzer()

    @Test func perfectlyUprightPosture() async throws {
        // Hips at origin, neck directly above → 0° lean
        let joints: [JointName: SIMD3<Float>] = [
            .root: SIMD3<Float>(0, 0, 0),
            .hips: SIMD3<Float>(0, 0.02, 0),
            .neck1: SIMD3<Float>(0, 0.5, 0),
            .head: SIMD3<Float>(0, 0.7, 0),
            .spine7: SIMD3<Float>(0, 0.45, 0)
        ]
        let metrics = analyzer.analyze(joints: joints)
        #expect(metrics != nil)
        #expect(metrics!.trunkLeanDeg < 1.0, "Upright posture should have near-zero trunk lean")
        #expect(metrics!.frameScore > 60, "Upright posture should score reasonably high")
    }

    @Test func leaningForward15Degrees() async throws {
        // ~15° forward lean → poor posture threshold
        // Trunk lean is computed from hips→spine7 in sagittal (YZ) plane
        let rad = Float(15 * Double.pi / 180)
        let trunkLen: Float = 0.43
        let joints: [JointName: SIMD3<Float>] = [
            .root: SIMD3<Float>(0, 0.90, 0),
            .hips: SIMD3<Float>(0, 0.92, 0),
            .spine7: SIMD3<Float>(0, 0.92 + trunkLen * cos(rad), trunkLen * sin(rad)),
            .neck1: SIMD3<Float>(0, 0.92 + trunkLen * cos(rad) + 0.07, trunkLen * sin(rad) + 0.02),
            .head: SIMD3<Float>(0, 0.92 + trunkLen * cos(rad) + 0.20, trunkLen * sin(rad) + 0.03)
        ]
        let metrics = analyzer.analyze(joints: joints)
        #expect(metrics != nil)
        #expect(abs(metrics!.trunkLeanDeg - 15) < 3.0, "Should detect ~15° lean")
    }

    @Test func sessionScoreFromSeries() async throws {
        // Series of mostly-good leans
        let trunkLeans = [2.0, 3.0, 4.0, 2.5, 3.5, 5.0, 2.0]
        let lateralLeans = [1.0, 1.5, 0.5, 1.2, 0.8, 1.0, 0.7]
        let score = analyzer.computeSessionScore(trunkLeans: trunkLeans, lateralLeans: lateralLeans)
        #expect(score > 70, "Mostly upright session should score well")
        #expect(score <= 100, "Score should not exceed 100")
    }

    @Test func sessionScoreEmpty() async throws {
        let score = analyzer.computeSessionScore(trunkLeans: [], lateralLeans: [])
        #expect(score == 0, "Empty session should score 0")
    }

    @Test func missingJointsReturnsNil() async throws {
        let joints: [JointName: SIMD3<Float>] = [
            .leftHand: SIMD3<Float>(0, 0, 0)
        ]
        let metrics = analyzer.analyze(joints: joints)
        #expect(metrics == nil, "Should return nil without required joints")
    }
}

// MARK: - GaitAnalyzer Tests

struct GaitAnalyzerTests {

    @Test func resetClearsState() async throws {
        let analyzer = DefaultGaitAnalyzer()

        // Process a few frames
        let joints: [JointName: SIMD3<Float>] = [
            .leftFoot: SIMD3<Float>(0, 0.1, 0),
            .rightFoot: SIMD3<Float>(0.3, 0.1, 0),
            .root: SIMD3<Float>(0.15, 0.9, 0)
        ]
        _ = analyzer.processFrame(joints: joints, timestamp: 0)
        _ = analyzer.processFrame(joints: joints, timestamp: 0.033)

        analyzer.reset()

        // After reset, metrics should be zeroed
        let metrics = analyzer.processFrame(joints: joints, timestamp: 1.0)
        #expect(metrics.cadenceSPM == 0, "Cadence should be 0 after reset")
        #expect(metrics.avgStrideLengthM == 0, "Stride should be 0 after reset")
    }

    @Test func noFeetReturnsZeroMetrics() async throws {
        let analyzer = DefaultGaitAnalyzer()
        let joints: [JointName: SIMD3<Float>] = [
            .root: SIMD3<Float>(0, 0, 0)
        ]
        let metrics = analyzer.processFrame(joints: joints, timestamp: 0)
        #expect(metrics.cadenceSPM == 0)
        #expect(metrics.avgStrideLengthM == 0)
        #expect(metrics.stepDetected == nil)
    }
}

// MARK: - GaitSession Model Tests

struct GaitSessionModelTests {

    @Test func formattedDuration() async throws {
        let session = GaitSession(duration: 125) // 2:05
        #expect(session.formattedDuration == "2:05")
    }

    @Test func postureLabelMappings() async throws {
        let excellent = GaitSession(postureScore: 85)
        #expect(excellent.postureLabel == "Excellent")

        let good = GaitSession(postureScore: 70)
        #expect(good.postureLabel == "Good")

        let fair = GaitSession(postureScore: 50)
        #expect(fair.postureLabel == "Fair")

        let poor = GaitSession(postureScore: 30)
        #expect(poor.postureLabel == "Needs Improvement")

        let none = GaitSession()
        #expect(none.postureLabel == "N/A")
    }

    @Test func frameEncodeDecodeRoundTrip() async throws {
        let frames = [
            BodyFrame(
                timestamp: 0.0,
                joints: [.root: SIMD3<Float>(0, 0, 0), .neck1: SIMD3<Float>(0, 0.5, 0)],
                sagittalTrunkLeanDeg: 3.5,
                frontalTrunkLeanDeg: 1.2,
                cadenceSPM: 110,
                avgStrideLengthM: 0.7
            )
        ]

        let data = GaitSession.encode(frames)
        #expect(data != nil, "Encoding should succeed")

        let session = GaitSession(framesData: data)
        let decoded = session.decodedFrames
        #expect(decoded.count == 1)
        #expect(abs(decoded[0].sagittalTrunkLeanDeg - 3.5) < 0.01)
        #expect(abs(decoded[0].cadenceSPM - 110) < 0.01)
    }

    @Test func stepEventEncodeDecodeRoundTrip() async throws {
        let steps = [
            StepEvent(timestamp: 1.0, foot: .left, positionX: 0.5, positionZ: 0.3, strideLengthM: 0.65),
            StepEvent(timestamp: 1.5, foot: .right, positionX: 0.8, positionZ: 0.6, strideLengthM: 0.70)
        ]

        let data = GaitSession.encode(steps)
        #expect(data != nil)

        let session = GaitSession(stepEventsData: data)
        let decoded = session.decodedStepEvents
        #expect(decoded.count == 2)
        #expect(decoded[0].foot == .left)
        #expect(decoded[1].foot == .right)
        #expect(abs(decoded[0].strideLengthM! - 0.65) < 0.01)
    }
}

// MARK: - SessionRecorder Tests

struct SessionRecorderTests {

    @Test func stateTransitions() async throws {
        let recorder = DefaultSessionRecorder()
        #expect(recorder.state == .idle)

        recorder.startCalibration()
        #expect(recorder.state == .calibrating)

        recorder.startRecording()
        #expect(recorder.state == .recording)

        recorder.pause()
        #expect(recorder.state == .paused)

        recorder.resume()
        #expect(recorder.state == .recording)

        recorder.stop()
        #expect(recorder.state == .finished)

        recorder.reset()
        #expect(recorder.state == .idle)
    }

    @Test func onlyRecordsWhileRecording() async throws {
        let recorder = DefaultSessionRecorder()
        let frame = BodyFrame(
            timestamp: 0, joints: [:],
            sagittalTrunkLeanDeg: 0, frontalTrunkLeanDeg: 0,
            cadenceSPM: 0, avgStrideLengthM: 0
        )

        // Should not record in idle state
        recorder.recordFrame(frame)
        #expect(recorder.frameCount == 0)

        // Start recording
        recorder.startCalibration()
        recorder.startRecording()
        recorder.recordFrame(frame)
        #expect(recorder.frameCount == 1)

        // Pause — should not record
        recorder.pause()
        recorder.recordFrame(frame)
        #expect(recorder.frameCount == 1)
    }
}

// NOTE: DashboardViewModel tests consolidated into DashboardViewModelTests.swift

// MARK: - SessionDetailViewModel Tests

@MainActor
struct SessionDetailViewModelTests {

    @Test func emptySessionProducesNoSeries() async throws {
        let session = GaitSession(date: .now, duration: 0)
        let vm = SessionDetailViewModel(session: session)

        #expect(vm.trunkLeanSeries.isEmpty)
        #expect(vm.lateralLeanSeries.isEmpty)
        #expect(vm.cadenceSeries.isEmpty)
        #expect(vm.strideSeries.isEmpty)
        #expect(vm.leftFootStats == nil)
        #expect(vm.rightFootStats == nil)
        #expect(vm.symmetryRatio == nil)
    }

    @Test func summaryContainsDuration() async throws {
        let session = GaitSession(
            date: .now,
            duration: 90,
            averageCadenceSPM: 110,
            averageStrideLengthM: 0.72,
            averageTrunkLeanDeg: 5.0,
            postureScore: 85,
            totalSteps: 42
        )
        let vm = SessionDetailViewModel(session: session)

        let labels = vm.summaryItems.map(\.label)
        #expect(labels.contains("Duration"))
        #expect(labels.contains("Posture Score"))
        #expect(labels.contains("Avg Cadence"))
        #expect(labels.contains("Avg Stride"))
        #expect(labels.contains("Total Steps"))
    }

    @Test func timeSeriesDecimation() async throws {
        // Create frames at 30 Hz for 2 seconds (60 frames)
        let baseTime: TimeInterval = 1000
        let frames = (0..<60).map { i in
            BodyFrame(
                timestamp: baseTime + Double(i) / 30.0,
                joints: [:],
                sagittalTrunkLeanDeg: 3.0 + Double(i) * 0.05,
                frontalTrunkLeanDeg: 1.0,
                cadenceSPM: 110,
                avgStrideLengthM: 0.7
            )
        }
        let framesData = GaitSession.encode(frames)

        let session = GaitSession(
            date: .now,
            duration: 2.0,
            framesData: framesData
        )
        let vm = SessionDetailViewModel(session: session)

        // At 0.5s intervals over 2 seconds, expect ~4-5 points (not all 60)
        #expect(vm.trunkLeanSeries.count >= 3)
        #expect(vm.trunkLeanSeries.count <= 6)
    }

    @Test func footStatsAndSymmetry() async throws {
        let steps = [
            StepEvent(timestamp: 0.5, foot: .left, positionX: 0, positionZ: 0, strideLengthM: 0.70),
            StepEvent(timestamp: 1.0, foot: .right, positionX: 0.3, positionZ: 0.5, strideLengthM: 0.72),
            StepEvent(timestamp: 1.5, foot: .left, positionX: 0.6, positionZ: 1.0, strideLengthM: 0.68),
            StepEvent(timestamp: 2.0, foot: .right, positionX: 0.9, positionZ: 1.5, strideLengthM: 0.74),
        ]
        let stepData = GaitSession.encode(steps)

        // Need at least one frame to trigger decode
        let frames = [
            BodyFrame(
                timestamp: 0, joints: [:],
                sagittalTrunkLeanDeg: 3, frontalTrunkLeanDeg: 1,
                cadenceSPM: 110, avgStrideLengthM: 0.7
            )
        ]
        let framesData = GaitSession.encode(frames)

        let session = GaitSession(
            date: .now,
            duration: 2.0,
            framesData: framesData,
            stepEventsData: stepData
        )
        let vm = SessionDetailViewModel(session: session)

        #expect(vm.leftFootStats != nil)
        #expect(vm.rightFootStats != nil)
        #expect(vm.leftFootStats!.count == 2)
        #expect(vm.rightFootStats!.count == 2)

        // Symmetry: avg left = 0.69, avg right = 0.73 → ratio ≈ 0.945
        #expect(vm.symmetryRatio != nil)
        #expect(vm.symmetryRatio! > 0.9)
        #expect(vm.symmetryRatio! <= 1.0)
    }
}

// MARK: - Formatters Tests

struct FormattersTests {

    @Test func timeIntervalMMSS() async throws {
        let t: TimeInterval = 125
        #expect(t.mmss == "2:05")
    }

    @Test func timeIntervalLongForm() async throws {
        // DateComponentsFormatter.abbreviated — output is locale-dependent.
        // Verify the result contains the expected numeric components.
        let short: TimeInterval = 300
        #expect(short.longForm.contains("5"))

        let long: TimeInterval = 3900
        #expect(long.longForm.contains("1"))
        #expect(long.longForm.contains("5"))
    }

    @Test func doubleFormatters() async throws {
        let angle = 12.345
        #expect(angle.degreesString == "12.3°")

        let pct = 85.7
        #expect(pct.percentString == "86%")

        let dist = 0.723
        #expect(dist.metersString == "0.72 m")
    }
}

// MARK: - SIMDExtensions Tests

struct SIMDExtensionTests {

    @Test func xzDistance() async throws {
        let a = SIMD3<Float>(1, 5, 0)
        let b = SIMD3<Float>(4, 10, 4) // y is ignored
        let dist = a.xzDistance(to: b)
        #expect(abs(dist - 5.0) < 0.01) // sqrt(9 + 16) = 5
    }

    @Test func angleFromVertical() async throws {
        let up = SIMD3<Float>(0, 1, 0)
        #expect(up.angleFromVerticalDeg < 0.1)

        let tilted = SIMD3<Float>(0, 1, 0.268) // ~15° from vertical
        #expect(abs(tilted.angleFromVerticalDeg - 15.0) < 1.5)
    }
}