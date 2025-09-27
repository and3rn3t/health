import WidgetKit
import SwiftUI

// MARK: - Heart Rate Widget
struct VitalSenseHeartRateWidget: Widget {
    let kind: String = "VitalSenseHeartRateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HeartRateProvider()) { entry in
            HeartRateWidgetView(entry: entry)
        }
        .configurationDisplayName("Heart Rate Monitor")
        .description("Real-time heart rate monitoring from Apple Watch.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
    }
}

// MARK: - Heart Rate Timeline Provider
struct HeartRateProvider: TimelineProvider {
    func placeholder(in context: Context) -> HeartRateEntry {
        HeartRateEntry(date: Date(), heartRate: 72, trend: .stable, zone: .normal)
    }

    func getSnapshot(in context: Context, completion: @escaping (HeartRateEntry) -> ()) {
        let entry = HeartRateEntry(date: Date(), heartRate: 75, trend: .increasing, zone: .normal)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        WidgetHealthManager.shared.fetchHeartRateData { heartRate in
            let zone = HeartRateZone.from(heartRate: heartRate ?? 0)
            let entry = HeartRateEntry(
                date: Date(),
                heartRate: heartRate,
                trend: .stable, // TODO: Calculate actual trend
                zone: zone
            )

            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 5, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}

struct HeartRateEntry: TimelineEntry {
    let date: Date
    let heartRate: Double?
    let trend: HeartRateTrend
    let zone: HeartRateZone
}

enum HeartRateTrend {
    case increasing, stable, decreasing

    var icon: String {
        switch self {
        case .increasing: return "arrow.up"
        case .stable: return "minus"
        case .decreasing: return "arrow.down"
        }
    }

    var color: Color {
        switch self {
        case .increasing: return .orange
        case .stable: return .green
        case .decreasing: return .blue
        }
    }
}

enum HeartRateZone {
    case resting, fatBurn, cardio, peak, unknown

    static func from(heartRate: Double) -> HeartRateZone {
        switch heartRate {
        case 0..<60: return .resting
        case 60..<120: return .fatBurn
        case 120..<150: return .cardio
        case 150...: return .peak
        default: return .unknown
        }
    }

    var color: Color {
        switch self {
        case .resting: return .blue
        case .fatBurn: return .green
        case .cardio: return .orange
        case .peak: return .red
        case .unknown: return .gray
        }
    }

    var name: String {
        switch self {
        case .resting: return "Resting"
        case .fatBurn: return "Fat Burn"
        case .cardio: return "Cardio"
        case .peak: return "Peak"
        case .unknown: return "Unknown"
        }
    }
}

struct HeartRateWidgetView: View {
    var entry: HeartRateProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallHeartRateWidget(entry: entry)
        case .accessoryCircular:
            CircularHeartRateWidget(entry: entry)
        case .accessoryInline:
            InlineHeartRateWidget(entry: entry)
        default:
            SmallHeartRateWidget(entry: entry)
        }
    }
}

