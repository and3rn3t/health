//
//  FallRiskAnalyzer.swift
//  Andernet Posture
//
//  Composite fall risk screening from multiple gait and balance parameters.
//  Each factor contributes a weighted sub-score to a 0–100 composite.
//
//  References:
//  - Hausdorff JM et al., J Neuroengineering Rehab, 2005 (stride time CV)
//  - Shumway-Cook A et al., Phys Ther, 2000 (TUG)
//  - Studenski S et al., JAMA, 2011 (gait speed)
//  - Brach JS et al., J Gerontol, 2005 (step width variability)
//  - Menz HB et al., J Gerontol, 2003 (trunk sway)
//

import Foundation

// MARK: - Results

/// Composite fall risk assessment.
struct FallRiskAssessment: Sendable {
    /// Overall fall risk score 0–100 (higher = more risk).
    let compositeScore: Double
    /// Categorical risk level.
    let riskLevel: FallRiskLevel
    /// Per-factor breakdown with scores and flags.
    let factorBreakdown: [FallRiskFactor]
    /// Number of risk factors flagged.
    let riskFactorCount: Int
}

/// Individual fall risk factor assessment.
struct FallRiskFactor: Sendable {
    let name: String
    let value: Double
    let threshold: Double
    let isElevated: Bool
    let weight: Double
    let subScore: Double  // 0 = no risk, 100 = maximum risk
}

// MARK: - Protocol

protocol FallRiskAnalyzer: AnyObject {
    /// Compute fall risk from session-level metrics.
    func assess(
        walkingSpeedMPS: Double?,
        strideTimeCVPercent: Double?,
        doubleSupportPercent: Double?,
        stepWidthVariabilityCm: Double?,
        swayVelocityMMS: Double?,
        stepAsymmetryPercent: Double?,
        tugTimeSec: Double?,
        footClearanceM: Double?
    ) -> FallRiskAssessment
}

// MARK: - Default Implementation

final class DefaultFallRiskAnalyzer: FallRiskAnalyzer {

    /// Factor weights (sum = 1.0). Gait speed and stride variability are strongest predictors.
    private struct Weights {
        static let gaitSpeed: Double       = 0.25
        static let strideTimeCV: Double    = 0.20
        static let doubleSupport: Double   = 0.10
        static let stepWidthVar: Double    = 0.10
        static let trunkSway: Double       = 0.10
        static let stepAsymmetry: Double   = 0.10
        static let tug: Double             = 0.10
        static let footClearance: Double   = 0.05
    }

