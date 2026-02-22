// swiftlint:disable file_length
//
//  ExportService.swift
//  Andernet Posture
//
//  Phase 8: Export & Sharing — PDF, CSV, and multi-session export.
//

import Foundation
import UIKit
import os.log

// MARK: - ExportService

enum ExportService {

    // MARK: - Date Formatters

    private static let fileDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let displayDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .long
        f.timeStyle = .short
        return f
    }()

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    // MARK: - Share Helper

    /// Write data to a temp file and return a URL suitable for ShareLink / UIActivityVC.
    static func shareURL(for data: Data, filename: String) -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            AppLogger.export.error("Failed to write export file '\(filename)': \(error.localizedDescription)")
        }
        return url
    }

    // MARK: - CSV Escaping

    private static func csvField(_ value: String) -> String {
        if value.contains(",") || value.contains("\"") || value.contains("\n") {
            return "\"" + value.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        return value
    }

    private static func csvOptional(_ value: Double?, decimals: Int = 2) -> String {
        guard let v = value else { return "" }
        return String(format: "%.\(decimals)f", v)
    }

    private static func csvOptional(_ value: Int?) -> String {
        guard let v = value else { return "" }
        return "\(v)"
    }
}

// MARK: - Summary CSV

extension ExportService {

    /// Single-session summary CSV with all clinical metrics.
    static func generateCSV(for session: GaitSession) -> Data {
        var rows: [String] = []
        rows.append("Metric,Value")
        rows.append(contentsOf: summaryRows(for: session))
        let text = rows.joined(separator: "\n")
        return Data(text.utf8)
    }

    private static func summaryRows(for s: GaitSession) -> [String] {
        var rows: [String] = []
        let iso = isoFormatter.string(from: s.date)
        rows.append("Date,\(csvField(iso))")
        rows.append("Duration (s),\(String(format: "%.1f", s.duration))")
        rows.append("Total Steps,\(csvOptional(s.totalSteps))")
        // Posture
        rows.append("Posture Score,\(csvOptional(s.postureScore))")
        rows.append("CVA (deg),\(csvOptional(s.averageCVADeg))")
        rows.append("SVA (cm),\(csvOptional(s.averageSVACm))")
        rows.append("Trunk Lean (deg),\(csvOptional(s.averageTrunkLeanDeg))")
        rows.append("Lateral Lean (deg),\(csvOptional(s.averageLateralLeanDeg))")
        rows.append("Thoracic Kyphosis (deg),\(csvOptional(s.averageThoracicKyphosisDeg))")
        rows.append("Lumbar Lordosis (deg),\(csvOptional(s.averageLumbarLordosisDeg))")
        rows.append("Shoulder Asymmetry (cm),\(csvOptional(s.averageShoulderAsymmetryCm))")
        rows.append("Pelvic Obliquity (deg),\(csvOptional(s.averagePelvicObliquityDeg))")
        rows.append("Coronal Deviation (cm),\(csvOptional(s.averageCoronalDeviationCm))")
        rows.append("Kendall Type,\(csvField(s.kendallPosturalType ?? ""))")
        rows.append("NYPR Score,\(csvOptional(s.nyprScore))")
        // Gait
        rows.append("Cadence (SPM),\(csvOptional(s.averageCadenceSPM))")
        rows.append("Stride Length (m),\(csvOptional(s.averageStrideLengthM))")
        rows.append("Walking Speed (m/s),\(csvOptional(s.averageWalkingSpeedMPS))")
        rows.append("Step Width (cm),\(csvOptional(s.averageStepWidthCm))")
        rows.append("Gait Asymmetry (%),\(csvOptional(s.gaitAsymmetryPercent))")
        rows.append("Walk Ratio,\(csvOptional(s.walkRatio))")
        rows.append("Gait Pattern,\(csvField(s.gaitPatternClassification ?? ""))")
        // ROM
        rows.append("Hip ROM (deg),\(csvOptional(s.averageHipROMDeg))")
        rows.append("Knee ROM (deg),\(csvOptional(s.averageKneeROMDeg))")
        // Balance
        rows.append("Sway Velocity (mm/s),\(csvOptional(s.averageSwayVelocityMMS))")
        rows.append("Sway Area (cm2),\(csvOptional(s.swayAreaCm2))")
        rows.append("Romberg Ratio,\(csvOptional(s.rombergRatio))")
        // Risk
        rows.append("Fall Risk Score,\(csvOptional(s.fallRiskScore))")
        rows.append("Fall Risk Level,\(csvField(s.fallRiskLevel ?? ""))")
        rows.append("Fatigue Index,\(csvOptional(s.fatigueIndex))")
        rows.append("REBA Score,\(csvOptional(s.rebaScore))")
        rows.append("SPARC Score,\(csvOptional(s.sparcScore))")
        rows.append("Harmonic Ratio,\(csvOptional(s.harmonicRatio))")
        rows.append("Frailty Score,\(csvOptional(s.frailtyScore))")
        rows.append("Upper Crossed Score,\(csvOptional(s.upperCrossedScore))")
        rows.append("Lower Crossed Score,\(csvOptional(s.lowerCrossedScore))")
        rows.append("Estimated MET,\(csvOptional(s.estimatedMET))")
        // Clinical tests
        rows.append("TUG Time (s),\(csvOptional(s.tugTimeSec))")
        rows.append("6MWD (m),\(csvOptional(s.sixMinuteWalkDistanceM))")
        return rows
    }
}

