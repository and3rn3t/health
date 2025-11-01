//
//  HealthMetricsView.swift
//  VitalSense
//
//  Comprehensive health metrics display with iOS 26 enhancements
//  Created: 2024-12-19
//

import SwiftUI
import HealthKit
import Charts
import OSLog

struct HealthMetricsView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @StateObject private var metricsViewModel = HealthMetricsViewModel()

    @State private var selectedTimeRange: TimeRange = .week
    @State private var selectedCategory: MetricCategory = .vitals
    @State private var showingMetricDetail = false
    @State private var selectedMetric: HealthMetricData?

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    // Time Range Selector
                    timeRangeSelector

                    // Metric Categories
                    categorySelector

                    // Metrics Grid
                    metricsGrid

                    // Trending Insights
                    trendingInsights

                    // Health Score Card
                    healthScoreCard
                }
                .padding(.horizontal)
            }
            .navigationTitle("Health Metrics")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await metricsViewModel.refreshMetrics()
            }
        }
        .sheet(item: $selectedMetric) { metric in
            MetricDetailView(metric: metric)
        }
        .onAppear {
            Task {
                await metricsViewModel.loadMetrics(for: selectedTimeRange, category: selectedCategory)
            }
        }
        .onChange(of: selectedTimeRange) { oldValue, newValue in
            Task {
                await metricsViewModel.loadMetrics(for: newValue, category: selectedCategory)
            }
        }
        .onChange(of: selectedCategory) { oldValue, newValue in
            Task {
                await metricsViewModel.loadMetrics(for: selectedTimeRange, category: newValue)
            }
        }
    }

    // MARK: - Time Range Selector

    private var timeRangeSelector: some View {
        Picker("Time Range", selection: $selectedTimeRange) {
            ForEach(TimeRange.allCases, id: \.self) { range in
                Text(range.displayName)
                    .tag(range)
            }
        }
        .pickerStyle(.segmented)
        .padding(.vertical, 8)
    }

    // MARK: - Category Selector

    private var categorySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(MetricCategory.allCases, id: \.self) { category in
                    CategoryButton(
                        category: category,
                        isSelected: category == selectedCategory
                    ) {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Metrics Grid

    private var metricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: 8),
            GridItem(.flexible(), spacing: 8)
        ], spacing: 12) {
            ForEach(metricsViewModel.filteredMetrics) { metric in
                if #available(iOS 26.0, *) {
                    MagicReplaceHealthMetric(metric: .constant(convertToHealthMetric(metric)))
                        .onTapGesture {
                            selectedMetric = metric
                        }
                } else {
                    StandardHealthMetricCard(metric: metric) {
                        selectedMetric = metric
                    }
                }
            }
        }
    }

    // MARK: - Trending Insights

    private var trendingInsights: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Trending Insights")
                    .font(.title2.bold())

                Spacer()

                Button("View All") {
                    // Handle view all insights
                }
                .font(.subheadline)
                .foregroundStyle(.blue)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(metricsViewModel.insights) { insight in
                        if #available(iOS 26.0, *) {
                            LiquidGlassHealthInsight(insight: insight)
                                .frame(width: 280)
                        } else {
                            StandardInsightCard(insight: insight)
                                .frame(width: 280)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.top)
    }

    // MARK: - Health Score Card

    private var healthScoreCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Overall Health Score")
                    .font(.title2.bold())

                Spacer()

                Text("\(Int(metricsViewModel.healthScore))/100")
                    .font(.title.bold())
                    .foregroundStyle(healthScoreColor)
            }

            ProgressView(value: metricsViewModel.healthScore / 100.0)
                .tint(healthScoreColor)
                .scaleEffect(y: 3)

            HStack(spacing: 24) {
                ScoreComponent(
                    title: "Physical",
                    score: metricsViewModel.physicalScore,
                    color: .blue
                )

                ScoreComponent(
                    title: "Mental",
                    score: metricsViewModel.mentalScore,
                    color: .purple
                )

                ScoreComponent(
                    title: "Recovery",
                    score: metricsViewModel.recoveryScore,
                    color: .green
                )
            }
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var healthScoreColor: Color {
        switch metricsViewModel.healthScore {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }

    // MARK: - Helper Methods

    private func convertToHealthMetric(_ metricData: HealthMetricData) -> HealthMetric {
        return HealthMetric(
            title: metricData.title,
            value: metricData.displayValue,
            icon: metricData.icon,
            color: metricData.color,
            progress: metricData.progress
        )
    }
}

