//
//  iOS26ComponentIntegration.swift
//  VitalSense
//
//  Step-by-step integration of iOS 26 components into existing VitalSense app
//  This file shows how to wire the new iOS 26 components into your current codebase
//

import SwiftUI
import HealthKit

// MARK: - Integration Extensions for Existing Components

extension EnhancedMetricCard {

    /// Create iOS 26 enhanced version of existing EnhancedMetricCard
    /// This is a drop-in replacement that automatically uses iOS 26 features when available
    static func createiOS26Enhanced(
        title: String,
        value: String,
        unit: String,
        trend: TrendDirection? = nil,
        status: HealthStatus = .good,
        icon: String,
        action: (() -> Void)? = nil
    ) -> some View {

        // Convert existing parameters to iOS 26 format
        let doubleValue = Double(value) ?? 0.0
        let ios26Trend = trend?.toiOS26Trend() ?? .stable
        let healthMetric = HealthMetric(
            title: title,
            type: .heartRate, // Default - will be enhanced based on icon
            sfSymbol: icon,
            primaryColor: status.color,
            secondaryColor: status.color.opacity(0.7),
            maxValue: determineMaxValue(for: icon)
        )

        return VitalSenseHealthMetricCard(
            metric: healthMetric,
            value: doubleValue,
            unit: unit,
            trend: ios26Trend
        )
    }

    private static func determineMaxValue(for icon: String) -> Double {
        switch icon {
        case "heart.fill": return 180.0
        case "figure.walk": return 20000.0
        case "flame.fill": return 1000.0
        case "bed.double.fill": return 10.0
        default: return 100.0
        }
    }
}

// MARK: - Extension for Legacy Trend to iOS 26 Trend Conversion
extension EnhancedMetricCard.TrendDirection {
    func toiOS26Trend() -> TrendDirection {
        switch self {
        case .up: return .up
        case .down: return .down
        case .stable: return .stable
        }
    }
}

// MARK: - Enhanced Dashboard Integration
extension EnhancedVitalSenseDashboard {

    /// iOS 26 Enhanced Primary Metrics Grid
    /// Replace the existing primaryMetricsGrid with this version
    var iOS26EnhancedPrimaryMetricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: ModernDesignSystem.Spacing.medium) {

            // Heart Rate - iOS 26 Enhanced
            VitalSenseHealthMetricCard(
                metric: HealthMetric(
                    title: "Heart Rate",
                    type: .heartRate,
                    sfSymbol: "heart.fill",
                    primaryColor: .red,
                    secondaryColor: .pink,
                    maxValue: 180
                ),
                value: Double(healthManager.currentHeartRate),
                unit: "BPM",
                trend: .stable
            )

            // Daily Steps - iOS 26 Enhanced
            VitalSenseHealthMetricCard(
                metric: HealthMetric(
                    title: "Daily Steps",
                    type: .steps,
                    sfSymbol: "figure.walk",
                    primaryColor: .blue,
                    secondaryColor: .cyan,
                    maxValue: 20000
                ),
                value: Double(healthManager.todaySteps),
                unit: "steps",
                trend: .up
            )

            // Walking Steadiness - iOS 26 Enhanced
            VitalSenseHealthMetricCard(
                metric: HealthMetric(
                    title: "Walking Steadiness",
                    type: .bloodPressure,
                    sfSymbol: "figure.walk.motion",
                    primaryColor: .green,
                    secondaryColor: .mint,
                    maxValue: 100
                ),
                value: 92,
                unit: "%",
                trend: .stable
            )

            // Active Energy - iOS 26 Enhanced
            VitalSenseHealthMetricCard(
                metric: HealthMetric(
                    title: "Active Energy",
                    type: .steps,
                    sfSymbol: "flame.fill",
                    primaryColor: .orange,
                    secondaryColor: .yellow,
                    maxValue: 1000
                ),
                value: Double(healthManager.activeEnergyBurned),
                unit: "cal",
                trend: .up
            )
        }
    }

    /// iOS 26 Enhanced Heart Rate Monitor Section
    /// Add this to your dashboard for the enhanced heart rate display
    var iOS26HeartRateSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Heart Rate Monitor")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.primary)

            if #available(iOS 26.0, *) {
                iOS26HeartRateMonitor(heartRate: .constant(Double(healthManager.currentHeartRate)))
            } else {
                VitalSenseHeartRateMonitor(heartRate: .constant(Double(healthManager.currentHeartRate)))
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 20)
                .fill(.regularMaterial)
        }
    }

    /// iOS 26 Enhanced Dashboard Hero
    /// Replace your main dashboard header with this version
    var iOS26DashboardHero: some View {
        if #available(iOS 26.0, *) {
            iOS26HealthDashboardHero(
                overallScore: calculateOverallHealthScore(),
                status: determineHealthStatus()
            )
        } else {
            // Fallback to existing hero section
            VStack(spacing: 20) {
                Text("VitalSense")
                    .font(.largeTitle.weight(.bold))
                Text("Health Score: \(Int(calculateOverallHealthScore()))")
                    .font(.title2)
            }
            .padding()
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
        }
    }

    // MARK: - Helper Methods

    private func calculateOverallHealthScore() -> Double {
        // Calculate based on current health metrics
        let heartRateScore = min(max((180 - Double(healthManager.currentHeartRate)) / 120 * 100, 0), 100)
        let stepsScore = min(Double(healthManager.todaySteps) / 10000 * 100, 100)
        let energyScore = min(Double(healthManager.activeEnergyBurned) / 500 * 100, 100)

        return (heartRateScore + stepsScore + energyScore) / 3
    }

    private func determineHealthStatus() -> HealthStatus {
        let score = calculateOverallHealthScore()
        switch score {
        case 85...100: return .excellent
        case 70..<85: return .good
        case 55..<70: return .fair
        default: return .poor
        }
    }
}

