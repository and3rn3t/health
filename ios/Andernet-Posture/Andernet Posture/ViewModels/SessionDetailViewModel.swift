//
//  SessionDetailViewModel.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import Observation
import os.log

/// Data point for time-series charts within a session detail view.
struct TimeSeriesPoint: Identifiable {
    let id = UUID()
    let time: Double   // seconds since session start
    let value: Double
}

/// Per-foot step aggregation for the detail view.
struct FootStats {
    let avgStride: Double
    let count: Int
}

/// A labeled clinical metric with optional severity for display.
struct ClinicalMetricItem: Identifiable {
    let id = UUID()
    let label: String
    let value: String
    var severity: ClinicalSeverity?
    var detail: String?
    /// Plain-English name shown above the clinical label.
    var plainName: String?
    /// One-sentence explanation of what this metric measures, in everyday language.
    var explanation: String?
}

/// Drives SessionDetailView — decodes and presents time-series data for one session.
@Observable
@MainActor
final class SessionDetailViewModel {

    let session: GaitSession

    // Decoded time-series
    var trunkLeanSeries: [TimeSeriesPoint] = []
    var lateralLeanSeries: [TimeSeriesPoint] = []
    var cadenceSeries: [TimeSeriesPoint] = []
    var strideSeries: [TimeSeriesPoint] = []
    var cvaSeries: [TimeSeriesPoint] = []
    var walkingSpeedSeries: [TimeSeriesPoint] = []
    var swayVelocitySeries: [TimeSeriesPoint] = []
    var rebaSeries: [TimeSeriesPoint] = []
    var hipFlexionLeftSeries: [TimeSeriesPoint] = []
    var hipFlexionRightSeries: [TimeSeriesPoint] = []
    var kneeFlexionLeftSeries: [TimeSeriesPoint] = []
    var kneeFlexionRightSeries: [TimeSeriesPoint] = []

    // Step analysis
    var leftFootStats: FootStats?
    var rightFootStats: FootStats?
    var symmetryRatio: Double?

    // Summary strings
    var summaryItems: [(label: String, value: String)] = []

    // Clinical sections
    var postureMetrics: [ClinicalMetricItem] = []
    var gaitMetrics: [ClinicalMetricItem] = []
    var romMetrics: [ClinicalMetricItem] = []
    var balanceMetrics: [ClinicalMetricItem] = []
    var riskMetrics: [ClinicalMetricItem] = []
    var clinicalTestMetrics: [ClinicalMetricItem] = []
    var painAlerts: [PainRiskAlert] = []

    // Overall session analysis
    var sessionAnalysis: SessionAnalysis?

    init(session: GaitSession) {
        self.session = session
        decode()
    }

    // MARK: - Decode & Compute

