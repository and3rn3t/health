//
//  CardioEstimator.swift
//  Andernet Posture
//
//  Estimates cardiovascular/metabolic cost from gait parameters.
//  Provides MET estimation from walking speed and supports
//  6-Minute Walk Test (6MWT) and TUG protocol integration.
//
//  References:
//  - Compendium of Physical Activities (Ainsworth BE et al., 2011)
//  - ATS Statement: Guidelines for the Six-Minute Walk Test, 2002
//  - Bohannon RW, Phys Ther, 2006 (6MWT reference equations)
//  - Lusardi MM et al., JOSPT, 2003 (walk speed and function)
//

import Foundation

// MARK: - Results

/// Cardiovascular/metabolic estimates.
struct CardioEstimate: Sendable {
    /// Estimated METs (Metabolic Equivalent of Task).
    let estimatedMET: Double
    /// Activity intensity classification.
    let intensity: ActivityIntensity
    /// Walk ratio: step length (m) / cadence (steps/min).
    /// Normal ≈ 0.0064. Ref: Rota V et al., 2011.
    let walkRatio: Double
    /// Cost of Transport proxy (higher = less efficient).
    let costOfTransportProxy: Double
}

/// Physical activity intensity classification.
enum ActivityIntensity: String, Codable, Sendable {
    case sedentary      // < 1.5 METs
    case light          // 1.5-3.0 METs
    case moderate       // 3.0-6.0 METs
    case vigorous       // > 6.0 METs
}

/// 6-Minute Walk Test result.
struct SixMinuteWalkResult: Sendable {
    /// Total distance walked in meters.
    let distanceM: Double
    /// Predicted distance based on reference equations.
    let predictedDistanceM: Double?
    /// Percent of predicted.
    let percentPredicted: Double?
    /// Classification.
    let classification: String
}

/// Timed Up and Go result.
struct TUGResult: Sendable {
    /// Time in seconds.
    let timeSec: Double
    /// Fall risk classification.
    let fallRisk: FallRiskLevel
    /// Mobility classification.
    let mobilityLevel: String
}

// MARK: - Protocol

protocol CardioEstimator: AnyObject {
    /// Estimate MET and energy cost from gait parameters.
    func estimate(
        walkingSpeedMPS: Double,
        cadenceSPM: Double,
        strideLengthM: Double
    ) -> CardioEstimate

    /// Evaluate 6-Minute Walk Test distance.
    func evaluate6MWT(
        distanceM: Double,
        age: Int?,
        heightM: Double?,
        weightKg: Double?,
        sexIsMale: Bool?
    ) -> SixMinuteWalkResult

    /// Evaluate Timed Up and Go result.
    func evaluateTUG(timeSec: Double, age: Int?) -> TUGResult
}

// MARK: - Default Implementation

final class DefaultCardioEstimator: CardioEstimator {

    // MARK: - MET Estimation

    func estimate(
        walkingSpeedMPS: Double,
        cadenceSPM: Double,
        strideLengthM: Double
    ) -> CardioEstimate {

        // MET from walking speed using ACSM metabolic equation
        // VO2 (ml/kg/min) = 0.1 * speed(m/min) + 3.5
        // MET = VO2 / 3.5
        let speedMMin = walkingSpeedMPS * 60.0
        let vo2 = 0.1 * speedMMin + 3.5
        let met = vo2 / 3.5

        // Activity intensity classification (Ainsworth 2011)
        let intensity: ActivityIntensity
        switch met {
        case ..<1.5:
            intensity = .sedentary
        case 1.5..<3.0:
            intensity = .light
        case 3.0..<6.0:
            intensity = .moderate
        default:
            intensity = .vigorous
        }

        // Walk ratio
        let stepLength = strideLengthM / 2.0 // step ≈ stride/2
        let walkRatio = cadenceSPM > 0 ? stepLength / cadenceSPM : 0

        // Cost of Transport proxy (energy per unit distance)
        // Higher values indicate less efficient gait
        let cot = walkingSpeedMPS > 0.1 ? met / walkingSpeedMPS : 0

        return CardioEstimate(
            estimatedMET: met,
            intensity: intensity,
            walkRatio: walkRatio,
            costOfTransportProxy: cot
        )
    }

    // MARK: - 6MWT Evaluation

    func evaluate6MWT(
        distanceM: Double,
        age: Int?,
        heightM: Double?,
        weightKg: Double?,
        sexIsMale: Bool?
    ) -> SixMinuteWalkResult {

        // Predicted distance using Enright & Sherrill, 1998 reference equation
        var predicted: Double?
        if let age = age, let height = heightM, let weight = weightKg, let male = sexIsMale {
            let heightCm = height * 100
            if male {
                // Men: 6MWD = (7.57 × height_cm) – (5.02 × age) – (1.76 × weight_kg) – 309
                predicted = max(0, 7.57 * heightCm - 5.02 * Double(age) - 1.76 * weight - 309)
            } else {
                // Women: 6MWD = (2.11 × height_cm) – (2.29 × weight_kg) – (5.78 × age) + 667
                predicted = max(0, 2.11 * heightCm - 2.29 * weight - 5.78 * Double(age) + 667)
            }
        }

        let percentPredicted = predicted.flatMap { $0 > 0 ? (distanceM / $0) * 100 : nil }

        // Classification
        let classification: String
        if distanceM < 300 {
            classification = "Severely limited functional capacity"
        } else if distanceM < 400 {
            classification = "Moderate functional limitation"
        } else if distanceM < 500 {
            classification = "Mild limitation"
        } else {
            classification = "Normal functional capacity"
        }

        return SixMinuteWalkResult(
            distanceM: distanceM,
            predictedDistanceM: predicted,
            percentPredicted: percentPredicted,
            classification: classification
        )
    }

    // MARK: - TUG Evaluation

    func evaluateTUG(timeSec: Double, age: Int?) -> TUGResult {
        // Shumway-Cook A et al., Phys Ther, 2000
        let fallRisk: FallRiskLevel
        if timeSec > GaitThresholds.tugFallRisk {
            fallRisk = .high
        } else if timeSec > 10 {
            fallRisk = .moderate
        } else {
            fallRisk = .low
        }

        // Mobility classification
        let mobilityLevel: String
        if timeSec < 10 {
            mobilityLevel = "Freely mobile"
        } else if timeSec < 20 {
            mobilityLevel = "Mostly independent"
        } else if timeSec < 30 {
            mobilityLevel = "Variable mobility"
        } else {
            mobilityLevel = "Impaired mobility; assistive device may be needed"
        }

        return TUGResult(
            timeSec: timeSec,
            fallRisk: fallRisk,
            mobilityLevel: mobilityLevel
        )
    }
}
