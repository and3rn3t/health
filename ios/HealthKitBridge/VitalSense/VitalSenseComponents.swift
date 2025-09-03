import SwiftUI

// MARK: - VitalSense Interactive Components with Enhanced Interactivity

/// Animated VitalSense logo with breathing effect and interactive features
struct VitalSenseLogo: View {
    @State private var isAnimating = false
    @State private var tapCount = 0
    @State private var showEasterEgg = false
    @State private var logoRotation: Double = 0
    let size: CGFloat
    let showText: Bool

    init(size: CGFloat = 120, showText: Bool = true) {
        self.size = size
        self.showText = showText
    }

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.medium) {
            // Interactive animated logo icon
            ZStack {
                // Outer pulsing ring with tap interaction
                Circle()
                    .stroke(VitalSenseBrand.Colors.primary.opacity(0.3), lineWidth: 2)
                    .frame(width: size * 1.2, height: size * 1.2)
                    .scaleEffect(isAnimating ? 1.1 : 1.0)
                    .opacity(isAnimating ? 0.5 : 0.8)
                    .animation(VitalSenseBrand.Animations.breathe, value: isAnimating)

                // Easter egg rainbow ring
                if showEasterEgg {
                    Circle()
                        .stroke(
                            AngularGradient(
                                colors: [.red, .orange, .yellow, .green, .blue, .purple, .red],
                                center: .center
                            ),
                            lineWidth: 4
                        )
                        .frame(width: size * 1.3, height: size * 1.3)
                        .rotationEffect(.degrees(logoRotation))
                        .animation(.linear(duration: 3).repeatForever(autoreverses: false), value: logoRotation)
                }

                // Main logo background with interactive scaling
                Circle()
                    .fill(VitalSenseBrand.Colors.primaryGradient)
                    .frame(width: size, height: size)
                    .shadow(
                        color: VitalSenseBrand.Colors.primary.opacity(0.3),
                        radius: 8,
                        x: 0,
                        y: 4
                    )
                    .scaleEffect(tapCount > 0 ? 1.05 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: tapCount)

                // Vital signs icon with enhanced animations
                Image(systemName: VitalSenseBrand.Icons.vitals)
                    .font(.system(size: size * 0.4, weight: .bold))
                    .foregroundColor(.white)
                    .scaleEffect(isAnimating ? 1.05 : 1.0)
                    .rotationEffect(.degrees(showEasterEgg ? logoRotation / 4 : 0))
                    .animation(VitalSenseBrand.Animations.heartbeat, value: isAnimating)
            }
            .onTapGesture {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    tapCount += 1

                    // Easter egg activation after 5 taps
                    if tapCount >= 5 && !showEasterEgg {
                        showEasterEgg = true
                        logoRotation = 360

                        // Haptic feedback
                        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
                        impactFeedback.impactOccurred()

                        // Auto-hide after 10 seconds
                        DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
                            withAnimation(.easeOut(duration: 1)) {
                                showEasterEgg = false
                                logoRotation = 0
                                tapCount = 0
                            }
                        }
                    } else {
                        // Normal tap feedback
                        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                        impactFeedback.impactOccurred()
                    }

                    // Reset tap count after delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        if tapCount < 5 {
                            tapCount = 0
                        }
                    }
                }
            }

            if showText {
                VStack(spacing: VitalSenseBrand.Layout.extraSmall) {
                    Text(showEasterEgg ? "VitalSense Pro ✨" : VitalSenseBrand.appName)
                        .font(VitalSenseBrand.Typography.title1)
                        .fontWeight(.bold)
                        .foregroundColor(showEasterEgg ? .purple : VitalSenseBrand.Colors.primary)
                        .animation(.easeInOut(duration: 0.5), value: showEasterEgg)

                    Text(showEasterEgg ? "Supercharged Health Monitoring!" : VitalSenseBrand.tagline)
                        .font(VitalSenseBrand.Typography.subheadline)
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)
                        .multilineTextAlignment(.center)
                        .animation(.easeInOut(duration: 0.5), value: showEasterEgg)
                }
            }
        }
        .onAppear {
            isAnimating = true
        }
    }
}

