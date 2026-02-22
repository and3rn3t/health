//
//  BalanceAnalyzer.swift
//  Andernet Posture
//
//  Center-of-mass proxy analysis using ARKit root position.
//  Computes sway velocity, sway area (95% confidence ellipse via PCA),
//  AP/ML ratio, and Romberg ratio support.
//
//  References:
//  - Prieto TE et al., IEEE Trans BME, 1996 (sway metrics)
//  - Piirtola M & Era P, Gerontology, 2006 (fall risk thresholds)
//  - Agrawal Y et al., Otol Neurotol, 2011 (Romberg ratio)
//

import Foundation
import simd

// MARK: - Results

/// Per-frame balance / sway metrics.
struct BalanceMetrics: Sendable {
    /// Sway velocity in mm/s (root displacement derivative).
    let swayVelocityMMS: Double
    /// 95% confidence ellipse sway area in cm².
    let swayAreaCm2: Double
    /// Anteroposterior sway range in mm.
    let apRangeMM: Double
    /// Mediolateral sway range in mm.
    let mlRangeMM: Double
    /// AP/ML ratio (higher = more sagittal sway). Normal ≈ 2-3.
    let apMlRatio: Double
    /// Mean sway distance from centroid in mm.
    let meanSwayDistanceMM: Double
}

/// Romberg test results comparing eyes-open vs eyes-closed sway.
struct RombergResult: Sendable {
    let eyesOpenSwayVelocity: Double
    let eyesClosedSwayVelocity: Double
    /// Ratio of EC/EO sway velocity. > 2.0 suggests proprioceptive/vestibular deficit.
    let ratio: Double
    /// Ratio of EC/EO sway area. Provides additional sensitivity.
    /// Ref: Agrawal Y et al., Otol Neurotol, 2011.
    let areaRatio: Double
}

// MARK: - Protocol

protocol BalanceAnalyzer: AnyObject {
    /// Process a new frame of root position data.
    func processFrame(rootPosition: SIMD3<Float>, timestamp: TimeInterval) -> BalanceMetrics

    /// Check if the subject is standing still (not walking).
    var isStanding: Bool { get }

    /// Process an IMU accelerometer frame for higher-fidelity sway analysis.
    /// Accelerometer runs at 60 Hz vs ARKit's ~30 Hz, providing better temporal resolution.
    func processIMUFrame(
        timestamp: TimeInterval,
        userAccelerationX: Double,   // mediolateral
        userAccelerationY: Double,   // vertical
        userAccelerationZ: Double    // anteroposterior
    )

    /// IMU-derived sway metrics (higher temporal resolution than ARKit-only).
    var imuSwayMetrics: IMUSwayMetrics? { get }

    /// Start Romberg eyes-open phase.
    func startRombergEyesOpen()
    /// Transition to Romberg eyes-closed phase.
    func startRombergEyesClosed()
    /// Complete Romberg test and return results.
    func completeRomberg() -> RombergResult?

    /// Reset all state.
    func reset()
}

/// IMU-derived sway metrics at accelerometer sampling rate (60 Hz).
struct IMUSwayMetrics: Sendable {
    /// Root-mean-square of mediolateral acceleration (G). Higher = more lateral sway.
    let rmsAccelerationML: Double
    /// Root-mean-square of anteroposterior acceleration (G). Higher = more AP sway.
    let rmsAccelerationAP: Double
    /// Jerk (derivative of acceleration) RMS — higher = less smooth balance.
    let jerkRMS: Double
    /// Frequency of dominant sway oscillation (Hz). Normal quiet stance ≈ 0.1-0.5 Hz.
    let dominantSwayFrequencyHz: Double
    /// Sample count used for computation.
    let sampleCount: Int
}

// MARK: - Default Implementation

final class DefaultBalanceAnalyzer: BalanceAnalyzer {

    // MARK: Configuration

    /// Window for sway computation (seconds).
    private let swayWindowSec: TimeInterval = 5.0

    /// Minimum samples needed for meaningful sway metrics.
    private let minSamples = 15

    /// Velocity threshold to distinguish standing from walking (m/s).
    private let standingSpeedThreshold: Float = 0.15

    // MARK: State

    private struct TimedPosition {
        let position: SIMD3<Float>
        let timestamp: TimeInterval
    }

    private var positions: [TimedPosition] = []
    private(set) var isStanding: Bool = false

    // Romberg test state
    private enum RombergPhase { case none, eyesOpen, eyesClosed }
    private var rombergPhase: RombergPhase = .none
    private var eyesOpenPositions: [TimedPosition] = []
    private var eyesClosedPositions: [TimedPosition] = []

    // MARK: IMU Sway State

    private struct IMUAccelSample {
        let timestamp: TimeInterval
        let ml: Double    // mediolateral (X)
        let ap: Double    // anteroposterior (Z)
    }

    private var imuSamples: [IMUAccelSample] = []
    private let imuSwayWindowSec: TimeInterval = 5.0
    private let minIMUSamples = 30  // ~0.5 sec at 60 Hz
    private var _imuSwayMetrics: IMUSwayMetrics?
    private(set) var imuSwayMetrics: IMUSwayMetrics? {
        get { _imuSwayMetrics }
        set { _imuSwayMetrics = newValue }
    }

