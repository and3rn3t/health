// swiftlint:disable file_length
//
//  SessionAnalysisSummary.swift
//  Andernet Posture
//
//  Produces a ranked overall analysis of a session, highlighting all
//  out-of-range values with likely causes and corrective recommendations.
//

import Foundation

// MARK: - AbnormalFinding

/// A single metric that falls outside its normal range, with clinical context.
struct AbnormalFinding: Identifiable, Sendable {
    let id = UUID()
    let metric: String
    /// Plain-English name for people unfamiliar with clinical terms.
    var plainName: String = ""
    /// What this metric means in everyday language.
    var whatItMeans: String = ""
    let value: String
    let normalRange: String
    let severity: ClinicalSeverity
    let likelyCauses: [String]
    let recommendation: String
    let exerciseConditionKey: String?

    /// Exercises this finding maps to.
    var exercises: [ExerciseRecommendation] {
        guard let key = exerciseConditionKey else { return [] }
        return ExerciseLibrary.exercises(for: key)
    }

    /// Numeric severity rank for sorting (higher = worse).
    var sortRank: Int {
        switch severity {
        case .severe:   return 4
        case .moderate: return 3
        case .mild:     return 2
        case .normal:   return 1
        }
    }
}

// MARK: - Session Analysis

/// Complete session analysis result displayed at the top of the session card.
struct SessionAnalysis: Sendable {
    let overallAssessment: String
    let findings: [AbnormalFinding]      // sorted severe → mild
    let normalCount: Int                 // how many metrics are within normal range
    let totalEvaluated: Int              // total metrics checked
    let overallSeverity: ClinicalSeverity

    var abnormalCount: Int { findings.count }

    /// Percentage of metrics within normal range.
    var normalPercentage: Int {
        guard totalEvaluated > 0 else { return 100 }
        return Int((Double(normalCount) / Double(totalEvaluated)) * 100)
    }
}

// MARK: - SessionAnalysisEngine

/// Evaluates a GaitSession against clinical norms and produces a ranked analysis.
enum SessionAnalysisEngine {

    static func analyze(session s: GaitSession) -> SessionAnalysis {
        var findings: [AbnormalFinding] = []
        var normalCount = 0
        var totalEvaluated = 0

        evaluatePosture(s, findings: &findings, normal: &normalCount, total: &totalEvaluated)
        evaluateGait(s, findings: &findings, normal: &normalCount, total: &totalEvaluated)
        evaluateBalance(s, findings: &findings, normal: &normalCount, total: &totalEvaluated)
        evaluateRisk(s, findings: &findings, normal: &normalCount, total: &totalEvaluated)

        // Auto-populate plain-English names and explanations from the glossary.
        for i in findings.indices {
            if let entry = ClinicalGlossary.entry(for: findings[i].metric) {
                findings[i].plainName = entry.plainName
                findings[i].whatItMeans = entry.explanation
            }
        }

        let sortedFindings = findings.sorted {
            $0.sortRank != $1.sortRank ? $0.sortRank > $1.sortRank : $0.metric < $1.metric
        }
        let worstSeverity = sortedFindings.first?.severity ?? .normal

        return SessionAnalysis(
            overallAssessment: generateOverallAssessment(
                findings: sortedFindings, normalCount: normalCount, totalEvaluated: totalEvaluated
            ),
            findings: sortedFindings,
            normalCount: normalCount,
            totalEvaluated: totalEvaluated,
            overallSeverity: worstSeverity
        )
    }
}

// MARK: - Posture Evaluations

private extension SessionAnalysisEngine {