// MARK: - Category Button

struct CategoryButton: View {
    let category: MetricCategory
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.subheadline)

                Text(category.displayName)
                    .font(.subheadline.weight(.medium))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? .blue : Color.secondary.opacity(0.2))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Standard Metric Card (iOS < 26)

struct StandardHealthMetricCard: View {
    let metric: HealthMetricData
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: metric.icon)
                        .font(.title2)
                        .foregroundStyle(metric.color)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Text(metric.displayValue)
                    .font(.title2.bold())
                    .foregroundStyle(.primary)

                Text(metric.title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                ProgressView(value: metric.progress)
                    .tint(metric.color)
            }
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Standard Insight Card (iOS < 26)

struct StandardInsightCard: View {
    let insight: HealthInsight

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: insight.icon)
                    .font(.title2)
                    .foregroundStyle(insight.priority.color)

                Spacer()

                Text(insight.priority.rawValue.uppercased())
                    .font(.caption2.bold())
                    .foregroundStyle(insight.priority.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(insight.priority.color.opacity(0.2))
                    .clipShape(Capsule())
            }

            Text(insight.title)
                .font(.headline.bold())
                .multilineTextAlignment(.leading)

            Text(insight.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.leading)

            if let recommendation = insight.recommendation {
                Text(recommendation)
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Score Component

struct ScoreComponent: View {
    let title: String
    let score: Double
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("\(Int(score))")
                .font(.title3.bold())
                .foregroundStyle(color)

            Circle()
                .fill(color.opacity(0.3))
                .frame(width: 8, height: 8)
        }
    }
}

// MARK: - Metric Detail View

struct MetricDetailView: View {
    let metric: HealthMetricData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: metric.icon)
                                .font(.largeTitle)
                                .foregroundStyle(metric.color)

                            Spacer()

                            Text(metric.displayValue)
                                .font(.largeTitle.bold())
                        }

                        Text(metric.title)
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }

                    // Chart
                    if !metric.historicalData.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Trend")
                                .font(.headline)

                            Chart(metric.historicalData) { dataPoint in
                                LineMark(
                                    x: .value("Date", dataPoint.date),
                                    y: .value("Value", dataPoint.value)
                                )
                                .foregroundStyle(metric.color)
                            }
                            .frame(height: 200)
                        }
                    }

                    // Statistics
                    statisticsSection

                    // Insights
                    insightsSection
                }
                .padding()
            }
            .navigationTitle(metric.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Statistics")
                .font(.headline)

            HStack(spacing: 24) {
                StatisticCard(title: "Average", value: String(format: "%.1f", metric.averageValue), unit: metric.unit)
                StatisticCard(title: "Min", value: String(format: "%.1f", metric.minValue), unit: metric.unit)
                StatisticCard(title: "Max", value: String(format: "%.1f", metric.maxValue), unit: metric.unit)
            }
        }
    }

    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Insights")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                ForEach(metric.insights, id: \.self) { insight in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(.yellow)
                            .font(.subheadline)

                        Text(insight)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

struct StatisticCard: View {
    let title: String
    let value: String
    let unit: String

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(value)
                .font(.title3.bold())

