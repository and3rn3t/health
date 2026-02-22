//
//  TrunkMotionAnalyzer.swift
//  Andernet Posture
//
//  Analyzes trunk rotation, lateral flexion, and turning events from
//  CoreMotion gyroscope and attitude data. Uses the stored but previously
//  unanalyzed rotation rate and yaw data from MotionFrame.
//
//  References:
//  - El-Gohary M et al., Sensors, 2013 (IMU-based trunk kinematics)
//  - Nishiguchi S et al., J Neuroeng Rehabil, 2012 (turning and fall risk)
//  - Mancini M et al., J Biomech, 2015 (trunk sway during gait)
//

import Foundation

// MARK: - Results

/// Trunk motion metrics derived from gyroscope/attitude data.
struct TrunkMotionMetrics: Sendable {
    /// Peak trunk rotation velocity in degrees/s.
    let peakRotationVelocityDPS: Double
    /// Average trunk rotation range during gait cycles (degrees).
    let averageRotationRangeDeg: Double
    /// Number of turns detected (>45° yaw change within 2 seconds).
    let turnCount: Int
    /// Average turn duration in seconds.
    let averageTurnDurationSec: Double
    /// Trunk rotation asymmetry (|left - right| / max * 100). Normal < 15%.
    let rotationAsymmetryPercent: Double
    /// Average lateral trunk flexion from pitch/roll (degrees).
    let averageLateralFlexionDeg: Double
    /// Movement regularity index (autocorrelation of rotation signal).
    /// Closer to 1.0 = more regular/periodic gait.
    let movementRegularityIndex: Double
}

// MARK: - Protocol

protocol TrunkMotionAnalyzer: AnyObject {
    /// Process a MotionFrame for trunk motion analysis.
    func processFrame(_ frame: MotionFrame)

    /// Compute trunk motion metrics from recorded data.
    func analyze() -> TrunkMotionMetrics

    /// Reset state.
    func reset()
}

// MARK: - Default Implementation

final class DefaultTrunkMotionAnalyzer: TrunkMotionAnalyzer {

    // MARK: - Configuration

    /// Turn detection: minimum yaw change in radians (~45°).
    private let turnThresholdRad: Double = .pi / 4

    /// Turn detection: maximum duration for a turn (seconds).
    private let maxTurnDurationSec: TimeInterval = 3.0

    /// Window for ongoing analysis (seconds).
    private let analysisWindowSec: TimeInterval = 60.0

    // MARK: - State

    private struct MotionSample {
        let timestamp: TimeInterval
        let yaw: Double           // radians
        let roll: Double          // radians
        let pitch: Double         // radians
        let rotationRateY: Double // yaw velocity (rad/s)
        let rotationRateX: Double // roll velocity (rad/s)
        let rotationRateZ: Double // pitch velocity (rad/s)
    }

    private var samples: [MotionSample] = []
    private let maxSamples = 3600  // 60 seconds at 60 Hz

    /// Detected turns.
    private struct TurnEvent {
        let startTime: TimeInterval
        let endTime: TimeInterval
        let yawChange: Double  // radians, positive = left turn
    }
    private var detectedTurns: [TurnEvent] = []

    // MARK: - Process Frame

    func processFrame(_ frame: MotionFrame) {
        let sample = MotionSample(
            timestamp: frame.timestamp,
            yaw: frame.yaw,
            roll: frame.roll,
            pitch: frame.pitch,
            rotationRateY: frame.rotationRateY,
            rotationRateX: frame.rotationRateX,
            rotationRateZ: frame.rotationRateZ
        )
        samples.append(sample)

        // Trim to analysis window
        if samples.count > maxSamples {
            samples.removeFirst(samples.count - maxSamples)
        }

        // Detect turns incrementally
        detectTurns()
    }

    // MARK: - Analyze

    func analyze() -> TrunkMotionMetrics {
        guard samples.count >= 30 else {
            return TrunkMotionMetrics(
                peakRotationVelocityDPS: 0, averageRotationRangeDeg: 0,
                turnCount: 0, averageTurnDurationSec: 0,
                rotationAsymmetryPercent: 0, averageLateralFlexionDeg: 0,
                movementRegularityIndex: 0
            )
        }

        let rotationRates = samples.map { abs($0.rotationRateY) * 180.0 / .pi }
        let peakRotVelocity = rotationRates.max() ?? 0

        // Average rotation range: compute running range over 1-second windows
        let rotationRange = computeRotationRange()

        // Turn metrics
        let avgTurnDuration: Double
        if detectedTurns.isEmpty {
            avgTurnDuration = 0
        } else {
            avgTurnDuration = detectedTurns.reduce(0.0) { $0 + ($1.endTime - $1.startTime) } / Double(detectedTurns.count)
        }

        // Rotation asymmetry (left vs right peak rotation rates)
        let asymmetry = computeRotationAsymmetry()

        // Lateral flexion from roll
        let lateralFlexions = samples.map { abs($0.roll) * 180.0 / .pi }
        let avgLateralFlexion = lateralFlexions.reduce(0, +) / Double(lateralFlexions.count)

        // Movement regularity via autocorrelation of yaw rate
        let regularity = computeMovementRegularity()

        return TrunkMotionMetrics(
            peakRotationVelocityDPS: peakRotVelocity,
            averageRotationRangeDeg: rotationRange,
            turnCount: detectedTurns.count,
            averageTurnDurationSec: avgTurnDuration,
            rotationAsymmetryPercent: asymmetry,
            averageLateralFlexionDeg: avgLateralFlexion,
            movementRegularityIndex: regularity
        )
    }

