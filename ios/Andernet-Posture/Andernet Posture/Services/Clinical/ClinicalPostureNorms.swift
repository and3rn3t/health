//
//  ClinicalPostureNorms.swift
//  Andernet Posture
//
//  Clinical reference thresholds for posture and gait measurements.
//  All thresholds sourced from peer-reviewed literature with citations inline.
//

import Foundation

// MARK: - Severity Classification

/// Clinically-graded severity for any measured parameter.
enum ClinicalSeverity: String, Codable, Sendable, CaseIterable {
    case normal
    case mild
    case moderate
    case severe

    /// Color name for SwiftUI display (green / yellow / orange / red).
    var colorName: String {
        switch self {
        case .normal:   return "green"
        case .mild:     return "yellow"
        case .moderate: return "orange"
        case .severe:   return "red"
        }
    }

    /// Numeric ordinal for comparison (higher = worse).
    var ordinal: Int {
        switch self {
        case .normal:   return 0
        case .mild:     return 1
        case .moderate: return 2
        case .severe:   return 3
        }
    }

    /// Create from numeric ordinal.
    static func from(ordinal: Int) -> ClinicalSeverity {
        switch ordinal {
        case 0:  return .normal
        case 1:  return .mild
        case 2:  return .moderate
        default: return .severe
        }
    }
}

// MARK: - Postural Type (Kendall)

/// Kendall's four postural type classifications from plumb-line analysis.
/// Ref: Kendall FP et al., Muscles: Testing and Function with Posture and Pain, 5th ed., 2005.
enum PosturalType: String, Codable, Sendable {
    case ideal
    case kyphosisLordosis
    case flatBack
    case swayBack
}

// MARK: - NYPR Item

/// New York Posture Rating automatable items.
/// Ref: New York State Education Department Physical Fitness Test.
enum NYPRItem: String, CaseIterable, Sendable {
    case headTilt           // lateral head tilt
    case headRotation       // head rotation from midline
    case shoulderLevel      // shoulder height symmetry
    case cervicalScoliosis  // neck lateral deviation
    case thoracicKyphosis   // upper back curvature
    case trunkAlignment     // trunk midline alignment
    case shoulderProtraction // shoulders forward of ear
    case hipLevel           // pelvis/hip symmetry
    case kneeAlignment      // knee valgus/varus proxy

    /// Maximum possible score for all automatable items (5 pts each).
    static var maxAutomatableScore: Int { allCases.count * 5 }
}

// MARK: - Posture Thresholds

/// Central repository of clinical posture thresholds.
/// All values are absolute degrees or centimeters unless noted.
enum PostureThresholds {

    // MARK: Craniovertebral Angle (CVA)
    // Ref: Yip CH et al., Manual Therapy, 2008; Nemmers TM et al., J Geriatr Phys Ther, 2009.
    // Higher CVA = more upright head. Lower = more forward head posture.
    static let cvaNormal: ClosedRange<Double>   = 49...56
    static let cvaMild: ClosedRange<Double>     = 40...48
    static let cvaModerate: ClosedRange<Double> = 30...39
    // Severe: < 30°

    static func cvaSeverity(_ angle: Double) -> ClinicalSeverity {
        if angle >= 49 { return .normal }
        if angle >= 40 { return .mild }
        if angle >= 30 { return .moderate }
        return .severe
    }

    // MARK: Sagittal Vertical Axis (SVA)
    // Ref: Glassman SD et al., Spine, 2005; Schwab F et al., Spine, 2010.
    // Measured in cm. Positive = head forward of pelvis.
    static let svaNormalMax: Double = 5.0      // < 5 cm
    static let svaMildMax: Double = 7.0
    static let svaModerateMax: Double = 9.5
    // Severe: > 9.5 cm

    static func svaSeverity(_ cm: Double) -> ClinicalSeverity {
        let abs = Swift.abs(cm)
        if abs < 5.0 { return .normal }
        if abs < 7.0 { return .mild }
        if abs < 9.5 { return .moderate }
        return .severe
    }

    // MARK: Trunk Forward Lean (Sagittal)
    static let trunkForwardNormalMax: Double = 5.0
    static let trunkForwardMildMax: Double   = 10.0
    static let trunkForwardModerateMax: Double = 20.0