    // swiftlint:disable:next function_body_length
    func assess(
        walkingSpeedMPS: Double?,
        strideTimeCVPercent: Double?,
        doubleSupportPercent: Double?,
        stepWidthVariabilityCm: Double?,
        swayVelocityMMS: Double?,
        stepAsymmetryPercent: Double?,
        tugTimeSec: Double?,
        footClearanceM: Double?
    ) -> FallRiskAssessment {

        var factors: [FallRiskFactor] = []

        // 1. Gait speed — lower is riskier
        if let speed = walkingSpeedMPS {
            let threshold = GaitThresholds.speedFrailty
            let subScore = speed < threshold
                ? min(100, (1.0 - speed / threshold) * 100)
                : max(0, (1.0 - (speed - threshold) / 0.6) * 30) // partial credit above threshold
            factors.append(FallRiskFactor(
                name: "Gait Speed", value: speed, threshold: threshold,
                isElevated: speed < threshold, weight: Weights.gaitSpeed,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 2. Stride time variability (CV%) — higher is riskier
        if let cv = strideTimeCVPercent {
            let threshold = GaitThresholds.strideTimeCVFallRisk
            let subScore = cv > threshold
                ? min(100, (cv - threshold) / threshold * 100 + 50)
                : cv / threshold * 50
            factors.append(FallRiskFactor(
                name: "Stride Variability", value: cv, threshold: threshold,
                isElevated: cv > threshold, weight: Weights.strideTimeCV,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 3. Double support time — higher is riskier
        if let ds = doubleSupportPercent {
            let threshold = GaitThresholds.doubleSupportFallRisk
            let subScore = ds > threshold
                ? min(100, (ds - threshold) / 20 * 100 + 50)
                : max(0, (ds - 20) / (threshold - 20) * 50)
            factors.append(FallRiskFactor(
                name: "Double Support", value: ds, threshold: threshold,
                isElevated: ds > threshold, weight: Weights.doubleSupport,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 4. Step width variability — higher is riskier
        if let swVar = stepWidthVariabilityCm {
            let threshold = GaitThresholds.stepWidthVariabilityFallRisk
            let subScore = swVar > threshold
                ? min(100, (swVar - threshold) / threshold * 100 + 50)
                : swVar / threshold * 50
            factors.append(FallRiskFactor(
                name: "Step Width Variability", value: swVar, threshold: threshold,
                isElevated: swVar > threshold, weight: Weights.stepWidthVar,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 5. Trunk sway — higher is riskier
        if let sway = swayVelocityMMS {
            let threshold = BalanceThresholds.swayVelocityFallRisk
            let subScore = sway > threshold
                ? min(100, (sway - threshold) / threshold * 100 + 50)
                : sway / threshold * 50
            factors.append(FallRiskFactor(
                name: "Trunk Sway", value: sway, threshold: threshold,
                isElevated: sway > threshold, weight: Weights.trunkSway,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 6. Step asymmetry
        if let asym = stepAsymmetryPercent {
            let threshold = GaitThresholds.symmetryNormalMax
            let subScore = asym > threshold
                ? min(100, (asym - threshold) / 20 * 100 + 50)
                : asym / threshold * 50
            factors.append(FallRiskFactor(
                name: "Step Asymmetry", value: asym, threshold: threshold,
                isElevated: asym > threshold, weight: Weights.stepAsymmetry,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 7. TUG time — higher is riskier
        if let tug = tugTimeSec {
            let threshold = GaitThresholds.tugFallRisk
            let subScore = tug > threshold
                ? min(100, (tug - threshold) / 10 * 100 + 50)
                : tug / threshold * 50
            factors.append(FallRiskFactor(
                name: "TUG Time", value: tug, threshold: threshold,
                isElevated: tug > threshold, weight: Weights.tug,
                subScore: max(0, min(100, subScore))
            ))
        }

        // 8. Foot clearance — lower is riskier
        if let clearance = footClearanceM {
            let threshold = 0.02 // 2cm minimum clearance
            let subScore = clearance < threshold
                ? min(100, (1.0 - clearance / threshold) * 100)
                : max(0, (1.0 - (clearance - threshold) / 0.05) * 30)
            factors.append(FallRiskFactor(
                name: "Foot Clearance", value: clearance * 100,  // display in cm
                threshold: threshold * 100,
                isElevated: clearance < threshold, weight: Weights.footClearance,
                subScore: max(0, min(100, subScore))
            ))
        }

        // Composite: weighted sum, normalized by total available weight.
        // Require minimum 3 factors for reliable composite; otherwise report uncertainty.
        let totalWeight = factors.reduce(0.0) { $0 + $1.weight }
        let composite: Double
        if totalWeight > 0 {
            let rawComposite = factors.reduce(0.0) { $0 + $1.subScore * $1.weight } / totalWeight
            // Scale confidence by factor coverage to avoid inflating risk from sparse data.
            // With fewer than 3 factors, attenuate the composite proportionally.
            let coverageFraction = min(1.0, Double(factors.count) / 3.0)
            composite = rawComposite * coverageFraction
        } else {
            composite = 0
        }

        let riskCount = factors.filter(\.isElevated).count

        // Classify
        let level: FallRiskLevel
        if composite >= 60 || riskCount >= 4 {
            level = .high
        } else if composite >= 30 || riskCount >= 2 {
            level = .moderate
        } else {
            level = .low
        }

        return FallRiskAssessment(
            compositeScore: min(100, max(0, composite)),
            riskLevel: level,
            factorBreakdown: factors,
            riskFactorCount: riskCount
        )
    }
}
