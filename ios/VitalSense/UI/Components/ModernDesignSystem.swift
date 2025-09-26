import SwiftUI
import UIKit

// MARK: - Modern Design System
struct ModernDesignSystem {

    // MARK: - Color Palette
    struct Colors {
        // Primary Colors
        static let primary = Color(red: 0.145, green: 0.388, blue: 0.922) // #2563eb
        static let primaryDark = Color(red: 0.118, green: 0.322, blue: 0.769) // #1e40af
        static let primaryLight = Color(red: 0.376, green: 0.584, blue: 0.961) // #6086f5

        // Secondary Colors
        static let secondary = Color(red: 0.034, green: 0.569, blue: 0.698) // #0891b2
        static let secondaryDark = Color(red: 0.027, green: 0.475, blue: 0.584) // #0e7490
        static let secondaryLight = Color(red: 0.165, green: 0.682, blue: 0.792) // #22d3ee

        // Health Status Colors
        static let healthGreen = Color(red: 0.137, green: 0.596, blue: 0.133) // #22c55e
        static let healthYellow = Color(red: 0.918, green: 0.690, blue: 0.067) // #eab308
        static let healthOrange = Color(red: 0.918, green: 0.502, blue: 0.137) // #ea8022
        static let healthRed = Color(red: 0.937, green: 0.267, blue: 0.267) // #ef4444

        // Neutral Colors
        static let background = Color(.systemBackground)
        static let secondaryBackground = Color(.secondarySystemBackground)
        static let tertiaryBackground = Color(.tertiarySystemBackground)
        static let surface = Color(.systemGray6)

        // Text Colors
        static let textPrimary = Color(.label)
        static let textSecondary = Color(.secondaryLabel)
        static let textTertiary = Color(.tertiaryLabel)

        // Border Colors
        static let border = Color(.separator)
        static let borderLight = Color(.systemGray5)
        static let borderDark = Color(.systemGray3)
    }

    // MARK: - Typography
    struct Typography {
        // Headlines
        static let largeTitle = Font.custom("Inter", size: 34, relativeTo: .largeTitle)
            .weight(.bold)
        static let title1 = Font.custom("Inter", size: 28, relativeTo: .title)
            .weight(.bold)
        static let title2 = Font.custom("Inter", size: 22, relativeTo: .title2)
            .weight(.bold)
        static let title3 = Font.custom("Inter", size: 20, relativeTo: .title3)
            .weight(.semibold)

        // Body Text
        static let body = Font.custom("Inter", size: 17, relativeTo: .body)
        static let bodyEmphasized = Font.custom("Inter", size: 17, relativeTo: .body)
            .weight(.medium)
        static let callout = Font.custom("Inter", size: 16, relativeTo: .callout)

        // Supporting Text
        static let subheadline = Font.custom("Inter", size: 15, relativeTo: .subheadline)
        static let footnote = Font.custom("Inter", size: 13, relativeTo: .footnote)
        static let caption = Font.custom("Inter", size: 12, relativeTo: .caption)
        static let caption2 = Font.custom("Inter", size: 11, relativeTo: .caption2)

        // Numeric Display
        static let numericLarge = Font.custom("SF Mono", size: 24, relativeTo: .title2)
            .weight(.semibold)
            .monospacedDigit()
        static let numericMedium = Font.custom("SF Mono", size: 20, relativeTo: .title3)
            .weight(.medium)
            .monospacedDigit()
        static let numericSmall = Font.custom("SF Mono", size: 16, relativeTo: .callout)
            .monospacedDigit()
    }

    // MARK: - Spacing
    struct Spacing {
        static let xxxSmall: CGFloat = 2
        static let xxSmall: CGFloat = 4
        static let xSmall: CGFloat = 8
        static let small: CGFloat = 12
        static let medium: CGFloat = 16
        static let large: CGFloat = 20
        static let xLarge: CGFloat = 24
        static let xxLarge: CGFloat = 32
        static let xxxLarge: CGFloat = 40
        static let giant: CGFloat = 48
        static let colossal: CGFloat = 64
    }

