//
//  VitalSenseHealthWidgets.swift
//  VitalSenseWidgets
//
//  Comprehensive iOS Home Screen Widgets for health monitoring
//  Created: 2024-12-19
//

import WidgetKit
import SwiftUI
import HealthKit
import Intents
import OSLog

// MARK: - Main Widget Bundle (removed @main to avoid conflicts)
// Note: Widget bundle is now defined in VitalSenseWidgetsBundle.swift

// MARK: - Main Health Widget

struct VitalSenseHealthWidget: Widget {
    let kind: String = "VitalSenseHealthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HealthTimelineProvider()) { entry in
            VitalSenseHealthWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("VitalSense Health")
        .description("Monitor your key health metrics at a glance")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Heart Rate Widget

struct VitalSenseHeartRateWidget: Widget {
    let kind: String = "VitalSenseHeartRateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HeartRateTimelineProvider()) { entry in
            HeartRateWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Heart Rate Monitor")
        .description("Real-time heart rate monitoring")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }
}

// MARK: - Activity Widget

struct VitalSenseActivityWidget: Widget {
    let kind: String = "VitalSenseActivityWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ActivityTimelineProvider()) { entry in
            ActivityWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Activity")
        .description("Track your daily activity progress")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular])
    }
}

// MARK: - Gait Analysis Widget

struct VitalSenseGaitWidget: Widget {
    let kind: String = "VitalSenseGaitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GaitTimelineProvider()) { entry in
            GaitWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Gait Analysis")
        .description("Monitor walking patterns and fall risk")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Timeline Providers

struct HealthTimelineProvider: TimelineProvider {
    typealias Entry = HealthEntry

    private let logger = Logger(subsystem: "com.vitalsense.widgets", category: "HealthTimeline")

    func placeholder(in context: Context) -> HealthEntry {
        HealthEntry(
            date: Date(),
            heartRate: 72,
            steps: 8500,
            activeEnergy: 420,
            gaitScore: 0.85,
            fallRisk: 0.15,
            isDataAvailable: false
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HealthEntry) -> Void) {
        let entry = HealthEntry(
            date: Date(),
            heartRate: 75,
            steps: 9200,
            activeEnergy: 485,
            gaitScore: 0.88,
            fallRisk: 0.12,
            isDataAvailable: true
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HealthEntry>) -> Void) {
        Task {
            do {
                let healthData = try await fetchHealthData()
                let entry = HealthEntry(
                    date: Date(),
                    heartRate: healthData.heartRate,
                    steps: healthData.steps,
                    activeEnergy: healthData.activeEnergy,
                    gaitScore: healthData.gaitScore,
                    fallRisk: healthData.fallRisk,
                    isDataAvailable: true
                )

                // Update every 15 minutes
                let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
                let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

                completion(timeline)
            } catch {
                logger.error("Failed to fetch health data: \(error.localizedDescription)")

                let placeholderEntry = placeholder(in: context)
                let timeline = Timeline(entries: [placeholderEntry], policy: .never)
                completion(timeline)
            }
        }
    }

    private func fetchHealthData() async throws -> WidgetHealthData {
        // In a real implementation, this would fetch from HealthKit
        // For now, return mock data
        return WidgetHealthData(
            heartRate: 74,
            steps: 8750,
            activeEnergy: 445,
            gaitScore: 0.87,
            fallRisk: 0.13
        )
    }
}

struct HeartRateTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> HeartRateEntry {
        HeartRateEntry(date: Date(), heartRate: 72, trend: .stable, zone: .resting)
    }

    func getSnapshot(in context: Context, completion: @escaping (HeartRateEntry) -> Void) {
        let entry = HeartRateEntry(date: Date(), heartRate: 78, trend: .increasing, zone: .fatBurn)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HeartRateEntry>) -> Void) {
        Task {
            let heartRate = await fetchCurrentHeartRate()
            let entry = HeartRateEntry(
                date: Date(),
                heartRate: heartRate.value,
                trend: heartRate.trend,
                zone: heartRate.zone
            )

            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

            completion(timeline)
        }
    }

    private func fetchCurrentHeartRate() async -> (value: Int, trend: HeartRateTrend, zone: HeartRateZone) {
        // Mock implementation
        return (76, .stable, .fatBurn)
    }
}

