import SwiftUI
import HealthKit
import Charts

// MARK: - Enhanced VitalSense Dashboard with Polished UI

@available(iOS 16.0, *)
struct EnhancedVitalSenseDashboard: View {
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @State private var selectedTab = 0
    @State private var isStreaming = false
    @State private var showingPermissions = false
    @State private var showingSettings = false

    // Sample data for demonstration (replace with real data)
    @State private var heartRateData: [EnhancedHealthChart.HealthDataPoint] = []
    @State private var stepsData: [EnhancedHealthChart.HealthDataPoint] = []

    var body: some View {
        EnhancedTabView(selectedTab: $selectedTab, tabs: [
            .init(id: 0, title: "Overview", icon: "heart", selectedIcon: "heart.fill") {
                overviewContent
            },
            .init(id: 1, title: "Metrics", icon: "chart.line.uptrend.xyaxis", selectedIcon: "chart.line.uptrend.xyaxis") {
                metricsContent
            },
            .init(id: 2, title: "Trends", icon: "waveform.path.ecg", selectedIcon: "waveform.path.ecg") {
                trendsContent
            },
            .init(id: 3, title: "Alerts", icon: "bell", selectedIcon: "bell.fill", badge: alertCount) {
                alertsContent
            },
            .init(id: 4, title: "Settings", icon: "gear", selectedIcon: "gear") {
                settingsContent
            }
        ])
        .ignoresSafeArea(.keyboard)
        .onAppear {
            setupSampleData()
        }
        .enhancedSheet(isPresented: $showingPermissions, detents: [.medium, .large]) {
            permissionsSheet
        }
        .enhancedSheet(isPresented: $showingSettings, detents: [.large]) {
            settingsSheet
        }
    }

    // MARK: - Overview Tab
    private var overviewContent: some View {
        ScrollView {
            LazyVStack(spacing: ModernDesignSystem.Spacing.large) {
                // Navigation header
                EnhancedNavigationHeader(
                    title: "VitalSense",
                    subtitle: "Health Monitoring Dashboard",
                    leadingButton: .init(icon: "person.crop.circle") {
                        // Profile action
                    },
                    trailingButton: .init(icon: "gear") {
                        showingSettings = true
                    }
                )

                // Connection status
                connectionStatusSection

                // Primary health metrics
                primaryMetricsGrid

                // Quick actions
                quickActionsSection

                // Recent activity summary
                recentActivitySection
            }
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        }
        .refreshable {
            await refreshHealthData()
        }
        .background(ModernDesignSystem.Colors.background)
    }

