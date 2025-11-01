//
//  AdvancedGaitAnalyticsDashboard.swift
//  VitalSense
//
//  Advanced analytics dashboard with ML insights, fall prevention, and emergency integration
//  Created: 2025-11-01
//

import SwiftUI
import Charts

struct AdvancedGaitAnalyticsDashboard: View {
    @StateObject private var gaitMonitor = RealTimeGaitMonitor.shared
    @StateObject private var emergencySystem = EmergencyResponseSystem.shared
    @StateObject private var analyticsEngine = GaitAnalyticsEngine()
    @State private var selectedTimeframe: AnalyticsTimeframe = .week
    @State private var showingRealTimeMonitor = false
    @State private var showingEmergencySetup = false
    @State private var showingMLInsights = false

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Header with status
                headerView

                // Real-time Status Cards
                realTimeStatusCardsView

                // Analytics Charts
                analyticsChartsView

                // ML Insights
                mlInsightsView

                // Fall Risk Trends
                fallRiskTrendsView

                // Emergency Preparedness
                emergencyPreparednessView

                // Action Items
                actionItemsView
            }
            .padding(.horizontal)
        }
        .navigationTitle("Gait Analytics")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button("Real-Time") {
                    showingRealTimeMonitor = true
                }

                Button("Emergency") {
                    showingEmergencySetup = true
                }
            }
        }
        .sheet(isPresented: $showingRealTimeMonitor) {
            NavigationView {
                RealTimeGaitMonitorView()
            }
        }
        .sheet(isPresented: $showingEmergencySetup) {
            NavigationView {
                EmergencyResponseView()
            }
        }
        .sheet(isPresented: $showingMLInsights) {
            MLInsightsDetailView(insights: analyticsEngine.mlInsights)
        }
        .onAppear {
            analyticsEngine.loadAnalytics()
        }
    }

    // MARK: - Header View

    private var headerView: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Advanced Gait Analytics")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("AI-powered insights and fall prevention")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Time frame selector
                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(AnalyticsTimeframe.allCases, id: \.self) { timeframe in
                        Text(timeframe.rawValue).tag(timeframe)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 200)
            }

            // Overall Health Score
            OverallHealthScoreView(score: analyticsEngine.overallHealthScore)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Real-time Status Cards

    private var realTimeStatusCardsView: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
            StatusCard(
                title: "Monitoring",
                value: gaitMonitor.isMonitoring ? "Active" : "Inactive",
                icon: "waveform.path.ecg",
                color: gaitMonitor.isMonitoring ? .green : .gray,
                action: { showingRealTimeMonitor = true }
            )

            StatusCard(
                title: "Fall Risk",
                value: fallRiskLevelText(gaitMonitor.fallRiskLevel),
                icon: "exclamationmark.shield.fill",
                color: gaitMonitor.fallRiskLevel.color,
                action: { showingRealTimeMonitor = true }
            )

            StatusCard(
                title: "Emergency",
                value: emergencySystem.isEmergencyActive ? "Active" : "Ready",
                icon: "phone.fill",
                color: emergencySystem.isEmergencyActive ? .red : .green,
                action: { showingEmergencySetup = true }
            )

            StatusCard(
                title: "ML Insights",
                value: "\(analyticsEngine.mlInsights.count) insights",
                icon: "brain.head.profile",
                color: .blue,
                action: { showingMLInsights = true }
            )
        }
    }

    // MARK: - Analytics Charts View

    private var analyticsChartsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Gait Analytics")
                .font(.headline)

            TabView {
                // Walking Speed Chart
                walkingSpeedChart
                    .tabItem {
                        Image(systemName: "speedometer")
                        Text("Speed")
                    }

                // Stability Chart
                stabilityChart
                    .tabItem {
                        Image(systemName: "gyroscope")
                        Text("Stability")
                    }

                // Asymmetry Chart
                asymmetryChart
                    .tabItem {
                        Image(systemName: "arrow.left.and.right")
                        Text("Asymmetry")
                    }
            }
            .frame(height: 300)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - ML Insights View

    private var mlInsightsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.title2)
                    .foregroundColor(.blue)

                Text("AI Insights")
                    .font(.headline)

                Spacer()

                Button("View All") {
                    showingMLInsights = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            ForEach(analyticsEngine.mlInsights.prefix(3), id: \.id) { insight in
                MLInsightCard(insight: insight)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Fall Risk Trends View

    private var fallRiskTrendsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Fall Risk Trends")
                .font(.headline)

            Chart {
                ForEach(analyticsEngine.fallRiskHistory, id: \.date) { dataPoint in
                    LineMark(
                        x: .value("Date", dataPoint.date),
                        y: .value("Risk", dataPoint.riskScore)
                    )
                    .foregroundStyle(.red)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    AreaMark(
                        x: .value("Date", dataPoint.date),
                        y: .value("Risk", dataPoint.riskScore)
                    )
                    .foregroundStyle(.red.opacity(0.1))
                }
            }
            .frame(height: 150)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisValueLabel {
                        if let risk = value.as(Double.self) {
                            Text("\(Int(risk * 100))%")
                        }
                    }
                }
            }

            // Risk level indicators
            HStack {
                RiskLevelIndicator(level: .low, isActive: analyticsEngine.currentRiskLevel == .low)
                RiskLevelIndicator(level: .moderate, isActive: analyticsEngine.currentRiskLevel == .moderate)
                RiskLevelIndicator(level: .high, isActive: analyticsEngine.currentRiskLevel == .high)
                RiskLevelIndicator(level: .critical, isActive: analyticsEngine.currentRiskLevel == .critical)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Emergency Preparedness View

    private var emergencyPreparednessView: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "shield.checkered")
                    .font(.title2)
                    .foregroundColor(.orange)

                Text("Emergency Preparedness")
                    .font(.headline)

                Spacer()

                EmergencyPreparednessScore(score: analyticsEngine.emergencyPreparednessScore)
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                PreparednessItem(
                    title: "Emergency Contacts",
                    status: emergencySystem.emergencyContacts.count > 0 ? "✓ Configured" : "⚠ Missing",
                    isReady: emergencySystem.emergencyContacts.count > 0
                )

                PreparednessItem(
                    title: "Fall Detection",
                    status: gaitMonitor.isMonitoring ? "✓ Active" : "○ Inactive",
                    isReady: gaitMonitor.isMonitoring
                )

                PreparednessItem(
                    title: "Location Services",
                    status: "✓ Enabled",
                    isReady: true
                )

                PreparednessItem(
                    title: "Medical Info",
                    status: "⚠ Update Needed",
                    isReady: false
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Action Items View

    private var actionItemsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recommended Actions")
                .font(.headline)

            ForEach(analyticsEngine.recommendedActions.prefix(3), id: \.id) { action in
                ActionItemCard(action: action)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Chart Views

    private var walkingSpeedChart: some View {
        Chart {
            ForEach(analyticsEngine.walkingSpeedData, id: \.date) { dataPoint in
                LineMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Speed", dataPoint.value)
                )
                .foregroundStyle(.blue)

                PointMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Speed", dataPoint.value)
                )
                .foregroundStyle(.blue)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisValueLabel {
                    if let speed = value.as(Double.self) {
                        Text(String(format: "%.1f m/s", speed))
                    }
                }
            }
        }
    }

    private var stabilityChart: some View {
        Chart {
            ForEach(analyticsEngine.stabilityData, id: \.date) { dataPoint in
                AreaMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Stability", dataPoint.value)
                )
                .foregroundStyle(.green.opacity(0.3))

                LineMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Stability", dataPoint.value)
                )
                .foregroundStyle(.green)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisValueLabel {
                    if let stability = value.as(Double.self) {
                        Text("\(Int(stability * 100))%")
                    }
                }
            }
        }
    }

    private var asymmetryChart: some View {
        Chart {
            ForEach(analyticsEngine.asymmetryData, id: \.date) { dataPoint in
                BarMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Asymmetry", dataPoint.value)
                )
                .foregroundStyle(.orange)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { value in
                AxisValueLabel {
                    if let asymmetry = value.as(Double.self) {
                        Text("\(Int(asymmetry * 100))%")
                    }
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func fallRiskLevelText(_ level: FallRiskLevel) -> String {
        switch level {
        case .low: return "Low"
        case .moderate: return "Moderate"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }
}

// MARK: - Supporting Views

struct OverallHealthScoreView: View {
    let score: Int

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Overall Health Score")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text("\(score)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(colorForScore(score))
            }

            Spacer()

            CircularProgressView(progress: Double(score) / 100, color: colorForScore(score))
                .frame(width: 60, height: 60)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func colorForScore(_ score: Int) -> Color {
        if score >= 80 { return .green }
        else if score >= 60 { return .yellow }
        else if score >= 40 { return .orange }
        else { return .red }
    }
}

struct StatusCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(color)

                    Spacer()
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(value)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }
            }
            .padding(12)
            .background(Color(.systemBackground))
            .cornerRadius(8)
            .shadow(color: Color.black.opacity(0.1), radius: 1, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct MLInsightCard: View {
    let insight: MLInsight

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: insight.type.icon)
                .font(.title2)
                .foregroundColor(insight.severity.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(insight.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(insight.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            VStack {
                Text(String(format: "%.0f%%", insight.confidence * 100))
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(insight.severity.color)

                Text("confidence")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct RiskLevelIndicator: View {
    let level: FallRiskLevel
    let isActive: Bool

    var body: some View {
        VStack(spacing: 4) {
            Circle()
                .fill(level.color)
                .frame(width: 12, height: 12)
                .opacity(isActive ? 1.0 : 0.3)

            Text(levelText(level))
                .font(.caption2)
                .foregroundColor(isActive ? .primary : .secondary)
        }
    }

    private func levelText(_ level: FallRiskLevel) -> String {
        switch level {
        case .low: return "Low"
        case .moderate: return "Med"
        case .high: return "High"
        case .critical: return "Crit"
        }
    }
}

struct EmergencyPreparednessScore: View {
    let score: Double

    var body: some View {
        HStack(spacing: 8) {
            Text(String(format: "%.0f%%", score * 100))
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(colorForScore(score))

            Circle()
                .fill(colorForScore(score))
                .frame(width: 8, height: 8)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(colorForScore(score).opacity(0.2))
        .cornerRadius(8)
    }

    private func colorForScore(_ score: Double) -> Color {
        if score >= 0.8 { return .green }
        else if score >= 0.6 { return .yellow }
        else { return .red }
    }
}

struct PreparednessItem: View {
    let title: String
    let status: String
    let isReady: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(status)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(isReady ? .green : .orange)
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(6)
    }
}

struct ActionItemCard: View {
    let action: RecommendedAction

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: action.icon)
                .font(.title2)
                .foregroundColor(action.priority.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(action.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(action.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button("Action") {
                // Handle action
            }
            .font(.caption)
            .foregroundColor(.blue)
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct CircularProgressView: View {
    let progress: Double
    let color: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: CGFloat(progress))
                .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

// MARK: - Detail Views

struct MLInsightsDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let insights: [MLInsight]

    var body: some View {
        NavigationView {
            List(insights, id: \.id) { insight in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: insight.type.icon)
                            .foregroundColor(insight.severity.color)

                        Text(insight.title)
                            .font(.headline)

                        Spacer()

                        Text(String(format: "%.0f%%", insight.confidence * 100))
                            .font(.caption)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(insight.severity.color.opacity(0.2))
                            .cornerRadius(4)
                    }

                    Text(insight.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    if !insight.recommendations.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Recommendations:")
                                .font(.caption)
                                .fontWeight(.semibold)

                            ForEach(insight.recommendations, id: \.self) { recommendation in
                                Text("• \(recommendation)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("ML Insights")
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
}

// MARK: - Supporting Data Models and Enums

enum AnalyticsTimeframe: String, CaseIterable {
    case day = "Day"
    case week = "Week"
    case month = "Month"
    case year = "Year"
}

// Analytics Engine (Observable Object)
@MainActor
class GaitAnalyticsEngine: ObservableObject {
    @Published var overallHealthScore = 78
    @Published var mlInsights: [MLInsight] = []
    @Published var fallRiskHistory: [FallRiskDataPoint] = []
    @Published var walkingSpeedData: [MetricDataPoint] = []
    @Published var stabilityData: [MetricDataPoint] = []
    @Published var asymmetryData: [MetricDataPoint] = []
    @Published var currentRiskLevel: FallRiskLevel = .low
    @Published var emergencyPreparednessScore: Double = 0.8
    @Published var recommendedActions: [RecommendedAction] = []

    func loadAnalytics() {
        // Load sample data (in real app, this would fetch from Core Data/HealthKit)
        generateSampleData()
    }

    private func generateSampleData() {
        // Generate sample ML insights
        mlInsights = [
            MLInsight(
                type: .gaitPattern,
                title: "Improved Walking Stability",
                description: "Your gait stability has improved by 15% over the past week",
                severity: .low,
                confidence: 0.89,
                recommendations: ["Continue current exercise routine", "Maintain regular walking schedule"]
            ),
            MLInsight(
                type: .fallRisk,
                title: "Slight Increase in Fall Risk",
                description: "ML analysis detected minor gait irregularities suggesting increased caution needed",
                severity: .medium,
                confidence: 0.76,
                recommendations: ["Focus on balance exercises", "Consider using assistive devices"]
            )
        ]

        // Generate sample historical data
        let calendar = Calendar.current
        let now = Date()

        fallRiskHistory = (0..<30).compactMap { dayOffset in
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { return nil }
            return FallRiskDataPoint(
                date: date,
                riskScore: Double.random(in: 0.1...0.6)
            )
        }.reversed()

        walkingSpeedData = (0..<30).compactMap { dayOffset in
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { return nil }
            return MetricDataPoint(
                date: date,
                value: Double.random(in: 0.8...1.4)
            )
        }.reversed()

        stabilityData = (0..<30).compactMap { dayOffset in
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { return nil }
            return MetricDataPoint(
                date: date,
                value: Double.random(in: 0.6...0.9)
            )
        }.reversed()

        asymmetryData = (0..<30).compactMap { dayOffset in
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { return nil }
            return MetricDataPoint(
                date: date,
                value: Double.random(in: 0.05...0.25)
            )
        }.reversed()

        // Generate recommended actions
        recommendedActions = [
            RecommendedAction(
                title: "Start Balance Training",
                description: "Regular balance exercises can reduce fall risk by up to 30%",
                icon: "figure.mind.and.body",
                priority: .high
            ),
            RecommendedAction(
                title: "Review Medications",
                description: "Some medications can affect balance and gait stability",
                icon: "pills.fill",
                priority: .medium
            ),
            RecommendedAction(
                title: "Setup Emergency Contacts",
                description: "Ensure emergency contacts are configured for safety alerts",
                icon: "person.badge.plus",
                priority: .high
            )
        ]
    }
}

// Supporting data structures
struct MLInsight: Identifiable {
    let id = UUID()
    let type: InsightType
    let title: String
    let description: String
    let severity: InsightSeverity
    let confidence: Double
    let recommendations: [String]

    enum InsightType {
        case gaitPattern, fallRisk, posture, activity

        var icon: String {
            switch self {
            case .gaitPattern: return "figure.walk"
            case .fallRisk: return "exclamationmark.triangle.fill"
            case .posture: return "person.fill"
            case .activity: return "figure.run"
            }
        }
    }

    enum InsightSeverity {
        case low, medium, high, critical

        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .yellow
            case .high: return .orange
            case .critical: return .red
            }
        }
    }
}

struct FallRiskDataPoint {
    let date: Date
    let riskScore: Double
}

struct MetricDataPoint {
    let date: Date
    let value: Double
}

struct RecommendedAction: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let priority: Priority

    enum Priority {
        case low, medium, high

        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .orange
            case .high: return .red
            }
        }
    }
}

#Preview {
    NavigationView {
        AdvancedGaitAnalyticsDashboard()
    }
}
