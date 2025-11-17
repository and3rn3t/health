//
//  AdvancedAnalyticsView.swift
//  VitalSense
//
//  Advanced analytics with correlation charts and trend analysis
//  Enhanced from web app HealthAnalytics component
//

import SwiftUI
import Charts

@available(iOS 16.0, *)
struct AdvancedAnalyticsView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @State private var selectedTimeRange: TimeRange = .week
    @State private var selectedMetric1: MetricType = .heartRate
    @State private var selectedMetric2: MetricType = .steps
    @State private var showingCorrelation = false

    enum TimeRange: String, CaseIterable {
        case day = "Day"
        case week = "Week"
        case month = "Month"
        case year = "Year"
    }

    enum MetricType: String, CaseIterable {
        case heartRate = "Heart Rate"
        case steps = "Steps"
        case distance = "Distance"
        case walkingSteadiness = "Walking Steadiness"
        case sleepQuality = "Sleep Quality"
        case fallRisk = "Fall Risk"

        var icon: String {
            switch self {
            case .heartRate: return "heart.fill"
            case .steps: return "figure.walk"
            case .distance: return "mappin.circle.fill"
            case .walkingSteadiness: return "figure.stand"
            case .sleepQuality: return "moon.fill"
            case .fallRisk: return "exclamationmark.triangle.fill"
            }
        }

        var unit: String {
            switch self {
            case .heartRate: return "bpm"
            case .steps: return "steps"
            case .distance: return "m"
            case .walkingSteadiness: return "%"
            case .sleepQuality: return "%"
            case .fallRisk: return "%"
            }
        }
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Time Range Selector
                    Picker("Time Range", selection: $selectedTimeRange) {
                        ForEach(TimeRange.allCases, id: \.self) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding()

                    // Trend Charts
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Trends")
                            .font(.headline)
                            .padding(.horizontal)

                        MetricTrendChart(
                            title: selectedMetric1.rawValue,
                            metric: selectedMetric1,
                            timeRange: selectedTimeRange,
                            healthKitManager: healthKitManager
                        )
                        .padding(.horizontal)
                    }

                    // Correlation Analysis
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Correlation Analysis")
                            .font(.headline)
                            .padding(.horizontal)

                        CorrelationChartView(
                            metric1: selectedMetric1,
                            metric2: selectedMetric2,
                            timeRange: selectedTimeRange,
                            healthKitManager: healthKitManager
                        )
                        .padding(.horizontal)

                        HStack {
                            Picker("Metric 1", selection: $selectedMetric1) {
                                ForEach(MetricType.allCases, id: \.self) { metric in
                                    Text(metric.rawValue).tag(metric)
                                }
                            }
                            .pickerStyle(.menu)

                            Picker("Metric 2", selection: $selectedMetric2) {
                                ForEach(MetricType.allCases, id: \.self) { metric in
                                    Text(metric.rawValue).tag(metric)
                                }
                            }
                            .pickerStyle(.menu)
                        }
                        .padding(.horizontal)
                    }

                    // Pattern Detection
                    PatternDetectionCard(timeRange: selectedTimeRange)
                        .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Advanced Analytics")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

// MARK: - Metric Trend Chart

