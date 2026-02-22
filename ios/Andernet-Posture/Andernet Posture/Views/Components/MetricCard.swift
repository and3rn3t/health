//
//  MetricCard.swift
//  Andernet Posture
//
//  Universal metric display card — icon, title, value, optional severity,
//  optional trend delta, and optional subtitle. Replaces StatCard,
//  ClinicalMiniCard, and inline metric rows across the app.
//

import SwiftUI

struct MetricCard: View {

    let icon: String
    let title: String
    let value: String
    var subtitle: String?
    var severity: ClinicalSeverity?
    var trendDelta: Double?
    var tintColor: Color?
    var compact: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? AppSpacing.xs : AppSpacing.sm) {
            // Header row
            HStack(spacing: AppSpacing.sm) {
                Image(systemName: icon)
                    .font(.subheadline)
                    .foregroundStyle(tintColor ?? .accentColor)
                    .frame(width: 24, height: 24)

                Text(title)
                    .font(AppFonts.metricLabel(.caption))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Spacer()

                if let severity {
                    SeverityBadge(severity: severity)
                }
            }

            // Value row
            HStack(alignment: .firstTextBaseline, spacing: AppSpacing.xs) {
                Text(value)
                    .font(AppFonts.metricValue(compact ? .title3 : .title2))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .contentTransition(.numericText())

                if let trendDelta {
                    TrendIndicator(delta: trendDelta)
                }
            }

            // Subtitle
            if let subtitle {
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(compact ? AppSpacing.md : AppSpacing.lg)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityDescription)
    }

    private var accessibilityDescription: String {
        var parts = [title, value]
        if let subtitle { parts.append(subtitle) }
        if let severity { parts.append(severity.accessibilityDescription) }
        if let trendDelta {
            let direction = trendDelta >= 0 ? "up" : "down"
            parts.append("trending \(direction) \(String(format: "%.0f", abs(trendDelta))) percent")
        }
        return parts.joined(separator: ", ")
    }
}

// MARK: - Previews

#Preview("Standard") {
    MetricCard(
        icon: "figure.walk",
        title: "Walking Speed",
        value: "1.2 m/s",
        severity: .normal,
        trendDelta: 3.5,
        tintColor: .blue
    )
    .padding()
}

#Preview("Compact") {
    MetricCard(
        icon: "heart.fill",
        title: "Fall Risk",
        value: "Low",
        severity: .normal,
        compact: true
    )
    .frame(width: 180)
    .padding()
}

#Preview("Grid") {
    LazyVGrid(columns: [.init(), .init()], spacing: 12) {
        MetricCard(icon: "gauge.high", title: "Posture", value: "82", severity: .normal, tintColor: .green)
        MetricCard(icon: "figure.walk", title: "Cadence", value: "112 spm", tintColor: .blue)
        MetricCard(icon: "ruler", title: "Stride", value: "0.72 m", severity: .mild, tintColor: .blue)
        MetricCard(icon: "angle", title: "Trunk Lean", value: "5.3°", severity: .normal, tintColor: .green)
    }
    .padding()
}
