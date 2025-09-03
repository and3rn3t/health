import SwiftUI
import Charts

// MARK: - VitalSense Enhanced Interactive Gait Metrics Card
struct DetailedGaitMetricsCard: View {
    let gaitMetrics: GaitMetrics
    @State private var selectedMetric: GaitMetricType = .walkingSpeed
    @State private var showingTrends = false
    @State private var animateMetrics = false
    @State private var dragOffset: CGSize = .zero
    @State private var showDetailView = false
    @State private var lastSwipeDirection: SwipeDirection?

    enum SwipeDirection {
        case left, right, up, down
    }

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            // VitalSense Header with Interactive Elements
            VitalSenseInteractiveHeader(
                title: "Gait Analysis",
                subtitle: "Real-time mobility insights",
                showingTrends: $showingTrends,
                animateMetrics: $animateMetrics
            )

            // Main Content with Swipe Gestures
            ZStack {
                if showingTrends {
                    VitalSenseGaitTrendsChartView(selectedMetric: $selectedMetric)
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                } else {
                    VitalSenseGaitMetricsGridView(gaitMetrics: gaitMetrics, selectedMetric: $selectedMetric)
                        .transition(.asymmetric(
                            insertion: .move(edge: .leading).combined(with: .opacity),
                            removal: .move(edge: .trailing).combined(with: .opacity)
                        ))
                }
            }
            .offset(dragOffset)
            .scaleEffect(dragOffset == .zero ? 1.0 : 0.95)
            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: dragOffset)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        dragOffset = value.translation
                    }
                    .onEnded { value in
                        let swipeThreshold: CGFloat = 50

                        withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                            if abs(value.translation.x) > swipeThreshold {
                                if value.translation.x > 0 {
                                    // Swipe right - show metrics
                                    lastSwipeDirection = .right
                                    showingTrends = false
                                    triggerHapticFeedback(.medium)
                                } else {
                                    // Swipe left - show trends
                                    lastSwipeDirection = .left
                                    showingTrends = true
                                    triggerHapticFeedback(.medium)
                                }
                            } else if abs(value.translation.y) > swipeThreshold {
                                if value.translation.y < 0 {
                                    // Swipe up - show detail view
                                    lastSwipeDirection = .up
                                    showDetailView = true
                                    triggerHapticFeedback(.heavy)
                                }
                            }

                            dragOffset = .zero
                        }
                    }
            )

            // Enhanced Metric Selector with Animations
            VitalSenseEnhancedMetricSelectorView(
                selectedMetric: $selectedMetric,
                lastSwipeDirection: lastSwipeDirection
            )

            // Interactive Analysis Section
            VitalSenseInteractiveAnalysisView(
                gaitMetrics: gaitMetrics,
                selectedMetric: selectedMetric,
                showDetailView: $showDetailView
            )
        }
        .padding(VitalSenseBrand.Layout.large)
        .vitalSenseCard()
        .onAppear {
            withAnimation(VitalSenseBrand.Animations.spring.delay(0.3)) {
                animateMetrics = true
            }
        }
    }
}

// MARK: - VitalSense Gait Metrics Grid
struct VitalSenseGaitMetricsGridView: View {
    let gaitMetrics: GaitMetrics
    @Binding var selectedMetric: GaitMetricType
    @State private var animateCards = false