    // MARK: - Process Frame

    func processFrame(rootPosition: SIMD3<Float>, timestamp: TimeInterval) -> BalanceMetrics {
        let timed = TimedPosition(position: rootPosition, timestamp: timestamp)
        positions.append(timed)

        // Trim to window
        positions = positions.filter { timestamp - $0.timestamp <= swayWindowSec }

        // Record for Romberg if active
        switch rombergPhase {
        case .eyesOpen:
            eyesOpenPositions.append(timed)
        case .eyesClosed:
            eyesClosedPositions.append(timed)
        case .none:
            break
        }

        // Determine if standing
        updateStandingState()

        guard positions.count >= minSamples else {
            return BalanceMetrics(swayVelocityMMS: 0, swayAreaCm2: 0,
                                 apRangeMM: 0, mlRangeMM: 0, apMlRatio: 1, meanSwayDistanceMM: 0)
        }

        return computeMetrics(from: positions)
    }

    // MARK: - Romberg

    func startRombergEyesOpen() {
        rombergPhase = .eyesOpen
        eyesOpenPositions.removeAll()
        eyesClosedPositions.removeAll()
    }

    func startRombergEyesClosed() {
        rombergPhase = .eyesClosed
        eyesClosedPositions.removeAll()
    }

    func completeRomberg() -> RombergResult? {
        rombergPhase = .none
        guard eyesOpenPositions.count >= minSamples,
              eyesClosedPositions.count >= minSamples else { return nil }

        let eoMetrics = computeMetrics(from: eyesOpenPositions)
        let ecMetrics = computeMetrics(from: eyesClosedPositions)

        let velocityRatio = eoMetrics.swayVelocityMMS > 0.1
            ? ecMetrics.swayVelocityMMS / eoMetrics.swayVelocityMMS
            : 1.0

        // Area-based Romberg ratio for improved sensitivity (Agrawal et al., 2011)
        let areaRatio = eoMetrics.swayAreaCm2 > 0.01
            ? ecMetrics.swayAreaCm2 / eoMetrics.swayAreaCm2
            : 1.0

        return RombergResult(
            eyesOpenSwayVelocity: eoMetrics.swayVelocityMMS,
            eyesClosedSwayVelocity: ecMetrics.swayVelocityMMS,
            ratio: velocityRatio,
            areaRatio: areaRatio
        )
    }

    // MARK: - IMU Sway Processing

    func processIMUFrame(
        timestamp: TimeInterval,
        userAccelerationX: Double,
        userAccelerationY: Double,
        userAccelerationZ: Double
    ) {
        let sample = IMUAccelSample(timestamp: timestamp, ml: userAccelerationX, ap: userAccelerationZ)
        imuSamples.append(sample)

        // Trim to window
        imuSamples = imuSamples.filter { timestamp - $0.timestamp <= imuSwayWindowSec }

        // Compute IMU sway metrics when standing (or always, let caller decide)
        guard imuSamples.count >= minIMUSamples else {
            _imuSwayMetrics = nil
            return
        }

        _imuSwayMetrics = computeIMUSwayMetrics()
    }

    private func computeIMUSwayMetrics() -> IMUSwayMetrics {
        let n = Double(imuSamples.count)

        // RMS of mediolateral acceleration
        let mlSquaredSum = imuSamples.reduce(0.0) { $0 + $1.ml * $1.ml }
        let rmsML = sqrt(mlSquaredSum / n)

        // RMS of anteroposterior acceleration
        let apSquaredSum = imuSamples.reduce(0.0) { $0 + $1.ap * $1.ap }
        let rmsAP = sqrt(apSquaredSum / n)

        // Jerk RMS (derivative of acceleration)
        var jerkSquaredSum = 0.0
        var jerkCount = 0
        for i in 1..<imuSamples.count {
            let dt = imuSamples[i].timestamp - imuSamples[i - 1].timestamp
            guard dt > 0.001 else { continue }
            let jerkML = (imuSamples[i].ml - imuSamples[i - 1].ml) / dt
            let jerkAP = (imuSamples[i].ap - imuSamples[i - 1].ap) / dt
            jerkSquaredSum += jerkML * jerkML + jerkAP * jerkAP
            jerkCount += 1
        }
        let jerkRMS = jerkCount > 0 ? sqrt(jerkSquaredSum / Double(jerkCount)) : 0

        // Dominant sway frequency via zero-crossing rate of ML acceleration
        // (Simple heuristic — full FFT is in SmoothnessAnalyzer)
        var zeroCrossings = 0
        let mlValues = imuSamples.map(\.ml)
        let mlMean = mlValues.reduce(0, +) / n
        for i in 1..<mlValues.count {
            let prev = mlValues[i - 1] - mlMean
            let curr = mlValues[i] - mlMean
            if (prev >= 0 && curr < 0) || (prev < 0 && curr >= 0) {
                zeroCrossings += 1
            }
        }
        let totalTime = (imuSamples.last?.timestamp ?? 0) - (imuSamples.first?.timestamp ?? 0)
        let dominantFreq = totalTime > 0 ? Double(zeroCrossings) / (2.0 * totalTime) : 0

        return IMUSwayMetrics(
            rmsAccelerationML: rmsML,
            rmsAccelerationAP: rmsAP,
            jerkRMS: jerkRMS,
            dominantSwayFrequencyHz: dominantFreq,
            sampleCount: imuSamples.count
        )
    }