struct ActivityTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> ActivityEntry {
        ActivityEntry(
            date: Date(),
            moveProgress: 0.75,
            exerciseProgress: 0.60,
            standProgress: 0.90,
            steps: 8500,
            activeEnergy: 420
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ActivityEntry) -> Void) {
        let entry = ActivityEntry(
            date: Date(),
            moveProgress: 0.82,
            exerciseProgress: 0.55,
            standProgress: 0.95,
            steps: 9200,
            activeEnergy: 485
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ActivityEntry>) -> Void) {
        Task {
            let activityData = await fetchActivityData()
            let entry = ActivityEntry(
                date: Date(),
                moveProgress: activityData.moveProgress,
                exerciseProgress: activityData.exerciseProgress,
                standProgress: activityData.standProgress,
                steps: activityData.steps,
                activeEnergy: activityData.activeEnergy
            )

            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

            completion(timeline)
        }
    }

    private func fetchActivityData() async -> ActivityData {
        // Mock implementation
        return ActivityData(
            moveProgress: 0.78,
            exerciseProgress: 0.62,
            standProgress: 0.88,
            steps: 8900,
            activeEnergy: 460
        )
    }
}

struct GaitTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GaitEntry {
        GaitEntry(
            date: Date(),
            gaitScore: 0.85,
            fallRisk: 0.15,
            walkingSpeed: 1.2,
            asymmetry: 0.08,
            recentAnalysis: []
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (GaitEntry) -> Void) {
        let entry = GaitEntry(
            date: Date(),
            gaitScore: 0.88,
            fallRisk: 0.12,
            walkingSpeed: 1.35,
            asymmetry: 0.06,
            recentAnalysis: [
                GaitAnalysisPoint(date: Date().addingTimeInterval(-3600), score: 0.86),
                GaitAnalysisPoint(date: Date().addingTimeInterval(-7200), score: 0.84)
            ]
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GaitEntry>) -> Void) {
        Task {
            let gaitData = await fetchGaitData()
            let entry = GaitEntry(
                date: Date(),
                gaitScore: gaitData.score,
                fallRisk: gaitData.fallRisk,
                walkingSpeed: gaitData.walkingSpeed,
                asymmetry: gaitData.asymmetry,
                recentAnalysis: gaitData.recentAnalysis
            )

            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

            completion(timeline)
        }
    }

    private func fetchGaitData() async -> GaitWidgetData {
        // Mock implementation
        return GaitWidgetData(
            score: 0.87,
            fallRisk: 0.13,
            walkingSpeed: 1.28,
            asymmetry: 0.07,
            recentAnalysis: [
                GaitAnalysisPoint(date: Date().addingTimeInterval(-1800), score: 0.89),
                GaitAnalysisPoint(date: Date().addingTimeInterval(-3600), score: 0.85)
            ]
        )
    }
}

// MARK: - Widget Entry Views

struct VitalSenseHealthWidgetEntryView: View {
    var entry: HealthEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallHealthWidgetView(entry: entry)
        case .systemMedium:
            MediumHealthWidgetView(entry: entry)
        case .systemLarge:
            LargeHealthWidgetView(entry: entry)
        default:
            SmallHealthWidgetView(entry: entry)
        }
    }
}

struct SmallHealthWidgetView: View {
    let entry: HealthEntry

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                    .font(.caption)

                Spacer()

                Text("VitalSense")
                    .font(.caption2.bold())
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 2) {
                Text("\(entry.heartRate)")
                    .font(.title.bold())
                    .foregroundStyle(.primary)

                Text("BPM")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            HStack(spacing: 8) {
                VStack {
                    Text("\(entry.steps)")
                        .font(.caption.bold())
                    Text("Steps")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack {
                    Text("\(Int(entry.activeEnergy))")
                        .font(.caption.bold())
                    Text("Cal")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .widgetBackground()
    }
}

struct MediumHealthWidgetView: View {
    let entry: HealthEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)
                    Text("VitalSense")
                        .font(.headline.bold())
                    Spacer()
                }

                HStack(spacing: 16) {
                    MetricCard(
                        title: "Heart Rate",
                        value: "\(entry.heartRate)",
                        unit: "BPM",
                        color: .red,
                        icon: "heart.fill"
                    )

                    MetricCard(
                        title: "Steps",
                        value: "\(entry.steps)",
                        unit: "steps",
                        color: .blue,
                        icon: "figure.walk"
                    )
                }

                HStack {
                    Text("Fall Risk: \(Int(entry.fallRisk * 100))%")
                        .font(.caption)
                        .foregroundStyle(entry.fallRisk > 0.3 ? .orange : .green)

                    Spacer()

                    Text("Gait: \(Int(entry.gaitScore * 100))%")
                        .font(.caption)
                        .foregroundStyle(.blue)
                }
            }
        }
        .padding()
        .widgetBackground()
    }
}

