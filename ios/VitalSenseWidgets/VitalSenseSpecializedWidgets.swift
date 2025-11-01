import WidgetKit
import SwiftUI

// MARK: - Specialized Widget View Components
// This file contains specialized view components for widgets defined in VitalSenseHealthWidgets.swift

// MARK: - Heart Rate Widget Views

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

// MARK: - Activity Widget Views

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

// MARK: - Supporting Views

struct ActivityStatRow: View {
    let icon: String
    let color: Color
    let title: String
    let value: Double?
    let goal: Double
    let formatter: (Double) -> String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)

                HStack(spacing: 4) {
                    if let value = value {
                        Text(formatter(value))
                            .font(.caption)
                            .fontWeight(.medium)
                    } else {
                        Text("--")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Text("/ \(formatter(goal))")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()
        }
    }
}