// MARK: - Frames CSV

extension ExportService {

    /// Frame-by-frame CSV export with all body-tracking fields.
    static func generateFramesCSV(for session: GaitSession) -> Data {
        let csvToken = PerformanceMonitor.begin(.csvGeneration)
        defer { PerformanceMonitor.end(csvToken) }

        let frames = session.decodedFrames
        var rows: [String] = []
        rows.append(framesHeader())
        for frame in frames {
            rows.append(frameRow(frame))
        }
        let text = rows.joined(separator: "\n")
        return Data(text.utf8)
    }

    private static func framesHeader() -> String {
        [
            "Timestamp", "PostureScore", "SagittalTrunkLean", "FrontalTrunkLean",
            "CVA", "SVA", "ShoulderAsymmetry", "ShoulderTilt",
            "PelvicObliquity", "ThoracicKyphosis", "LumbarLordosis",
            "CoronalDeviation", "PosturalType", "CadenceSPM",
            "StrideLength", "WalkingSpeed", "StepWidth",
            "HipFlexionL", "HipFlexionR", "KneeFlexionL", "KneeFlexionR",
            "PelvicTilt", "TrunkRotation", "ArmSwingL", "ArmSwingR",
            "SwayVelocity", "REBAScore", "GaitPattern"
        ].joined(separator: ",")
    }

    private static func frameRow(_ f: BodyFrame) -> String {
        let fields: [String] = [
            String(format: "%.4f", f.timestamp),
            String(format: "%.1f", f.postureScore),
            String(format: "%.2f", f.sagittalTrunkLeanDeg),
            String(format: "%.2f", f.frontalTrunkLeanDeg),
            String(format: "%.2f", f.craniovertebralAngleDeg),
            String(format: "%.2f", f.sagittalVerticalAxisCm),
            String(format: "%.2f", f.shoulderAsymmetryCm),
            String(format: "%.2f", f.shoulderTiltDeg),
            String(format: "%.2f", f.pelvicObliquityDeg),
            String(format: "%.2f", f.thoracicKyphosisDeg),
            String(format: "%.2f", f.lumbarLordosisDeg),
            String(format: "%.2f", f.coronalSpineDeviationCm),
            csvField(f.posturalType ?? ""),
            String(format: "%.1f", f.cadenceSPM),
            String(format: "%.4f", f.avgStrideLengthM),
            String(format: "%.3f", f.walkingSpeedMPS),
            String(format: "%.1f", f.stepWidthCm),
            String(format: "%.2f", f.hipFlexionLeftDeg),
            String(format: "%.2f", f.hipFlexionRightDeg),
            String(format: "%.2f", f.kneeFlexionLeftDeg),
            String(format: "%.2f", f.kneeFlexionRightDeg),
            String(format: "%.2f", f.pelvicTiltDeg),
            String(format: "%.2f", f.trunkRotationDeg),
            String(format: "%.2f", f.armSwingLeftDeg),
            String(format: "%.2f", f.armSwingRightDeg),
            String(format: "%.2f", f.swayVelocityMMS),
            f.rebaScore.map { "\($0)" } ?? "",
            csvField(f.gaitPatternRaw ?? "")
        ]
        return fields.joined(separator: ",")
    }
}

// MARK: - Steps CSV

extension ExportService {

    /// Step event CSV export.
    static func generateStepsCSV(for session: GaitSession) -> Data {
        let steps = session.decodedStepEvents
        var rows: [String] = []
        rows.append(stepsHeader())
        for step in steps {
            rows.append(stepRow(step))
        }
        let text = rows.joined(separator: "\n")
        return Data(text.utf8)
    }

    private static func stepsHeader() -> String {
        [
            "Timestamp", "Foot", "PositionX", "PositionZ",
            "StrideLength", "StepLength", "StepWidth",
            "StanceTime", "SwingTime", "GaitPhase",
            "ImpactVelocity", "FootClearance"
        ].joined(separator: ",")
    }

