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
                    .modifier(ReducedMotionPulse(active: isTracking && animateHeader))

                Text(isTracking ? loc("walk_status_recording") : loc("walk_status_ready"))
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
        .onAppear { animateHeader = true }
    }
}

struct VitalSenseSessionStatusBar: View {
    let isTracking: Bool
    let metrics: SessionMetrics?
    // Simple loading & error simulation placeholders (could be replaced with real state bindings later)
    var isLoading: Bool = false
    var error: Error? = nil
    @State private var animateMetrics = false
    @State private var selectedMetricIndex = 0
    @State private var showMetricDetail = false
    @State private var metricPulse = false

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.medium) {
            if let error {
                ErrorStateView(onRetry: { /* TODO: inject retry */ })
                    .frame(height: 140)
            } else if isLoading {
                ProgressView()
                    .progressViewStyle(.circular)
                    .frame(height: 120)
                    .accessibilityLabel(Text(loc("walk_tab_overview")))
            } else if metrics == nil {
                EmptyStateView(titleKey: "empty_no_data", messageKey: "empty_tap_retry", icon: "figure.walk")
                    .frame(height: 140)
            }
            // Main metrics row with tap interactions
            HStack(spacing: VitalSenseBrand.Layout.large) {
                // Duration - Interactive
                VitalSenseInteractiveQuickMetric(
                    icon: "stopwatch",
                    value: formatDuration(metrics?.duration ?? 0),
                    label: loc("walk_metric_duration"),
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
                    label: loc("walk_metric_distance"),
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
                    label: loc("walk_metric_speed"),
                    color: VitalSenseBrand.Colors.success,
                    isSelected: selectedMetricIndex == 2,
                    isTracking: isTracking
                ) {
                    selectMetric(2)
                }

                // Steps - Interactive
                let stepValue = metrics?.stepCount ?? 0
                VitalSenseInteractiveQuickMetric(
                    icon: "figure.walk",
                    value: locPlural(baseKey: "steps_count", count: stepValue),
                    label: loc("walk_metric_steps"),
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
        MotionPreferences.perform(animation: .spring(response: 0.4, dampingFraction: 0.7)) {
            selectedMetricIndex = index
            showMetricDetail = true
            Haptics.shared.trigger(.selection)
            // Telemetry instrumentation for metric selection
            let name: String
            switch index {
            case 0: name = "duration"
            case 1: name = "distance"
            case 2: name = "speed"
            case 3: name = "steps"
            default: name = "unknown"
            }
            Telemetry.shared.record(.metricSelect(name: name))
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
    case overview
    case realTime
    case map
    case analysis

    var title: String {
        switch self {
        case .overview: return loc("walk_tab_overview")
        case .realTime: return loc("walk_tab_live")
        case .map: return loc("walk_tab_route")
        case .analysis: return loc("walk_tab_analysis")
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
                        .modifier(ReducedMotionPulse(active: isTracking && showPulse))

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
        .accessibilityElement(children: .combine)
        .accessibilityLabel(Text("\(label): \(value)"))
        .onChange(of: value) { _ in
            // Animate when value changes
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                animateValue.toggle()
            }
        }
    }
}

// MARK: - Reduced Motion Pulse Modifier
private struct ReducedMotionPulse: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let active: Bool
    func body(content: Content) -> some View {
        if reduceMotion || !active {
            content
        } else {
            content.animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: active)
        }
    }
}