    private func decode() {
        let decodeToken = PerformanceMonitor.begin(.sessionDecode)
        defer { PerformanceMonitor.end(decodeToken) }

        let frames = session.decodedFrames
        let steps = session.decodedStepEvents

        guard !frames.isEmpty else {
            buildSummary()
            buildClinicalSections()
            sessionAnalysis = PerformanceMonitor.measure(.sessionAnalysis) {
                SessionAnalysisEngine.analyze(session: session)
            }
            return
        }
        let startTime = frames.first!.timestamp

        // Down-sample to ~2 pts/sec for chart performance
        let targetInterval = 0.5
        var lastPlotted = -targetInterval

        for f in frames {
            let t = f.timestamp - startTime
            guard t - lastPlotted >= targetInterval else { continue }
            lastPlotted = t

            trunkLeanSeries.append(TimeSeriesPoint(time: t, value: f.trunkLeanDeg))
            lateralLeanSeries.append(TimeSeriesPoint(time: t, value: f.lateralLeanDeg))
            cadenceSeries.append(TimeSeriesPoint(time: t, value: f.cadenceSPM))
            strideSeries.append(TimeSeriesPoint(time: t, value: f.avgStrideLengthM))
            cvaSeries.append(TimeSeriesPoint(time: t, value: f.craniovertebralAngleDeg))

            if f.walkingSpeedMPS > 0 {
                walkingSpeedSeries.append(TimeSeriesPoint(time: t, value: f.walkingSpeedMPS))
            }
            if f.swayVelocityMMS > 0 {
                swayVelocitySeries.append(TimeSeriesPoint(time: t, value: f.swayVelocityMMS))
            }
            if let reba = f.rebaScore {
                rebaSeries.append(TimeSeriesPoint(time: t, value: Double(reba)))
            }

            hipFlexionLeftSeries.append(TimeSeriesPoint(time: t, value: f.hipFlexionLeftDeg))
            hipFlexionRightSeries.append(TimeSeriesPoint(time: t, value: f.hipFlexionRightDeg))
            kneeFlexionLeftSeries.append(TimeSeriesPoint(time: t, value: f.kneeFlexionLeftDeg))
            kneeFlexionRightSeries.append(TimeSeriesPoint(time: t, value: f.kneeFlexionRightDeg))
        }

        // Step analysis
        let leftSteps = steps.filter { $0.foot == .left }
        let rightSteps = steps.filter { $0.foot == .right }

        let leftStrides = leftSteps.compactMap(\.strideLengthM)
        let rightStrides = rightSteps.compactMap(\.strideLengthM)

        if !leftStrides.isEmpty {
            leftFootStats = FootStats(
                avgStride: leftStrides.reduce(0, +) / Double(leftStrides.count),
                count: leftSteps.count
            )
        }
        if !rightStrides.isEmpty {
            rightFootStats = FootStats(
                avgStride: rightStrides.reduce(0, +) / Double(rightStrides.count),
                count: rightSteps.count
            )
        }

        if let l = leftFootStats?.avgStride, let r = rightFootStats?.avgStride, l > 0, r > 0 {
            symmetryRatio = min(l, r) / max(l, r)
        }

        // Decode pain risk alerts
        if let data = session.painRiskAlertsData {
            do {
                painAlerts = try JSONDecoder().decode([PainRiskAlert].self, from: data)
            } catch {
                AppLogger.persistence.error("Failed to decode PainRiskAlerts (\(data.count) bytes): \(error.localizedDescription)")
                painAlerts = []
            }
        }

        buildSummary()
        buildClinicalSections()
        sessionAnalysis = PerformanceMonitor.measure(.sessionAnalysis) {
            SessionAnalysisEngine.analyze(session: session)
        }
    }

    private func buildSummary() {
        summaryItems = []
        summaryItems.append(("Duration", session.formattedDuration))

        if let score = session.postureScore {
            summaryItems.append(("Posture Score", String(format: "%.0f", score)))
        }
        if let speed = session.averageWalkingSpeedMPS, speed > 0 {
            summaryItems.append(("Walking Speed", String(format: "%.2f m/s", speed)))
        }
        if let cadence = session.averageCadenceSPM {
            summaryItems.append(("Avg Cadence", String(format: "%.0f SPM", cadence)))
        }
        if let stride = session.averageStrideLengthM {
            summaryItems.append(("Avg Stride", String(format: "%.2f m", stride)))
        }
        if let steps = session.totalSteps {
            summaryItems.append(("Total Steps", "\(steps)"))
        }
        if let risk = session.fallRiskLevel {
            summaryItems.append(("Fall Risk", risk.capitalized))
        }
    }

    // MARK: - Clinical Sections

    private func buildClinicalSections() {
        buildPostureSection()
        buildGaitSection()
        buildROMSection()
        buildBalanceSection()
        buildRiskSection()
        buildClinicalTestSection()
    }

    /// Creates a metric item, auto-filling plain name & explanation from the glossary.
    private func metric(
        _ label: String,
        value: String,
        severity: ClinicalSeverity? = nil,
        detail: String? = nil
    ) -> ClinicalMetricItem {
        let entry = ClinicalGlossary.entry(for: label)
        return ClinicalMetricItem(
            label: label,
            value: value,
            severity: severity,
            detail: detail,
            plainName: entry?.plainName,
            explanation: entry?.explanation
        )
    }

