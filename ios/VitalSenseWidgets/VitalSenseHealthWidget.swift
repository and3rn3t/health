import WidgetKit
import SwiftUI
import HealthKit

// MARK: - VitalSense Widget Bundle (removed @main to avoid conflicts)
// Note: Widget bundle is now defined in VitalSenseWidgetsBundle.swift

// MARK: - Health Data Timeline Entry
// Note: HealthEntry is now defined in VitalSenseHealthWidgets.swift to avoid duplication

// MARK: - Widget Timeline Provider
@MainActor
struct HealthProvider: TimelineProvider {
    typealias Entry = HealthEntry

    func placeholder(in context: Context) -> HealthEntry {
        HealthEntry(
            date: Date(),
            heartRate: 72,
            steps: 8432,
            activeEnergy: 245,
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
            activeEnergy: 189,
            gaitScore: 82.0,
            fallRisk: 18.0,
            isDataAvailable: true,
            connectionStatus: .connected
        )
        completion(entry)
    }

    // Marked @MainActor so we can synchronously call the main-actor-isolated
    // WidgetHealthManager.shared and its fetchAllHealthData(completion:) API.
    @MainActor
    func getTimeline(in context: Context, completion: @escaping (Timeline<HealthEntry>) -> ()) {
        let healthManager = WidgetHealthManager.shared

        healthManager.fetchAllHealthData { entry in
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
                Text("\(entry.heartRate)")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.red)

                Text("bpm")
                    .font(.caption)
                    .foregroundColor(.secondary)
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

                    Text("\(entry.heartRate)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)

                    Text("bpm")
                        .font(.caption2)
                        .foregroundColor(.secondary)
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

                    Text("\(entry.steps)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)

                    Text("today")
                        .font(.caption2)
                        .foregroundColor(.secondary)
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

                    Text("\(entry.activeEnergy)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)

                    Text("kcal")
                        .font(.caption2)
                        .foregroundColor(.secondary)
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
                    value: "\(entry.heartRate)",
                    unit: "bpm",
                    icon: "heart.fill",
                    color: .red,
                    hasData: true
                )

                // Steps Card
                WidgetMetricCard(
                    title: "Daily Steps",
                    value: "\(entry.steps)",
                    unit: "steps",
                    icon: "figure.walk",
                    color: .blue,
                    hasData: true
                )
            }

            // Secondary Metrics Row
            HStack(spacing: 12) {
                // Active Energy Card
                WidgetMetricCard(
                    title: "Active Energy",
                    value: "\(entry.activeEnergy)",
                    unit: "kcal",
                    icon: "flame.fill",
                    color: .orange,
                    hasData: true
                )

                // Walking Steadiness Card
                WidgetMetricCard(
                    title: "Steadiness",
                    value: "\(Int(entry.walkingSteadiness * 100))",
                    unit: "%",
                    icon: "figure.walk.motion",
                    color: .green,
                    hasData: true
                )
            }

            // Quick Status
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.caption)

                    Text("Health data is current")
                        .font(.caption)
                        .foregroundColor(.secondary)
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
                .stroke(Color.red.opacity(0.3), lineWidth: 3)

            VStack(spacing: 1) {
                Text("\(entry.heartRate)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.red)

                Text("bpm")
                    .font(.caption2)
                    .foregroundColor(.secondary)
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

                Text("\(entry.heartRate) bpm")
                    .font(.caption)
                    .fontWeight(.medium)
            }

            Spacer()

            // Steps
            HStack(spacing: 4) {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                    .font(.caption2)

                Text("\(entry.steps)")
                    .font(.caption)
                    .fontWeight(.medium)
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
                    Text("\(entry.heartRate)")
                        .font(.title.monospacedDigit().weight(.bold))

                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Image(systemName: "figure.walk")
                        .foregroundColor(.blue)

                    Text("\(entry.steps) steps")
                        .font(.caption2)
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(uiColor: .systemBackground).opacity(0.9))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26MediumHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)

                    Text("Heart Rate")
                        .font(.subheadline.weight(.medium))
                }

                HStack(alignment: .lastTextBaseline) {
                    Text("\(entry.heartRate)")
                        .font(.title.monospacedDigit().weight(.bold))

                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "figure.walk")
                        .foregroundColor(.blue)

                    Text("Daily Steps")
                        .font(.subheadline.weight(.medium))
                }

                Text("\(entry.steps)")
                    .font(.title.monospacedDigit().weight(.bold))
            }

            Spacer()
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(uiColor: .systemBackground).opacity(0.9))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
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
                iOS26WidgetMetricCard(
                    icon: "heart.fill",
                    title: "Heart Rate",
                    value: "\(entry.heartRate)",
                    unit: "BPM",
                    color: .red,
                    variableValue: 0
                )

                iOS26WidgetMetricCard(
                    icon: "figure.walk",
                    title: "Steps",
                    value: "\(entry.steps)",
                    unit: "steps",
                    color: .blue,
                    variableValue: 0
                )

                iOS26WidgetMetricCard(
                    icon: "flame.fill",
                    title: "Energy",
                    value: "\(entry.activeEnergy)",
                    unit: "cal",
                    color: .orange,
                    variableValue: 0
                )

                iOS26WidgetMetricCard(
                    icon: "figure.walk.motion",
                    title: "Steadiness",
                    value: "\(Int(entry.walkingSteadiness * 100))",
                    unit: "%",
                    color: .green,
                    variableValue: 0
                )
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(uiColor: .systemBackground).opacity(0.9))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                }
        }
    }
}

@available(iOS 26.0, *)
struct iOS26CircularHealthWidget: View {
    var entry: HealthProvider.Entry

    var body: some View {
        ZStack {
            let progress = min(max(Double(entry.heartRate) / 180.0, 0), 1)

            Circle()
                .stroke(Color.red.opacity(0.2), lineWidth: 4)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.red, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))

            VStack(spacing: 2) {
                Text("\(entry.heartRate)")
                    .font(.caption.monospacedDigit().weight(.bold))

                Text("BPM")
                    .font(.caption2)
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
            Image(systemName: "heart.fill")
                .foregroundColor(.red)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text("\(entry.heartRate)")
                        .font(.title3.monospacedDigit().weight(.bold))

                    Text("BPM")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Text("\(entry.steps) steps")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(8)
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(uiColor: .systemBackground).opacity(0.9))
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
                    .foregroundColor(color)
                    .font(.title3)

                Spacer()
            }

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3.monospacedDigit().weight(.bold))

                Text(unit)
                    .font(.caption2)
                    .foregroundColor(.secondary)
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
