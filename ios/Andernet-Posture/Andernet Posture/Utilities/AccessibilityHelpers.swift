//
//  AccessibilityHelpers.swift
//  Andernet Posture
//
//  Accessibility utilities: ScaledMetric sizes, VoiceOver modifiers,
//  reduce-motion support, high-contrast colors, and accessible formatters.
//

import SwiftUI
import Accessibility

// MARK: - ScaledMetric Sizes

/// Provides Dynamic-Type-aware sizing.
/// Because `@ScaledMetric` requires instance storage, instantiate this
/// inside a View body or store it as a `@State` / `@Environment` object.
struct AccessibleSizes {
    @ScaledMetric(relativeTo: .body)    var cardPadding: CGFloat = 16
    @ScaledMetric(relativeTo: .caption) var badgeSize: CGFloat = 10
    @ScaledMetric(relativeTo: .title)   var iconSize: CGFloat = 24
    @ScaledMetric(relativeTo: .body)    var chartHeight: CGFloat = 200
    @ScaledMetric(relativeTo: .body)    var rowHeight: CGFloat = 44
    @ScaledMetric(relativeTo: .body)    var spacing: CGFloat = 8
}

// MARK: - ClinicalSeverity Accessibility Extensions

extension ClinicalSeverity {

    /// Natural-language description suitable for VoiceOver.
    var accessibilityDescription: String {
        switch self {
        case .normal:   return String(localized: "Normal range")
        case .mild:     return String(localized: "Mildly elevated")
        case .moderate: return String(localized: "Moderately abnormal")
        case .severe:   return String(localized: "Severely abnormal")
        }
    }

    /// SF Symbol name conveying severity for VoiceOver users.
    var accessibilityIcon: String {
        switch self {
        case .normal:   return "checkmark.circle.fill"
        case .mild:     return "exclamationmark.circle"
        case .moderate: return "exclamationmark.triangle"
        case .severe:   return "xmark.octagon.fill"
        }
    }
}

// MARK: - GaitSession Accessibility Extensions

extension GaitSession {

    /// Full VoiceOver-friendly summary of the session.
    var accessibilitySummary: String {
        let dateString = date.formatted(
            .dateTime.month(.wide).day().year()
        )

        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        var durationString: String
        if minutes > 0 && seconds > 0 {
            durationString = "\(minutes) minute\(minutes == 1 ? "" : "s") \(seconds) second\(seconds == 1 ? "" : "s")"
        } else if minutes > 0 {
            durationString = "\(minutes) minute\(minutes == 1 ? "" : "s")"
        } else {
            durationString = "\(seconds) second\(seconds == 1 ? "" : "s")"
        }

        var parts: [String] = [
            "Session from \(dateString)",
            "duration \(durationString)"
        ]

        if let score = postureScore {
            let rounded = Int(score.rounded())
            parts.append("posture score \(rounded) out of 100, \(postureLabel.lowercased())")
        }

        if let steps = totalSteps, steps > 0 {
            parts.append("\(steps) step\(steps == 1 ? "" : "s")")
        }

        if let cadence = averageCadenceSPM {
            parts.append("cadence \(Int(cadence.rounded())) steps per minute")
        }

        return parts.joined(separator: ", ")
    }
}

// MARK: - Clinical Metric Accessibility Modifier

/// Adds VoiceOver label, value, and hint describing a clinical metric.
struct ClinicalMetricAccessibility: ViewModifier {
    let label: String
    let value: String
    let severity: ClinicalSeverity?

    func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .combine)
            .accessibilityLabel(accessibilityLabel)
            .accessibilityValue(value)
            .accessibilityHint(accessibilityHint)
    }

    private var accessibilityLabel: String {
        if let severity {
            return "\(label), \(value), \(severity.accessibilityDescription)"
        }
        return "\(label), \(value)"
    }

    private var accessibilityHint: String {
        guard let severity else { return "" }
        switch severity {
        case .normal:
            return String(localized: "This measurement is within normal limits.")
        case .mild:
            return String(localized: "This measurement is slightly outside normal range. Monitoring recommended.")
        case .moderate:
            return String(localized: "This measurement is moderately abnormal. Consider clinical follow-up.")
        case .severe:
            return String(localized: "This measurement is severely abnormal. Clinical evaluation recommended.")
        }
    }
}

// MARK: - Severity Accessibility Modifier

/// Makes colored severity indicators accessible to VoiceOver users.
struct SeverityAccessibilityModifier: ViewModifier {
    let severity: ClinicalSeverity

    func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Severity: \(severity.accessibilityDescription)")
            .accessibilityValue(severity.rawValue)
            .accessibilityAddTraits(.isImage)
    }
}

// MARK: - Chart Accessibility Modifier

/// Provides VoiceOver context for chart containers.
struct ChartAccessibilityModifier: ViewModifier {
    let title: String
    let summary: String

    func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .contain)
            .accessibilityLabel("\(title) chart")
            .accessibilityValue(summary)
            .accessibilityHint("Shows \(title.lowercased()) data over time")
            .accessibilityAddTraits(.isImage)
    }
}

// MARK: - Reduce Motion Support

/// Replaces animations with instant transitions when Reduce Motion is enabled.
struct ReduceMotionModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .transaction { transaction in
                if reduceMotion {
                    transaction.animation = nil
                    transaction.disablesAnimations = true
                }
            }
    }
}

// MARK: - High Contrast Colors