    private static func stepRow(_ s: StepEvent) -> String {
        let fields: [String] = [
            String(format: "%.4f", s.timestamp),
            s.foot.rawValue,
            String(format: "%.4f", s.positionX),
            String(format: "%.4f", s.positionZ),
            csvOptional(s.strideLengthM, decimals: 4),
            csvOptional(s.stepLengthM, decimals: 4),
            csvOptional(s.stepWidthCm, decimals: 1),
            csvOptional(s.stanceTimeSec, decimals: 3),
            csvOptional(s.swingTimeSec, decimals: 3),
            csvField(s.gaitPhase?.rawValue ?? ""),
            csvOptional(s.impactVelocity, decimals: 3),
            csvOptional(s.footClearanceM, decimals: 4)
        ]
        return fields.joined(separator: ",")
    }
}

// MARK: - Multi-Session CSV

extension ExportService {

    /// One row per session with all summary metrics.
    static func generateMultiSessionCSV(sessions: [GaitSession]) -> Data {
        let csvToken = PerformanceMonitor.begin(.csvGeneration)
        defer { PerformanceMonitor.end(csvToken) }

        var rows: [String] = []
        rows.append(multiSessionHeader())
        for session in sessions {
            rows.append(multiSessionRow(session))
        }
        let text = rows.joined(separator: "\n")
        return Data(text.utf8)
    }

    private static func multiSessionHeader() -> String {
        [
            "Date", "Duration(s)", "Steps", "PostureScore",
            "CVA", "SVA", "TrunkLean", "LateralLean",
            "Kyphosis", "Lordosis", "ShoulderAsym", "PelvicObliq",
            "CoronalDev", "KendallType", "NYPR",
            "Cadence", "StrideLen", "Speed", "StepWidth",
            "GaitAsym", "WalkRatio", "GaitPattern",
            "HipROM", "KneeROM",
            "SwayVel", "SwayArea", "Romberg",
            "FallRisk", "FallLevel", "Fatigue", "REBA",
            "SPARC", "Harmonic", "Frailty",
            "UpperCrossed", "LowerCrossed", "MET",
            "TUG", "6MWD"
        ].joined(separator: ",")
    }

    private static func multiSessionRow(_ s: GaitSession) -> String {
        let iso = isoFormatter.string(from: s.date)
        let fields: [String] = [
            csvField(iso),
            String(format: "%.1f", s.duration),
            csvOptional(s.totalSteps),
            csvOptional(s.postureScore),
            csvOptional(s.averageCVADeg),
            csvOptional(s.averageSVACm),
            csvOptional(s.averageTrunkLeanDeg),
            csvOptional(s.averageLateralLeanDeg),
            csvOptional(s.averageThoracicKyphosisDeg),
            csvOptional(s.averageLumbarLordosisDeg),
            csvOptional(s.averageShoulderAsymmetryCm),
            csvOptional(s.averagePelvicObliquityDeg),
            csvOptional(s.averageCoronalDeviationCm),
            csvField(s.kendallPosturalType ?? ""),
            csvOptional(s.nyprScore),
            csvOptional(s.averageCadenceSPM),
            csvOptional(s.averageStrideLengthM),
            csvOptional(s.averageWalkingSpeedMPS),
            csvOptional(s.averageStepWidthCm),
            csvOptional(s.gaitAsymmetryPercent),
            csvOptional(s.walkRatio),
            csvField(s.gaitPatternClassification ?? ""),
            csvOptional(s.averageHipROMDeg),
            csvOptional(s.averageKneeROMDeg),
            csvOptional(s.averageSwayVelocityMMS),
            csvOptional(s.swayAreaCm2),
            csvOptional(s.rombergRatio),
            csvOptional(s.fallRiskScore),
            csvField(s.fallRiskLevel ?? ""),
            csvOptional(s.fatigueIndex),
            csvOptional(s.rebaScore),
            csvOptional(s.sparcScore),
            csvOptional(s.harmonicRatio),
            csvOptional(s.frailtyScore),
            csvOptional(s.upperCrossedScore),
            csvOptional(s.lowerCrossedScore),
            csvOptional(s.estimatedMET),
            csvOptional(s.tugTimeSec),
            csvOptional(s.sixMinuteWalkDistanceM)
        ]
        return fields.joined(separator: ",")
    }
}

// MARK: - PDF Report

extension ExportService {

    // MARK: Layout Constants

    private enum PDF {
        static let pageWidth: CGFloat = 612
        static let pageHeight: CGFloat = 792
        static let margin: CGFloat = 50
        static let contentWidth: CGFloat = pageWidth - 2 * margin
        static let footerY: CGFloat = pageHeight - 40

        static let titleFont = UIFont.systemFont(ofSize: 22, weight: .bold)
        static let headingFont = UIFont.systemFont(ofSize: 14, weight: .semibold)
        static let bodyFont = UIFont.systemFont(ofSize: 10, weight: .regular)
        static let smallFont = UIFont.systemFont(ofSize: 8, weight: .regular)
        static let disclaimerFont = UIFont.italicSystemFont(ofSize: 7)
    }