/// Interactive metric card with enhanced VitalSense features
struct VitalSenseMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let trend: MetricTrend?
    let gradient: LinearGradient
    let action: (() -> Void)?

    @State private var isPressed = false
    @State private var showDetail = false
    @State private var isHovered = false
    @State private var animateValue = false
    @State private var particleOffset: CGFloat = 0
    @State private var showSparkle = false
    @State private var longPressTriggered = false

    enum MetricTrend {
        case up, down, stable

        var color: Color {
            switch self {
            case .up: return VitalSenseBrand.Colors.success
            case .down: return VitalSenseBrand.Colors.error
            case .stable: return VitalSenseBrand.Colors.warning
            }
        }

        var icon: String {
            switch self {
            case .up: return "arrow.up.right"
            case .down: return "arrow.down.right"
            case .stable: return "arrow.right"
            }
        }

        var animation: Animation {
            switch self {
            case .up: return .easeInOut(duration: 0.8).repeatForever(autoreverses: true)
            case .down: return .easeInOut(duration: 1.2).repeatForever(autoreverses: true)
            case .stable: return .linear(duration: 2).repeatForever(autoreverses: false)
            }
        }
    }

    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                action?()
                showDetail = true

                // Enhanced haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()

                // Trigger sparkle effect
                showSparkle = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    showSparkle = false
                }
            }
        }) {
            ZStack {
                // Background with gradient and interactive scaling
                RoundedRectangle(cornerRadius: VitalSenseBrand.Layout.cornerRadius)
                    .fill(gradient)
                    .scaleEffect(isPressed ? 0.95 : (isHovered ? 1.02 : 1.0))
                    .shadow(
                        color: gradient.startPoint == .topLeading ?
                            VitalSenseBrand.Colors.primary.opacity(0.3) :
                            VitalSenseBrand.Colors.accent.opacity(0.3),
                        radius: isHovered ? 12 : 8,
                        x: 0,
                        y: isHovered ? 6 : 4
                    )
                    .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isPressed)
                    .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isHovered)

                // Animated background particles for active state
                if showSparkle {
                    ForEach(0..<6, id: \.self) { index in
                        Circle()
                            .fill(Color.white.opacity(0.8))
                            .frame(width: 4, height: 4)
                            .offset(
                                x: cos(Double(index) * .pi / 3) * particleOffset,
                                y: sin(Double(index) * .pi / 3) * particleOffset
                            )
                            .opacity(particleOffset > 30 ? 0 : 1)
                            .animation(
                                .easeOut(duration: 1).delay(Double(index) * 0.1),
                                value: particleOffset
                            )
                    }
                }

                VStack(spacing: VitalSenseBrand.Layout.medium) {
                    // Header with icon and trend
                    HStack {
                        HStack(spacing: VitalSenseBrand.Layout.small) {
                            Image(systemName: icon)
                                .font(.title2)
                                .foregroundColor(.white)
                                .scaleEffect(animateValue ? 1.1 : 1.0)
                                .animation(.spring(response: 0.5, dampingFraction: 0.7), value: animateValue)

                            Text(title)
                                .font(VitalSenseBrand.Typography.headline)
                                .foregroundColor(.white)
                                .fontWeight(.semibold)
                        }

                        Spacer()

                        if let trend = trend {
                            HStack(spacing: 2) {
                                Image(systemName: trend.icon)
                                    .font(.caption)
                                    .rotationEffect(.degrees(animateValue ? 10 : 0))
                                    .animation(trend.animation, value: animateValue)
                                Text("Trend")
                                    .font(.caption2)
                            }
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.white.opacity(0.2))
                            .cornerRadius(12)
                        }
                    }

                    // Value display with enhanced animations
                    HStack(alignment: .bottom, spacing: 4) {
                        Text(value)
                            .font(VitalSenseBrand.Typography.vitalsDisplay)
                            .foregroundColor(.white)
                            .fontWeight(.bold)
                            .scaleEffect(animateValue ? 1.05 : 1.0)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: animateValue)

                        if !unit.isEmpty {
                            Text(unit)
                                .font(VitalSenseBrand.Typography.footnote)
                                .foregroundColor(.white.opacity(0.8))
                                .padding(.bottom, 4)
                        }

                        Spacer()
                    }

                    // Interactive progress indicator with animation
                    GeometryReader { geometry in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(.white.opacity(0.3))
                            .frame(height: 4)
                            .overlay(
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(.white)
                                    .frame(
                                        width: geometry.size.width * (showDetail ? 1.0 : 0.7),
                                        height: 4
                                    )
                                    .animation(.spring(response: 1.0, dampingFraction: 0.8), value: showDetail),
                                alignment: .leading
                            )
                    }
                    .frame(height: 4)
                }
                .padding(VitalSenseBrand.Layout.large)
            }
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .onTapGesture {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                action?()
                showDetail = true

                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()

                // Trigger sparkle effect
                showSparkle = true
                particleOffset = 40
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    showSparkle = false
                    particleOffset = 0
                }
            }
        }
        .onLongPressGesture(minimumDuration: 0.5) {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                longPressTriggered = true

                // Strong haptic feedback for long press
                let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
                impactFeedback.impactOccurred()

                // Show additional detail or action
                // Could trigger a detailed view or additional functionality
            }
        }
        .pressEvents(
            onPress: {
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = true
                }
            },
            onRelease: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    isPressed = false
                }
            }
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovered = hovering
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.3)) {
                animateValue = true
            }
        }
    }
}
            .animation(VitalSenseBrand.Animations.quickResponse, value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .onLongPressGesture(minimumDuration: 0) { } onPressingChanged: { pressing in
            isPressed = pressing
        }
    }
}