    private let columns = [
        GridItem(.flexible(), spacing: VitalSenseBrand.Layout.medium),
        GridItem(.flexible(), spacing: VitalSenseBrand.Layout.medium)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: VitalSenseBrand.Layout.medium) {
            ForEach(GaitMetricType.allCases.indices, id: \.self) { index in
                let metricType = GaitMetricType.allCases[index]
                VitalSenseMetricCard(
                    title: metricType.displayName,
                    value: metricValue(for: metricType),
                    unit: metricType.unit,
                    trend: metricTrend(for: metricType),
                    isSelected: selectedMetric == metricType,
                    gradient: metricType.vitalSenseGradient
                ) {
                    withAnimation(VitalSenseBrand.Animations.bouncy) {
                        selectedMetric = metricType
                    }
                }
                .scaleEffect(animateCards ? 1.0 : 0.8)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(
                    VitalSenseBrand.Animations.spring.delay(Double(index) * 0.1),
                    value: animateCards
                )
            }
        }
        .onAppear {
            withAnimation {
                animateCards = true
            }
        }
    }

    private func metricValue(for metricType: GaitMetricType) -> String {
        switch metricType {
        case .walkingSpeed:
            return String(format: "%.2f", gaitMetrics.averageWalkingSpeed ?? 0)
        case .stepLength:
            return String(format: "%.0f", (gaitMetrics.averageStepLength ?? 0) * 100)
        case .cadence:
            return String(format: "%.0f", gaitMetrics.cadence ?? 0)
        case .symmetry:
            return String(format: "%.1f", (1.0 - (gaitMetrics.walkingAsymmetry ?? 0)) * 100)
        case .doubleSupportTime:
            return String(format: "%.1f", (gaitMetrics.doubleSupportTime ?? 0) * 100)
        case .stepWidth:
            return String(format: "%.0f", (gaitMetrics.stepWidth ?? 0) * 100)
        }
    }

    private func metricTrend(for metricType: GaitMetricType) -> TrendDirection {
        // This would typically come from historical data analysis
        // For now, return neutral or implement based on recent trends
        return .neutral
    }
                status: getAsymmetryStatus(),
                isSelected: selectedMetric == .asymmetry
            ) {
                selectedMetric = .asymmetry
            }
        }
    }

    // MARK: - Status Helpers

    private func getSpeedStatus() -> MetricStatus {
        guard let speed = gaitMetrics.averageWalkingSpeed else { return .unknown }

        if speed >= 1.2 { return .excellent }
        else if speed >= 1.0 { return .good }
        else if speed >= 0.8 { return .fair }
        else { return .poor }
    }

    private func getStepLengthStatus() -> MetricStatus {
        guard let stepLength = gaitMetrics.averageStepLength else { return .unknown }

        let lengthCm = stepLength * 100
        if lengthCm >= 65 && lengthCm <= 75 { return .excellent }
        else if lengthCm >= 55 && lengthCm <= 85 { return .good }
        else if lengthCm >= 45 && lengthCm <= 95 { return .fair }
        else { return .poor }
    }

    private func getCadenceStatus() -> MetricStatus {
        guard let cadence = gaitMetrics.cadence else { return .unknown }

        if cadence >= 110 && cadence <= 130 { return .excellent }
        else if cadence >= 100 && cadence <= 140 { return .good }
        else if cadence >= 90 && cadence <= 150 { return .fair }
        else { return .poor }
    }

    private func getAsymmetryStatus() -> MetricStatus {
        guard let asymmetry = gaitMetrics.walkingAsymmetry else { return .unknown }

        let asymmetryPercent = asymmetry * 100
        if asymmetryPercent <= 3.0 { return .excellent }
        else if asymmetryPercent <= 5.0 { return .good }
        else if asymmetryPercent <= 8.0 { return .fair }
        else { return .poor }
    }
}

