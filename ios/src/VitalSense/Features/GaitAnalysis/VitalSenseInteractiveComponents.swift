import SwiftUI

// MARK: - Enhanced Interactive Components for VitalSense

/// Interactive header with enhanced animations and gestures
struct VitalSenseInteractiveHeader: View {
    let title: String
    let subtitle: String
    @Binding var showingTrends: Bool
    @Binding var animateMetrics: Bool

    @State private var headerScale: CGFloat = 1.0
    @State private var showModeIndicator = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.small) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(VitalSenseBrand.Typography.heading1)
                        .fontWeight(.bold)
                        .foregroundStyle(VitalSenseBrand.Colors.textPrimary)
                        .scaleEffect(headerScale)
                        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: headerScale)

                    Text(subtitle)
                        .font(VitalSenseBrand.Typography.body)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                }

                Spacer()

                // Interactive toggle button with enhanced animations
                Button(action: {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                        showingTrends.toggle()
                        headerScale = 1.1
                        showModeIndicator = true
                        triggerHapticFeedback(.medium)

                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            headerScale = 1.0
                        }

                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            showModeIndicator = false
                        }
                    }
                }) {
                    ZStack {
                        Circle()
                            .fill(VitalSenseBrand.Colors.primaryGradient)
                            .frame(width: 44, height: 44)
                            .shadow(
                                color: VitalSenseBrand.Colors.primary.opacity(0.3),
                                radius: animateMetrics ? 8 : 4,
                                x: 0,
                                y: 2
                            )

                        Image(systemName: showingTrends ? "chart.bar.fill" : "chart.line.uptrend.xyaxis")
                            .foregroundStyle(Color.white)
                            .font(.system(size: 18, weight: .semibold))
                            .rotationEffect(.degrees(showingTrends ? 180 : 0))
                            .scaleEffect(animateMetrics ? 1.1 : 1.0)
                            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: showingTrends)
                            .animation(
                                .easeInOut(duration: 1.5).repeatForever(autoreverses: true),
                                value: animateMetrics
                            )
                    }
                }
                .buttonStyle(PlainButtonStyle())
            }

            // Mode indicator
            if showModeIndicator {
                HStack {
                    Image(systemName: showingTrends ? "chart.line.uptrend.xyaxis" : "grid")
                        .foregroundStyle(VitalSenseBrand.Colors.primary)
                        .font(.caption)

                    Text(showingTrends ? "Viewing trends" : "Viewing metrics")
                        .font(VitalSenseBrand.Typography.caption)
                        .foregroundStyle(VitalSenseBrand.Colors.textSecondary)

                    Spacer()
                }
                .padding(.horizontal, VitalSenseBrand.Layout.medium)
                .padding(.vertical, VitalSenseBrand.Layout.small)
                .background(VitalSenseBrand.Colors.primary.opacity(0.1))
                .cornerRadius(VitalSenseBrand.Layout.cornerRadius)
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            // Swipe hint indicator
            HStack {
                Text("👈 Swipe for trends")
                    .font(VitalSenseBrand.Typography.caption)
                    .foregroundStyle(VitalSenseBrand.Colors.textMuted)

                Spacer()

                Text("Metrics 👉")
                    .font(VitalSenseBrand.Typography.caption)
                    .foregroundStyle(VitalSenseBrand.Colors.textMuted)
            }
            .opacity(0.6)
            .padding(.top, VitalSenseBrand.Layout.small)
        }
        .onAppear {
            animateMetrics = true
        }
    }
}

/// Enhanced metric selector with swipe feedback
struct VitalSenseEnhancedMetricSelectorView: View {
    @Binding var selectedMetric: GaitMetricType
    let lastSwipeDirection: DetailedGaitMetricsCard.SwipeDirection?

    @State private var animateButtons = false
    @State private var highlightSwipeDirection = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Text("Focus Metric")
                    .font(VitalSenseBrand.Typography.heading3)
                    .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                Spacer()

                // Swipe direction indicator
                if highlightSwipeDirection, let direction = lastSwipeDirection {
                    HStack(spacing: 4) {
                        Image(systemName: swipeIcon(for: direction))
                            .foregroundStyle(VitalSenseBrand.Colors.success)
                            .font(.caption)

                        Text(swipeDescription(for: direction))
                            .font(VitalSenseBrand.Typography.caption)
                            .foregroundStyle(VitalSenseBrand.Colors.success)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(VitalSenseBrand.Colors.success.opacity(0.1))
                    .cornerRadius(8)
                    .transition(.scale.combined(with: .opacity))
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: VitalSenseBrand.Layout.medium) {
                    ForEach(GaitMetricType.allCases.indices, id: \.self) { index in
                        let metric = GaitMetricType.allCases[index]
                        VitalSenseEnhancedMetricButton(
                            metric: metric,
                            isSelected: selectedMetric == metric
                        ) {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                                selectedMetric = metric
                                triggerHapticFeedback(.light)
                            }
                        }
                        .scaleEffect(animateButtons ? 1.0 : 0.8)
                        .opacity(animateButtons ? 1.0 : 0.0)
                        .animation(
                            .spring(response: 0.6, dampingFraction: 0.8).delay(Double(index) * 0.05),
                            value: animateButtons
                        )
                    }
                }
                .padding(.horizontal, VitalSenseBrand.Layout.medium)
            }
        }
        .onAppear {
            withAnimation {
                animateButtons = true
            }
        }
        .onChange(of: lastSwipeDirection) { _ in
            if lastSwipeDirection != nil {
                withAnimation(.easeInOut(duration: 0.3)) {
                    highlightSwipeDirection = true
                }

                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        highlightSwipeDirection = false
                    }
                }
            }
        }
    }

    private func swipeIcon(for direction: DetailedGaitMetricsCard.SwipeDirection) -> String {
        switch direction {
        case .left: return "arrow.left"
        case .right: return "arrow.right"
        case .up: return "arrow.up"
        case .down: return "arrow.down"
        }
    }

    private func swipeDescription(for direction: DetailedGaitMetricsCard.SwipeDirection) -> String {
        switch direction {
        case .left: return "Trends view"
        case .right: return "Metrics view"
        case .up: return "Detail view"
        case .down: return "Minimized"
        }
    }
}

