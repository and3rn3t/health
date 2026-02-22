// swiftlint:disable file_length
//
//  DashboardView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Large title, Liquid Glass cards, Swift Charts with Audio Graphs,
//  scroll edge effects, grouped sections.
//

import SwiftUI
import SwiftData
import Charts
import Accessibility

struct DashboardView: View {
    @Query(sort: \GaitSession.date, order: .reverse) private var sessions: [GaitSession]
    @State private var viewModel = DashboardViewModel()
    @State private var showCards = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.xl) {
                    // MARK: - Hero Score Ring
                    if let score = viewModel.recentPostureScore {
                        VStack(spacing: AppSpacing.sm) {
                            ScoreRingView(score: score, size: 140, lineWidth: 14)

                            if let latestDate = sessions.first?.date {
                                Text(latestDate.formatted(date: .abbreviated, time: .shortened))
                                    .font(AppFonts.metricLabel(.caption))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.top, AppSpacing.sm)
                    }

                    // MARK: - Quick Stats Cards
                    quickStatsSection

                    // MARK: - Clinical Quick Glance
                    if viewModel.totalSessions > 0 {
                        clinicalQuickGlance
                    }

                    // MARK: - Insights
                    if !viewModel.insights.isEmpty {
                        insightsSection
                    }

                    // MARK: - Goals
                    NavigationLink(destination: GoalsView()) {
                        HStack {
                            Image(systemName: "target")
                                .foregroundStyle(.blue)
                            Text("Goals & Progress")
                                .font(AppFonts.sectionHeader)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                        .padding(AppSpacing.lg)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
                        .appShadow(.card)
                    }
                    .buttonStyle(.plain)

                    // MARK: - Posture Score Trend
                    if !viewModel.postureScoreTrend.isEmpty {
                        trendChart(
                            title: "Posture Score",
                            icon: "chart.line.uptrend.xyaxis",
                            data: viewModel.postureScoreTrend,
                            color: .blue,
                            unit: ""
                        )
                    }

                    // MARK: - Walking Speed Trend
                    if !viewModel.walkingSpeedTrend.isEmpty {
                        trendChart(
                            title: "Walking Speed",
                            icon: "speedometer",
                            data: viewModel.walkingSpeedTrend,
                            color: .teal,
                            unit: "m/s"
                        )
                    }

                    // MARK: - Cadence Trend
                    if !viewModel.cadenceTrend.isEmpty {
                        trendChart(
                            title: "Cadence",
                            icon: "metronome.fill",
                            data: viewModel.cadenceTrend,
                            color: .green,
                            unit: "SPM"
                        )
                    }

                    // MARK: - CVA Trend
                    if !viewModel.cvaTrend.isEmpty {
                        trendChart(
                            title: "Craniovertebral Angle",
                            icon: "angle",
                            data: viewModel.cvaTrend,
                            color: .purple,
                            unit: "°"
                        )
                    }

                    // MARK: - Fall Risk Trend
                    if !viewModel.fallRiskTrend.isEmpty {
                        trendChart(
                            title: "Fall Risk Score",
                            icon: "exclamationmark.triangle.fill",
                            data: viewModel.fallRiskTrend,
                            color: .red,
                            unit: ""
                        )
                    }

                    // MARK: - Stride Length Trend
                    if !viewModel.strideLengthTrend.isEmpty {
                        trendChart(
                            title: "Stride Length",
                            icon: "ruler.fill",
                            data: viewModel.strideLengthTrend,
                            color: .orange,
                            unit: "m"
                        )
                    }

                    // MARK: - Empty state
                    if sessions.isEmpty {
                        ContentUnavailableView(
                            "No Sessions Yet",
                            systemImage: "figure.walk",
                            description: Text("Start a capture session to see your posture and gait analytics.")
                        )
                        .padding(.top, 40)
                    }
                }
                .padding()
                .opacity(showCards ? 1 : 0)
                .offset(y: showCards ? 0 : 20)
                .animation(.easeOut(duration: 0.5), value: showCards)
            }
            .refreshable {
                viewModel.refresh(sessions: sessions)
            }
            .reduceMotionAware()
            .navigationTitle("Dashboard")
            .onAppear {
                viewModel.refresh(sessions: sessions)
                withAnimation {
                    showCards = true
                }
            }
            .onChange(of: sessions.count) {
                viewModel.refresh(sessions: sessions)
            }
        }
    }

    // MARK: - Quick Stats

    @ViewBuilder
    private var quickStatsSection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: AppSpacing.md) {
            MetricCard(
                icon: "figure.stand",
                title: "Posture",
                value: viewModel.postureLabel,
                severity: viewModel.recentPostureScore.map { scoreSeverity($0) },
                tintColor: AppColors.scoreColor(for: viewModel.recentPostureScore ?? 0)
            )

            MetricCard(
                icon: "speedometer",
                title: "Walking Speed",
                value: viewModel.walkingSpeedLabel,
                severity: viewModel.recentWalkingSpeed.map { GaitThresholds.speedSeverity($0) },
                tintColor: .teal
            )

            MetricCard(
                icon: "metronome.fill",
                title: "Cadence",
                value: viewModel.recentCadence.map { String(format: "%.0f SPM", $0) } ?? "—",
                tintColor: .blue
            )

            MetricCard(
                icon: "ruler.fill",
                title: "Stride",
                value: viewModel.recentStrideLength.map { String(format: "%.2f m", $0) } ?? "—",
                tintColor: .blue
            )

            MetricCard(
                icon: "exclamationmark.triangle.fill",
                title: "Fall Risk",
                value: viewModel.fallRiskLabel,
                severity: fallRiskSeverity,
                tintColor: .red
            )

            MetricCard(
                icon: "clock.fill",
                title: "Sessions",
                value: "\(viewModel.totalSessions)",
                subtitle: viewModel.formattedTotalTime,
                tintColor: .indigo
            )
        }
    }

    // MARK: - Clinical Quick Glance

    @ViewBuilder
    private var clinicalQuickGlance: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text("Clinical Insights")
                .font(AppFonts.sectionHeader)
                .padding(.horizontal, AppSpacing.xs)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppSpacing.md) {
                    if let cva = viewModel.recentCVA {
                        MetricCard(
                            icon: "angle",
                            title: "CVA",
                            value: String(format: "%.0f°", cva),
                            severity: PostureThresholds.cvaSeverity(cva),
                            tintColor: .purple,
                            compact: true
                        )
                        .frame(width: 160)
                    }

                    if let sym = viewModel.recentGaitSymmetry {
                        MetricCard(
                            icon: "arrow.left.arrow.right",
                            title: "Symmetry",
                            value: String(format: "%.0f%%", sym),
                            severity: GaitThresholds.symmetrySeverity(sym),
                            tintColor: .blue,
                            compact: true
                        )
                        .frame(width: 160)
                    }

                    if let reba = viewModel.recentRebaScore {
                        MetricCard(
                            icon: "figure.stand",
                            title: "REBA",
                            value: "\(reba)",
                            severity: rebaSeverity(reba),
                            tintColor: .purple,
                            compact: true
                        )
                        .frame(width: 160)
                    }

                    if let fatigue = viewModel.recentFatigueIndex {
                        MetricCard(
                            icon: "battery.25percent",
                            title: "Fatigue",
                            value: String(format: "%.0f", fatigue),
                            severity: fatigueSeverity(fatigue),
                            tintColor: .orange,
                            compact: true
                        )
                        .frame(width: 160)
                    }

                    if let kendall = viewModel.recentKendallType {
                        MetricCard(
                            icon: "person.fill",
                            title: "Posture Type",
                            value: kendall.kendallShortName,
                            severity: kendall == "ideal" ? .normal : .mild,
                            tintColor: .green,
                            compact: true
                        )
                        .frame(width: 160)
                    }

                    if let pattern = viewModel.recentGaitPattern {
                        MetricCard(
                            icon: "figure.walk",
                            title: "Gait Pattern",
                            value: pattern.patternDisplayName,
                            severity: pattern == "normal" ? .normal : .mild,
                            tintColor: .teal,
                            compact: true
                        )
                        .frame(width: 160)
                    }
                }
                .padding(.horizontal, AppSpacing.xs)
            }
        }
    }

    // MARK: - Trend Chart

    @ViewBuilder
    private func trendChart(title: String, icon: String, data: [TrendPoint], color: Color, unit: String) -> some View {
        ChartCard(title: title, icon: icon) {
            Chart(data) { point in
                LineMark(
                    x: .value("Date", point.date),
                    y: .value(title, point.value)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(color.gradient)

                AreaMark(
                    x: .value("Date", point.date),
                    y: .value(title, point.value)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(color.opacity(0.1).gradient)
            }
            .chartYAxisLabel(unit)
            .accessibilityChartDescriptor(TrendChartDescriptor(title: title, data: data, unit: unit))
        }
        .accessibleChart(
            title: "\(title) Trend",
            summary: "Shows \(title.lowercased()) over your last \(data.count) sessions."
        )
    }

    // MARK: - Helpers

    private var fallRiskSeverity: ClinicalSeverity? {
        guard let level = viewModel.recentFallRiskLevel else { return nil }
        switch level {
        case "low": return .normal
        case "moderate": return .moderate
        case "high": return .severe
        default: return nil
        }
    }

    private func scoreSeverity(_ score: Double) -> ClinicalSeverity {
        switch score {
        case 80...: return .normal
        case 60..<80: return .mild
        case 40..<60: return .moderate
        default: return .severe
        }
    }

    private func rebaSeverity(_ score: Int) -> ClinicalSeverity {
        switch score {
        case 1: return .normal
        case 2...3: return .mild
        case 4...7: return .moderate
        default: return .severe
        }
    }

    private func fatigueSeverity(_ index: Double) -> ClinicalSeverity {
        if index < 25 { return .normal }
        if index < 50 { return .mild }
        if index < 75 { return .moderate }
        return .severe
    }
}

// MARK: - Insights Section

extension DashboardView {
    @ViewBuilder
    var insightsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                Text("Insights")
                    .font(AppFonts.sectionHeader)
                Spacer()
                if viewModel.insights.count > 5 {
                    NavigationLink("See All") {
                        List(viewModel.insights) { insight in
                            insightCard(insight)
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                        }
                        .listStyle(.plain)
                        .navigationTitle("All Insights")
                    }
                    .font(.subheadline)
                }
            }

            ForEach(viewModel.insights.prefix(5)) { insight in
                insightCard(insight)
            }
        }
    }

    @ViewBuilder
    private func insightCard(_ insight: Insight) -> some View {
        let card = SectionCard(accentColor: AppColors.severityColor(for: insight.severity)) {
            VStack(alignment: .leading, spacing: AppSpacing.sm) {
                HStack(alignment: .top, spacing: AppSpacing.md) {
                    Image(systemName: insight.icon)
                        .font(.title3)
                        .foregroundStyle(AppColors.severityColor(for: insight.severity))
                        .frame(width: 32)

                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        Text(insight.title)
                            .font(.subheadline.bold())
                        Text(insight.body)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer(minLength: 0)
                }

                // Exercise recommendation teaser
                if insight.hasExercises {
                    Divider()

                    ExerciseTeaser(exercises: insight.exercises, insightTitle: insight.title)
                }
            }
        }

        if insight.hasExercises {
            card
                .accessibilityHint("Contains \(insight.exercises.count) recommended exercises. Double tap to view.")
        } else {
            card
        }
    }
}