    static func evaluatePosture(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let cva = s.averageCVADeg {
            total += 1
            let sev = PostureThresholds.cvaSeverity(cva)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Craniovertebral Angle (CVA)",
                    value: String(format: "%.1f°", cva),
                    normalRange: "49–56°",
                    severity: sev,
                    likelyCauses: [
                        "Prolonged screen use or desk work with head forward",
                        "Weakness of deep cervical flexor muscles",
                        "Tight upper trapezius and suboccipital muscles",
                        "Poor workstation ergonomics (monitor too low)"
                    ],
                    recommendation: "Chin tucks and cervical retraction exercises strengthen "
                        + "deep neck flexors and restore head-over-shoulders alignment.",
                    exerciseConditionKey: "forwardHeadPosture"
                ))
            } else { normal += 1 }
        }

        if let sva = s.averageSVACm {
            total += 1
            let sev = PostureThresholds.svaSeverity(sva)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Sagittal Vertical Axis (SVA)",
                    value: String(format: "%.1f cm", sva),
                    normalRange: "< 5 cm",
                    severity: sev,
                    likelyCauses: [
                        "Tight hip flexors pulling pelvis into anterior tilt",
                        "Weak spinal extensor muscles (erector spinae)",
                        "Degenerative disc changes reducing lordosis",
                        "Compensatory forward lean from flexion contracture"
                    ],
                    recommendation: "Strengthen back extensors with prone exercises and "
                        + "stretch hip flexors to restore sagittal balance.",
                    exerciseConditionKey: "sagittalImbalance"
                ))
            } else { normal += 1 }
        }

        evaluateTrunkAndLateral(s, findings: &findings, normal: &normal, total: &total)
        evaluateSpinalCurvature(s, findings: &findings, normal: &normal, total: &total)
        evaluateAsymmetry(s, findings: &findings, normal: &normal, total: &total)
    }

    static func evaluateTrunkAndLateral(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let trunk = s.averageTrunkLeanDeg {
            total += 1
            let sev = PostureThresholds.trunkForwardSeverity(trunk)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Trunk Forward Lean",
                    value: String(format: "%.1f°", trunk),
                    normalRange: "< 5°",
                    severity: sev,
                    likelyCauses: [
                        "Weak core and gluteal muscles",
                        "Tight hip flexors (iliopsoas)",
                        "Compensatory leaning due to balance deficits",
                        "Habitual slouching during standing or walking"
                    ],
                    recommendation: "Core stabilization, hip flexor stretching, and "
                        + "postural awareness training can reduce forward lean.",
                    exerciseConditionKey: "sagittalImbalance"
                ))
            } else { normal += 1 }
        }

        if let lateral = s.averageLateralLeanDeg {
            total += 1
            let sev = PostureThresholds.lateralLeanSeverity(lateral)
            if sev != .normal {
                let dir = lateral > 0 ? "right" : "left"
                findings.append(AbnormalFinding(
                    metric: "Lateral Trunk Lean",
                    value: String(format: "%.1f° %@", abs(lateral), dir),
                    normalRange: "< 2°",
                    severity: sev,
                    likelyCauses: [
                        "Hip abductor weakness (Trendelenburg pattern)",
                        "Leg length discrepancy",
                        "Unilateral pain avoidance (antalgic lean)",
                        "Scoliotic curvature or habitual asymmetric posture"
                    ],
                    recommendation: "Strengthen hip abductors bilaterally and "
                        + "practice symmetrical weight-bearing.",
                    exerciseConditionKey: "shoulderAsymmetry"
                ))
            } else { normal += 1 }
        }
    }

    static func evaluateSpinalCurvature(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let kyphosis = s.averageThoracicKyphosisDeg {
            total += 1
            let sev = PostureThresholds.kyphosisSeverity(kyphosis)
            if sev != .normal {
                let excessive = kyphosis > 45
                findings.append(AbnormalFinding(
                    metric: "Thoracic Kyphosis",
                    value: String(format: "%.1f°", kyphosis),
                    normalRange: "20–45°",
                    severity: sev,
                    likelyCauses: excessive ? [
                        "Prolonged seated posture with rounded shoulders",
                        "Tight pectoral muscles pulling shoulders forward",
                        "Weak lower trapezius and rhomboid muscles",
                        "Age-related spinal changes or osteoporotic compression"
                    ] : [
                        "Flat-back posture or military posture pattern",
                        "Reduced thoracic mobility",
                        "Excess erector spinae activation"
                    ],
                    recommendation: excessive
                        ? "Thoracic extension exercises and pectoral stretching can reduce excessive rounding."
                        : "Spinal mobility exercises (cat-cow) can restore normal thoracic curvature.",
                    exerciseConditionKey: excessive ? "thoracicKyphosis" : "postureDecline"
                ))
            } else { normal += 1 }
        }

        if let lordosis = s.averageLumbarLordosisDeg {
            total += 1
            let sev = PostureThresholds.lordosisSeverity(lordosis)
            if sev != .normal {
                let excessive = lordosis > 60
                findings.append(AbnormalFinding(
                    metric: "Lumbar Lordosis",
                    value: String(format: "%.1f°", lordosis),
                    normalRange: "40–60°",
                    severity: sev,
                    likelyCauses: excessive ? [
                        "Tight hip flexors increasing anterior pelvic tilt",
                        "Weak abdominals (especially transverse abdominis)",
                        "Pregnancy or increased abdominal mass",
                        "Kyphotic-lordotic postural pattern"
                    ] : [
                        "Tight hamstrings pulling pelvis into posterior tilt",
                        "Flat-back postural pattern",
                        "Disc pathology reducing lumbar curve",
                        "Excessive core bracing or guarding"
                    ],
                    recommendation: excessive
                        ? "Strengthen core muscles and stretch hip flexors to reduce anterior pelvic tilt."
                        : "Stretch hamstrings and practice pelvic neutral positioning exercises.",
                    exerciseConditionKey: "postureDecline"
                ))
            } else { normal += 1 }
        }

        if let coronal = s.averageCoronalDeviationCm {
            total += 1
            let sev = PostureThresholds.scoliosisSeverity(cm: coronal)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Coronal Spine Deviation",
                    value: String(format: "%.1f cm", coronal),
                    normalRange: "< 1 cm",
                    severity: sev,
                    likelyCauses: [
                        "Structural or functional scoliosis",
                        "Muscle guarding from unilateral pain",
                        "Leg length discrepancy affecting spinal alignment",
                        "Neuromuscular asymmetry"
                    ],
                    recommendation: "Consult a healthcare provider. Core stabilization "
                        + "and symmetry exercises may help functional causes.",
                    exerciseConditionKey: "postureDecline"
                ))
            } else { normal += 1 }
        }
    }

    static func evaluateAsymmetry(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let shoulder = s.averageShoulderAsymmetryCm {
            total += 1
            let sev = PostureThresholds.shoulderSeverity(cm: shoulder)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Shoulder Asymmetry",
                    value: String(format: "%.1f cm", shoulder),
                    normalRange: "< 1.5 cm",
                    severity: sev,
                    likelyCauses: [
                        "Dominant-side muscle hypertrophy or overuse",
                        "Carrying bags or children on one side",
                        "Scoliosis or vertebral rotation",
                        "Unilateral upper trapezius tightness or weakness"
                    ],
                    recommendation: "Balanced shoulder blade exercises and "
                        + "avoid habitual asymmetric loading.",
                    exerciseConditionKey: "shoulderAsymmetry"
                ))
            } else { normal += 1 }
        }

        if let pelvic = s.averagePelvicObliquityDeg {
            total += 1
            let sev = PostureThresholds.pelvicSeverity(pelvic)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Pelvic Obliquity",
                    value: String(format: "%.1f°", abs(pelvic)),
                    normalRange: "< 1°",
                    severity: sev,
                    likelyCauses: [
                        "Gluteus medius weakness on the higher side",
                        "Functional or anatomical leg length discrepancy",
                        "Habitual standing on one leg",
                        "Hip joint pathology (labral tear, OA)"
                    ],
                    recommendation: "Hip stabilization exercises (clam shells, "
                        + "lateral band walks) and symmetrical weight-bearing.",
                    exerciseConditionKey: "pelvicObliquity"
                ))
            } else { normal += 1 }
        }
    }
}