    private func buildPostureSection() {
        postureMetrics = []

        if let cva = session.averageCVADeg {
            postureMetrics.append(metric(
                "Craniovertebral Angle",
                value: String(format: "%.1f°", cva),
                severity: PostureThresholds.cvaSeverity(cva),
                detail: "Normal: 49–56°"
            ))
        }
        if let sva = session.averageSVACm {
            postureMetrics.append(metric(
                "Sagittal Vertical Axis",
                value: String(format: "%.1f cm", sva),
                severity: PostureThresholds.svaSeverity(sva),
                detail: "Normal: < 5 cm"
            ))
        }
        if let trunk = session.averageTrunkLeanDeg {
            postureMetrics.append(metric(
                "Trunk Forward Lean",
                value: String(format: "%.1f°", trunk),
                severity: PostureThresholds.trunkForwardSeverity(trunk),
                detail: "Normal: < 5°"
            ))
        }
        if let lateral = session.averageLateralLeanDeg {
            postureMetrics.append(metric(
                "Lateral Lean",
                value: String(format: "%.1f°", lateral),
                severity: PostureThresholds.lateralLeanSeverity(lateral),
                detail: "Normal: < 2°"
            ))
        }
        if let kyphosis = session.averageThoracicKyphosisDeg {
            postureMetrics.append(metric(
                "Thoracic Kyphosis",
                value: String(format: "%.1f°", kyphosis),
                severity: PostureThresholds.kyphosisSeverity(kyphosis),
                detail: "Normal: 20–45°"
            ))
        }
        if let lordosis = session.averageLumbarLordosisDeg {
            postureMetrics.append(metric(
                "Lumbar Lordosis",
                value: String(format: "%.1f°", lordosis),
                severity: PostureThresholds.lordosisSeverity(lordosis),
                detail: "Normal: 40–60°"
            ))
        }
        if let shoulder = session.averageShoulderAsymmetryCm {
            postureMetrics.append(metric(
                "Shoulder Asymmetry",
                value: String(format: "%.1f cm", shoulder),
                severity: PostureThresholds.shoulderSeverity(cm: shoulder),
                detail: "Normal: < 1.5 cm"
            ))
        }
        if let pelvic = session.averagePelvicObliquityDeg {
            postureMetrics.append(metric(
                "Pelvic Obliquity",
                value: String(format: "%.1f°", pelvic),
                severity: PostureThresholds.pelvicSeverity(pelvic),
                detail: "Normal: < 1°"
            ))
        }
        if let coronal = session.averageCoronalDeviationCm {
            postureMetrics.append(metric(
                "Coronal Spine Deviation",
                value: String(format: "%.1f cm", coronal),
                severity: PostureThresholds.scoliosisSeverity(cm: coronal),
                detail: "Normal: < 1 cm"
            ))
        }
        if let kendall = session.kendallPosturalType {
            postureMetrics.append(metric(
                "Postural Type (Kendall)",
                value: kendall.kendallDisplayName,
                severity: kendall == "ideal" ? .normal : .mild
            ))
        }
        if let nypr = session.nyprScore {
            let max = NYPRItem.maxAutomatableScore
            postureMetrics.append(metric(
                "NYPR Score",
                value: "\(nypr)/\(max)",
                severity: nyprSeverity(nypr, max: max),
                detail: "9 automated items"
            ))
        }
    }