/// Severity colors that automatically increase contrast when
/// the system accessibility setting is enabled.
struct HighContrastColors {

    /// Returns the appropriate severity color, adjusting for high-contrast mode.
    static func color(
        for severity: ClinicalSeverity,
        contrast: ColorSchemeContrast = .standard
    ) -> Color {
        let isHigh = (contrast == .increased)
        switch severity {
        case .normal:
            return isHigh ? Color(red: 0, green: 0.6, blue: 0) : .green
        case .mild:
            return isHigh ? Color(red: 0.7, green: 0.6, blue: 0) : .yellow
        case .moderate:
            return isHigh ? Color(red: 0.8, green: 0.35, blue: 0) : .orange
        case .severe:
            return isHigh ? Color(red: 0.8, green: 0, blue: 0) : .red
        }
    }
}

/// A ViewModifier that reads the contrast environment and vends the right color
/// via a preference or through a child builder — handy for inline usage.
struct HighContrastSeverityColor: ViewModifier {
    let severity: ClinicalSeverity
    @Environment(\.colorSchemeContrast) private var contrast

    func body(content: Content) -> some View {
        content.foregroundStyle(HighContrastColors.color(for: severity, contrast: contrast))
    }
}

// MARK: - Accessible Score View

/// Reusable score display with full VoiceOver support.
struct AccessibleScoreView: View {
    let score: Double
    let maximumScore: Double
    let label: String
    var trend: ScoreTrend?
    var isLive: Bool = false

    enum ScoreTrend {
        case improving, declining, stable

        var description: String {
            switch self {
            case .improving: return String(localized: "improving")
            case .declining: return String(localized: "declining")
            case .stable:    return String(localized: "stable")
            }
        }

        var iconName: String {
            switch self {
            case .improving: return "arrow.up.right"
            case .declining: return "arrow.down.right"
            case .stable:    return "arrow.right"
            }
        }
    }

    private var category: String {
        let normalized = score / maximumScore * 100
        switch normalized {
        case 80...: return String(localized: "Excellent").lowercased()
        case 60..<80: return String(localized: "Good").lowercased()
        case 40..<60: return String(localized: "Fair").lowercased()
        default: return String(localized: "Needs Improvement").lowercased()
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            Text("\(Int(score.rounded()))")
                .font(.title2.bold())
            Text("/ \(Int(maximumScore))")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let trend {
                Image(systemName: trend.iconName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(voiceOverLabel)
        .accessibilityValue("\(Int(score.rounded()))")
        .modifier(LiveTraitModifier(isLive: isLive))
    }

    private var voiceOverLabel: String {
        var parts = ["\(label) \(Int(score.rounded())) out of \(Int(maximumScore)), \(category)"]
        if let trend {
            parts.append("trending \(trend.description)")
        }
        return parts.joined(separator: ", ")
    }
}

/// Conditionally applies `.updatesFrequently` trait for live capture data.
private struct LiveTraitModifier: ViewModifier {
    let isLive: Bool

    func body(content: Content) -> some View {
        if isLive {
            content.accessibilityAddTraits(.updatesFrequently)
        } else {
            content
        }
    }
}

// MARK: - View Extensions

extension View {

    /// Adds VoiceOver metadata for a clinical metric row.
    func clinicalMetricAccessibility(
        label: String,
        value: String,
        severity: ClinicalSeverity?
    ) -> some View {
        modifier(ClinicalMetricAccessibility(
            label: label,
            value: value,
            severity: severity
        ))
    }

    /// Replaces animations with instant transitions when Reduce Motion is on.
    func reduceMotionAware() -> some View {
        modifier(ReduceMotionModifier())
    }

    /// Adds VoiceOver description for a chart container.
    func accessibleChart(title: String, summary: String) -> some View {
        modifier(ChartAccessibilityModifier(title: title, summary: summary))
    }

    /// Applies a severity indicator with VoiceOver label.
    func severityAccessibility(_ severity: ClinicalSeverity) -> some View {
        modifier(SeverityAccessibilityModifier(severity: severity))
    }

    /// Applies high-contrast severity foreground color.
    func highContrastSeverityColor(_ severity: ClinicalSeverity) -> some View {
        modifier(HighContrastSeverityColor(severity: severity))
    }
}

// MARK: - Previews

#Preview("Accessible Score — Static") {
    VStack(spacing: 20) {
        AccessibleScoreView(
            score: 82,
            maximumScore: 100,
            label: "Posture score",
            trend: .improving
        )
        AccessibleScoreView(
            score: 45,
            maximumScore: 100,
            label: "Posture score",
            trend: .declining
        )
        AccessibleScoreView(
            score: 70,
            maximumScore: 100,
            label: "Posture score",
            trend: .stable
        )
    }
    .padding()
}

#Preview("Accessible Score — Live") {
    AccessibleScoreView(
        score: 91,
        maximumScore: 100,
        label: "Live posture score",
        isLive: true
    )
    .padding()
}

#Preview("High-Contrast Severity Colors") {
    VStack(spacing: 12) {
        ForEach(ClinicalSeverity.allCases, id: \.self) { severity in
            HStack {
                Circle()
                    .fill(HighContrastColors.color(for: severity, contrast: .standard))
                    .frame(width: 20, height: 20)
                Circle()
                    .fill(HighContrastColors.color(for: severity, contrast: .increased))
                    .frame(width: 20, height: 20)
                Text(severity.accessibilityDescription)
            }
        }
    }
    .padding()
}
