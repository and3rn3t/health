//
//  SixMWTProtocol.swift
//  Andernet Posture
//
//  Dedicated 6-Minute Walk Test protocol that uses CMPedometer + CoreMotion
//  for distance accumulation, real-time metrics, and ATS-compliant protocol
//  execution. Works with or without ARKit body tracking.
//
//  ATS Guidelines Compliance (Am J Respir Crit Care Med, 2002):
//  - 6-minute timed walk on flat surface
//  - Rest stops allowed and recorded
//  - Lap counting for standard 30m course (optional)
//  - Pre/post vital signs (HR, SpO2 via HealthKit if available)
//  - Borg dyspnea scale (1-10, user-reported)
//
//  Data Sources (priority order):
//  1. CMPedometer distance (sensor-fused, most accurate for total distance)
//  2. ARKit root displacement (when body tracking active)
//  3. Step count × average stride length (fallback estimate)
//
//  References:
//  - ATS Statement: Am J Respir Crit Care Med 166:111-117, 2002
//  - Enright & Sherrill, Am J Respir Crit Care Med 158:1384, 1998
//  - Holland AE et al., Eur Respir J, 2014 (6MWT technical standards update)
//

import Foundation
import os.log

// MARK: - 6MWT Configuration

/// Configuration for 6MWT protocol execution.
struct SixMWTConfiguration: Sendable {
    /// Test duration in seconds. Standard = 360 (6 minutes).
    let durationSec: TimeInterval
    /// Lap distance in meters (0 = no lap counting). Standard = 30m.
    let lapDistanceM: Double
    /// Whether to use standard encouragement prompts per ATS.
    let enableEncouragement: Bool
    /// Whether to collect Borg scale at completion.
    let collectBorgScale: Bool

    static let standard = SixMWTConfiguration(
        durationSec: 360,
        lapDistanceM: 30,
        enableEncouragement: true,
        collectBorgScale: true
    )
}

// MARK: - 6MWT Phase

/// Current phase of the 6MWT protocol.
enum SixMWTPhase: Sendable, Equatable {
    case notStarted
    case countdown(seconds: Int)
    case walking
    case resting(restNumber: Int)
    case encouragement(message: String, minutesMark: Int)
    case completed
    case cancelled
}

// MARK: - 6MWT Rest Stop

/// A rest stop during the 6MWT.
struct RestStop: Codable, Sendable {
    let startTime: TimeInterval   // seconds since test start
    let duration: TimeInterval     // seconds rested
    let distanceAtStopM: Double   // distance when rest began
}

// MARK: - 6MWT Live Metrics

/// Real-time metrics during 6MWT execution.
struct SixMWTLiveMetrics: Sendable {
    /// Elapsed time since test start (excluding countdown).
    let elapsedTimeSec: TimeInterval
    /// Remaining time.
    let remainingTimeSec: TimeInterval
    /// Total distance walked (meters) — best available source.
    let distanceM: Double
    /// Distance source indicator.
    let distanceSource: DistanceSource
    /// Current walking speed (m/s).
    let currentSpeedMPS: Double
    /// Average speed over entire test (m/s).
    let averageSpeedMPS: Double
    /// Current cadence (steps/min).
    let cadenceSPM: Double
    /// Total step count.
    let stepCount: Int
    /// Current lap number (if lap-based course).
    let currentLap: Int
    /// Number of rest stops taken.
    let restStopCount: Int
    /// Total rest duration.
    let totalRestDurationSec: TimeInterval
    /// Projected total distance (based on current pace).
    let projectedTotalDistanceM: Double
    /// Whether the subject is currently resting.
    let isResting: Bool

    enum DistanceSource: String, Sendable {
        case pedometer      // CMPedometer sensor-fused distance
        case arkit          // ARKit root displacement
        case stepEstimate   // step count × stride length
    }
}

// MARK: - 6MWT Complete Result

