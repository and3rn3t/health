import SwiftUI
import Charts

// MARK: - VitalSense Fall Risk Assessment View
struct FallRiskAssessmentView: View {
    @StateObject private var assessmentManager: FallRiskAssessmentManager
    @State private var selectedTimeRange: TimeRange = .week
    @State private var showingAssessmentDetail = false
    @State private var showingRecommendations = false
    @State private var isPerformingAssessment = false
    @State private var showingFABOptions = false

    init(gaitAnalysisManager: GaitAnalysisManager) {
        self._assessmentManager = StateObject(wrappedValue: FallRiskAssessmentManager(gaitAnalysisManager: gaitAnalysisManager))
    }

    var body: some View {
        ZStack {
            // Background gradient
            VitalSenseBrand.Colors.vitalGradient
                .opacity(0.05)
                .ignoresSafeArea()

            ScrollView {
                LazyVStack(spacing: VitalSenseBrand.Layout.large) {
                    // VitalSense branded header
                    VitalSenseNavigationHeader(
                        title: "Fall Risk Assessment",
                        subtitle: "AI-powered analysis for proactive safety",
                        showLogo: true,
                        actions: [
                            (VitalSenseBrand.Icons.settings, { showingAssessmentDetail = true }),
                            (VitalSenseBrand.Icons.share, { /* Share functionality */ })
                        ]
                    )

                    // Hero risk status with VitalSense branding
                    VitalSenseRiskStatusHero(
                        riskLevel: assessmentManager.currentRiskLevel,
                        isAssessing: assessmentManager.isAssessing,
                        lastAssessment: assessmentManager.assessmentHistory.first?.timestamp
                    )

                    // Interactive metrics grid
                    VitalSenseMetricsGrid(
                        riskFactors: assessmentManager.riskFactors,
                        balanceScore: assessmentManager.balanceScore,
                        stabilityMetrics: assessmentManager.stabilityMetrics
                    )

                    // Recommendations with VitalSense styling
                    if !assessmentManager.recommendations.isEmpty {
                        VitalSenseRecommendationsSection(
                            recommendations: assessmentManager.recommendations
                        ) {
                            showingRecommendations = true
                        }
                    }

                    // Assessment history with trend visualization
                    if !assessmentManager.assessmentHistory.isEmpty {
                        VitalSenseAssessmentHistory(
                            assessments: assessmentManager.assessmentHistory,
                            selectedTimeRange: $selectedTimeRange
                        )
                    }
                }
                .padding(.horizontal, VitalSenseBrand.Layout.medium)
                .padding(.bottom, 100) // Space for FAB
            }

            // Floating Action Button
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    VitalSenseFAB(
                        icon: "plus",
                        action: { showingFABOptions.toggle() },
                        isExpanded: showingFABOptions,
                        expandedOptions: [
                            (VitalSenseBrand.Icons.analytics, "Full Assessment", { performAssessment() }),
                            (VitalSenseBrand.Icons.balance, "Balance Test", { performBalanceTest() }),
                            (VitalSenseBrand.Icons.insights, "Quick Check", { /* Quick check */ })
                        ]
                    )
                    .padding(.trailing, VitalSenseBrand.Layout.large)
                    .padding(.bottom, VitalSenseBrand.Layout.large)
                }
            }
        }
        .navigationBarHidden(true)
        .refreshable {
            await performAssessment()
        }
        .sheet(isPresented: $showingRecommendations) {
            VitalSenseRecommendationsDetail(recommendations: assessmentManager.recommendations)
        }
    }

    // MARK: - Actions

    private func performAssessment() async {
        do {
            try await assessmentManager.performComprehensiveAssessment()
        } catch {
            print("❌ Assessment failed: \(error)")
        }
    }

    private func performBalanceTest() async {
        let _ = await assessmentManager.performBalanceTest()
    }
}

// MARK: - VitalSense Risk Status Hero
struct VitalSenseRiskStatusHero: View {
    let riskLevel: FallRiskLevel
    let isAssessing: Bool
    let lastAssessment: Date?

