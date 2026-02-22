//
//  IMUStepDetector.swift
//  Andernet Posture
//
//  Accelerometer-based step detection using peak detection on the
//  vertical acceleration signal. Validates ARKit heel strikes and
//  provides standalone step detection for sensor-only mode.
//
//  Algorithm:
//  1. Butterworth low-pass filter (5 Hz cutoff) on vertical acceleration
//  2. Peak detection with adaptive threshold (mean + 1.2 SD)
//  3. Refractory period (250ms) to prevent double-counting
//  4. Cross-validation with ARKit when available
//
//  References:
//  - Ying H et al., Sensors, 2007 (accelerometer step detection)
//  - Zhao N, J Comput Sci, 2010 (adaptive threshold pedometry)
//  - Dijkstra B et al., J Biomech, 2008 (IMU gait event detection)
//

import Foundation
import Accelerate

// MARK: - IMU Step Event

/// A step detected purely from IMU accelerometer data.
struct IMUStepEvent: Sendable {
    let timestamp: TimeInterval
    /// Estimated cadence from recent inter-step intervals (steps/min).
    let instantCadenceSPM: Double
    /// Vertical acceleration magnitude at impact (G).
    let impactMagnitudeG: Double
    /// Whether this step was validated by ARKit (if available).
    var arKitValidated: Bool = false
}

// MARK: - Protocol

protocol IMUStepDetector: AnyObject {
    /// Feed a new accelerometer sample. Returns a step event if one is detected.
    func processSample(
        timestamp: TimeInterval,
        userAccelerationY: Double,  // vertical (gravity removed)
        userAccelerationX: Double,  // mediolateral
        userAccelerationZ: Double   // anteroposterior
    ) -> IMUStepEvent?

    /// Validate an ARKit-detected step against recent IMU peaks.
    /// Returns confidence (0-1) that the ARKit step is real.
    func validateARKitStep(at timestamp: TimeInterval) -> Double

    /// Current IMU-derived cadence (steps/min).
    var currentCadenceSPM: Double { get }

    /// Total steps detected by IMU.
    var stepCount: Int { get }

    /// Reset state.
    func reset()
}

// MARK: - Default Implementation

final class DefaultIMUStepDetector: IMUStepDetector {

    // MARK: - Configuration

    /// Minimum time between steps (refractory period) — 250ms.
    /// Normal inter-step interval ≈ 500ms; prevents double-detection.
    private let refractoryPeriodSec: TimeInterval = 0.25

    /// Low-pass filter cutoff frequency (Hz). Walking acceleration < 5 Hz.
    private let filterCutoffHz: Double = 5.0

    /// Adaptive threshold: mean + k * SD of recent acceleration peaks.
    private let thresholdK: Double = 1.2

    /// Minimum acceleration magnitude to consider (G). Below this is noise.
    private let minAccelerationG: Double = 0.08

    /// Window size for adaptive threshold computation.
    private let thresholdWindowSize = 50

    /// Window for validation: ARKit step must be within ±100ms of IMU peak.
    private let validationWindowSec: TimeInterval = 0.10

    // MARK: - State

    private struct AccelSample {
        let timestamp: TimeInterval
        let verticalG: Double
        let filteredVertical: Double
    }

    /// Raw acceleration buffer for filtering.
    private var rawBuffer: [Double] = []

    /// Recent samples after filtering.
    private var recentSamples: [AccelSample] = []
    private let maxSamples = 300  // 5 seconds at 60 Hz

    /// Detected peak magnitudes for adaptive threshold.
    private var recentPeakMagnitudes: [Double] = []

    /// Timestamps of detected IMU steps.
    private var stepTimestamps: [TimeInterval] = []
    private let maxStepHistory = 100

    /// Last step timestamp for refractory check.
    private var lastStepTime: TimeInterval = -1

    /// IIR filter state.
    private var filterState: (y1: Double, y2: Double, x1: Double, x2: Double) = (0, 0, 0, 0)
    private var filterCoefficients: (a1: Double, a2: Double, b0: Double, b1: Double, b2: Double)?

    private(set) var stepCount: Int = 0

    var currentCadenceSPM: Double {
        computeCadence()
    }

    // MARK: - Initialization

    init(samplingRate: Double = 60.0) {
        computeFilterCoefficients(samplingRate: samplingRate)
    }

    // MARK: - Process Sample

