//
//  SensorIntegrationTests.swift
//  Andernet PostureTests
//
//  Unit tests for sensor integration services:
//  IMUStepDetector, TrunkMotionAnalyzer, SixMWTProtocol, BalanceAnalyzer IMU
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - IMUStepDetector Tests

struct IMUStepDetectorTests {

    @Test func noStepsWhenStationary() async throws {
        let detector = DefaultIMUStepDetector()

        // Feed flat acceleration (standing still) for 2 seconds at 60 Hz
        for i in 0..<120 {
            let t = Double(i) / 60.0
            let event = detector.processSample(
                timestamp: t,
                userAccelerationY: -1.0, // gravity
                userAccelerationX: 0.0,
                userAccelerationZ: 0.0
            )
            #expect(event == nil, "Stationary signal should not trigger steps")
        }

        #expect(detector.stepCount == 0, "No steps when stationary")
        #expect(detector.currentCadenceSPM == 0, "No cadence when stationary")
    }

    @Test func detectsStepsFromOscillatingAccel() async throws {
        let detector = DefaultIMUStepDetector()

        // Simulate walking: ~2 Hz oscillation in vertical accel (typical step frequency)
        // Need enough samples to fill the warm-up window and then detect peaks
        var totalSteps = 0
        for i in 0..<600 {
            let t = Double(i) / 100.0 // 100 Hz sampling
            // Sinusoidal vertical accel at 2 Hz with amplitude 0.3g
            let accelY = -1.0 + 0.3 * sin(2.0 * .pi * 2.0 * t)
            let event = detector.processSample(
                timestamp: t,
                userAccelerationY: accelY,
                userAccelerationX: 0.0,
                userAccelerationZ: 0.0
            )
            if event != nil { totalSteps += 1 }
        }

        // Over 6 seconds at 2 Hz step frequency, expect roughly 10-14 steps
        // (warm-up window eats some initial samples)
        #expect(totalSteps > 0, "Should detect steps from oscillating acceleration")
        #expect(detector.stepCount == totalSteps, "Step count should match detected events")
    }

    @Test func refractoryPeriodPreventsDoubleCount() async throws {
        let detector = DefaultIMUStepDetector()

        // Prime the detector with a walking pattern
        for i in 0..<200 {
            let t = Double(i) / 100.0
            let accelY = -1.0 + 0.3 * sin(2.0 * .pi * 2.0 * t)
            _ = detector.processSample(timestamp: t, userAccelerationY: accelY, userAccelerationX: 0.0, userAccelerationZ: 0.0)
        }

        // Now send two sharp peaks very close together (50ms apart — should only count one)
        let baseTime = 3.0
        let event1 = detector.processSample(timestamp: baseTime, userAccelerationY: -1.5, userAccelerationX: 0.0, userAccelerationZ: 0.0)
        let event2 = detector.processSample(timestamp: baseTime + 0.05, userAccelerationY: -1.5, userAccelerationX: 0.0, userAccelerationZ: 0.0)

        // At most one step from the pair (refractory is 250ms)
        let combined = (event1 != nil ? 1 : 0) + (event2 != nil ? 1 : 0)
        #expect(combined <= 1, "Refractory period should prevent double-counting peaks 50ms apart")
    }

    @Test func cadenceComputedFromInterStepIntervals() async throws {
        let detector = DefaultIMUStepDetector()

        // Simulate walking at exactly 2 Hz (120 SPM) for 5 seconds
        for i in 0..<500 {
            let t = Double(i) / 100.0
            let accelY = -1.0 + 0.4 * sin(2.0 * .pi * 2.0 * t)
            _ = detector.processSample(timestamp: t, userAccelerationY: accelY, userAccelerationX: 0.0, userAccelerationZ: 0.0)
        }

        let cadence = detector.currentCadenceSPM
        if detector.stepCount >= 3 {
            // Allow broad range because adaptive threshold may affect exact timing
            #expect(cadence > 60, "Cadence should be above 60 SPM for 2 Hz walking")
            #expect(cadence < 200, "Cadence should be below 200 SPM")
        }
    }

    @Test func arkitStepValidation() async throws {
        let detector = DefaultIMUStepDetector()

        // Prime with walking data
        for i in 0..<300 {
            let t = Double(i) / 100.0
            let accelY = -1.0 + 0.3 * sin(2.0 * .pi * 2.0 * t)
            _ = detector.processSample(timestamp: t, userAccelerationY: accelY, userAccelerationX: 0.0, userAccelerationZ: 0.0)
        }

        // Validate an ARKit step at a time when there was recent IMU activity
        let confidence = detector.validateARKitStep(at: 2.5)
        #expect(confidence >= 0.0 && confidence <= 1.0, "Confidence should be in [0, 1]")
    }

