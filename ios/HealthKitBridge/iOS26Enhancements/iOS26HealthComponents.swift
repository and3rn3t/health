//
//  iOS26HealthComponents.swift
//  VitalSense
//
//  Enhanced health components leveraging iOS 26 design features
//  Integrates with existing EnhancedUIComponents.swift
//

import SwiftUI
import HealthKit
import Charts

// MARK: - iOS 26 Enhanced Health Metric Card
@available(iOS 26.0, *)
struct iOS26HealthMetricCard: View {
    let metric: HealthMetric
    let value: Double
    let unit: String
    let trend: TrendDirection

    @State private var animationProgress: Double = 0.0
    @State private var isAnimating = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            headerSection
            valueSection
            trendSection
        }
        .padding(20)
        .background {
            // iOS 26 Liquid Glass Material
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                .fill(.liquidGlass.opacity(0.85))
                .overlay {
                    RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                        .stroke(.liquidGlassStroke.opacity(0.3), lineWidth: 1)
                }
                .shadow(
                    .drop(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
                )
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0)) {
                animationProgress = normalizedValue
                isAnimating = true
            }
        }
    }

    private var headerSection: some View {
        HStack {
            // Variable Draw SF Symbol
            Image(systemName: metric.sfSymbol)
                .font(.title2)
                .symbolVariableValue(animationProgress)
                .symbolAnimation(.draw.repeating.speed(animationSpeed))
                .foregroundStyle(
                    metric.primaryColor.gradient(.health),
                    metric.secondaryColor.gradient(.health)
                )

            Spacer()

            // Status indicator with Magic Replace
            Image(systemName: trendIcon)
                .font(.caption)
                .symbolTransition(.magicReplace.combined(with: .scale))
                .foregroundStyle(trendColor)
                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: trend)
        }
    }

    private var valueSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(metric.title)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(formattedValue)
                    .font(.largeTitle.monospacedDigit().weight(.semibold))
                    .foregroundStyle(.primary.gradient(.textPrimary))
                    .contentTransition(.numericText(value: value))
                    .animation(.smooth(duration: 0.8), value: value)

                Text(unit)
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var trendSection: some View {
        HStack {
            // Progress indicator with Variable Draw
            Image(systemName: "chart.line.uptrend.xyaxis")
                .symbolVariableValue(trendProgress)
                .symbolAnimation(.draw.continuous.speed(0.3))
                .foregroundStyle(trendColor.gradient(.linear))

            Text(trendDescription)
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()
        }
    }

    // MARK: - Computed Properties

    private var normalizedValue: Double {
        min(max(value / metric.maxValue, 0.0), 1.0)
    }

    private var animationSpeed: Double {
        switch metric.type {
        case .heartRate:
            return value / 60.0  // Beats per second
        case .steps:
            return 0.5
        case .temperature:
            return 0.3
        default:
            return 0.4
        }
    }

    private var formattedValue: String {
        switch metric.type {
        case .heartRate, .steps:
            return "\(Int(value))"
        case .temperature:
            return String(format: "%.1f", value)
        default:
            return String(format: "%.0f", value)
        }
    }

    private var trendIcon: String {
        switch trend {
        case .up:
            return "arrow.up.circle.fill"
        case .down:
            return "arrow.down.circle.fill"
        case .stable:
            return "minus.circle.fill"
        }
    }

    private var trendColor: Color {
        switch (trend, metric.type) {
        case (.up, .heartRate), (.up, .steps):
            return .healthGreen
        case (.down, .heartRate), (.down, .steps):
            return .healthRed
        case (.stable, _):
            return .healthBlue
        default:
            return .secondary
        }
    }

    private var trendProgress: Double {
        switch trend {
        case .up:
            return 0.8
        case .down:
            return 0.3
        case .stable:
            return 0.5
        }
    }

    private var trendDescription: String {
        switch trend {
        case .up:
            return "Improving"
        case .down:
            return "Declining"
        case .stable:
            return "Stable"
        }
    }
}

