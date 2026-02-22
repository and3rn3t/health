//
//  SensorOnlyCaptureViewModel.swift
//  Andernet Posture
//
//  Sensor-only capture mode using CMPedometer + CoreMotion (no ARKit).
//  Enables gait data collection on:
//  - Devices without ARKit body tracking
//  - Phone-in-pocket or waistband placement
//  - Background/minimal-UI scenarios (e.g., 6MWT in hallway)
//
//  Provides: step count, cadence, distance, walking speed, smoothness,
//  trunk motion, IMU sway, and fatigue tracking — all from sensors alone.
//

import Foundation
import Observation
import os.log
import SwiftData

/// Drives sensor-only gait capture without ARKit body tracking.
@Observable
@MainActor
final class SensorOnlyCaptureViewModel {

    // MARK: - Dependencies

    private let motionService: any MotionService
    private let pedometerService: any PedometerService
    private let imuStepDetector: any IMUStepDetector
    private let smoothnessAnalyzer: any SmoothnessAnalyzer
    private let trunkMotionAnalyzer: any TrunkMotionAnalyzer
    private let balanceAnalyzer: any BalanceAnalyzer
    private let cardioEstimator: any CardioEstimator
    private let healthKitService: any HealthKitService

    // MARK: - State

    var recordingState: RecordingState = .idle
    var elapsedTime: TimeInterval = 0
    var errorMessage: String?

    // Live metrics
    var stepCount: Int = 0
    var cadenceSPM: Double = 0
    var distanceM: Double = 0
    var walkingSpeedMPS: Double = 0
    var estimatedMET: Double = 0

    // IMU sway
    var imuSwayRmsML: Double = 0
    var imuSwayRmsAP: Double = 0

    // Smoothness
    var sparcScore: Double = 0

    // Trunk motion
    var trunkRotationRangeDeg: Double = 0
    var turnCount: Int = 0

    // Pedometer
    var pedometerDistanceM: Double = 0
    var pedometerStepCount: Int = 0
    var floorsAscended: Int = 0
    var floorsDescended: Int = 0

    // MARK: - Private

    private var timer: Timer?
    private var startDate: Date?
    private var motionFrames: [MotionFrame] = []
    private let maxMotionFrames = 36_000  // ~10 min at 60 Hz

    // Speed tracking
    private var lastSpeedCheckTime: Date?
    private var lastSpeedCheckDistance: Double = 0
    private let speedCheckInterval: TimeInterval = 3.0

    // MARK: - Init

    init(
        motionService: any MotionService = CoreMotionService(),
        pedometerService: any PedometerService = CorePedometerService(),
        imuStepDetector: any IMUStepDetector = DefaultIMUStepDetector(),
        smoothnessAnalyzer: any SmoothnessAnalyzer = DefaultSmoothnessAnalyzer(),
        trunkMotionAnalyzer: any TrunkMotionAnalyzer = DefaultTrunkMotionAnalyzer(),
        balanceAnalyzer: any BalanceAnalyzer = DefaultBalanceAnalyzer(),
        cardioEstimator: any CardioEstimator = DefaultCardioEstimator(),
        healthKitService: any HealthKitService = DefaultHealthKitService()
    ) {
        self.motionService = motionService
        self.pedometerService = pedometerService
        self.imuStepDetector = imuStepDetector
        self.smoothnessAnalyzer = smoothnessAnalyzer
        self.trunkMotionAnalyzer = trunkMotionAnalyzer
        self.balanceAnalyzer = balanceAnalyzer
        self.cardioEstimator = cardioEstimator
        self.healthKitService = healthKitService

        setupCallbacks()
    }

    // MARK: - Lifecycle

    func startCapture() {
        guard motionService.isAvailable else {
            errorMessage = "Device motion sensors are not available."
            return
        }

        resetState()
        recordingState = .recording
        startDate = Date()

        motionService.start()
        pedometerService.startLiveUpdates()
        startTimer()

        AppLogger.motion.info("Sensor-only capture started")
    }

    func togglePause() {
        switch recordingState {
        case .recording:
            recordingState = .paused
            motionService.stop()
            pedometerService.stop()
            timer?.invalidate()
        case .paused:
            recordingState = .recording
            motionService.start()
            pedometerService.startLiveUpdates()
            startTimer()
        default:
            break
        }
    }

