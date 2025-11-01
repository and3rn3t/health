//
//  MLHealthInsightsView.swift
//  VitalSense
//
//  SwiftUI view for displaying Machine Learning health insights and recommendations
//  Created: 2024-12-19
//

import SwiftUI
import Charts

struct MLHealthInsightsView: View {
    @StateObject private var mlAnalyzer = VitalSenseMLHealthAnalyzer.shared
    @State private var selectedInsightType: MLInsightType? = nil
    @State private var showingRecommendationDetail = false
    @State private var selectedRecommendation: PersonalizedRecommendation? = nil
    @State private var isRefreshing = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Analysis Status Header
                    analysisStatusCard

                    // Quick Insights Summary
                    if !mlAnalyzer.currentInsights.isEmpty {
                        quickInsightsSummary
                    }

                    // Health Predictions
                    if let predictions = mlAnalyzer.healthPredictions {
                        healthPredictionsCard(predictions)
                    }

                    // Anomaly Alerts
                    if !mlAnalyzer.anomalyDetections.isEmpty {
                        anomalyAlertsCard
                    }

                    // Detailed Insights
                    if !mlAnalyzer.currentInsights.isEmpty {
                        detailedInsightsSection
                    }

                    // Personalized Recommendations
                    if !mlAnalyzer.personalizedRecommendations.isEmpty {
                        recommendationsSection
                    }

