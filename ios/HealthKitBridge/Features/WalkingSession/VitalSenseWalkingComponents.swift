import SwiftUI
import MapKit

// MARK: - VitalSense Walking Session Components

struct VitalSenseWalkingHeader: View {
    let isTracking: Bool
    let metrics: SessionMetrics?
    let onSettingsTap: () -> Void
    let onHistoryTap: () -> Void
    @State private var animateHeader = false

    var body: some View {
        HStack {
            // VitalSense Logo
            VitalSenseLogo(size: .medium)

            Spacer()

            // Session Status
            HStack(spacing: VitalSenseBrand.Layout.small) {
                Circle()
                    .fill(isTracking ? VitalSenseBrand.Colors.success : VitalSenseBrand.Colors.textMuted)
                    .frame(width: 8, height: 8)
                    .scaleEffect(animateHeader ? 1.2 : 1.0)
                    .animation(
                        isTracking ?
                        VitalSenseBrand.Animations.pulse.repeatForever(autoreverses: true) :
                        .default,
                        value: animateHeader
                    )

                Text(isTracking ? "Recording" : "Ready")
                    .font(VitalSenseBrand.Typography.caption)
                    .foregroundStyle(Color.white)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, VitalSenseBrand.Layout.medium)
            .padding(.vertical, VitalSenseBrand.Layout.small)
            .background(Color.white.opacity(0.2))
            .cornerRadius(VitalSenseBrand.Layout.cornerRadius)

            // Action buttons
            HStack(spacing: VitalSenseBrand.Layout.small) {
                Button(action: onHistoryTap) {
                    Image(systemName: "clock.arrow.circlepath")
                        .foregroundStyle(Color.white)
                        .font(.title3)
                }

                Button(action: onSettingsTap) {
                    Image(systemName: "gearshape.fill")
                        .foregroundStyle(Color.white)
                        .font(.title3)
                }
            }
        }
        .padding(VitalSenseBrand.Layout.large)
        .onAppear {
            animateHeader = true
        }
    }
}

struct VitalSenseSessionStatusBar: View {
    let isTracking: Bool
    let metrics: SessionMetrics?
    @State private var animateMetrics = false
    @State private var selectedMetricIndex = 0
    @State private var showMetricDetail = false
    @State private var metricPulse = false

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.medium) {
            // Main metrics row with tap interactions
            HStack(spacing: VitalSenseBrand.Layout.large) {
                // Duration - Interactive
                VitalSenseInteractiveQuickMetric(
                    icon: "stopwatch",
                    value: formatDuration(metrics?.duration ?? 0),
                    label: "Duration",
                    color: VitalSenseBrand.Colors.primary,
                    isSelected: selectedMetricIndex == 0,
                    isTracking: isTracking
                ) {
                    selectMetric(0)
                }

                // Distance - Interactive
                VitalSenseInteractiveQuickMetric(
                    icon: "location",
                    value: formatDistance(metrics?.distance ?? 0),
                    label: "Distance",
                    color: VitalSenseBrand.Colors.accent,
                    isSelected: selectedMetricIndex == 1,
                    isTracking: isTracking
                ) {
                    selectMetric(1)
                }

                // Speed - Interactive
                VitalSenseInteractiveQuickMetric(
                    icon: "speedometer",
                    value: formatSpeed(metrics?.currentSpeed ?? 0),
                    label: "Speed",
                    color: VitalSenseBrand.Colors.success,
                    isSelected: selectedMetricIndex == 2,
                    isTracking: isTracking
                ) {
                    selectMetric(2)
                }

                // Steps - Interactive
                VitalSenseInteractiveQuickMetric(
                    icon: "figure.walk",
                    value: "\(metrics?.stepCount ?? 0)",
                    label: "Steps",
                    color: VitalSenseBrand.Colors.warning,
                    isSelected: selectedMetricIndex == 3,
                    isTracking: isTracking
                ) {
                    selectMetric(3)
                }
            }

            // Enhanced detail view for selected metric
            if showMetricDetail {
                VitalSenseMetricDetailCard(
                    selectedMetricIndex: selectedMetricIndex,
                    metrics: metrics,
                    isTracking: isTracking
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(VitalSenseBrand.Colors.cardBackground)
        .scaleEffect(animateMetrics ? 1.0 : 0.9)
        .opacity(animateMetrics ? 1.0 : 0.0)
        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: animateMetrics)
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.2)) {
                animateMetrics = true
            }
        }
        .gesture(
            // Swipe down to show/hide detail
            DragGesture()
                .onEnded { value in
                    if abs(value.translation.y) > 30 {
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                            if value.translation.y > 0 {
                                showMetricDetail = true
                            } else {
                                showMetricDetail = false
                            }
                        }
                    }
                }
        )
    }

    private func selectMetric(_ index: Int) {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
            selectedMetricIndex = index
            showMetricDetail = true

            // Haptic feedback
            let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
            impactFeedback.impactOccurred()
        }
    }
            )
        }
        .padding(VitalSenseBrand.Layout.medium)
        .background(VitalSenseBrand.Colors.cardBackground)
        .scaleEffect(animateMetrics ? 1.0 : 0.9)
        .opacity(animateMetrics ? 1.0 : 0.0)
        .animation(VitalSenseBrand.Animations.spring, value: animateMetrics)
        .onAppear {
            withAnimation(VitalSenseBrand.Animations.spring.delay(0.2)) {
                animateMetrics = true
            }
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        let seconds = Int(duration) % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }

    private func formatDistance(_ distance: Double) -> String {
        if distance >= 1000 {
            return String(format: "%.2f km", distance / 1000)
        } else {
            return String(format: "%.0f m", distance)
        }
    }

    private func formatSpeed(_ speed: Double) -> String {
        return String(format: "%.1f km/h", speed * 3.6)
    }
}