/// Complete 6MWT result with all clinical data.
struct SixMWTCompleteResult: Codable, Sendable {
    /// Total distance walked (meters).
    let distanceM: Double
    /// Test duration (seconds) — should be ~360.
    let durationSec: TimeInterval
    /// Number of laps completed.
    let lapsCompleted: Int
    /// Rest stops during the test.
    let restStops: [RestStop]
    /// Total rest time (seconds).
    let totalRestTimeSec: TimeInterval
    /// Total step count.
    let totalSteps: Int
    /// Average walking speed (m/s).
    let averageSpeedMPS: Double
    /// Average cadence (steps/min).
    let averageCadenceSPM: Double
    /// Borg dyspnea scale (0-10, user-reported). Nil if not collected.
    let borgDyspneaScale: Int?
    /// Borg fatigue scale (0-10, user-reported). Nil if not collected.
    let borgFatigueScale: Int?
    /// Predicted distance (if demographics available).
    let predictedDistanceM: Double?
    /// Percent of predicted.
    let percentPredicted: Double?
    /// Functional classification.
    let classification: String
    /// MET estimate from walking speed.
    let estimatedMET: Double
    /// Distance split by minute (6 values for fatigue analysis).
    let distanceByMinuteM: [Double]
    /// Fatigue index: (minute 1 distance - minute 6 distance) / minute 1 distance × 100.
    let fatigueIndexPercent: Double?
    /// Floors ascended (from barometer).
    let floorsAscended: Int?
    /// Floors descended (from barometer).
    let floorsDescended: Int?
}

// MARK: - Protocol

/// Orchestrates the complete 6MWT protocol with sensor data integration.
protocol SixMWTProtocol: AnyObject {
    var phase: SixMWTPhase { get }
    var liveMetrics: SixMWTLiveMetrics? { get }
    var onPhaseChange: ((SixMWTPhase) -> Void)? { get set }
    var onMetricsUpdate: ((SixMWTLiveMetrics) -> Void)? { get set }
    var onEncouragement: ((String) -> Void)? { get set }

    func start(config: SixMWTConfiguration)
    func markRestStart()
    func markRestEnd()
    func cancel()
    func complete(borgDyspnea: Int?, borgFatigue: Int?,
                  age: Int?, heightM: Double?, weightKg: Double?, sexIsMale: Bool?) -> SixMWTCompleteResult
}

// MARK: - Default Implementation

final class DefaultSixMWTProtocol: SixMWTProtocol {

    // MARK: - Dependencies

    private let pedometerService: any PedometerService
    private let motionService: any MotionService
    private let cardioEstimator: any CardioEstimator
    private let imuStepDetector: any IMUStepDetector

    // MARK: - State

    private(set) var phase: SixMWTPhase = .notStarted
    private(set) var liveMetrics: SixMWTLiveMetrics?

    var onPhaseChange: ((SixMWTPhase) -> Void)?
    var onMetricsUpdate: ((SixMWTLiveMetrics) -> Void)?
    var onEncouragement: ((String) -> Void)?

    private var config = SixMWTConfiguration.standard
    private var testStartTime: Date?
    private var timer: Timer?

    // Distance tracking
    private var pedometerDistanceM: Double = 0
    private var pedometerStepCount: Int = 0
    private var imuStepCount: Int = 0

    // ARKit distance (accumulated from external updates)
    private var arkitDistanceM: Double = 0
    private var lastARKitPosition: (x: Float, z: Float)?

    // Speed tracking
    private var distanceAtLastSpeedCheck: Double = 0
    private var lastSpeedCheckTime: Date?
    private let speedCheckIntervalSec: TimeInterval = 2.0

    // Per-minute distance for fatigue analysis
    private var minuteDistances: [Double] = []
    private var distanceAtMinuteStart: Double = 0
    private var lastMinuteMark: Int = 0

    // Rest stops
    private var restStops: [RestStop] = []
    private var currentRestStartTime: TimeInterval?
    private var currentRestStartDistance: Double = 0
    private var isResting: Bool = false

    // Encouragement schedule (ATS standard: every minute)
    private var lastEncouragementMinute: Int = -1
    private let encouragementMessages = [
        1: "You're doing well. You have 5 minutes to go.",
        2: "Keep up the good work. You have 4 minutes to go.",
        3: "You're halfway done. You have 3 minutes to go.",
        4: "Keep up the good work. You have only 2 minutes to go.",
        5: "You're doing well. You have only 1 minute to go."
    ]