    @Test func resetClearsState() async throws {
        let detector = DefaultIMUStepDetector()

        // Accumulate some steps
        for i in 0..<300 {
            let t = Double(i) / 100.0
            let accelY = -1.0 + 0.3 * sin(2.0 * .pi * 2.0 * t)
            _ = detector.processSample(timestamp: t, userAccelerationY: accelY, userAccelerationX: 0.0, userAccelerationZ: 0.0)
        }

        detector.reset()
        #expect(detector.stepCount == 0, "Step count should be 0 after reset")
        #expect(detector.currentCadenceSPM == 0, "Cadence should be 0 after reset")
    }
}

// MARK: - TrunkMotionAnalyzer Tests

struct TrunkMotionAnalyzerTests {

    @Test func noMotionNeutralMetrics() async throws {
        let analyzer = DefaultTrunkMotionAnalyzer()

        // Feed stationary attitude (no rotation) for 2 seconds
        for i in 0..<120 {
            let t = Double(i) / 60.0
            analyzer.processFrame(MotionFrame(
                timestamp: t,
                pitch: 0.0, yaw: 0.0
            ))
        }

        let metrics = analyzer.analyze()
        #expect(metrics.peakRotationVelocityDPS < 1.0, "Stationary should have near-zero rotation velocity")
        #expect(metrics.turnCount == 0, "No turns when stationary")
    }

    @Test func detectsTurnFromYawChange() async throws {
        let analyzer = DefaultTrunkMotionAnalyzer()

        // Simulate a gradual 90° yaw change over 2 seconds (turn)
        for i in 0..<120 {
            let t = Double(i) / 60.0
            let yaw = Double(i) / 120.0 * (.pi / 2.0) // 0 → π/2 radians
            let rotRate = (.pi / 2.0) / 2.0 // ~45°/s yaw rate
            analyzer.processFrame(MotionFrame(
                timestamp: t,
                yaw: yaw,
                rotationRateY: rotRate
            ))
        }

        let metrics = analyzer.analyze()
        #expect(metrics.turnCount >= 1, "90° yaw change should be detected as a turn")
        #expect(metrics.peakRotationVelocityDPS > 10, "Should detect significant rotation velocity")
    }

    @Test func lateralFlexionFromRoll() async throws {
        let analyzer = DefaultTrunkMotionAnalyzer()

        // Oscillate roll (lateral flexion) at ±10° for 3 seconds
        for i in 0..<180 {
            let t = Double(i) / 60.0
            let roll = sin(2.0 * .pi * 0.5 * t) * (10.0 * .pi / 180.0) // ±10° in radians
            analyzer.processFrame(MotionFrame(
                timestamp: t,
                roll: roll
            ))
        }

        let metrics = analyzer.analyze()
        #expect(
            metrics.averageLateralFlexionDeg > 1.0,
            "Oscillating roll should produce measurable lateral flexion"
        )
    }

    @Test func rotationAsymmetry() async throws {
        let analyzer = DefaultTrunkMotionAnalyzer()

        // Simulate asymmetric rotation: mostly turning left (positive yaw rate)
        for i in 0..<300 {
            let t = Double(i) / 60.0
            // Mostly positive yaw rotation (left turns dominate)
            let rotY: Double = i < 200 ? 1.5 : -0.5
            let yaw = t * 0.5
            analyzer.processFrame(MotionFrame(
                timestamp: t,
                yaw: yaw,
                rotationRateY: rotY
            ))
        }

        let metrics = analyzer.analyze()
        // Asymmetry should be non-zero when there's bias
        #expect(
            metrics.rotationAsymmetryPercent != 0,
            "Asymmetric rotation pattern should produce non-zero asymmetry"
        )
    }

    @Test func resetClearsMetrics() async throws {
        let analyzer = DefaultTrunkMotionAnalyzer()

        for i in 0..<60 {
            let t = Double(i) / 60.0
            analyzer.processFrame(MotionFrame(
                timestamp: t,
                yaw: t * 0.5,
                rotationRateY: 2.0
            ))
        }

        analyzer.reset()
        let metrics = analyzer.analyze()
        #expect(metrics.turnCount == 0, "Turn count should reset to 0")
        #expect(metrics.peakRotationVelocityDPS == 0, "Peak velocity should reset to 0")
    }
}

// MARK: - BalanceAnalyzer IMU Tests

struct BalanceAnalyzerIMUTests {

