//
//  ComparisonView.swift
//  Andernet Posture
//
//  Phase 2: Side-by-side session comparison with delta indicators and overlaid charts.
//

import SwiftUI
import Charts
import Accessibility

struct ComparisonView: View {
    let baseline: GaitSession
    let current: GaitSession

    @State private var baselineVM: SessionDetailViewModel
    @State private var currentVM: SessionDetailViewModel

    init(baseline: GaitSession, current: GaitSession) {
        self.baseline = baseline
        self.current = current
        _baselineVM = State(initialValue: SessionDetailViewModel(session: baseline))
        _currentVM = State(initialValue: SessionDetailViewModel(session: current))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: AppSpacing.xl) {
                dateHeader
                metricsGrid
                comparisonChartsSection
            }
            .padding(AppSpacing.lg)
        }
        .navigationTitle("Compare Sessions")
        .navigationBarTitleDisplayMode(.large)
        .reduceMotionAware()
    }

    // MARK: - Date Header

    @ViewBuilder
    private var dateHeader: some View {
        HStack {
            VStack(spacing: AppSpacing.sm) {
                Text("Baseline")
                    .font(.caption.bold())
                    .foregroundStyle(.blue)
                if let score = baseline.postureScore {
                    ScoreRingView(score: score, size: 48, lineWidth: 5, showLabel: false)
                        .overlay {
                            Text("\(Int(score))")
                                .font(AppFonts.metricValue(.caption))
                        }
                }
                Text(baseline.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "arrow.right")
                .font(.title3)
                .foregroundStyle(.secondary)

            Spacer()

            VStack(spacing: AppSpacing.sm) {
                Text("Current")
                    .font(.caption.bold())
                    .foregroundStyle(.orange)
                if let score = current.postureScore {
                    ScoreRingView(score: score, size: 48, lineWidth: 5, showLabel: false)
                        .overlay {
                            Text("\(Int(score))")
                                .font(AppFonts.metricValue(.caption))
                        }
                }
                Text(current.date.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(AppSpacing.lg)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        .appShadow(.card)
    }

    // MARK: - Metrics Grid

    @ViewBuilder
    private var metricsGrid: some View {
        SectionCard(title: "Summary Comparison", icon: "chart.bar.doc.horizontal") {
            VStack(spacing: AppSpacing.sm) {
                metricRow(
                    label: "Posture Score",
                baseVal: baseline.postureScore,
                curVal: current.postureScore,
                format: "%.0f",
                higherIsBetter: true
            )
            metricRow(
                label: "Walking Speed",
                baseVal: baseline.averageWalkingSpeedMPS,
                curVal: current.averageWalkingSpeedMPS,
                format: "%.2f m/s",
                higherIsBetter: true
            )
            metricRow(
                label: "Cadence",
                baseVal: baseline.averageCadenceSPM,
                curVal: current.averageCadenceSPM,
                format: "%.0f SPM",
                higherIsBetter: true
            )
            metricRow(
                label: "Stride Length",
                baseVal: baseline.averageStrideLengthM,
                curVal: current.averageStrideLengthM,
                format: "%.2f m",
                higherIsBetter: true
            )
            metricRow(
                label: "CVA",
                baseVal: baseline.averageCVADeg,
                curVal: current.averageCVADeg,
                format: "%.1f°",
                higherIsBetter: true
            )
            metricRow(
                label: "Fall Risk",
                baseVal: baseline.fallRiskScore,
                curVal: current.fallRiskScore,
                format: "%.0f",
                higherIsBetter: false
            )
            }
        }
    }

    @ViewBuilder
    private func metricRow(
        label: String,
        baseVal: Double?,
        curVal: Double?,
        format: String,
        higherIsBetter: Bool
    ) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text(baseVal.map { String(format: format, $0) } ?? "—")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.blue)
                .frame(width: 80, alignment: .trailing)

            Text(curVal.map { String(format: format, $0) } ?? "—")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.orange)
                .frame(width: 80, alignment: .trailing)

            deltaIndicator(
                baseVal: baseVal,
                curVal: curVal,
                higherIsBetter: higherIsBetter
            )
            .frame(width: 30)
        }
        .clinicalMetricAccessibility(
            label: label,
            value: "\(baseVal.map { String(format: format, $0) } ?? "none") to \(curVal.map { String(format: format, $0) } ?? "none")",
            severity: nil
        )
        Divider()
    }

    @ViewBuilder
    private func deltaIndicator(
        baseVal: Double?,
        curVal: Double?,
        higherIsBetter: Bool
    ) -> some View {
        if let b = baseVal, let c = curVal, b != 0 {
            let diff = c - b
            let improved = higherIsBetter ? diff > 0 : diff < 0
            Image(systemName: improved ? "arrow.up" : "arrow.down")
                .font(.caption.bold())
                .foregroundStyle(improved ? .green : .red)
                .accessibilityLabel(improved ? "Improved" : "Declined")
        } else {
            Text("—")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Charts Section

    @ViewBuilder
    private var comparisonChartsSection: some View {
        overlayChart(
            title: "Posture Score",
            baseData: baselineVM.trunkLeanSeries.isEmpty
                ? [] : baselineVM.cvaSeries,
            curData: currentVM.trunkLeanSeries.isEmpty
                ? [] : currentVM.cvaSeries,
            unit: "°",
            fallback: buildPostureScoreSeries
        )

        overlayChart(
            title: "CVA",
            baseData: baselineVM.cvaSeries,
            curData: currentVM.cvaSeries,
            unit: "°"
        )

        overlayChart(
            title: "Walking Speed",
            baseData: baselineVM.walkingSpeedSeries,
            curData: currentVM.walkingSpeedSeries,
            unit: "m/s"
        )

        overlayChart(
            title: "Cadence",
            baseData: baselineVM.cadenceSeries,
            curData: currentVM.cadenceSeries,
            unit: "SPM"
        )

        overlayChart(
            title: "Trunk Lean",
            baseData: baselineVM.trunkLeanSeries,
            curData: currentVM.trunkLeanSeries,
            unit: "°"
        )
    }

    /// Build posture score time-series from decoded frames.
    private func buildPostureScoreSeries(
        _ vm: SessionDetailViewModel
    ) -> [TimeSeriesPoint] {
        let frames = vm.session.decodedFrames
        guard let start = frames.first?.timestamp else { return [] }
        let interval = 0.5
        var last = -interval
        var result: [TimeSeriesPoint] = []
        for f in frames {
            let t = f.timestamp - start
            guard t - last >= interval else { continue }
            last = t
            result.append(TimeSeriesPoint(time: t, value: f.postureScore))
        }
        return result
    }

    @ViewBuilder
    private func overlayChart(
        title: String,
        baseData: [TimeSeriesPoint],
        curData: [TimeSeriesPoint],
        unit: String,
        fallback: ((SessionDetailViewModel) -> [TimeSeriesPoint])? = nil
    ) -> some View {
        let bData = baseData.isEmpty
            ? (fallback?(baselineVM) ?? []) : baseData
        let cData = curData.isEmpty
            ? (fallback?(currentVM) ?? []) : curData

        if !bData.isEmpty || !cData.isEmpty {
            ChartCard(title: title, icon: "chart.xyaxis.line") {
                Chart {
                    ForEach(bData) { pt in
                        LineMark(
                            x: .value("Time", pt.time),
                            y: .value(title, pt.value),
                            series: .value("Session", "Baseline")
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(.blue)
                    }
                    ForEach(bData) { pt in
                        AreaMark(
                            x: .value("Time", pt.time),
                            y: .value(title, pt.value),
                            series: .value("Session", "Baseline")
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(.blue.opacity(0.08))
                    }
                    ForEach(cData) { pt in
                        LineMark(
                            x: .value("Time", pt.time),
                            y: .value(title, pt.value),
                            series: .value("Session", "Current")
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(.orange)
                    }
                    ForEach(cData) { pt in
                        AreaMark(
                            x: .value("Time", pt.time),
                            y: .value(title, pt.value),
                            series: .value("Session", "Current")
                        )
                        .interpolationMethod(.catmullRom)
                        .foregroundStyle(.orange.opacity(0.08))
                    }
                }
                .chartXAxisLabel("Time (sec)")
                .chartYAxisLabel(unit)
                .chartForegroundStyleScale([
                    "Baseline": Color.blue,
                    "Current": Color.orange
                ])
                .chartLegend(position: .bottom)
                .accessibilityChartDescriptor(
                    ComparisonChartDescriptor(
                        title: title,
                        baseData: bData,
                        curData: cData,
                        unit: unit
                    )
                )
            }
            .accessibleChart(
                title: "\(title) Comparison",
                summary: "Overlay of baseline vs current \(title.lowercased())."
            )
        }
    }
}

// MARK: - Comparison Audio Graph Descriptor

private struct ComparisonChartDescriptor: AXChartDescriptorRepresentable {
    let title: String
    let baseData: [TimeSeriesPoint]
    let curData: [TimeSeriesPoint]
    let unit: String

    func makeChartDescriptor() -> AXChartDescriptor {
        let allValues = baseData.map(\.value) + curData.map(\.value)
        let allTimes = baseData.map(\.time) + curData.map(\.time)
        let minVal = allValues.min() ?? 0
        let maxVal = max(allValues.max() ?? 1, minVal + 0.1)
        let maxTime = allTimes.max() ?? 1

        let xAxis = AXNumericDataAxisDescriptor(
            title: "Time (seconds)",
            range: 0...maxTime,
            gridlinePositions: []
        ) { String(format: "%.0fs", $0) }

        let yAxis = AXNumericDataAxisDescriptor(
            title: title,
            range: minVal...maxVal,
            gridlinePositions: []
        ) { String(format: "%.1f \(unit)", $0) }

        let baseSeries = AXDataSeriesDescriptor(
            name: "Baseline",
            isContinuous: true,
            dataPoints: baseData.map { AXDataPoint(x: $0.time, y: $0.value) }
        )
        let curSeries = AXDataSeriesDescriptor(
            name: "Current",
            isContinuous: true,
            dataPoints: curData.map { AXDataPoint(x: $0.time, y: $0.value) }
        )

        return AXChartDescriptor(
            title: "\(title) Comparison",
            summary: "Overlay of baseline vs current \(title.lowercased()).",
            xAxis: xAxis,
            yAxis: yAxis,
            additionalAxes: [],
            series: [baseSeries, curSeries]
        )
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ComparisonView(
            baseline: GaitSession(
                date: Calendar.current.date(byAdding: .day, value: -7, to: .now)!,
                duration: 120,
                averageCadenceSPM: 108,
                averageStrideLengthM: 0.68,
                averageTrunkLeanDeg: 6.0,
                postureScore: 75
            ),
            current: GaitSession(
                date: .now,
                duration: 150,
                averageCadenceSPM: 114,
                averageStrideLengthM: 0.73,
                averageTrunkLeanDeg: 4.2,
                postureScore: 84
            )
        )
    }
}