// MARK: - Gait Evaluations

private extension SessionAnalysisEngine {

    static func evaluateGait(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let speed = s.averageWalkingSpeedMPS, speed > 0 {
            total += 1
            let sev = GaitThresholds.speedSeverity(speed)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Walking Speed",
                    value: String(format: "%.2f m/s", speed),
                    normalRange: "≥ 1.0 m/s",
                    severity: sev,
                    likelyCauses: [
                        "Reduced lower extremity strength",
                        "Fear of falling or balance insecurity",
                        "Pain-limited gait (joint or muscular)",
                        "Deconditioning from reduced physical activity"
                    ],
                    recommendation: "Lower body strengthening (sit-to-stands, "
                        + "heel raises) and walking interval training.",
                    exerciseConditionKey: "lowWalkingSpeed"
                ))
            } else { normal += 1 }
        }

        if let sym = s.gaitAsymmetryPercent {
            total += 1
            let sev = GaitThresholds.symmetrySeverity(sym)
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Gait Asymmetry",
                    value: String(format: "%.1f%%", sym),
                    normalRange: "< 10%",
                    severity: sev,
                    likelyCauses: [
                        "Unilateral lower extremity weakness",
                        "Pain avoidance on one side (antalgic gait)",
                        "Leg length discrepancy",
                        "Hip or knee joint pathology"
                    ],
                    recommendation: "Single-leg strengthening and balance training "
                        + "on the weaker side to restore step symmetry.",
                    exerciseConditionKey: "gaitAsymmetry"
                ))
            } else { normal += 1 }
        }

        if let cadence = s.averageCadenceSPM {
            total += 1
            if !GaitThresholds.cadenceNormal.contains(cadence) {
                let isLow = cadence < 100
                findings.append(AbnormalFinding(
                    metric: "Cadence",
                    value: String(format: "%.0f SPM", cadence),
                    normalRange: "100–130 SPM",
                    severity: .mild,
                    likelyCauses: isLow ? [
                        "Guarded or cautious gait pattern",
                        "Pain during walking",
                        "Reduced mobility or stiffness",
                        "Fear of falling"
                    ] : [
                        "Short stride length compensated by rapid stepping",
                        "Shuffling gait pattern",
                        "Parkinsonian gait characteristics"
                    ],
                    recommendation: isLow
                        ? "Focus on comfortable walking with natural arm swing."
                        : "Work on increasing stride length via hip flexor stretching.",
                    exerciseConditionKey: "lowWalkingSpeed"
                ))
            } else { normal += 1 }
        }
    }
}

