import SwiftUI
import Charts

// MARK: - Enhanced Chart Components for VitalSense

/// Enhanced health data chart with smooth animations and better accessibility
@available(iOS 16.0, *)
struct EnhancedHealthChart: View {
    let data: [HealthDataPoint]
    let chartType: ChartType
    let title: String
    let unit: String
    let timeRange: TimeRange
    let healthThreshold: HealthThreshold?

    @State private var animateChart = false
    @State private var selectedDataPoint: HealthDataPoint?

    struct HealthDataPoint: Identifiable, Equatable {
        let id = UUID()
        let date: Date
        let value: Double
        let category: String?

        static func == (lhs: HealthDataPoint, rhs: HealthDataPoint) -> Bool {
            lhs.id == rhs.id
        }
    }

    enum ChartType {
        case line, area, bar, point
    }

    enum TimeRange {
        case hour, day, week, month, year

        var formatStyle: Date.FormatStyle {
            switch self {
            case .hour: return .dateTime.hour().minute()
            case .day: return .dateTime.hour()
            case .week: return .dateTime.weekday(.abbreviated)
            case .month: return .dateTime.day().month(.abbreviated)
            case .year: return .dateTime.month(.abbreviated)
            }
        }

        var displayName: String {
            switch self {
            case .hour: return "Last Hour"
            case .day: return "Today"
            case .week: return "This Week"
            case .month: return "This Month"
            case .year: return "This Year"
            }
        }
    }

    struct HealthThreshold {
        let normal: ClosedRange<Double>
        let warning: ClosedRange<Double>
        let critical: ClosedRange<Double>

        func status(for value: Double) -> EnhancedMetricCard.HealthStatus {
            if normal.contains(value) {
                return .good
            } else if warning.contains(value) {
                return .fair
            } else if critical.contains(value) {
                return .poor
            } else {
                return .unknown
            }
        }