                    // Model Information
                    modelInfoCard
                }
                .padding()
            }
            .navigationTitle("AI Health Insights")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshAnalysis) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(isRefreshing ? 360 : 0))
                            .animation(.linear(duration: 1).repeatWhile(isRefreshing), value: isRefreshing)
                    }
                    .disabled(mlAnalyzer.isAnalyzing)
                }
            }
        }
        .refreshable {
            await refreshAnalysisAsync()
        }
        .sheet(item: $selectedRecommendation) { recommendation in
            RecommendationDetailView(recommendation: recommendation)
        }
        .task {
            if mlAnalyzer.currentInsights.isEmpty {
                await mlAnalyzer.performComprehensiveAnalysis()
            }
        }
    }

    // MARK: - Analysis Status Card

    private var analysisStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.blue)
                    .font(.title2)

                Text("AI Analysis Status")
                    .font(.headline)

                Spacer()

                if mlAnalyzer.isAnalyzing {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Model Accuracy")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("\(mlAnalyzer.modelAccuracy, specifier: "%.1%")")
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Last Analysis")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if let lastInsight = mlAnalyzer.currentInsights.first {
                        Text(lastInsight.generatedAt, style: .relative)
                            .font(.caption)
                            .fontWeight(.medium)
                    } else {
                        Text("Not analyzed")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            if mlAnalyzer.isAnalyzing {
                Text("Analyzing your health data...")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Quick Insights Summary

    private var quickInsightsSummary: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Insights")
                .font(.headline)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                ForEach(MLInsightType.allCases, id: \.self) { type in
                    let insights = mlAnalyzer.currentInsights.filter { $0.type == type }

                    InsightTypeCard(
                        type: type,
                        count: insights.count,
                        highestSeverity: insights.map { $0.severity }.max(),
                        isSelected: selectedInsightType == type
                    )
                    .onTapGesture {
                        selectedInsightType = selectedInsightType == type ? nil : type
                    }
                }
            }
        }
    }

    // MARK: - Health Predictions Card

    private func healthPredictionsCard(_ predictions: HealthPredictions) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "crystal.ball")
                    .foregroundColor(.purple)

                Text("Health Predictions")
                    .font(.headline)

                Spacer()

                Text("\(predictions.confidenceLevel, specifier: "%.0%") confidence")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                // Heart Rate Trend
                PredictionRow(
                    icon: "heart.fill",
                    title: "Heart Rate Trend",
                    prediction: predictions.nextWeekHeartRateTrend.trend.displayName,
                    value: "\(predictions.nextWeekHeartRateTrend.average, specifier: "%.0f") BPM",
                    color: .red
                )

                // Activity Prediction
                PredictionRow(
                    icon: "figure.walk",
                    title: "Activity Trend",
                    prediction: predictions.activityPredictions.trend.displayName,
                    value: "\(predictions.activityPredictions.expectedDailySteps) steps",
                    color: .green
                )

                // Fall Risk Assessment
                PredictionRow(
                    icon: "figure.walk.motion",
                    title: "Fall Risk",
                    prediction: predictions.fallRiskLevel.displayName,
                    value: "\(predictions.fallRiskScore, specifier: "%.1%") risk",
                    color: Color(predictions.fallRiskLevel.color)
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Anomaly Alerts Card

    private var anomalyAlertsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)

                Text("Health Anomalies Detected")
                    .font(.headline)

                Spacer()

                Text("\(mlAnalyzer.anomalyDetections.count)")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .cornerRadius(8)
            }

            ForEach(mlAnalyzer.anomalyDetections.prefix(3), id: \.id) { anomaly in
                AnomalyRow(anomaly: anomaly)
            }

            if mlAnalyzer.anomalyDetections.count > 3 {
                Text("+ \(mlAnalyzer.anomalyDetections.count - 3) more anomalies")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Detailed Insights Section

    private var detailedInsightsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Detailed Analysis")
                .font(.headline)

            let filteredInsights = selectedInsightType != nil
                ? mlAnalyzer.currentInsights.filter { $0.type == selectedInsightType }
                : mlAnalyzer.currentInsights

            ForEach(filteredInsights, id: \.id) { insight in
                InsightDetailCard(insight: insight)
            }
        }
    }

    // MARK: - Recommendations Section

    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Personalized Recommendations")
                .font(.headline)

            ForEach(mlAnalyzer.personalizedRecommendations.prefix(5), id: \.id) { recommendation in
                RecommendationCard(recommendation: recommendation)
                    .onTapGesture {
                        selectedRecommendation = recommendation
                    }
            }
        }
    }

    // MARK: - Model Information Card

    private var modelInfoCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI Model Information")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                Text("Our AI uses advanced machine learning models to analyze your health data and provide personalized insights.")
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack {
                    Text("Model Accuracy:")
                        .font(.caption)
                        .fontWeight(.medium)

                    Text("\(mlAnalyzer.modelAccuracy, specifier: "%.1%")")
                        .font(.caption)
                        .foregroundColor(.blue)

                    Spacer()

                    Text("Updates: Real-time")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Helper Methods

    private func refreshAnalysis() {
        isRefreshing = true
        Task {
            await mlAnalyzer.performComprehensiveAnalysis()
            isRefreshing = false
        }
    }

    private func refreshAnalysisAsync() async {
        await mlAnalyzer.performComprehensiveAnalysis()
    }
}

// MARK: - Supporting Views

struct InsightTypeCard: View {
    let type: MLInsightType
    let count: Int
    let highestSeverity: InsightSeverity?
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: type.icon)
                    .foregroundColor(severityColor)

                Spacer()

                Text("\(count)")
                    .font(.title2)
                    .fontWeight(.bold)
            }

            Text(type.displayName)
                .font(.caption)
                .foregroundColor(.primary)
                .multilineTextAlignment(.leading)
        }
        .padding(12)
        .background(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }

    private var severityColor: Color {
        guard let severity = highestSeverity else { return .gray }
        return Color(severity.color)
    }
}

struct PredictionRow: View {
    let icon: String
    let title: String
    let prediction: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(prediction)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
        }
    }
}

struct AnomalyRow: View {
    let anomaly: HealthAnomaly

