//
//  CrossedSyndromeDetector.swift
//  Andernet Posture
//
//  Detects Janda's Upper and Lower Crossed Syndromes from postural markers.
//
//  Upper Crossed: Forward head + rounded shoulders + increased kyphosis + tight pectorals
//  Lower Crossed: Anterior pelvic tilt + increased lumbar lordosis + weak glutes
//
//  References:
//  - Janda V, Muscles and Motor Control in Cervicogenic Disorders, 1994
//  - Page P et al., Assessment and Treatment of Muscle Imbalance, 2010
//

import Foundation

// MARK: - Results

/// Crossed syndrome detection result.
struct CrossedSyndromeResult: Sendable {
    /// Upper crossed syndrome score (0–100). Higher = more evident.
    let upperCrossedScore: Double
    /// Lower crossed syndrome score (0–100).
    let lowerCrossedScore: Double
    /// Detected syndrome types.
    let detectedSyndromes: [CrossedSyndromeType]
    /// Contributing factors for each syndrome.
    let upperFactors: [String]
    let lowerFactors: [String]
}

// MARK: - Protocol

protocol CrossedSyndromeDetecting: AnyObject {
    /// Detect crossed syndromes from averaged posture metrics.
    func detect(
        craniovertebralAngleDeg: Double,
        shoulderProtractionCm: Double,
        thoracicKyphosisDeg: Double,
        cervicalLordosisDeg: Double?,
        pelvicTiltDeg: Double,
        lumbarLordosisDeg: Double,
        hipFlexionRestDeg: Double?
    ) -> CrossedSyndromeResult
}

// MARK: - Default Implementation

final class DefaultCrossedSyndromeDetector: CrossedSyndromeDetecting {

    func detect(
        craniovertebralAngleDeg: Double,
        shoulderProtractionCm: Double,
        thoracicKyphosisDeg: Double,
        cervicalLordosisDeg: Double?,
        pelvicTiltDeg: Double,
        lumbarLordosisDeg: Double,
        hipFlexionRestDeg: Double?
    ) -> CrossedSyndromeResult {

        // ── Upper Crossed Syndrome ──
        var upperScore = 0.0
        var upperFactors: [String] = []

        // Forward head posture (low CVA)
        if craniovertebralAngleDeg < 45 {
            let contribution = min(30, (45 - craniovertebralAngleDeg) * 2)
            upperScore += contribution
            upperFactors.append("Forward head (CVA \(String(format: "%.1f", craniovertebralAngleDeg))°)")
        }

        // Shoulder protraction (shoulders forward of C7)
        if shoulderProtractionCm > 2 {
            let contribution = min(25, (shoulderProtractionCm - 2) * 5)
            upperScore += contribution
            upperFactors.append("Shoulder protraction (\(String(format: "%.1f", shoulderProtractionCm)) cm)")
        }

        // Increased thoracic kyphosis
        if thoracicKyphosisDeg > 45 {
            let contribution = min(25, (thoracicKyphosisDeg - 45) * 2)
            upperScore += contribution
            upperFactors.append("Increased kyphosis (\(String(format: "%.1f", thoracicKyphosisDeg))°)")
        }

        // Cervical hyperlordosis (compensatory)
        if let cervLord = cervicalLordosisDeg, cervLord > 20 {
            let contribution = min(20, (cervLord - 20) * 2)
            upperScore += contribution
            upperFactors.append("Cervical hyperlordosis (\(String(format: "%.1f", cervLord))°)")
        }

        upperScore = min(100, upperScore)

        // ── Lower Crossed Syndrome ──
        var lowerScore = 0.0
        var lowerFactors: [String] = []

        // Anterior pelvic tilt (positive = anterior)
        if pelvicTiltDeg > 10 {
            let contribution = min(35, (pelvicTiltDeg - 10) * 3)
            lowerScore += contribution
            lowerFactors.append("Anterior pelvic tilt (\(String(format: "%.1f", pelvicTiltDeg))°)")
        }

        // Lumbar hyperlordosis
        if lumbarLordosisDeg > 60 {
            let contribution = min(35, (lumbarLordosisDeg - 60) * 2.5)
            lowerScore += contribution
            lowerFactors.append("Lumbar hyperlordosis (\(String(format: "%.1f", lumbarLordosisDeg))°)")
        }

        // Hip flexor tightness proxy (resting hip flexion > 0 = tight)
        if let hipFlex = hipFlexionRestDeg, hipFlex > 5 {
            let contribution = min(30, (hipFlex - 5) * 3)
            lowerScore += contribution
            lowerFactors.append("Hip flexor tightness (\(String(format: "%.1f", hipFlex))°)")
        }

        lowerScore = min(100, lowerScore)

        // Determine syndromes
        var syndromes: [CrossedSyndromeType] = []
        if upperScore >= 40 { syndromes.append(.upperCrossed) }
        if lowerScore >= 40 { syndromes.append(.lowerCrossed) }

        return CrossedSyndromeResult(
            upperCrossedScore: upperScore,
            lowerCrossedScore: lowerScore,
            detectedSyndromes: syndromes,
            upperFactors: upperFactors,
            lowerFactors: lowerFactors
        )
    }
}