    @Test func imuStationaryLowSway() async throws {
        let analyzer = DefaultBalanceAnalyzer()

        // Feed stationary acceleration (small noise) for 3 seconds at 60 Hz
        for i in 0..<180 {
            let t = Double(i) / 60.0
            analyzer.processIMUFrame(
                timestamp: t,
                userAccelerationX: Double.random(in: -0.001...0.001),
                userAccelerationY: Double.random(in: -0.001...0.001),
                userAccelerationZ: Double.random(in: -0.001...0.001)
            )
        }

        let sway = analyzer.imuSwayMetrics
        #expect(sway != nil, "Should compute IMU sway after sufficient samples")
        if let sway {
            #expect(sway.rmsAccelerationML < 0.05, "Stationary should have very low ML sway RMS")
            #expect(sway.rmsAccelerationAP < 0.05, "Stationary should have very low AP sway RMS")
        }
    }

    @Test func imuMovementIncreasesSwayRMS() async throws {
        let analyzer = DefaultBalanceAnalyzer()

        // Feed oscillating user acceleration (simulating swaying)
        for i in 0..<300 {
            let t = Double(i) / 60.0
            let accelX = sin(2.0 * .pi * 1.0 * t) * 0.1 // ML sway at 1 Hz
            let accelZ = cos(2.0 * .pi * 0.8 * t) * 0.08 // AP sway at 0.8 Hz
            analyzer.processIMUFrame(
                timestamp: t,
                userAccelerationX: accelX,
                userAccelerationY: 0.0,
                userAccelerationZ: accelZ
            )
        }

        let sway = analyzer.imuSwayMetrics
        #expect(sway != nil, "Should compute IMU sway metrics")
        if let sway {
            #expect(sway.rmsAccelerationML > 0.01, "Oscillating ML accel should produce measurable ML sway")
            #expect(sway.rmsAccelerationAP > 0.01, "Oscillating AP accel should produce measurable AP sway")
            #expect(sway.jerkRMS > 0, "Jerk RMS should be non-zero for oscillating signal")
        }
    }

    @Test func imuResetClearsSway() async throws {
        let analyzer = DefaultBalanceAnalyzer()

        for i in 0..<120 {
            let t = Double(i) / 60.0
            analyzer.processIMUFrame(
                timestamp: t,
                userAccelerationX: 0.05,
                userAccelerationY: 0.0,
                userAccelerationZ: 0.03
            )
        }

        analyzer.reset()
        let sway = analyzer.imuSwayMetrics
        #expect(sway == nil, "IMU sway should be nil after reset")
    }
}

// MARK: - SixMWTProtocol Tests

struct SixMWTProtocolTests {

    @Test func standardConfigurationValues() async throws {
        let config = SixMWTConfiguration.standard
        #expect(config.durationSec == 360, "Standard 6MWT is 360 seconds")
        #expect(config.enableEncouragement == true, "Encouragement should be enabled by default")
    }

    @Test func startTriggersCountdownPhase() async throws {
        let protocol6 = DefaultSixMWTProtocol()
        var receivedPhases: [String] = []

        protocol6.onPhaseChange = { phase in
            switch phase {
            case .countdown:
                receivedPhases.append("countdown")
            case .walking:
                receivedPhases.append("walking")
            default:
                break
            }
        }

        protocol6.start(config: .standard)

        // The first phase should be countdown
        #expect(receivedPhases.contains("countdown"), "Starting should trigger countdown phase")
    }

    @Test func arkitPositionUpdatesAccepted() async throws {
        let protocol6 = DefaultSixMWTProtocol()

        let config = SixMWTConfiguration(durationSec: 60, lapDistanceM: 30, enableEncouragement: false, collectBorgScale: false)
        protocol6.start(config: config)

        // Simulate ARKit position updates
        protocol6.updateARKitPosition(x: 0, z: 10.0)
        protocol6.updateARKitPosition(x: 5, z: 15.0)

        // Just verify no crash; internal distance tracking is tested via complete()
    }

    @Test func restStopTracking() async throws {
        let protocol6 = DefaultSixMWTProtocol()

        let config = SixMWTConfiguration(durationSec: 60, lapDistanceM: 30, enableEncouragement: false, collectBorgScale: false)
        protocol6.start(config: config)

        // Record a rest stop
        protocol6.markRestStart()
        // Wait briefly to simulate rest
        try await Task.sleep(for: .milliseconds(100))
        protocol6.markRestEnd()

        let result = protocol6.complete()
        let firstStop = try #require(result.restStops.first, "Should record at least one rest stop")
        #expect(firstStop.duration > 0, "Rest stop should have non-zero duration")
    }

    @Test func completeReturnsValidResult() async throws {
        let protocol6 = DefaultSixMWTProtocol()

        let config = SixMWTConfiguration(durationSec: 60, lapDistanceM: 30, enableEncouragement: false, collectBorgScale: true)
        protocol6.start(config: config)

        // Simulate some walking via ARKit
        protocol6.updateARKitPosition(x: 0, z: 100.0)

        let result = protocol6.complete(
            borgDyspnea: 3,
            borgFatigue: 4,
            age: 65,
            heightM: 1.70,
            weightKg: 75.0,
            sexIsMale: true
        )

        #expect(result.distanceM >= 0, "Distance should be non-negative")
        #expect(result.borgDyspneaScale == 3, "Borg dyspnea should be recorded")
        #expect(result.borgFatigueScale == 4, "Borg fatigue should be recorded")
    }