    func stopCapture() {
        motionService.stop()
        pedometerService.stop()
        timer?.invalidate()
        recordingState = .finished
        AppLogger.motion.info("Sensor-only capture stopped — \(self.stepCount) steps, \(String(format: "%.1f", self.distanceM))m")
    }

    /// Save the sensor-only session to SwiftData.
    @MainActor
    func saveSession(context: ModelContext) -> GaitSession? {
        let duration = elapsedTime

        let session = GaitSession(
            date: .now,
            duration: duration,
            averageCadenceSPM: cadenceSPM > 0 ? cadenceSPM : nil,
            totalSteps: stepCount,
            motionFramesData: GaitSession.encode(motionFrames)
        )

        // Distance
        session.totalDistanceM = distanceM
        session.pedometerDistanceM = pedometerDistanceM > 0 ? pedometerDistanceM : nil
        session.pedometerStepCount = pedometerStepCount > 0 ? pedometerStepCount : nil

        // Walking speed from distance / time
        session.averageWalkingSpeedMPS = duration > 10 ? distanceM / duration : nil

        // Stride length estimate
        if stepCount > 0 {
            session.averageStrideLengthM = distanceM / Double(stepCount) * 2.0
        }

        // Floors
        session.floorsAscended = floorsAscended > 0 ? floorsAscended : nil
        session.floorsDescended = floorsDescended > 0 ? floorsDescended : nil

        // IMU metrics
        session.imuCadenceSPM = cadenceSPM > 0 ? cadenceSPM : nil
        session.imuStepCount = imuStepDetector.stepCount > 0 ? imuStepDetector.stepCount : nil

        // IMU sway
        if let imuSway = balanceAnalyzer.imuSwayMetrics {
            session.imuSwayRmsML = imuSway.rmsAccelerationML
            session.imuSwayRmsAP = imuSway.rmsAccelerationAP
            session.imuSwayJerkRMS = imuSway.jerkRMS
            session.dominantSwayFrequencyHz = imuSway.dominantSwayFrequencyHz
        }

        // Smoothness
        let smoothness = smoothnessAnalyzer.analyze()
        session.sparcScore = smoothness.sparcScore
        session.harmonicRatio = smoothness.harmonicRatioAP

        // Trunk motion
        let trunkMotion = trunkMotionAnalyzer.analyze()
        session.trunkPeakRotationVelocityDPS = trunkMotion.peakRotationVelocityDPS
        session.trunkAvgRotationRangeDeg = trunkMotion.averageRotationRangeDeg
        session.turnCount = trunkMotion.turnCount
        session.trunkRotationAsymmetryPercent = trunkMotion.rotationAsymmetryPercent
        session.trunkLateralFlexionAvgDeg = trunkMotion.averageLateralFlexionDeg
        session.movementRegularityIndex = trunkMotion.movementRegularityIndex

        // Cardio
        let speed = session.averageWalkingSpeedMPS ?? 0
        let cardio = cardioEstimator.estimate(
            walkingSpeedMPS: speed,
            cadenceSPM: cadenceSPM,
            strideLengthM: session.averageStrideLengthM ?? 0
        )
        session.estimatedMET = cardio.estimatedMET
        session.walkRatio = cardio.walkRatio

        context.insert(session)
        do {
            try context.save()
        } catch {
            AppLogger.persistence.error("Failed to save sensor-only session: \(error.localizedDescription)")
            self.errorMessage = String(localized: "Your session could not be saved. Please try again.")
        }

        // HealthKit
        if UserDefaults.standard.bool(forKey: "healthKitSync") {
            let hkService = healthKitService
            let steps = stepCount
            let walkSpeed = session.averageWalkingSpeedMPS
            let stride = session.averageStrideLengthM
            let dist = distanceM > 0 ? distanceM : nil
            let start = session.date.addingTimeInterval(-session.duration)
            let end = session.date
            Task {
                do {
                    try await hkService.saveSession(
                        steps: steps,
                        walkingSpeed: walkSpeed,
                        strideLength: stride,
                        asymmetry: nil,
                        distance: dist,
                        start: start,
                        end: end
                    )
                } catch {
                    AppLogger.healthKit.error("HealthKit sensor-only save failed: \(error.localizedDescription)")
                }
            }
        }

        resetState()
        return session
    }

    // MARK: - Private

