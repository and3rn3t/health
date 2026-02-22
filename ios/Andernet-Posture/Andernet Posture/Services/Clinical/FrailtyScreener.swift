//
//  FrailtyScreener.swift
//  Andernet Posture
//
//  Fried Phenotype frailty screening using gait-derived markers.
//  5 criteria: unintentional weight loss, exhaustion, low physical activity,
//  slow walking speed, and weak grip strength.
//  We can screen 2 of 5 directly (gait speed, activity level proxy) and
//  provide proxy estimates for others.
//
//  References:
//  - Fried LP et al., J Gerontol, 2001 (frailty phenotype)
//  - Studenski S et al., JAMA, 2011 (gait speed as vitality marker)
//  - Cesari M et al., J Gerontol, 2005 (gait speed and disability)
//

import Foundation

// MARK: - Results

/// Frailty screening result.
struct FrailtyScreeningResult: Sendable {
    /// Number of Fried criteria met (0=robust, 1-2=pre-frail, 3+=frail).
    let friedScore: Int
    /// Classification.
    let classification: FrailtyClassification
    /// Per-criterion breakdown.
    let criteria: [FrialtyCriterion]
    /// Summary interpretation.
    let interpretation: String
}

/// Frailty classification per Fried phenotype.
enum FrailtyClassification: String, Codable, Sendable {
    case robust     // 0 criteria
    case preFrail   // 1-2 criteria
    case frail      // 3+ criteria
}

/// Individual frailty criterion result.
struct FrialtyCriterion: Sendable {
    let name: String
    let isMet: Bool
    let value: Double?
    let threshold: Double?
    let source: CriterionSource
}

/// How the criterion was assessed.
enum CriterionSource: String, Sendable {
    case measured       // directly measured from gait/motion data
    case proxy          // estimated from available data
    case selfReport     // requires user input (not automated)
    case unavailable    // cannot be assessed with current sensors
}

// MARK: - Protocol

protocol FrailtyScreener: AnyObject {
    /// Screen for frailty from available metrics.
    func screen(
        walkingSpeedMPS: Double?,
        heightM: Double?,
        sexIsMale: Bool?,
        age: Int?,
        sixMinuteWalkDistanceM: Double?,
        dailyStepCount: Double?,
        postureVariabilitySD: Double?,
        strideTimeCVPercent: Double?
    ) -> FrailtyScreeningResult
}

// MARK: - Default Implementation

final class DefaultFrailtyScreener: FrailtyScreener {

    func screen(
        walkingSpeedMPS: Double?,
        heightM: Double?,
        sexIsMale: Bool?,
        age: Int?,
        sixMinuteWalkDistanceM: Double?,
        dailyStepCount: Double?,
        postureVariabilitySD: Double?,
        strideTimeCVPercent: Double?
    ) -> FrailtyScreeningResult {

        var criteria: [FrialtyCriterion] = []
        var friedCount = 0

        // 1. Walking Speed (Fried criterion: slowness)
        // Sex- and height-stratified cutoffs from Fried et al., 2001
        let speedCriterion: FrialtyCriterion
        if let speed = walkingSpeedMPS {
            let threshold = slownessCutoff(heightM: heightM, isMale: sexIsMale)
            let isSlow = speed < threshold
            if isSlow { friedCount += 1 }
            speedCriterion = FrialtyCriterion(
                name: "Slowness (Gait Speed)",
                isMet: isSlow,
                value: speed,
                threshold: threshold,
                source: .measured
            )
        } else {
            speedCriterion = FrialtyCriterion(
                name: "Slowness (Gait Speed)",
                isMet: false, value: nil, threshold: nil,
                source: .unavailable
            )
        }
        criteria.append(speedCriterion)

        // 2. Low Physical Activity (proxy from daily steps)
        let activityCriterion: FrialtyCriterion
        if let steps = dailyStepCount {
            // Fried used kcal/week; WHO 2020 recommends ≥150 min moderate activity.
            // Proxy: < 3000 steps/day correlates with sedentary behavior.
            // Tudor-Locke C, Medicine & Science in Sports & Exercise, 2004.
            let threshold = 3000.0
            let isLow = steps < threshold
            if isLow { friedCount += 1 }
            activityCriterion = FrialtyCriterion(
                name: "Low Physical Activity",
                isMet: isLow,
                value: steps,
                threshold: threshold,
                source: .proxy
            )
        } else {
            activityCriterion = FrialtyCriterion(
                name: "Low Physical Activity",
                isMet: false, value: nil, threshold: nil,
                source: .unavailable
            )
        }
        criteria.append(activityCriterion)

        // 3. Exhaustion (proxy from gait fatigue indicators)
        let exhaustionCriterion: FrialtyCriterion
        if let variability = postureVariabilitySD, let cv = strideTimeCVPercent {
            // Proxy: high gait variability + high posture variability ≈ motor exhaustion
            let isExhausted = cv > 6.0 && variability > 5.0
            if isExhausted { friedCount += 1 }
            exhaustionCriterion = FrialtyCriterion(
                name: "Exhaustion",
                isMet: isExhausted,
                value: cv,
                threshold: 6.0,
                source: .proxy
            )
        } else {
            exhaustionCriterion = FrialtyCriterion(
                name: "Exhaustion",
                isMet: false, value: nil, threshold: nil,
                source: .selfReport
            )
        }
        criteria.append(exhaustionCriterion)

        // 4. Weakness (grip strength) — cannot measure with ARKit
        criteria.append(FrialtyCriterion(
            name: "Weakness (Grip Strength)",
            isMet: false, value: nil, threshold: nil,
            source: .unavailable
        ))

        // 5. Weight Loss — cannot measure with single session
        criteria.append(FrialtyCriterion(
            name: "Unintentional Weight Loss",
            isMet: false, value: nil, threshold: nil,
            source: .selfReport
        ))

        // Classification
        let classification: FrailtyClassification
        let interpretation: String
        switch friedCount {
        case 0:
            classification = .robust
            interpretation = "No frailty indicators detected from available data. "
                + "\(criteria.filter { $0.source == .unavailable || $0.source == .selfReport }.count) criteria require clinical assessment."
        case 1...2:
            classification = .preFrail
            interpretation = "Pre-frailty indicators present (\(friedCount) of 5 criteria). Consider comprehensive geriatric assessment."
        default:
            classification = .frail
            interpretation = "Multiple frailty indicators (\(friedCount) of 5). Recommend clinical evaluation by geriatrician."
        }

        return FrailtyScreeningResult(
            friedScore: friedCount,
            classification: classification,
            criteria: criteria,
            interpretation: interpretation
        )
    }

    // MARK: - Cutoffs

    /// Fried slowness cutoff stratified by sex and height.
    private func slownessCutoff(heightM: Double?, isMale: Bool?) -> Double {
        let male = isMale ?? true
        let height = heightM ?? 1.70

        // Fried et al., 2001, Table 3
        if male {
            return height <= 1.73 ? 0.65 : 0.76  // m/s (converted from 7m walk time)
        } else {
            return height <= 1.59 ? 0.65 : 0.76
        }
    }
}