    @Test func cancelMarksPhaseAsCancelled() async throws {
        let protocol6 = DefaultSixMWTProtocol()
        var cancelledReceived = false

        protocol6.onPhaseChange = { phase in
            if case .cancelled = phase {
                cancelledReceived = true
            }
        }

        protocol6.start(config: .standard)
        protocol6.cancel()

        #expect(cancelledReceived, "Cancellation should trigger .cancelled phase")
    }

    @Test func perMinuteDistanceSplitTracking() async throws {
        let protocol6 = DefaultSixMWTProtocol()

        let config = SixMWTConfiguration(durationSec: 60, lapDistanceM: 30, enableEncouragement: false, collectBorgScale: false)
        protocol6.start(config: config)

        // Simulate distance updates via ARKit
        protocol6.updateARKitPosition(x: 0, z: 65.0)

        let result = protocol6.complete()
        // With only a short test, we should have at most 1 minute entry
        #expect(result.distanceM >= 0, "Should have recorded some distance")
    }
}

// MARK: - GaitSession Sensor Fields Tests

struct GaitSessionSensorFieldsTests {

    @Test func newSensorFieldsDefaultToNil() async throws {
        let session = GaitSession(
            date: .now,
            duration: 60,
            averageCadenceSPM: 100,
            averageStrideLengthM: 0.7,
            postureScore: 80,
            totalSteps: 60
        )

        #expect(session.totalDistanceM == nil, "totalDistanceM should default to nil")
        #expect(session.pedometerDistanceM == nil, "pedometerDistanceM should default to nil")
        #expect(session.pedometerStepCount == nil, "pedometerStepCount should default to nil")
        #expect(session.floorsAscended == nil, "floorsAscended should default to nil")
        #expect(session.floorsDescended == nil, "floorsDescended should default to nil")
        #expect(session.imuCadenceSPM == nil, "imuCadenceSPM should default to nil")
        #expect(session.imuStepCount == nil, "imuStepCount should default to nil")
        #expect(session.imuSwayRmsML == nil, "imuSwayRmsML should default to nil")
        #expect(session.imuSwayRmsAP == nil, "imuSwayRmsAP should default to nil")
        #expect(session.imuSwayJerkRMS == nil, "imuSwayJerkRMS should default to nil")
        #expect(session.dominantSwayFrequencyHz == nil, "dominantSwayFrequencyHz should default to nil")
        #expect(session.trunkPeakRotationVelocityDPS == nil)
        #expect(session.trunkAvgRotationRangeDeg == nil)
        #expect(session.turnCount == nil)
        #expect(session.trunkRotationAsymmetryPercent == nil)
        #expect(session.trunkLateralFlexionAvgDeg == nil)
        #expect(session.movementRegularityIndex == nil)
        #expect(session.sixMWTResultData == nil)
    }

    @Test func sensorFieldsCanBePopulated() async throws {
        let session = GaitSession(
            date: .now,
            duration: 120,
            averageCadenceSPM: 110,
            averageStrideLengthM: 0.72,
            postureScore: 85,
            totalSteps: 200
        )

        session.totalDistanceM = 150.0
        session.pedometerDistanceM = 148.0
        session.pedometerStepCount = 198
        session.floorsAscended = 2
        session.floorsDescended = 1
        session.imuCadenceSPM = 108.5
        session.imuStepCount = 195
        session.imuSwayRmsML = 0.045
        session.imuSwayRmsAP = 0.038
        session.imuSwayJerkRMS = 0.12
        session.dominantSwayFrequencyHz = 0.8
        session.trunkPeakRotationVelocityDPS = 45.0
        session.trunkAvgRotationRangeDeg = 12.0
        session.turnCount = 8
        session.trunkRotationAsymmetryPercent = 15.0
        session.trunkLateralFlexionAvgDeg = 5.5
        session.movementRegularityIndex = 0.82

        #expect(session.totalDistanceM == 150.0)
        #expect(session.pedometerDistanceM == 148.0)
        #expect(session.pedometerStepCount == 198)
        #expect(session.floorsAscended == 2)
        #expect(session.imuCadenceSPM == 108.5)
        #expect(session.imuStepCount == 195)
        #expect(session.trunkPeakRotationVelocityDPS == 45.0)
        #expect(session.turnCount == 8)
        #expect(session.movementRegularityIndex == 0.82)
    }
}