    /// Generate a clinical-style multi-page PDF report.
    @MainActor
    static func generatePDFReport(for session: GaitSession) -> Data {
        let pdfToken = PerformanceMonitor.begin(.pdfGeneration)
        defer { PerformanceMonitor.end(pdfToken) }

        let pageRect = CGRect(x: 0, y: 0, width: PDF.pageWidth, height: PDF.pageHeight)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        let analysis = PerformanceMonitor.measure(.sessionAnalysis) {
            SessionAnalysisEngine.analyze(session: session)
        }

        let data = renderer.pdfData { context in
            // Page 1: Header + Summary
            context.beginPage()
            var y = drawHeader(session: session, in: context)
            y = drawSummaryTable(session: session, startY: y, in: context)

            // Clinical Analysis section (right after summary on page 1, or new page if needed)
            if analysis.totalEvaluated > 0 {
                let estimatedAnalysisHeight = CGFloat(60 + analysis.findings.count * 60)
                y = ensureSpace(y: y, needed: min(estimatedAnalysisHeight, 300), context: context, page: 1)
                y = drawAnalysisSection(analysis: analysis, startY: y, in: context)
            }

            drawFooter(page: 1, in: context)

            // Page 2+: Clinical detail
            context.beginPage()
            var y2 = PDF.margin
            y2 = drawSection(
                title: "Posture",
                items: postureItems(session), startY: y2, in: context
            )
            y2 = drawSection(
                title: "Gait",
                items: gaitItems(session), startY: y2, in: context
            )
            y2 = drawSection(
                title: "Range of Motion",
                items: romItems(session), startY: y2, in: context
            )
            y2 = ensureSpace(y: y2, needed: 120, context: context, page: 2)
            y2 = drawSection(
                title: "Balance",
                items: balanceItems(session), startY: y2, in: context
            )
            y2 = ensureSpace(y: y2, needed: 140, context: context, page: 3)
            y2 = drawSection(
                title: "Risk Assessment",
                items: riskItems(session), startY: y2, in: context
            )
            y2 = drawPainAlerts(session: session, startY: y2, in: context)
            drawFooter(page: 2, in: context)
        }
        return data
    }
}

// MARK: - PDF Drawing Helpers

private extension ExportService {

    @MainActor
    static func drawHeader(session: GaitSession, in ctx: UIGraphicsPDFRendererContext) -> CGFloat {
        var y = PDF.margin

        let title = "Andernet Posture Report"
        let titleAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.titleFont,
            .foregroundColor: UIColor.black
        ]
        title.draw(at: CGPoint(x: PDF.margin, y: y), withAttributes: titleAttr)
        y += 30