/// Interactive status indicator with VitalSense styling
struct VitalSenseStatusIndicator: View {
    let status: HealthStatus
    let title: String
    let subtitle: String?
    @State private var isPulsing = false

    enum HealthStatus {
        case excellent, good, fair, poor, critical, unknown

        var color: Color {
            switch self {
            case .excellent: return VitalSenseBrand.Colors.success
            case .good: return VitalSenseBrand.Colors.primary
            case .fair: return VitalSenseBrand.Colors.warning
            case .poor: return VitalSenseBrand.Colors.error
            case .critical: return Color.red
            case .unknown: return VitalSenseBrand.Colors.textMuted
            }
        }

        var icon: String {
            switch self {
            case .excellent: return "checkmark.seal.fill"
            case .good: return "checkmark.circle.fill"
            case .fair: return "exclamationmark.triangle.fill"
            case .poor: return "exclamationmark.octagon.fill"
            case .critical: return "exclamationmark.triangle.fill"
            case .unknown: return "questionmark.circle.fill"
            }
        }

        var displayName: String {
            switch self {
            case .excellent: return "Excellent"
            case .good: return "Good"
            case .fair: return "Fair"
            case .poor: return "Poor"
            case .critical: return "Critical"
            case .unknown: return "Unknown"
            }
        }
    }

    var body: some View {
        HStack(spacing: VitalSenseBrand.Layout.medium) {
            // Status icon with pulsing animation
            ZStack {
                Circle()
                    .fill(status.color.opacity(0.2))
                    .frame(width: 50, height: 50)
                    .scaleEffect(isPulsing ? 1.1 : 1.0)
                    .animation(VitalSenseBrand.Animations.pulse, value: isPulsing)

                Image(systemName: status.icon)
                    .font(.title3)
                    .foregroundColor(status.color)
            }

            // Status text
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(title)
                        .font(VitalSenseBrand.Typography.headline)
                        .foregroundColor(.primary)

                    Spacer()

                    Text(status.displayName)
                        .font(VitalSenseBrand.Typography.caption1)
                        .fontWeight(.semibold)
                        .foregroundColor(status.color)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(status.color.opacity(0.1))
                        .cornerRadius(8)
                }

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(VitalSenseBrand.Typography.subheadline)
                        .foregroundColor(VitalSenseBrand.Colors.textMuted)
                }
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .vitalSenseCard()
        .onAppear {
            if status == .critical {
                isPulsing = true
            }
        }
    }
}

/// Animated progress ring with VitalSense branding
struct VitalSenseProgressRing: View {
    let progress: Double
    let title: String
    let subtitle: String
    let gradient: LinearGradient
    let size: CGFloat

    @State private var animatedProgress: Double = 0