// MARK: - Exercise Teaser (inline in insight card)

/// Compact preview of exercises embedded in an insight card, with a button to see full details.
private struct ExerciseTeaser: View {
    let exercises: [ExerciseRecommendation]
    let insightTitle: String
    @State private var showExercises = false

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            // Show up to 3 exercise names as compact pills
            FlowLayout(spacing: AppSpacing.xs) {
                ForEach(exercises.prefix(3)) { exercise in
                    HStack(spacing: 4) {
                        Image(systemName: exercise.icon)
                            .font(.system(size: 10))
                        Text(exercise.name)
                            .font(.caption2.weight(.medium))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.tint.opacity(0.08), in: Capsule())
                    .foregroundStyle(.tint)
                }

                if exercises.count > 3 {
                    Text("+\(exercises.count - 3) more")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                }
            }

            Button {
                showExercises = true
            } label: {
                HStack(spacing: AppSpacing.xs) {
                    Image(systemName: "figure.strengthtraining.traditional")
                        .font(.caption)
                    Text("View \(exercises.count) Recommended Exercise\(exercises.count == 1 ? "" : "s")")
                        .font(.caption.weight(.semibold))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption2)
                }
                .padding(.vertical, AppSpacing.sm)
                .padding(.horizontal, AppSpacing.md)
                .background(.tint.opacity(0.08), in: RoundedRectangle(cornerRadius: AppRadius.small))
            }
            .buttonStyle(.plain)
        }
        .sheet(isPresented: $showExercises) {
            ExerciseListView(
                title: insightTitle,
                exercises: exercises
            )
        }
    }
}