    static func trunkForwardSeverity(_ deg: Double) -> ClinicalSeverity {
        let abs = Swift.abs(deg)
        if abs <= 5 { return .normal }
        if abs <= 10 { return .mild }
        if abs <= 20 { return .moderate }
        return .severe
    }

    // MARK: Lateral Trunk Lean (Frontal)
    static let lateralLeanNormalMax: Double = 2.0
    static let lateralLeanMildMax: Double   = 5.0
    static let lateralLeanModerateMax: Double = 10.0

    static func lateralLeanSeverity(_ deg: Double) -> ClinicalSeverity {
        let abs = Swift.abs(deg)
        if abs <= 2 { return .normal }
        if abs <= 5 { return .mild }
        if abs <= 10 { return .moderate }
        return .severe
    }

    // MARK: Shoulder Asymmetry
    // Ref: Grosso C et al., 2002.
    static let shoulderCmNormalMax: Double = 1.5
    static let shoulderDegNormalMax: Double = 2.0

    static func shoulderSeverity(cm: Double) -> ClinicalSeverity {
        let abs = Swift.abs(cm)
        if abs <= 1.5 { return .normal }
        if abs <= 3.0 { return .mild }
        if abs <= 5.0 { return .moderate }
        return .severe
    }

    // MARK: Pelvic Obliquity
    // Ref: Al-Eisa E et al., BMC Musculoskelet Disord, 2006.
    static let pelvicNormalMax: Double = 1.0

    static func pelvicSeverity(_ deg: Double) -> ClinicalSeverity {
        let abs = Swift.abs(deg)
        if abs <= 1 { return .normal }
        if abs <= 3 { return .mild }
        if abs <= 5 { return .moderate }
        return .severe
    }

    // MARK: Thoracic Kyphosis (Proxy Cobb)
    // Ref: Fon GT et al., Radiology, 1980.
    static let kyphosisNormal: ClosedRange<Double> = 20...45
    static let kyphosisMildMax: Double = 55
    static let kyphosisModerateMax: Double = 70

    static func kyphosisSeverity(_ deg: Double) -> ClinicalSeverity {
        if kyphosisNormal.contains(deg) { return .normal }
        if deg < 20 { return deg < 10 ? .moderate : .mild }  // hypokyphosis
        if deg <= 55 { return .mild }
        if deg <= 70 { return .moderate }
        return .severe
    }

    // MARK: Lumbar Lordosis
    // Ref: Stagnara P et al.; Boos N & Aebi M, 2008.
    static let lordosisNormal: ClosedRange<Double> = 40...60

    static func lordosisSeverity(_ deg: Double) -> ClinicalSeverity {
        if lordosisNormal.contains(deg) { return .normal }
        if (25...40).contains(deg) || (60...70).contains(deg) { return .mild }
        if (20...25).contains(deg) || (70...80).contains(deg) { return .moderate }
        return .severe
    }

    // MARK: Coronal Scoliosis Proxy (max lateral deviation cm)
    static let scoliosisNormalMaxCm: Double = 1.0

    static func scoliosisSeverity(cm: Double) -> ClinicalSeverity {
        let abs = Swift.abs(cm)
        if abs <= 1.0 { return .normal }
        if abs <= 2.0 { return .mild }
        if abs <= 3.5 { return .moderate }
        return .severe
    }

    // MARK: - Composite Score Weights
    // Evidence-based weights: CVA + SVA strongest predictors of disability.
    // Ref: Glassman 2005 (SVA), Mahmoud 2019 (CVA), combined clinical judgment.
    // Lordosis and coronal deviation included for comprehensive assessment.
    static let compositeCVAWeight: Double        = 0.22
    static let compositeSVAWeight: Double        = 0.22
    static let compositeTrunkWeight: Double      = 0.13
    static let compositeLateralWeight: Double    = 0.08
    static let compositeShoulderWeight: Double   = 0.08
    static let compositeKyphosisWeight: Double   = 0.10
    static let compositePelvicWeight: Double     = 0.05
    static let compositeLordosisWeight: Double   = 0.07
    static let compositeCoronalWeight: Double    = 0.05

