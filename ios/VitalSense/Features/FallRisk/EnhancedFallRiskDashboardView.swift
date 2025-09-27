import SwiftUI
import Charts

// MARK: - Enhanced Fall Risk Dashboard View
// Comprehensive fall risk management interface with AI-powered insights

struct EnhancedFallRiskDashboardView: View {
    @StateObject private var fallRiskEngine = EnhancedFallRiskEngine.shared
    @StateObject private var detectionEngine = EnhancedFallDetectionEngine.shared
    @StateObject private var interventionEngine = EnhancedInterventionEngine.shared
    @StateObject private var healthManager = HealthKitManager.shared

    @State private var selectedTab: DashboardTab = .overview
    @State private var showingDetailedAnalysis = false
    @State private var showingInterventionPlan = false
    @State private var showingSettings = false
    @State private var isPerformingAssessment = false

    enum DashboardTab: String, CaseIterable {
        case overview = "Overview"
        case aiPrediction = "AI Prediction"
        case realTimeMonitoring = "Live Monitoring"
        case interventions = "Interventions"
        case progress = "Progress"

        var icon: String {
            switch self {
            case .overview: return "house.fill"
            case .aiPrediction: return "brain.head.profile"
            case .realTimeMonitoring: return "waveform.path.ecg"
            case .interventions: return "list.bullet.clipboard"
            case .progress: return "chart.line.uptrend.xyaxis"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Custom Tab Bar
                customTabBar

                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    overviewTab
                        .tag(DashboardTab.overview)

                    aiPredictionTab
                        .tag(DashboardTab.aiPrediction)

                    realTimeMonitoringTab
                        .tag(DashboardTab.realTimeMonitoring)

                    interventionsTab
                        .tag(DashboardTab.interventions)

                    progressTab
                        .tag(DashboardTab.progress)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("Enhanced Fall Risk")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $showingDetailedAnalysis) {
                DetailedRiskAnalysisView()
            }
            .sheet(isPresented: $showingInterventionPlan) {
                InterventionPlanView()
            }
            .sheet(isPresented: $showingSettings) {
                FallRiskSettingsView()
            }
        }
    }

    // MARK: - Custom Tab Bar
    private var customTabBar: some View {
        HStack {
            ForEach(DashboardTab.allCases, id: \.self) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 16, weight: .medium))

                        Text(tab.rawValue)
                            .font(.caption2)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(selectedTab == tab ? .blue : .gray)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Overview Tab
    private var overviewTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Current Risk Status Card
                currentRiskStatusCard

                // Quick Assessment Button
                quickAssessmentCard

                // Key Metrics Overview
                keyMetricsOverview

                // Recent Alerts
                if let lastEvent = detectionEngine.lastFallEvent {
                    recentAlertsCard(event: lastEvent)
                }

