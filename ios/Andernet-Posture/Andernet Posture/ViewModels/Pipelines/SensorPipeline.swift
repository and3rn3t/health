//
//  SensorPipeline.swift
//  Andernet Posture
//
//  Sub-coordinator extracted from CaptureViewModel.
//  Handles IMU step detection, trunk motion, balance sway,
//  fatigue tracking, and pedometer integration.
//

import Foundation
import simd

/// Groups sensor-derived analysis into a single coordinator.
@MainActor
final class SensorPipeline {

    // MARK: - Dependencies

    private let motionService: any MotionService
    private let pedometerService: any PedometerService
    private let imuStepDetector: any IMUStepDetector
    private let trunkMotionAnalyzer: any TrunkMotionAnalyzer
    private let balanceAnalyzer: any BalanceAnalyzer
    private let fatigueAnalyzer: any FatigueAnalyzer
    private let cardioEstimator: any CardioEstimator

    // MARK: - State

    private(set) var imuCadenceSPM: Double = 0
    private(set) var imuStepCount: Int = 0
    private(set) var imuSwayRmsML: Double = 0
    private(set) var imuSwayRmsAP: Double = 0
    private(set) var pedometerDistanceM: Double = 0
    private(set) var pedometerStepCount: Int = 0
    private(set) var pedometerCadenceSPM: Double = 0
    private(set) var trunkRotationVelocityDPS: Double = 0
    private(set) var turnCount: Int = 0

    // ARKit-based balance
    private(set) var swayVelocityMMS: Double = 0
    private(set) var isStanding: Bool = false

    /// Callback when pedometer distance is updated.
    var onPedometerUpdate: (() -> Void)?

    // MARK: - Init

    init(
        motionService: any MotionService = CoreMotionService(),
        pedometerService: any PedometerService = CorePedometerService(),
        imuStepDetector: any IMUStepDetector = DefaultIMUStepDetector(),
        trunkMotionAnalyzer: any TrunkMotionAnalyzer = DefaultTrunkMotionAnalyzer(),
        balanceAnalyzer: any BalanceAnalyzer = DefaultBalanceAnalyzer(),
        fatigueAnalyzer: any FatigueAnalyzer = CoreMLFatigueAnalyzer(modelService: .shared),
        cardioEstimator: any CardioEstimator = DefaultCardioEstimator()
    ) {
        self.motionService = motionService
        self.pedometerService = pedometerService
        self.imuStepDetector = imuStepDetector
        self.trunkMotionAnalyzer = trunkMotionAnalyzer
        self.balanceAnalyzer = balanceAnalyzer
        self.fatigueAnalyzer = fatigueAnalyzer
        self.cardioEstimator = cardioEstimator
    }

    // MARK: - Lifecycle

    func startSensors() {
        motionService.start()
        pedometerService.startLiveUpdates()
    }

    func stopSensors() {
        motionService.stop()
        pedometerService.stop()
    }

    /// Wire up callbacks. Call once during setup.
    func setupCallbacks(
        onMotionFrame: @escaping (MotionFrame) -> Void
    ) {
        motionService.onMotionUpdate = { [weak self] frame in
            guard let self else { return }
            onMotionFrame(frame)
            self.processMotionFrame(frame)
        }

        pedometerService.onPedometerUpdate = { [weak self] snapshot in
            guard let self else { return }
            self.pedometerDistanceM = snapshot.distanceM ?? 0
            self.pedometerStepCount = snapshot.stepCount
            if let cadence = snapshot.currentCadenceSPM {
                self.pedometerCadenceSPM = cadence
            }
            self.onPedometerUpdate?()
        }
    }

    // MARK: - Motion Frame Processing

    private func processMotionFrame(_ frame: MotionFrame) {
        // IMU step detection
        if let imuStep = imuStepDetector.processSample(
            timestamp: frame.timestamp,
            userAccelerationY: frame.userAccelerationY,
            userAccelerationX: frame.userAccelerationX,
            userAccelerationZ: frame.userAccelerationZ
        ) {
            imuCadenceSPM = imuStep.instantCadenceSPM
            imuStepCount = imuStepDetector.stepCount
        }

        // Trunk motion
        trunkMotionAnalyzer.processFrame(frame)

        // IMU balance sway
        balanceAnalyzer.processIMUFrame(
            timestamp: frame.timestamp,
            userAccelerationX: frame.userAccelerationX,
            userAccelerationY: frame.userAccelerationY,
            userAccelerationZ: frame.userAccelerationZ
        )
        if let imuSway = balanceAnalyzer.imuSwayMetrics {
            imuSwayRmsML = imuSway.rmsAccelerationML
            imuSwayRmsAP = imuSway.rmsAccelerationAP
        }
    }

    // MARK: - ARKit Balance

    /// Process ARKit root position for sway analysis. Call throttled (every ~2 frames).
    func processARKitBalance(rootPosition: SIMD3<Float>, timestamp: TimeInterval) -> BalanceMetrics {
        let metrics = balanceAnalyzer.processFrame(rootPosition: rootPosition, timestamp: timestamp)
        swayVelocityMMS = metrics.swayVelocityMMS
        isStanding = balanceAnalyzer.isStanding
        return metrics
    }

    // MARK: - Fatigue Tracking

    func recordFatigueTimePoint(timestamp: TimeInterval, postureScore: Double,
                                 trunkLeanDeg: Double, lateralLeanDeg: Double,
                                 cadenceSPM: Double, walkingSpeedMPS: Double) {
        fatigueAnalyzer.recordTimePoint(
            timestamp: timestamp, postureScore: postureScore,
            trunkLeanDeg: trunkLeanDeg, lateralLeanDeg: lateralLeanDeg,
            cadenceSPM: cadenceSPM, walkingSpeedMPS: walkingSpeedMPS
        )
    }

    // MARK: - IMU Cross-Validation

    func validateARKitStep(at timestamp: TimeInterval) -> Double {
        imuStepDetector.validateARKitStep(at: timestamp)
    }

    // MARK: - Session Summary

    var latestPedometerSnapshot: PedometerSnapshot? {
        pedometerService.latestSnapshot
    }

    var currentIMUSwayMetrics: IMUSwayMetrics? {
        balanceAnalyzer.imuSwayMetrics
    }

    func trunkMotionAnalysis() -> TrunkMotionMetrics {
        trunkMotionAnalyzer.analyze()
    }

    func fatigueAssessment() -> FatigueAssessment {
        fatigueAnalyzer.assess()
    }

    func cardioEstimate(walkingSpeedMPS: Double, cadenceSPM: Double, strideLengthM: Double) -> CardioEstimate {
        cardioEstimator.estimate(
            walkingSpeedMPS: walkingSpeedMPS,
            cadenceSPM: cadenceSPM,
            strideLengthM: strideLengthM
        )
    }

    // MARK: - Reset

    func reset() {
        imuStepDetector.reset()
        trunkMotionAnalyzer.reset()
        balanceAnalyzer.reset()
        fatigueAnalyzer.reset()
        imuCadenceSPM = 0
        imuStepCount = 0
        imuSwayRmsML = 0
        imuSwayRmsAP = 0
        pedometerDistanceM = 0
        pedometerStepCount = 0
        pedometerCadenceSPM = 0
        trunkRotationVelocityDPS = 0
        turnCount = 0
        swayVelocityMMS = 0
        isStanding = false
    }
}