@available(iOS 16.0, *)
struct MetricTrendChart: View {
    let title: String
    let metric: AdvancedAnalyticsView.MetricType
    let timeRange: AdvancedAnalyticsView.TimeRange
    let healthKitManager: HealthKitManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: metric.icon)
                    .foregroundColor(.accentColor)

                Text(title)
                    .font(.headline)

                Spacer()

                if let latest = sampleData.last {
                    Text("\(Int(latest.value)) \(metric.unit)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Chart(sampleData) { point in
                LineMark(
                    x: .value("Date", point.date),
                    y: .value("Value", point.value)
                )
                .foregroundStyle(.blue)
                .lineStyle(StrokeStyle(lineWidth: 2))

                AreaMark(
                    x: .value("Date", point.date),
                    y: .value("Value", point.value)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [.blue.opacity(0.3), .blue.opacity(0.05)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                PointMark(
                    x: .value("Date", point.date),
                    y: .value("Value", point.value)
                )
                .foregroundStyle(.blue)
                .symbolSize(36)
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel(format: dateFormat)
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var dateFormat: Date.FormatStyle {
        switch timeRange {
        case .day: return .dateTime.hour()
        case .week: return .dateTime.weekday(.abbreviated)
        case .month: return .dateTime.day().month(.abbreviated)
        case .year: return .dateTime.month(.abbreviated)
        }
    }

    private var sampleData: [DataPoint] {
        // Generate sample data based on metric type
        let count = timeRange == .day ? 24 : timeRange == .week ? 7 : timeRange == .month ? 30 : 12
        let calendar = Calendar.current
        let now = Date()

        return (0..<count).map { index in
            let date: Date
            switch timeRange {
            case .day:
                date = calendar.date(byAdding: .hour, value: -count + index, to: now) ?? now
            case .week:
                date = calendar.date(byAdding: .day, value: -count + index, to: now) ?? now
            case .month:
                date = calendar.date(byAdding: .day, value: -count + index, to: now) ?? now
            case .year:
                date = calendar.date(byAdding: .month, value: -count + index, to: now) ?? now
            }

            let baseValue: Double
            switch metric {
            case .heartRate: baseValue = 70
            case .steps: baseValue = 5000
            case .distance: baseValue = 3000
            case .walkingSteadiness: baseValue = 75
            case .sleepQuality: baseValue = 80
            case .fallRisk: baseValue = 25
            }

            let variation = Double.random(in: -0.2...0.2) * baseValue
            let trend = Double(index) / Double(count) * baseValue * 0.1

            return DataPoint(date: date, value: baseValue + variation + trend)
        }
    }

    struct DataPoint: Identifiable {
        let id = UUID()
        let date: Date
        let value: Double
    }
}

// MARK: - Correlation Chart

@available(iOS 16.0, *)
struct CorrelationChartView: View {
    let metric1: AdvancedAnalyticsView.MetricType
    let metric2: AdvancedAnalyticsView.MetricType
    let timeRange: AdvancedAnalyticsView.TimeRange
    let healthKitManager: HealthKitManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(metric1.rawValue)
                        .font(.headline)
                    Text("vs \(metric2.rawValue)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                CorrelationBadge(correlation: calculatedCorrelation)
            }

            Chart(correlationData) { point in
                PointMark(
                    x: .value(metric1.rawValue, point.metric1Value),
                    y: .value(metric2.rawValue, point.metric2Value)
                )
                .foregroundStyle(.blue.opacity(0.6))
                .symbolSize(50)

                // Regression line
                LineMark(
                    x: .value("X", regressionLineStart.x),
                    y: .value("Y", regressionLineStart.y)
                )
                .foregroundStyle(.green.opacity(0.5))
                .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))

                LineMark(
                    x: .value("X", regressionLineEnd.x),
                    y: .value("Y", regressionLineEnd.y)
                )
                .foregroundStyle(.green.opacity(0.5))
                .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
            }
            .frame(height: 250)
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }

            Text(correlationDescription)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var correlationData: [CorrelationPoint] {
        // Generate sample correlation data
        let count = timeRange == .day ? 24 : timeRange == .week ? 7 : timeRange == .month ? 30 : 12

        let base1: Double
        let base2: Double
        switch metric1 {
        case .heartRate: base1 = 70
        case .steps: base1 = 5000
        case .distance: base1 = 3000
        case .walkingSteadiness: base1 = 75
        case .sleepQuality: base1 = 80
        case .fallRisk: base1 = 25
        }

        switch metric2 {
        case .heartRate: base2 = 70
        case .steps: base2 = 5000
        case .distance: base2 = 3000
        case .walkingSteadiness: base2 = 75
        case .sleepQuality: base2 = 80
        case .fallRisk: base2 = 25
        }

        return (0..<count).map { _ in
            let val1 = base1 + Double.random(in: -0.3...0.3) * base1
            // Simulate some correlation
            let correlatedVariation = val1 / base1 * 0.2 * base2
            let val2 = base2 + correlatedVariation + Double.random(in: -0.2...0.2) * base2

            return CorrelationPoint(metric1Value: val1, metric2Value: val2)
        }
    }

    private var calculatedCorrelation: Double {
        // Calculate Pearson correlation coefficient
        let data = correlationData
        guard data.count > 1 else { return 0 }

        let mean1 = data.map { $0.metric1Value }.reduce(0, +) / Double(data.count)
        let mean2 = data.map { $0.metric2Value }.reduce(0, +) / Double(data.count)

        var numerator = 0.0
        var sumSq1 = 0.0
        var sumSq2 = 0.0

        for point in data {
            let diff1 = point.metric1Value - mean1
            let diff2 = point.metric2Value - mean2
            numerator += diff1 * diff2
            sumSq1 += diff1 * diff1
            sumSq2 += diff2 * diff2
        }

        let denominator = sqrt(sumSq1 * sumSq2)
        guard denominator > 0 else { return 0 }

        return numerator / denominator
    }

    private var correlationDescription: String {
        let corr = abs(calculatedCorrelation)
        if corr > 0.7 {
            return "Strong \(calculatedCorrelation > 0 ? "positive" : "negative") correlation"
        } else if corr > 0.3 {
            return "Moderate \(calculatedCorrelation > 0 ? "positive" : "negative") correlation"
        } else {
            return "Weak correlation"
        }
    }

    private var regressionLineStart: (x: Double, y: Double) {
        let data = correlationData
        let minX = data.map { $0.metric1Value }.min() ?? 0
        let minY = data.map { $0.metric2Value }.min() ?? 0
        return (x: minX, y: minY)
    }

    private var regressionLineEnd: (x: Double, y: Double) {
        let data = correlationData
        let maxX = data.map { $0.metric1Value }.max() ?? 100
        let maxY = data.map { $0.metric2Value }.max() ?? 100
        return (x: maxX, y: maxY)
    }

    struct CorrelationPoint: Identifiable {
        let id = UUID()
        let metric1Value: Double
        let metric2Value: Double
    }
}