// MARK: - Widget Integration
extension VitalSenseHealthWidget {

    /// iOS 26 Enhanced Widget Implementation
    /// Replace your widget timeline provider with this enhanced version
    struct iOS26EnhancedTimelineProvider: TimelineProvider {

        func placeholder(in context: Context) -> HealthWidgetEntry {
            HealthWidgetEntry(
                date: Date(),
                heartRate: 72,
                steps: 8500,
                activeEnergy: 320,
                configuration: .sampleConfiguration
            )
        }

        func getSnapshot(in context: Context, completion: @escaping (HealthWidgetEntry) -> ()) {
            let entry = HealthWidgetEntry(
                date: Date(),
                heartRate: 72,
                steps: 8500,
                activeEnergy: 320,
                configuration: .sampleConfiguration
            )
            completion(entry)
        }

        func getTimeline(in context: Context, completion: @escaping (Timeline<HealthWidgetEntry>) -> ()) {
            var entries: [HealthWidgetEntry] = []
            let currentDate = Date()

            // Generate timeline entries with iOS 26 enhanced data
            for hourOffset in 0..<5 {
                let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
                let entry = HealthWidgetEntry(
                    date: entryDate,
                    heartRate: generateRealisticHeartRate(),
                    steps: generateRealisticSteps(for: entryDate),
                    activeEnergy: generateRealisticEnergy(for: entryDate),
                    configuration: .sampleConfiguration
                )
                entries.append(entry)
            }

            let timeline = Timeline(entries: entries, policy: .atEnd)
            completion(timeline)
        }

        private func generateRealisticHeartRate() -> Double {
            return Double.random(in: 65...85)
        }

        private func generateRealisticSteps(for date: Date) -> Double {
            let hour = Calendar.current.component(.hour, from: date)
            let baseSteps = Double(hour) * 400 // Realistic step accumulation
            return baseSteps + Double.random(in: -100...100)
        }

        private func generateRealisticEnergy(for date: Date) -> Double {
            let hour = Calendar.current.component(.hour, from: date)
            let baseEnergy = Double(hour) * 25 // Realistic energy burn
            return baseEnergy + Double.random(in: -20...20)
        }
    }

    /// iOS 26 Enhanced Widget View
    /// Enhanced widget with iOS 26 features when available
    struct iOS26EnhancedWidgetView: View {
        let entry: HealthWidgetEntry

        var body: some View {
            if #available(iOS 26.0, *) {
                iOS26WidgetContent(entry: entry)
            } else {
                LegacyWidgetContent(entry: entry)
            }
        }
    }

    @available(iOS 26.0, *)
    struct iOS26WidgetContent: View {
        let entry: HealthWidgetEntry

        var body: some View {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    // Variable Draw heart rate
                    Image(systemName: "heart.fill")
                        .symbolVariableValue(entry.heartRate / 180.0)
                        .symbolAnimation(.draw.continuous.speed(entry.heartRate / 60.0))
                        .foregroundStyle(.red.gradient(.radial))
                        .font(.title2)

                    Spacer()

                    Text("VitalSense")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .lastTextBaseline) {
                        Text("\(Int(entry.heartRate))")
                            .font(.title.monospacedDigit().weight(.bold))
                            .contentTransition(.numericText(value: entry.heartRate))

                        Text("BPM")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        // Variable Draw steps
                        Image(systemName: "figure.walk")
                            .symbolVariableValue(entry.steps / 20000.0)
                            .foregroundStyle(.blue.gradient(.linear))

                        Text("\(Int(entry.steps)) steps")
                            .font(.caption2)
                            .contentTransition(.numericText(value: entry.steps))
                    }
                }
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.liquidGlass.opacity(0.8))
            }
        }
    }

    struct LegacyWidgetContent: View {
        let entry: HealthWidgetEntry

        var body: some View {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.title2)

                    Spacer()

                    Text("VitalSense")
                        .font(.caption.weight(.medium))
                        .foregroundColor(.secondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack(alignment: .lastTextBaseline) {
                        Text("\(Int(entry.heartRate))")
                            .font(.title.monospacedDigit().weight(.bold))

                        Text("BPM")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.blue)

                        Text("\(Int(entry.steps)) steps")
                            .font(.caption2)
                    }
                }
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.regularMaterial)
            }
        }
    }
}