    private func setupCallbacks() {
        motionService.onMotionUpdate = { [weak self] frame in
            guard let self, self.recordingState == .recording else { return }

            // Store motion frame
            self.motionFrames.append(frame)
            if self.motionFrames.count > self.maxMotionFrames {
                // Decimate older half
                let half = self.motionFrames.count / 2
                var decimated: [MotionFrame] = []
                for i in stride(from: 0, to: half, by: 2) {
                    decimated.append(self.motionFrames[i])
                }
                decimated.append(contentsOf: self.motionFrames[half...])
                self.motionFrames = decimated
            }

            // Smoothness
            self.smoothnessAnalyzer.recordSample(
                timestamp: frame.timestamp,
                accelerationAP: frame.userAccelerationZ,
                accelerationML: frame.userAccelerationX,
                accelerationV: frame.userAccelerationY
            )

            // IMU step detection
            if let step = self.imuStepDetector.processSample(
                timestamp: frame.timestamp,
                userAccelerationY: frame.userAccelerationY,
                userAccelerationX: frame.userAccelerationX,
                userAccelerationZ: frame.userAccelerationZ
            ) {
                self.cadenceSPM = step.instantCadenceSPM
                self.stepCount = self.imuStepDetector.stepCount
            }

            // Trunk motion
            self.trunkMotionAnalyzer.processFrame(frame)

            // IMU balance sway
            self.balanceAnalyzer.processIMUFrame(
                timestamp: frame.timestamp,
                userAccelerationX: frame.userAccelerationX,
                userAccelerationY: frame.userAccelerationY,
                userAccelerationZ: frame.userAccelerationZ
            )
            if let sway = self.balanceAnalyzer.imuSwayMetrics {
                self.imuSwayRmsML = sway.rmsAccelerationML
                self.imuSwayRmsAP = sway.rmsAccelerationAP
            }
        }

        pedometerService.onPedometerUpdate = { [weak self] snapshot in
            guard let self else { return }
            self.pedometerDistanceM = snapshot.distanceM ?? 0
            self.pedometerStepCount = snapshot.stepCount

            // Use pedometer distance when available; fall back to step estimate
            if self.pedometerDistanceM > 0 {
                self.distanceM = self.pedometerDistanceM
            } else {
                self.distanceM = Double(self.stepCount) * 0.65  // ~average stride
            }

            // Use pedometer cadence if available
            if let cadence = snapshot.currentCadenceSPM, cadence > 0 {
                self.cadenceSPM = cadence
            }

            // Floors
            self.floorsAscended = snapshot.floorsAscended ?? 0
            self.floorsDescended = snapshot.floorsDescended ?? 0
        }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self, let start = self.startDate else { return }
            self.elapsedTime = Date().timeIntervalSince(start)

            // Update walking speed periodically
            let now = Date()
            if let lastCheck = self.lastSpeedCheckTime,
               now.timeIntervalSince(lastCheck) >= self.speedCheckInterval {
                let dt = now.timeIntervalSince(lastCheck)
                let dd = self.distanceM - self.lastSpeedCheckDistance
                self.walkingSpeedMPS = max(0, dd / dt)
                self.lastSpeedCheckDistance = self.distanceM
                self.lastSpeedCheckTime = now

                // MET estimate from speed
                let cardio = self.cardioEstimator.estimate(
                    walkingSpeedMPS: self.walkingSpeedMPS,
                    cadenceSPM: self.cadenceSPM,
                    strideLengthM: self.stepCount > 0 ? self.distanceM / Double(self.stepCount) * 2 : 0
                )
                self.estimatedMET = cardio.estimatedMET
            } else if self.lastSpeedCheckTime == nil {
                self.lastSpeedCheckTime = now
                self.lastSpeedCheckDistance = self.distanceM
            }
        }
    }

    private func resetState() {
        recordingState = .idle
        elapsedTime = 0
        stepCount = 0
        cadenceSPM = 0
        distanceM = 0
        walkingSpeedMPS = 0
        estimatedMET = 0
        imuSwayRmsML = 0
        imuSwayRmsAP = 0
        sparcScore = 0
        trunkRotationRangeDeg = 0
        turnCount = 0
        pedometerDistanceM = 0
        pedometerStepCount = 0
        floorsAscended = 0
        floorsDescended = 0
        startDate = nil
        lastSpeedCheckTime = nil
        lastSpeedCheckDistance = 0
        motionFrames.removeAll()

        imuStepDetector.reset()
        smoothnessAnalyzer.reset()
        trunkMotionAnalyzer.reset()
        balanceAnalyzer.reset()
    }
}
