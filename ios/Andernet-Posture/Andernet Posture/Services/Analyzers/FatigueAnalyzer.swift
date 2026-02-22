//
//  FatigueAnalyzer.swift
//  Andernet Posture
//
//  Detects postural and gait fatigue through time-series trend analysis.
//  Tracks increasing posture variability, forward lean trend, and
//  cadence/speed degradation as indicators of neuromuscular fatigue.
//
//  References:
//  - Granacher U et al., Gerontology, 2011 (postural fatigue)
//  - Yoshino K et al., Gait & Posture, 2004 (gait fatigue during walking)
//

import Foundation

// MARK: - Results

/// Fatigue assessment from time-series analysis.
struct FatigueAssessment: Sendable {
    /// Fatigue index 0–100. Higher = more fatigued.
    let fatigueIndex: Double
    
    /// Standard deviation of posture scores over time (variability increase = fatigue).
    let postureVariabilitySD: Double
    
    /// Regression slope of posture score over time.
    /// Negative slope = posture deterioration = fatigue.
    let postureTrendSlope: Double
    
    /// R² of the posture trend (strength of trend).
    let postureTrendR2: Double
    
    /// Cadence change over session (negative = slowing = fatigue).
    let cadenceTrendSlope: Double
    
    /// Speed change over session (negative = slowing = fatigue).
    let speedTrendSlope: Double
    
    /// Forward lean trend (positive = increasing forward lean = fatigue).
    let forwardLeanTrendSlope: Double
    
    /// Trunk lateral sway increase over time.
    let lateralSwayTrendSlope: Double
    
    /// Whether significant fatigue is detected.
    let isFatigued: Bool
}

// MARK: - Protocol

protocol FatigueAnalyzer: AnyObject {
    /// Record a time-point of metrics for trend analysis.
    func recordTimePoint(
        timestamp: TimeInterval,
        postureScore: Double,
        trunkLeanDeg: Double,
        lateralLeanDeg: Double,
        cadenceSPM: Double,
        walkingSpeedMPS: Double
    )

    /// Compute fatigue assessment from accumulated time-series.
    func assess() -> FatigueAssessment

    /// Reset state.
    func reset()
}

// MARK: - Default Implementation

final class DefaultFatigueAnalyzer: FatigueAnalyzer {

    /// Minimum number of time points needed for meaningful trend analysis.
    private let minSamples = 20

    /// Sampling interval — record at most every N seconds to avoid noise.
    private let samplingIntervalSec: TimeInterval = 2.0

    private var lastRecordedTime: TimeInterval = -Double.infinity

    // Time-series accumulators
    private var postureScores: [Double] = []
    private var trunkLeans: [Double] = []
    private var lateralLeans: [Double] = []
    private var cadences: [Double] = []
    private var speeds: [Double] = []

    // MARK: - Record

    func recordTimePoint(
        timestamp: TimeInterval,
        postureScore: Double,
        trunkLeanDeg: Double,
        lateralLeanDeg: Double,
        cadenceSPM: Double,
        walkingSpeedMPS: Double
    ) {
        // Throttle recording
        guard timestamp - lastRecordedTime >= samplingIntervalSec else { return }
        lastRecordedTime = timestamp

        postureScores.append(postureScore)
        trunkLeans.append(trunkLeanDeg)
        lateralLeans.append(abs(lateralLeanDeg))
        cadences.append(cadenceSPM)
        speeds.append(walkingSpeedMPS)
    }

    // MARK: - Assess

    func assess() -> FatigueAssessment {
        guard postureScores.count >= minSamples else {
            return FatigueAssessment(
                fatigueIndex: 0, postureVariabilitySD: 0,
                postureTrendSlope: 0, postureTrendR2: 0,
                cadenceTrendSlope: 0, speedTrendSlope: 0,
                forwardLeanTrendSlope: 0, lateralSwayTrendSlope: 0,
                isFatigued: false
            )
        }

        // Posture trend
        let postureTrend = linearRegression(postureScores)
        let postureSD = standardDeviation(postureScores)

        // Compare first vs last thirds for practical fatigue detection
        let thirdSize = postureScores.count / 3
        let firstThirdAvg = average(Array(postureScores.prefix(thirdSize)))
        let lastThirdAvg = average(Array(postureScores.suffix(thirdSize)))

        // Cadence trend
        let cadenceTrend = linearRegression(cadences)

        // Speed trend
        let speedTrend = linearRegression(speeds)

        // Forward lean trend (increasing = fatigue)
        let leanTrend = linearRegression(trunkLeans)

        // Lateral sway trend (increasing variability = fatigue)
        let lateralTrend = linearRegression(lateralLeans)

        // Compute composite fatigue index
        var fatigueIndex = 0.0

        // Posture degradation component (40% weight)
        let postureDrop = firstThirdAvg - lastThirdAvg
        if postureDrop > 0 {
            fatigueIndex += min(40, postureDrop * 4) // 10-point drop = max 40
        }

        // Variability increase (20% weight)
        let firstThirdSD = standardDeviation(Array(postureScores.prefix(thirdSize)))
        let lastThirdSD = standardDeviation(Array(postureScores.suffix(thirdSize)))
        let sdIncrease = lastThirdSD - firstThirdSD
        if sdIncrease > 0 {
            fatigueIndex += min(20, sdIncrease * 10)
        }

        // Forward lean increase (15% weight)
        if leanTrend.slope > 0 {
            fatigueIndex += min(15, leanTrend.slope * 50)
        }

        // Speed decrease (10% weight)
        if speedTrend.slope < 0 {
            fatigueIndex += min(10, abs(speedTrend.slope) * 100)
        }

        // Cadence change (10% weight)
        // Fatigue can manifest as compensatory cadence increase (shorter, faster steps)
        // or cadence decrease (slowing down). Both patterns indicate fatigue.
        let cadenceFirstAvg = average(Array(cadences.prefix(thirdSize)))
        let cadenceLastAvg = average(Array(cadences.suffix(thirdSize)))
        let cadenceChangePct = cadenceFirstAvg > 0 ? abs(cadenceLastAvg - cadenceFirstAvg) / cadenceFirstAvg * 100 : 0
        if cadenceChangePct > 5 {
            fatigueIndex += min(10, cadenceChangePct * 1.5)
        }

        // Lateral sway increase (5% weight)
        if lateralTrend.slope > 0 {
            fatigueIndex += min(5, lateralTrend.slope * 25)
        }

        let isFatigued = fatigueIndex > 25 ||
            (postureDrop > 5 && postureTrend.rSquared > 0.3)

        return FatigueAssessment(
            fatigueIndex: min(100, max(0, fatigueIndex)),
            postureVariabilitySD: postureSD,
            postureTrendSlope: postureTrend.slope,
            postureTrendR2: postureTrend.rSquared,
            cadenceTrendSlope: cadenceTrend.slope,
            speedTrendSlope: speedTrend.slope,
            forwardLeanTrendSlope: leanTrend.slope,
            lateralSwayTrendSlope: lateralTrend.slope,
            isFatigued: isFatigued
        )
    }

    func reset() {
        postureScores.removeAll()
        trunkLeans.removeAll()
        lateralLeans.removeAll()
        cadences.removeAll()
        speeds.removeAll()
        lastRecordedTime = -Double.infinity
    }

    // MARK: - Private Helpers

    private func average(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
    }
}