// MARK: - Metric Tile View
struct MetricTileView: View {
    let icon: String
    let title: String
    let value: String
    let unit: String
    let status: MetricStatus
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(status.color)
                        .font(.title3)
                    Spacer()
                    Circle()
                        .fill(status.color)
                        .frame(width: 8, height: 8)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .bottom, spacing: 2) {
                        Text(value)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(status.color)
                        Text(unit)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()
            }
        }
        .padding(12)
        .background(isSelected ? status.color.opacity(0.1) : Color(.secondarySystemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? status.color : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - VitalSense Gait Trends Chart View
struct VitalSenseGaitTrendsChartView: View {
    @Binding var selectedMetric: GaitMetricType
    @StateObject private var trendsData = GaitTrendsData()
    @State private var animateChart = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.small) {
                    Text("7-Day Trend")
                        .font(VitalSenseBrand.Typography.heading3)
                        .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                    Text("Track your \(selectedMetric.displayName.lowercased()) progress")
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }

                Spacer()

                // Metric indicator
                HStack(spacing: VitalSenseBrand.Layout.small) {
                    Image(systemName: selectedMetric.vitalSenseIcon)
                        .foregroundStyle(selectedMetric.vitalSenseGradient)
                    Text(selectedMetric.displayName)
                        .font(VitalSenseBrand.Typography.body)
                        .foregroundStyle(selectedMetric.vitalSenseColor)
                }
                .padding(.horizontal, VitalSenseBrand.Layout.medium)
                .padding(.vertical, VitalSenseBrand.Layout.small)
                .background(selectedMetric.vitalSenseColor.opacity(0.1))
                .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
            }

            Chart(trendsData.getTrendData(for: selectedMetric)) { dataPoint in
                LineMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Value", dataPoint.value)
                )
                .foregroundStyle(selectedMetric.vitalSenseGradient)
                .lineStyle(StrokeStyle(lineWidth: 3, lineCap: .round))

                AreaMark(
                    x: .value("Date", dataPoint.date),
                    yStart: .value("Min", trendsData.getMinValue(for: selectedMetric)),
                    yEnd: .value("Value", dataPoint.value)
                )
                .foregroundStyle(selectedMetric.vitalSenseGradient.opacity(0.3))

                PointMark(
                    x: .value("Date", dataPoint.date),
                    y: .value("Value", dataPoint.value)
                )
                .foregroundStyle(selectedMetric.vitalSenseColor)
                .symbolSize(60)
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { _ in
                    AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5))
                        .foregroundStyle(VitalSenseBrand.Colors.textMuted.opacity(0.3))
                    AxisTick(stroke: StrokeStyle(lineWidth: 0.5))
                        .foregroundStyle(VitalSenseBrand.Colors.textMuted)
                    AxisValueLabel()
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }
            }
            .chartYAxis {
                AxisMarks { _ in
                    AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5))
                        .foregroundStyle(VitalSenseBrand.Colors.textMuted.opacity(0.3))
                    AxisTick(stroke: StrokeStyle(lineWidth: 0.5))
                        .foregroundStyle(VitalSenseBrand.Colors.textMuted)
                    AxisValueLabel()
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }
            }
            .scaleEffect(animateChart ? 1.0 : 0.9)
            .opacity(animateChart ? 1.0 : 0.0)
            .animation(VitalSenseBrand.Animations.spring, value: animateChart)
            .onAppear {
                withAnimation(VitalSenseBrand.Animations.spring.delay(0.2)) {
                    animateChart = true
                }
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .vitalSenseCard()
    }
}
                )
                .foregroundStyle(selectedMetric.color)
                .symbolSize(36)
            }
            .frame(height: 120)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }

            // Trend Summary
            TrendSummaryView(metric: selectedMetric, data: trendsData.getTrendData(for: selectedMetric))
        }
    }
}

// MARK: - Trend Summary View
struct TrendSummaryView: View {
    let metric: GaitMetricType
    let data: [GaitTrendDataPoint]

    private var trendDirection: TrendDirection {
        guard data.count >= 2 else { return .stable }

        let recent = Array(data.suffix(3))
        let earlier = Array(data.prefix(3))

        let recentAvg = recent.map { $0.value }.reduce(0, +) / Double(recent.count)
        let earlierAvg = earlier.map { $0.value }.reduce(0, +) / Double(earlier.count)

        let change = (recentAvg - earlierAvg) / earlierAvg

        if change > 0.05 { return .improving }
        else if change < -0.05 { return .declining }
        else { return .stable }
    }

