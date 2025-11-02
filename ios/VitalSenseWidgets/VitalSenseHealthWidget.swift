import WidgetKit
import SwiftUI
import HealthKit

// MARK: - VitalSense Widget Bundle (removed @main to avoid conflicts)
// Note: Widget bundle is now defined in VitalSenseWidgetsBundle.swift

// MARK: - Health Data Timeline Entry
// Note: HealthEntry is now defined in VitalSenseHealthWidgets.swift to avoid duplication

// MARK: - Widget Timeline Provider
struct HealthProvider: TimelineProvider {
    typealias Entry = HealthEntry

    func placeholder(in context: Context) -> HealthEntry {
        HealthEntry(
            date: Date(),
            heartRate: 72,
            steps: 8432,
            activeEnergy: 245.0,
            gaitScore: 85.0,
            fallRisk: 15.0,
            isDataAvailable: true,
            connectionStatus: .connected
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HealthEntry) -> ()) {
        let entry = HealthEntry(
            date: Date(),
            heartRate: 75,
            steps: 6789,
            activeEnergy: 189.0,
            gaitScore: 82.0,
            fallRisk: 18.0,
            isDataAvailable: true,
            connectionStatus: .connected
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HealthEntry>) -> ()) {
        let healthManager = WidgetHealthManager.shared

        healthManager.fetchAllHealthData { entry in
            // Use the entry from WidgetHealthManager

            // Update every 15 minutes
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
}

// MARK: - Main VitalSense Health Widget (Duplicate Removed)
// Note: VitalSenseHealthWidget is now defined in VitalSenseHealthWidgets.swift to avoid conflicts

// MARK: - iOS 26 Enhanced Health Widget Views
struct VitalSenseHealthWidgetView: View {
    var entry: HealthProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        if #available(iOS 26.0, *) {
            // Use iOS 26 enhanced widget views
            switch family {
            case .systemSmall:
                iOS26SmallHealthWidget(entry: entry)
            case .systemMedium:
                iOS26MediumHealthWidget(entry: entry)
            case .systemLarge:
                iOS26LargeHealthWidget(entry: entry)
            case .accessoryCircular:
                iOS26CircularHealthWidget(entry: entry)
            case .accessoryRectangular:
                iOS26RectangularHealthWidget(entry: entry)
            default:
                iOS26SmallHealthWidget(entry: entry)
            }
        } else {
            // Fallback to existing widget views
            switch family {
            case .systemSmall:
                SmallHealthWidget(entry: entry)
            case .systemMedium:
                MediumHealthWidget(entry: entry)
            case .systemLarge:
                LargeHealthWidget(entry: entry)
            case .accessoryCircular:
                CircularHealthWidget(entry: entry)
            case .accessoryRectangular:
                RectangularHealthWidget(entry: entry)
            default:
                SmallHealthWidget(entry: entry)
            }
        }
    }
}

// MARK: - Small Widget (Heart Rate Focus)
struct SmallHealthWidget: View {
    let entry: HealthEntry

    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .font(.caption)

