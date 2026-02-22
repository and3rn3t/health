//
//  GaitAnalyzer.swift
//  Andernet Posture
//
//  Medical-grade gait analysis using ARKit body tracking.
//  Implements time-based windowing, velocity-validated heel strike detection,
//  refractory periods, Robinson Symmetry Index, temporal gait parameters,
//  walking speed, step width, and step length.
//
//  Key references:
//  - Perry J & Burnfield JM, Gait Analysis, 2010
//  - Robinson RO et al., 1987 (symmetry index)
//  - Studenski S et al., JAMA, 2011 (walking speed)
//  - Winter DA, Biomechanics and Motor Control, 2009
//

import Foundation
import simd

/// Describes a detected foot strike during gait analysis.
struct FootStrike: Sendable {
    let foot: StepEvent.Foot
    let position: SIMD3<Float>
    let timestamp: TimeInterval
    let strideLengthM: Float?
    let stepLengthM: Float?
    let stepWidthCm: Float?
    let impactVelocity: Float?
    let footClearanceM: Float?
}

/// Results from a single frame of gait analysis.
struct GaitMetrics: Sendable {
    let cadenceSPM: Double
    let avgStrideLengthM: Double
    let stepDetected: FootStrike?
    let walkingSpeedMPS: Double
    let avgStepWidthCm: Double
    let symmetryPercent: Double?        // Robinson SI: 0 = perfect, >10% abnormal
    let stanceTimePercent: Double?      // % of gait cycle in stance
    let swingTimePercent: Double?       // % of gait cycle in swing
    let doubleSupportPercent: Double?   // % in double support
    let strideTimeCVPercent: Double?    // coefficient of variation of stride time
}

/// Protocol for gait analysis — step detection, cadence, stride length, temporal parameters.
protocol GaitAnalyzer: AnyObject {
    /// Process a new frame of joint data.
    func processFrame(joints: [JointName: SIMD3<Float>], timestamp: TimeInterval) -> GaitMetrics

    /// Reset state between sessions.
    func reset()
}

// MARK: - Default Implementation

/// Extracts gait metrics using ankle Y-position local minima with velocity validation,
/// time-based windowing, and refractory periods.
final class DefaultGaitAnalyzer: GaitAnalyzer {

    // MARK: Configuration

    /// Time-based window for local minimum detection (seconds). Frame-rate independent.
    private let windowDurationSec: TimeInterval = 0.25   // ~7-8 frames at 30fps

    /// Minimum time between consecutive strikes on the same foot (refractory period).
    /// Normal step time is ~0.5s; prevents double-detection.
    private let refractoryPeriodSec: TimeInterval = 0.3

    /// Plausible stride length range (meters). Ref: Perry & Burnfield, 2010.
    private let minStrideM: Float = 0.2
    private let maxStrideM: Float = 2.5

    /// Minimum downward velocity (m/s) to validate a heel strike.
    private let minStrikeVelocity: Float = 0.05

    // MARK: Sliding Window (time-based)

    private struct TimedSample {
        let position: SIMD3<Float>
        let timestamp: TimeInterval
    }

    private var leftAnkleSamples: [TimedSample] = []
    private var rightAnkleSamples: [TimedSample] = []

    // MARK: Last strike state

    private var lastLeftStrikeTime: TimeInterval = -1
    private var lastRightStrikeTime: TimeInterval = -1
    private var lastLeftStrikePos: SIMD3<Float>?
    private var lastRightStrikePos: SIMD3<Float>?

    // Contralateral tracking for step length / width
    private var lastLeftContactPos: SIMD3<Float>?
    private var lastRightContactPos: SIMD3<Float>?

    // MARK: Cadence tracking

    private var stepTimestamps: [TimeInterval] = []
    private let cadenceWindowSec: TimeInterval = 10.0

    // MARK: Stride / step tracking

    private var strideLengths: [Float] = []
    private var stepWidths: [Float] = []
    private let maxSamples = 50

    // MARK: Symmetry tracking (Robinson SI)

    private var leftStrideLengths: [Float] = []
    private var rightStrideLengths: [Float] = []
    private let maxSymmetrySamples = 20

    // MARK: Temporal parameters

    private var leftStrideIntervals: [Double] = []
    private var rightStrideIntervals: [Double] = []

    /// Rolling window of stride times for stance/swing/double support estimation
    private var leftStanceTimes: [Double] = []
    private var rightStanceTimes: [Double] = []