            Text(unit)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - View Model

@MainActor
class HealthMetricsViewModel: ObservableObject {
    @Published var metrics: [HealthMetricData] = []
    @Published var insights: [HealthInsight] = []
    @Published var healthScore: Double = 85.0
    @Published var physicalScore: Double = 82.0
    @Published var mentalScore: Double = 88.0
    @Published var recoveryScore: Double = 85.0
    @Published var isLoading = false

    private let logger = Logger(subsystem: "com.vitalsense.metrics", category: "HealthMetricsViewModel")

    var filteredMetrics: [HealthMetricData] {
        // Return all metrics for now, could be filtered by category
        return metrics
    }

    func loadMetrics(for timeRange: TimeRange, category: MetricCategory) async {
        isLoading = true

        do {
            // Simulate loading delay
            try await Task.sleep(nanoseconds: 500_000_000)

            // Generate mock metrics based on category
            metrics = generateMockMetrics(for: category)
            insights = generateMockInsights()

            logger.info("Loaded \(self.metrics.count) metrics for \(category.displayName)")
        } catch {
            logger.error("Failed to load metrics: \(error.localizedDescription)")
        }

        isLoading = false
    }

    func refreshMetrics() async {
        await loadMetrics(for: .week, category: .vitals)
    }

    private func generateMockMetrics(for category: MetricCategory) -> [HealthMetricData] {
        switch category {
        case .vitals:
            return [
                HealthMetricData(
                    id: "heart-rate",
                    title: "Heart Rate",
                    value: 72.0,
                    unit: "BPM",
                    icon: "heart.fill",
                    color: .red,
                    progress: 0.72,
                    historicalData: generateMockData(baseValue: 72.0, days: 7),
                    insights: ["Your resting heart rate is excellent for your age group", "Consistent values indicate good cardiovascular health"]
                ),
                HealthMetricData(
                    id: "blood-pressure",
                    title: "Blood Pressure",
                    value: 120.0,
                    unit: "mmHg",
                    icon: "waveform.path.ecg",
                    color: .blue,
                    progress: 0.8,
                    historicalData: generateMockData(baseValue: 120.0, days: 7),
                    insights: ["Blood pressure is within normal range", "Consider monitoring stress levels"]
                ),
                HealthMetricData(
                    id: "hrv",
                    title: "Heart Rate Variability",
                    value: 45.2,
                    unit: "ms",
                    icon: "waveform.path.ecg.rectangle",
                    color: .purple,
                    progress: 0.68,
                    historicalData: generateMockData(baseValue: 45.2, days: 7),
                    insights: ["Good HRV indicates balanced autonomic nervous system", "Try meditation to improve HRV"]
                ),
                HealthMetricData(
                    id: "respiratory-rate",
                    title: "Respiratory Rate",
                    value: 16.0,
                    unit: "breaths/min",
                    icon: "lungs.fill",
                    color: .cyan,
                    progress: 0.75,
                    historicalData: generateMockData(baseValue: 16.0, days: 7),
                    insights: ["Normal respiratory rate for adults", "Deep breathing exercises can improve efficiency"]
                )
            ]

        case .activity:
            return [
                HealthMetricData(
                    id: "steps",
                    title: "Daily Steps",
                    value: 8542.0,
                    unit: "steps",
                    icon: "figure.walk",
                    color: .green,
                    progress: 0.85,
                    historicalData: generateMockData(baseValue: 8542.0, days: 7),
                    insights: ["Great job! You're close to your daily goal", "Try taking the stairs more often"]
                ),
                HealthMetricData(
                    id: "active-energy",
                    title: "Active Energy",
                    value: 420.0,
                    unit: "kcal",
                    icon: "flame.fill",
                    color: .orange,
                    progress: 0.7,
                    historicalData: generateMockData(baseValue: 420.0, days: 7),
                    insights: ["Consistent daily activity levels", "Consider adding high-intensity intervals"]
                )
            ]

        case .sleep:
            return [
                HealthMetricData(
                    id: "sleep-duration",
                    title: "Sleep Duration",
                    value: 7.5,
                    unit: "hours",
                    icon: "moon.fill",
                    color: .indigo,
                    progress: 0.94,
                    historicalData: generateMockData(baseValue: 7.5, days: 7),
                    insights: ["Excellent sleep duration for optimal health", "Maintain consistent sleep schedule"]
                ),
                HealthMetricData(
                    id: "sleep-quality",
                    title: "Sleep Quality",
                    value: 85.0,
                    unit: "score",
                    icon: "bed.double.fill",
                    color: .purple,
                    progress: 0.85,
                    historicalData: generateMockData(baseValue: 85.0, days: 7),
                    insights: ["Good sleep quality with minimal disturbances", "Consider sleep hygiene improvements"]
                )
            ]

        case .nutrition:
            return [
                HealthMetricData(
                    id: "water-intake",
                    title: "Water Intake",
                    value: 2.1,
                    unit: "liters",
                    icon: "drop.fill",
                    color: .blue,
                    progress: 0.7,
                    historicalData: generateMockData(baseValue: 2.1, days: 7),
                    insights: ["Good hydration levels", "Increase intake during exercise"]
                )
            ]
        }
    }