// MARK: - iOS 26 Enhanced Heart Rate Monitor
@available(iOS 26.0, *)
struct iOS26HeartRateMonitor: View {
    @Binding var heartRate: Double
    @State private var isAnimating = false
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        VStack(spacing: 20) {
            heartRateDisplay
            heartRateDetails
        }
        .onAppear {
            startHeartRateAnimation()
        }
        .onChange(of: heartRate) { oldValue, newValue in
            updateAnimationSpeed()
        }
    }

    private var heartRateDisplay: some View {
        ZStack {
            // Pulsing background glow
            Circle()
                .fill(.healthRed.opacity(0.15))
                .scaleEffect(pulseScale)
                .animation(
                    .easeInOut(duration: 60.0 / heartRate)
                    .repeatForever(autoreverses: true),
                    value: pulseScale
                )

            // Variable Draw heart with live animation
            Image(systemName: "heart.fill")
                .font(.system(size: 80, weight: .medium))
                .symbolVariableValue(normalizedHeartRate)
                .symbolAnimation(.draw.repeating.speed(heartRateSpeed))
                .foregroundStyle(
                    .healthRed.gradient(.radial),
                    .healthPink.gradient(.radial)
                )
                .shadow(.healthGlow)
        }
        .frame(width: 120, height: 120)
    }

    private var heartRateDetails: some View {
        VStack(spacing: 8) {
            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text("\(Int(heartRate))")
                    .font(.largeTitle.monospacedDigit().weight(.bold))
                    .foregroundStyle(.primary.gradient(.textPrimary))
                    .contentTransition(.numericText(value: heartRate))
                    .animation(.smooth(duration: 0.5), value: heartRate)

                Text("BPM")
                    .font(.title3.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            HStack {
                Image(systemName: heartRateZone.icon)
                    .symbolVariableValue(heartRateZone.intensity)
                    .foregroundStyle(heartRateZone.color)

                Text(heartRateZone.description)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(heartRateZone.color)
            }
        }
    }

    // MARK: - Computed Properties

    private var normalizedHeartRate: Double {
        // Normalize to 0.0-1.0 range (40-180 BPM)
        min(max((heartRate - 40) / 140, 0.0), 1.0)
    }

    private var heartRateSpeed: Double {
        heartRate / 60.0  // Beats per second
    }

    private var heartRateZone: HeartRateZone {
        switch heartRate {
        case 0..<60:
            return HeartRateZone(
                description: "Resting",
                color: .healthBlue,
                icon: "figure.seated",
                intensity: 0.2
            )
        case 60..<100:
            return HeartRateZone(
                description: "Normal",
                color: .healthGreen,
                icon: "figure.walk",
                intensity: 0.5
            )
        case 100..<140:
            return HeartRateZone(
                description: "Elevated",
                color: .healthOrange,
                icon: "figure.run",
                intensity: 0.7
            )
        default:
            return HeartRateZone(
                description: "High",
                color: .healthRed,
                icon: "figure.run.motion",
                intensity: 1.0
            )
        }
    }

    // MARK: - Animation Methods

    private func startHeartRateAnimation() {
        isAnimating = true
        updateAnimationSpeed()
    }

    private func updateAnimationSpeed() {
        let beatInterval = 60.0 / heartRate

        withAnimation(
            .easeInOut(duration: beatInterval)
            .repeatForever(autoreverses: true)
        ) {
            pulseScale = 1.2
        }
    }
}

// MARK: - iOS 26 Enhanced Activity Ring
@available(iOS 26.0, *)
struct iOS26ActivityRing: View {
    let progress: Double  // 0.0 to 1.0
    let color: Color
    let lineWidth: CGFloat = 12

    @State private var animatedProgress: Double = 0.0

    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(
                    color.opacity(0.2),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )

            // Progress ring with Variable Draw effect
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(
                    color.gradient(.conic),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .shadow(.healthGlow.opacity(0.6))

            // Variable Draw progress indicator
            Image(systemName: "circle.fill")
                .font(.system(size: 8))
                .symbolVariableValue(animatedProgress)
                .foregroundStyle(color)
                .offset(y: -50)
                .rotationEffect(.degrees(360 * animatedProgress - 90))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5)) {
                animatedProgress = progress
            }
        }
        .onChange(of: progress) { oldValue, newValue in
            withAnimation(.smooth(duration: 0.8)) {
                animatedProgress = newValue
            }
        }
    }
}