    /// Compute a sub-score for one parameter: 100 = ideal, 0 = at/beyond worst threshold.
    /// `measured`: the absolute value of the measurement.
    /// `idealTarget`: the ideal value (e.g. 52.5° for CVA).
    /// `maxDeviation`: the deviation from ideal at which the score is 0.
    static func subScore(measured: Double, idealTarget: Double, maxDeviation: Double) -> Double {
        guard maxDeviation > 0 else { return 100 }
        let deviation = abs(measured - idealTarget)
        return max(0, min(100, 100 * (1.0 - deviation / maxDeviation)))
    }
}

// MARK: - Gait Thresholds

enum GaitThresholds {

    // MARK: Walking Speed (m/s) — "The Sixth Vital Sign"
    // Ref: Studenski S et al., JAMA, 2011. Each 0.1 m/s increase → 12% decrease in mortality risk.
    static let speedNormal: ClosedRange<Double>  = 1.0...1.4
    static let speedFrailty: Double = 0.8           // Fried phenotype cutoff
    static let speedSevereLimitation: Double = 0.6  // Cesari et al., 2005
    static let speedHouseholdOnly: Double = 0.4     // Fritz & Lusardi, 2009

    static func speedSeverity(_ mps: Double) -> ClinicalSeverity {
        if mps >= 1.0 { return .normal }
        if mps >= 0.8 { return .mild }
        if mps >= 0.6 { return .moderate }
        return .severe
    }

    // MARK: Cadence (steps/min)
    // Ref: Hollman JH et al., Gait & Posture, 2011.
    static let cadenceNormal: ClosedRange<Double> = 100...130

    // MARK: Stride Length — normalized to height
    // Ref: Fritz S & Lusardi MM, J Geriatr Phys Ther, 2009.
    static let normalizedStrideLengthNormal: ClosedRange<Double> = 0.75...0.85
    static let normalizedStrideLengthAbnormal: Double = 0.60

    // MARK: Double Support Time (% of gait cycle)
    // Ref: Perry J, Gait Analysis, 1992; Hollman JH et al., 2011.
    static let doubleSupportNormal: ClosedRange<Double> = 20...30
    static let doubleSupportFallRisk: Double = 30.0

    // MARK: Stance / Swing Ratio
    // Ref: Perry J, 1992. Normal: ~60% stance, ~40% swing.
    static let stancePercentNormal: ClosedRange<Double> = 58...62
    static let swingPercentNormal: ClosedRange<Double>  = 38...42

    // MARK: Robinson Symmetry Index
    // Ref: Robinson RO et al., 1987. |L-R| / (0.5*(L+R)) * 100
    static let symmetryNormalMax: Double = 10.0   // < 10% = normal
    static let symmetryMildMax: Double   = 15.0

    static func symmetrySeverity(_ percent: Double) -> ClinicalSeverity {
        let abs = Swift.abs(percent)
        if abs <= 10 { return .normal }
        if abs <= 15 { return .mild }
        if abs <= 25 { return .moderate }
        return .severe
    }

    // MARK: Step Width (cm)
    // Ref: Brach JS et al., J Gerontol, 2005.
    static let stepWidthNormal: ClosedRange<Double> = 5...13
    static let stepWidthVariabilityFallRisk: Double = 2.5  // SD > 2.5 cm

    // MARK: Stride Time Variability (CV %)
    // Ref: Hausdorff JM et al., J Neuroengineering Rehab, 2005.
    static let strideTimeCVFallRisk: Double = 5.0  // CV > 5% predicts falls

    // MARK: Trunk Sway (degrees RMS, mediolateral)
    // Ref: Menz HB et al., J Gerontol, 2003.
    static let trunkSwayFallRisk: Double = 3.5  // > 3.5° RMS

    // MARK: TUG (seconds)
    // Ref: Shumway-Cook A et al., Phys Ther, 2000.
    static let tugFallRisk: Double = 13.5  // > 13.5 s predicts falls