        let dateStr = displayDateFormatter.string(from: session.date)
        let subtitle = "Date: \(dateStr)    Duration: \(session.formattedDuration)"
        let subAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.bodyFont,
            .foregroundColor: UIColor.darkGray
        ]
        subtitle.draw(at: CGPoint(x: PDF.margin, y: y), withAttributes: subAttr)
        y += 20

        // Divider
        let dividerPath = UIBezierPath()
        dividerPath.move(to: CGPoint(x: PDF.margin, y: y))
        dividerPath.addLine(to: CGPoint(x: PDF.pageWidth - PDF.margin, y: y))
        UIColor.gray.setStroke()
        dividerPath.lineWidth = 0.5
        dividerPath.stroke()
        y += 12

        return y
    }

    @MainActor
    static func drawSummaryTable(
        session s: GaitSession,
        startY: CGFloat,
        in ctx: UIGraphicsPDFRendererContext
    ) -> CGFloat {
        var y = startY
        let heading = "Summary"
        heading.draw(
            at: CGPoint(x: PDF.margin, y: y),
            withAttributes: [.font: PDF.headingFont, .foregroundColor: UIColor.black]
        )
        y += 22

        let items: [(String, String)] = [
            ("Posture Score", s.postureScore.map { String(format: "%.0f / 100", $0) } ?? "—"),
            ("Walking Speed", s.averageWalkingSpeedMPS.map { String(format: "%.2f m/s", $0) } ?? "—"),
            ("Cadence", s.averageCadenceSPM.map { String(format: "%.0f steps/min", $0) } ?? "—"),
            ("Stride Length", s.averageStrideLengthM.map { String(format: "%.2f m", $0) } ?? "—"),
            ("CVA", s.averageCVADeg.map { String(format: "%.1f°", $0) } ?? "—"),
            ("Fall Risk", s.fallRiskLevel ?? "—"),
            ("Total Steps", s.totalSteps.map { "\($0)" } ?? "—"),
            ("Gait Pattern", s.gaitPatternClassification ?? "—")
        ]

        for (label, value) in items {
            y = drawMetricRow(label: label, value: value, y: y)
        }
        y += 10
        return y
    }

    @MainActor
    static func drawMetricRow(
        label: String,
        value: String,
        y: CGFloat,
        severity: ClinicalSeverity? = nil,
        explanation: String? = nil
    ) -> CGFloat {
        let labelAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.bodyFont, .foregroundColor: UIColor.darkGray
        ]
        let valueAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.bodyFont, .foregroundColor: UIColor.black
        ]
        label.draw(at: CGPoint(x: PDF.margin + 10, y: y), withAttributes: labelAttr)
        value.draw(at: CGPoint(x: PDF.margin + 220, y: y), withAttributes: valueAttr)

        if let sev = severity {
            let color = severityUIColor(sev)
            let dot = CGRect(x: PDF.margin + 200, y: y + 3, width: 8, height: 8)
            color.setFill()
            UIBezierPath(ovalIn: dot).fill()
        }

        var nextY = y + 16
        if let explanation = explanation {
            let explAttr: [NSAttributedString.Key: Any] = [
                .font: PDF.smallFont, .foregroundColor: UIColor.gray
            ]
            let explRect = CGRect(
                x: PDF.margin + 10, y: nextY,
                width: PDF.contentWidth - 20, height: 30
            )
            explanation.draw(in: explRect, withAttributes: explAttr)
            let explSize = (explanation as NSString).boundingRect(
                with: CGSize(width: PDF.contentWidth - 20, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin],
                attributes: explAttr,
                context: nil
            )
            nextY += max(explSize.height + 4, 12)
        }
        return nextY
    }

    @MainActor
    static func drawSection(
        title: String,
        items: [(String, String, ClinicalSeverity?, String?)],
        startY: CGFloat,
        in ctx: UIGraphicsPDFRendererContext
    ) -> CGFloat {
        var y = startY
        title.draw(
            at: CGPoint(x: PDF.margin, y: y),
            withAttributes: [
                .font: PDF.headingFont,
                .foregroundColor: UIColor(red: 0.2, green: 0.4, blue: 0.8, alpha: 1)
            ]
        )
        y += 20

        for (label, value, sev, explanation) in items {
            y = drawMetricRow(label: label, value: value, y: y, severity: sev, explanation: explanation)
        }
        y += 8
        return y
    }

    @MainActor
    static func drawPainAlerts(
        session: GaitSession,
        startY: CGFloat,
        in ctx: UIGraphicsPDFRendererContext
    ) -> CGFloat {
        guard let data = session.painRiskAlertsData,
              let alerts = try? JSONDecoder().decode([PainRiskAlert].self, from: data),
              !alerts.isEmpty else {
            return startY
        }

        var y = startY + 4
        "Pain Risk Alerts".draw(
            at: CGPoint(x: PDF.margin, y: y),
            withAttributes: [
                .font: PDF.headingFont,
                .foregroundColor: UIColor(red: 0.8, green: 0.2, blue: 0.2, alpha: 1)
            ]
        )
        y += 20

        for alert in alerts {
            let line = "\(alert.region.rawValue.capitalized): " +
                "Score \(String(format: "%.0f", alert.riskScore)) " +
                "(\(alert.severity.rawValue.capitalized))"
            line.draw(
                at: CGPoint(x: PDF.margin + 10, y: y),
                withAttributes: [
                    .font: PDF.bodyFont,
                    .foregroundColor: severityUIColor(alert.severity)
                ]
            )
            y += 14

            let rec = "→ \(alert.recommendation)"
            let maxWidth = PDF.contentWidth - 20
            let recRect = CGRect(x: PDF.margin + 20, y: y, width: maxWidth, height: 30)
            rec.draw(
                in: recRect,
                withAttributes: [
                    .font: PDF.smallFont,
                    .foregroundColor: UIColor.darkGray
                ]
            )
            y += 28
        }
        return y
    }

    @MainActor
    static func drawFooter(page: Int, in ctx: UIGraphicsPDFRendererContext) {
        let disclaimer = "Screening tool only — not for clinical diagnosis."
        let attr: [NSAttributedString.Key: Any] = [
            .font: PDF.disclaimerFont,
            .foregroundColor: UIColor.gray
        ]
        disclaimer.draw(at: CGPoint(x: PDF.margin, y: PDF.footerY), withAttributes: attr)

        let pageStr = "Page \(page)"
        let pageAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.smallFont,
            .foregroundColor: UIColor.gray
        ]
        let size = pageStr.size(withAttributes: pageAttr)
        pageStr.draw(
            at: CGPoint(x: PDF.pageWidth - PDF.margin - size.width, y: PDF.footerY),
            withAttributes: pageAttr
        )
    }

    /// Start a new page if remaining space is insufficient.
    @MainActor
    static func ensureSpace(
        y: CGFloat,
        needed: CGFloat,
        context: UIGraphicsPDFRendererContext,
        page: Int
    ) -> CGFloat {
        if y + needed > PDF.footerY - 20 {
            drawFooter(page: page, in: context)
            context.beginPage()
            return PDF.margin
        }
        return y
    }

    // MARK: - Clinical Analysis Section

    @MainActor
    // swiftlint:disable:next function_body_length
    static func drawAnalysisSection(
        analysis: SessionAnalysis,
        startY: CGFloat,
        in ctx: UIGraphicsPDFRendererContext
    ) -> CGFloat {
        var y = startY + 4

        // Section title
        let titleColor = UIColor(red: 0.6, green: 0.2, blue: 0.6, alpha: 1)
        "Clinical Analysis".draw(
            at: CGPoint(x: PDF.margin, y: y),
            withAttributes: [.font: PDF.headingFont, .foregroundColor: titleColor]
        )
        y += 20

        // Overall assessment
        let assessmentRect = CGRect(
            x: PDF.margin + 10, y: y,
            width: PDF.contentWidth - 20, height: 60
        )
        let assessmentAttr: [NSAttributedString.Key: Any] = [
            .font: PDF.bodyFont,
            .foregroundColor: UIColor.darkGray
        ]
        analysis.overallAssessment.draw(in: assessmentRect, withAttributes: assessmentAttr)
        let assessmentSize = (analysis.overallAssessment as NSString).boundingRect(
            with: CGSize(width: PDF.contentWidth - 20, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: assessmentAttr,
            context: nil
        )
        y += max(assessmentSize.height + 8, 20)

        // Stats line
        let statsLine = "\(analysis.totalEvaluated) metrics evaluated  •  " +
            "\(analysis.normalCount) normal  •  " +
            "\(analysis.abnormalCount) abnormal  •  " +
            "\(analysis.normalPercentage)% in range"
        statsLine.draw(
            at: CGPoint(x: PDF.margin + 10, y: y),
            withAttributes: [.font: PDF.smallFont, .foregroundColor: UIColor.gray]
        )
        y += 16

        // Findings
        if !analysis.findings.isEmpty {
            // Thin divider
            let divPath = UIBezierPath()
            divPath.move(to: CGPoint(x: PDF.margin + 10, y: y))
            divPath.addLine(to: CGPoint(x: PDF.pageWidth - PDF.margin - 10, y: y))
            UIColor.lightGray.setStroke()
            divPath.lineWidth = 0.5
            divPath.stroke()
            y += 8

            for finding in analysis.findings {
                // Check space for finding (metric row + explanation + causes + recommendation ≈ 110-140pt)
                if y + 120 > PDF.footerY - 20 {
                    ctx.beginPage()
                    y = PDF.margin
                }

                // Metric row with severity dot
                let sevColor = severityUIColor(finding.severity)
                let dot = CGRect(x: PDF.margin + 10, y: y + 2, width: 8, height: 8)
                sevColor.setFill()
                UIBezierPath(ovalIn: dot).fill()

                // Show plain name as primary label when available
                let displayName = finding.plainName.isEmpty ? finding.metric : finding.plainName
                displayName.draw(
                    at: CGPoint(x: PDF.margin + 24, y: y),
                    withAttributes: [.font: PDF.bodyFont.withTraits(.traitBold), .foregroundColor: UIColor.black]
                )

                let valueStr = "\(finding.value)  (\(finding.severity.rawValue.capitalized))"
                let valueWidth = (valueStr as NSString).size(
                    withAttributes: [.font: PDF.bodyFont]
                ).width
                valueStr.draw(
                    at: CGPoint(x: PDF.pageWidth - PDF.margin - valueWidth, y: y),
                    withAttributes: [.font: PDF.bodyFont, .foregroundColor: sevColor]
                )
                y += 14

                // Clinical term subtitle (if we showed the plain name above)
                if !finding.plainName.isEmpty {
                    finding.metric.draw(
                        at: CGPoint(x: PDF.margin + 24, y: y),
                        withAttributes: [.font: PDF.smallFont, .foregroundColor: UIColor.lightGray]
                    )
                    y += 12
                }

                // Normal range
                "Normal: \(finding.normalRange)".draw(
                    at: CGPoint(x: PDF.margin + 24, y: y),
                    withAttributes: [.font: PDF.smallFont, .foregroundColor: UIColor.gray]
                )
                y += 12

                // What it means (plain-English explanation)
                if !finding.whatItMeans.isEmpty {
                    let meansText = finding.whatItMeans
                    let meansRect = CGRect(
                        x: PDF.margin + 24, y: y,
                        width: PDF.contentWidth - 34, height: 40
                    )
                    let meansAttr: [NSAttributedString.Key: Any] = [
                        .font: UIFont.italicSystemFont(ofSize: 8),
                        .foregroundColor: UIColor(red: 0.2, green: 0.3, blue: 0.5, alpha: 1)
                    ]
                    meansText.draw(in: meansRect, withAttributes: meansAttr)
                    let meansSize = (meansText as NSString).boundingRect(
                        with: CGSize(width: PDF.contentWidth - 34, height: .greatestFiniteMagnitude),
                        options: [.usesLineFragmentOrigin],
                        attributes: meansAttr,
                        context: nil
                    )
                    y += max(meansSize.height + 4, 12)
                }

                // Likely causes (compact)
                let causesText = "Likely causes: " + finding.likelyCauses.prefix(2).joined(separator: "; ")
                let causesRect = CGRect(
                    x: PDF.margin + 24, y: y,
                    width: PDF.contentWidth - 34, height: 30
                )
                let causesAttr: [NSAttributedString.Key: Any] = [
                    .font: PDF.smallFont,
                    .foregroundColor: UIColor.darkGray
                ]
                causesText.draw(in: causesRect, withAttributes: causesAttr)
                let causesSize = (causesText as NSString).boundingRect(
                    with: CGSize(width: PDF.contentWidth - 34, height: .greatestFiniteMagnitude),
                    options: [.usesLineFragmentOrigin],
                    attributes: causesAttr,
                    context: nil
                )
                y += max(causesSize.height + 4, 14)

                // Recommendation
                let recText = "→ \(finding.recommendation)"
                let recRect = CGRect(
                    x: PDF.margin + 24, y: y,
                    width: PDF.contentWidth - 34, height: 30
                )
                let recAttr: [NSAttributedString.Key: Any] = [
                    .font: UIFont.italicSystemFont(ofSize: 8),
                    .foregroundColor: UIColor(red: 0.2, green: 0.4, blue: 0.2, alpha: 1)
                ]
                recText.draw(in: recRect, withAttributes: recAttr)
                let recSize = (recText as NSString).boundingRect(
                    with: CGSize(width: PDF.contentWidth - 34, height: .greatestFiniteMagnitude),
                    options: [.usesLineFragmentOrigin],
                    attributes: recAttr,
                    context: nil
                )
                y += max(recSize.height + 6, 14)
            }
        }

        y += 8
        return y
    }

    static func severityUIColor(_ severity: ClinicalSeverity) -> UIColor {
        switch severity {
        case .normal:   return .systemGreen
        case .mild:     return .systemYellow
        case .moderate: return .systemOrange
        case .severe:   return .systemRed
        }
    }
}