    @State private var animationOffset: CGFloat = 0

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.large) {
            // Main risk indicator
            ZStack {
                // Animated background rings
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .stroke(
                            riskLevel.vitalSenseColor.opacity(0.2 - Double(index) * 0.05),
                            lineWidth: 2
                        )
                        .frame(width: 200 + CGFloat(index * 20))
                        .scaleEffect(1.0 + animationOffset * 0.1)
                        .opacity(0.5 + animationOffset * 0.3)
                        .animation(
                            VitalSenseBrand.Animations.breathe.delay(Double(index) * 0.2),
                            value: animationOffset
                        )
                }

                // Main progress ring
                VitalSenseProgressRing(
                    progress: riskLevel.progressValue,
                    title: riskLevel.vitalSenseDescription,
                    subtitle: "Risk Level",
                    gradient: riskLevel.vitalSenseGradient,
                    size: 160
                )

                // Assessment status overlay
                if isAssessing {
                    VStack {
                        Spacer()
                        HStack {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Analyzing...")
                                .font(VitalSenseBrand.Typography.caption1)
                                .foregroundColor(VitalSenseBrand.Colors.primary)
                        }
                        .padding(.horizontal, VitalSenseBrand.Layout.medium)
                        .padding(.vertical, VitalSenseBrand.Layout.small)
                        .background(.ultraThinMaterial)
                        .cornerRadius(VitalSenseBrand.Layout.cornerRadiusMedium)
                    }
                }
            }

            // Status information
            VStack(spacing: VitalSenseBrand.Layout.small) {
                Text(riskLevel.vitalSenseTitle)
                    .font(VitalSenseBrand.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(riskLevel.vitalSenseColor)

                Text(riskLevel.vitalSenseSubtitle)
                    .font(VitalSenseBrand.Typography.subheadline)
                    .foregroundColor(VitalSenseBrand.Colors.textMuted)
                    .multilineTextAlignment(.center)

                if let lastAssessment = lastAssessment {
                    Text("Last updated: \(lastAssessment, style: .relative) ago")
                        .font(VitalSenseBrand.Typography.caption1)
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)
                        .padding(.top, VitalSenseBrand.Layout.small)
                }
            }
        }
        .padding(VitalSenseBrand.Layout.large)
        .vitalSenseCard(elevation: 2)
        .onAppear {
            animationOffset = 1.0
        }
    }
}

// MARK: - VitalSense Metrics Grid
struct VitalSenseMetricsGrid: View {
    let riskFactors: [FallRiskFactor]
    let balanceScore: Double
    let stabilityMetrics: StabilityMetrics?

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            Text("Health Insights")
                .font(VitalSenseBrand.Typography.title3)
                .fontWeight(.bold)
                .foregroundColor(.primary)

            LazyVGrid(columns: columns, spacing: VitalSenseBrand.Layout.medium) {
                // Balance Score Metric
                if balanceScore > 0 {
                    VitalSenseMetricCard(
                        title: "Balance",
                        value: String(format: "%.0f", balanceScore),
                        unit: "/100",
                        icon: VitalSenseBrand.Icons.balance,
                        trend: balanceScore >= 80 ? .up : balanceScore >= 60 ? .stable : .down,
                        gradient: balanceScore >= 80 ? VitalSenseBrand.Colors.successGradient :
                                 balanceScore >= 60 ? VitalSenseBrand.Colors.warningGradient :
                                 VitalSenseBrand.Colors.errorGradient,
                        action: nil
                    )
                }

                // Risk Factors Count
                VitalSenseMetricCard(
                    title: "Risk Factors",
                    value: "\(riskFactors.count)",
                    unit: "active",
                    icon: VitalSenseBrand.Icons.risk,
                    trend: riskFactors.count == 0 ? .up : riskFactors.count <= 2 ? .stable : .down,
                    gradient: riskFactors.count == 0 ? VitalSenseBrand.Colors.successGradient :
                             riskFactors.count <= 2 ? VitalSenseBrand.Colors.warningGradient :
                             VitalSenseBrand.Colors.errorGradient,
                    action: nil
                )

                // Stability Index
                if let stability = stabilityMetrics {
                    VitalSenseMetricCard(
                        title: "Stability",
                        value: String(format: "%.2f", stability.stabilityIndex),
                        unit: "index",
                        icon: VitalSenseBrand.Icons.stability,
                        trend: stability.stabilityIndex < 0.05 ? .up :
                               stability.stabilityIndex < 0.1 ? .stable : .down,
                        gradient: VitalSenseBrand.Colors.primaryGradient,
                        action: nil
                    )
                }

                // Safety Score (calculated)
                let safetyScore = calculateSafetyScore()
                VitalSenseMetricCard(
                    title: "Safety",
                    value: String(format: "%.0f", safetyScore),
                    unit: "%",
                    icon: VitalSenseBrand.Icons.safety,
                    trend: safetyScore >= 80 ? .up : safetyScore >= 60 ? .stable : .down,
                    gradient: VitalSenseBrand.Colors.activityGradient,
                    action: nil
                )
            }
        }
    }

    private func calculateSafetyScore() -> Double {
        let baseScore = 100.0
        let balancePenalty = balanceScore > 0 ? max(0, (80 - balanceScore) * 0.5) : 20
        let riskFactorPenalty = Double(riskFactors.count) * 10
        let stabilityPenalty = stabilityMetrics?.stabilityIndex ?? 0 > 0.1 ? 15 : 0

        return max(0, baseScore - balancePenalty - riskFactorPenalty - stabilityPenalty)
    }
}

