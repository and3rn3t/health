//
//  iOS26Integration.swift
//  VitalSense
//
//  Integration layer for iOS 26 features with backward compatibility
//  Bridges new iOS 26 features with existing VitalSense components
//

import SwiftUI
import HealthKit

// MARK: - iOS 26 Feature Availability Wrapper
struct iOS26Features {
    static var isAvailable: Bool {
        if #available(iOS 26.0, *) {
            return true
        }
        return false
    }
}

// MARK: - Backward Compatible Health Metric Card
struct VitalSenseHealthMetricCard: View {
    let metric: HealthMetric
    let value: Double
    let unit: String
    let trend: TrendDirection

    var body: some View {
        if #available(iOS 26.0, *) {
            iOS26HealthMetricCard(
                metric: metric,
                value: value,
                unit: unit,
                trend: trend
            )
        } else {
            // Fallback to existing EnhancedMetricCard
            LegacyHealthMetricCard(
                metric: metric,
                value: value,
                unit: unit,
                trend: trend
            )
        }
    }
}

// MARK: - Legacy Implementation (iOS 15-25)
struct LegacyHealthMetricCard: View {
    let metric: HealthMetric
    let value: Double
    let unit: String
    let trend: TrendDirection

    @State private var animateValue = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                // Standard SF Symbol without Variable Draw
                Image(systemName: metric.sfSymbol)
                    .font(.title2)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [metric.primaryColor, metric.secondaryColor],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .scaleEffect(animateValue ? 1.1 : 1.0)
                    .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true),
                             value: animateValue)

                Spacer()

                Image(systemName: trendIcon)
                    .font(.caption)
                    .foregroundStyle(trendColor)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(metric.title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(formattedValue)
                        .font(.largeTitle.monospacedDigit().weight(.semibold))
                        .foregroundStyle(.primary)

                    Text(unit)
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(20)
        .background {
            // Standard material for older iOS versions
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                .fill(.regularMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                        .stroke(.quaternary, lineWidth: 1)
                }
        }
        .onAppear {
            animateValue = true
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
        case .up: return "arrow.up.circle.fill"
        case .down: return "arrow.down.circle.fill"
        case .stable: return "minus.circle.fill"
        }
    }

    private var trendColor: Color {
        switch (trend, metric.type) {
        case (.up, .heartRate), (.up, .steps): return .green
        case (.down, .heartRate), (.down, .steps): return .red
        case (.stable, _): return .blue
        default: return .secondary
        }
    }
}

// MARK: - Backward Compatible Heart Rate Monitor
struct VitalSenseHeartRateMonitor: View {
    @Binding var heartRate: Double

    var body: some View {
        if #available(iOS 26.0, *) {
            iOS26HeartRateMonitor(heartRate: $heartRate)
        } else {
            LegacyHeartRateMonitor(heartRate: $heartRate)
        }
    }
}

// MARK: - Legacy Heart Rate Monitor
struct LegacyHeartRateMonitor: View {
    @Binding var heartRate: Double
    @State private var pulseAnimation = false

    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                // Pulsing background
                Circle()
                    .fill(.red.opacity(0.15))
                    .frame(width: 120, height: 120)
                    .scaleEffect(pulseAnimation ? 1.2 : 1.0)
                    .animation(
                        .easeInOut(duration: 60.0 / heartRate)
                        .repeatForever(autoreverses: true),
                        value: pulseAnimation
                    )

                // Heart icon with standard animation
                Image(systemName: "heart.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.red, .pink],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .scaleEffect(pulseAnimation ? 1.05 : 1.0)
                    .animation(
                        .easeInOut(duration: 60.0 / heartRate)
                        .repeatForever(autoreverses: true),
                        value: pulseAnimation
                    )
            }

            VStack(spacing: 8) {
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text("\(Int(heartRate))")
                        .font(.largeTitle.monospacedDigit().weight(.bold))
                        .foregroundStyle(.primary)

                    Text("BPM")
                        .font(.title3.weight(.medium))
                        .foregroundStyle(.secondary)
                }

                Text(heartRateZoneDescription)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(heartRateZoneColor)
            }
        }
        .onAppear {
            pulseAnimation = true
        }
    }

    private var heartRateZoneDescription: String {
        switch heartRate {
        case 0..<60: return "Resting"
        case 60..<100: return "Normal"
        case 100..<140: return "Elevated"
        default: return "High"
        }
    }

    private var heartRateZoneColor: Color {
        switch heartRate {
        case 0..<60: return .blue
        case 60..<100: return .green
        case 100..<140: return .orange
        default: return .red
        }
    }
}

// MARK: - Enhanced VitalSense Brand with iOS 26 Support
extension VitalSenseBrand {

    // MARK: - Materials
    struct Materials {
        @available(iOS 26.0, *)
        static var liquidGlass: Material {
            .liquidGlass
        }

        @available(iOS 26.0, *)
        static var healthCard: Material {
            .liquidGlass.opacity(0.9)
        }

        // Fallback materials for older iOS
        static var cardBackground: Material {
            if #available(iOS 26.0, *) {
                return .liquidGlass.opacity(0.9)
            } else {
                return .regularMaterial
            }
        }