    // MARK: Toe-off detection for temporal parameters
    // Estimated from foot velocity: toe-off = foot Y-velocity crosses above threshold
    private var lastLeftToeOffTime: TimeInterval = -1
    private var lastRightToeOffTime: TimeInterval = -1

    // EMA (Exponential Moving Average) filtered ankle Y positions
    private var leftAnkleEMA: Float?
    private var rightAnkleEMA: Float?
    /// EMA smoothing factor (0–1). Lower = more smoothing. ~0.3 at 30fps ≈ light filter.
    private let emaAlpha: Float = 0.3

    // MARK: Walking speed

    private var recentPositions: [(pos: SIMD3<Float>, time: TimeInterval)] = []
    private let speedWindowSec: TimeInterval = 3.0

    // MARK: Per-cycle foot clearance

    private var leftMaxSwingY: Float = 0
    private var rightMaxSwingY: Float = 0

    // MARK: - Process Frame

    // swiftlint:disable:next function_body_length
    func processFrame(joints: [JointName: SIMD3<Float>], timestamp: TimeInterval) -> GaitMetrics {
        guard
            let leftFoot = joints[.leftFoot],
            let rightFoot = joints[.rightFoot],
            let root = joints[.root]
        else {
            return emptyMetrics()
        }

        // Apply EMA filtering to ankle Y positions to reduce ARKit skeleton jitter
        let filteredLeftY: Float
        let filteredRightY: Float
        if let prevLeft = leftAnkleEMA {
            filteredLeftY = emaAlpha * leftFoot.y + (1 - emaAlpha) * prevLeft
        } else {
            filteredLeftY = leftFoot.y
        }
        if let prevRight = rightAnkleEMA {
            filteredRightY = emaAlpha * rightFoot.y + (1 - emaAlpha) * prevRight
        } else {
            filteredRightY = rightFoot.y
        }
        leftAnkleEMA = filteredLeftY
        rightAnkleEMA = filteredRightY

        // Use filtered Y for time-stamped samples (preserving original XZ)
        let filteredLeftFoot = SIMD3<Float>(leftFoot.x, filteredLeftY, leftFoot.z)
        let filteredRightFoot = SIMD3<Float>(rightFoot.x, filteredRightY, rightFoot.z)

        // Append time-stamped samples with filtered Y
        leftAnkleSamples.append(TimedSample(position: filteredLeftFoot, timestamp: timestamp))
        rightAnkleSamples.append(TimedSample(position: filteredRightFoot, timestamp: timestamp))

        // Trim samples outside window duration (efficient: remove oldest until within window)
        while let first = leftAnkleSamples.first, timestamp - first.timestamp > windowDurationSec * 2 {
            leftAnkleSamples.removeFirst()
        }
        while let first = rightAnkleSamples.first, timestamp - first.timestamp > windowDurationSec * 2 {
            rightAnkleSamples.removeFirst()
        }

        // Track root position for walking speed
        recentPositions.append((pos: root, time: timestamp))
        while let first = recentPositions.first, timestamp - first.time > speedWindowSec {
            recentPositions.removeFirst()
        }

        // Track max foot height during swing for clearance (use filtered values)
        leftMaxSwingY = max(leftMaxSwingY, filteredLeftY)
        rightMaxSwingY = max(rightMaxSwingY, filteredRightY)

        // Estimate toe-off from foot velocity (upward velocity exceeds threshold)
        detectToeOff(samples: leftAnkleSamples, lastToeOffTime: &lastLeftToeOffTime, timestamp: timestamp)
        detectToeOff(samples: rightAnkleSamples, lastToeOffTime: &lastRightToeOffTime, timestamp: timestamp)

        // Detect steps
        var detectedStrike: FootStrike?

        if let strike = detectStrike(
            samples: leftAnkleSamples,
            foot: .left,
            lastStrikeTime: &lastLeftStrikeTime,
            lastStrikePos: &lastLeftStrikePos,
            contralateralLastPos: lastRightContactPos,
            footStrideLengths: &leftStrideLengths,
            strideIntervals: &leftStrideIntervals,
            maxSwingY: &leftMaxSwingY,
            timestamp: timestamp
        ) {
            detectedStrike = strike
            lastLeftContactPos = strike.position
            stepTimestamps.append(timestamp)
        }

        if let strike = detectStrike(
            samples: rightAnkleSamples,
            foot: .right,
            lastStrikeTime: &lastRightStrikeTime,
            lastStrikePos: &lastRightStrikePos,
            contralateralLastPos: lastLeftContactPos,
            footStrideLengths: &rightStrideLengths,
            strideIntervals: &rightStrideIntervals,
            maxSwingY: &rightMaxSwingY,
            timestamp: timestamp
        ) {
            if detectedStrike == nil { detectedStrike = strike }
            lastRightContactPos = strike.position
            stepTimestamps.append(timestamp)
        }

        // Record stride/step metrics
        if let strike = detectedStrike {
            if let sl = strike.strideLengthM {
                strideLengths.append(sl)
                if strideLengths.count > maxSamples { strideLengths.removeFirst() }
            }
            if let sw = strike.stepWidthCm {
                stepWidths.append(sw)
                if stepWidths.count > maxSamples { stepWidths.removeFirst() }
            }
        }

        // Cadence
        while let first = stepTimestamps.first, timestamp - first > cadenceWindowSec {
            stepTimestamps.removeFirst()
        }
        let cadence = computeCadence()

        // Average stride length
        let avgStride = strideLengths.isEmpty ? 0 : Double(strideLengths.reduce(0, +)) / Double(strideLengths.count)

        // Average step width
        let avgStepWidth = stepWidths.isEmpty ? 0 : Double(stepWidths.reduce(0, +)) / Double(stepWidths.count)

        // Walking speed
        let speed = computeWalkingSpeed()

        // Symmetry (Robinson SI)
        let symmetry = computeRobinsonSI()

        // Temporal parameters
        let temporal = computeTemporalParameters()

        // Stride time variability (CV)
        let strideCV = computeStrideTimeCV()

        return GaitMetrics(
            cadenceSPM: cadence,
            avgStrideLengthM: avgStride,
            stepDetected: detectedStrike,
            walkingSpeedMPS: speed,
            avgStepWidthCm: avgStepWidth,
            symmetryPercent: symmetry,
            stanceTimePercent: temporal.stance,
            swingTimePercent: temporal.swing,
            doubleSupportPercent: temporal.doubleSupport,
            strideTimeCVPercent: strideCV
        )
    }