struct LargeHealthWidgetView: View {
    let entry: HealthEntry

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                Text("VitalSense Health Dashboard")
                    .font(.headline.bold())
                Spacer()
                Text("\(entry.date, formatter: timeFormatter)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 12) {
                MetricCard(
                    title: "Heart Rate",
                    value: "\(entry.heartRate)",
                    unit: "BPM",
                    color: .red,
                    icon: "heart.fill"
                )

                MetricCard(
                    title: "Steps",
                    value: "\(entry.steps)",
                    unit: "today",
                    color: .blue,
                    icon: "figure.walk"
                )

                MetricCard(
                    title: "Active Energy",
                    value: "\(Int(entry.activeEnergy))",
                    unit: "cal",
                    color: .orange,
                    icon: "flame.fill"
                )
            }

            HStack(spacing: 12) {
                GaitScoreCard(
                    title: "Gait Quality",
                    score: entry.gaitScore,
                    color: .green,
                    icon: "figure.walk.motion"
                )

                GaitScoreCard(
                    title: "Fall Risk",
                    score: entry.fallRisk,
                    color: entry.fallRisk > 0.3 ? .red : .green,
                    icon: "exclamationmark.triangle.fill"
                )
            }

            HStack {
                Text(entry.isDataAvailable ? "Data current as of \(entry.date, formatter: timeFormatter)" : "Tap to update health data")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding()
        .widgetBackground()
    }

    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }
}

struct HeartRateWidgetEntryView: View {
    var entry: HeartRateEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallHeartRateWidget(entry: entry)
        case .systemMedium:
            MediumHeartRateWidget(entry: entry)
        case .accessoryCircular:
            AccessoryHeartRateWidget(entry: entry)
        case .accessoryRectangular:
            RectangularHeartRateWidget(entry: entry)
        default:
            SmallHeartRateWidget(entry: entry)
        }
    }
}

struct SmallHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                    .symbolEffect(.bounce, value: entry.heartRate)

                Spacer()

                Image(systemName: trendIcon)
                    .foregroundStyle(trendColor)
                    .font(.caption)
            }

            Text("\(entry.heartRate)")
                .font(.title.bold())
                .foregroundStyle(.primary)

            Text("BPM")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(entry.zone.displayName)
                .font(.caption2.bold())
                .foregroundStyle(entry.zone.color)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(entry.zone.color.opacity(0.2))
                .clipShape(Capsule())
        }
        .padding()
        .widgetBackground()
    }

    private var trendIcon: String {
        switch entry.trend {
        case .increasing: return "arrow.up.right"
        case .decreasing: return "arrow.down.right"
        case .stable: return "minus"
        }
    }

    private var trendColor: Color {
        switch entry.trend {
        case .increasing: return .orange
        case .decreasing: return .blue
        case .stable: return .green
        }
    }
}

struct MediumHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.red)
                    .symbolEffect(.bounce, value: entry.heartRate)

                Text("\(entry.heartRate)")
                    .font(.title.bold())

                Text("BPM")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Heart Rate")
                        .font(.headline.bold())
                    Spacer()
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Zone:")
                        Spacer()
                        Text(entry.zone.displayName)
                            .font(.caption.bold())
                            .foregroundStyle(entry.zone.color)
                    }
                    .font(.caption)

                    HStack {
                        Text("Trend:")
                        Spacer()
                        HStack(spacing: 4) {
                            Image(systemName: trendIcon)
                            Text(entry.trend.displayName)
                        }
                        .font(.caption.bold())
                        .foregroundStyle(trendColor)
                    }
                    .font(.caption)
                }

                Spacer()
            }
        }
        .padding()
        .widgetBackground()
    }

    private var trendIcon: String {
        switch entry.trend {
        case .increasing: return "arrow.up.right"
        case .decreasing: return "arrow.down.right"
        case .stable: return "minus"
        }
    }

    private var trendColor: Color {
        switch entry.trend {
        case .increasing: return .orange
        case .decreasing: return .blue
        case .stable: return .green
        }
    }
}

struct AccessoryHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        ZStack {
            Circle()
                .fill(.red.opacity(0.3))

            VStack(spacing: 0) {
                Image(systemName: "heart.fill")
                    .foregroundStyle(.red)
                    .font(.caption)

                Text("\(entry.heartRate)")
                    .font(.caption2.bold())
            }
        }
        .widgetBackground()
    }
}

