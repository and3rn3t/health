import SwiftUI
import HealthKit

// MARK: - Enhanced Gait & Posture Dashboard
struct EnhancedGaitDashboardView: View {
    @StateObject private var gaitManager = FallRiskGaitManager.shared
    @StateObject private var walkingCalculator = WalkingQualityCalculator()
    @StateObject private var postureManager = PostureMonitoringManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared

    @State private var refreshing = false
    @State private var selectedTab: DashboardTab = .overview
    @State private var showingWalkingCoach = false
    @State private var showingPostureSettings = false

    var body: some View {
        NavigationView {
            TabView(selection: $selectedTab) {
                // Overview Tab
                OverviewTabView()
                    .tabItem {
                        Image(systemName: "chart.bar.fill")
                        Text("Overview")
                    }
                    .tag(DashboardTab.overview)

                // Walking Analysis Tab
                WalkingAnalysisTabView()
                    .tabItem {
                        Image(systemName: "figure.walk")
                        Text("Walking")
                    }
                    .tag(DashboardTab.walking)

                // Posture Tab
                PostureTabView()
                    .tabItem {
                        Image(systemName: "person.fill")
                        Text("Posture")
                    }
                    .tag(DashboardTab.posture)

                // Fall Risk Tab
                FallRiskTabView()
                    .tabItem {
                        Image(systemName: "exclamationmark.shield.fill")
                        Text("Fall Risk")
                    }
                    .tag(DashboardTab.fallRisk)
            }
            .navigationTitle(selectedTab.title)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { showingPostureSettings = true }) {
                        Image(systemName: "gearshape.fill")
                    }

                    Button(action: refreshAllData) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(refreshing ? 360 : 0))
                            .animation(.linear(duration: 1).repeatCount(refreshing ? .max : 1, autoreverses: false), value: refreshing)
                    }
                }
            }
        }
        .onAppear {
            setupDashboard()
        }
        .sheet(isPresented: $showingWalkingCoach) {
            WalkingCoachView()
        }
        .sheet(isPresented: $showingPostureSettings) {
            PostureSettingsView()
        }
    }

    // MARK: - Tab Views

    @ViewBuilder
    private func OverviewTabView() -> some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Quick Status Cards
                HStack(spacing: 15) {
                    QuickStatusCard(
                        title: "Walking Quality",
                        value: String(format: "%.0f", walkingCalculator.walkingQualityScore),
                        unit: "pts",
                        color: getWalkingQualityColor(),
                        icon: "figure.walk"
                    )

                    QuickStatusCard(
                        title: "Posture Score",
                        value: String(format: "%.0f", postureManager.postureScore),
                        unit: "pts",
                        color: postureManager.currentPosture.color,
                        icon: "person.fill"
                    )
                }

                // Fall Risk Overview
                if let fallRisk = gaitManager.fallRiskScore {
                    FallRiskOverviewCard(fallRisk: fallRisk)
                }

                // Today's Activity Summary
                TodayActivitySummaryCard()

                // Recent Improvements
                if !walkingCalculator.improvements.isEmpty {
                    ImprovementsCard(improvements: walkingCalculator.improvements)
                }

                // Connection Status
                ConnectionStatusCard()
            }
            .padding()
        }
    }

    @ViewBuilder
    private func WalkingAnalysisTabView() -> some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Walking Quality Score
                WalkingQualityScoreCard()

                // Detailed Gait Metrics
                if let gait = gaitManager.currentGaitMetrics, gait.isComplete {
                    DetailedGaitMetricsCard(gaitMetrics: gait)
                }

                // Walking Trends Chart
                WalkingTrendsChartCard()

                // Walking Coach Button
                Button(action: { showingWalkingCoach = true }) {
                    HStack {
                        Image(systemName: "person.crop.circle.badge.plus")
                        Text("Start Walking Coach")
                        Spacer()
                        Image(systemName: "chevron.right")
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(12)
                }
            }
            .padding()
        }
    }

    @ViewBuilder
    private func PostureTabView() -> some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Current Posture Status
                CurrentPostureCard()

                // Daily Posture Quality
                if let quality = postureManager.dailyPostureQuality {
                    DailyPostureQualityCard(quality: quality)
                }

                // Posture Alerts
                if !postureManager.postureAlerts.isEmpty {
                    PostureAlertsCard(alerts: postureManager.postureAlerts)
                }

                // Posture Improvement Tips
                PostureImprovementTipsCard()

                // Monitoring Toggle
                PostureMonitoringToggleCard()
            }
            .padding()
        }
    }

    @ViewBuilder
    private func FallRiskTabView() -> some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Fall Risk Assessment
                if let fallRisk = gaitManager.fallRiskScore {
                    DetailedFallRiskCard(fallRisk: fallRisk)
                }

                // Balance Assessment
                if let balance = gaitManager.balanceAssessment {
                    BalanceAssessmentDetailCard(balance: balance)
                }

                // Risk Factors
                FallRiskFactorsCard()

                // Prevention Recommendations
                FallPreventionRecommendationsCard()
            }
            .padding()
        }
    }

    // MARK: - Helper Functions

    private func setupDashboard() {
        Task {
            await gaitManager.requestGaitAuthorization()
            await refreshAllData()
            postureManager.startPostureMonitoring()
        }
    }

    private func refreshAllData() {
        guard !refreshing else { return }

        refreshing = true
        Task {
            await gaitManager.fetchGaitMetrics()
            postureManager.calculateDailyPostureQuality()

            // Calculate walking quality if we have gait metrics
            if let gaitMetrics = gaitManager.currentGaitMetrics {
                let walkingQuality = walkingCalculator.calculateComprehensiveScore(from: gaitMetrics)
                await MainActor.run {
                    walkingCalculator.walkingQualityScore = walkingQuality.overallScore
                    walkingCalculator.improvements = walkingQuality.improvements
                }
            }

            await MainActor.run {
                refreshing = false
            }
        }
    }

    private func getWalkingQualityColor() -> Color {
        let score = walkingCalculator.walkingQualityScore
        if score >= 85 { return .green }
        else if score >= 70 { return .blue }
        else if score >= 55 { return .yellow }
        else if score >= 40 { return .orange }
        else { return .red }
    }
}

