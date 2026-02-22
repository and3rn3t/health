//
//  SessionDetailView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Grouped sections, Swift Charts with Audio Graphs, Liquid Glass material.
//  Comprehensive clinical analytics display with severity color coding.
//

import SwiftUI
import Charts
import Accessibility

struct SessionDetailView: View {
    @State private var viewModel: SessionDetailViewModel
    @State private var pulseOpacity: Double = 0.3
    @State private var showExport = false

    init(session: GaitSession) {
        _viewModel = State(initialValue: SessionDetailViewModel(session: session))
    }

    var body: some View {
        ScrollView(.vertical) {
            VStack(spacing: AppSpacing.xl) {
                // MARK: - Hero Score Ring
                if let score = viewModel.session.postureScore {
                    VStack(spacing: AppSpacing.sm) {
                        ScoreRingView(score: score, size: 140, lineWidth: 14)
                        Text(viewModel.session.date.formatted(date: .abbreviated, time: .shortened))
                            .font(AppFonts.metricLabel(.caption))
                            .foregroundStyle(.secondary)
                    }
                }

                // MARK: - Summary
                summarySection

                // MARK: - Overall Clinical Analysis
                if let analysis = viewModel.sessionAnalysis, analysis.totalEvaluated > 0 {
                    SessionAnalysisSection(analysis: analysis)
                }

                // MARK: - Posture Analytics
                if !viewModel.postureMetrics.isEmpty {
                    clinicalSection(title: "Posture Analytics", icon: "figure.stand", items: viewModel.postureMetrics)
                }

                // MARK: - Gait Analytics
                if !viewModel.gaitMetrics.isEmpty {
                    clinicalSection(title: "Gait Analytics", icon: "figure.walk", items: viewModel.gaitMetrics)
                }

                // MARK: - Joint ROM
                if !viewModel.romMetrics.isEmpty {
                    clinicalSection(title: "Range of Motion", icon: "arrow.triangle.2.circlepath", items: viewModel.romMetrics)
                }

                // MARK: - Balance
                if !viewModel.balanceMetrics.isEmpty {
                    clinicalSection(title: "Balance & Sway", icon: "circle.dotted", items: viewModel.balanceMetrics)
                }

                // MARK: - Risk Assessment
                if !viewModel.riskMetrics.isEmpty {
                    clinicalSection(title: "Risk Assessment", icon: "exclamationmark.shield.fill", items: viewModel.riskMetrics)
                }

                // MARK: - Clinical Tests
                if !viewModel.clinicalTestMetrics.isEmpty {
                    clinicalSection(title: "Clinical Tests", icon: "stethoscope", items: viewModel.clinicalTestMetrics)
                }

                // MARK: - Pain Risk Alerts
                if !viewModel.painAlerts.isEmpty {
                    painAlertsSection
                }

                // MARK: - Time Series Charts
                chartsSection

                // MARK: - Step Analysis
                if viewModel.leftFootStats != nil || viewModel.rightFootStats != nil {
                    stepAnalysisSection
                }
            }
            .padding(AppSpacing.lg)
            .frame(maxWidth: .infinity)
        }
        .scrollBounceBehavior(.basedOnSize)
        .navigationTitle(viewModel.session.date.formatted(date: .abbreviated, time: .shortened))
        .navigationBarTitleDisplayMode(.large)
        .reduceMotionAware()
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showExport = true
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Export session")
            }
            if viewModel.session.framesData != nil {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                        SessionPlaybackView(session: viewModel.session)
                    } label: {
                        Image(systemName: "play.fill")
                    }
                    .accessibilityLabel("Play back session")
                }
            }
        }
        .sheet(isPresented: $showExport) {
            ExportView(session: viewModel.session)
        }
    }

    // MARK: - Summary Section

    @ViewBuilder
    private var summarySection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: AppSpacing.sm) {
            ForEach(viewModel.summaryItems, id: \.label) { item in
                MetricCard(
                    icon: summaryIcon(for: item.label),
                    title: item.label,
                    value: item.value,
                    tintColor: summaryTint(for: item.label),
                    compact: true
                )
            }
        }
    }

    // MARK: - Clinical Section

    @ViewBuilder
    private func clinicalSection(title: String, icon: String, items: [ClinicalMetricItem]) -> some View {
        SectionCard(title: title, icon: icon) {
            ForEach(items) { item in
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        if let plain = item.plainName {
                            Text(plain)
                                .font(.subheadline)
                                .foregroundStyle(.primary)
                            Text(item.label)
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        } else {
                            Text(item.label)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        if let detail = item.detail {
                            Text(detail)
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                        if let explanation = item.explanation {
                            Text(explanation)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    Spacer()

                    HStack(spacing: AppSpacing.sm) {
                        Text(item.value)
                            .font(.subheadline.bold())
                        if let severity = item.severity {
                            SeverityBadge(severity: severity, showLabel: true)
                        }
                    }
                }
                .padding(.vertical, AppSpacing.xs)
                .clinicalMetricAccessibility(
                    label: item.plainName ?? item.label,
                    value: item.value,
                    severity: item.severity
                )

                if item.id != items.last?.id {
                    Divider()
                }
            }
        }
    }

    // MARK: - Pain Risk Alerts

    @ViewBuilder
    private var painAlertsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Label("Pain Risk Alerts", systemImage: "bolt.heart.fill")
                .font(AppFonts.sectionHeader)
                .foregroundStyle(.red)

            ForEach(viewModel.painAlerts, id: \.region) { alert in
                HStack(alignment: .top) {
                    SeverityBadge(severity: alert.severity)
                        .padding(.top, AppSpacing.xs)

                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        HStack {
                            Text(alert.region.rawValue.capitalized)
                                .font(.subheadline.bold())
                            Spacer()
                            Text(String(format: "%.0f/100", alert.riskScore))
                                .font(.caption.bold())
                                .padding(.horizontal, AppSpacing.sm)
                                .padding(.vertical, AppSpacing.xs)
                                .background(AppColors.severityColor(for: alert.severity).opacity(0.2), in: Capsule())
                        }

                        if !alert.factors.isEmpty {
                            Text(alert.factors.joined(separator: " • "))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Text(alert.recommendation)
                            .font(.caption)
                            .foregroundStyle(.primary)
                            .italic()
                    }
                }
                .padding(.vertical, AppSpacing.xs)

                if alert.region != viewModel.painAlerts.last?.region {
                    Divider()
                }
            }
        }
        .padding(AppSpacing.lg)
        .background(.red.opacity(0.05))
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .overlay(
            Group {
                if viewModel.painAlerts.contains(where: { $0.severity == .severe }) {
                    RoundedRectangle(cornerRadius: AppRadius.medium)
                        .strokeBorder(.red.opacity(pulseOpacity), lineWidth: 2)
                }
            }
        )
        .onAppear {
            if viewModel.painAlerts.contains(where: { $0.severity == .severe }) {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    pulseOpacity = 0.8
                }
            }
        }
    }

    // MARK: - Charts Section

    @ViewBuilder
    private var chartsSection: some View {
        // CVA over time
        if !viewModel.cvaSeries.isEmpty {
            timeSeriesChart(title: "Craniovertebral Angle", data: viewModel.cvaSeries, color: .purple, unit: "°")
        }

        // Trunk lean
        if !viewModel.trunkLeanSeries.isEmpty {
            timeSeriesChart(title: "Trunk Lean", data: viewModel.trunkLeanSeries, color: .blue, unit: "°")
        }

        // Lateral lean
        if !viewModel.lateralLeanSeries.isEmpty {
            timeSeriesChart(title: "Lateral Lean", data: viewModel.lateralLeanSeries, color: .purple, unit: "°")
        }

        // Walking speed
        if !viewModel.walkingSpeedSeries.isEmpty {
            timeSeriesChart(title: "Walking Speed", data: viewModel.walkingSpeedSeries, color: .teal, unit: "m/s")
        }

        // Cadence
        if !viewModel.cadenceSeries.isEmpty {
            timeSeriesChart(title: "Cadence", data: viewModel.cadenceSeries, color: .green, unit: "SPM")
        }

        // Stride length
        if !viewModel.strideSeries.isEmpty {
            timeSeriesChart(title: "Stride Length", data: viewModel.strideSeries, color: .orange, unit: "m")
        }

        // Sway velocity
        if !viewModel.swayVelocitySeries.isEmpty {
            timeSeriesChart(title: "Sway Velocity", data: viewModel.swayVelocitySeries, color: .red, unit: "mm/s")
        }

        // REBA
        if !viewModel.rebaSeries.isEmpty {
            timeSeriesChart(title: "REBA Score", data: viewModel.rebaSeries, color: .indigo, unit: "")
        }

        // Hip ROM
        if !viewModel.hipFlexionLeftSeries.isEmpty {
            dualSeriesChart(
                title: "Hip Flexion",
                leftData: viewModel.hipFlexionLeftSeries,
                rightData: viewModel.hipFlexionRightSeries,
                unit: "°"
            )
        }

        // Knee ROM
        if !viewModel.kneeFlexionLeftSeries.isEmpty {
            dualSeriesChart(
                title: "Knee Flexion",
                leftData: viewModel.kneeFlexionLeftSeries,
                rightData: viewModel.kneeFlexionRightSeries,
                unit: "°"
            )
        }
    }

    // MARK: - Time Series Chart

    @ViewBuilder
    private func timeSeriesChart(title: String, data: [TimeSeriesPoint], color: Color, unit: String) -> some View {
        ChartCard(title: title, icon: "chart.xyaxis.line") {
            Chart(data) { point in
                LineMark(
                    x: .value("Time (s)", point.time),
                    y: .value(title, point.value)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(color.gradient)

                AreaMark(
                    x: .value("Time (s)", point.time),
                    y: .value(title, point.value)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(color.opacity(0.1).gradient)
            }
            .chartXAxisLabel("Time (sec)")
            .chartYAxisLabel(unit)
            .accessibilityChartDescriptor(
                SessionChartDescriptor(title: title, data: data, unit: unit)
            )
        }
        .accessibleChart(
            title: title,
            summary: "Time series of \(title.lowercased()) during this session."
        )
    }

    // MARK: - Dual Series Chart (Left/Right)

    @ViewBuilder
    private func dualSeriesChart(title: String, leftData: [TimeSeriesPoint], rightData: [TimeSeriesPoint], unit: String) -> some View {
        ChartCard(title: title, icon: "chart.xyaxis.line") {
            Chart {
                ForEach(leftData) { point in
                    LineMark(
                        x: .value("Time (s)", point.time),
                        y: .value(title, point.value),
                        series: .value("Side", "Left")
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(.blue)
                }

                ForEach(rightData) { point in
                    LineMark(
                        x: .value("Time (s)", point.time),
                        y: .value(title, point.value),
                        series: .value("Side", "Right")
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(.red)
                }
            }
            .chartXAxisLabel("Time (sec)")
            .chartYAxisLabel(unit)
            .chartForegroundStyleScale(["Left": Color.blue, "Right": Color.red])
            .chartLegend(position: .bottom)
        }
    }

    // MARK: - Step Analysis

    @ViewBuilder
    private var stepAnalysisSection: some View {
        SectionCard(title: "Step Analysis", icon: "shoeprints.fill") {
            HStack(spacing: AppSpacing.lg) {
                if let left = viewModel.leftFootStats {
                    footCard(side: "Left", stats: left, color: .blue)
                }
                if let right = viewModel.rightFootStats {
                    footCard(side: "Right", stats: right, color: .red)
                }
            }

            if let sym = viewModel.symmetryRatio {
                HStack {
                    Text("Symmetry")
                        .font(.subheadline)
                    Spacer()
                    Text(String(format: "%.0f%%", sym * 100))
                        .font(.subheadline.bold())
                        .foregroundStyle(sym > 0.9 ? .green : sym > 0.8 ? .yellow : .red)
                }
                .padding(.top, AppSpacing.xs)
            }
        }
    }

    @ViewBuilder
    private func footCard(side: String, stats: FootStats, color: Color) -> some View {
        VStack(alignment: .leading, spacing: AppSpacing.xs) {
            Text(side)
                .font(.caption.bold())
                .foregroundStyle(color)
            Text(String(format: "%.2f m", stats.avgStride))
                .font(AppFonts.metricValue(.title3))
            Text("\(stats.count) steps")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppSpacing.lg)
        .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: AppRadius.small))
    }

    // MARK: - Helpers

    private func summaryIcon(for label: String) -> String {
        switch label {
        case "Duration":       return "clock"
        case "Posture Score":  return "gauge.high"
        case "Walking Speed":  return "figure.walk"
        case "Avg Cadence":    return "metronome"
        case "Avg Stride":     return "ruler"
        case "Total Steps":    return "shoeprints.fill"
        case "Fall Risk":      return "exclamationmark.shield"
        default:               return "info.circle"
        }
    }

    private func summaryTint(for label: String) -> Color {
        switch label {
        case "Duration":       return .secondary
        case "Posture Score":  return .green
        case "Walking Speed", "Avg Cadence", "Avg Stride", "Total Steps":
                               return .blue
        case "Fall Risk":      return .red
        default:               return .accentColor
        }
    }
}

// MARK: - Audio Graph Descriptor

private struct SessionChartDescriptor: AXChartDescriptorRepresentable {
    let title: String
    let data: [TimeSeriesPoint]
    let unit: String

    func makeChartDescriptor() -> AXChartDescriptor {
        let values = data.map(\.value)
        let times = data.map(\.time)
        let minVal = values.min() ?? 0
        let maxVal = max(values.max() ?? 1, minVal + 0.1)
        let maxTime = times.max() ?? 1

        let xAxis = AXNumericDataAxisDescriptor(
            title: "Time (seconds)",
            range: 0...maxTime,
            gridlinePositions: []
        ) { val in String(format: "%.0fs", val) }

        let yAxis = AXNumericDataAxisDescriptor(
            title: title,
            range: minVal...maxVal,
            gridlinePositions: []
        ) { val in String(format: "%.1f \(unit)", val) }

        let series = AXDataSeriesDescriptor(
            name: title,
            isContinuous: true,
            dataPoints: data.map { AXDataPoint(x: $0.time, y: $0.value) }
        )

        return AXChartDescriptor(
            title: title,
            summary: "Time series of \(title.lowercased()) during the session.",
            xAxis: xAxis,
            yAxis: yAxis,
            additionalAxes: [],
            series: [series]
        )
    }
}

#Preview {
    NavigationStack {
        SessionDetailView(session: GaitSession(
            date: .now,
            duration: 120,
            averageCadenceSPM: 112,
            averageStrideLengthM: 0.72,
            averageTrunkLeanDeg: 5.3,
            postureScore: 82
        ))
    }
}