    var body: some View {
        HStack {
            Image(systemName: anomaly.type.icon)
                .foregroundColor(Color(anomaly.severity.color))

            VStack(alignment: .leading, spacing: 2) {
                Text(anomaly.type.displayName)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(anomaly.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            Text("\(anomaly.confidence, specifier: "%.0%")")
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color(anomaly.severity.color).opacity(0.2))
                .cornerRadius(4)
        }
    }
}

struct InsightDetailCard: View {
    let insight: MLHealthInsight
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: insight.type.icon)
                    .foregroundColor(Color(insight.severity.color))

                VStack(alignment: .leading, spacing: 2) {
                    Text(insight.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text("\(insight.confidenceLevel.displayName) Confidence")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: { isExpanded.toggle() }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                }
            }

            Text(insight.description)
                .font(.caption)
                .foregroundColor(.primary)

            if isExpanded && !insight.actionableRecommendations.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Recommendations:")
                        .font(.caption)
                        .fontWeight(.semibold)

                    ForEach(insight.actionableRecommendations, id: \.self) { recommendation in
                        HStack {
                            Text("•")
                                .foregroundColor(.blue)
                            Text(recommendation)
                                .font(.caption)
                        }
                    }
                }
                .padding(.top, 4)
            }

            // Data visualization for insights with data points
            if isExpanded && !insight.dataPoints.isEmpty {
                InsightChart(dataPoints: insight.dataPoints)
                    .frame(height: 100)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }
}

struct InsightChart: View {
    let dataPoints: [MLDataPoint]

    var body: some View {
        Chart(dataPoints) { dataPoint in
            LineMark(
                x: .value("Date", dataPoint.date),
                y: .value("Value", dataPoint.value)
            )
            .foregroundStyle(.blue)
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .day, count: 7))
        }
    }
}

struct RecommendationCard: View {
    let recommendation: PersonalizedRecommendation

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: recommendation.category.icon)
                        .foregroundColor(Color(recommendation.category.color))

                    Text(recommendation.category.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(recommendation.priority.displayName)
                        .font(.caption)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(recommendation.priority.color).opacity(0.2))
                        .cornerRadius(4)
                }

                Text(recommendation.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(recommendation.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                HStack {
                    Text("Expected result in \(recommendation.timeToResult)")
                        .font(.caption)
                        .foregroundColor(.blue)

                    Spacer()

                    Text("\(recommendation.confidence, specifier: "%.0%") confidence")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }
}

struct RecommendationDetailView: View {
    let recommendation: PersonalizedRecommendation
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: recommendation.category.icon)
                                .foregroundColor(Color(recommendation.category.color))
                                .font(.title2)

                            Text(recommendation.category.displayName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)

                            Spacer()

                            Text(recommendation.priority.displayName)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(recommendation.priority.color).opacity(0.2))
                                .cornerRadius(6)
                        }

                        Text(recommendation.title)
                            .font(.title2)
                            .fontWeight(.bold)
                    }

                    // Description
                    Text(recommendation.description)
                        .font(.body)

                    // Action Steps
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Action Steps")
                            .font(.headline)

                        ForEach(Array(recommendation.actionSteps.enumerated()), id: \.offset) { index, step in
                            HStack(alignment: .top) {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .frame(width: 20, height: 20)
                                    .background(Color.blue)
                                    .cornerRadius(10)

                                Text(step)
                                    .font(.body)
                            }
                        }
                    }

                    // Expected Benefit & Timeline
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Expected Benefits")
                            .font(.headline)

                        Text(recommendation.expectedBenefit)
                            .font(.body)
                            .padding()
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(8)

                        HStack {
                            VStack(alignment: .leading) {
                                Text("Time to Results")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(recommendation.timeToResult)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                            }

                            Spacer()

                            VStack(alignment: .trailing) {
                                Text("Confidence")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("\(recommendation.confidence, specifier: "%.0%")")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Recommendation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Animation Extension

extension Animation {
    static func repeatWhile<T: Equatable>(_ condition: T) -> Animation {
        return .linear(duration: 1).repeatCount(condition as? Bool == true ? .max : 1, autoreverses: false)
    }
}

#Preview {
    MLHealthInsightsView()
}