    var body: some View {
        HStack {
            Image(systemName: trendDirection.icon)
                .foregroundColor(trendDirection.color)

            Text(trendDirection.description)
                .font(.caption)
                .foregroundColor(trendDirection.color)

            Spacer()

            if let lastValue = data.last?.value {
                Text(metric.formatValue(lastValue))
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(trendDirection.color.opacity(0.1))
        .cornerRadius(6)
    }
}

// MARK: - VitalSense Metric Selector View
struct VitalSenseMetricSelectorView: View {
    @Binding var selectedMetric: GaitMetricType
    @State private var animateButtons = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            Text("Metric Focus")
                .font(VitalSenseBrand.Typography.heading3)
                .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: VitalSenseBrand.Layout.medium) {
                    ForEach(GaitMetricType.allCases.indices, id: \.self) { index in
                        let metric = GaitMetricType.allCases[index]
                        VitalSenseMetricSelectorButton(
                            metric: metric,
                            isSelected: selectedMetric == metric
                        ) {
                            withAnimation(VitalSenseBrand.Animations.bouncy) {
                                selectedMetric = metric
                            }
                        }
                        .scaleEffect(animateButtons ? 1.0 : 0.8)
                        .opacity(animateButtons ? 1.0 : 0.0)
                        .animation(
                            VitalSenseBrand.Animations.spring.delay(Double(index) * 0.05),
                            value: animateButtons
                        )
                    }
                }
                .padding(.horizontal, VitalSenseBrand.Layout.medium)
            }
        }
        .onAppear {
            withAnimation {
                animateButtons = true
            }
        }
    }
}