    private func buildGaitSection() {
        gaitMetrics = []

        if let speed = session.averageWalkingSpeedMPS, speed > 0 {
            gaitMetrics.append(metric(
                "Walking Speed",
                value: String(format: "%.2f m/s", speed),
                severity: GaitThresholds.speedSeverity(speed),
                detail: "Normal: ≥ 1.0 m/s"
            ))
        }
        if let cadence = session.averageCadenceSPM {
            gaitMetrics.append(metric(
                "Cadence",
                value: String(format: "%.0f SPM", cadence),
                severity: GaitThresholds.cadenceNormal.contains(cadence) ? .normal : .mild,
                detail: "Normal: 100–130 SPM"
            ))
        }
        if let stride = session.averageStrideLengthM {
            gaitMetrics.append(metric(
                "Stride Length",
                value: String(format: "%.2f m", stride)
            ))
        }
        if let sym = session.gaitAsymmetryPercent {
            gaitMetrics.append(metric(
                "Gait Asymmetry (Robinson SI)",
                value: String(format: "%.1f%%", sym),
                severity: GaitThresholds.symmetrySeverity(sym),
                detail: "Normal: < 10%"
            ))
        }
        if let stepWidth = session.averageStepWidthCm {
            gaitMetrics.append(metric(
                "Step Width",
                value: String(format: "%.1f cm", stepWidth),
                severity: GaitThresholds.stepWidthNormal.contains(stepWidth) ? .normal : .mild
            ))
        }
        if let pattern = session.gaitPatternClassification {
            gaitMetrics.append(metric(
                "Gait Pattern",
                value: pattern.patternDisplayName,
                severity: pattern == "normal" ? .normal : .mild
            ))
        }
        if let walkRatio = session.walkRatio {
            gaitMetrics.append(metric(
                "Walk Ratio",
                value: String(format: "%.4f", walkRatio),
                detail: "Normal: ~0.0064"
            ))
        }
        if let met = session.estimatedMET {
            gaitMetrics.append(metric(
                "Estimated MET",
                value: String(format: "%.1f", met)
            ))
        }
    }

    private func buildROMSection() {
        romMetrics = []

        if let hipROM = session.averageHipROMDeg {
            romMetrics.append(metric(
                "Hip ROM (avg bilateral)",
                value: String(format: "%.1f°", hipROM),
                severity: GaitROMLimits.hipFlexionNormal.contains(hipROM) ? .normal : .mild,
                detail: "Normal gait: 30–40°"
            ))
        }
        if let kneeROM = session.averageKneeROMDeg {
            romMetrics.append(metric(
                "Knee ROM (avg bilateral)",
                value: String(format: "%.1f°", kneeROM),
                severity: GaitROMLimits.kneeFlexionSwingNormal.contains(kneeROM) ? .normal : .mild,
                detail: "Normal: 60–70°"
            ))
        }
        if let trunkRot = session.trunkRotationRangeDeg {
            romMetrics.append(metric(
                "Trunk Rotation Range",
                value: String(format: "%.1f°", trunkRot),
                severity: GaitROMLimits.trunkRotationTotalArc.contains(trunkRot) ? .normal : .mild,
                detail: "Normal: 10–16°"
            ))
        }
        if let armAsym = session.armSwingAsymmetryPercent {
            romMetrics.append(metric(
                "Arm Swing Asymmetry",
                value: String(format: "%.1f%%", armAsym),
                severity: armAsym <= GaitThresholds.armSwingAsymmetryNormalMax ? .normal : .mild,
                detail: "Normal: < 10%"
            ))
        }
    }

    private func buildBalanceSection() {
        balanceMetrics = []

        if let sway = session.averageSwayVelocityMMS {
            balanceMetrics.append(metric(
                "Sway Velocity",
                value: String(format: "%.1f mm/s", sway),
                severity: sway <= BalanceThresholds.swayVelocityFallRisk ? .normal : .severe,
                detail: "Fall risk: > 25 mm/s"
            ))
        }
        if let area = session.swayAreaCm2 {
            balanceMetrics.append(metric(
                "Sway Area (95% ellipse)",
                value: String(format: "%.2f cm²", area),
                severity: area <= BalanceThresholds.swayAreaFallRisk ? .normal : .severe
            ))
        }
        if let romberg = session.rombergRatio {
            balanceMetrics.append(metric(
                "Romberg Ratio",
                value: String(format: "%.2f", romberg),
                severity: romberg <= BalanceThresholds.rombergRatioNormalMax ? .normal : .moderate,
                detail: "Normal: < 2.0"
            ))
        }
    }

