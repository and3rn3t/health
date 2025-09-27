import SwiftUI

// MARK: - Enhanced UI Components for VitalSense iOS

/// Enhanced metric card with improved visual hierarchy and animations
struct EnhancedMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let trend: TrendDirection?
    let status: HealthStatus
    let icon: String
    let action: (() -> Void)?

    @State private var isPressed = false
    @State private var animateValue = false

    enum HealthStatus {
        case excellent, good, fair, poor, unknown

        var color: Color {
            switch self {
            case .excellent: return ModernDesignSystem.Colors.healthGreen
            case .good: return ModernDesignSystem.Colors.secondary
            case .fair: return ModernDesignSystem.Colors.healthYellow
            case .poor: return ModernDesignSystem.Colors.healthRed
            case .unknown: return ModernDesignSystem.Colors.textSecondary
            }
        }

        var backgroundColor: Color {
            switch self {
            case .excellent: return ModernDesignSystem.Colors.healthGreen.opacity(0.1)
            case .good: return ModernDesignSystem.Colors.secondary.opacity(0.1)
            case .fair: return ModernDesignSystem.Colors.healthYellow.opacity(0.1)
            case .poor: return ModernDesignSystem.Colors.healthRed.opacity(0.1)
            case .unknown: return ModernDesignSystem.Colors.surface
            }
        }
    }

    enum TrendDirection {
        case up, down, stable

        var icon: String {
            switch self {
            case .up: return "arrow.up.right"
            case .down: return "arrow.down.right"
            case .stable: return "arrow.right"
            }
        }

        var color: Color {
            switch self {
            case .up: return ModernDesignSystem.Colors.healthGreen
            case .down: return ModernDesignSystem.Colors.healthRed
            case .stable: return ModernDesignSystem.Colors.textSecondary
            }
        }
    }

    var body: some View {
        Button(action: action ?? {}) {
            VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.small) {
                // Header with icon and trend
                HStack {
                    HStack(spacing: ModernDesignSystem.Spacing.xSmall) {
                        Image(systemName: icon)
                            .font(.title3)
                            .foregroundColor(status.color)

                        Text(title)
                            .font(ModernDesignSystem.Typography.subheadline)
                            .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                    }

                    Spacer()

                    if let trend = trend {
                        HStack(spacing: 2) {
                            Image(systemName: trend.icon)
                                .font(.caption2)
                            Text("5%")
                                .font(.caption2)
                        }
                        .foregroundColor(trend.color)
                    }
                }

                // Value display
                HStack(alignment: .lastTextBaseline, spacing: ModernDesignSystem.Spacing.xxSmall) {
                    Text(value)
                        .font(ModernDesignSystem.Typography.numericLarge)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                        .scaleEffect(animateValue ? 1.05 : 1.0)
                        .animation(.easeInOut(duration: 0.3), value: animateValue)

                    Text(unit)
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }

                // Status indicator
                HStack(spacing: ModernDesignSystem.Spacing.xSmall) {
                    Circle()
                        .fill(status.color)
                        .frame(width: 6, height: 6)

                    Text(statusText)
                        .font(ModernDesignSystem.Typography.caption2)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }
            .padding(ModernDesignSystem.Spacing.medium)
            .background {
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                    .fill(status.backgroundColor)
                    .overlay {
                        RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xLarge)
                            .stroke(status.color.opacity(0.2), lineWidth: 1)
                    }
            }
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: isPressed)
        }
        .buttonStyle(.plain)
        .onPressGesture(
            onPressingChanged: { pressing in
                isPressed = pressing
            }
        )
        .onAppear {
            // Animate value on appearance
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animateValue = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                animateValue = false
            }
        }
    }

    private var statusText: String {
        switch status {
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .fair: return "Fair"
        case .poor: return "Needs Attention"
        case .unknown: return "Monitoring"
        }
    }
}

/// Enhanced connection status indicator with real-time updates
struct EnhancedConnectionStatus: View {
    let isConnected: Bool
    let title: String
    let subtitle: String?
    let dataRate: String?

    @State private var pulseAnimation = false

    var body: some View {
        HStack(spacing: ModernDesignSystem.Spacing.medium) {
            // Connection indicator
            ZStack {
                Circle()
                    .fill(isConnected ? ModernDesignSystem.Colors.healthGreen : ModernDesignSystem.Colors.healthRed)
                    .frame(width: 12, height: 12)

                if isConnected {
                    Circle()
                        .stroke(ModernDesignSystem.Colors.healthGreen.opacity(0.3), lineWidth: 2)
                        .frame(width: 24, height: 24)
                        .scaleEffect(pulseAnimation ? 1.2 : 1.0)
                        .opacity(pulseAnimation ? 0.0 : 1.0)
                        .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: false), value: pulseAnimation)
                }
            }