// MARK: - VitalSense Metric Selector Button
struct VitalSenseMetricSelectorButton: View {
    let metric: GaitMetricType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: VitalSenseBrand.Layout.small) {
                Image(systemName: metric.vitalSenseIcon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(
                        isSelected ?
                        Color.white :
                        metric.vitalSenseGradient
                    )

                Text(metric.displayName)
                    .font(VitalSenseBrand.Typography.body)
                    .fontWeight(isSelected ? .semibold : .medium)
                    .foregroundStyle(
                        isSelected ?
                        Color.white :
                        VitalSenseBrand.Colors.textPrimary
                    )
            }
            .padding(.horizontal, VitalSenseBrand.Layout.medium)
            .padding(.vertical, VitalSenseBrand.Layout.small)
            .background(
                Group {
                    if isSelected {
                        metric.vitalSenseGradient
                    } else {
                        VitalSenseBrand.Colors.cardBackground
                    }
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: VitalSenseBrand.Layout.cornerRadius)
                    .stroke(
                        isSelected ?
                        Color.clear :
                        metric.vitalSenseColor.opacity(0.3),
                        lineWidth: 1
                    )
            )
            .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
            .shadow(
                color: isSelected ? metric.vitalSenseColor.opacity(0.3) : Color.clear,
                radius: isSelected ? 8 : 0,
                x: 0,
                y: isSelected ? 4 : 0
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(selectedMetric == metric ? metric.color : Color(.tertiarySystemBackground))
                            .foregroundColor(selectedMetric == metric ? .white : .primary)
                            .cornerRadius(16)
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - VitalSense Detailed Analysis View
struct VitalSenseDetailedMetricAnalysisView: View {
    let gaitMetrics: GaitMetrics
    let selectedMetric: GaitMetricType
    @State private var animateAnalysis = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            // Analysis Header
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(VitalSenseBrand.Colors.primaryGradient)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Analysis")
                        .font(VitalSenseBrand.Typography.heading3)
                        .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                    Text("Personalized insights for \(selectedMetric.displayName.lowercased())")
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }

                Spacer()
            }

            // Analysis Content
            VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
                // Main Analysis
                VitalSenseAnalysisCard(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Current Status",
                    content: getAnalysisText(),
                    color: getAnalysisColor()
                )

                // Recommendations
                if !getRecommendations().isEmpty {
                    VitalSenseRecommendationsCard(
                        recommendations: getRecommendations(),
                        metricType: selectedMetric
                    )
                }

                // Progress Indicator
                VitalSenseProgressIndicator(
                    value: getProgressValue(),
                    target: getTargetValue(),
                    metric: selectedMetric
                )
            }
        }
        .scaleEffect(animateAnalysis ? 1.0 : 0.95)
        .opacity(animateAnalysis ? 1.0 : 0.0)
        .animation(VitalSenseBrand.Animations.spring, value: animateAnalysis)
        .onAppear {
            withAnimation(VitalSenseBrand.Animations.spring.delay(0.4)) {
                animateAnalysis = true
            }
        }
    }

    private func getAnalysisColor() -> Color {
        switch selectedMetric {
        case .walkingSpeed:
            guard let speed = gaitMetrics.averageWalkingSpeed else { return VitalSenseBrand.Colors.textMuted }
            return speed >= 1.2 ? VitalSenseBrand.Colors.success :
                   speed >= 1.0 ? VitalSenseBrand.Colors.warning : VitalSenseBrand.Colors.error
        case .symmetry:
            guard let asymmetry = gaitMetrics.walkingAsymmetry else { return VitalSenseBrand.Colors.textMuted }
            let symmetry = (1.0 - asymmetry) * 100
            return symmetry >= 90 ? VitalSenseBrand.Colors.success :
                   symmetry >= 80 ? VitalSenseBrand.Colors.warning : VitalSenseBrand.Colors.error
        default:
            return VitalSenseBrand.Colors.info
        }
    }

    private func getProgressValue() -> Double {
        switch selectedMetric {
        case .walkingSpeed:
            return min((gaitMetrics.averageWalkingSpeed ?? 0) / 1.4, 1.0)
        case .symmetry:
            return min(((1.0 - (gaitMetrics.walkingAsymmetry ?? 0)) * 100) / 100, 1.0)
        case .cadence:
            return min((gaitMetrics.cadence ?? 0) / 120, 1.0)
        default:
            return 0.5
        }
    }

    private func getTargetValue() -> Double {
        return 1.0 // All metrics target 100%
    }
                return "Your walking speed is excellent, indicating strong lower limb strength and cardiovascular fitness."
            } else if speed >= 1.0 {
                return "Your walking speed is good but has room for improvement. Regular walking practice can help increase pace."
            } else if speed >= 0.8 {
                return "Your walking speed is below optimal. Consider gradual pace increases and strength exercises."
            } else {
                return "Your walking speed indicates potential mobility concerns. Consider consulting a healthcare provider."
            }

        case .stepLength:
            guard let stepLength = gaitMetrics.averageStepLength else {
                return "Step length data not available."
            }

            let lengthCm = stepLength * 100

            if lengthCm >= 65 && lengthCm <= 75 {
                return "Your step length is optimal, indicating good hip mobility and leg strength."
            } else if lengthCm < 65 {
                return "Shorter steps may indicate muscle weakness or joint stiffness. Hip flexor stretches may help."
            } else {
                return "Longer steps may indicate compensation patterns. Focus on controlled, comfortable stride length."
            }

        case .cadence:
            guard let cadence = gaitMetrics.cadence else {
                return "Cadence data not available."
            }

            if cadence >= 110 && cadence <= 130 {
                return "Your step rate is in the optimal range for efficient walking."
            } else if cadence < 110 {
                return "Increasing your step rate slightly can improve walking efficiency and reduce impact."
            } else {
                return "Your step rate is quite high. Consider slightly longer, more controlled steps."
            }

        case .asymmetry:
            guard let asymmetry = gaitMetrics.walkingAsymmetry else {
                return "Gait symmetry data not available."
            }

            let asymmetryPercent = asymmetry * 100

            if asymmetryPercent <= 3.0 {
                return "Your gait symmetry is excellent, indicating balanced muscle strength and coordination."
            } else if asymmetryPercent <= 5.0 {
                return "Minor gait asymmetry detected. Single-leg exercises may help improve balance."
            } else {
                return "Noticeable gait asymmetry present. Consider balance training and strength assessment."
            }
        }
    }

    private func getRecommendations() -> [String] {
        switch selectedMetric {
        case .walkingSpeed:
            guard let speed = gaitMetrics.averageWalkingSpeed else { return [] }

            if speed < 1.0 {
                return [
                    "Start with 10-minute daily walks",
                    "Gradually increase pace over time",
                    "Include hill walking for strength"
                ]
            }

        case .stepLength:
            guard let stepLength = gaitMetrics.averageStepLength else { return [] }

            let lengthCm = stepLength * 100

            if lengthCm < 65 {
                return [
                    "Practice walking lunges",
                    "Stretch hip flexors daily",
                    "Strengthen glute muscles"
                ]
            }

        case .cadence:
            guard let cadence = gaitMetrics.cadence else { return [] }

            if cadence < 110 {
                return [
                    "Use a metronome app while walking",
                    "Count steps to increase awareness",
                    "Practice quick, light steps"
                ]
            }

        case .asymmetry:
            guard let asymmetry = gaitMetrics.walkingAsymmetry else { return [] }

            if asymmetry > 0.05 {
                return [
                    "Practice single-leg stands",
                    "Use heel-to-toe walking exercises",
                    "Consider physical therapy evaluation"
                ]
            }
        }

        return []
    }
}