    // MARK: - Corner Radius
    struct CornerRadius {
        static let small: CGFloat = 4
        static let medium: CGFloat = 8
        static let large: CGFloat = 12
        static let xLarge: CGFloat = 16
        static let xxLarge: CGFloat = 24
        static let round: CGFloat = 50
    }

    // MARK: - Shadow
    struct Shadows {
        static let small = Shadow(
            color: Color.black.opacity(0.1),
            radius: 2,
            x: 0,
            y: 1
        )

        static let medium = Shadow(
            color: Color.black.opacity(0.15),
            radius: 4,
            x: 0,
            y: 2
        )

        static let large = Shadow(
            color: Color.black.opacity(0.2),
            radius: 8,
            x: 0,
            y: 4
        )
    }
}

// MARK: - Design System Extensions
extension View {
    // MARK: - Card Styles
    func cardStyle(
        backgroundColor: Color = ModernDesignSystem.Colors.surface,
        cornerRadius: CGFloat = ModernDesignSystem.CornerRadius.large,
        shadow: Shadow = ModernDesignSystem.Shadows.medium
    ) -> some View {
        self
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .shadow(
                color: shadow.color,
                radius: shadow.radius,
                x: shadow.x,
                y: shadow.y
            )
    }

    // MARK: - Health Status Styling
    func healthStatusStyle(
        for status: HealthStatus
    ) -> some View {
        self
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
            .padding(.vertical, ModernDesignSystem.Spacing.small)
            .background(status.backgroundColor)
            .foregroundColor(status.foregroundColor)
            .cornerRadius(ModernDesignSystem.CornerRadius.medium)
    }

    // MARK: - Button Styles
    func primaryButtonStyle() -> some View {
        self
            .font(ModernDesignSystem.Typography.bodyEmphasized)
            .foregroundColor(.white)
            .padding(.horizontal, ModernDesignSystem.Spacing.xLarge)
            .padding(.vertical, ModernDesignSystem.Spacing.medium)
            .background(ModernDesignSystem.Colors.primary)
            .cornerRadius(ModernDesignSystem.CornerRadius.medium)
            .shadow(
                color: ModernDesignSystem.Colors.primary.opacity(0.3),
                radius: 4,
                x: 0,
                y: 2
            )
    }

    func secondaryButtonStyle() -> some View {
        self
            .font(ModernDesignSystem.Typography.bodyEmphasized)
            .foregroundColor(ModernDesignSystem.Colors.primary)
            .padding(.horizontal, ModernDesignSystem.Spacing.xLarge)
            .padding(.vertical, ModernDesignSystem.Spacing.medium)
            .background(Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.medium)
                    .stroke(ModernDesignSystem.Colors.primary, lineWidth: 2)
            )
    }

    // MARK: - Input Field Styling
    func textFieldStyle() -> some View {
        self
            .font(ModernDesignSystem.Typography.body)
            .padding(ModernDesignSystem.Spacing.medium)
            .background(ModernDesignSystem.Colors.secondaryBackground)
            .cornerRadius(ModernDesignSystem.CornerRadius.medium)
            .overlay(
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.medium)
                    .stroke(ModernDesignSystem.Colors.border, lineWidth: 1)
            )
    }
}

// MARK: - Health Status Enum
enum HealthStatus: CaseIterable {
    case excellent
    case good
    case fair
    case poor
    case critical

    var backgroundColor: Color {
        switch self {
        case .excellent:
            return ModernDesignSystem.Colors.healthGreen.opacity(0.15)
        case .good:
            return ModernDesignSystem.Colors.healthGreen.opacity(0.1)
        case .fair:
            return ModernDesignSystem.Colors.healthYellow.opacity(0.15)
        case .poor:
            return ModernDesignSystem.Colors.healthOrange.opacity(0.15)
        case .critical:
            return ModernDesignSystem.Colors.healthRed.opacity(0.15)
        }
    }