    init(
        progress: Double,
        title: String,
        subtitle: String = "",
        gradient: LinearGradient = VitalSenseBrand.Colors.primaryGradient,
        size: CGFloat = 120
    ) {
        self.progress = min(max(progress, 0), 1)
        self.title = title
        self.subtitle = subtitle
        self.gradient = gradient
        self.size = size
    }

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.small) {
            ZStack {
                // Background ring
                Circle()
                    .stroke(
                        Color(.systemGray5),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: size, height: size)

                // Progress ring
                Circle()
                    .trim(from: 0, to: animatedProgress)
                    .stroke(
                        gradient,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: size, height: size)
                    .rotationEffect(.degrees(-90))
                    .animation(VitalSenseBrand.Animations.dramatic, value: animatedProgress)

                // Center content
                VStack(spacing: 2) {
                    Text("\(Int(animatedProgress * 100))%")
                        .font(VitalSenseBrand.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    if !subtitle.isEmpty {
                        Text(subtitle)
                            .font(VitalSenseBrand.Typography.caption2)
                            .foregroundColor(VitalSenseBrand.Colors.textMuted)
                    }
                }
            }

            Text(title)
                .font(VitalSenseBrand.Typography.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)
        }
        .onAppear {
            withAnimation(VitalSenseBrand.Animations.dramatic.delay(0.2)) {
                animatedProgress = progress
            }
        }
        .onChange(of: progress) { newValue in
            withAnimation(VitalSenseBrand.Animations.smooth) {
                animatedProgress = newValue
            }
        }
    }
}

/// Interactive floating action button with VitalSense styling
struct VitalSenseFAB: View {
    let icon: String
    let action: () -> Void
    let isExpanded: Bool
    let expandedOptions: [(String, String, () -> Void)]

    @State private var isPressed = false

    init(
        icon: String,
        action: @escaping () -> Void,
        isExpanded: Bool = false,
        expandedOptions: [(String, String, () -> Void)] = []
    ) {
        self.icon = icon
        self.action = action
        self.isExpanded = isExpanded
        self.expandedOptions = expandedOptions
    }

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.medium) {
            // Expanded options
            if isExpanded && !expandedOptions.isEmpty {
                VStack(spacing: VitalSenseBrand.Layout.small) {
                    ForEach(Array(expandedOptions.enumerated()), id: \.0) { index, option in
                        Button(action: option.2) {
                            HStack {
                                Image(systemName: option.0)
                                    .font(.system(size: 16, weight: .semibold))
                                Text(option.1)
                                    .font(VitalSenseBrand.Typography.subheadline)
                                    .fontWeight(.medium)
                            }
                            .foregroundColor(.white)
                            .padding()
                            .background(VitalSenseBrand.Colors.accent)
                            .cornerRadius(VitalSenseBrand.Layout.cornerRadiusMedium)
                        }
                        .scaleEffect(isExpanded ? 1.0 : 0.8)
                        .opacity(isExpanded ? 1.0 : 0.0)
                        .animation(
                            VitalSenseBrand.Animations.dramatic.delay(Double(index) * 0.1),
                            value: isExpanded
                        )
                    }
                }
            }

            // Main FAB
            Button(action: action) {
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 56, height: 56)
                    .background(VitalSenseBrand.Colors.primaryGradient)
                    .cornerRadius(28)
                    .shadow(
                        color: VitalSenseBrand.Colors.primary.opacity(0.4),
                        radius: isPressed ? 12 : 8,
                        x: 0,
                        y: isPressed ? 6 : 4
                    )
                    .scaleEffect(isPressed ? 0.95 : 1.0)
                    .rotationEffect(.degrees(isExpanded ? 45 : 0))
                    .animation(VitalSenseBrand.Animations.quickResponse, value: isPressed)
                    .animation(VitalSenseBrand.Animations.smooth, value: isExpanded)
            }
            .onLongPressGesture(minimumDuration: 0) { } onPressingChanged: { pressing in
                isPressed = pressing
            }
        }
    }
}

/// VitalSense-branded navigation header
struct VitalSenseNavigationHeader: View {
    let title: String
    let subtitle: String?
    let showLogo: Bool
    let actions: [(String, () -> Void)]