    // MARK: Arm Swing Asymmetry (%)
    // Ref: Lewek MD et al., Gait & Posture, 2010.
    static let armSwingAsymmetryNormalMax: Double = 10.0  // > 10% may indicate neurological asymmetry

    // MARK: Walk Ratio (m / steps/min)
    // Ref: Rota V et al., Eur J Phys Rehab Med, 2011.
    static let walkRatioNormal: Double = 0.0064  // step length (m) / cadence (steps/min)
}

// MARK: - Joint ROM Norms (During Gait)

/// Normal ROM values during gait cycle.
/// Ref: Perry J & Burnfield JM, Gait Analysis: Normal and Pathological Function, 2010.
enum GaitROMLimits {
    // Hip (sagittal)
    static let hipFlexionNormal: ClosedRange<Double> = 30...40  // degrees
    static let hipExtensionNormal: ClosedRange<Double> = 10...15

    // Knee
    static let kneeFlexionSwingNormal: ClosedRange<Double> = 60...70
    static let kneeFlexionStanceNormal: ClosedRange<Double> = 0...15

    // Pelvic
    static let pelvicTiltNormal: Double = 5.0    // degrees anterior tilt
    static let pelvicTiltRange: Double = 4.0     // total range during cycle

    // Trunk rotation (transverse)
    static let trunkRotationPerSide: ClosedRange<Double> = 5...8  // degrees
    static let trunkRotationTotalArc: ClosedRange<Double> = 10...16

    /// Bilateral ROM asymmetry threshold for flagging imbalance.
    static let romAsymmetryThreshold: Double = 5.0  // degrees
}

// MARK: - Balance / Sway Norms

/// Postural sway norms for quiet standing.
/// Ref: Prieto TE et al., IEEE Trans BME, 1996; Piirtola M & Era P, Gerontology, 2006.
enum BalanceThresholds {
    // Sway velocity (mm/s)
    static let swayVelocityNormalYoung: ClosedRange<Double> = 5...10
    static let swayVelocityNormalElderly: ClosedRange<Double> = 10...20
    static let swayVelocityFallRisk: Double = 25.0

    // Sway area (cm², 95% confidence ellipse)
    static let swayAreaNormalYoung: ClosedRange<Double> = 0.5...1.5
    static let swayAreaNormalElderly: ClosedRange<Double> = 1.5...4.0
    static let swayAreaFallRisk: Double = 5.0

    // Romberg ratio (eyes closed / eyes open sway)
    // Ref: Agrawal Y et al., Otol Neurotol, 2011.
    static let rombergRatioNormalMax: Double = 2.0  // > 2.0 suggests proprioceptive/vestibular deficit
}

// MARK: - Fall Risk Composite

enum FallRiskLevel: String, Codable, Sendable {
    case low
    case moderate
    case high
}

// MARK: - Pain Risk Region

enum PainRiskRegion: String, Codable, Sendable {
    case neck
    case shoulder
    case upperBack
    case lowerBack
    case hip
    case knee
}

// MARK: - Crossed Syndrome

enum CrossedSyndromeType: String, Codable, Sendable {
    case upperCrossed   // Forward head + rounded shoulders + increased kyphosis
    case lowerCrossed   // Anterior pelvic tilt + increased lumbar lordosis
}

// MARK: - Gait Pattern

enum GaitPatternType: String, Codable, Sendable {
    case normal
    case antalgic       // short stance on painful side
    case trendelenburg  // contralateral pelvic drop
    case festinating    // rapid small steps — Parkinson's screen
    case circumduction  // lateral arc of leg in swing
    case ataxic         // irregular, wide-based
    case waddling       // bilateral Trendelenburg
    case stiffKnee      // reduced knee flexion ROM during swing — spastic/neurological
}

// MARK: - REBA Risk Level

enum REBARiskLevel: String, Codable, Sendable {
    case negligible     // 1
    case low            // 2-3
    case medium         // 4-7
    case high           // 8-10
    case veryHigh       // 11-15
}

// MARK: - Clinical Test Type

enum ClinicalTestType: String, Codable, Sendable {
    case timedUpAndGo           // TUG
    case romberg                // Balance eyes open/closed
    case sixMinuteWalk          // 6MWT
}