// MARK: - PDF Metric Item Builders

private extension ExportService {

    /// Glossary-aware tuple builder for PDF metric rows.
    static func pdfItem(
        _ label: String,
        _ value: String,
        _ severity: ClinicalSeverity? = nil
    ) -> (String, String, ClinicalSeverity?, String?) {
        let explanation = ClinicalGlossary.entry(for: label)?.explanation
        return (label, value, severity, explanation)
    }

    static func postureItems(
        _ s: GaitSession
    ) -> [(String, String, ClinicalSeverity?, String?)] {
        var items: [(String, String, ClinicalSeverity?, String?)] = []
        if let v = s.postureScore {
            items.append(pdfItem("Posture Score", String(format: "%.0f / 100", v)))
        }
        if let v = s.averageCVADeg {
            items.append(pdfItem("CVA", String(format: "%.1f°", v),
                          PostureThresholds.cvaSeverity(v)))
        }
        if let v = s.averageSVACm {
            items.append(pdfItem("SVA", String(format: "%.1f cm", v),
                          PostureThresholds.svaSeverity(v)))
        }
        if let v = s.averageTrunkLeanDeg {
            items.append(pdfItem("Trunk Lean", String(format: "%.1f°", v),
                          PostureThresholds.trunkForwardSeverity(v)))
        }
        if let v = s.averageLateralLeanDeg {
            items.append(pdfItem("Lateral Lean", String(format: "%.1f°", v),
                          PostureThresholds.lateralLeanSeverity(v)))
        }
        if let v = s.averageThoracicKyphosisDeg {
            items.append(pdfItem("Thoracic Kyphosis", String(format: "%.1f°", v),
                          PostureThresholds.kyphosisSeverity(v)))
        }
        if let v = s.averageLumbarLordosisDeg {
            items.append(pdfItem("Lumbar Lordosis", String(format: "%.1f°", v),
                          PostureThresholds.lordosisSeverity(v)))
        }
        if let v = s.averageShoulderAsymmetryCm {
            items.append(pdfItem("Shoulder Asymmetry", String(format: "%.1f cm", v),
                          PostureThresholds.shoulderSeverity(cm: v)))
        }
        if let v = s.averagePelvicObliquityDeg {
            items.append(pdfItem("Pelvic Obliquity", String(format: "%.1f°", v),
                          PostureThresholds.pelvicSeverity(v)))
        }
        if let v = s.averageCoronalDeviationCm {
            items.append(pdfItem("Coronal Deviation", String(format: "%.1f cm", v),
                          PostureThresholds.scoliosisSeverity(cm: v)))
        }
        if let t = s.kendallPosturalType {
            items.append(pdfItem("Kendall Type", t))
        }
        return items
    }