// MARK: - iOS 26 Health Dashboard Hero
@available(iOS 26.0, *)
struct iOS26HealthDashboardHero: View {
    let overallScore: Double  // 0-100
    let status: HealthStatus

    @State private var isAnimating = false

    var body: some View {
        VStack(spacing: 24) {
            healthIndicator
            statusText
            quickMetrics
        }
        .padding(30)
        .background {
            // Liquid Glass hero background
            RoundedRectangle(cornerRadius: 28)
                .fill(.liquidGlass.opacity(0.9))
                .overlay {
                    RoundedRectangle(cornerRadius: 28)
                        .stroke(.liquidGlassStroke.opacity(0.4), lineWidth: 1.5)
                }
                .shadow(.drop(color: .black.opacity(0.08), radius: 20, x: 0, y: 8))
        }
        .onAppear {
            isAnimating = true
        }
    }

    private var healthIndicator: some View {
        ZStack {
            // Background glow
            Circle()
                .fill(status.color.opacity(0.1))
                .frame(width: 140, height: 140)
                .scaleEffect(isAnimating ? 1.1 : 1.0)
                .animation(
                    .easeInOut(duration: 2.0).repeatForever(autoreverses: true),
                    value: isAnimating
                )

            // Main health figure with Variable Draw
            Image(systemName: status.sfSymbol)
                .font(.system(size: 64, weight: .medium))
                .symbolVariableValue(overallScore / 100.0)
                .symbolAnimation(.draw.continuous.speed(0.4))
                .foregroundStyle(
                    status.color.gradient(.elliptical),
                    status.secondaryColor.gradient(.elliptical)
                )
        }
    }

    private var statusText: some View {
        VStack(spacing: 8) {
            Text("\(Int(overallScore))")
                .font(.largeTitle.monospacedDigit().weight(.bold))
                .foregroundStyle(.primary.gradient(.textPrimary))
                .contentTransition(.numericText(value: overallScore))

            Text(status.description)
                .font(.title2.weight(.semibold))
                .foregroundStyle(status.color)
                .symbolTransition(.magicReplace)
                .animation(.spring(), value: status)
        }
    }

    private var quickMetrics: some View {
        HStack(spacing: 20) {
            ForEach(QuickMetric.allCases, id: \.self) { metric in
                quickMetricItem(metric)
            }
        }
    }