struct CorrelationBadge: View {
    let correlation: Double

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: correlation > 0 ? "arrow.up.right" : "arrow.down.right")
                .font(.caption)

            Text(String(format: "%.2f", abs(correlation)))
                .font(.caption)
                .fontWeight(.semibold)
        }
        .foregroundColor(badgeColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(badgeColor.opacity(0.15))
        .cornerRadius(8)
    }

    private var badgeColor: Color {
        let absCorr = abs(correlation)
        if absCorr > 0.7 {
            return .green
        } else if absCorr > 0.3 {
            return .orange
        } else {
            return .gray
        }
    }
}

// MARK: - Pattern Detection Card

struct PatternDetectionCard: View {
    let timeRange: AdvancedAnalyticsView.TimeRange

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.purple)

                Text("Pattern Detection")
                    .font(.headline)
            }

            VStack(alignment: .leading, spacing: 8) {
                PatternItem(
                    icon: "arrow.up.circle.fill",
                    title: "Upward Trend",
                    description: "Heart rate shows improving trend over last week",
                    color: .green
                )

                PatternItem(
                    icon: "waveform.path",
                    title: "Daily Pattern",
                    description: "Peak activity detected between 10 AM - 2 PM",
                    color: .blue
                )

                PatternItem(
                    icon: "exclamationmark.triangle.fill",
                    title: "Anomaly Detected",
                    description: "Unusual spike in fall risk on Tuesday",
                    color: .orange
                )
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PatternItem: View {
    let icon: String
    let title: String
    let description: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