// MARK: - Balance Evaluations

private extension SessionAnalysisEngine {

    static func evaluateBalance(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let sway = s.averageSwayVelocityMMS {
            total += 1
            if sway > BalanceThresholds.swayVelocityFallRisk {
                findings.append(AbnormalFinding(
                    metric: "Sway Velocity",
                    value: String(format: "%.1f mm/s", sway),
                    normalRange: "< 25 mm/s",
                    severity: .severe,
                    likelyCauses: [
                        "Vestibular dysfunction",
                        "Peripheral neuropathy (reduced proprioception)",
                        "Ankle strategy impairment",
                        "Visual dependence for balance"
                    ],
                    recommendation: "Balance training (tandem walking, single-leg stance) "
                        + "and healthcare evaluation recommended.",
                    exerciseConditionKey: "fallRisk"
                ))
            } else { normal += 1 }
        }
    }
}

// MARK: - Risk Evaluations

private extension SessionAnalysisEngine {

    static func evaluateRisk(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let fallRisk = s.fallRiskScore, let level = s.fallRiskLevel {
            total += 1
            let sev: ClinicalSeverity = level == "low"
                ? .normal : level == "moderate" ? .moderate : .severe
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Fall Risk",
                    value: String(format: "%.0f/100 (%@)", fallRisk, level.capitalized),
                    normalRange: "Low (< 30)",
                    severity: sev,
                    likelyCauses: [
                        "Reduced gait speed, increased sway, and asymmetry",
                        "Muscle weakness in lower extremities",
                        "Medication effects (sedatives, antihypertensives)",
                        "Environmental hazards (loose rugs, poor lighting)"
                    ],
                    recommendation: "Prioritize balance and strength exercises. "
                        + "Review medications and home safety with your provider.",
                    exerciseConditionKey: "fallRisk"
                ))
            } else { normal += 1 }
        }

        if let fatigue = s.fatigueIndex {
            total += 1
            let sev: ClinicalSeverity = fatigue < 25 ? .normal
                : fatigue < 50 ? .mild : fatigue < 75 ? .moderate : .severe
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Fatigue Index",
                    value: String(format: "%.0f/100", fatigue),
                    normalRange: "< 25",
                    severity: sev,
                    likelyCauses: [
                        "Weak postural stabilizer muscles",
                        "Deconditioning or low fitness baseline",
                        "Session duration exceeding endurance capacity",
                        "Sleep deprivation or systemic fatigue"
                    ],
                    recommendation: "Build postural endurance gradually. "
                        + "Diaphragmatic breathing reduces compensatory tension.",
                    exerciseConditionKey: "fatigue"
                ))
            } else { normal += 1 }
        }

        if let reba = s.rebaScore {
            total += 1
            let sev: ClinicalSeverity = reba <= 3 ? .normal
                : reba <= 7 ? .moderate : .severe
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "REBA Score (Ergonomic Risk)",
                    value: "\(reba)/15",
                    normalRange: "1–3 (Low risk)",
                    severity: sev,
                    likelyCauses: [
                        "Sustained awkward postures during daily activities",
                        "Poor workstation setup (desk, chair, monitor height)",
                        "Repetitive movements without microbreaks",
                        "Heavy or asymmetric loads"
                    ],
                    recommendation: "Take microbreaks every 30 minutes and review "
                        + "workstation ergonomics.",
                    exerciseConditionKey: "ergonomicRisk"
                ))
            } else { normal += 1 }
        }

        evaluateClinicalTests(s, findings: &findings, normal: &normal, total: &total)
    }

    static func evaluateClinicalTests(
        _ s: GaitSession,
        findings: inout [AbnormalFinding],
        normal: inout Int,
        total: inout Int
    ) {
        if let tug = s.tugTimeSec {
            total += 1
            let sev: ClinicalSeverity = tug <= 10
                ? .normal : tug <= GaitThresholds.tugFallRisk ? .mild : .severe
            if sev != .normal {
                findings.append(AbnormalFinding(
                    metric: "Timed Up & Go",
                    value: String(format: "%.1f sec", tug),
                    normalRange: "< 10 sec",
                    severity: sev,
                    likelyCauses: [
                        "Reduced lower extremity strength",
                        "Balance impairment during transitions",
                        "Decreased gait speed",
                        "Cognitive or dual-task interference"
                    ],
                    recommendation: "Practice sit-to-stand transitions and turning drills.",
                    exerciseConditionKey: "fallRisk"
                ))
            } else { normal += 1 }
        }

        if let frailty = s.frailtyScore, frailty > 0 {
            total += 1
            let sev: ClinicalSeverity = frailty <= 2 ? .mild : .severe
            let label = frailty <= 2 ? "Pre-frail" : "Frail"
            findings.append(AbnormalFinding(
                metric: "Frailty (Fried)",
                value: "\(frailty)/5 (\(label))",
                normalRange: "0 (Robust)",
                severity: sev,
                likelyCauses: [
                    "Unintentional weight loss or sarcopenia",
                    "Reduced physical activity and endurance",
                    "Slow walking speed and weak grip strength",
                    "Chronic fatigue or exhaustion"
                ],
                recommendation: "Multi-component exercise program (strength + balance "
                    + "+ endurance) and nutritional assessment recommended.",
                exerciseConditionKey: "lowWalkingSpeed"
            ))
        }
    }
}