    private func quickMetricItem(_ metric: QuickMetric) -> some View {
        VStack(spacing: 6) {
            Image(systemName: metric.icon)
                .font(.title3)
                .symbolVariableValue(metric.value / metric.maxValue)
                .foregroundStyle(metric.color.gradient(.linear))

            Text(metric.displayValue)
                .font(.caption.monospacedDigit().weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Supporting Types

struct HealthMetric {
    let title: String
    let type: HealthMetricType
    let sfSymbol: String
    let primaryColor: Color
    let secondaryColor: Color
    let maxValue: Double
}

enum HealthMetricType {
    case heartRate
    case steps
    case temperature
    case bloodPressure
    case oxygenSaturation
}

enum TrendDirection {
    case up
    case down
    case stable
}

struct HeartRateZone {
    let description: String
    let color: Color
    let icon: String
    let intensity: Double
}

enum HealthStatus {
    case excellent
    case good
    case fair
    case poor

    var description: String {
        switch self {
        case .excellent: return "Excellent Health"
        case .good: return "Good Health"
        case .fair: return "Fair Health"
        case .poor: return "Needs Attention"
        }
    }

    var color: Color {
        switch self {
        case .excellent: return .healthGreen
        case .good: return .healthBlue
        case .fair: return .healthOrange
        case .poor: return .healthRed
        }
    }

    var secondaryColor: Color {
        switch self {
        case .excellent: return .healthLightGreen
        case .good: return .healthLightBlue
        case .fair: return .healthLightOrange
        case .poor: return .healthLightRed
        }
    }

    var sfSymbol: String {
        switch self {
        case .excellent: return "figure.walk.motion"
        case .good: return "figure.walk"
        case .fair: return "figure.seated"
        case .poor: return "cross.case.fill"
        }
    }
}

enum QuickMetric: CaseIterable {
    case steps
    case heartRate
    case sleep

    var icon: String {
        switch self {
        case .steps: return "figure.walk"
        case .heartRate: return "heart.fill"
        case .sleep: return "bed.double.fill"
        }
    }

    var color: Color {
        switch self {
        case .steps: return .healthBlue
        case .heartRate: return .healthRed
        case .sleep: return .healthPurple
        }
    }

    var value: Double {
        // Mock values - replace with actual data
        switch self {
        case .steps: return 8542
        case .heartRate: return 72
        case .sleep: return 7.5
        }
    }

    var maxValue: Double {
        switch self {
        case .steps: return 10000
        case .heartRate: return 180
        case .sleep: return 10
        }
    }

    var displayValue: String {
        switch self {
        case .steps: return "\(Int(value))"
        case .heartRate: return "\(Int(value))"
        case .sleep: return String(format: "%.1fh", value)
        }
    }
}

// MARK: - iOS 26 Color Extensions
@available(iOS 26.0, *)
extension Color {
    static let healthGreen = Color("HealthGreen")
    static let healthRed = Color("HealthRed")
    static let healthBlue = Color("HealthBlue")
    static let healthOrange = Color("HealthOrange")
    static let healthPurple = Color("HealthPurple")
    static let healthPink = Color("HealthPink")

    static let healthLightGreen = Color("HealthLightGreen")
    static let healthLightRed = Color("HealthLightRed")
    static let healthLightBlue = Color("HealthLightBlue")
    static let healthLightOrange = Color("HealthLightOrange")
}

// MARK: - iOS 26 Shadow Extensions
@available(iOS 26.0, *)
extension ShadowStyle {
    static let healthGlow = ShadowStyle.drop(
        color: .healthRed.opacity(0.3),
        radius: 8,
        x: 0,
        y: 0
    )
}

// MARK: - iOS 26 Watch Metric Card (Compact)
@available(iOS 26.0, watchOS 13.0, *)
struct iOS26WatchMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let symbol: String
    let color: Color
    let variableValue: Double
    var animate: Bool = true

    @State private var animationTrigger = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: symbol)
                    .font(.caption)
                    .foregroundStyle(iOS26Integration.gradientStyle(for: getHealthCategory()))
                    .symbolEffect(
                        .variableColor.iterative.dimInactiveLayers.nonReversing,
                        options: .speed(animate ? 1.0 : 0.0),
                        value: animationTrigger
                    )
                    .symbolEffect(
                        .pulse.byLayer,
                        options: .repeat(.continuous).speed(0.8),
                        value: animate && animationTrigger
                    )

                Spacer()
            }

            VStack(alignment: .leading, spacing: 1) {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(value)
                        .font(.system(.caption, design: .rounded, weight: .semibold))
                        .contentTransition(.numericText(value: Double(value) ?? 0))

                    if !unit.isEmpty {
                        Text(unit)
                            .font(.system(.caption2, design: .rounded))
                            .foregroundColor(.secondary)
                    }
                }

                Text(title)
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            RoundedRectangle(cornerRadius: 8)
                .fill(iOS26Integration.liquidGlassMaterial())
        }
        .onAppear {
            if animate {
                withAnimation(.easeInOut(duration: 0.8).delay(0.2)) {
                    animationTrigger = true
                }
            }
        }
    }

    private func getHealthCategory() -> iOS26Integration.HealthCategory {
        switch symbol {
        case "heart.fill":
            return .cardiovascular
        case "figure.walk":
            return .activity
        case "flame.fill":
            return .energy
        case "stopwatch.fill":
            return .performance
        default:
            return .general
        }
    }
}