    // MARK: - Metrics Tab
    private var metricsContent: some View {
        ScrollView {
            LazyVStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedNavigationHeader(
                    title: "Health Metrics",
                    subtitle: "Detailed View",
                    trailingButton: .init(icon: "square.and.arrow.up") {
                        // Export action
                    }
                )

                // Detailed metrics grid
                detailedMetricsGrid
            }
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        }
        .background(ModernDesignSystem.Colors.background)
    }

    // MARK: - Trends Tab
    private var trendsContent: some View {
        ScrollView {
            LazyVStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedNavigationHeader(
                    title: "Health Trends",
                    subtitle: "Historical Analysis"
                )

                // Heart rate chart
                if #available(iOS 16.0, *) {
                    EnhancedHealthChart(
                        data: heartRateData,
                        chartType: .area,
                        title: "Heart Rate",
                        unit: "BPM",
                        timeRange: .day,
                        healthThreshold: .init(
                            normal: 60...100,
                            warning: 50...120,
                            critical: 0...200
                        )
                    )
                }

                // Steps chart
                if #available(iOS 16.0, *) {
                    EnhancedHealthChart(
                        data: stepsData,
                        chartType: .bar,
                        title: "Daily Steps",
                        unit: "steps",
                        timeRange: .week,
                        healthThreshold: nil
                    )
                }
            }
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        }
        .background(ModernDesignSystem.Colors.background)
    }

    // MARK: - Alerts Tab
    private var alertsContent: some View {
        ScrollView {
            LazyVStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedNavigationHeader(
                    title: "Health Alerts",
                    subtitle: "\(alertCount) active alerts"
                )

                alertsList
            }
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        }
        .background(ModernDesignSystem.Colors.background)
    }

    // MARK: - Settings Tab
    private var settingsContent: some View {
        ScrollView {
            LazyVStack(spacing: ModernDesignSystem.Spacing.large) {
                EnhancedNavigationHeader(
                    title: "Settings",
                    subtitle: "Customize your experience"
                )

                settingsGroups
            }
            .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        }
        .background(ModernDesignSystem.Colors.background)
    }

    // MARK: - Connection Status Section
    private var connectionStatusSection: some View {
        EnhancedConnectionStatus(
            isConnected: webSocketManager.isConnected,
            title: "VitalSense Server",
            subtitle: webSocketManager.isConnected ? "Real-time monitoring active" : "Attempting to connect...",
            dataRate: webSocketManager.isConnected ? "\(Int(healthManager.dataPointsPerMinute))" : nil
        )
    }

    // MARK: - Primary Metrics Grid
    private var primaryMetricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: ModernDesignSystem.Spacing.medium) {
            EnhancedMetricCard(
                title: "Heart Rate",
                value: "\(Int(healthManager.currentHeartRate))",
                unit: "BPM",
                trend: .stable,
                status: .good,
                icon: "heart.fill"
            ) {
                selectedTab = 2 // Switch to trends
            }

            EnhancedMetricCard(
                title: "Daily Steps",
                value: "\(Int(healthManager.todaySteps))",
                unit: "steps",
                trend: .up,
                status: .excellent,
                icon: "figure.walk"
            ) {
                selectedTab = 2 // Switch to trends
            }

            EnhancedMetricCard(
                title: "Walking Steadiness",
                value: "92",
                unit: "%",
                trend: .stable,
                status: .good,
                icon: "figure.walk.motion"
            ) {
                selectedTab = 1 // Switch to metrics
            }

            EnhancedMetricCard(
                title: "Active Energy",
                value: "\(Int(healthManager.activeEnergyBurned))",
                unit: "cal",
                trend: .up,
                status: .fair,
                icon: "flame.fill"
            ) {
                selectedTab = 1 // Switch to metrics
            }
        }
    }

    // MARK: - Detailed Metrics Grid
    private var detailedMetricsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: ModernDesignSystem.Spacing.medium) {
            // Additional detailed metrics
            Group {
                EnhancedMetricCard(
                    title: "Resting HR",
                    value: "65",
                    unit: "BPM",
                    trend: nil,
                    status: .good,
                    icon: "heart.circle"
                ) {}

                EnhancedMetricCard(
                    title: "HRV",
                    value: "42",
                    unit: "ms",
                    trend: .up,
                    status: .excellent,
                    icon: "waveform.path.ecg.rectangle"
                ) {}

                EnhancedMetricCard(
                    title: "VO2 Max",
                    value: "38",
                    unit: "mL/kg/min",
                    trend: .stable,
                    status: .good,
                    icon: "lungs.fill"
                ) {}

                EnhancedMetricCard(
                    title: "Sleep",
                    value: "7.5",
                    unit: "hours",
                    trend: .up,
                    status: .good,
                    icon: "bed.double.fill"
                ) {}

                EnhancedMetricCard(
                    title: "Flights Climbed",
                    value: "12",
                    unit: "flights",
                    trend: .down,
                    status: .fair,
                    icon: "stairs"
                ) {}

                EnhancedMetricCard(
                    title: "Distance",
                    value: "8.2",
                    unit: "km",
                    trend: .up,
                    status: .excellent,
                    icon: "location.fill"
                ) {}
            }
        }
    }

    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.medium) {
            Text("Quick Actions")
                .font(ModernDesignSystem.Typography.title3)
                .foregroundColor(ModernDesignSystem.Colors.textPrimary)

            HStack(spacing: ModernDesignSystem.Spacing.medium) {
                EnhancedActionButton(
                    title: isStreaming ? "Stop Monitoring" : "Start Monitoring",
                    icon: isStreaming ? "stop.fill" : "play.fill",
                    style: isStreaming ? .destructive : .primary
                ) {
                    toggleStreaming()
                }

                EnhancedActionButton(
                    title: "Permissions",
                    icon: "lock.shield",
                    style: .outline
                ) {
                    showingPermissions = true
                }
            }
        }
    }

    // MARK: - Recent Activity Section
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.medium) {
            Text("Recent Activity")
                .font(ModernDesignSystem.Typography.title3)
                .foregroundColor(ModernDesignSystem.Colors.textPrimary)

            VStack(spacing: ModernDesignSystem.Spacing.small) {
                ActivityRow(
                    icon: "heart.fill",
                    title: "Heart rate updated",
                    subtitle: "72 BPM • 2 min ago",
                    color: ModernDesignSystem.Colors.healthRed
                )

                ActivityRow(
                    icon: "figure.walk",
                    title: "Steps goal achieved",
                    subtitle: "10,000 steps • 1 hour ago",
                    color: ModernDesignSystem.Colors.healthGreen
                )

                ActivityRow(
                    icon: "flame.fill",
                    title: "Active energy updated",
                    subtitle: "420 cal • 3 min ago",
                    color: ModernDesignSystem.Colors.healthOrange
                )
            }
            .padding(ModernDesignSystem.Spacing.medium)
            .background {
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                    .fill(.regularMaterial)
            }
        }
    }

    // MARK: - Alerts List
    private var alertsList: some View {
        VStack(spacing: ModernDesignSystem.Spacing.medium) {
            AlertCard(
                type: .warning,
                title: "Heart Rate Elevated",
                message: "Your heart rate has been above 100 BPM for 15 minutes",
                timestamp: Date().addingTimeInterval(-300)
            )

            AlertCard(
                type: .info,
                title: "Daily Goal Achieved",
                message: "Congratulations! You've reached your daily step goal",
                timestamp: Date().addingTimeInterval(-3600)
            )

            AlertCard(
                type: .critical,
                title: "Fall Risk Detected",
                message: "Walking steadiness below normal range. Consider consulting healthcare provider",
                timestamp: Date().addingTimeInterval(-7200)
            )
        }
    }

    // MARK: - Settings Groups
    private var settingsGroups: some View {
        VStack(spacing: ModernDesignSystem.Spacing.large) {
            SettingsGroup(title: "Health Monitoring") {
                SettingsRow(icon: "waveform", title: "Real-time Streaming", subtitle: "Enable continuous monitoring", toggle: $isStreaming)
                SettingsRow(icon: "heart.fill", title: "Heart Rate Alerts", subtitle: "Get notified of irregularities", toggle: .constant(true))
                SettingsRow(icon: "figure.fall", title: "Fall Detection", subtitle: "Emergency fall detection", toggle: .constant(true))
            }

            SettingsGroup(title: "Data & Privacy") {
                SettingsRow(icon: "lock.shield", title: "HealthKit Permissions", subtitle: "Manage data access") {
                    showingPermissions = true
                }
                SettingsRow(icon: "square.and.arrow.up", title: "Export Data", subtitle: "Download health data") {
                    // Export action
                }
                SettingsRow(icon: "eye.slash", title: "Privacy Settings", subtitle: "Control data sharing") {
                    // Privacy action
                }
            }

            SettingsGroup(title: "General") {
                SettingsRow(icon: "bell", title: "Notifications", subtitle: "Customize alerts") {
                    // Notifications action
                }
                SettingsRow(icon: "questionmark.circle", title: "Help & Support", subtitle: "Get assistance") {
                    // Help action
                }
                SettingsRow(icon: "info.circle", title: "About VitalSense", subtitle: "Version 1.0.0") {
                    // About action
                }
            }
        }
    }

    // MARK: - Sheets
    private var permissionsSheet: some View {
        NavigationView {
            PermissionsView()
                .navigationTitle("Health Permissions")
                .navigationBarTitleDisplayMode(.large)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            showingPermissions = false
                        }
                    }
                }
        }
    }

    private var settingsSheet: some View {
        NavigationView {
            DetailedSettingsView()
                .navigationTitle("Settings")
                .navigationBarTitleDisplayMode(.large)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            showingSettings = false
                        }
                    }
                }
        }
    }

    // MARK: - Helper Properties
    private var alertCount: Int {
        3 // Sample count
    }

    // MARK: - Helper Methods
    private func setupSampleData() {
        // Generate sample heart rate data
        let calendar = Calendar.current
        let now = Date()

        heartRateData = (0..<24).compactMap { hour in
            guard let date = calendar.date(byAdding: .hour, value: -hour, to: now) else { return nil }
            return EnhancedHealthChart.HealthDataPoint(
                date: date,
                value: Double.random(in: 65...95),
                category: nil
            )
        }.reversed()

        // Generate sample steps data
        stepsData = (0..<7).compactMap { day in
            guard let date = calendar.date(byAdding: .day, value: -day, to: now) else { return nil }
            return EnhancedHealthChart.HealthDataPoint(
                date: date,
                value: Double.random(in: 8000...15000),
                category: nil
            )
        }.reversed()
    }

    private func toggleStreaming() {
        withAnimation(.easeInOut(duration: 0.3)) {
            isStreaming.toggle()
        }

        // Add haptic feedback
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(isStreaming ? .success : .warning)
    }

    @MainActor
    private func refreshHealthData() async {
        // Simulate data refresh
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
        setupSampleData()
    }
}