// MARK: - VitalSense Recommendations Section
struct VitalSenseRecommendationsSection: View {
    let recommendations: [FallRiskRecommendation]
    let onShowAll: () -> Void

    private var priorityRecommendations: [FallRiskRecommendation] {
        recommendations.filter { $0.priority == .high }.prefix(2) +
        recommendations.filter { $0.priority == .medium }.prefix(1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Text("Personalized Recommendations")
                    .font(VitalSenseBrand.Typography.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Spacer()

                Button("View All") {
                    onShowAll()
                }
                .font(VitalSenseBrand.Typography.subheadline)
                .foregroundColor(VitalSenseBrand.Colors.primary)
            }

            VStack(spacing: VitalSenseBrand.Layout.small) {
                ForEach(Array(priorityRecommendations.enumerated()), id: \.1.id) { index, recommendation in
                    VitalSenseRecommendationCard(
                        recommendation: recommendation,
                        index: index
                    )
                }
            }

            if recommendations.count > priorityRecommendations.count {
                Text("+ \(recommendations.count - priorityRecommendations.count) more recommendations")
                    .font(VitalSenseBrand.Typography.caption1)
                    .foregroundColor(VitalSenseBrand.Colors.textMuted)
                    .padding(.horizontal, VitalSenseBrand.Layout.medium)
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .vitalSenseCard()
    }
}

// MARK: - VitalSense Recommendation Card
struct VitalSenseRecommendationCard: View {
    let recommendation: FallRiskRecommendation
    let index: Int

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.small) {
            Button(action: { isExpanded.toggle() }) {
                HStack(spacing: VitalSenseBrand.Layout.medium) {
                    // Priority indicator
                    ZStack {
                        Circle()
                            .fill(recommendation.priority.vitalSenseColor.opacity(0.2))
                            .frame(width: 32, height: 32)

                        Image(systemName: recommendation.priority.vitalSenseIcon)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(recommendation.priority.vitalSenseColor)
                    }

                    // Content
                    VStack(alignment: .leading, spacing: 2) {
                        Text(recommendation.title)
                            .font(VitalSenseBrand.Typography.headline)
                            .foregroundColor(.primary)
                            .multilineTextAlignment(.leading)

                        Text(recommendation.description)
                            .font(VitalSenseBrand.Typography.caption1)
                            .foregroundColor(VitalSenseBrand.Colors.textMuted)
                            .lineLimit(isExpanded ? nil : 2)
                    }

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)
                }
            }
            .buttonStyle(PlainButtonStyle())

            // Expanded actions
            if isExpanded && !recommendation.actions.isEmpty {
                VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.extraSmall) {
                    Text("Actions:")
                        .font(VitalSenseBrand.Typography.caption1)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .padding(.top, VitalSenseBrand.Layout.small)

                    ForEach(recommendation.actions, id: \.self) { action in
                        HStack(alignment: .top, spacing: VitalSenseBrand.Layout.small) {
                            Circle()
                                .fill(recommendation.priority.vitalSenseColor)
                                .frame(width: 4, height: 4)
                                .padding(.top, 6)

                            Text(action)
                                .font(VitalSenseBrand.Typography.caption2)
                                .foregroundColor(VitalSenseBrand.Colors.textMuted)
                        }
                    }
                }
                .padding(.leading, 44) // Align with content
                .transition(.opacity.combined(with: .scale))
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(Color(.systemGray6).opacity(0.5))
        .cornerRadius(VitalSenseBrand.Layout.cornerRadiusMedium)
        .animation(VitalSenseBrand.Animations.smooth, value: isExpanded)
    }
}

