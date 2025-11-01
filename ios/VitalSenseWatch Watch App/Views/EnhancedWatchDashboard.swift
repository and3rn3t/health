import SwiftUI
import HealthKit
import WatchConnectivity
import Combine

// MARK: - Enhanced Apple Watch Dashboard

struct EnhancedWatchDashboard: View {
    @StateObject private var healthManager = WatchHealthManager.shared
    @StateObject private var connectivityManager = WatchAppConnectivityManager.shared
    @State private var selectedTab = 0
    @State private var animateHeartRate = false

    var body: some View {
        NavigationView {
            TabView(selection: $selectedTab) {
                // Overview Tab
                overviewTab
                    .tag(0)

                // Metrics Tab
                metricsTab
                    .tag(1)

                // Quick Actions Tab
                actionsTab
                    .tag(2)
            }
            .tabViewStyle(.page)
            .navigationTitle("VitalSense")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            startAnimations()
        }
    }

    // MARK: - Overview Tab
    private var overviewTab: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Connection status
                connectionStatusCard
                    .padding(.horizontal, 4)

                // Primary metrics
                primaryMetricsGrid
                    .padding(.horizontal, 4)

                // Quick sync button
                syncButton
                    .padding(.horizontal, 4)
            }
            .padding(.vertical, 8)
        }
        .navigationTitle("Overview")
    }

    // MARK: - Metrics Tab
    private var metricsTab: some View {
        ScrollView {
            VStack(spacing: 8) {
                // Detailed metrics
                detailedMetricsStack
                    .padding(.horizontal, 4)
            }
            .padding(.vertical, 8)
        }
        .navigationTitle("Metrics")
    }

    // MARK: - Actions Tab
    private var actionsTab: some View {
        VStack(spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.secondary)

            VStack(spacing: 12) {
                WatchActionButton(
                    title: "Start Workout",
                    icon: "play.fill",
                    color: .green
                ) {
                    startWorkout()
                }

                WatchActionButton(
                    title: "Emergency",
                    icon: "sos",
                    color: .red
                ) {
                    triggerEmergency()
                }

                WatchActionButton(
                    title: "Sync iPhone",
                    icon: "arrow.triangle.2.circlepath",
                    color: .blue
                ) {
                    syncWithiPhone()
                }
            }
        }
        .padding()
        .navigationTitle("Actions")
    }

    // MARK: - Connection Status Card (iOS 26 Enhanced)
    private var connectionStatusCard: some View {
        VStack(spacing: 6) {
            HStack {
                if #available(iOS 26.0, watchOS 13.0, *) {
                    // iOS 26 Enhanced status indicator with Variable Draw
                    Image(systemName: connectivityManager.isConnected ? "wifi" : "wifi.slash")
                        .font(.caption2)
                        .foregroundStyle(
                            iOS26Integration.gradientStyle(
                                for: connectivityManager.isConnected ? .success : .destructive
                            )
                        )
                        .symbolEffect(
                            .variableColor.iterative.dimInactiveLayers.nonReversing,
                            options: .speed(connectivityManager.isConnected ? 1.5 : 0.5),
                            value: animateHeartRate
                        )
                } else {
                    Circle()
                        .fill(connectivityManager.isConnected ? .green : .red)
                        .frame(width: 6, height: 6)
                        .scaleEffect(connectivityManager.isConnected && animateHeartRate ? 1.3 : 1.0)
                        .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animateHeartRate)
                }

                Text(connectivityManager.isConnected ? "iPhone Connected" : "Disconnected")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Spacer()
            }

            if connectivityManager.isConnected {
                HStack {
                    Text("Sync: \(connectivityManager.lastSyncTime, style: .relative) ago")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Spacer()
                }
            }
        }
        .padding(8)
        .background {
            RoundedRectangle(cornerRadius: 8)
                .fill(
                    if #available(iOS 26.0, watchOS 13.0, *) {
                        iOS26Integration.liquidGlassMaterial()
                    } else {
                        .regularMaterial
                    }
                )
        }
    }

    // MARK: - Primary Metrics Grid (iOS 26 Enhanced)
    private var primaryMetricsGrid: some View {
        if #available(iOS 26.0, watchOS 13.0, *) {
            // iOS 26 Enhanced Watch Metrics with Variable Draw
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    iOS26WatchMetricCard(
                        title: "Heart Rate",
                        value: "\(Int(healthManager.currentHeartRate))",
                        unit: "BPM",
                        symbol: "heart.fill",
                        color: .red,
                        variableValue: Double(healthManager.currentHeartRate) / 180.0,
                        animate: animateHeartRate
                    )

                    iOS26WatchMetricCard(
                        title: "Steps",
                        value: "\(Int(healthManager.todaySteps))",
                        unit: "",
                        symbol: "figure.walk",
                        color: .green,
                        variableValue: min(Double(healthManager.todaySteps) / 10000.0, 1.0),
                        animate: true
                    )
                }

                HStack(spacing: 8) {
                    iOS26WatchMetricCard(
                        title: "Active",
                        value: "\(Int(healthManager.activeEnergyBurned))",
                        unit: "cal",
                        symbol: "flame.fill",
                        color: .orange,
                        variableValue: min(Double(healthManager.activeEnergyBurned) / 500.0, 1.0),
                        animate: true
                    )

                    iOS26WatchMetricCard(
                        title: "Exercise",
                        value: "\(Int(healthManager.exerciseMinutes))",
                        unit: "min",
                        symbol: "stopwatch.fill",
                        color: .blue,
                        variableValue: min(Double(healthManager.exerciseMinutes) / 30.0, 1.0),
                        animate: true
                    )
                }
            }
        } else {
            // Fallback to existing implementation
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    WatchMetricCard(
                        title: "Heart Rate",
                        value: "\(Int(healthManager.currentHeartRate))",
                        unit: "BPM",
                        icon: "heart.fill",
                        color: .red,
                        animate: animateHeartRate
                    )

                    WatchMetricCard(
                        title: "Steps",
                        value: "\(Int(healthManager.todaySteps))",
                        unit: "",
                        icon: "figure.walk",
                        color: .green,
                        animate: false
                    )
                }

                HStack(spacing: 8) {
                    WatchMetricCard(
                        title: "Active",
                        value: "\(Int(healthManager.activeEnergyBurned))",
                        unit: "cal",
                        icon: "flame.fill",
                        color: .orange,
                        animate: false
                    )

                    WatchMetricCard(
                        title: "Exercise",
                        value: "\(Int(healthManager.exerciseMinutes))",
                        unit: "min",
                        icon: "stopwatch.fill",
                        color: .blue,
                        animate: false
                    )
                }
            }
        }
    }

    // MARK: - Detailed Metrics Stack
    private var detailedMetricsStack: some View {
        VStack(spacing: 8) {
            WatchDetailCard(
                title: "Resting Heart Rate",
                value: "65",
                unit: "BPM",
                trend: .stable,
                icon: "heart.circle"
            )

            WatchDetailCard(
                title: "Heart Rate Variability",
                value: "42",
                unit: "ms",
                trend: .up,
                icon: "waveform.path.ecg"
            )

            WatchDetailCard(
                title: "Walking Steadiness",
                value: "92",
                unit: "%",
                trend: .stable,
                icon: "figure.walk.motion"
            )

            WatchDetailCard(
                title: "Distance",
                value: "5.2",
                unit: "km",
                trend: .up,
                icon: "location.fill"
            )
        }
    }

    // MARK: - Sync Button
    private var syncButton: some View {
        Button(action: syncWithiPhone) {
            HStack {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.caption)
                Text("Sync with iPhone")
                    .font(.caption)
            }
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background {
                Capsule()
                    .fill(.blue)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helper Methods
    private func startAnimations() {
        animateHeartRate = true
    }

    private func startWorkout() {
        // Start workout logic
        let impactFeedback = WKInterfaceDevice.current().play(.click)
    }

    private func triggerEmergency() {
        // Emergency logic
        let impactFeedback = WKInterfaceDevice.current().play(.failure)
    }

    private func syncWithiPhone() {
        // Sync logic
        connectivityManager.syncWithiPhone()
        let impactFeedback = WKInterfaceDevice.current().play(.success)
    }
}

// MARK: - Watch Metric Card
struct WatchMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    let animate: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)
                .scaleEffect(animate ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animate)

            HStack(alignment: .lastTextBaseline, spacing: 1) {
                Text(value)
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundColor(.primary)

                if !unit.isEmpty {
                    Text(unit)
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }

            Text(title)
                .font(.system(size: 9))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(6)
        .background {
            RoundedRectangle(cornerRadius: 6)
                .fill(.regularMaterial)
        }
    }
}