struct RectangularHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "heart.fill")
                .foregroundStyle(.red)
                .font(.caption)

            Text("\(entry.heartRate) BPM")
                .font(.caption.bold())

            Spacer()

            Text(entry.zone.shortName)
                .font(.caption2)
                .foregroundStyle(entry.zone.color)
        }
        .widgetBackground()
    }
}

// MARK: - Supporting Views

struct MetricCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.caption)

            Text(value)
                .font(.title3.bold())

            Text(unit)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(8)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct GaitScoreCard: View {
    let title: String
    let score: Double
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.caption)

            Text("\(Int(score * 100))%")
                .font(.title3.bold())
                .foregroundStyle(color)

            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(8)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Widget Background Extension

extension View {
    func widgetBackground() -> some View {
        if #available(iOS 17.0, *) {
            return self.containerBackground(.fill.tertiary, for: .widget)
        } else {
            return self.background(.regularMaterial)
        }
    }
}

// MARK: - Data Types

enum ConnectionStatus {
    case connected, disconnected, unknown, noHealthData, stale

    var color: Color {
        switch self {
        case .connected: return .green
        case .disconnected, .stale: return .red
        case .unknown, .noHealthData: return .gray
        }
    }

    var text: String {
        switch self {
        case .connected: return "Connected"
        case .disconnected: return "Offline"
        case .stale: return "Stale Data"
        case .noHealthData: return "No Data"
        case .unknown: return "Unknown"
        }
    }
}

enum HealthTrend {
    case improving, stable, declining, increasing, decreasing

    var color: Color {
        switch self {
        case .improving, .increasing: return .green
        case .stable: return .blue
        case .declining, .decreasing: return .red
        }
    }

    var text: String {
        switch self {
        case .improving, .increasing: return "↗️ Improving"
        case .stable: return "→ Stable"
        case .declining, .decreasing: return "↘️ Declining"
        }
    }
}

struct HealthEntry: TimelineEntry {
    let date: Date
    let heartRate: Int
    let steps: Int
    let activeEnergy: Double
    let gaitScore: Double
    let fallRisk: Double
    let isDataAvailable: Bool
    let connectionStatus: ConnectionStatus
}

struct HeartRateEntry: TimelineEntry {
    let date: Date
    let heartRate: Int
    let trend: HeartRateTrend
    let zone: HeartRateZone
}

struct ActivityEntry: TimelineEntry {
    let date: Date
    let moveProgress: Double
    let exerciseProgress: Double
    let standProgress: Double
    let steps: Int
    let activeEnergy: Double
}

struct GaitEntry: TimelineEntry {
    let date: Date
    let gaitScore: Double
    let fallRisk: Double
    let walkingSpeed: Double
    let asymmetry: Double
    let recentAnalysis: [GaitAnalysisPoint]
}

// MARK: - Supporting Types

enum HeartRateTrend: CaseIterable {
    case increasing, decreasing, stable

    var displayName: String {
        switch self {
        case .increasing: return "Rising"
        case .decreasing: return "Falling"
        case .stable: return "Stable"
        }
    }
}

enum HeartRateZone: CaseIterable {
    case resting, fatBurn, cardio, peak

    var displayName: String {
        switch self {
        case .resting: return "Resting"
        case .fatBurn: return "Fat Burn"
        case .cardio: return "Cardio"
        case .peak: return "Peak"
        }
    }

    var shortName: String {
        switch self {
        case .resting: return "Rest"
        case .fatBurn: return "Fat"
        case .cardio: return "Cardio"
        case .peak: return "Peak"
        }
    }

    var color: Color {
        switch self {
        case .resting: return .blue
        case .fatBurn: return .green
        case .cardio: return .orange
        case .peak: return .red
        }
    }
}

struct WidgetHealthData {
    let heartRate: Int
    let steps: Int
    let activeEnergy: Double
    let gaitScore: Double
    let fallRisk: Double
}

struct ActivityData {
    let moveProgress: Double
    let exerciseProgress: Double
    let standProgress: Double
    let steps: Int
    let activeEnergy: Double
}

struct GaitWidgetData {
    let score: Double
    let fallRisk: Double
    let walkingSpeed: Double
    let asymmetry: Double
    let recentAnalysis: [GaitAnalysisPoint]
}

struct GaitAnalysisPoint: Identifiable {
    let id = UUID()
    let date: Date
    let score: Double
}