// MARK: - Supporting Views
struct ActivityRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color

    var body: some View {
        HStack(spacing: ModernDesignSystem.Spacing.medium) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(ModernDesignSystem.Typography.body)
                    .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                Text(subtitle)
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
            }

            Spacer()
        }
    }
}

struct AlertCard: View {
    let type: AlertType
    let title: String
    let message: String
    let timestamp: Date

    enum AlertType {
        case info, warning, critical

        var color: Color {
            switch self {
            case .info: return ModernDesignSystem.Colors.secondary
            case .warning: return ModernDesignSystem.Colors.healthYellow
            case .critical: return ModernDesignSystem.Colors.healthRed
            }
        }

        var icon: String {
            switch self {
            case .info: return "info.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .critical: return "exclamationmark.octagon.fill"
            }
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: ModernDesignSystem.Spacing.medium) {
            Image(systemName: type.icon)
                .font(.title3)
                .foregroundColor(type.color)

            VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.xSmall) {
                Text(title)
                    .font(ModernDesignSystem.Typography.bodyEmphasized)
                    .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                Text(message)
                    .font(ModernDesignSystem.Typography.body)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)

                Text(timestamp, style: .relative)
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textTertiary)
            }

            Spacer()
        }
        .padding(ModernDesignSystem.Spacing.medium)
        .background {
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                .fill(.regularMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                        .stroke(type.color.opacity(0.3), lineWidth: 1)
                }
        }
    }
}