// MARK: - VitalSense Assessment History
struct VitalSenseAssessmentHistory: View {
    let assessments: [FallRiskAssessment]
    @Binding var selectedTimeRange: TimeRange

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Text("Assessment Trends")
                    .font(VitalSenseBrand.Typography.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Spacer()

                Picker("Range", selection: $selectedTimeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.displayName)
                            .tag(range)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 200)
            }

            if !filteredAssessments.isEmpty {
                VitalSenseTrendChart(assessments: filteredAssessments)
                    .frame(height: 160)

                VitalSenseAssessmentsList(assessments: Array(filteredAssessments.prefix(5)))
            } else {
                VStack(spacing: VitalSenseBrand.Layout.medium) {
                    Image(systemName: "chart.line.downtrend.xyaxis")
                        .font(.system(size: 48))
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)

                    Text("No assessments in selected period")
                        .font(VitalSenseBrand.Typography.subheadline)
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)
                }
                .frame(maxWidth: .infinity, minHeight: 120)
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .vitalSenseCard()
    }

    private var filteredAssessments: [FallRiskAssessment] {
        let cutoffDate = Calendar.current.date(
            byAdding: selectedTimeRange.dateComponent,
            value: -selectedTimeRange.value,
            to: Date()
        ) ?? Date.distantPast

        return assessments.filter { $0.timestamp >= cutoffDate }
    }
}

// MARK: - Current Risk Level Card
struct CurrentRiskLevelCard: View {
    let riskLevel: FallRiskLevel
    let isAssessing: Bool

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Current Fall Risk")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                if isAssessing {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            VStack(spacing: 12) {
                // Risk Level Indicator
                ZStack {
                    Circle()
                        .stroke(riskLevel.color.opacity(0.3), lineWidth: 8)
                        .frame(width: 120, height: 120)

                    Circle()
                        .trim(from: 0, to: riskLevelProgress)
                        .stroke(riskLevel.color, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 1.0), value: riskLevel)