                // Active Interventions Summary
                if !interventionEngine.activeInterventions.isEmpty {
                    activeInterventionsSummary
                }
            }
            .padding()
        }
    }

    // MARK: - AI Prediction Tab
    private var aiPredictionTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // ML Model Confidence
                mlModelConfidenceCard

                // Ensemble Results
                if let ensemble = fallRiskEngine.ensembleResults {
                    ensembleResultsCard(ensemble: ensemble)
                }

                // Temporal Predictions
                if let predictions = fallRiskEngine.temporalPredictions {
                    temporalPredictionsCard(predictions: predictions)
                }

                // Dimensional Risk Analysis
                if let assessment = fallRiskEngine.currentRiskAssessment {
                    dimensionalRiskCard(assessment: assessment)
                }
            }
            .padding()
        }
    }

    // MARK: - Real-Time Monitoring Tab
    private var realTimeMonitoringTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Detection Status
                detectionStatusCard

                // Live Sensor Data
                liveSensorDataCard

                // Activity Recognition
                currentActivityCard

                // Fall Confidence Meter
                fallConfidenceMeter

                // Detection History
                detectionHistoryCard
            }
            .padding()
        }
    }

    // MARK: - Interventions Tab
    private var interventionsTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Personalized Recommendations
                personalizedRecommendationsCard

                // Active Interventions
                activeInterventionsCard

                // Available Programs
                availableInterventionsCard

                // Progress Summary
                if let tracker = interventionEngine.progressTracker {
                    interventionProgressSummary(tracker: tracker)
                }
            }
            .padding()
        }
    }

    // MARK: - Progress Tab
    private var progressTab: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Risk Score Trend
                riskScoreTrendCard

                // Intervention Adherence
                adherenceMetricsCard

                // Outcome Metrics
                outcomeMetricsCard

                // Health Metrics Integration
                healthMetricsIntegrationCard
            }
            .padding()
        }
    }

    // MARK: - Card Components

    private var currentRiskStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Current Risk Level")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                if let assessment = fallRiskEngine.currentRiskAssessment {
                    RiskLevelBadge(level: assessment.riskLevel)
                }
            }

            if let assessment = fallRiskEngine.currentRiskAssessment {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Risk Score: \(Int(assessment.overallScore))/100")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Confidence: \(Int(assessment.confidence * 100))%")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("Last assessed: \(assessment.timestamp, style: .relative) ago")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Assessment Needed")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)

                    Text("Tap 'Quick Assessment' to get started")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    private var quickAssessmentCard: some View {
        Button {
            performQuickAssessment()
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Quick Assessment")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("Get an updated fall risk analysis")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if isPerformingAssessment {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isPerformingAssessment)
    }

    private var keyMetricsOverview: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Key Metrics")
                .font(.headline)
                .fontWeight(.semibold)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                MetricCard(
                    title: "Walking Steadiness",
                    value: "85%",
                    trend: .improving,
                    color: .green
                )

                MetricCard(
                    title: "Balance Score",
                    value: "78/100",
                    trend: .stable,
                    color: .blue
                )

                MetricCard(
                    title: "Fall Confidence",
                    value: "\(Int(detectionEngine.fallConfidence * 100))%",
                    trend: .stable,
                    color: .orange
                )

                MetricCard(
                    title: "Active Programs",
                    value: "\(interventionEngine.activeInterventions.count)",
                    trend: .stable,
                    color: .purple
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    private var mlModelConfidenceCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("AI Model Confidence")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Text("\(Int(fallRiskEngine.mlModelConfidence * 100))%")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }

            ProgressView(value: fallRiskEngine.mlModelConfidence)
                .progressViewStyle(LinearProgressViewStyle(tint: .blue))

            Text("Based on ensemble of 4 machine learning models")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    private var detectionStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Fall Detection")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Button {
                    toggleFallDetection()
                } label: {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(detectionEngine.isMonitoring ? .green : .gray)
                            .frame(width: 8, height: 8)

                        Text(detectionEngine.isMonitoring ? "Active" : "Inactive")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(.systemGray6))
                    .clipShape(Capsule())
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Sensor Status:")
                        .font(.subheadline)

                    Text(detectionEngine.sensorStatus.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text("Detection Sensitivity:")
                        .font(.subheadline)

                    Text(detectionEngine.detectionSensitivity.rawValue)
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }

                HStack {
                    Text("Current Activity:")
                        .font(.subheadline)

                    Text(detectionEngine.currentActivity.rawValue)
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Helper Methods
    private func performQuickAssessment() {
        isPerformingAssessment = true

        Task {
            // Simulate assessment process
            try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

            // In a real implementation, this would:
            // 1. Gather current health data
            // 2. Run the enhanced fall risk assessment
            // 3. Update the UI with results

            await MainActor.run {
                isPerformingAssessment = false
            }
        }
    }

    private func toggleFallDetection() {
        if detectionEngine.isMonitoring {
            detectionEngine.stopMonitoring()
        } else {
            detectionEngine.startMonitoring()
        }
    }

    // MARK: - Additional Card Methods
    // These would contain the implementations for other cards shown in the tabs

    private func recentAlertsCard(event: EnhancedFallDetectionEngine.FallDetectionEvent) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Alert")
                .font(.headline)
                .fontWeight(.semibold)

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.severity.description)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Text(event.timestamp, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text("\(Int(event.confidence * 100))% confidence")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // Additional card implementations would go here...
    // This provides a solid foundation for the enhanced iOS fall risk dashboard
}

// MARK: - Supporting Views
struct RiskLevelBadge: View {
    let level: FallRiskLevel

    var body: some View {
        Text(level.rawValue)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor)
            .foregroundColor(.white)
            .clipShape(Capsule())
    }

    private var backgroundColor: Color {
        switch level {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let trend: TrendDirection
    let color: Color

    enum TrendDirection {
        case improving
        case stable
        case declining

        var icon: String {
            switch self {
            case .improving: return "arrow.up.right"
            case .stable: return "minus"
            case .declining: return "arrow.down.right"
            }
        }

        var color: Color {
            switch self {
            case .improving: return .green
            case .stable: return .gray
            case .declining: return .red
            }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Image(systemName: trend.icon)
                    .font(.caption)
                    .foregroundColor(trend.color)
            }

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