struct SettingsGroup<Content: View>: View {
    let title: String
    let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernDesignSystem.Spacing.medium) {
            Text(title)
                .font(ModernDesignSystem.Typography.title3)
                .foregroundColor(ModernDesignSystem.Colors.textPrimary)

            VStack(spacing: 0) {
                content
            }
            .background {
                RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                    .fill(.regularMaterial)
            }
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let toggle: Binding<Bool>?
    let action: (() -> Void)?

    init(icon: String, title: String, subtitle: String, toggle: Binding<Bool>) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.toggle = toggle
        self.action = nil
    }

    init(icon: String, title: String, subtitle: String, action: @escaping () -> Void) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.toggle = nil
        self.action = action
    }

    var body: some View {
        Button(action: action ?? {}) {
            HStack(spacing: ModernDesignSystem.Spacing.medium) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(ModernDesignSystem.Colors.primary)
                    .frame(width: 24, height: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(ModernDesignSystem.Typography.body)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)

                    Text(subtitle)
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }

                Spacer()

                if let toggle = toggle {
                    Toggle("", isOn: toggle)
                        .labelsHidden()
                } else {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                }
            }
            .padding(ModernDesignSystem.Spacing.medium)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// Placeholder views for sheets
struct PermissionsView: View {
    var body: some View {
        Text("Health Permissions")
            .font(ModernDesignSystem.Typography.title2)
    }
}

struct DetailedSettingsView: View {
    var body: some View {
        Text("Detailed Settings")
            .font(ModernDesignSystem.Typography.title2)
    }
}

// MARK: - Preview Support
#if DEBUG
@available(iOS 16.0, *)
struct EnhancedVitalSenseDashboard_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedVitalSenseDashboard()
    }
}
#endif