    func processSample(
        timestamp: TimeInterval,
        userAccelerationY: Double,
        userAccelerationX: Double,
        userAccelerationZ: Double
    ) -> IMUStepEvent? {
        // Compute vertical acceleration magnitude (primarily Y in .xArbitraryZVertical)
        let verticalMag = abs(userAccelerationY)

        // Apply low-pass filter
        let filtered = applyFilter(verticalMag)

        let sample = AccelSample(timestamp: timestamp, verticalG: verticalMag, filteredVertical: filtered)
        recentSamples.append(sample)

        // Trim buffer
        if recentSamples.count > maxSamples {
            recentSamples.removeFirst(recentSamples.count - maxSamples)
        }

        // Need at least 3 samples for peak detection (check if middle is peak)
        guard recentSamples.count >= 3 else { return nil }

        // Check if the sample 1 back is a local maximum (peak detection with 1-sample lag)
        let n = recentSamples.count
        let prev = recentSamples[n - 3].filteredVertical
        let candidate = recentSamples[n - 2].filteredVertical
        let current = recentSamples[n - 1].filteredVertical
        let candidateTime = recentSamples[n - 2].timestamp

        guard candidate > prev && candidate > current else { return nil }

        // Above minimum threshold?
        guard candidate > minAccelerationG else { return nil }

        // Above adaptive threshold?
        let threshold = computeAdaptiveThreshold()
        guard candidate >= threshold else { return nil }

        // Refractory period check
        guard candidateTime - lastStepTime >= refractoryPeriodSec else { return nil }

        // Step detected!
        lastStepTime = candidateTime
        stepCount += 1
        stepTimestamps.append(candidateTime)
        if stepTimestamps.count > maxStepHistory {
            stepTimestamps.removeFirst()
        }

        // Record peak for adaptive threshold
        recentPeakMagnitudes.append(candidate)
        if recentPeakMagnitudes.count > thresholdWindowSize {
            recentPeakMagnitudes.removeFirst()
        }

        return IMUStepEvent(
            timestamp: candidateTime,
            instantCadenceSPM: computeCadence(),
            impactMagnitudeG: candidate
        )
    }

    // MARK: - ARKit Validation

    func validateARKitStep(at timestamp: TimeInterval) -> Double {
        // Find the nearest IMU peak within the validation window
        let windowStart = timestamp - validationWindowSec
        let windowEnd = timestamp + validationWindowSec

        // Check recent samples for a peak near the ARKit timestamp
        let nearbyPeaks = recentSamples.filter { sample in
            sample.timestamp >= windowStart && sample.timestamp <= windowEnd
        }

        guard !nearbyPeaks.isEmpty else { return 0.0 }

        // Find the best peak (highest filtered value in window)
        let bestPeak = nearbyPeaks.max(by: { $0.filteredVertical < $1.filteredVertical })!

        // Confidence based on peak magnitude relative to threshold
        let threshold = computeAdaptiveThreshold()
        guard threshold > 0 else { return 0.5 }

        let ratio = bestPeak.filteredVertical / threshold
        return min(1.0, max(0.0, ratio - 0.5) * 2.0)  // Map [0.5, 1.0] → [0, 1]
    }

    func reset() {
        rawBuffer.removeAll()
        recentSamples.removeAll()
        recentPeakMagnitudes.removeAll()
        stepTimestamps.removeAll()
        lastStepTime = -1
        stepCount = 0
        filterState = (0, 0, 0, 0)
    }

    // MARK: - Private Helpers

    private func computeCadence() -> Double {
        guard stepTimestamps.count >= 2 else { return 0 }

        // Use the last 10 seconds of steps
        let now = stepTimestamps.last!
        let windowStart = now - 10.0
        let recentSteps = stepTimestamps.filter { $0 >= windowStart }

        guard recentSteps.count >= 2,
              let first = recentSteps.first,
              let last = recentSteps.last else { return 0 }

        let duration = last - first
        guard duration > 0.3 else { return 0 }

        return Double(recentSteps.count - 1) / duration * 60.0
    }

    private func computeAdaptiveThreshold() -> Double {
        guard !recentPeakMagnitudes.isEmpty else { return minAccelerationG }

        let mean = recentPeakMagnitudes.reduce(0, +) / Double(recentPeakMagnitudes.count)
        let variance = recentPeakMagnitudes.reduce(0) { $0 + ($1 - mean) * ($1 - mean) } / Double(recentPeakMagnitudes.count)
        let sd = sqrt(variance)

        // threshold = mean + k * SD, but never below minimum
        return max(minAccelerationG, mean - thresholdK * sd)
    }

    /// Second-order Butterworth low-pass IIR filter.
    private func computeFilterCoefficients(samplingRate: Double) {
        let omega = 2.0 * Double.pi * filterCutoffHz / samplingRate
        let cosOmega = cos(omega)
        let sinOmega = sin(omega)
        let alpha = sinOmega / (2.0 * sqrt(2.0))  // Q = sqrt(2)/2 for Butterworth

        let a0 = 1.0 + alpha
        let a1 = -2.0 * cosOmega / a0
        let a2 = (1.0 - alpha) / a0
        let b0 = (1.0 - cosOmega) / 2.0 / a0
        let b1 = (1.0 - cosOmega) / a0
        let b2 = b0

        filterCoefficients = (a1, a2, b0, b1, b2)
    }

    private func applyFilter(_ x: Double) -> Double {
        guard let c = filterCoefficients else { return x }

        let y = c.b0 * x + c.b1 * filterState.x1 + c.b2 * filterState.x2
            - c.a1 * filterState.y1 - c.a2 * filterState.y2

        filterState.x2 = filterState.x1
        filterState.x1 = x
        filterState.y2 = filterState.y1
        filterState.y1 = y

        return y
    }
}