    private func buildRiskSection() {
        riskMetrics = []

        if let fallRisk = session.fallRiskScore {
            let level = session.fallRiskLevel ?? "unknown"
            riskMetrics.append(metric(
                "Fall Risk Score",
                value: String(format: "%.0f/100", fallRisk),
                severity: fallRiskSeverity(level),
                detail: "Composite 8-factor assessment"
            ))
        }
        if let fatigue = session.fatigueIndex {
            riskMetrics.append(metric(
                "Fatigue Index",
                value: String(format: "%.0f/100", fatigue),
                severity: fatigueSeverity(fatigue)
            ))
        }
        if let reba = session.rebaScore {
            riskMetrics.append(metric(
                "REBA Score",
                value: "\(reba)/15",
                severity: rebaSeverity(reba),
                detail: rebaActionLabel(reba)
            ))
        }
        if let sparc = session.sparcScore {
            riskMetrics.append(metric(
                "Smoothness (SPARC)",
                value: String(format: "%.2f", sparc),
                severity: sparc > -2.0 ? .normal : sparc > -3.0 ? .mild : .moderate
            ))
        }
        if let hr = session.harmonicRatio {
            riskMetrics.append(metric(
                "Harmonic Ratio (AP)",
                value: String(format: "%.2f", hr),
                severity: hr > 2.0 ? .normal : hr > 1.5 ? .mild : .moderate
            ))
        }
        if let upperCrossed = session.upperCrossedScore {
            riskMetrics.append(metric(
                "Upper Crossed Syndrome",
                value: String(format: "%.0f/100", upperCrossed),
                severity: upperCrossed < 40 ? .normal : upperCrossed < 60 ? .mild : .moderate
            ))
        }
        if let lowerCrossed = session.lowerCrossedScore {
            riskMetrics.append(metric(
                "Lower Crossed Syndrome",
                value: String(format: "%.0f/100", lowerCrossed),
                severity: lowerCrossed < 40 ? .normal : lowerCrossed < 60 ? .mild : .moderate
            ))
        }
        if let frailty = session.frailtyScore {
            riskMetrics.append(metric(
                "Frailty (Fried)",
                value: "\(frailty)/5",
                severity: frailty == 0 ? .normal : frailty <= 2 ? .mild : .severe,
                detail: frailty == 0 ? "Robust" : frailty <= 2 ? "Pre-frail" : "Frail"
            ))
        }
    }

    private func buildClinicalTestSection() {
        clinicalTestMetrics = []

        if let tug = session.tugTimeSec {
            clinicalTestMetrics.append(metric(
                "Timed Up & Go",
                value: String(format: "%.1f sec", tug),
                severity: tug <= 10 ? .normal : tug <= GaitThresholds.tugFallRisk ? .mild : .severe,
                detail: "Fall risk threshold: > 13.5 sec"
            ))
        }
        if let sixMW = session.sixMinuteWalkDistanceM {
            clinicalTestMetrics.append(metric(
                "6-Minute Walk",
                value: String(format: "%.0f m", sixMW)
            ))
        }
    }

    // MARK: - Helpers

    private func nyprSeverity(_ score: Int, max: Int) -> ClinicalSeverity {
        let pct = Double(score) / Double(max) * 100
        if pct >= 80 { return .normal }
        if pct >= 60 { return .mild }
        if pct >= 40 { return .moderate }
        return .severe
    }

    private func fallRiskSeverity(_ level: String) -> ClinicalSeverity {
        switch level {
        case "low": return .normal
        case "moderate": return .moderate
        case "high": return .severe
        default: return .normal
        }
    }

    private func fatigueSeverity(_ index: Double) -> ClinicalSeverity {
        if index < 25 { return .normal }
        if index < 50 { return .mild }
        if index < 75 { return .moderate }
        return .severe
    }

    private func rebaSeverity(_ score: Int) -> ClinicalSeverity {
        switch score {
        case 1: return .normal
        case 2...3: return .mild
        case 4...7: return .moderate
        default: return .severe
        }
    }

    private func rebaActionLabel(_ score: Int) -> String {
        switch score {
        case 1: return "Negligible risk — no action needed"
        case 2...3: return "Low risk — change may be needed"
        case 4...7: return "Medium risk — investigation needed"
        case 8...10: return "High risk — implement change soon"
        default: return "Very high risk — immediate change needed"
        }
    }
}