    init(
        title: String,
        subtitle: String? = nil,
        showLogo: Bool = false,
        actions: [(String, () -> Void)] = []
    ) {
        self.title = title
        self.subtitle = subtitle
        self.showLogo = showLogo
        self.actions = actions
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                // Logo and title
                HStack(spacing: VitalSenseBrand.Layout.medium) {
                    if showLogo {
                        VitalSenseLogo(size: 40, showText: false)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(VitalSenseBrand.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        if let subtitle = subtitle {
                            Text(subtitle)
                                .font(VitalSenseBrand.Typography.subheadline)
                                .foregroundColor(VitalSenseBrand.Colors.textMuted)
                        }
                    }
                }

                Spacer()

                // Action buttons
                HStack(spacing: VitalSenseBrand.Layout.small) {
                    ForEach(Array(actions.enumerated()), id: \.0) { _, action in
                        Button(action: action.1) {
                            Image(systemName: action.0)
                                .font(.title3)
                                .foregroundColor(VitalSenseBrand.Colors.primary)
                                .frame(width: 40, height: 40)
                                .background(Color(.systemGray6))
                                .cornerRadius(20)
                        }
                    }
                }
            }
            .padding(.horizontal, VitalSenseBrand.Layout.large)
            .padding(.vertical, VitalSenseBrand.Layout.medium)

            // Gradient line
            Rectangle()
                .fill(VitalSenseBrand.Colors.primaryGradient)
                .frame(height: 2)
        }
        .background(.ultraThinMaterial)
    }
}

// MARK: - Press Events View Modifier
struct PressEvents: ViewModifier {
    let onPress: () -> Void
    let onRelease: () -> Void

    func body(content: Content) -> some View {
        content
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in onPress() }
                    .onEnded { _ in onRelease() }
            )
    }
}

extension View {
    func pressEvents(onPress: @escaping () -> Void, onRelease: @escaping () -> Void) -> some View {
        modifier(PressEvents(onPress: onPress, onRelease: onRelease))
    }
}

/// Enhanced Interactive Floating Action Button with VitalSense styling
struct VitalSenseFloatingActionButton: View {
    let icon: String
    let action: () -> Void
    let size: CGFloat
    let isExpanded: Bool

    @State private var isPressed = false
    @State private var animateIcon = false
    @State private var showRipple = false
    @State private var rippleScale: CGFloat = 0
    @State private var particlesVisible = false
    @State private var breathingAnimation = false

    init(icon: String, action: @escaping () -> Void, size: CGFloat = 60, isExpanded: Bool = false) {
        self.icon = icon
        self.action = action
        self.size = size
        self.isExpanded = isExpanded
    }

    var body: some View {
        ZStack {
            // Ripple effect background
            if showRipple {
                Circle()
                    .fill(VitalSenseBrand.Colors.primary.opacity(0.3))
                    .frame(width: size, height: size)
                    .scaleEffect(rippleScale)
                    .opacity(rippleScale > 2 ? 0 : 0.6)
                    .animation(.easeOut(duration: 0.6), value: rippleScale)
            }

            // Breathing ring effect
            Circle()
                .stroke(VitalSenseBrand.Colors.primary.opacity(0.3), lineWidth: 2)
                .frame(width: size * 1.3, height: size * 1.3)
                .scaleEffect(breathingAnimation ? 1.1 : 1.0)
                .opacity(breathingAnimation ? 0.3 : 0.7)
                .animation(
                    .easeInOut(duration: 2).repeatForever(autoreverses: true),
                    value: breathingAnimation
                )

            // Particle effects for interactions
            if particlesVisible {
                ForEach(0..<8, id: \.self) { index in
                    Circle()
                        .fill(VitalSenseBrand.Colors.primaryGradient)
                        .frame(width: 6, height: 6)
                        .offset(
                            x: cos(Double(index) * .pi / 4) * 40,
                            y: sin(Double(index) * .pi / 4) * 40
                        )
                        .opacity(particlesVisible ? 0 : 1)
                        .scaleEffect(particlesVisible ? 2 : 0.5)
                        .animation(
                            .easeOut(duration: 0.8).delay(Double(index) * 0.05),
                            value: particlesVisible
                        )
                }
            }

            // Main button
            Button(action: {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                    action()

                    // Trigger effects
                    showRipple = true
                    rippleScale = 3
                    particlesVisible = true

                    // Haptic feedback
                    let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                    impactFeedback.impactOccurred()

                    // Reset effects
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                        showRipple = false
                        rippleScale = 0
                        particlesVisible = false
                    }
                }
            }) {
                ZStack {
                    // Background with gradient
                    Circle()
                        .fill(VitalSenseBrand.Colors.primaryGradient)
                        .frame(width: size, height: size)
                        .shadow(
                            color: VitalSenseBrand.Colors.primary.opacity(0.4),
                            radius: isPressed ? 8 : 12,
                            x: 0,
                            y: isPressed ? 3 : 6
                        )
                        .scaleEffect(isPressed ? 0.9 : 1.0)

                    // Icon with rotation animation
                    Image(systemName: icon)
                        .font(.system(size: size * 0.35, weight: .semibold))
                        .foregroundColor(.white)
                        .rotationEffect(.degrees(animateIcon ? 360 : 0))
                        .scaleEffect(isPressed ? 0.8 : 1.0)
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isPressed)
                }
            }
            .buttonStyle(PlainButtonStyle())
            .pressEvents(
                onPress: {
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = true
                    }
                },
                onRelease: {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        isPressed = false
                    }
                }
            )
            .onLongPressGesture(minimumDuration: 0.7) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                    animateIcon = true

                    // Strong haptic for long press
                    let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
                    impactFeedback.impactOccurred()

                    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                        animateIcon = false
                    }
                }
            }
        }
        .onAppear {
            breathingAnimation = true
        }
    }
}