/// Enhanced metric button with advanced interactions
struct VitalSenseEnhancedMetricButton: View {
    let metric: GaitMetricType
    let isSelected: Bool
    let action: () -> Void

    @State private var isPressed = false
    @State private var showTooltip = false
    @State private var pulseAnimation = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: VitalSenseBrand.Layout.small) {
                // Icon with enhanced animations
                ZStack {
                    Circle()
                        .fill(isSelected ? metric.vitalSenseGradient : VitalSenseBrand.Colors.cardBackground)
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(
                                    metric.vitalSenseColor.opacity(isSelected ? 0 : 0.3),
                                    lineWidth: 1
                                )
                        )
                        .scaleEffect(pulseAnimation ? 1.1 : 1.0)
                        .animation(
                            isSelected ?
                            .easeInOut(duration: 1).repeatForever(autoreverses: true) :
                            .default,
                            value: pulseAnimation
                        )

                    Image(systemName: metric.vitalSenseIcon)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(
                            isSelected ? Color.white : metric.vitalSenseColor
                        )
                        .rotationEffect(.degrees(isPressed ? 15 : 0))
                        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
                }

                // Label
                Text(metric.displayName)
                    .font(VitalSenseBrand.Typography.caption)
                    .fontWeight(isSelected ? .semibold : .medium)
                    .foregroundStyle(
                        isSelected ? metric.vitalSenseColor : VitalSenseBrand.Colors.textSecondary
                    )
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(width: 80)
            .scaleEffect(isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .pressEvents(
            onPress: {
                isPressed = true
                triggerHapticFeedback(.light)
            },
            onRelease: {
                isPressed = false
            }
        )
        .onLongPressGesture(minimumDuration: 0.5) {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                showTooltip = true
                triggerHapticFeedback(.medium)

                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    showTooltip = false
                }
            }
        }
        .overlay(
            // Tooltip overlay
            Group {
                if showTooltip {
                    VStack {
                        Text(metric.displayName)
                            .font(VitalSenseBrand.Typography.caption)
                            .fontWeight(.medium)
                            .foregroundStyle(Color.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(VitalSenseBrand.Colors.textPrimary)
                            .cornerRadius(6)

                        Spacer()
                    }
                    .offset(y: -60)
                    .transition(.scale.combined(with: .opacity))
                }
            }
        )
        .onAppear {
            if isSelected {
                pulseAnimation = true
            }
        }
        .onChange(of: isSelected) { selected in
            pulseAnimation = selected
        }
    }
}

/// Interactive analysis view with gesture support
struct VitalSenseInteractiveAnalysisView: View {
    let gaitMetrics: GaitMetrics
    let selectedMetric: GaitMetricType
    @Binding var showDetailView: Bool

    @State private var analysisScale: CGFloat = 1.0
    @State private var showExpandHint = false

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            HStack {
                Text("AI Analysis")
                    .font(VitalSenseBrand.Typography.heading3)
                    .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                Spacer()

                if showExpandHint {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up")
                            .font(.caption)
                        Text("Swipe up for details")
                            .font(VitalSenseBrand.Typography.caption)
                    }
                    .foregroundStyle(VitalSenseBrand.Colors.textMuted)
                    .transition(.opacity)
                }
            }

            VitalSenseDetailedMetricAnalysisView(
                gaitMetrics: gaitMetrics,
                selectedMetric: selectedMetric
            )
            .scaleEffect(analysisScale)
            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: analysisScale)
            .onTapGesture(count: 2) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                    showDetailView = true
                    triggerHapticFeedback(.heavy)
                }
            }
            .onLongPressGesture(minimumDuration: 0.3) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    analysisScale = 1.05
                    showExpandHint = true
                    triggerHapticFeedback(.medium)

                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        analysisScale = 1.0
                    }

                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        showExpandHint = false
                    }
                }
            }
        }
    }
}

// MARK: - Haptic Feedback Helper
func triggerHapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
    let impactFeedback = UIImpactFeedbackGenerator(style: style)
    impactFeedback.impactOccurred()
}

// MARK: - Press Events Extension
extension VitalSenseEnhancedMetricButton {
    func pressEvents(onPress: @escaping () -> Void, onRelease: @escaping () -> Void) -> some View {
        self.modifier(PressEvents(onPress: onPress, onRelease: onRelease))
    }
}

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
