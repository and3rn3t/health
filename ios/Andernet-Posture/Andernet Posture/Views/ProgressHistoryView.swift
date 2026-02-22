//
//  ProgressHistoryView.swift
//  Andernet Posture
//
//  Longitudinal progress view — tracks how any metric has changed
//  across sessions over configurable time ranges. Accessible from the
//  Sessions tab toolbar.
//

import SwiftUI
import SwiftData
import Charts
import Accessibility

struct ProgressHistoryView: View {

    let sessions: [GaitSession]

    @State private var viewModel = ProgressHistoryViewModel()
    @ScaledMetric(relativeTo: .body) private var chartHeight: CGFloat = 220

    // MARK: - Body

    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.xl) {
                timeRangePicker
                categoryPills
                metricPicker
                summaryCard
                trendChartSection
                sessionHighlights
            }
            .padding()
        }
        .navigationTitle("Progress")
        .navigationBarTitleDisplayMode(.large)
        .reduceMotionAware()
        .onAppear {
            viewModel.refresh(sessions: sessions)
        }
        .onChange(of: sessions.count) {
            viewModel.refresh(sessions: sessions)
        }
    }

    // MARK: - Time Range Picker

    @ViewBuilder
    private var timeRangePicker: some View {
        Picker("Time Range", selection: $viewModel.selectedTimeRange) {
            ForEach(ProgressTimeRange.allCases) { range in
                Text(range.rawValue).tag(range)
            }
        }
        .pickerStyle(.segmented)
        .accessibilityLabel("Time range filter")
    }

    // MARK: - Category Pills

    @ViewBuilder
    private var categoryPills: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppSpacing.sm) {
                ForEach(MetricCategory.allCases) { category in
                    let isSelected = viewModel.selectedCategory == category
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            viewModel.selectCategory(category)
                        }
                    } label: {
                        Label(category.rawValue, systemImage: category.icon)
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, AppSpacing.md)
                            .padding(.vertical, AppSpacing.sm)
                            .background(
                                isSelected
                                    ? AnyShapeStyle(.tint)
                                    : AnyShapeStyle(.regularMaterial),
                                in: Capsule()
                            )
                            .foregroundStyle(isSelected ? .white : .primary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                    .sensoryFeedback(.selection, trigger: isSelected)
                }
            }
            .padding(.horizontal, AppSpacing.xs)
        }
    }

    // MARK: - Metric Picker

    @ViewBuilder
    private var metricPicker: some View {
        if viewModel.metricsForSelectedCategory.count > 1 {
            Picker("Metric", selection: $viewModel.selectedMetric) {
                ForEach(viewModel.metricsForSelectedCategory) { metric in
                    Text(metric.displayName).tag(metric)
                }
            }
            .pickerStyle(.menu)
            .padding(.horizontal, AppSpacing.xs)
        }
    }

    // MARK: - Summary Card

    @ViewBuilder
    private var summaryCard: some View {
        if viewModel.dataPointCount > 0 {
            SectionCard(title: "Summary", icon: "chart.bar.fill") {
                VStack(spacing: AppSpacing.md) {
                    // Improvement row
                    if let improvement = viewModel.improvementPercent {
                        HStack {
                            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                                Text("Overall Change")
                                    .font(AppFonts.metricLabel(.caption))
                                    .foregroundStyle(.secondary)
                                HStack(spacing: AppSpacing.sm) {
                                    TrendIndicator(
                                        delta: improvement,
                                        positiveIsGood: true // already normalised in VM
                                    )
                                    if let first = viewModel.firstValue,
                                       let latest = viewModel.latestValue {
                                        Text(
                                            "\(formattedValue(first)) → \(formattedValue(latest))"
                                        )
                                        .font(.caption.monospacedDigit())
                                        .foregroundStyle(.secondary)
                                    }
                                }
                            }
                            Spacer()
                        }
                    }

                    Divider()

                    // Stats grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: AppSpacing.md) {
                        statCell(
                            label: "Sessions",
                            value: "\(viewModel.dataPointCount)",
                            icon: "number"
                        )

                        if let best = viewModel.bestValue {
                            statCell(
                                label: "Best",
                                value: formattedValue(best),
                                icon: "star.fill",
                                color: .green
                            )
                        }

                        if let worst = viewModel.worstValue {
                            statCell(
                                label: "Worst",
                                value: formattedValue(worst),
                                icon: "arrow.down.circle",
                                color: .red
                            )
                        }
                    }
                }
            }
        } else {
            noDataView
        }
    }

    @ViewBuilder
    private func statCell(label: String, value: String, icon: String, color: Color = .secondary) -> some View {
        VStack(spacing: AppSpacing.xs) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
            Text(value)
                .font(AppFonts.metricValue(.title3))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Trend Chart

    @ViewBuilder
    private var trendChartSection: some View {
        let data = viewModel.trendPoints

        if data.count >= 2 {
            ChartCard(
                title: viewModel.selectedMetric.displayName,
                icon: viewModel.selectedMetric.icon
            ) {
                Chart {
                    ForEach(data) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value(viewModel.selectedMetric.displayName, point.value)
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(metricColor.gradient)

                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value(viewModel.selectedMetric.displayName, point.value)
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(metricColor.opacity(0.1).gradient)

                        PointMark(
                            x: .value("Date", point.date),
                            y: .value(viewModel.selectedMetric.displayName, point.value)
                        )
                        .symbolSize(30)
                        .foregroundStyle(metricColor)
                    }

                    // Average rule
                    if let avg = viewModel.averageValue {
                        RuleMark(y: .value("Average", avg))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                            .foregroundStyle(.secondary.opacity(0.5))
                            .annotation(position: .top, alignment: .trailing) {
                                Text("avg \(formattedValue(avg))")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                    }
                }
                .chartYAxisLabel(viewModel.selectedMetric.unit)
                .frame(height: chartHeight)
                .accessibilityChartDescriptor(
                    ProgressChartDescriptor(
                        title: viewModel.selectedMetric.displayName,
                        data: data,
                        unit: viewModel.selectedMetric.unit
                    )
                )
            }
            .accessibleChart(
                title: "\(viewModel.selectedMetric.displayName) Progress",
                summary: "Shows \(viewModel.selectedMetric.displayName.lowercased()) over \(data.count) sessions."
            )
        } else if data.count == 1 {
            singleDataPointView(data[0])
        }
    }

    @ViewBuilder
    private func singleDataPointView(_ point: TrendPoint) -> some View {
        SectionCard(title: viewModel.selectedMetric.displayName, icon: viewModel.selectedMetric.icon) {
            VStack(spacing: AppSpacing.sm) {
                Text(formattedValue(point.value))
                    .font(AppFonts.metricValue(.title))
                Text(point.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("Record more sessions to see trends.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Session Highlights

    @ViewBuilder
    private var sessionHighlights: some View {
        if viewModel.dataPointCount >= 2 {
            VStack(alignment: .leading, spacing: AppSpacing.md) {
                Text("Highlights")
                    .font(AppFonts.sectionHeader)
                    .padding(.horizontal, AppSpacing.xs)

                if let best = viewModel.bestSession, let bestVal = viewModel.bestValue {
                    NavigationLink(value: best) {
                        sessionHighlightRow(
                            label: "Best Session",
                            session: best,
                            value: bestVal,
                            color: .green,
                            icon: "star.fill"
                        )
                    }
                    .buttonStyle(.plain)
                }

                if let worst = viewModel.worstSession, let worstVal = viewModel.worstValue {
                    NavigationLink(value: worst) {
                        sessionHighlightRow(
                            label: "Worst Session",
                            session: worst,
                            value: worstVal,
                            color: .red,
                            icon: "arrow.down.circle"
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder
    private func sessionHighlightRow(
        label: String,
        session: GaitSession,
        value: Double,
        color: Color,
        icon: String
    ) -> some View {
        HStack(spacing: AppSpacing.md) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                Text(session.date.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(formattedValue(value) + unitSuffix)
                .font(AppFonts.metricValue(.title3))
                .foregroundStyle(color)

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(AppSpacing.lg)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(label): \(formattedValue(value)) \(viewModel.selectedMetric.unit)" +
            " on \(session.date.formatted(date: .abbreviated, time: .omitted))"
        )
        .accessibilityHint("Double tap to view session details")
    }

    // MARK: - Empty State

    @ViewBuilder
    private var noDataView: some View {
        ContentUnavailableView(
            "No Data",
            systemImage: "chart.line.downtrend.xyaxis",
            description: Text(
                "No \(viewModel.selectedMetric.displayName.lowercased()) data" +
                " in the selected time range. Try a longer range or record more sessions."
            )
        )
    }

    // MARK: - Helpers

    private var unitSuffix: String {
        viewModel.selectedMetric.unit.isEmpty ? "" : " \(viewModel.selectedMetric.unit)"
    }

    /// Color for the current metric's category.
    private var metricColor: Color {
        switch viewModel.selectedCategory {
        case .posture:    return .green
        case .gait:       return .blue
        case .rom:        return .orange
        case .balance:    return .purple
        case .risk:       return .red
        case .clinical:   return .teal
        case .ergonomic:  return .indigo
        case .smoothness: return .cyan
        case .frailty:    return .pink
        }
    }

    /// Formats a Double value with appropriate precision.
    private func formattedValue(_ value: Double) -> String {
        if abs(value) >= 100 {
            return String(format: "%.0f", value)
        } else if abs(value) >= 10 {
            return String(format: "%.1f", value)
        } else {
            return String(format: "%.2f", value)
        }
    }
}

// MARK: - Audio Graph Accessibility

private struct ProgressChartDescriptor: AXChartDescriptorRepresentable {
    let title: String
    let data: [TrendPoint]
    let unit: String

    func makeChartDescriptor() -> AXChartDescriptor {
        let xAxis = AXNumericDataAxisDescriptor(
            title: "Date",
            range: 0...Double(max(1, data.count - 1)),
            gridlinePositions: []
        ) { idx in
            let i = Int(idx)
            guard i >= 0 && i < data.count else { return "" }
            return data[i].date.formatted(date: .abbreviated, time: .omitted)
        }

        let values = data.map(\.value)
        let minVal = values.min() ?? 0
        let maxVal = values.max() ?? 100

        let yAxis = AXNumericDataAxisDescriptor(
            title: title,
            range: minVal...maxVal,
            gridlinePositions: []
        ) { val in
            String(format: "%.1f \(unit)", val)
        }

        let series = AXDataSeriesDescriptor(
            name: title,
            isContinuous: true,
            dataPoints: data.enumerated().map { i, point in
                AXDataPoint(x: Double(i), y: point.value)
            }
        )

        return AXChartDescriptor(
            title: "\(title) Progress",
            summary: "Shows \(title.lowercased()) across \(data.count) sessions.",
            xAxis: xAxis,
            yAxis: yAxis,
            additionalAxes: [],
            series: [series]
        )
    }
}

// MARK: - Previews

#Preview {
    NavigationStack {
        ProgressHistoryView(sessions: [])
    }
}