    // Cadence tracking
    private var cadenceValues: [Double] = []

    // MARK: - Init

    init(
        pedometerService: any PedometerService = CorePedometerService(),
        motionService: any MotionService = CoreMotionService(),
        cardioEstimator: any CardioEstimator = DefaultCardioEstimator(),
        imuStepDetector: any IMUStepDetector = DefaultIMUStepDetector()
    ) {
        self.pedometerService = pedometerService
        self.motionService = motionService
        self.cardioEstimator = cardioEstimator
        self.imuStepDetector = imuStepDetector
    }

    deinit {
        timer?.invalidate()
    }

    // MARK: - Start

    func start(config: SixMWTConfiguration = .standard) {
        self.config = config
        resetState()

        // Countdown
        var countdown = 3
        phase = .countdown(seconds: countdown)
        onPhaseChange?(.countdown(seconds: countdown))

        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] t in
            countdown -= 1
            if countdown <= 0 {
                t.invalidate()
                self?.beginWalking()
            } else {
                self?.phase = .countdown(seconds: countdown)
                self?.onPhaseChange?(.countdown(seconds: countdown))
            }
        }
    }

    private func beginWalking() {
        testStartTime = Date()
        lastSpeedCheckTime = Date()
        phase = .walking
        onPhaseChange?(.walking)

        // Start sensors
        setupPedometerCallbacks()
        pedometerService.startLiveUpdates()

        setupMotionCallbacks()
        motionService.start()

        // Start update timer (10 Hz for smooth UI updates)
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateMetrics()
        }

        AppLogger.clinicalTests.info("6MWT walking phase started")
    }

    // MARK: - Rest Stops

    func markRestStart() {
        guard phase == .walking else { return }
        let elapsed = elapsedTimeSec()
        isResting = true
        currentRestStartTime = elapsed
        currentRestStartDistance = bestDistanceM()
        AppLogger.clinicalTests.info("6MWT rest stop started at \(String(format: "%.1f", elapsed))s")
    }

    func markRestEnd() {
        guard isResting, let startTime = currentRestStartTime else { return }
        let elapsed = elapsedTimeSec()
        let rest = RestStop(
            startTime: startTime,
            duration: elapsed - startTime,
            distanceAtStopM: currentRestStartDistance
        )
        restStops.append(rest)
        isResting = false
        currentRestStartTime = nil
        AppLogger.clinicalTests.info("6MWT rest stop ended, duration: \(String(format: "%.1f", rest.duration))s")
    }

    // MARK: - ARKit Distance Updates

    /// Called by CaptureViewModel when ARKit body tracking is active.
    func updateARKitPosition(x: Float, z: Float) {
        if let last = lastARKitPosition {
            let dx = x - last.x
            let dz = z - last.z
            let dist = sqrt(dx * dx + dz * dz)
            if dist > 0.05 && dist < 2.0 {  // Filter noise and teleports
                arkitDistanceM += Double(dist)
            }
        }
        lastARKitPosition = (x, z)
    }

    // MARK: - Cancel / Complete

    func cancel() {
        timer?.invalidate()
        pedometerService.stop()
        motionService.stop()
        phase = .cancelled
        onPhaseChange?(.cancelled)
        AppLogger.clinicalTests.info("6MWT cancelled")
    }

    func complete(
        borgDyspnea: Int? = nil,
        borgFatigue: Int? = nil,
        age: Int? = nil,
        heightM: Double? = nil,
        weightKg: Double? = nil,
        sexIsMale: Bool? = nil
    ) -> SixMWTCompleteResult {
        timer?.invalidate()

        // End any active rest
        if isResting { markRestEnd() }

        // Stop sensors
        pedometerService.stop()
        motionService.stop()

        // Record final minute distance
        finalizeMinuteDistance()

        let totalDistance = bestDistanceM()
        let duration = elapsedTimeSec()
        let totalSteps = bestStepCount()
        let avgSpeed = duration > 0 ? totalDistance / duration : 0
        let avgCadence = cadenceValues.isEmpty ? 0 : cadenceValues.reduce(0, +) / Double(cadenceValues.count)
        let totalRestTime = restStops.reduce(0.0) { $0 + $1.duration }

        // Predicted distance
        let sixMWTEval = cardioEstimator.evaluate6MWT(
            distanceM: totalDistance,
            age: age,
            heightM: heightM,
            weightKg: weightKg,
            sexIsMale: sexIsMale
        )

        // MET estimate
        let cardio = cardioEstimator.estimate(
            walkingSpeedMPS: avgSpeed,
            cadenceSPM: avgCadence,
            strideLengthM: totalSteps > 0 ? totalDistance / Double(totalSteps) * 2 : 0
        )

        // Fatigue index
        let fatigueIndex: Double?
        if minuteDistances.count >= 2, let first = minuteDistances.first, let last = minuteDistances.last, first > 0 {
            fatigueIndex = (first - last) / first * 100.0
        } else {
            fatigueIndex = nil
        }

        // Lap count
        let lapsCompleted = config.lapDistanceM > 0 ? Int(totalDistance / config.lapDistanceM) : 0

        // Floor data from pedometer
        let snapshot = pedometerService.latestSnapshot

        let result = SixMWTCompleteResult(
            distanceM: totalDistance,
            durationSec: duration,
            lapsCompleted: lapsCompleted,
            restStops: restStops,
            totalRestTimeSec: totalRestTime,
            totalSteps: totalSteps,
            averageSpeedMPS: avgSpeed,
            averageCadenceSPM: avgCadence,
            borgDyspneaScale: borgDyspnea,
            borgFatigueScale: borgFatigue,
            predictedDistanceM: sixMWTEval.predictedDistanceM,
            percentPredicted: sixMWTEval.percentPredicted,
            classification: sixMWTEval.classification,
            estimatedMET: cardio.estimatedMET,
            distanceByMinuteM: minuteDistances,
            fatigueIndexPercent: fatigueIndex,
            floorsAscended: snapshot?.floorsAscended,
            floorsDescended: snapshot?.floorsDescended
        )

        phase = .completed
        onPhaseChange?(.completed)

        let restStopCount = restStops.count
        AppLogger.clinicalTests.info(
            "6MWT completed: \(String(format: "%.1f", totalDistance))m in \(String(format: "%.0f", duration))s, \(totalSteps) steps, \(restStopCount) rest stops"
        )

        return result
    }

    // MARK: - Private

    private func resetState() {
        timer?.invalidate()
        testStartTime = nil
        lastSpeedCheckTime = nil
        pedometerDistanceM = 0
        pedometerStepCount = 0
        imuStepCount = 0
        arkitDistanceM = 0
        lastARKitPosition = nil
        distanceAtLastSpeedCheck = 0
        minuteDistances = []
        distanceAtMinuteStart = 0
        lastMinuteMark = 0
        restStops = []
        currentRestStartTime = nil
        isResting = false
        lastEncouragementMinute = -1
        cadenceValues = []
        imuStepDetector.reset()
        liveMetrics = nil
    }

    private func setupPedometerCallbacks() {
        pedometerService.onPedometerUpdate = { [weak self] snapshot in
            self?.pedometerDistanceM = snapshot.distanceM ?? 0
            self?.pedometerStepCount = snapshot.stepCount
            if let cadence = snapshot.currentCadenceSPM {
                self?.cadenceValues.append(cadence)
            }
        }
    }

    private func setupMotionCallbacks() {
        motionService.onMotionUpdate = { [weak self] frame in
            // Feed IMU step detector for step-based distance fallback
            _ = self?.imuStepDetector.processSample(
                timestamp: frame.timestamp,
                userAccelerationY: frame.userAccelerationY,
                userAccelerationX: frame.userAccelerationX,
                userAccelerationZ: frame.userAccelerationZ
            )
            self?.imuStepCount = self?.imuStepDetector.stepCount ?? 0
        }
    }

    private func elapsedTimeSec() -> TimeInterval {
        guard let start = testStartTime else { return 0 }
        return Date().timeIntervalSince(start)
    }

    /// Best available distance measurement.
    private func bestDistanceM() -> Double {
        // Priority: CMPedometer > ARKit > step estimate
        if pedometerDistanceM > 0 {
            return pedometerDistanceM
        } else if arkitDistanceM > 0 {
            return arkitDistanceM
        } else {
            // Estimate from step count × typical stride length (0.65m)
            return Double(bestStepCount()) * 0.65
        }
    }

    private func bestStepCount() -> Int {
        // CMPedometer steps are most reliable
        return pedometerStepCount > 0 ? pedometerStepCount : imuStepCount
    }

    private func bestDistanceSource() -> SixMWTLiveMetrics.DistanceSource {
        if pedometerDistanceM > 0 { return .pedometer }
        if arkitDistanceM > 0 { return .arkit }
        return .stepEstimate
    }

    private func updateMetrics() {
        let elapsed = elapsedTimeSec()
        let remaining = max(0, config.durationSec - elapsed)

        // Auto-complete check
        if elapsed >= config.durationSec && phase == .walking {
            _ = complete()
            return
        }

        // Per-minute distance tracking
        let currentMinute = Int(elapsed / 60.0) + 1
        if currentMinute > lastMinuteMark && lastMinuteMark < 6 {
            if lastMinuteMark > 0 {
                let minuteDistance = bestDistanceM() - distanceAtMinuteStart
                minuteDistances.append(minuteDistance)
            }
            distanceAtMinuteStart = bestDistanceM()
            lastMinuteMark = currentMinute
        }

        // Current speed
        let now = Date()
        var currentSpeed = 0.0
        if let lastCheck = lastSpeedCheckTime,
           now.timeIntervalSince(lastCheck) >= speedCheckIntervalSec {
            let dt = now.timeIntervalSince(lastCheck)
            let dd = bestDistanceM() - distanceAtLastSpeedCheck
            currentSpeed = dd / dt
            distanceAtLastSpeedCheck = bestDistanceM()
            lastSpeedCheckTime = now
        }

        let totalDistance = bestDistanceM()
        let avgSpeed = elapsed > 0 ? totalDistance / elapsed : 0
        let projectedDistance = elapsed > 10 ? avgSpeed * config.durationSec : 0

        let cadence: Double
        if let snapshot = pedometerService.latestSnapshot, let c = snapshot.currentCadenceSPM {
            cadence = c
        } else {
            cadence = imuStepDetector.currentCadenceSPM
        }

        let lapCount = config.lapDistanceM > 0 ? Int(totalDistance / config.lapDistanceM) : 0
        let totalRestDuration = restStops.reduce(0.0) { $0 + $1.duration }
            + (isResting ? (elapsed - (currentRestStartTime ?? elapsed)) : 0)

        let metrics = SixMWTLiveMetrics(
            elapsedTimeSec: elapsed,
            remainingTimeSec: remaining,
            distanceM: totalDistance,
            distanceSource: bestDistanceSource(),
            currentSpeedMPS: currentSpeed,
            averageSpeedMPS: avgSpeed,
            cadenceSPM: cadence,
            stepCount: bestStepCount(),
            currentLap: lapCount,
            restStopCount: restStops.count,
            totalRestDurationSec: totalRestDuration,
            projectedTotalDistanceM: projectedDistance,
            isResting: isResting
        )

        liveMetrics = metrics
        onMetricsUpdate?(metrics)

        // Encouragement prompts (ATS: at each minute mark)
        if config.enableEncouragement {
            let minuteMark = Int(elapsed / 60.0)
            if minuteMark > lastEncouragementMinute, let message = encouragementMessages[minuteMark] {
                lastEncouragementMinute = minuteMark
                phase = .encouragement(message: message, minutesMark: minuteMark)
                onPhaseChange?(phase)
                onEncouragement?(message)
                // Return to walking phase after brief display
                Task { [weak self] in
                    try? await Task.sleep(for: .seconds(2.0))
                    guard let self, self.phase != .completed && self.phase != .cancelled else { return }
                    self.phase = .walking
                    self.onPhaseChange?(.walking)
                }
            }
        }
    }

    private func finalizeMinuteDistance() {
        // Record the last partial minute
        let lastDistance = bestDistanceM() - distanceAtMinuteStart
        if lastDistance > 0 {
            minuteDistances.append(lastDistance)
        }
        // Pad to 6 entries if test ended early
        while minuteDistances.count < 6 {
            minuteDistances.append(0)
        }
    }
}
