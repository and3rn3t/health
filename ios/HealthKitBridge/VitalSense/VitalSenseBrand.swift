import SwiftUI

// MARK: - VitalSense Design System

/// VitalSense Brand Colors
struct VitalSenseBrand {

    // MARK: - Brand Colors

    /// Primary brand colors matching web platform
    struct Colors {
        // Primary Brand Colors
        static let primary = Color(hex: "#2563eb")        // Primary Blue
        static let accent = Color(hex: "#0891b2")         // Accent Teal
        static let success = Color(hex: "#059669")        // Success Green
        static let warning = Color(hex: "#d97706")        // Warning Amber
        static let error = Color(hex: "#dc2626")          // Error Red

        // Supporting Colors
        static let textPrimary = Color(hex: "#111827")    // Text Primary
        static let textMuted = Color(hex: "#6b7280")      // Text Muted
        static let backgroundLight = Color(hex: "#ffffff") // Light Background
        static let backgroundDark = Color(hex: "#1f2937")  // Dark Background
        static let cardLight = Color(hex: "#f9fafb")      // Light Card
        static let cardDark = Color(hex: "#374151")       // Dark Card

        // Gradient Collections
        static let primaryGradient = LinearGradient(
            colors: [primary, accent],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let successGradient = LinearGradient(
            colors: [success, Color(hex: "#10b981")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let warningGradient = LinearGradient(
            colors: [warning, Color(hex: "#f59e0b")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let errorGradient = LinearGradient(
            colors: [error, Color(hex: "#ef4444")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        // Health-specific gradients
        static let vitalGradient = LinearGradient(
            colors: [Color(hex: "#06b6d4"), Color(hex: "#3b82f6"), Color(hex: "#8b5cf6")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let heartRateGradient = LinearGradient(
            colors: [Color(hex: "#ef4444"), Color(hex: "#f97316")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let activityGradient = LinearGradient(
            colors: [Color(hex: "#10b981"), Color(hex: "#06b6d4")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Typography

    struct Typography {
        // Headlines
        static let largeTitle = Font.system(size: 34, weight: .bold, design: .default)
        static let title1 = Font.system(size: 28, weight: .bold, design: .default)
        static let title2 = Font.system(size: 22, weight: .bold, design: .default)
        static let title3 = Font.system(size: 20, weight: .semibold, design: .default)

        // Body Text
        static let headline = Font.system(size: 17, weight: .semibold, design: .default)
        static let body = Font.system(size: 17, weight: .regular, design: .default)
        static let bodyEmphasized = Font.system(size: 17, weight: .medium, design: .default)
        static let callout = Font.system(size: 16, weight: .regular, design: .default)
        static let subheadline = Font.system(size: 15, weight: .regular, design: .default)
        static let footnote = Font.system(size: 13, weight: .regular, design: .default)
        static let caption1 = Font.system(size: 12, weight: .regular, design: .default)
        static let caption2 = Font.system(size: 11, weight: .regular, design: .default)

        // Specialized
        static let vitalsDisplay = Font.system(size: 24, weight: .bold, design: .monospaced)
        static let metricValue = Font.system(size: 20, weight: .bold, design: .rounded)
        static let statusIndicator = Font.system(size: 14, weight: .semibold, design: .default)
    }

    // MARK: - Spacing & Layout

    struct Layout {
        // Spacing
        static let extraSmall: CGFloat = 4
        static let small: CGFloat = 8
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let extraLarge: CGFloat = 32
        static let huge: CGFloat = 48

        // Corner Radius
        static let cornerRadiusSmall: CGFloat = 8
        static let cornerRadiusMedium: CGFloat = 12
        static let cornerRadiusLarge: CGFloat = 16
        static let cornerRadiusXLarge: CGFloat = 24

        // Shadows
        static let shadowElevation1 = Shadow(
            color: Colors.textPrimary.opacity(0.05),
            radius: 2,
            x: 0,
            y: 1
        )

        static let shadowElevation2 = Shadow(
            color: Colors.textPrimary.opacity(0.1),
            radius: 4,
            x: 0,
            y: 2
        )

        static let shadowElevation3 = Shadow(
            color: Colors.textPrimary.opacity(0.15),
            radius: 8,
            x: 0,
            y: 4
        )
    }

    // MARK: - Animations

    struct Animations {
        static let quickResponse = Animation.easeInOut(duration: 0.2)
        static let smooth = Animation.easeInOut(duration: 0.3)
        static let dramatic = Animation.spring(response: 0.6, dampingFraction: 0.8)
        static let pulse = Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true)
        static let bounce = Animation.interpolatingSpring(stiffness: 300, damping: 10)

        // Health-specific animations
        static let heartbeat = Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true)
        static let breathe = Animation.easeInOut(duration: 4.0).repeatForever(autoreverses: true)
        static let vitalsUpdate = Animation.spring(response: 0.4, dampingFraction: 0.7)
    }

    // MARK: - Icons

    struct Icons {
        // Core Health
        static let vitals = "waveform.path.ecg"
        static let heartRate = "heart.fill"
        static let activity = "figure.walk"
        static let sleep = "bed.double.fill"
        static let mindfulness = "brain.head.profile"

        // Monitoring
        static let shield = "shield.checkered"
        static let sensor = "sensor.tag.radiowaves.forward.fill"
        static let analytics = "chart.line.uptrend.xyaxis"
        static let insights = "lightbulb.fill"
        static let prediction = "crystal.ball.fill"

        // Fall Risk
        static let balance = "figure.stand"
        static let stability = "gyroscope"
        static let risk = "exclamationmark.triangle.fill"
        static let safety = "checkmark.shield.fill"

        // Interface
        static let dashboard = "rectangle.3.group.fill"
        static let settings = "gear"
        static let profile = "person.circle.fill"
        static let notifications = "bell.fill"
        static let share = "square.and.arrow.up"
    }
}

// MARK: - Color Extension for Hex Support

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Shadow Helper

struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

// MARK: - Brand-specific View Modifiers

extension View {
    /// Apply VitalSense brand card styling
    func vitalSenseCard(elevation: Int = 1) -> some View {
        let shadow: Shadow
        switch elevation {
        case 1: shadow = VitalSenseBrand.Layout.shadowElevation1
        case 2: shadow = VitalSenseBrand.Layout.shadowElevation2
        default: shadow = VitalSenseBrand.Layout.shadowElevation3
        }

        return self
            .background(Color(.systemBackground))
            .cornerRadius(VitalSenseBrand.Layout.cornerRadiusMedium)
            .shadow(
                color: shadow.color,
                radius: shadow.radius,
                x: shadow.x,
                y: shadow.y
            )
    }

    /// Apply VitalSense brand button styling
    func vitalSensePrimaryButton() -> some View {
        self
            .font(VitalSenseBrand.Typography.headline)
            .foregroundColor(.white)
            .padding()
            .background(VitalSenseBrand.Colors.primaryGradient)
            .cornerRadius(VitalSenseBrand.Layout.cornerRadiusMedium)
            .shadow(
                color: VitalSenseBrand.Colors.primary.opacity(0.3),
                radius: 4,
                x: 0,
                y: 2
            )
    }

    /// Apply VitalSense brand secondary button styling
    func vitalSenseSecondaryButton() -> some View {
        self
            .font(VitalSenseBrand.Typography.headline)
            .foregroundColor(VitalSenseBrand.Colors.primary)
            .padding()
            .background(Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: VitalSenseBrand.Layout.cornerRadiusMedium)
                    .stroke(VitalSenseBrand.Colors.primary, lineWidth: 2)
            )
    }

    /// Apply VitalSense brand metric display styling
    func vitalSenseMetricDisplay() -> some View {
        self
            .font(VitalSenseBrand.Typography.vitalsDisplay)
            .foregroundColor(VitalSenseBrand.Colors.primary)
    }

    /// Apply pulsing animation for live data
    func vitalSensePulse() -> some View {
        self
            .scaleEffect(1.0)
            .animation(VitalSenseBrand.Animations.pulse, value: UUID())
    }

    /// Apply VitalSense brand gradient background
    func vitalSenseGradientBackground() -> some View {
        self
            .background(
                VitalSenseBrand.Colors.vitalGradient
                    .ignoresSafeArea()
            )
    }
}

// MARK: - Brand Constants

extension VitalSenseBrand {
    /// App name for display
    static let appName = "VitalSense"

    /// App tagline
    static let tagline = "Apple Health Insights & Fall Risk Monitor"

    /// Primary domain
    static let domain = "health.andernet.dev"

    /// App bundle identifier
    static let bundleId = "dev.andernet.vitalsense.sync"

    /// Brand messaging
    struct Messaging {
        static let vitalIntelligence = "Intelligent health monitoring that transforms Apple Health data into vital insights"
        static let proactiveSensing = "Continuous health monitoring with early warning systems and fall risk prediction"
        static let trustedCare = "HIPAA-compliant security with privacy-first approach and caregiver coordination"
        static let seamlessIntegration = "Native HealthKit connectivity with real-time data synchronization"
    }
}