    func reset() {
        positions.removeAll()
        isStanding = false
        rombergPhase = .none
        eyesOpenPositions.removeAll()
        eyesClosedPositions.removeAll()
        imuSamples.removeAll()
        _imuSwayMetrics = nil
    }

    // MARK: - Private Helpers

    private func updateStandingState() {
        // Use a 1–2 second window (~30–60 frames at 30fps) for robust standing detection.
        // Previously used 10 samples (≈0.33s) which caused flickering.
        let windowSize = 45  // ~1.5 seconds at 30fps
        guard positions.count >= 10,
              let first = positions.suffix(windowSize).first,
              let last = positions.last else {
            isStanding = false
            return
        }
        let dt = last.timestamp - first.timestamp
        guard dt > 0.5 else { isStanding = false; return }
        let dist = first.position.xzDistance(to: last.position)
        let speed = dist / Float(dt)
        isStanding = speed < standingSpeedThreshold
    }

    private func computeMetrics(from samples: [TimedPosition]) -> BalanceMetrics {
        // Extract XZ positions (ground plane) in mm
        let xzMM: [(x: Double, z: Double)] = samples.map {
            (Double($0.position.x) * 1000, Double($0.position.z) * 1000)
        }

        // Centroid
        let cx = xzMM.map(\.x).reduce(0, +) / Double(xzMM.count)
        let cz = xzMM.map(\.z).reduce(0, +) / Double(xzMM.count)

        // Centered positions
        let centered = xzMM.map { (x: $0.x - cx, z: $0.z - cz) }

        // AP range (Z axis = anteroposterior in ARKit body space)
        let zValues = centered.map(\.z)
        let apRange = (zValues.max() ?? 0) - (zValues.min() ?? 0)

        // ML range (X axis = mediolateral)
        let xValues = centered.map(\.x)
        let mlRange = (xValues.max() ?? 0) - (xValues.min() ?? 0)

        // AP/ML ratio
        let apMlRatio = mlRange > 0.1 ? apRange / mlRange : 1.0

        // Mean sway distance from centroid
        let distances = centered.map { sqrt($0.x * $0.x + $0.z * $0.z) }
        let meanDist = distances.reduce(0, +) / Double(distances.count)

        // Sway path length → velocity
        var pathLength: Double = 0
        for i in 1..<samples.count {
            let dx = Double(samples[i].position.x - samples[i-1].position.x) * 1000
            let dz = Double(samples[i].position.z - samples[i-1].position.z) * 1000
            pathLength += sqrt(dx * dx + dz * dz)
        }
        let totalTime = (samples.last?.timestamp ?? 0) - (samples.first?.timestamp ?? 0)
        let swayVelocity = totalTime > 0 ? pathLength / totalTime : 0

        // 95% confidence ellipse area via PCA
        let swayArea = compute95EllipseArea(centered: centered)

        return BalanceMetrics(
            swayVelocityMMS: swayVelocity,
            swayAreaCm2: swayArea / 100, // mm² → cm²
            apRangeMM: apRange,
            mlRangeMM: mlRange,
            apMlRatio: apMlRatio,
            meanSwayDistanceMM: meanDist
        )
    }

    /// Compute 95% confidence ellipse area using eigenvalues of covariance matrix.
    /// Area = π * χ²(2, 0.95) * √(λ1 * λ2) where χ²(2, 0.95) = 5.991
    private func compute95EllipseArea(centered: [(x: Double, z: Double)]) -> Double {
        let n = Double(centered.count)
        guard n >= 3 else { return 0 }

        // Covariance matrix [Sxx Sxz; Sxz Szz]
        let sxx = centered.reduce(0.0) { $0 + $1.x * $1.x } / (n - 1)
        let szz = centered.reduce(0.0) { $0 + $1.z * $1.z } / (n - 1)
        let sxz = centered.reduce(0.0) { $0 + $1.x * $1.z } / (n - 1)

        // Eigenvalues of 2x2 symmetric matrix
        let trace = sxx + szz
        let det = sxx * szz - sxz * sxz
        let discriminant = max(0, trace * trace / 4 - det)
        let sqrtDisc = sqrt(discriminant)

        let lambda1 = trace / 2 + sqrtDisc
        let lambda2 = trace / 2 - sqrtDisc

        guard lambda1 > 0, lambda2 > 0 else { return 0 }

        // Chi-squared critical value for 2 DOF, 95% confidence = 5.991
        let chi2 = 5.991
        return Double.pi * chi2 * sqrt(lambda1 * lambda2)
    }
}