    func reset() {
        samples.removeAll()
        detectedTurns.removeAll()
    }

    // MARK: - Private Helpers

    private func detectTurns() {
        guard samples.count >= 10 else { return }

        // Simple turn detection: look for cumulative yaw change > threshold
        // within a time window, using the most recent samples
        let lookback = min(samples.count, Int(maxTurnDurationSec * 60))  // ~60 Hz
        let recent = samples.suffix(lookback)

        guard let first = recent.first, let last = recent.last else { return }

        var yawChange = last.yaw - first.yaw

        // Normalize to [-π, π]
        while yawChange > .pi { yawChange -= 2 * .pi }
        while yawChange < -.pi { yawChange += 2 * .pi }

        let duration = last.timestamp - first.timestamp

        if abs(yawChange) >= turnThresholdRad && duration <= maxTurnDurationSec {
            // Check if this turn is distinct from the last detected one
            if let lastTurn = detectedTurns.last {
                guard first.timestamp > lastTurn.endTime + 1.0 else { return }
            }
            detectedTurns.append(TurnEvent(
                startTime: first.timestamp,
                endTime: last.timestamp,
                yawChange: yawChange
            ))
        }
    }

    private func computeRotationRange() -> Double {
        guard samples.count >= 60 else { return 0 }

        // Compute range of yaw rate over 1-second windows
        let windowSize = 60  // ~1 second at 60 Hz
        var ranges: [Double] = []

        for i in stride(from: 0, to: samples.count - windowSize, by: windowSize / 2) {
            let window = samples[i..<min(i + windowSize, samples.count)]
            let yaws = window.map(\.yaw)
            guard let minYaw = yaws.min(), let maxYaw = yaws.max() else { continue }
            var range = maxYaw - minYaw
            // Handle wrap-around
            if range > .pi { range = 2 * .pi - range }
            ranges.append(range * 180.0 / .pi)
        }

        return ranges.isEmpty ? 0 : ranges.reduce(0, +) / Double(ranges.count)
    }

    private func computeRotationAsymmetry() -> Double {
        // Split rotation rates into left (positive yaw rate) and right (negative)
        let leftRates = samples.filter { $0.rotationRateY > 0.1 }.map { $0.rotationRateY * 180.0 / .pi }
        let rightRates = samples.filter { $0.rotationRateY < -0.1 }.map { -$0.rotationRateY * 180.0 / .pi }

        guard !leftRates.isEmpty && !rightRates.isEmpty else { return 0 }

        let avgLeft = leftRates.reduce(0, +) / Double(leftRates.count)
        let avgRight = rightRates.reduce(0, +) / Double(rightRates.count)
        let maxRate = max(avgLeft, avgRight)

        guard maxRate > 0 else { return 0 }
        return abs(avgLeft - avgRight) / maxRate * 100.0
    }

    private func computeMovementRegularity() -> Double {
        guard samples.count >= 120 else { return 0 }

        // Autocorrelation of yaw rotation rate at stride period (~1 second lag)
        let signal = samples.map(\.rotationRateY)
        let n = signal.count
        let mean = signal.reduce(0, +) / Double(n)
        let centered = signal.map { $0 - mean }

        // Variance
        let variance = centered.reduce(0.0) { $0 + $1 * $1 } / Double(n)
        guard variance > 0.0001 else { return 0 }

        // Autocorrelation at lags ~50-70 (0.8-1.2 sec at 60 Hz) — stride period
        var bestCorrelation = 0.0
        for lag in 50...min(70, n / 2) {
            var correlation = 0.0
            for i in 0..<(n - lag) {
                correlation += centered[i] * centered[i + lag]
            }
            correlation /= Double(n - lag) * variance
            bestCorrelation = max(bestCorrelation, correlation)
        }

        return min(1.0, max(0.0, bestCorrelation))
    }
}
