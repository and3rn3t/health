//
//  PainRiskEngine.swift
//  Andernet Posture
//
//  Estimates pain risk by body region based on postural and gait deviations.
//  Maps biomechanical findings to anatomical regions with evidence-based
//  associations from musculoskeletal literature.
//
//  References:
//  - Kendall FP et al., Muscles: Testing and Function, 2005 (postural pain)
//  - Sahrmann S, Movement System Impairment Syndromes, 2002 (movement-pain)
//  - Cote P et al., Eur Spine J, 2008 (neck pain epidemiology)
//  - Hartvigsen J et al., Lancet, 2018 (low back pain)
//

import Foundation

// MARK: - Results

/// Pain risk alert for a specific body region.
struct PainRiskAlert: Codable, Sendable {
    let region: PainRiskRegion
    /// Risk level 0–100 (higher = more risk).
    let riskScore: Double
    /// Severity classification.
    let severity: ClinicalSeverity
    /// Contributing factors.
    let factors: [String]
    /// Evidence-based recommendation.
    let recommendation: String
}

/// Collection of pain risk assessments.
struct PainRiskAssessment: Sendable {
    let alerts: [PainRiskAlert]
    /// Overall musculoskeletal risk score (average of top 3).
    let overallRiskScore: Double
}

// MARK: - Protocol

protocol PainRiskEngine: AnyObject {
    // swiftlint:disable:next orphaned_doc_comment
    /// Assess pain risk from postural and gait metrics.
    // swiftlint:disable:next function_parameter_count
    func assess(
        craniovertebralAngleDeg: Double,
        sagittalVerticalAxisCm: Double,
        thoracicKyphosisDeg: Double,
        lumbarLordosisDeg: Double,
        shoulderAsymmetryCm: Double,
        pelvicObliquityDeg: Double,
        pelvicTiltDeg: Double,
        coronalSpineDeviationCm: Double,
        kneeFlexionStandingDeg: Double?,
        gaitAsymmetryPercent: Double?
    ) -> PainRiskAssessment
}

// MARK: - Default Implementation

final class DefaultPainRiskEngine: PainRiskEngine {

    // swiftlint:disable:next function_parameter_count
    func assess(
        craniovertebralAngleDeg: Double,
        sagittalVerticalAxisCm: Double,
        thoracicKyphosisDeg: Double,
        lumbarLordosisDeg: Double,
        shoulderAsymmetryCm: Double,
        pelvicObliquityDeg: Double,
        pelvicTiltDeg: Double,
        coronalSpineDeviationCm: Double,
        kneeFlexionStandingDeg: Double?,
        gaitAsymmetryPercent: Double?
    ) -> PainRiskAssessment {

        var alerts: [PainRiskAlert] = []

        // ── Neck ──
        let neckAlert = assessNeck(cva: craniovertebralAngleDeg, kyphosis: thoracicKyphosisDeg)
        alerts.append(neckAlert)

        // ── Shoulder ──
        let shoulderAlert = assessShoulder(
            asymmetry: shoulderAsymmetryCm, kyphosis: thoracicKyphosisDeg
        )
        alerts.append(shoulderAlert)

        // ── Upper Back ──
        let upperBackAlert = assessUpperBack(kyphosis: thoracicKyphosisDeg, sva: sagittalVerticalAxisCm)
        alerts.append(upperBackAlert)

        // ── Lower Back ──
        let lowerBackAlert = assessLowerBack(
            lordosis: lumbarLordosisDeg, sva: sagittalVerticalAxisCm,
            pelvicTilt: pelvicTiltDeg, scoliosis: coronalSpineDeviationCm
        )
        alerts.append(lowerBackAlert)

        // ── Hip ──
        let hipAlert = assessHip(
            pelvic: pelvicObliquityDeg, pelvicTilt: pelvicTiltDeg,
            gaitAsymmetry: gaitAsymmetryPercent
        )
        alerts.append(hipAlert)

        // ── Knee ──
        let kneeAlert = assessKnee(
            standingFlexion: kneeFlexionStandingDeg, gaitAsymmetry: gaitAsymmetryPercent
        )
        alerts.append(kneeAlert)

        // Overall: average of top 3 risk scores
        let topScores = alerts.map(\.riskScore).sorted(by: >).prefix(3)
        let overall = topScores.isEmpty ? 0 : topScores.reduce(0, +) / Double(topScores.count)

        return PainRiskAssessment(alerts: alerts, overallRiskScore: overall)
    }

    // MARK: - Region Assessments

    private func assessNeck(cva: Double, kyphosis: Double) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        // Forward head posture is the strongest predictor of neck pain
        if cva < 45 {
            risk += min(50, (45 - cva) * 3)
            factors.append("Forward head posture (CVA \(String(format: "%.0f", cva))°)")
        }