    func reset() {
        leftAnkleSamples.removeAll()
        rightAnkleSamples.removeAll()
        stepTimestamps.removeAll()
        strideLengths.removeAll()
        stepWidths.removeAll()
        leftStrideLengths.removeAll()
        rightStrideLengths.removeAll()
        leftStrideIntervals.removeAll()
        rightStrideIntervals.removeAll()
        leftStanceTimes.removeAll()
        rightStanceTimes.removeAll()
        recentPositions.removeAll()
        lastLeftStrikeTime = -1
        lastRightStrikeTime = -1
        lastLeftStrikePos = nil
        lastRightStrikePos = nil
        lastLeftContactPos = nil
        lastRightContactPos = nil
        leftAnkleEMA = nil
        rightAnkleEMA = nil
        lastLeftToeOffTime = -1
        lastRightToeOffTime = -1
        leftMaxSwingY = 0
        rightMaxSwingY = 0
    }

    // MARK: - Private Helpers

    private func emptyMetrics() -> GaitMetrics {
        GaitMetrics(cadenceSPM: 0, avgStrideLengthM: 0, stepDetected: nil,
                    walkingSpeedMPS: 0, avgStepWidthCm: 0, symmetryPercent: nil,
                    stanceTimePercent: nil, swingTimePercent: nil,
                    doubleSupportPercent: nil, strideTimeCVPercent: nil)
    }