    static func gaitItems(
        _ s: GaitSession
    ) -> [(String, String, ClinicalSeverity?, String?)] {
        var items: [(String, String, ClinicalSeverity?, String?)] = []
        if let v = s.averageCadenceSPM {
            items.append(pdfItem("Cadence", String(format: "%.0f SPM", v)))
        }
        if let v = s.averageStrideLengthM {
            items.append(pdfItem("Stride Length", String(format: "%.2f m", v)))
        }
        if let v = s.averageWalkingSpeedMPS {
            items.append(pdfItem("Walking Speed", String(format: "%.2f m/s", v),
                          GaitThresholds.speedSeverity(v)))
        }
        if let v = s.averageStepWidthCm {
            items.append(pdfItem("Step Width", String(format: "%.1f cm", v)))
        }
        if let v = s.gaitAsymmetryPercent {
            items.append(pdfItem("Gait Asymmetry", String(format: "%.1f%%", v),
                          GaitThresholds.symmetrySeverity(v)))
        }
        if let v = s.walkRatio {
            items.append(pdfItem("Walk Ratio", String(format: "%.3f", v)))
        }
        if let p = s.gaitPatternClassification {
            items.append(pdfItem("Gait Pattern", p))
        }
        return items
    }

    static func romItems(
        _ s: GaitSession
    ) -> [(String, String, ClinicalSeverity?, String?)] {
        var items: [(String, String, ClinicalSeverity?, String?)] = []
        if let v = s.averageHipROMDeg {
            items.append(pdfItem("Hip ROM", String(format: "%.1f°", v)))
        }
        if let v = s.averageKneeROMDeg {
            items.append(pdfItem("Knee ROM", String(format: "%.1f°", v)))
        }
        return items
    }