        // Compensatory cervical strain from kyphosis
        if kyphosis > 50 {
            risk += min(25, (kyphosis - 50) * 2)
            factors.append("Kyphosis-related cervical strain")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .neck, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Cervical retraction exercises; monitor workstation ergonomics" : "Continue monitoring"
        )
    }

    private func assessShoulder(asymmetry: Double, kyphosis: Double) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        if asymmetry > 2 {
            risk += min(40, (asymmetry - 2) * 10)
            factors.append("Shoulder height asymmetry (\(String(format: "%.1f", asymmetry)) cm)")
        }

        if kyphosis > 45 {
            risk += min(30, (kyphosis - 45) * 2)
            factors.append("Rounded shoulders from kyphosis")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .shoulder, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Scapular stabilization; pectoral stretching" : "Continue monitoring"
        )
    }

    private func assessUpperBack(kyphosis: Double, sva: Double) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        if kyphosis > 50 {
            risk += min(50, (kyphosis - 50) * 3)
            factors.append("Hyperkyphosis (\(String(format: "%.0f", kyphosis))°)")
        }

        if abs(sva) > 5 {
            risk += min(30, (abs(sva) - 5) * 5)
            factors.append("Sagittal imbalance (SVA \(String(format: "%.1f", sva)) cm)")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .upperBack, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Thoracic extension exercises; postural awareness training" : "Continue monitoring"
        )
    }

    private func assessLowerBack(lordosis: Double, sva: Double, pelvicTilt: Double, scoliosis: Double) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        // Hyper- or hypo-lordosis
        if lordosis > 60 {
            risk += min(30, (lordosis - 60) * 3)
            factors.append("Hyperlordosis (\(String(format: "%.0f", lordosis))°)")
        } else if lordosis < 30 {
            risk += min(30, (30 - lordosis) * 2)
            factors.append("Hypolordosis (\(String(format: "%.0f", lordosis))°)")
        }

        // Sagittal imbalance
        if abs(sva) > 7 {
            risk += min(25, (abs(sva) - 7) * 5)
            factors.append("Forward lean (SVA \(String(format: "%.1f", sva)) cm)")
        }

        // Pelvic tilt contribution
        if abs(pelvicTilt) > 10 {
            risk += min(20, (abs(pelvicTilt) - 10) * 2)
            factors.append("Pelvic tilt (\(String(format: "%.1f", pelvicTilt))°)")
        }

        // Scoliosis
        if scoliosis > 1.5 {
            risk += min(25, (scoliosis - 1.5) * 8)
            factors.append("Spinal asymmetry (\(String(format: "%.1f", scoliosis)) cm)")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .lowerBack, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Core stabilization; lumbar-pelvic alignment exercises" : "Continue monitoring"
        )
    }

    private func assessHip(pelvic: Double, pelvicTilt: Double, gaitAsymmetry: Double?) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        if abs(pelvic) > 3 {
            risk += min(40, (abs(pelvic) - 3) * 8)
            factors.append("Pelvic obliquity (\(String(format: "%.1f", abs(pelvic)))°)")
        }

        if abs(pelvicTilt) > 15 {
            risk += min(30, (abs(pelvicTilt) - 15) * 3)
            factors.append("Pelvic tilt (\(String(format: "%.1f", pelvicTilt))°)")
        }

        if let asym = gaitAsymmetry, asym > 15 {
            risk += min(30, (asym - 15) * 2)
            factors.append("Gait asymmetry (\(String(format: "%.0f", asym))%)")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .hip, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Hip abductor strengthening; pelvic alignment exercises" : "Continue monitoring"
        )
    }

    private func assessKnee(standingFlexion: Double?, gaitAsymmetry: Double?) -> PainRiskAlert {
        var risk = 0.0
        var factors: [String] = []

        if let flex = standingFlexion, flex > 10 {
            risk += min(40, (flex - 10) * 4)
            factors.append("Knee flexion in standing (\(String(format: "%.1f", flex))°)")
        }

        if let asym = gaitAsymmetry, asym > 15 {
            risk += min(30, (asym - 15) * 2)
            factors.append("Gait asymmetry (\(String(format: "%.0f", asym))%)")
        }

        risk = min(100, risk)
        return PainRiskAlert(
            region: .knee, riskScore: risk,
            severity: severity(from: risk),
            factors: factors,
            recommendation: risk > 40 ? "Quadriceps strengthening; gait retraining" : "Continue monitoring"
        )
    }

    // MARK: - Helpers

    private func severity(from score: Double) -> ClinicalSeverity {
        if score < 25 { return .normal }
        if score < 50 { return .mild }
        if score < 75 { return .moderate }
        return .severe
    }
}