// MARK: - Watch Detail Card
struct WatchDetailCard: View {
    let title: String
    let value: String
    let unit: String
    let trend: TrendDirection
    let icon: String

    enum TrendDirection {
        case up, down, stable

        var icon: String {
            switch self {
            case .up: return "arrow.up.right"
            case .down: return "arrow.down.right"
            case .stable: return "minus"
            }
        }

        var color: Color {
            switch self {
            case .up: return .green
            case .down: return .red
            case .stable: return .secondary
            }
        }
    }

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
                .frame(width: 16)

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 11))
                    .foregroundColor(.primary)

                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text(value)
                        .font(.system(size: 13, weight: .medium, design: .monospaced))

                    Text(unit)
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: trend.icon)
                .font(.system(size: 10))
                .foregroundColor(trend.color)
        }
        .padding(8)
        .background {
            RoundedRectangle(cornerRadius: 6)
                .fill(.regularMaterial)
        }
    }
}

// MARK: - Watch Action Button
struct WatchActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .medium))

                Text(title)
                    .font(.system(size: 12, weight: .medium))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background {
                RoundedRectangle(cornerRadius: 20)
                    .fill(color)
            }
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Preview Support
#if DEBUG
struct EnhancedWatchDashboard_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedWatchDashboard()
    }
}
#endif