// MARK: - Assessment Text Generation

private extension SessionAnalysisEngine {

    static func generateOverallAssessment(
        findings: [AbnormalFinding],
        normalCount: Int,
        totalEvaluated: Int
    ) -> String {
        if findings.isEmpty {
            return "All \(totalEvaluated) evaluated metrics are within normal clinical ranges. "
                + "Your posture and gait parameters look healthy — keep up the good work!"
        }

        let severeCount = findings.filter { $0.severity == .severe }.count
        let moderateCount = findings.filter { $0.severity == .moderate }.count
        let mildCount = findings.filter { $0.severity == .mild }.count

        var parts: [String] = []
        parts.append("Out of \(totalEvaluated) metrics evaluated, "
                      + "\(findings.count) fall outside normal ranges")

        if severeCount > 0 {
            parts.append("\(severeCount) require attention")
        }
        if moderateCount > 0 {
            parts.append("\(moderateCount) are moderately abnormal")
        }
        if mildCount > 0 && severeCount == 0 && moderateCount == 0 {
            parts.append("\(mildCount) show mild deviation")
        }

        var text = parts.joined(separator: "; ") + "."

        if severeCount > 0 {
            text += " We recommend discussing these findings with your healthcare "
                + "provider and following the corrective exercises below."
        } else if moderateCount > 0 {
            text += " The recommended exercises below can help address these areas. "
                + "Monitor your progress over the coming weeks."
        } else {
            text += " These are minor deviations that may improve with consistent "
                + "exercise and body awareness."
        }

        return text
    }
}