// MARK: - Supporting Types

enum GaitMetricType: String, CaseIterable {
    case walkingSpeed = "walking_speed"
    case stepLength = "step_length"
    case cadence = "cadence"
    case asymmetry = "asymmetry"

    var displayName: String {
        switch self {
        case .walkingSpeed: return "Speed"
        case .stepLength: return "Step Length"
        case .cadence: return "Cadence"
        case .asymmetry: return "Symmetry"
        }
    }

    var color: Color {
        switch self {
        case .walkingSpeed: return .blue
        case .stepLength: return .green
        case .cadence: return .orange
        case .asymmetry: return .purple
        }
    }

    func formatValue(_ value: Double) -> String {
        switch self {
        case .walkingSpeed: return String(format: "%.2f m/s", value)
        case .stepLength: return String(format: "%.0f cm", value * 100)
        case .cadence: return String(format: "%.0f spm", value)
        case .asymmetry: return String(format: "%.1f%%", (1.0 - value) * 100)
        }
    }
}

enum MetricStatus {
    case excellent, good, fair, poor, unknown

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .red
        case .unknown: return .gray
        }
    }
}

enum TrendDirection {
    case improving, stable, declining

    var icon: String {
        switch self {
        case .improving: return "arrow.up.right"
        case .stable: return "arrow.right"
        case .declining: return "arrow.down.right"
        }
    }

    var color: Color {
        switch self {
        case .improving: return .green
        case .stable: return .blue
        case .declining: return .red
        }
    }

    var description: String {
        switch self {
        case .improving: return "Improving"
        case .stable: return "Stable"
        case .declining: return "Declining"
        }
    }
}

// MARK: - Sample Data Provider
class GaitTrendsData: ObservableObject {
    func getTrendData(for metric: GaitMetricType) -> [GaitTrendDataPoint] {
        let calendar = Calendar.current
        let today = Date()

        return (0..<7).map { dayOffset in
            let date = calendar.date(byAdding: .day, value: -dayOffset, to: today)!
            let value = generateSampleValue(for: metric, dayOffset: dayOffset)
            return GaitTrendDataPoint(date: date, value: value)
        }.reversed()
    }

    private func generateSampleValue(for metric: GaitMetricType, dayOffset: Int) -> Double {
        // Generate realistic sample data with some variation
        let baseValue: Double
        let variation: Double = 0.1

        switch metric {
        case .walkingSpeed:
            baseValue = 1.2 + Double.random(in: -variation...variation)
        case .stepLength:
            baseValue = 0.7 + Double.random(in: -variation...variation)
        case .cadence:
            baseValue = 120 + Double.random(in: -10...10)
        case .asymmetry:
            baseValue = 0.03 + Double.random(in: -0.01...0.02)
        }

        // Add slight trend over time
        let trendFactor = 1.0 + (Double(7 - dayOffset) * 0.01)
        return baseValue * trendFactor
    }
}

struct GaitTrendDataPoint {
    let date: Date
    let value: Double
}