                    VStack(spacing: 4) {
                        Text(riskLevel.rawValue.uppercased())
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(riskLevel.color)

                        Text("RISK")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Text(riskLevel.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                // Risk Level Explanation
                riskLevelExplanation
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var riskLevelProgress: CGFloat {
        switch riskLevel {
        case .low: return 0.25
        case .medium: return 0.6
        case .high: return 0.9
        case .unknown: return 0.0
        }
    }

    @ViewBuilder
    private var riskLevelExplanation: some View {
        switch riskLevel {
        case .low:
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                Text("Good mobility and balance indicators")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

        case .medium:
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.yellow)
                Text("Some risk factors present - monitoring recommended")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

        case .high:
            HStack {
                Image(systemName: "exclamationmark.octagon.fill")
                    .foregroundColor(.red)
                Text("Multiple risk factors - immediate attention needed")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

        case .unknown:
            HStack {
                Image(systemName: "questionmark.circle.fill")
                    .foregroundColor(.gray)
                Text("Perform assessment to determine risk level")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Risk Factors Overview Card
struct RiskFactorsOverviewCard: View {
    let riskFactors: [FallRiskFactor]

    private var highRiskFactors: [FallRiskFactor] {
        riskFactors.filter { $0.severity == .high }
    }

    private var mediumRiskFactors: [FallRiskFactor] {
        riskFactors.filter { $0.severity == .medium }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Risk Factors")
                .font(.headline)
                .fontWeight(.semibold)

            VStack(spacing: 12) {
                if !highRiskFactors.isEmpty {
                    RiskFactorSection(
                        title: "High Risk",
                        factors: highRiskFactors,
                        color: .red
                    )
                }

                if !mediumRiskFactors.isEmpty {
                    RiskFactorSection(
                        title: "Medium Risk",
                        factors: mediumRiskFactors,
                        color: .yellow
                    )
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}

// MARK: - Risk Factor Section
struct RiskFactorSection: View {
    let title: String
    let factors: [FallRiskFactor]
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(color)

                Spacer()

                Text("\(factors.count)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(color.opacity(0.2))
                    .cornerRadius(8)
            }

            VStack(spacing: 6) {
                ForEach(factors) { factor in
                    RiskFactorRow(factor: factor)
                }
            }
        }
    }
}

// MARK: - Risk Factor Row
struct RiskFactorRow: View {
    let factor: FallRiskFactor

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(factor.description)
                    .font(.caption)
                    .foregroundColor(.primary)

                if factor.value > 0 {
                    Text(formatFactorValue(factor))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: severityIcon(factor.severity))
                .foregroundColor(severityColor(factor.severity))
                .font(.caption)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(6)
    }

    private func formatFactorValue(_ factor: FallRiskFactor) -> String {
        switch factor.type {
        case .slowWalkingSpeed:
            return String(format: "%.2f m/s", factor.value)
        case .poorBalance:
            return String(format: "%.0f/100", factor.value)
        case .gaitAsymmetry, .gaitVariability:
            return String(format: "%.1f%%", factor.value * 100)
        case .advancedAge:
            return "\(Int(factor.value)) years"
        case .fallHistory:
            return "\(Int(factor.value)) falls"
        default:
            return String(format: "%.1f", factor.value)
        }
    }

    private func severityIcon(_ severity: RiskSeverity) -> String {
        switch severity {
        case .low: return "circle.fill"
        case .medium: return "exclamationmark.triangle.fill"
        case .high: return "exclamationmark.octagon.fill"
        }
    }

    private func severityColor(_ severity: RiskSeverity) -> Color {
        switch severity {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .red
        }
    }
}

// MARK: - Balance Score Card
struct BalanceScoreCard: View {
    let score: Double
    let stabilityMetrics: StabilityMetrics?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Balance Assessment")
                .font(.headline)
                .fontWeight(.semibold)

            HStack(spacing: 20) {
                // Overall Score
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .stroke(Color(.tertiarySystemBackground), lineWidth: 8)
                            .frame(width: 80, height: 80)

                        Circle()
                            .trim(from: 0, to: score / 100)
                            .stroke(balanceScoreColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                            .frame(width: 80, height: 80)
                            .rotationEffect(.degrees(-90))

                        Text("\(Int(score))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(balanceScoreColor)
                    }

                    Text("Balance Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // Stability Metrics
                if let metrics = stabilityMetrics {
                    VStack(alignment: .leading, spacing: 8) {
                        StabilityMetricRow(
                            title: "Avg Sway",
                            value: String(format: "%.3f", metrics.averageSway),
                            unit: "m/s²"
                        )

                        StabilityMetricRow(
                            title: "Peak Sway",
                            value: String(format: "%.3f", metrics.peakSway),
                            unit: "m/s²"
                        )

                        StabilityMetricRow(
                            title: "Variability",
                            value: String(format: "%.3f", metrics.swayVariability),
                            unit: "m/s²"
                        )

                        StabilityMetricRow(
                            title: "Stability Index",
                            value: String(format: "%.3f", metrics.stabilityIndex),
                            unit: ""
                        )
                    }
                }

                Spacer()
            }

            // Balance Score Interpretation
            balanceScoreInterpretation
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var balanceScoreColor: Color {
        if score >= 80 { return .green }
        else if score >= 60 { return .yellow }
        else { return .red }
    }

    @ViewBuilder
    private var balanceScoreInterpretation: some View {
        HStack {
            Image(systemName: balanceScoreIcon)
                .foregroundColor(balanceScoreColor)

            Text(balanceScoreText)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(balanceScoreColor.opacity(0.1))
        .cornerRadius(6)
    }

    private var balanceScoreIcon: String {
        if score >= 80 { return "checkmark.circle.fill" }
        else if score >= 60 { return "exclamationmark.triangle.fill" }
        else { return "exclamationmark.octagon.fill" }
    }

    private var balanceScoreText: String {
        if score >= 80 { return "Excellent balance - low fall risk" }
        else if score >= 60 { return "Good balance - moderate monitoring" }
        else { return "Poor balance - increased fall risk" }
    }
}

// MARK: - Stability Metric Row
struct StabilityMetricRow: View {
    let title: String
    let value: String
    let unit: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)

            Spacer()

            HStack(spacing: 2) {
                Text(value)
                    .font(.caption2)
                    .fontWeight(.medium)

                if !unit.isEmpty {
                    Text(unit)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

// MARK: - Recommendations Card
struct RecommendationsCard: View {
    let recommendations: [FallRiskRecommendation]
    let onShowDetails: () -> Void

    private var highPriorityRecommendations: [FallRiskRecommendation] {
        recommendations.filter { $0.priority == .high }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recommendations")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Button("View All") {
                    onShowDetails()
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            if !highPriorityRecommendations.isEmpty {
                VStack(spacing: 8) {
                    ForEach(highPriorityRecommendations.prefix(3)) { recommendation in
                        RecommendationRow(recommendation: recommendation)
                    }
                }
            } else if !recommendations.isEmpty {
                VStack(spacing: 8) {
                    ForEach(recommendations.prefix(3)) { recommendation in
                        RecommendationRow(recommendation: recommendation)
                    }
                }
            }

            if recommendations.count > 3 {
                Text("+ \(recommendations.count - 3) more recommendations")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}

// MARK: - Recommendation Row
struct RecommendationRow: View {
    let recommendation: FallRiskRecommendation

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: priorityIcon)
                .foregroundColor(priorityColor)
                .font(.caption)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 2) {
                Text(recommendation.title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)

                Text(recommendation.description)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color(.tertiarySystemBackground))
        .cornerRadius(8)
    }

    private var priorityIcon: String {
        switch recommendation.priority {
        case .low: return "circle.fill"
        case .medium: return "exclamationmark.triangle.fill"
        case .high: return "exclamationmark.octagon.fill"
        }
    }

    private var priorityColor: Color {
        switch recommendation.priority {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .red
        }
    }
}

// MARK: - Assessment History Card
struct AssessmentHistoryCard: View {
    let assessments: [FallRiskAssessment]
    @Binding var selectedTimeRange: TimeRange

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Assessment History")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Picker("Time Range", selection: $selectedTimeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.displayName)
                            .tag(range)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 150)
            }

            if !filteredAssessments.isEmpty {
                FallRiskTrendChart(assessments: filteredAssessments)
                    .frame(height: 120)

                RecentAssessmentsList(assessments: Array(filteredAssessments.prefix(3)))
            } else {
                Text("No assessments in selected time range")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }

    private var filteredAssessments: [FallRiskAssessment] {
        let cutoffDate = Calendar.current.date(byAdding: selectedTimeRange.dateComponent, value: -selectedTimeRange.value, to: Date()) ?? Date.distantPast
        return assessments.filter { $0.timestamp >= cutoffDate }
    }
}

// MARK: - Fall Risk Trend Chart
struct FallRiskTrendChart: View {
    let assessments: [FallRiskAssessment]

    private var chartData: [(Date, Double)] {
        assessments.map { assessment in
            let riskValue: Double
            switch assessment.riskLevel {
            case .low: riskValue = 1
            case .medium: riskValue = 2
            case .high: riskValue = 3
            case .unknown: riskValue = 0
            }
            return (assessment.timestamp, riskValue)
        }
    }

    var body: some View {
        Chart {
            ForEach(chartData, id: \.0) { date, risk in
                LineMark(
                    x: .value("Date", date),
                    y: .value("Risk Level", risk)
                )
                .foregroundStyle(.blue)
                .lineStyle(StrokeStyle(lineWidth: 2))

                PointMark(
                    x: .value("Date", date),
                    y: .value("Risk Level", risk)
                )
                .foregroundStyle(.blue)
                .symbolSize(36)
            }
        }
        .chartYAxis {
            AxisMarks(values: [1, 2, 3]) { value in
                AxisValueLabel {
                    if let intValue = value.as(Double.self) {
                        switch Int(intValue) {
                        case 1: Text("Low")
                        case 2: Text("Medium")
                        case 3: Text("High")
                        default: Text("")
                        }
                    }
                }
                AxisGridLine()
            }
        }
        .chartXAxis {
            AxisMarks { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.month().day())
            }
        }
    }
}

// MARK: - Recent Assessments List
struct RecentAssessmentsList: View {
    let assessments: [FallRiskAssessment]

    var body: some View {
        VStack(spacing: 8) {
            ForEach(assessments) { assessment in
                HStack {
                    Circle()
                        .fill(assessment.riskLevel.color)
                        .frame(width: 8, height: 8)

                    Text(assessment.riskLevel.rawValue.capitalized)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(assessment.riskLevel.color)

                    Spacer()

                    Text(assessment.timestamp, style: .date)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.tertiarySystemBackground))
                .cornerRadius(6)
            }
        }
    }
}

// MARK: - Assessment Actions Card
struct AssessmentActionsCard: View {
    let onPerformAssessment: () async -> Void
    let onPerformBalanceTest: () async -> Void
    let isAssessing: Bool

    var body: some View {
        VStack(spacing: 12) {
            Text("Assessment Actions")
                .font(.headline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 8) {
                ActionButton(
                    title: "Comprehensive Assessment",
                    subtitle: "Full gait, balance, and risk factor analysis",
                    icon: "checkmark.circle.fill",
                    color: .blue,
                    isLoading: isAssessing
                ) {
                    await onPerformAssessment()
                }

                ActionButton(
                    title: "Balance Test Only",
                    subtitle: "Quick balance and stability assessment",
                    icon: "figure.walk.circle.fill",
                    color: .green,
                    isLoading: false
                ) {
                    await onPerformBalanceTest()
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}

// MARK: - Action Button
struct ActionButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let isLoading: Bool
    let action: () async -> Void

    var body: some View {
        Button(action: {
            Task {
                await action()
            }
        }) {
            HStack(spacing: 12) {
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: icon)
                        .foregroundColor(color)
                        .font(.title3)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding()
            .background(Color(.tertiarySystemBackground))
            .cornerRadius(12)
        }
        .disabled(isLoading)
    }
}

// MARK: - Supporting Types

enum TimeRange: String, CaseIterable {
    case week = "week"
    case month = "month"
    case threeMonths = "3months"
    case year = "year"

    var displayName: String {
        switch self {
        case .week: return "1W"
        case .month: return "1M"
        case .threeMonths: return "3M"
        case .year: return "1Y"
        }
    }

    var dateComponent: Calendar.Component {
        switch self {
        case .week: return .weekOfYear
        case .month: return .month
        case .threeMonths: return .month
        case .year: return .year
        }
    }

    var value: Int {
        switch self {
        case .week: return 1
        case .month: return 1
        case .threeMonths: return 3
        case .year: return 1
        }
    }
}

// MARK: - Recommendations Detail View
struct RecommendationsDetailView: View {
    let recommendations: [FallRiskRecommendation]
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(recommendations) { recommendation in
                        RecommendationDetailCard(recommendation: recommendation)
                    }
                }
                .padding()
            }
            .navigationTitle("Recommendations")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Recommendation Detail Card
struct RecommendationDetailCard: View {
    let recommendation: FallRiskRecommendation

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack {
                    Image(systemName: priorityIcon)
                        .foregroundColor(priorityColor)

                    Text(recommendation.priority.rawValue.uppercased())
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(priorityColor)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(priorityColor.opacity(0.2))
                .cornerRadius(6)

                Spacer()
            }

            Text(recommendation.title)
                .font(.headline)
                .fontWeight(.semibold)

            Text(recommendation.description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            if !recommendation.actions.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Recommended Actions:")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    ForEach(recommendation.actions, id: \.self) { action in
                        HStack(alignment: .top, spacing: 8) {
                            Circle()
                                .fill(priorityColor)
                                .frame(width: 4, height: 4)
                                .padding(.top, 6)

                            Text(action)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var priorityIcon: String {
        switch recommendation.priority {
        case .low: return "circle.fill"
        case .medium: return "exclamationmark.triangle.fill"
        case .high: return "exclamationmark.octagon.fill"
        }
    }

    private var priorityColor: Color {
        switch recommendation.priority {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .red
        }
    }
}
