import WidgetKit
import SwiftUI

// MARK: - Widget Bundle (Note: This is a backup/preview file - main bundle is in VitalSenseHealthWidgets.swift)

// MARK: - Widget Preview Provider
struct VitalSenseWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Main widget previews
            SmallHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: 75,
                steps: 8432,
                activeEnergy: 245,
                exerciseMinutes: 32,
                standHours: 8,
                walkingSteadiness: 85,
                steadinessStatus: "Excellent",
                isConnected: true
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Health Widget - Small")

            MediumHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: 72,
                steps: 6789,
                activeEnergy: 189,
                exerciseMinutes: 15,
                standHours: 6,
                walkingSteadiness: 75,
                steadinessStatus: "Good",
                isConnected: true
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Health Widget - Medium")

            LargeHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: 68,
                steps: 12543,
                activeEnergy: 387,
                exerciseMinutes: 45,
                standHours: 10,
                walkingSteadiness: 92,
                steadinessStatus: "Excellent",
                isConnected: true
            ))
            .previewContext(WidgetPreviewContext(family: .systemLarge))
            .previewDisplayName("Health Widget - Large")

            // Heart Rate widget previews
            SmallHeartRateWidget(entry: HeartRateEntry(
                date: Date(),
                heartRate: 75,
                trend: .stable,
                zone: .fatBurn
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Heart Rate Widget - Small")

            CircularHeartRateWidget(entry: HeartRateEntry(
                date: Date(),
                heartRate: 82,
                trend: .increasing,
                zone: .cardio
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Heart Rate Widget - Circular")

            // Activity widget previews
            SmallActivityWidget(entry: ActivityEntry(
                date: Date(),
                steps: 8432,
                activeEnergy: 245,
                exerciseMinutes: 32,
                standHours: 8,
                stepsGoal: 10000,
                energyGoal: 400
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Activity Widget - Small")

            MediumActivityWidget(entry: ActivityEntry(
                date: Date(),
                steps: 6789,
                activeEnergy: 189,
                exerciseMinutes: 15,
                standHours: 6,
                stepsGoal: 10000,
                energyGoal: 400
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Activity Widget - Medium")

            // Steps widget previews
            SmallStepsWidget(entry: StepsEntry(
                date: Date(),
                steps: 8432,
                goal: 10000,
                hourlySteps: [450, 380, 520, 290, 610, 340, 480, 390, 560, 420, 380, 290]
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Steps Widget - Small")

            CircularStepsWidget(entry: StepsEntry(
                date: Date(),
                steps: 6789,
                goal: 10000,
                hourlySteps: []
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Steps Widget - Circular")

            // Lock screen widgets
            CircularHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: 75,
                steps: 8432,
                activeEnergy: 245,
                exerciseMinutes: 32,
                standHours: 8,
                walkingSteadiness: 85,
                steadinessStatus: "Excellent",
                isConnected: true
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Health Widget - Lock Screen Circular")

            RectangularHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: 72,
                steps: 6789,
                activeEnergy: 189,
                exerciseMinutes: 15,
                standHours: 6,
                walkingSteadiness: 75,
                steadinessStatus: "Good",
                isConnected: true
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
            .previewDisplayName("Health Widget - Lock Screen Rectangular")

            // No data states
            SmallHealthWidget(entry: HealthEntry(
                date: Date(),
                heartRate: nil,
                steps: nil,
                activeEnergy: nil,
                exerciseMinutes: nil,
                standHours: nil,
                walkingSteadiness: nil,
                steadinessStatus: "Unknown",
                isConnected: false
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Health Widget - No Data")

            SmallHeartRateWidget(entry: HeartRateEntry(
                date: Date(),
                heartRate: nil,
                trend: .stable,
                zone: .unknown
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Heart Rate Widget - No Data")
        }
    }
}

// MARK: - Widget Extensions
extension WidgetFamily {
    var displayName: String {
        switch self {
        case .systemSmall:
            return "Small"
        case .systemMedium:
            return "Medium"
        case .systemLarge:
            return "Large"
        case .accessoryCircular:
            return "Lock Screen Circular"
        case .accessoryRectangular:
            return "Lock Screen Rectangular"
        case .accessoryInline:
            return "Lock Screen Inline"
        @unknown default:
            return "Unknown"
        }
    }

    var isLockScreen: Bool {
        switch self {
        case .accessoryCircular, .accessoryRectangular, .accessoryInline:
            return true
        default:
            return false
        }
    }
}

// MARK: - Color Extensions for Widgets
extension Color {
    static let widgetBackground = Color(UIColor.systemBackground)
    static let widgetSecondaryBackground = Color(UIColor.secondarySystemBackground)
    static let widgetPrimary = Color(UIColor.label)
    static let widgetSecondary = Color(UIColor.secondaryLabel)

    // VitalSense brand colors
    static let vitalSensePrimary = Color(red: 0.149, green: 0.388, blue: 0.922) // #2563eb
    static let vitalSenseAccent = Color(red: 0.020, green: 0.392, blue: 0.529) // #056487
    static let vitalSenseSuccess = Color(red: 0.133, green: 0.588, blue: 0.251) // #22c55e
    static let vitalSenseWarning = Color(red: 0.918, green: 0.576, blue: 0.075) // #ea9213
    static let vitalSenseError = Color(red: 0.863, green: 0.149, blue: 0.149) // #dc2626

    // Health metric colors
    static let heartRateColor = Color.red
    static let stepsColor = Color.blue
    static let energyColor = Color.orange
    static let exerciseColor = Color.green
    static let standColor = Color.purple
    static let walkingSteadinessColor = Color.teal
}

// MARK: - Widget Utility Extensions
extension Date {
    var widgetTimeFormat: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }

    var widgetDateFormat: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: self)
    }

    var isToday: Bool {
        Calendar.current.isDateInToday(self)
    }
}

extension Double {
    var healthValueFormat: String {
        if self >= 1000 {
            return String(format: "%.1fk", self / 1000)
        } else {
            return String(format: "%.0f", self)
        }
    }

    var percentageFormat: String {
        return String(format: "%.0f%%", self * 100)
    }
}

// MARK: - Widget Animation Helpers
struct PulsingHeartModifier: ViewModifier {
    @State private var isAnimating = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isAnimating ? 1.2 : 1.0)
            .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true), value: isAnimating)
            .onAppear {
                isAnimating = true
            }
    }
}

struct ProgressRingModifier: ViewModifier {
    let progress: Double
    let color: Color
    @State private var animatedProgress: Double = 0

    func body(content: Content) -> some View {
        content
            .onAppear {
                withAnimation(.easeInOut(duration: 1.0)) {
                    animatedProgress = progress
                }
            }
    }
}

extension View {
    func pulsingHeart() -> some View {
        self.modifier(PulsingHeartModifier())
    }

    func progressRing(progress: Double, color: Color) -> some View {
        self.modifier(ProgressRingModifier(progress: progress, color: color))
    }
}