// MARK: - Supporting Views

struct QuickStatusCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            HStack(alignment: .bottom, spacing: 2) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(color)
                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct WalkingQualityScoreCard: View {
    @StateObject private var walkingCalculator = WalkingQualityCalculator()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Walking Quality Score")
                    .font(.headline)
                Spacer()
                Text(String(format: "%.0f/100", walkingCalculator.walkingQualityScore))
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(getScoreColor())
            }

            // Score Progress Bar
            ProgressView(value: walkingCalculator.walkingQualityScore, total: 100)
                .progressViewStyle(LinearProgressViewStyle(tint: getScoreColor()))
                .scaleEffect(x: 1, y: 2, anchor: .center)

            // Quality Level Description
            Text(getQualityDescription())
                .font(.body)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func getScoreColor() -> Color {
        let score = walkingCalculator.walkingQualityScore
        if score >= 85 { return .green }
        else if score >= 70 { return .blue }
        else if score >= 55 { return .yellow }
        else if score >= 40 { return .orange }
        else { return .red }
    }

    private func getQualityDescription() -> String {
        let score = walkingCalculator.walkingQualityScore
        if score >= 85 { return "Excellent walking quality with optimal gait patterns" }
        else if score >= 70 { return "Good walking quality with minor areas for improvement" }
        else if score >= 55 { return "Acceptable walking quality with some concerns" }
        else if score >= 40 { return "Walking quality needs attention and improvement" }
        else { return "Significant walking quality issues requiring intervention" }
    }
}

struct CurrentPostureCard: View {
    @StateObject private var postureManager = PostureMonitoringManager.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Current Posture")
                    .font(.headline)
                Spacer()
                Circle()
                    .fill(postureManager.currentPosture.color)
                    .frame(width: 12, height: 12)
            }

            HStack {
                Image(systemName: "person.fill")
                    .font(.largeTitle)
                    .foregroundColor(postureManager.currentPosture.color)

                VStack(alignment: .leading, spacing: 4) {
                    Text(postureManager.currentPosture.rawValue.capitalized)
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text(postureManager.currentPosture.description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack {
                    Text(String(format: "%.0f", postureManager.postureScore))
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// MARK: - Supporting Enums

enum DashboardTab: String, CaseIterable {
    case overview = "overview"
    case walking = "walking"
    case posture = "posture"
    case fallRisk = "fall_risk"

    var title: String {
        switch self {
        case .overview: return "Overview"
        case .walking: return "Walking Analysis"
        case .posture: return "Posture Monitoring"
        case .fallRisk: return "Fall Risk Assessment"
        }
    }
}
