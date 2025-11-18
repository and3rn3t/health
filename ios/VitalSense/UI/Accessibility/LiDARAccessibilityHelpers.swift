import SwiftUI
import UIKit

/// Accessibility helpers specifically for LiDAR features
/// Ensures VoiceOver, Voice Control, and Switch Control support
struct LiDARAccessibilityHelpers {

    // MARK: - Accessibility Labels

    static func scanTypeLabel(_ type: LiDARScanningView.ScanType) -> String {
        switch type {
        case .fallRiskAssessment:
            return NSLocalizedString("accessibility.scan_type.fall_risk",
                                   value: "Fall Risk Assessment",
                                   comment: "Accessibility label for fall risk assessment scan type")
        case .gaitAnalysis:
            return NSLocalizedString("accessibility.scan_type.gait",
                                   value: "Gait Analysis",
                                   comment: "Accessibility label for gait analysis scan type")
        case .environmentalScan:
            return NSLocalizedString("accessibility.scan_type.environmental",
                                   value: "Environmental Scan",
                                   comment: "Accessibility label for environmental scan type")
        case .balanceTest:
            return NSLocalizedString("accessibility.scan_type.balance",
                                   value: "Balance Test",
                                   comment: "Accessibility label for balance test scan type")
        }
    }

    static func scanTypeHint(_ type: LiDARScanningView.ScanType) -> String {
        switch type {
        case .fallRiskAssessment:
            return NSLocalizedString("accessibility.scan_type.fall_risk.hint",
                                   value: "Double tap to start fall risk assessment scan",
                                   comment: "Accessibility hint for fall risk assessment")
        case .gaitAnalysis:
            return NSLocalizedString("accessibility.scan_type.gait.hint",
                                   value: "Double tap to start gait analysis scan",
                                   comment: "Accessibility hint for gait analysis")
        case .environmentalScan:
            return NSLocalizedString("accessibility.scan_type.environmental.hint",
                                   value: "Double tap to start environmental hazard scan",
                                   comment: "Accessibility hint for environmental scan")
        case .balanceTest:
            return NSLocalizedString("accessibility.scan_type.balance.hint",
                                   value: "Double tap to start balance test",
                                   comment: "Accessibility hint for balance test")
        }
    }

    static func scanProgressLabel(progress: Double, scanType: String) -> String {
        let percentage = Int(progress * 100)
        return NSLocalizedString("accessibility.scan_progress",
                               value: "\(scanType) scan progress: \(percentage) percent",
                               comment: "Accessibility label for scan progress")
    }

    static func scanQualityLabel(quality: Double) -> String {
        let percentage = Int(quality * 100)
        return NSLocalizedString("accessibility.scan_quality",
                               value: "Scan quality: \(percentage) percent",
                               comment: "Accessibility label for scan quality")
    }

    static func scanScoreLabel(score: Double, description: String) -> String {
        return NSLocalizedString("accessibility.scan_score",
                               value: "Scan score: \(Int(score)), \(description)",
                               comment: "Accessibility label for scan score")
    }

    // MARK: - Button Labels

    static func startScanButtonLabel(scanType: String) -> String {
        return NSLocalizedString("accessibility.button.start_scan",
                               value: "Start \(scanType) scan",
                               comment: "Accessibility label for start scan button")
    }

    static func cancelScanButtonLabel() -> String {
        return NSLocalizedString("accessibility.button.cancel_scan",
                               value: "Cancel scan",
                               comment: "Accessibility label for cancel scan button")
    }

    static func viewHistoryButtonLabel() -> String {
        return NSLocalizedString("accessibility.button.view_history",
                               value: "View scan history",
                               comment: "Accessibility label for view history button")
    }

    static func viewInstructionsButtonLabel() -> String {
        return NSLocalizedString("accessibility.button.view_instructions",
                               value: "View scan instructions",
                               comment: "Accessibility label for view instructions button")
    }

    static func exportButtonLabel() -> String {
        return NSLocalizedString("accessibility.button.export",
                               value: "Export scan results",
                               comment: "Accessibility label for export button")
    }

    // MARK: - Metric Labels

    static func metricLabel(name: String, value: String, unit: String? = nil) -> String {
        if let unit = unit {
            return NSLocalizedString("accessibility.metric.with_unit",
                                   value: "\(name): \(value) \(unit)",
                                   comment: "Accessibility label for metric with unit")
        } else {
            return NSLocalizedString("accessibility.metric",
                                   value: "\(name): \(value)",
                                   comment: "Accessibility label for metric")
        }
    }