        static var widgetBackground: Material {
            if #available(iOS 26.0, *) {
                return .liquidGlass.opacity(0.7)
            } else {
                return .thinMaterial
            }
        }
    }

    // MARK: - Enhanced Colors with iOS 26 Gradients
    struct Colors {
        // Base colors (compatible with all iOS versions)
        static let primary = Color("VitalSensePrimary")
        static let secondary = Color("VitalSenseSecondary")
        static let accent = Color("VitalSenseAccent")

        // Health-specific colors
        static let healthGreen = Color("HealthGreen")
        static let healthRed = Color("HealthRed")
        static let healthBlue = Color("HealthBlue")
        static let healthOrange = Color("HealthOrange")

        // iOS 26 gradient variations
        @available(iOS 26.0, *)
        static var primaryGradient: some ShapeStyle {
            primary.gradient(.health)
        }

        @available(iOS 26.0, *)
        static var healthGradient: some ShapeStyle {
            healthGreen.gradient(.radial)
        }

        // Fallback gradients for older iOS
        static var primaryLinearGradient: LinearGradient {
            LinearGradient(
                colors: [primary, secondary],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    // MARK: - Animation Styles
    struct Animations {
        @available(iOS 26.0, *)
        static let heartRate: SymbolAnimation = .draw.repeating

        @available(iOS 26.0, *)
        static let activity: SymbolAnimation = .draw.continuous

        @available(iOS 26.0, *)
        static let statusTransition: SymbolTransition = .magicReplace

        // Fallback animations
        static let pulseAnimation: Animation = .easeInOut(duration: 1.0).repeatForever(autoreverses: true)
        static let scaleAnimation: Animation = .spring(response: 0.6, dampingFraction: 0.8)
    }

    // MARK: - Typography with iOS 26 Enhancements
    struct Typography {
        @available(iOS 26.0, *)
        static func gradientTitle(_ color: Color = .primary) -> some View {
            EmptyView()
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(color.gradient(.textPrimary))
        }

        static func title(_ color: Color = .primary) -> some View {
            EmptyView()
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(color)
        }

        @available(iOS 26.0, *)
        static func numericDisplay(_ value: Double) -> some View {
            EmptyView()
                .font(.largeTitle.monospacedDigit().weight(.semibold))
                .contentTransition(.numericText(value: value))
        }
    }
}

// MARK: - iOS 26 Feature Detection and Migration Helpers
struct iOS26MigrationHelper {

    // Check if specific iOS 26 features are available
    static var hasLiquidGlass: Bool {
        if #available(iOS 26.0, *) {
            return true
        }
        return false
    }

    static var hasVariableDraw: Bool {
        if #available(iOS 26.0, *) {
            return true
        }
        return false
    }

    static var hasMagicReplace: Bool {
        if #available(iOS 26.0, *) {
            return true
        }
        return false
    }

    // Provide appropriate material based on iOS version
    static func healthCardMaterial() -> Material {
        if #available(iOS 26.0, *) {
            return .liquidGlass.opacity(0.9)
        } else {
            return .regularMaterial
        }
    }

    // Create symbol view with iOS 26 enhancements if available
    static func healthSymbol(
        _ systemName: String,
        color: Color = .primary,
        variableValue: Double = 0.5
    ) -> some View {
        Group {
            if #available(iOS 26.0, *) {
                Image(systemName: systemName)
                    .symbolVariableValue(variableValue)
                    .symbolAnimation(.draw.continuous.speed(0.4))
                    .foregroundStyle(color.gradient(.health))
            } else {
                Image(systemName: systemName)
                    .foregroundStyle(color)
            }
        }
    }

    // Create animated value display with iOS 26 content transitions
    static func numericValue(
        _ value: Double,
        format: String = "%.0f"
    ) -> some View {
        Group {
            if #available(iOS 26.0, *) {
                Text(String(format: format, value))
                    .contentTransition(.numericText(value: value))
                    .animation(.smooth(duration: 0.6), value: value)
            } else {
                Text(String(format: format, value))
                    .animation(.easeInOut(duration: 0.6), value: value)
            }
        }
    }
}

// MARK: - Integration with Existing Components
extension EnhancedMetricCard {

    // Factory method to create iOS 26 enhanced version when available
    static func create(
        title: String,
        value: Double,
        unit: String,
        icon: String,
        color: Color = .primary,
        trend: TrendDirection = .stable
    ) -> some View {
        let metric = HealthMetric(
            title: title,
            type: .heartRate, // Default type
            sfSymbol: icon,
            primaryColor: color,
            secondaryColor: color.opacity(0.7),
            maxValue: 100
        )

        return VitalSenseHealthMetricCard(
            metric: metric,
            value: value,
            unit: unit,
            trend: trend
        )
    }
}

// MARK: - Widget Extensions for iOS 26
@available(iOS 26.0, *)
extension VitalSenseHealthWidget {

    // Enhanced widget entry with iOS 26 features
    struct iOS26WidgetEntry: TimelineEntry {
        let date: Date
        let healthData: HealthData
        let useEnhancedVisuals: Bool = true
    }

    // iOS 26 enhanced widget view
    static func enhancedWidgetView(entry: iOS26WidgetEntry) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                iOS26MigrationHelper.healthSymbol(
                    "heart.fill",
                    color: .healthRed,
                    variableValue: entry.healthData.heartRate / 180.0
                )
                .font(.title2)

                Spacer()

                Text("VitalSense")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            HStack(alignment: .lastTextBaseline) {
                iOS26MigrationHelper.numericValue(
                    entry.healthData.heartRate,
                    format: "%.0f"
                )
                .font(.title.monospacedDigit().weight(.bold'))

                Text("BPM")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.liquidGlass.opacity(0.8))
        }
    }
}

// MARK: - Sample Health Data for Testing
extension HealthData {
    static let sampleData = HealthData(
        heartRate: 72,
        steps: 8542,
        temperature: 98.6,
        bloodPressure: (systolic: 120, diastolic: 80),
        oxygenSaturation: 98
    )
}

struct HealthData {
    let heartRate: Double
    let steps: Double
    let temperature: Double
    let bloodPressure: (systolic: Double, diastolic: Double)
    let oxygenSaturation: Double
}