// MARK: - FlowLayout (for exercise pills)

/// Simple horizontal flow layout that wraps items to the next line.
private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        for (index, subview) in subviews.enumerated() {
            guard index < result.positions.count else { break }
            subview.place(at: CGPoint(
                x: bounds.minX + result.positions[index].x,
                y: bounds.minY + result.positions[index].y
            ), proposal: .unspecified)
        }
    }

    private struct LayoutResult {
        var size: CGSize
        var positions: [CGPoint]
    }

    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> LayoutResult {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0
        var totalWidth: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if currentX + size.width > maxWidth && currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }

            positions.append(CGPoint(x: currentX, y: currentY))
            lineHeight = max(lineHeight, size.height)
            currentX += size.width + spacing
            totalWidth = max(totalWidth, currentX - spacing)
        }

        return LayoutResult(
            size: CGSize(width: totalWidth, height: currentY + lineHeight),
            positions: positions
        )
    }
}

// MARK: - Audio Graph Descriptor (Accessibility)

private struct TrendChartDescriptor: AXChartDescriptorRepresentable {
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
            title: "\(title) Trend",
            summary: "Shows \(title.lowercased()) over your last \(data.count) sessions.",
            xAxis: xAxis,
            yAxis: yAxis,
            additionalAxes: [],
            series: [series]
        )
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: GaitSession.self, inMemory: true)
}