/// Interactive Progress Ring with VitalSense styling and advanced animations
struct VitalSenseProgressRing: View {
    let progress: Double
    let lineWidth: CGFloat
    let size: CGFloat
    let gradient: LinearGradient
    let label: String
    let value: String

    @State private var animatedProgress: Double = 0
    @State private var isAnimating = false
    @State private var showPulse = false
    @State private var glowIntensity: Double = 0

    init(
        progress: Double,
        lineWidth: CGFloat = 12,
        size: CGFloat = 120,
        gradient: LinearGradient = VitalSenseBrand.Colors.primaryGradient,
        label: String,
        value: String
    ) {
        self.progress = progress
        self.lineWidth = lineWidth
        self.size = size
        self.gradient = gradient
        self.label = label
        self.value = value
    }

    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(VitalSenseBrand.Colors.textMuted.opacity(0.2), lineWidth: lineWidth)
                .frame(width: size, height: size)

            // Animated glow effect
            Circle()
                .stroke(gradient.opacity(glowIntensity), lineWidth: lineWidth * 1.5)
                .frame(width: size, height: size)
                .blur(radius: 4)
                .animation(
                    .easeInOut(duration: 2).repeatForever(autoreverses: true),
                    value: glowIntensity
                )

            // Progress ring with animated fill
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(
                    gradient,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
                .scaleEffect(showPulse ? 1.05 : 1.0)
                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: showPulse)

            // Center content
            VStack(spacing: 4) {
                Text(value)
                    .font(.system(size: size * 0.2, weight: .bold, design: .rounded))
                    .foregroundStyle(gradient)
                    .scaleEffect(isAnimating ? 1.1 : 1.0)
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isAnimating)

                Text(label)
                    .font(.system(size: size * 0.08, weight: .medium))
                    .foregroundColor(VitalSenseBrand.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 1.2, dampingFraction: 0.8)) {
                animatedProgress = progress
                isAnimating = true
                glowIntensity = 0.4
            }

            // Pulse effect when near completion
            if progress > 0.8 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation(.easeInOut(duration: 0.3).repeatCount(3, autoreverses: true)) {
                        showPulse = true
                    }
                }
            }
        }
        .onChange(of: progress) { newProgress in
            withAnimation(.spring(response: 0.8, dampingFraction: 0.8)) {
                animatedProgress = newProgress

                if newProgress > 0.9 {
                    // Success haptic feedback
                    let successFeedback = UINotificationFeedbackGenerator()
                    successFeedback.notificationOccurred(.success)
                }
            }
        }
        .onTapGesture {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                isAnimating.toggle()

                // Light haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                impactFeedback.impactOccurred()
            }
        }
    }
}