    static func balanceItems(
        _ s: GaitSession
    ) -> [(String, String, ClinicalSeverity?, String?)] {
        var items: [(String, String, ClinicalSeverity?, String?)] = []
        if let v = s.averageSwayVelocityMMS {
            items.append(pdfItem("Sway Velocity", String(format: "%.1f mm/s", v)))
        }
        if let v = s.swayAreaCm2 {
            items.append(pdfItem("Sway Area", String(format: "%.1f cm²", v)))
        }
        if let v = s.rombergRatio {
            items.append(pdfItem("Romberg Ratio", String(format: "%.2f", v)))
        }
        return items
    }

    static func riskItems(
        _ s: GaitSession
    ) -> [(String, String, ClinicalSeverity?, String?)] {
        var items: [(String, String, ClinicalSeverity?, String?)] = []
        if let v = s.fallRiskScore {
            let sev: ClinicalSeverity = v < 30 ? .normal
                : v < 50 ? .mild
                : v < 70 ? .moderate
                : .severe
            items.append(pdfItem("Fall Risk", String(format: "%.0f", v), sev))
        }
        if let l = s.fallRiskLevel {
            items.append(pdfItem("Fall Risk Level", l))
        }
        if let v = s.fatigueIndex {
            items.append(pdfItem("Fatigue Index", String(format: "%.2f", v)))
        }
        if let v = s.rebaScore {
            let sev: ClinicalSeverity = v <= 3 ? .normal
                : v <= 7 ? .mild
                : v <= 10 ? .moderate
                : .severe
            items.append(pdfItem("REBA Score", "\(v)", sev))
        }
        if let v = s.sparcScore {
            items.append(pdfItem("SPARC Score", String(format: "%.2f", v)))
        }
        if let v = s.harmonicRatio {
            items.append(pdfItem("Harmonic Ratio", String(format: "%.2f", v)))
        }
        if let v = s.frailtyScore {
            let sev: ClinicalSeverity = v == 0 ? .normal
                : v <= 2 ? .mild
                : .severe
            items.append(pdfItem("Frailty Score", "\(v)", sev))
        }
        if let v = s.upperCrossedScore {
            items.append(pdfItem("Upper Crossed", String(format: "%.1f", v)))
        }
        if let v = s.lowerCrossedScore {
            items.append(pdfItem("Lower Crossed", String(format: "%.1f", v)))
        }
        if let v = s.estimatedMET {
            items.append(pdfItem("Estimated MET", String(format: "%.1f", v)))
        }
        if let v = s.tugTimeSec {
            let sev: ClinicalSeverity = v < 10 ? .normal
                : v < 14 ? .mild
                : v < 20 ? .moderate
                : .severe
            items.append(pdfItem("TUG Time", String(format: "%.1f s", v), sev))
        }
        if let v = s.sixMinuteWalkDistanceM {
            items.append(pdfItem("6MWD", String(format: "%.0f m", v)))
        }
        return items
    }
}

// MARK: - UIFont Trait Helper

private extension UIFont {
    func withTraits(_ traits: UIFontDescriptor.SymbolicTraits) -> UIFont {
        guard let descriptor = fontDescriptor.withSymbolicTraits(
            fontDescriptor.symbolicTraits.union(traits)
        ) else { return self }
        return UIFont(descriptor: descriptor, size: pointSize)
    }
}