    // swiftlint:disable:next cyclomatic_complexity function_parameter_count
    private func detectStrike(
        samples: [TimedSample],
        foot: StepEvent.Foot,
        lastStrikeTime: inout TimeInterval,
        lastStrikePos: inout SIMD3<Float>?,
        contralateralLastPos: SIMD3<Float>?,
        footStrideLengths: inout [Float],
        strideIntervals: inout [Double],
        maxSwingY: inout Float,
        timestamp: TimeInterval
    ) -> FootStrike? {
        // Need enough samples for a window
        guard samples.count >= 5 else { return nil }

        // Find samples within windowDurationSec of the middle
        let windowSamples = samples.filter { timestamp - $0.timestamp <= windowDurationSec }
        guard windowSamples.count >= 3 else { return nil }

        let mid = windowSamples.count / 2
        let midSample = windowSamples[mid]

        // Check local minimum (Y position)
        var isMin = true
        for (i, s) in windowSamples.enumerated() where i != mid {
            if s.position.y <= midSample.position.y {
                isMin = false
                break
            }
        }
        guard isMin else { return nil }

        // Refractory period check
        guard timestamp - lastStrikeTime >= refractoryPeriodSec else { return nil }

        // Velocity validation: check that foot was moving downward before the minimum
        if mid > 0 {
            let prevSample = windowSamples[mid - 1]
            let dt = Float(midSample.timestamp - prevSample.timestamp)
            if dt > 0 {
                let vy = -(midSample.position.y - prevSample.position.y) / dt
                guard vy >= minStrikeVelocity else { return nil }
            }
        }

        let pos = midSample.position

        // Stride length (same foot)
        var strideLen: Float?
        if let lastPos = lastStrikePos {
            let sl = pos.xzDistance(to: lastPos)
            if sl >= minStrideM && sl <= maxStrideM {
                strideLen = sl
                footStrideLengths.append(sl)
                if footStrideLengths.count > maxSymmetrySamples {
                    footStrideLengths.removeFirst()
                }
            }
        }

        // Stride time interval (same foot)
        if lastStrikeTime > 0 {
            let interval = timestamp - lastStrikeTime
            if interval > 0.3 && interval < 2.5 {
                strideIntervals.append(interval)
                if strideIntervals.count > maxSymmetrySamples {
                    strideIntervals.removeFirst()
                }
            }
        }

        // Step length (contralateral)
        var stepLen: Float?
        if let contraPos = contralateralLastPos {
            let sl = pos.xzDistance(to: contraPos)
            if sl >= 0.1 && sl <= 1.5 {
                stepLen = sl
            }
        }

        // Step width (mediolateral distance at contact)
        var stepWidth: Float?
        if let contraPos = contralateralLastPos {
            stepWidth = abs(pos.x - contraPos.x) * 100  // meters → cm
        }

        // Impact velocity (downward)
        var impactVel: Float?
        if mid > 0 {
            let prevSample = windowSamples[mid - 1]
            let dt = Float(midSample.timestamp - prevSample.timestamp)
            if dt > 0 {
                impactVel = abs((midSample.position.y - prevSample.position.y) / dt)
            }
        }

        // Foot clearance from this swing phase
        let clearance = maxSwingY - midSample.position.y
        maxSwingY = midSample.position.y // reset for next swing

        lastStrikeTime = timestamp
        lastStrikePos = pos

        return FootStrike(
            foot: foot,
            position: pos,
            timestamp: timestamp,
            strideLengthM: strideLen,
            stepLengthM: stepLen,
            stepWidthCm: stepWidth,
            impactVelocity: impactVel,
            footClearanceM: clearance > 0.005 ? clearance : nil
        )
    }

    private func computeCadence() -> Double {
        guard stepTimestamps.count >= 2,
              let first = stepTimestamps.first,
              let last = stepTimestamps.last else { return 0 }
        let elapsed = last - first
        return elapsed > 0 ? Double(stepTimestamps.count - 1) / elapsed * 60.0 : 0
    }

    /// Walking speed from cumulative root path length over time.
    /// Uses sum of inter-frame displacements for accuracy on curved paths.
    /// Ref: Studenski S et al., JAMA, 2011.
    private func computeWalkingSpeed() -> Double {
        guard recentPositions.count >= 2,
              let first = recentPositions.first,
              let last = recentPositions.last else { return 0 }
        let elapsed = last.time - first.time
        guard elapsed > 0.5 else { return 0 }
        // Cumulative path length in XZ plane
        var pathLength: Double = 0
        for i in 1..<recentPositions.count {
            pathLength += Double(recentPositions[i].pos.xzDistance(to: recentPositions[i-1].pos))
        }
        return pathLength / elapsed
    }

    /// Robinson Symmetry Index: |L - R| / (0.5 * (L + R)) * 100
    /// Ref: Robinson RO et al., 1987. Normal < 10%.
    private func computeRobinsonSI() -> Double? {
        guard leftStrideLengths.count >= 3, rightStrideLengths.count >= 3 else { return nil }
        let avgLeft = Double(leftStrideLengths.reduce(0, +)) / Double(leftStrideLengths.count)
        let avgRight = Double(rightStrideLengths.reduce(0, +)) / Double(rightStrideLengths.count)
        let mean = 0.5 * (avgLeft + avgRight)
        guard mean > 0.01 else { return nil }
        return abs(avgLeft - avgRight) / mean * 100
    }