// MARK: - Apple Watch Integration
extension EnhancedWatchDashboard {

    /// iOS 26 Enhanced Watch Metrics
    /// Enhanced Apple Watch complications with iOS 26 features
    var iOS26WatchMetrics: some View {
        VStack(spacing: 8) {
            if #available(iOS 26.0, *) {
                // Enhanced heart rate with Variable Draw
                HStack {
                    Image(systemName: "heart.fill")
                        .symbolVariableValue(Double(healthManager.currentHeartRate) / 180.0)
                        .symbolAnimation(.draw.repeating.speed(Double(healthManager.currentHeartRate) / 60.0))
                        .foregroundStyle(.red.gradient(.radial))
                        .font(.title3)

                    Text("\(Int(healthManager.currentHeartRate))")
                        .font(.title3.monospacedDigit().weight(.semibold))
                        .contentTransition(.numericText(value: Double(healthManager.currentHeartRate)))
                }

                // Enhanced activity rings
                iOS26ActivityRing(progress: 0.7, color: .red)
                    .frame(width: 60, height: 60)
            } else {
                // Fallback for older watchOS
                VStack {
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("\(Int(healthManager.currentHeartRate))")
                            .font(.title3.weight(.semibold))
                    }

                    Circle()
                        .stroke(.red, lineWidth: 4)
                        .frame(width: 60, height: 60)
                }
            }
        }
    }
}

// MARK: - Integration Configuration
struct iOS26IntegrationConfig {

    /// Enable iOS 26 features globally
    static var enableiOS26Features: Bool = true

    /// Feature flags for granular control
    struct FeatureFlags {
        static var liquidGlass: Bool = true
        static var variableDraw: Bool = true
        static var magicReplace: Bool = true
        static var autoGradients: Bool = true
        static var enhancedAnimations: Bool = true
    }

    /// Migration settings
    struct Migration {
        static var gradualRollout: Bool = true
        static var fallbackEnabled: Bool = true
        static var performanceOptimization: Bool = true
    }
}

// MARK: - Helper Extensions

extension HealthData {
    static func sampleiOS26Data() -> HealthData {
        HealthData(
            heartRate: 72,
            steps: 8542,
            temperature: 98.6,
            bloodPressure: (systolic: 120, diastolic: 80),
            oxygenSaturation: 98
        )
    }
}

// MARK: - Integration Test Views
#if DEBUG
struct iOS26IntegrationPreview: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Test iOS 26 Enhanced Metric Cards
                    Text("iOS 26 Enhanced Components")
                        .font(.title.weight(.bold))

                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        VitalSenseHealthMetricCard(
                            metric: HealthMetric(
                                title: "Heart Rate",
                                type: .heartRate,
                                sfSymbol: "heart.fill",
                                primaryColor: .red,
                                secondaryColor: .pink,
                                maxValue: 180
                            ),
                            value: 72,
                            unit: "BPM",
                            trend: .stable
                        )

                        VitalSenseHealthMetricCard(
                            metric: HealthMetric(
                                title: "Steps",
                                type: .steps,
                                sfSymbol: "figure.walk",
                                primaryColor: .blue,
                                secondaryColor: .cyan,
                                maxValue: 20000
                            ),
                            value: 8542,
                            unit: "steps",
                            trend: .up
                        )
                    }

                    // Test iOS 26 Heart Rate Monitor
                    if #available(iOS 26.0, *) {
                        iOS26HeartRateMonitor(heartRate: .constant(72))
                    }

                    // Test iOS 26 Dashboard Hero
                    if #available(iOS 26.0, *) {
                        iOS26HealthDashboardHero(
                            overallScore: 85,
                            status: .excellent
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("iOS 26 Integration Test")
        }
    }
}

#Preview {
    iOS26IntegrationPreview()
}
#endif