            // Status information
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(ModernDesignSystem.Typography.bodyEmphasized)
                    .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }

            Spacer()

            // Data rate display
            if let dataRate = dataRate, isConnected {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(dataRate)
                        .font(ModernDesignSystem.Typography.numericSmall)
                        .foregroundColor(ModernDesignSystem.Colors.primary)

                    Text("data/min")
                        .font(ModernDesignSystem.Typography.caption2)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }
        }
        .padding(ModernDesignSystem.Spacing.medium)
        .background {
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                .fill(.regularMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                        .stroke(isConnected ? ModernDesignSystem.Colors.healthGreen.opacity(0.3) : ModernDesignSystem.Colors.healthRed.opacity(0.3), lineWidth: 1)
                }
        }
        .onAppear {
            if isConnected {
                pulseAnimation = true
            }
        }
        .onChange(of: isConnected) { connected in
            pulseAnimation = connected
        }
    }
}

/// Enhanced loading indicator with health-themed animation
struct EnhancedLoadingIndicator: View {
    let message: String
    @State private var animationRotation: Double = 0
    @State private var animationScale: CGFloat = 1.0

    var body: some View {
        VStack(spacing: ModernDesignSystem.Spacing.large) {
            ZStack {
                // Outer ring
                Circle()
                    .stroke(ModernDesignSystem.Colors.primary.opacity(0.2), lineWidth: 3)
                    .frame(width: 60, height: 60)

                // Animated arc
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(
                        LinearGradient(
                            colors: [ModernDesignSystem.Colors.primary, ModernDesignSystem.Colors.secondary],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: 60, height: 60)
                    .rotationEffect(.degrees(animationRotation))

                // Heart icon in center
                Image(systemName: "heart.fill")
                    .font(.title2)
                    .foregroundColor(ModernDesignSystem.Colors.primary)
                    .scaleEffect(animationScale)
            }

            Text(message)
                .font(ModernDesignSystem.Typography.bodyEmphasized)
                .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .onAppear {
            withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) {
                animationRotation = 360
            }
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                animationScale = 1.2
            }
        }
    }
}

/// Enhanced action button with haptic feedback
struct EnhancedActionButton: View {
    let title: String
    let icon: String?
    let style: ButtonStyle
    let action: () -> Void

    @State private var isPressed = false

    enum ButtonStyle {
        case primary, secondary, destructive, outline

        var backgroundColor: Color {
            switch self {
            case .primary: return ModernDesignSystem.Colors.primary
            case .secondary: return ModernDesignSystem.Colors.secondary
            case .destructive: return ModernDesignSystem.Colors.healthRed
            case .outline: return Color.clear
            }
        }

        var foregroundColor: Color {
            switch self {
            case .primary, .secondary, .destructive: return .white
            case .outline: return ModernDesignSystem.Colors.primary
            }
        }

        var borderColor: Color {
            switch self {
            case .outline: return ModernDesignSystem.Colors.primary
            default: return Color.clear
            }
        }
    }

    var body: some View {
        Button(action: {
            // Add haptic feedback
            let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
            impactFeedback.impactOccurred()
            action()
        }) {
            HStack(spacing: ModernDesignSystem.Spacing.xSmall) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.body.weight(.medium))
                }

                Text(title)
                    .font(ModernDesignSystem.Typography.bodyEmphasized)
            }
            .foregroundColor(style.foregroundColor)
            .padding(.horizontal, ModernDesignSystem.Spacing.large)
            .padding(.vertical, ModernDesignSystem.Spacing.medium)
            .background {
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                    .fill(style.backgroundColor)
                    .overlay {
                        RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                            .stroke(style.borderColor, lineWidth: style == .outline ? 2 : 0)
                    }
            }
            .scaleEffect(isPressed ? 0.96 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
        }
        .buttonStyle(.plain)
        .onPressGesture(
            onPressingChanged: { pressing in
                isPressed = pressing
            }
        )
    }
}

// MARK: - Extension for Press Gesture
extension View {
    func onPressGesture(onPressingChanged: @escaping (Bool) -> Void) -> some View {
        self.simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in onPressingChanged(true) }
                .onEnded { _ in onPressingChanged(false) }
        )
    }
}

// MARK: - Preview Support
#if DEBUG
struct EnhancedUIComponents_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedMetricCard(
                    title: "Heart Rate",
                    value: "72",
                    unit: "BPM",
                    trend: .stable,
                    status: .good,
                    icon: "heart.fill",
                    action: {}
                )

                EnhancedConnectionStatus(
                    isConnected: true,
                    title: "VitalSense Server",
                    subtitle: "Real-time monitoring active",
                    dataRate: "24"
                )

                EnhancedLoadingIndicator(message: "Analyzing health data...")

                EnhancedActionButton(
                    title: "Start Monitoring",
                    icon: "play.fill",
                    style: .primary,
                    action: {}
                )
            }
            .padding()
        }
        .background(ModernDesignSystem.Colors.background)
    }
}
#endif