    var foregroundColor: Color {
        switch self {
        case .excellent, .good:
            return ModernDesignSystem.Colors.healthGreen
        case .fair:
            return ModernDesignSystem.Colors.healthYellow
        case .poor:
            return ModernDesignSystem.Colors.healthOrange
        case .critical:
            return ModernDesignSystem.Colors.healthRed
        }
    }

    var displayName: String {
        switch self {
        case .excellent:
            return "Excellent"
        case .good:
            return "Good"
        case .fair:
            return "Fair"
        case .poor:
            return "Poor"
        case .critical:
            return "Critical"
        }
    }
}

// MARK: - Custom Components
struct VitalSenseCard<Content: View>: View {
    let title: String
    let subtitle: String?
    let content: Content
    let backgroundColor: Color
    let cornerRadius: CGFloat

    init(
        title: String,
        subtitle: String? = nil,
        backgroundColor: Color = ModernDesignSystem.Colors.surface,
        cornerRadius: CGFloat = ModernDesignSystem.CornerRadius.large,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.backgroundColor = backgroundColor
        self.cornerRadius = cornerRadius
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.medium) {
            VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.xxSmall) {
                Text(title)
                    .font(ModernDesignSystem.Typography.title3)
                    .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }

            content
        }
        .padding(ModernDesignSystem.Spacing.medium)
        .cardStyle(
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius
        )
    }
}

struct HealthMetricDisplayView: View {
    let title: String
    let value: String
    let unit: String
    let trend: ModernTrendDirection
    let status: HealthStatus

    var body: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.small) {
            HStack {
                Text(title)
                    .font(ModernDesignSystem.Typography.subheadline)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)

                Spacer()

                TrendIndicator(direction: trend)
            }

            HStack(alignment: .firstTextBaseline, spacing: ModernDesignSystem.Spacing.xxSmall) {
                Text(value)
                    .font(ModernDesignSystem.Typography.numericLarge)
                    .foregroundColor(status.foregroundColor)

                Text(unit)
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textTertiary)
            }

            Text(status.displayName)
                .font(ModernDesignSystem.Typography.caption)
                .healthStatusStyle(for: status)
        }
    }
}

struct TrendIndicator: View {
    let direction: ModernTrendDirection

    var body: some View {
        HStack(spacing: ModernDesignSystem.Spacing.xxxSmall) {
            Image(systemName: direction.iconName)
                .font(.caption)
                .foregroundColor(direction.color)

            Text(direction.displayName)
                .font(ModernDesignSystem.Typography.caption2)
                .foregroundColor(direction.color)
        }
    }
}

enum ModernTrendDirection: CaseIterable {
    case improving
    case stable
    case declining

    var iconName: String {
        switch self {
        case .improving:
            return "arrow.up.right"
        case .stable:
            return "arrow.right"
        case .declining:
            return "arrow.down.right"
        }
    }

    var color: Color {
        switch self {
        case .improving:
            return ModernDesignSystem.Colors.healthGreen
        case .stable:
            return ModernDesignSystem.Colors.textSecondary
        case .declining:
            return ModernDesignSystem.Colors.healthRed
        }
    }

    var displayName: String {
        switch self {
        case .improving:
            return "Improving"
        case .stable:
            return "Stable"
        case .declining:
            return "Declining"
        }
    }
}

// MARK: - Shadow Helper
struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

// MARK: - Animation Presets
extension Animation {
    static let vitalSenseSpring = Animation.spring(
        response: 0.5,
        dampingFraction: 0.7,
        blendDuration: 0.2
    )

    static let vitalSenseEaseInOut = Animation.easeInOut(duration: 0.3)

    static let vitalSenseBouncy = Animation.spring(
        response: 0.6,
        dampingFraction: 0.6,
        blendDuration: 0.1
    )
}

// MARK: - Haptic Feedback Helper
struct HapticFeedback {
    static func light() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }

    static func medium() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }

    static func heavy() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
        impactFeedback.impactOccurred()
    }

    static func success() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.success)
    }

    static func warning() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.warning)
    }

    static func error() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.error)
    }
}