struct VitalSenseQuickMetric: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.small) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)

            Text(value)
                .font(VitalSenseBrand.Typography.heading3)
                .fontWeight(.bold)
                .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

            Text(label)
                .font(VitalSenseBrand.Typography.caption)
                .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - VitalSense Tab View Extension
extension View {
    func vitalSenseTabItem(icon: String, title: String, tag: SessionTab) -> some View {
        self.tabItem {
            Image(systemName: icon)
                .foregroundStyle(VitalSenseBrand.Colors.primary)
            Text(title)
                .font(VitalSenseBrand.Typography.caption)
        }
        .tag(tag)
    }
}

struct VitalSenseTabView<Content: View>: View {
    @Binding var selection: SessionTab
    let content: Content

    init(selection: Binding<SessionTab>, @ViewBuilder content: () -> Content) {
        self._selection = selection
        self.content = content()
    }

    var body: some View {
        TabView(selection: $selection) {
            content
        }
        .accentColor(VitalSenseBrand.Colors.primary)
    }
}

// MARK: - Session Tab Enum
enum SessionTab: String, CaseIterable {
    case overview = "overview"
    case realTime = "realTime"
    case map = "map"
    case analysis = "analysis"

    var title: String {
        switch self {
        case .overview: return "Overview"
        case .realTime: return "Live Data"
        case .map: return "Route"
        case .analysis: return "Analysis"
        }
    }

    var icon: String {
        switch self {
        case .overview: return "chart.line.uptrend.xyaxis"
        case .realTime: return "waveform.path.ecg"
        case .map: return "map"
        case .analysis: return "brain.head.profile"
        }
    }
}

/// Enhanced Interactive Quick Metric with animations and tap response
struct VitalSenseInteractiveQuickMetric: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    let isSelected: Bool
    let isTracking: Bool
    let action: () -> Void

    @State private var isPressed = false
    @State private var animateValue = false
    @State private var showPulse = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: VitalSenseBrand.Layout.small) {
                // Icon with enhanced animations
                ZStack {
                    Circle()
                        .fill(isSelected ? color.opacity(0.2) : Color.clear)
                        .frame(width: 40, height: 40)
                        .scaleEffect(showPulse ? 1.2 : 1.0)
                        .animation(
                            isTracking ?
                            .easeInOut(duration: 1.5).repeatForever(autoreverses: true) :
                            .default,
                            value: showPulse
                        )

                    Image(systemName: icon)
                        .foregroundStyle(isSelected ? color : color.opacity(0.8))
                        .font(.title3)
                        .fontWeight(isSelected ? .bold : .medium)
                        .scaleEffect(animateValue ? 1.1 : 1.0)
                        .rotationEffect(.degrees(isPressed ? 5 : 0))
                        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: animateValue)
                        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
                }

                // Value with count-up animation effect
                Text(value)
                    .font(VitalSenseBrand.Typography.heading3)
                    .fontWeight(.bold)
                    .foregroundStyle(isSelected ? color : VitalSenseBrand.Colors.textPrimary)
                    .scaleEffect(isSelected ? 1.05 : 1.0)
                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isSelected)

                // Label
                Text(label)
                    .font(VitalSenseBrand.Typography.caption)
                    .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                    .fontWeight(isSelected ? .semibold : .medium)
                    .animation(.easeInOut(duration: 0.3), value: isSelected)
            }
            .frame(maxWidth: .infinity)
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .pressEvents(
            onPress: {
                isPressed = true
                let impactFeedback = UIImpactFeedbackGenerator(style: .light)
                impactFeedback.impactOccurred()
            },
            onRelease: {
                isPressed = false
            }
        )
        .onAppear {
            if isTracking {
                showPulse = true
            }

            // Animate value on appearance
            withAnimation(.spring(response: 0.8, dampingFraction: 0.6).delay(0.1)) {
                animateValue = true
            }
        }
        .onChange(of: isTracking) { tracking in
            showPulse = tracking
        }
        .onChange(of: value) { _ in
            // Animate when value changes
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                animateValue.toggle()
            }
        }
    }
}