        func color(for value: Double) -> Color {
            return status(for: value).color
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.medium) {
            // Chart header
            chartHeader

            // Chart content
            chartContent

            // Chart footer with insights
            if !data.isEmpty {
                chartInsights
            }
        }
        .padding(ModernDesignSystem.Spacing.medium)
        .background {
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                .fill(.regularMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                        .stroke(ModernDesignSystem.Colors.border, lineWidth: 0.5)
                }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).delay(0.2)) {
                animateChart = true
            }
        }
    }

    private var chartHeader: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(ModernDesignSystem.Typography.title3)
                    .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                Text(timeRange.displayName)
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
            }

            Spacer()

            if let latest = data.last {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(latest.value))")
                        .font(ModernDesignSystem.Typography.numericMedium)
                        .foregroundColor(healthThreshold?.color(for: latest.value) ?? ModernDesignSystem.Colors.primary)

                    Text(unit)
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }
        }
    }

    @ViewBuilder
    private var chartContent: some View {
        if data.isEmpty {
            emptyChartState
        } else {
            Chart(data) { dataPoint in
                switch chartType {
                case .line:
                    LineMark(
                        x: .value("Time", dataPoint.date),
                        y: .value("Value", animateChart ? dataPoint.value : 0)
                    )
                    .foregroundStyle(gradientStyle)
                    .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round))

                case .area:
                    AreaMark(
                        x: .value("Time", dataPoint.date),
                        y: .value("Value", animateChart ? dataPoint.value : 0)
                    )
                    .foregroundStyle(areaGradient)

                    LineMark(
                        x: .value("Time", dataPoint.date),
                        y: .value("Value", animateChart ? dataPoint.value : 0)
                    )
                    .foregroundStyle(gradientStyle)
                    .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round))

                case .bar:
                    BarMark(
                        x: .value("Time", dataPoint.date),
                        y: .value("Value", animateChart ? dataPoint.value : 0)
                    )
                    .foregroundStyle(gradientStyle)
                    .cornerRadius(4)

                case .point:
                    PointMark(
                        x: .value("Time", dataPoint.date),
                        y: .value("Value", animateChart ? dataPoint.value : 0)
                    )
                    .foregroundStyle(healthThreshold?.color(for: dataPoint.value) ?? ModernDesignSystem.Colors.primary)
                    .symbolSize(animateChart ? 64 : 0)
                }
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks(values: .stride(by: xAxisStride)) { value in
                    AxisGridLine()
                        .foregroundStyle(ModernDesignSystem.Colors.border.opacity(0.3))
                    AxisTick()
                        .foregroundStyle(ModernDesignSystem.Colors.textTertiary)
                    AxisValueLabel {
                        if let date = value.as(Date.self) {
                            Text(date, format: timeRange.formatStyle)
                                .font(ModernDesignSystem.Typography.caption2)
                                .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                        .foregroundStyle(ModernDesignSystem.Colors.border.opacity(0.3))
                    AxisTick()
                        .foregroundStyle(ModernDesignSystem.Colors.textTertiary)
                    AxisValueLabel {
                        if let doubleValue = value.as(Double.self) {
                            Text("\(Int(doubleValue))")
                                .font(ModernDesignSystem.Typography.caption2)
                                .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                        }
                    }
                }
            }
            .animation(.easeInOut(duration: 1.0), value: animateChart)

            // Add threshold lines if available
            if let threshold = healthThreshold {
                Chart(data) { _ in
                    RuleMark(y: .value("Normal Range", threshold.normal.upperBound))
                        .foregroundStyle(ModernDesignSystem.Colors.healthGreen.opacity(0.5))
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                }
                .frame(height: 200)
            }
        }
    }

    private var emptyChartState: some View {
        VStack(spacing: ModernDesignSystem.Spacing.medium) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 48))
                .foregroundColor(ModernDesignSystem.Colors.textTertiary)

            Text("No data available")
                .font(ModernDesignSystem.Typography.body)
                .foregroundColor(ModernDesignSystem.Colors.textSecondary)

            Text("Start monitoring to see your health trends")
                .font(ModernDesignSystem.Typography.caption)
                .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(height: 200)
        .frame(maxWidth: .infinity)
    }

    private var chartInsights: some View {
        HStack(spacing: ModernDesignSystem.Spacing.large) {
            if let min = data.map(\.value).min(),
               let max = data.map(\.value).max() {

                InsightItem(
                    title: "Min",
                    value: "\(Int(min))",
                    unit: unit,
                    color: ModernDesignSystem.Colors.secondary
                )

                InsightItem(
                    title: "Max",
                    value: "\(Int(max))",
                    unit: unit,
                    color: ModernDesignSystem.Colors.primary
                )

                let average = data.map(\.value).reduce(0, +) / Double(data.count)
                InsightItem(
                    title: "Avg",
                    value: "\(Int(average))",
                    unit: unit,
                    color: ModernDesignSystem.Colors.textSecondary
                )
            }

            Spacer()
        }
    }

    private var gradientStyle: LinearGradient {
        LinearGradient(
            colors: [ModernDesignSystem.Colors.primary, ModernDesignSystem.Colors.secondary],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    private var areaGradient: LinearGradient {
        LinearGradient(
            colors: [
                ModernDesignSystem.Colors.primary.opacity(0.3),
                ModernDesignSystem.Colors.primary.opacity(0.1),
                ModernDesignSystem.Colors.primary.opacity(0.0)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var xAxisStride: Calendar.Component {
        switch timeRange {
        case .hour: return .minute
        case .day: return .hour
        case .week: return .day
        case .month: return .weekOfYear
        case .year: return .month
        }
    }
}

/// Individual insight item for chart footer
struct InsightItem: View {
    let title: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(ModernDesignSystem.Typography.caption2)
                .foregroundColor(ModernDesignSystem.Colors.textTertiary)

            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(ModernDesignSystem.Typography.numericSmall)
                    .foregroundColor(color)

                Text(unit)
                    .font(ModernDesignSystem.Typography.caption2)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
            }
        }
    }
}

/// Compact chart widget for dashboard overview
@available(iOS 16.0, *)
struct CompactHealthChart: View {
    let data: [EnhancedHealthChart.HealthDataPoint]
    let title: String
    let currentValue: String
    let unit: String
    let trend: EnhancedMetricCard.TrendDirection?

    @State private var animateChart = false

    var body: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.small) {
            // Header
            HStack {
                Text(title)
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)

                Spacer()

                if let trend = trend {
                    HStack(spacing: 2) {
                        Image(systemName: trend.icon)
                            .font(.caption2)
                        Text("5%")
                            .font(.caption2)
                    }
                    .foregroundColor(trend.color)
                }
            }

            // Value and mini chart
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .lastTextBaseline, spacing: 2) {
                        Text(currentValue)
                            .font(ModernDesignSystem.Typography.numericMedium)
                            .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                        Text(unit)
                            .font(ModernDesignSystem.Typography.caption2)
                            .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                    }
                }

                Spacer()

                // Mini chart
                if !data.isEmpty {
                    Chart(data) { dataPoint in
                        LineMark(
                            x: .value("Time", dataPoint.date),
                            y: .value("Value", animateChart ? dataPoint.value : 0)
                        )
                        .foregroundStyle(ModernDesignSystem.Colors.primary)
                        .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round))
                    }
                    .chartXAxis(.hidden)
                    .chartYAxis(.hidden)
                    .frame(width: 60, height: 30)
                    .animation(.easeInOut(duration: 0.8), value: animateChart)
                }
            }
        }
        .padding(ModernDesignSystem.Spacing.small)
        .background {
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.medium)
                .fill(ModernDesignSystem.Colors.surface)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.8).delay(0.1)) {
                animateChart = true
            }
        }
    }
}

// MARK: - Preview Support
#if DEBUG
@available(iOS 16.0, *)
struct EnhancedCharts_Previews: PreviewProvider {
    static var sampleData: [EnhancedHealthChart.HealthDataPoint] {
        let calendar = Calendar.current
        let now = Date()

        return (0..<24).compactMap { hour in
            guard let date = calendar.date(byAdding: .hour, value: -hour, to: now) else { return nil }
            return EnhancedHealthChart.HealthDataPoint(
                date: date,
                value: Double.random(in: 60...100),
                category: nil
            )
        }.reversed()
    }

    static var previews: some View {
        ScrollView {
            VStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedHealthChart(
                    data: sampleData,
                    chartType: .area,
                    title: "Heart Rate",
                    unit: "BPM",
                    timeRange: .day,
                    healthThreshold: .init(
                        normal: 60...100,
                        warning: 50...60,
                        critical: 0...50
                    )
                )

                CompactHealthChart(
                    data: sampleData,
                    title: "Heart Rate",
                    currentValue: "72",
                    unit: "BPM",
                    trend: .stable
                )
            }
            .padding()
        }
        .background(ModernDesignSystem.Colors.background)
    }
}
#endif