                Text("VitalSense")
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)

                Spacer()

                Circle()
                    .fill(entry.connectionStatus.color)
                    .frame(width: 6, height: 6)
            }

            Spacer()

            // Heart Rate
            VStack(spacing: 4) {
                if let heartRate = entry.heartRate {
                    Text("\(Int(heartRate))")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.red)

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

            Spacer()

            // Last updated
            Text("Updated \(entry.date, style: .relative)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.red.opacity(0.1), Color.red.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Medium Widget (Multiple Metrics)
struct MediumHealthWidget: View {
    let entry: HealthEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.subheadline)

                    Text("VitalSense Live")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                Spacer()

                HStack(spacing: 4) {
                    Circle()
                        .fill(entry.connectionStatus.color)
                        .frame(width: 6, height: 6)

                    Text(entry.connectionStatus.text)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            // Metrics Grid
            HStack(spacing: 16) {
                // Heart Rate
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                            .font(.caption)

                        Text("Heart Rate")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    if let heartRate = entry.heartRate {
                        Text("\(Int(heartRate))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.red)

                        Text("bpm")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)

                Divider()

                // Steps
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.blue)
                            .font(.caption)

                        Text("Steps")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    if let steps = entry.steps {
                        Text("\(Int(steps))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)

                        Text("today")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)

                Divider()

                // Energy
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                            .font(.caption)

                        Text("Energy")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    if let energy = entry.activeEnergy {
                        Text("\(Int(energy))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)

                        Text("kcal")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Large Widget (Comprehensive Dashboard)
struct LargeHealthWidget: View {
    let entry: HealthEntry

    var body: some View {
        VStack(spacing: 16) {
            // Header with Connection Status
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("VitalSense Health Dashboard")
                            .font(.headline)
                            .fontWeight(.bold)

                        Text("Real-time monitoring")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(entry.connectionStatus.color)
                            .frame(width: 8, height: 8)

                        Text(entry.connectionStatus.text)
                            .font(.caption)
                            .fontWeight(.medium)
                    }

                    Text("Updated \(entry.date, style: .relative)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            // Main Metrics Row
            HStack(spacing: 12) {
                // Heart Rate Card
                WidgetMetricCard(
                    title: "Heart Rate",
                    value: entry.heartRate.map { "\(Int($0))" } ?? "--",
                    unit: "bpm",
                    icon: "heart.fill",
                    color: .red,
                    hasData: entry.heartRate != nil
                )

                // Steps Card
                WidgetMetricCard(
                    title: "Daily Steps",
                    value: entry.steps.map { "\(Int($0))" } ?? "--",
                    unit: "steps",
                    icon: "figure.walk",
                    color: .blue,
                    hasData: entry.steps != nil
                )
            }

            // Secondary Metrics Row
            HStack(spacing: 12) {
                // Active Energy Card
                WidgetMetricCard(
                    title: "Active Energy",
                    value: entry.activeEnergy.map { "\(Int($0))" } ?? "--",
                    unit: "kcal",
                    icon: "flame.fill",
                    color: .orange,
                    hasData: entry.activeEnergy != nil
                )

                // Walking Steadiness Card
                WidgetMetricCard(
                    title: "Steadiness",
                    value: entry.walkingSteadiness.map { "\(Int($0 * 100))" } ?? "--",
                    unit: "%",
                    icon: "figure.walk.motion",
                    color: .green,
                    hasData: entry.walkingSteadiness != nil
                )
            }

            // Quick Status
            HStack {
                if entry.heartRate != nil || entry.steps != nil {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)

                        Text("Health data is current")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                            .font(.caption)

                        Text("Waiting for health data")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Text("Tap to open VitalSense")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background {
            LinearGradient(
                colors: [Color.blue.opacity(0.08), Color.purple.opacity(0.05), Color.red.opacity(0.03)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Circular Accessory Widget (Lock Screen)
struct CircularHealthWidget: View {
    let entry: HealthEntry

    var body: some View {
        ZStack {
            Circle()
                .stroke(.red.opacity(0.3), lineWidth: 3)

            if let heartRate = entry.heartRate {
                VStack(spacing: 1) {
                    Text("\(Int(heartRate))")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.red)

                    Text("bpm")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else {
                VStack(spacing: 1) {
                    Image(systemName: "heart.fill")
                        .font(.caption)
                        .foregroundColor(.red)

                    Text("--")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

// MARK: - Rectangular Accessory Widget (Lock Screen)
struct RectangularHealthWidget: View {
    let entry: HealthEntry

    var body: some View {
        HStack(spacing: 8) {
            // Connection indicator
            Circle()
                .fill(entry.connectionStatus.color)
                .frame(width: 6, height: 6)

            // Heart rate
            HStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .font(.caption2)

                if let heartRate = entry.heartRate {
                    Text("\(Int(heartRate)) bpm")
                        .font(.caption)
                        .fontWeight(.medium)
                } else {
                    Text("-- bpm")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

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
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }
}

// MARK: - Widget Metric Card Component
struct WidgetMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    let hasData: Bool

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.subheadline)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }

            HStack(alignment: .lastTextBaseline, spacing: 4) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(hasData ? color : .secondary)

                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }
        }
        .padding(12)
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.2), lineWidth: 1)
                )
        }
    }
}

// MARK: - iOS 26 Enhanced Widget Views

@available(iOS 26.0, *)
struct iOS26SmallHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Variable Draw heart rate with live animation
                if let heartRate = entry.heartRate {
                    Image(systemName: "heart.fill")
                        .symbolVariableValue(heartRate / 180.0)
                        .symbolAnimation(.draw.continuous.speed(heartRate / 60.0))
                        .foregroundStyle(.red.gradient(.radial))
                        .font(.title2)
                } else {
                    Image(systemName: "heart")
                        .foregroundColor(.red)
                        .font(.title2)
                }

                Spacer()

                Text("VitalSense")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .lastTextBaseline) {
                    if let heartRate = entry.heartRate {
                        Text("\(Int(heartRate))")
                            .font(.title.monospacedDigit().weight(.bold))
                            .contentTransition(.numericText(value: heartRate))
                    } else {
                        Text("--")
                            .font(.title.weight(.bold))
                            .foregroundColor(.secondary)
                    }

                    Text("BPM")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                HStack {
                    // Variable Draw steps
                    if let steps = entry.steps {
                        Image(systemName: "figure.walk")
                            .symbolVariableValue(steps / 20000.0)
                            .foregroundStyle(.blue.gradient(.linear))

                        Text("\(Int(steps)) steps")
                            .font(.caption2)
                            .contentTransition(.numericText(value: steps))
                    } else {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.blue)

                        Text("-- steps")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.liquidGlass.opacity(0.8))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.liquidGlassStroke.opacity(0.3), lineWidth: 1)
                }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26MediumHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        HStack(spacing: 16) {
            // Heart Rate Section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    if let heartRate = entry.heartRate {
                        Image(systemName: "heart.fill")
                            .symbolVariableValue(heartRate / 180.0)
                            .symbolAnimation(.draw.repeating.speed(heartRate / 60.0))
                            .foregroundStyle(.red.gradient(.radial))
                    } else {
                        Image(systemName: "heart")
                            .foregroundColor(.red)
                    }

                    Text("Heart Rate")
                        .font(.subheadline.weight(.medium))
                }

                HStack(alignment: .lastTextBaseline) {
                    if let heartRate = entry.heartRate {
                        Text("\(Int(heartRate))")
                            .font(.title.monospacedDigit().weight(.bold))
                            .contentTransition(.numericText(value: heartRate))
                    } else {
                        Text("--")
                            .font(.title.weight(.bold))
                            .foregroundColor(.secondary)
                    }

                    Text("BPM")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            // Steps Section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    if let steps = entry.steps {
                        Image(systemName: "figure.walk")
                            .symbolVariableValue(steps / 20000.0)
                            .foregroundStyle(.blue.gradient(.linear))
                    } else {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.blue)
                    }

                    Text("Daily Steps")
                        .font(.subheadline.weight(.medium))
                }

                if let steps = entry.steps {
                    Text("\(Int(steps))")
                        .font(.title.monospacedDigit().weight(.bold))
                        .contentTransition(.numericText(value: steps))
                } else {
                    Text("--")
                        .font(.title.weight(.bold))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.liquidGlass.opacity(0.8))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.liquidGlassStroke.opacity(0.3), lineWidth: 1)
                }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26LargeHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("VitalSense Health")
                    .font(.title2.weight(.semibold))

                Spacer()

                Circle()
                    .fill(entry.connectionStatus.color)
                    .frame(width: 8, height: 8)
            }

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {

                // Heart Rate
                iOS26WidgetMetricCard(
                    icon: "heart.fill",
                    title: "Heart Rate",
                    value: entry.heartRate.map { "\(Int($0))" } ?? "--",
                    unit: "BPM",
                    color: .red,
                    variableValue: (entry.heartRate ?? 0) / 180.0
                )

                // Steps
                iOS26WidgetMetricCard(
                    icon: "figure.walk",
                    title: "Steps",
                    value: entry.steps.map { "\(Int($0))" } ?? "--",
                    unit: "steps",
                    color: .blue,
                    variableValue: (entry.steps ?? 0) / 20000.0
                )

                // Active Energy
                iOS26WidgetMetricCard(
                    icon: "flame.fill",
                    title: "Energy",
                    value: entry.activeEnergy.map { "\(Int($0))" } ?? "--",
                    unit: "cal",
                    color: .orange,
                    variableValue: (entry.activeEnergy ?? 0) / 1000.0
                )

                // Walking Steadiness
                iOS26WidgetMetricCard(
                    icon: "figure.walk.motion",
                    title: "Steadiness",
                    value: entry.walkingSteadiness.map { "\(Int($0 * 100))" } ?? "--",
                    unit: "%",
                    color: .green,
                    variableValue: entry.walkingSteadiness ?? 0
                )
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.liquidGlass.opacity(0.8))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.liquidGlassStroke.opacity(0.3), lineWidth: 1)
                }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26CircularHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        ZStack {
            if let heartRate = entry.heartRate {
                iOS26ActivityRing(progress: heartRate / 180.0, color: .red)

                VStack(spacing: 2) {
                    Text("\(Int(heartRate))")
                        .font(.caption.monospacedDigit().weight(.bold))
                        .contentTransition(.numericText(value: heartRate))

                    Text("BPM")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } else {
                Circle()
                    .stroke(.red.opacity(0.3), lineWidth: 4)

                Text("--")
                    .font(.caption.weight(.bold))
                    .foregroundColor(.secondary)
            }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26RectangularHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        HStack(spacing: 12) {
            if let heartRate = entry.heartRate {
                Image(systemName: "heart.fill")
                    .symbolVariableValue(heartRate / 180.0)
                    .symbolAnimation(.draw.continuous.speed(heartRate / 60.0))
                    .foregroundStyle(.red.gradient(.radial))
                    .font(.title3)
            } else {
                Image(systemName: "heart")
                    .foregroundColor(.red)
                    .font(.title3)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    if let heartRate = entry.heartRate {
                        Text("\(Int(heartRate))")
                            .font(.title3.monospacedDigit().weight(.bold))
                            .contentTransition(.numericText(value: heartRate))
                    } else {
                        Text("--")
                            .font(.title3.weight(.bold))
                            .foregroundColor(.secondary)
                    }

                    Text("BPM")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                if let steps = entry.steps {
                    Text("\(Int(steps)) steps")
                        .font(.caption2)
                        .contentTransition(.numericText(value: steps))
                        .foregroundStyle(.secondary)
                } else {
                    Text("-- steps")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
        .padding(8)
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(.liquidGlass.opacity(0.6))
        }
    }
}

@available(iOS 26.0, *)
struct iOS26WidgetMetricCard: View {
    let icon: String
    let title: String
    let value: String
    let unit: String
    let color: Color
    let variableValue: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .symbolVariableValue(variableValue)
                    .foregroundStyle(color.gradient(.linear))
                    .font(.title3)

                Spacer()
            }

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3.monospacedDigit().weight(.bold))

                Text(unit)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(8)
        .background {
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.1))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(color.opacity(0.2), lineWidth: 1)
                }
        }
    }
}