    private func generateMockInsights() -> [HealthInsight] {
        return [
            HealthInsight(
                id: "recovery-insight",
                title: "Recovery Day Recommended",
                description: "Your HRV has been declining over the past 3 days, indicating accumulated fatigue.",
                priority: .medium,
                icon: "bed.double.fill",
                recommendation: "Take a rest day or do light stretching"
            ),
            HealthInsight(
                id: "sleep-insight",
                title: "Excellent Sleep Pattern",
                description: "Your sleep consistency has improved by 15% this week.",
                priority: .low,
                icon: "moon.stars.fill",
                recommendation: "Keep maintaining your bedtime routine"
            )
        ]
    }

    private func generateMockData(baseValue: Double, days: Int) -> [HealthDataPoint] {
        var data: [HealthDataPoint] = []
        let calendar = Calendar.current

        for i in 0..<days {
            let date = calendar.date(byAdding: .day, value: -days + i + 1, to: Date()) ?? Date()
            let variation = Double.random(in: -0.1...0.1) * baseValue
            let value = baseValue + variation

            data.append(HealthDataPoint(date: date, value: value))
        }

        return data
    }
}

// MARK: - Supporting Types

enum TimeRange: CaseIterable {
    case day, week, month, year

    var displayName: String {
        switch self {
        case .day: return "Day"
        case .week: return "Week"
        case .month: return "Month"
        case .year: return "Year"
        }
    }
}

enum MetricCategory: CaseIterable {
    case vitals, activity, sleep, nutrition

    var displayName: String {
        switch self {
        case .vitals: return "Vitals"
        case .activity: return "Activity"
        case .sleep: return "Sleep"
        case .nutrition: return "Nutrition"
        }
    }

    var icon: String {
        switch self {
        case .vitals: return "heart.fill"
        case .activity: return "figure.run"
        case .sleep: return "moon.fill"
        case .nutrition: return "fork.knife"
        }
    }
}

struct HealthMetricData: Identifiable {
    let id: String
    let title: String
    let value: Double
    let unit: String
    let icon: String
    let color: Color
    let progress: Double
    let historicalData: [HealthDataPoint]
    let insights: [String]

    var displayValue: String {
        if unit == "hours" {
            return String(format: "%.1f", value)
        } else {
            return String(format: "%.0f", value)
        }
    }

    var averageValue: Double {
        guard !historicalData.isEmpty else { return value }
        return historicalData.map { $0.value }.reduce(0, +) / Double(historicalData.count)
    }

    var minValue: Double {
        return historicalData.map { $0.value }.min() ?? value
    }

    var maxValue: Double {
        return historicalData.map { $0.value }.max() ?? value
    }
}

struct HealthDataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let value: Double
}