    /// Estimate temporal gait parameters from bilateral heel-strike and toe-off timing.
    /// Uses velocity-based toe-off estimation for stance/swing discrimination.
    /// Normal: ~60% stance, ~40% swing, ~20-30% double support.
    /// Ref: Perry J, Gait Analysis, 1992.
    private func computeTemporalParameters() -> (stance: Double?, swing: Double?, doubleSupport: Double?) {
        guard leftStrideIntervals.count >= 2, rightStrideIntervals.count >= 2 else {
            return (nil, nil, nil)
        }

        let avgLeftStride = leftStrideIntervals.reduce(0, +) / Double(leftStrideIntervals.count)
        let avgRightStride = rightStrideIntervals.reduce(0, +) / Double(rightStrideIntervals.count)
        let avgStride = (avgLeftStride + avgRightStride) / 2.0
        guard avgStride > 0 else { return (nil, nil, nil) }

        // Estimate stance time from heel-strike to toe-off timing
        // If toe-off times are available, use them for direct calculation
        // Otherwise, estimate from contralateral step timing
        let leftStance: Double
        let rightStance: Double

        if lastLeftToeOffTime > 0 && lastLeftStrikeTime > 0 && lastLeftToeOffTime > lastLeftStrikeTime {
            // Direct measurement: stance = toe-off - heel-strike
            leftStance = (lastLeftToeOffTime - lastLeftStrikeTime) / avgLeftStride * 100
        } else {
            // Estimate from contralateral step time ratio
            // In normal gait, stance ≈ stride_time - contralateral_step_time * 0.8
            let avgRightStep = avgRightStride / 2.0
            leftStance = max(50, min(70, (1.0 - avgRightStep / avgLeftStride * 0.8) * 100))
        }

        if lastRightToeOffTime > 0 && lastRightStrikeTime > 0 && lastRightToeOffTime > lastRightStrikeTime {
            rightStance = (lastRightToeOffTime - lastRightStrikeTime) / avgRightStride * 100
        } else {
            let avgLeftStep = avgLeftStride / 2.0
            rightStance = max(50, min(70, (1.0 - avgLeftStep / avgRightStride * 0.8) * 100))
        }

        let stancePercent = (leftStance + rightStance) / 2.0
        let swingPercent = 100.0 - stancePercent
        // Double support = sum of both double-support phases per cycle
        // Occurs when both feet are on the ground: DS = 2 * (stance% - 50%)
        let doubleSupport = max(0, min(50, (stancePercent - 50) * 2))

        return (stancePercent, swingPercent, doubleSupport)
    }

    /// Detect toe-off event from upward foot velocity exceeding threshold.
    /// Toe-off marks the transition from stance to swing phase.
    private func detectToeOff(
        samples: [TimedSample],
        lastToeOffTime: inout TimeInterval,
        timestamp: TimeInterval
    ) {
        guard samples.count >= 3 else { return }
        // Check velocity of last few samples
        let recent = samples.suffix(3)
        let recentArr = Array(recent)
        let prev = recentArr[recentArr.count - 2]
        let curr = recentArr[recentArr.count - 1]
        let dt = Float(curr.timestamp - prev.timestamp)
        guard dt > 0 else { return }
        let vy = (curr.position.y - prev.position.y) / dt  // positive = upward
        // Toe-off: foot moving upward with sufficient velocity
        let toeOffVelocityThreshold: Float = 0.08  // m/s upward
        if vy > toeOffVelocityThreshold && timestamp - lastToeOffTime > refractoryPeriodSec {
            lastToeOffTime = timestamp
        }
    }

    /// Coefficient of variation of stride time, computed separately per side then averaged.
    /// Separating L/R prevents conflating asymmetry with variability.
    /// CV > 5% predicts falls.
    /// Ref: Hausdorff JM et al., J Neuroengineering Rehab, 2005.
    private func computeStrideTimeCV() -> Double? {
        // Compute CV per side separately, then average
        let leftCV = computeSingleSideCV(leftStrideIntervals)
        let rightCV = computeSingleSideCV(rightStrideIntervals)

        if let l = leftCV, let r = rightCV {
            return (l + r) / 2.0
        }
        return leftCV ?? rightCV
    }

    /// CV for one side's stride intervals.
    private func computeSingleSideCV(_ intervals: [Double]) -> Double? {
        guard intervals.count >= 3 else { return nil }
        let mean = intervals.reduce(0, +) / Double(intervals.count)
        guard mean > 0 else { return nil }
        let variance = intervals.reduce(0.0) { $0 + ($1 - mean) * ($1 - mean) } / Double(intervals.count)
        let sd = sqrt(variance)
        return (sd / mean) * 100
    }
}