struct SmallHeartRateWidget: View {
    let entry: HeartRateEntry
    @State private var isAnimating = false

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .font(.title3)
                    .scaleEffect(isAnimating ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true), value: isAnimating)

                Text("Heart Rate")
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer()
            }

            // Heart Rate Value
            VStack(spacing: 4) {
                if let heartRate = entry.heartRate {
                    Text("\(Int(heartRate))")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(entry.zone.color)

                    Text("bpm")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("--")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)

                    Text("No data")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Zone and Trend
            HStack {
                // Heart Rate Zone
                Text(entry.zone.name)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(entry.zone.color)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(entry.zone.color.opacity(0.2))
                    .clipShape(Capsule())

                Spacer()

                // Trend
                HStack(spacing: 2) {
                    Image(systemName: entry.trend.icon)
                        .font(.caption2)
                        .foregroundColor(entry.trend.color)

                    Text("Trend")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [entry.zone.color.opacity(0.15), entry.zone.color.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
        .onAppear {
            if entry.heartRate != nil {
                isAnimating = true
            }
        }
    }
}

struct CircularHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(entry.zone.color.opacity(0.3), lineWidth: 4)

            // Progress circle (based on zone)
            Circle()
                .trim(from: 0, to: progressForZone(entry.zone))
                .stroke(entry.zone.color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))

            // Heart rate value
            VStack(spacing: 1) {
                if let heartRate = entry.heartRate {
                    Text("\(Int(heartRate))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(entry.zone.color)
                } else {
                    Image(systemName: "heart.fill")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
    }

    private func progressForZone(_ zone: HeartRateZone) -> Double {
        switch zone {
        case .resting: return 0.25
        case .fatBurn: return 0.5
        case .cardio: return 0.75
        case .peak: return 1.0
        case .unknown: return 0.1
        }
    }
}

struct InlineHeartRateWidget: View {
    let entry: HeartRateEntry

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "heart.fill")
                .foregroundColor(.red)
                .font(.caption2)

            if let heartRate = entry.heartRate {
                Text("\(Int(heartRate)) bpm")
                    .font(.caption)
                    .fontWeight(.medium)

                Image(systemName: entry.trend.icon)
                    .font(.caption2)
                    .foregroundColor(entry.trend.color)
            } else {
                Text("No heart rate data")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Activity Widget
struct VitalSenseActivityWidget: Widget {
    let kind: String = "VitalSenseActivityWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ActivityProvider()) { entry in
            ActivityWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Activity")
        .description("Track your daily steps, active energy, and movement goals.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

struct ActivityProvider: TimelineProvider {
    func placeholder(in context: Context) -> ActivityEntry {
        ActivityEntry(
            date: Date(),
            steps: 8432,
            activeEnergy: 245,
            exerciseMinutes: 32,
            standHours: 8,
            stepsGoal: 10000,
            energyGoal: 400
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ActivityEntry) -> ()) {
        let entry = ActivityEntry(
            date: Date(),
            steps: 6789,
            activeEnergy: 189,
            exerciseMinutes: 15,
            standHours: 6,
            stepsGoal: 10000,
            energyGoal: 400
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        WidgetHealthManager.shared.fetchActivityData { steps, energy, exercise, stand in
            let entry = ActivityEntry(
                date: Date(),
                steps: steps,
                activeEnergy: energy,
                exerciseMinutes: exercise,
                standHours: stand,
                stepsGoal: 10000,
                energyGoal: 400
            )

            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}

struct ActivityEntry: TimelineEntry {
    let date: Date
    let steps: Double?
    let activeEnergy: Double?
    let exerciseMinutes: Double?
    let standHours: Double?
    let stepsGoal: Double
    let energyGoal: Double
}

struct ActivityWidgetView: View {
    var entry: ActivityProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallActivityWidget(entry: entry)
        case .systemMedium:
            MediumActivityWidget(entry: entry)
        case .accessoryRectangular:
            RectangularActivityWidget(entry: entry)
        default:
            SmallActivityWidget(entry: entry)
        }
    }
}

struct SmallActivityWidget: View {
    let entry: ActivityEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                    .font(.title3)

                Text("Activity")
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer()
            }

            // Activity Rings
            ZStack {
                // Steps ring (outer)
                Circle()
                    .stroke(.blue.opacity(0.3), lineWidth: 8)
                    .frame(width: 60, height: 60)

                Circle()
                    .trim(from: 0, to: min((entry.steps ?? 0) / entry.stepsGoal, 1.0))
                    .stroke(.blue, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 60, height: 60)
                    .rotationEffect(.degrees(-90))

                // Energy ring (inner)
                Circle()
                    .stroke(.orange.opacity(0.3), lineWidth: 6)
                    .frame(width: 40, height: 40)

                Circle()
                    .trim(from: 0, to: min((entry.activeEnergy ?? 0) / entry.energyGoal, 1.0))
                    .stroke(.orange, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .frame(width: 40, height: 40)
                    .rotationEffect(.degrees(-90))

                // Center text
                VStack(spacing: 1) {
                    if let steps = entry.steps {
                        Text("\(Int(steps))")
                            .font(.caption2)
                            .fontWeight(.bold)
                    } else {
                        Text("--")
                            .font(.caption2)
                            .fontWeight(.bold)
                    }
                }
            }

            // Progress text
            VStack(spacing: 2) {
                if let steps = entry.steps {
                    let progress = Int((steps / entry.stepsGoal) * 100)
                    Text("\(progress)% of goal")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                } else {
                    Text("No step data")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.orange.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

struct MediumActivityWidget: View {
    let entry: ActivityEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Text("Daily Activity")
                    .font(.headline)
                    .fontWeight(.bold)

                Spacer()

                Text(entry.date, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Activity metrics
            HStack(spacing: 16) {
                // Steps
                ActivityMetric(
                    title: "Steps",
                    value: entry.steps.map { "\(Int($0))" } ?? "--",
                    goal: "\(Int(entry.stepsGoal))",
                    progress: (entry.steps ?? 0) / entry.stepsGoal,
                    icon: "figure.walk",
                    color: .blue
                )

                // Active Energy
                ActivityMetric(
                    title: "Energy",
                    value: entry.activeEnergy.map { "\(Int($0))" } ?? "--",
                    goal: "\(Int(entry.energyGoal))",
                    progress: (entry.activeEnergy ?? 0) / entry.energyGoal,
                    icon: "flame.fill",
                    color: .orange
                )

                // Exercise
                ActivityMetric(
                    title: "Exercise",
                    value: entry.exerciseMinutes.map { "\(Int($0))" } ?? "--",
                    goal: "30",
                    progress: (entry.exerciseMinutes ?? 0) / 30,
                    icon: "bolt.fill",
                    color: .green
                )
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.blue.opacity(0.08), Color.orange.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

struct RectangularActivityWidget: View {
    let entry: ActivityEntry

    var body: some View {
        HStack(spacing: 12) {
            // Steps
            HStack(spacing: 4) {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                    .font(.caption2)

                if let steps = entry.steps {
                    Text("\(Int(steps))")
                        .font(.caption)
                        .fontWeight(.medium)
                } else {
                    Text("--")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Energy
            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                    .font(.caption2)

                if let energy = entry.activeEnergy {
                    Text("\(Int(energy))")
                        .font(.caption)
                        .fontWeight(.medium)
                } else {
                    Text("--")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Progress indicator
            if let steps = entry.steps {
                let progress = steps / entry.stepsGoal
                Circle()
                    .fill(progress >= 1.0 ? .green : .blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }
}

struct ActivityMetric: View {
    let title: String
    let value: String
    let goal: String
    let progress: Double
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            // Icon and progress
            ZStack {
                Circle()
                    .stroke(color.opacity(0.3), lineWidth: 4)
                    .frame(width: 32, height: 32)

                Circle()
                    .trim(from: 0, to: min(progress, 1.0))
                    .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 32, height: 32)
                    .rotationEffect(.degrees(-90))

                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.caption)
            }

            // Values
            VStack(spacing: 2) {
                Text(value)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Text("/ \(goal)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Steps Widget
struct VitalSenseStepsWidget: Widget {
    let kind: String = "VitalSenseStepsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StepsProvider()) { entry in
            StepsWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Steps")
        .description("Track your daily step count and walking progress.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
    }
}

struct StepsProvider: TimelineProvider {
    func placeholder(in context: Context) -> StepsEntry {
        StepsEntry(date: Date(), steps: 8432, goal: 10000, hourlySteps: Array(repeating: 500, count: 12))
    }

    func getSnapshot(in context: Context, completion: @escaping (StepsEntry) -> ()) {
        let entry = StepsEntry(date: Date(), steps: 6789, goal: 10000, hourlySteps: Array(repeating: 400, count: 12))
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        WidgetHealthManager.shared.fetchStepsData { steps, hourlySteps in
            let entry = StepsEntry(
                date: Date(),
                steps: steps,
                goal: 10000,
                hourlySteps: hourlySteps ?? []
            )

            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}

struct StepsEntry: TimelineEntry {
    let date: Date
    let steps: Double?
    let goal: Double
    let hourlySteps: [Double]
}

struct StepsWidgetView: View {
    var entry: StepsProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallStepsWidget(entry: entry)
        case .accessoryCircular:
            CircularStepsWidget(entry: entry)
        case .accessoryInline:
            InlineStepsWidget(entry: entry)
        default:
            SmallStepsWidget(entry: entry)
        }
    }
}

struct SmallStepsWidget: View {
    let entry: StepsEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                    .font(.title3)

                Text("Steps")
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer()
            }

            // Steps count
            VStack(spacing: 4) {
                if let steps = entry.steps {
                    Text("\(Int(steps))")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)

                    let progress = Int((steps / entry.goal) * 100)
                    Text("\(progress)% of \(Int(entry.goal))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("--")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)

                    Text("No step data")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Progress bar
            if let steps = entry.steps {
                ProgressView(value: steps, total: entry.goal)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    .frame(height: 6)
                    .clipShape(Capsule())
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.blue.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

struct CircularStepsWidget: View {
    let entry: StepsEntry

    var body: some View {
        ZStack {
            Circle()
                .stroke(.blue.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: min((entry.steps ?? 0) / entry.goal, 1.0))
                .stroke(.blue, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))

            VStack(spacing: 1) {
                if let steps = entry.steps {
                    Text("\(Int(steps / 1000))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)

                    Text("k")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                } else {
                    Image(systemName: "figure.walk")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
        }
    }
}

struct InlineStepsWidget: View {
    let entry: StepsEntry

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "figure.walk")
                .foregroundColor(.blue)
                .font(.caption2)

            if let steps = entry.steps {
                let progress = Int((steps / entry.goal) * 100)
                Text("\(Int(steps)) steps (\(progress)%)")
                    .font(.caption)
                    .fontWeight(.medium)
            } else {
                Text("No step data")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