    // MARK: - Chart Labels

    static func chartLabel(chartType: String, dataCount: Int) -> String {
        return NSLocalizedString("accessibility.chart",
                               value: "\(chartType) chart showing \(dataCount) data points",
                               comment: "Accessibility label for chart")
    }

    // MARK: - Tab Labels

    static func tabLabel(tabName: String, tabIndex: Int, totalTabs: Int) -> String {
        return NSLocalizedString("accessibility.tab",
                               value: "\(tabName) tab, \(tabIndex) of \(totalTabs)",
                               comment: "Accessibility label for tab")
    }
}

// MARK: - Accessibility View Modifiers

extension View {
    /// Adds comprehensive accessibility support for LiDAR scanning buttons
    func lidarScanButtonAccessibility(
        scanType: LiDARScanningView.ScanType,
        isEnabled: Bool = true
    ) -> some View {
        self
            .accessibilityLabel(LiDARAccessibilityHelpers.scanTypeLabel(scanType))
            .accessibilityHint(LiDARAccessibilityHelpers.scanTypeHint(scanType))
            .accessibilityAddTraits(isEnabled ? [.isButton] : [.isButton, .isNotEnabled])
            .accessibilityIdentifier("scan_button_\(scanType.rawValue.lowercased().replacingOccurrences(of: " ", with: "_"))")
    }

    /// Adds accessibility support for scan progress indicators
    func scanProgressAccessibility(
        progress: Double,
        scanType: String,
        additionalInfo: String? = nil
    ) -> some View {
        var label = LiDARAccessibilityHelpers.scanProgressLabel(progress: progress, scanType: scanType)
        if let info = additionalInfo {
            label += ". \(info)"
        }
        return self
            .accessibilityLabel(label)
            .accessibilityValue(String(format: "%.0f%%", progress * 100))
            .accessibilityAddTraits(.updatesFrequently)
    }

    /// Adds accessibility support for score displays
    func scoreAccessibility(
        score: Double,
        description: String,
        isAnimated: Bool = false
    ) -> some View {
        self
            .accessibilityLabel(LiDARAccessibilityHelpers.scanScoreLabel(score: score, description: description))
            .accessibilityValue(String(format: "%.0f", score))
            .accessibilityAddTraits(.isStaticText)
            .accessibilityIdentifier("scan_score_display")
    }

    /// Adds accessibility support for metric cards
    func metricCardAccessibility(
        name: String,
        value: String,
        unit: String? = nil,
        subtitle: String? = nil
    ) -> some View {
        var label = LiDARAccessibilityHelpers.metricLabel(name: name, value: value, unit: unit)
        if let subtitle = subtitle {
            label += ". \(subtitle)"
        }
        return self
            .accessibilityElement(children: .combine)
            .accessibilityLabel(label)
            .accessibilityAddTraits(.isStaticText)
    }

    /// Adds Dynamic Type support with scaling limits
    func lidarDynamicType(size: Font.TextStyle, maxSize: CGFloat? = nil) -> some View {
        self
            .font(.system(size, design: .default))
            .dynamicTypeSize(...(maxSize.map { DynamicTypeSize.custom($0) } ?? .xxxLarge))
    }

    /// Adds Voice Control support
    func voiceControlSupport(identifier: String) -> some View {
        self
            .accessibilityIdentifier(identifier)
            .accessibilityInputLabels([identifier.replacingOccurrences(of: "_", with: " ")])
    }

    /// Adds Switch Control support
    func switchControlSupport() -> some View {
        self
            .accessibilityTraits(.allowsDirectInteraction)
    }

    /// Respects reduced motion preference
    func respectsReducedMotion<Animated: View, StaticContent: View>(
        @ViewBuilder animated: () -> Animated,
        @ViewBuilder reducedMotion: () -> StaticContent
    ) -> some View {
        Group {
            if UIAccessibility.isReduceMotionEnabled {
                reducedMotion()
            } else {
                animated()
            }
        }
    }
}

// MARK: - Accessibility Traits Extensions

extension AccessibilityTraits {
    /// Commonly used trait combinations for LiDAR UI elements
    static let lidarButton: AccessibilityTraits = [.isButton]
    static let lidarMetric: AccessibilityTraits = [.isStaticText]
    static let lidarChart: AccessibilityTraits = [.isImage, .updatesFrequently]
}
