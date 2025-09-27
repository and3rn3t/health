import SwiftUI
import HealthKit
import Charts
import ARKit

@available(iOS 16.0, *)
struct EnhancedHealthMonitoringView: View {
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @State private var isStreaming = false
    @State private var showingPermissions = false
    @State private var selectedTab = 0
    @State private var showingAlerts = true // Show sample alerts for demo
    @State private var animateHeartRate = false
    @State private var showingLiDARScanning = false
    @State private var showingLiDARPermissions = false
    @StateObject private var lidarManager = LiDARScanningManager.shared

    // Enhanced Fall Risk System
    @StateObject private var fallRiskEngine = EnhancedFallRiskEngine()
    @StateObject private var fallDetectionEngine = EnhancedFallDetectionEngine()
    @StateObject private var interventionEngine = EnhancedInterventionEngine()

    // Chart data for trends
    @State private var heartRateHistory: [HealthDataPoint] = []
    @State private var stepsHistory: [HealthDataPoint] = []

    struct HealthDataPoint: Identifiable {
        let id = UUID()
        let timestamp: Date
        let value: Double
    }

    var body: some View {
        NavigationView {
            TabView(selection: $selectedTab) {
                // Overview Tab
                overviewTab
                    .tabItem {
                        Image(systemName: "heart.fill")
                        Text("Overview")
                    }
                    .tag(0)

                // Fall Risk Tab - New Enhanced System
                fallRiskTab
                    .tabItem {
                        Image(systemName: "figure.fall")
                        Text("Fall Risk")
                    }
                    .tag(1)

                // Metrics Tab
                metricsTab
                    .tabItem {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                        Text("Metrics")
                    }
                    .tag(2)

                // Alerts Tab
                alertsTab
                    .tabItem {
                        Image(systemName: "bell.fill")
                        Text("Alerts")
                    }
                    .tag(3)

                // Settings Tab
                settingsTab
                    .tabItem {
                        Image(systemName: "gear")
                        Text("Settings")
                    }
                    .tag(4)
            }
            .navigationTitle("VitalSense")
            .onAppear {
                setupInitialState()
            }
            .sheet(isPresented: $showingLiDARScanning) {
                LiDARScanningView()
            }
            .sheet(isPresented: $showingLiDARPermissions) {
                LiDARPermissionView()
            }
        }
    }

    // MARK: - Overview Tab
    var overviewTab: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with connection status
                connectionStatusCard

                // Main health metrics grid
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    heartRateCard
                    stepsCard
                    steadinessCard
                    energyCard
                    fallRiskCard
                    interventionCard
                }

                // Quick actions
                quickActionsCard

                // Recent activity
                recentActivityCard
            }
            .padding()
        }
        .refreshable {
            await refreshData()
        }
    }

    // MARK: - Fall Risk Tab
    var fallRiskTab: some View {
        EnhancedFallRiskDashboardView(
            fallRiskEngine: fallRiskEngine,
            fallDetectionEngine: fallDetectionEngine,
            interventionEngine: interventionEngine
        )
    }

    // MARK: - Connection Status Card
    var connectionStatusCard: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("VitalSense Real-Time Monitoring")
                        .font(.title2)
                        .fontWeight(.bold)

                    HStack(spacing: 8) {
                        Circle()
                            .fill(webSocketManager.isConnected ? .green : .red)
                            .frame(width: 8, height: 8)
                            .scaleEffect(webSocketManager.isConnected ? 1.2 : 1.0)
                            .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                                     value: webSocketManager.isConnected)

                        Text(webSocketManager.isConnected ? "Connected to Enhanced Server" : "Disconnected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(healthManager.dataPointsPerMinute))")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)

                    Text("data/min")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            // Status indicators
            HStack {
                StatusIndicator(
                    title: "HealthKit",
                    isActive: healthManager.isAuthorized,
                    icon: "heart.fill"
                )

                StatusIndicator(
                    title: "Streaming",
                    isActive: isStreaming,
                    icon: "waveform"
                )

                StatusIndicator(
                    title: "Server",
                    isActive: webSocketManager.isConnected,
                    icon: "server.rack"
                )
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Health Metric Cards
    var heartRateCard: some View {
        HealthMetricCard(
            title: "Heart Rate",
            value: healthManager.lastHeartRate.map { "\(Int($0))" } ?? "--",
            unit: "bpm",
            icon: "heart.fill",
            iconColor: .red,
            status: getHeartRateStatus(),
            trend: getHeartRateTrend()
        ) {
            animateHeartRate.toggle()
        }
        .scaleEffect(animateHeartRate ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 0.6), value: animateHeartRate)
    }

    var stepsCard: some View {
        HealthMetricCard(
            title: "Steps Today",
            value: healthManager.lastStepCount.map { "\(Int($0))" } ?? "--",
            unit: "steps",
            icon: "figure.walk",
            iconColor: .blue,
            status: getStepsStatus(),
            trend: .stable
        )
    }

    var steadinessCard: some View {
        HealthMetricCard(
            title: "Walking Steadiness",
            value: healthManager.lastWalkingSteadiness.map { "\(Int($0 * 100))" } ?? "--",
            unit: "%",
            icon: "figure.walk.motion",
            iconColor: .green,
            status: getSteadinessStatus(),
            trend: .up
        )
    }

    var energyCard: some View {
        HealthMetricCard(
            title: "Active Energy",
            value: healthManager.lastActiveEnergy.map { "\(Int($0))" } ?? "--",
            unit: "kcal",
            icon: "flame.fill",
            iconColor: .orange,
            status: .good,
            trend: .up
        )
    }

    var fallRiskCard: some View {
        HealthMetricCard(
            title: "Fall Risk",
            value: fallRiskEngine.currentAssessment?.overallRisk.map { "\(Int($0 * 100))" } ?? "--",
            unit: "%",
            icon: "figure.fall",
            iconColor: fallRiskEngine.currentAssessment?.riskLevel == .high ? .red :
                      fallRiskEngine.currentAssessment?.riskLevel == .moderate ? .orange : .green,
            status: getFallRiskStatus(),
            trend: .stable
        ) {
            selectedTab = 1 // Navigate to Fall Risk tab
        }
    }

    var interventionCard: some View {
        HealthMetricCard(
            title: "Active Programs",
            value: "\(interventionEngine.activeInterventions.count)",
            unit: "programs",
            icon: "list.clipboard.fill",
            iconColor: .purple,
            status: interventionEngine.activeInterventions.isEmpty ? .warning : .good,
            trend: .stable
        ) {
            selectedTab = 1 // Navigate to Fall Risk tab
        }
    }

    // MARK: - Quick Actions Card
    var quickActionsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundColor(.primary)

            HStack(spacing: 12) {
                if !healthManager.isAuthorized {
                    ActionButton(
                        title: "Enable HealthKit",
                        icon: "heart.fill",
                        color: .red
                    ) {
                        showingPermissions = true
                        Task {
                            await healthManager.requestAuthorization()
                        }
                    }
                    .disabled(showingPermissions)
                }

                if healthManager.isAuthorized {
                    ActionButton(
                        title: isStreaming ? "Stop Stream" : "Start Stream",
                        icon: isStreaming ? "stop.fill" : "play.fill",
                        color: isStreaming ? .red : .green
                    ) {
                        Task {
                            await toggleStreaming()
                        }
                    }
                }

                ActionButton(
                    title: "LiDAR Scan",
                    icon: "camera.metering.spot",
                    color: .purple
                ) {
                    if lidarManager.isLiDARAvailable {
                        showingLiDARScanning = true
                    } else {
                        showingLiDARPermissions = true
                    }
                }

                ActionButton(
                    title: "Fall Risk Check",
                    icon: "figure.fall",
                    color: .orange
                ) {
                    Task {
                        await fallRiskEngine.performEnhancedAssessment()
                    }
                }

                ActionButton(
                    title: "Export Data",
                    icon: "square.and.arrow.up",
                    color: .blue
                ) {
                    // Export functionality
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Recent Activity Card
    var recentActivityCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Activity")
                    .font(.headline)

                Spacer()

                Text("Total Sent: \(healthManager.totalDataPointsSent)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 8) {
                RecentActivityRow(
                    icon: "heart.fill",
                    iconColor: .red,
                    title: "Heart Rate Updated",
                    timestamp: "Just now"
                )

                RecentActivityRow(
                    icon: "figure.walk",
                    iconColor: .blue,
                    title: "Step Count Sync",
                    timestamp: "2 min ago"
                )

                RecentActivityRow(
                    icon: "waveform.path.ecg",
                    iconColor: .green,
                    title: "Health Metrics Streamed",
                    timestamp: "5 min ago"
                )

                if let assessment = fallRiskEngine.currentAssessment {
                    RecentActivityRow(
                        icon: "figure.fall",
                        iconColor: assessment.riskLevel == .high ? .red :
                                  assessment.riskLevel == .moderate ? .orange : .green,
                        title: "Fall Risk Assessment",
                        timestamp: assessment.timestamp.formatted(.relative(presentation: .named))
                    )
                }

                if lidarManager.totalScans > 0 {
                    RecentActivityRow(
                        icon: "camera.metering.spot",
                        iconColor: .purple,
                        title: "LiDAR Scan Completed",
                        timestamp: "10 min ago"
                    )
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Metrics Tab
    var metricsTab: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Heart Rate Chart
                chartCard(
                    title: "Heart Rate Trend",
                    data: heartRateHistory,
                    color: .red
                )

                // Steps Chart
                chartCard(
                    title: "Daily Steps",
                    data: stepsHistory,
                    color: .blue
                )

                // Detailed metrics list
                detailedMetricsList
            }
            .padding()
        }
    }

    // MARK: - Alerts Tab
    var alertsTab: some View {
        VStack {
            if healthManager.hasActiveAlerts {
                List {
                    HealthAlert(
                        type: .warning,
                        title: "Heart Rate Spike",
                        message: "Heart rate exceeded 120 bpm for 5 minutes",
                        timestamp: Date().addingTimeInterval(-300)
                    )

                    HealthAlert(
                        type: .info,
                        title: "Daily Goal Reached",
                        message: "You've reached your 10,000 step goal!",
                        timestamp: Date().addingTimeInterval(-3600)
                    )
                }
            } else {
                ContentUnavailableView(
                    "No Active Alerts",
                    systemImage: "checkmark.circle.fill",
                    description: Text("Your health metrics are within normal ranges.")
                )
            }
        }
    }

    // MARK: - Metrics Tab
    var metricsTab: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Real-time charts section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Live Health Trends")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        if #available(iOS 16.0, *) {
                            chartCard(
                                title: "Heart Rate (24h)",
                                data: heartRateHistory,
                                color: .red
                            )

                            chartCard(
                                title: "Daily Steps (7d)",
                                data: stepsHistory,
                                color: .blue
                            )
                        }
                    }

                    // Detailed metrics grid
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Current Metrics")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            MetricDetailCard(
                                title: "Heart Rate",
                                value: healthManager.lastHeartRate.map { "\(Int($0))" } ?? "--",
                                unit: "bpm",
                                icon: "heart.fill",
                                iconColor: .red,
                                status: getHeartRateStatus()
                            )

                            MetricDetailCard(
                                title: "Steps Today",
                                value: healthManager.lastStepCount.map { "\(Int($0))" } ?? "--",
                                unit: "steps",
                                icon: "figure.walk",
                                iconColor: .blue,
                                status: getStepsStatus()
                            )

                            MetricDetailCard(
                                title: "Walking Steadiness",
                                value: healthManager.lastWalkingSteadiness.map { "\(Int($0 * 100))" } ?? "--",
                                unit: "%",
                                icon: "figure.walk.motion",
                                iconColor: .green,
                                status: getSteadinessStatus()
                            )

                            MetricDetailCard(
                                title: "Active Energy",
                                value: healthManager.lastActiveEnergy.map { "\(Int($0))" } ?? "--",
                                unit: "kcal",
                                icon: "flame.fill",
                                iconColor: .orange,
                                status: .good
                            )
                        }
                        .padding(.horizontal)
                    }

                    // Advanced metrics section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Advanced Metrics")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)

                        VStack(spacing: 12) {
                            DetailedMetricRow(
                                title: "Walking Speed",
                                value: healthManager.lastWalkingSpeed.map { String(format: "%.1f", $0) } ?? "--",
                                unit: "m/s",
                                status: .good
                            )

                            DetailedMetricRow(
                                title: "Step Length",
                                value: healthManager.lastWalkingStepLength.map { String(format: "%.0f", $0 * 100) } ?? "--",
                                unit: "cm",
                                status: .good
                            )

                            DetailedMetricRow(
                                title: "Double Support %",
                                value: healthManager.lastWalkingDoubleSupportPercentage.map { String(format: "%.1f", $0 * 100) } ?? "--",
                                unit: "%",
                                status: .good
                            )

                            DetailedMetricRow(
                                title: "Asymmetry %",
                                value: healthManager.lastWalkingAsymmetryPercentage.map { String(format: "%.1f", $0 * 100) } ?? "--",
                                unit: "%",
                                status: .warning
                            )
                        }
                        .padding()
                        .background {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.regularMaterial)
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Health Metrics")
            .refreshable {
                await refreshData()
            }
        }
    }

    // MARK: - Alerts Tab
    var alertsTab: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Alert summary
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Health Alerts")
                                .font(.title2)
                                .fontWeight(.bold)

                            Text("Stay informed about your health status")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Button(action: {
                            // Clear all alerts
                        }) {
                            Text("Clear All")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal)

                    // Active alerts
                    if showingAlerts {
                        VStack(spacing: 16) {
                            HealthAlert(
                                type: .critical,
                                title: "Irregular Heart Rate",
                                message: "Your heart rate has been unusually high for the past 30 minutes. Consider taking a break.",
                                timestamp: Date().addingTimeInterval(-1800)
                            )

                            HealthAlert(
                                type: .warning,
                                title: "Low Activity Today",
                                message: "You're below your daily step goal. Try taking a short walk.",
                                timestamp: Date().addingTimeInterval(-7200)
                            )

                            HealthAlert(
                                type: .info,
                                title: "Walking Steadiness Improved",
                                message: "Your walking steadiness has shown improvement over the past week. Keep up the good work!",
                                timestamp: Date().addingTimeInterval(-86400)
                            )
                        }
                        .padding(.horizontal)
                    } else {
                        ContentUnavailableView(
                            "No Active Alerts",
                            systemImage: "checkmark.circle.fill",
                            description: Text("Your health metrics are within normal ranges. We'll notify you if anything needs attention.")
                        )
                        .foregroundColor(.green)
                    }

                    // Alert preferences
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Alert Preferences")
                            .font(.headline)
                            .padding(.horizontal)

                        VStack(spacing: 12) {
                            AlertPreferenceRow(
                                title: "Heart Rate Alerts",
                                subtitle: "Notify for irregular patterns",
                                isEnabled: .constant(true)
                            )

                            AlertPreferenceRow(
                                title: "Fall Risk Alerts",
                                subtitle: "Walking steadiness warnings",
                                isEnabled: .constant(true)
                            )

                            AlertPreferenceRow(
                                title: "Activity Reminders",
                                subtitle: "Daily goal notifications",
                                isEnabled: .constant(false)
                            )

                            AlertPreferenceRow(
                                title: "Emergency Alerts",
                                subtitle: "Critical health events",
                                isEnabled: .constant(true)
                            )
                        }
                        .padding()
                        .background {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.regularMaterial)
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Alerts")
        }
    }

    // MARK: - Settings Tab
    var settingsTab: some View {
        NavigationStack {
            List {
                Section(header: Text("VitalSense Monitoring")) {
                    HStack {
                        Image(systemName: "waveform.path.ecg")
                            .foregroundColor(.red)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Real-time Streaming")
                                .font(.subheadline)
                            Text(isStreaming ? "Active" : "Stopped")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Toggle("", isOn: $isStreaming)
                            .onChange(of: isStreaming) { _, newValue in
                                Task {
                                    await toggleStreaming()
                                }
                            }
                    }

                    Toggle("Background Health Sync", isOn: .constant(true))
                    Toggle("Auto-connect to Server", isOn: .constant(true))
                }

                Section(header: Text("Enhanced Fall Risk System")) {
                    HStack {
                        Image(systemName: "figure.fall")
                            .foregroundColor(.orange)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Fall Detection Monitoring")
                                .font(.subheadline)
                            Text(fallDetectionEngine.isMonitoring ? "Active" : "Stopped")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Toggle("", isOn: .constant(fallDetectionEngine.isMonitoring))
                    }

                    Toggle("AI Risk Assessment", isOn: .constant(true))
                    Toggle("Intervention Programs", isOn: .constant(true))
                    Toggle("Emergency Detection", isOn: .constant(true))
                }

                Section(header: Text("Health Notifications")) {
                    Toggle("Critical Health Alerts", isOn: .constant(true))
                    Toggle("Daily Goal Reminders", isOn: .constant(true))
                    Toggle("Weekly Health Reports", isOn: .constant(false))
                    Toggle("Fall Risk Warnings", isOn: .constant(true))
                }

                Section(header: Text("Home Screen Widgets")) {
                    NavigationLink(destination: WidgetConfigurationView()) {
                        Label("Configure Widgets", systemImage: "widget.large.badge.plus")
                    }

                    NavigationLink(destination: WidgetSetupGuideView()) {
                        Label("Widget Setup Guide", systemImage: "questionmark.circle")
                    }

                    HStack {
                        Label("Available Widgets", systemImage: "square.grid.3x3")
                        Spacer()
                        Text("4 types")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section(header: Text("Data & Privacy")) {
                    NavigationLink(destination: HealthPermissionsView()) {
                        Label("HealthKit Permissions", systemImage: "lock.fill")
                    }

                    NavigationLink(destination: DataExportView()) {
                        Label("Export Health Data", systemImage: "square.and.arrow.up")
                    }

                    NavigationLink(destination: PrivacySettingsView()) {
                        Label("Privacy Settings", systemImage: "hand.raised.fill")
                    }
                }

                Section(header: Text("Server Connection")) {
                    HStack {
                        Label("Enhanced Server", systemImage: "server.rack")
                        Spacer()
                        Text(webSocketManager.isConnected ? "Connected" : "Disconnected")
                            .font(.caption)
                            .foregroundColor(webSocketManager.isConnected ? .green : .red)
                    }

                    if !webSocketManager.isConnected {
                        Button("Reconnect to Server") {
                            webSocketManager.connect()
                        }
                    }
                }

                Section(header: Text("About")) {
                    HStack {
                        Label("App Version", systemImage: "info.circle")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Label("Data Points Sent", systemImage: "chart.bar")
                        Spacer()
                        Text("\(healthManager.totalDataPointsSent)")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }

    // MARK: - Helper Functions
    private func setupInitialState() {
        isStreaming = healthManager.isMonitoringActive

        if !webSocketManager.isConnected {
            webSocketManager.connect()
        }

        // Initialize Enhanced Fall Risk System
        Task {
            await fallRiskEngine.initializeSystem()
            await fallDetectionEngine.startMonitoring()
            await interventionEngine.initializeInterventions()
        }

        // Generate sample chart data
        generateSampleChartData()
    }

    private func refreshData() async {
        // Refresh health data
        await healthManager.refreshLatestData()
        generateSampleChartData()
    }

    private func toggleStreaming() async {
        if isStreaming {
            healthManager.stopRealTimeHealthStreaming()
            isStreaming = false
        } else {
            await healthManager.startRealTimeHealthStreaming()
            isStreaming = true
        }
    }

    private func generateSampleChartData() {
        // Generate sample heart rate data for the last 24 hours
        heartRateHistory = (0..<24).map { hour in
            HealthDataPoint(
                timestamp: Calendar.current.date(byAdding: .hour, value: -hour, to: Date()) ?? Date(),
                value: Double.random(in: 60...80) + (hour < 8 ? -10 : 0) // Lower during sleep
            )
        }.reversed()

        // Generate sample steps data
        stepsHistory = (0..<7).map { day in
            HealthDataPoint(
                timestamp: Calendar.current.date(byAdding: .day, value: -day, to: Date()) ?? Date(),
                value: Double.random(in: 5000...12000)
            )
        }.reversed()
    }

    private func getHeartRateStatus() -> HealthStatus {
        guard let heartRate = healthManager.lastHeartRate else { return .unknown }
        if heartRate >= 60 && heartRate <= 80 { return .excellent }
        if heartRate >= 50 && heartRate <= 100 { return .good }
        if heartRate < 50 || heartRate > 120 { return .critical }
        return .warning
    }

    private func getStepsStatus() -> HealthStatus {
        guard let steps = healthManager.lastStepCount else { return .unknown }
        if steps >= 10000 { return .excellent }
        if steps >= 7000 { return .good }
        if steps >= 5000 { return .warning }
        return .critical
    }

    private func getSteadinessStatus() -> HealthStatus {
        guard let steadiness = healthManager.lastWalkingSteadiness else { return .unknown }
        let percentage = steadiness * 100
        if percentage >= 80 { return .excellent }
        if percentage >= 60 { return .good }
        if percentage >= 40 { return .warning }
        return .critical
    }

    private func getFallRiskStatus() -> HealthStatus {
        guard let assessment = fallRiskEngine.currentAssessment else { return .unknown }
        switch assessment.riskLevel {
        case .low:
            return .excellent
        case .moderate:
            return .warning
        case .high:
            return .critical
        }
    }

    private func getHeartRateTrend() -> HealthTrend {
        // Simple trend calculation - in real app, compare with historical data
        return .stable
    }

    // MARK: - Chart Card Helper
    @ViewBuilder
    private func chartCard(title: String, data: [HealthDataPoint], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.headline)

            if #available(iOS 16.0, *) {
                Chart(data) { point in
                    LineMark(
                        x: .value("Time", point.timestamp),
                        y: .value("Value", point.value)
                    )
                    .foregroundStyle(color)
                }
                .frame(height: 200)
            } else {
                Text("Charts require iOS 16+")
                    .foregroundColor(.secondary)
                    .frame(height: 200)
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    var detailedMetricsList: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Detailed Metrics")
                .font(.headline)

            VStack(spacing: 12) {
                DetailedMetricRow(
                    title: "Resting Heart Rate",
                    value: healthManager.lastHeartRate.map { "\(Int($0))" } ?? "--",
                    unit: "bpm",
                    status: getHeartRateStatus()
                )

                DetailedMetricRow(
                    title: "Walking Distance",
                    value: healthManager.lastDistance.map { String(format: "%.1f", $0/1000) } ?? "--",
                    unit: "km",
                    status: .good
                )

                DetailedMetricRow(
                    title: "Active Energy",
                    value: healthManager.lastActiveEnergy.map { "\(Int($0))" } ?? "--",
                    unit: "kcal",
                    status: .good
                )
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }
}

// MARK: - Supporting Views and Enums

enum HealthStatus {
    case excellent, good, warning, critical, unknown

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .warning: return .yellow
        case .critical: return .red
        case .unknown: return .gray
        }
    }

    var icon: String {
        switch self {
        case .excellent: return "checkmark.circle.fill"
        case .good: return "checkmark.circle"
        case .warning: return "exclamationmark.triangle.fill"
        case .critical: return "xmark.circle.fill"
        case .unknown: return "questionmark.circle"
        }
    }
}

enum HealthTrend {
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
        case .up: return .green
        case .down: return .red
        case .stable: return .gray
        }
    }
}

struct HealthMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let iconColor: Color
    let status: HealthStatus
    let trend: HealthTrend
    let action: (() -> Void)?

    init(title: String, value: String, unit: String, icon: String, iconColor: Color, status: HealthStatus, trend: HealthTrend, action: (() -> Void)? = nil) {
        self.title = title
        self.value = value
        self.unit = unit
        self.icon = icon
        self.iconColor = iconColor
        self.status = status
        self.trend = trend
        self.action = action
    }

    var body: some View {
        Button(action: action ?? {}) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(iconColor)
                        .font(.title3)

                    Spacer()

                    Image(systemName: status.icon)
                        .foregroundColor(status.color)
                        .font(.caption)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .bottom, spacing: 4) {
                        Text(value)
                            .font(.title2)
                            .fontWeight(.bold)

                        Text(unit)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Image(systemName: trend.icon)
                        .foregroundColor(trend.color)
                        .font(.caption2)

                    Text("Trend")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.regularMaterial)
            }
        }
        .buttonStyle(.plain)
    }
}

struct StatusIndicator: View {
    let title: String
    let isActive: Bool
    let icon: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(isActive ? .green : .secondary)
                .font(.caption)

            Text(title)
                .font(.caption2)
                .foregroundColor(isActive ? .primary : .secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background {
            Capsule()
                .fill(isActive ? .green.opacity(0.1) : .gray.opacity(0.1))
        }
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(0.1))
            }
        }
        .buttonStyle(.plain)
    }
}

struct RecentActivityRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let timestamp: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                Text(timestamp)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct DetailedMetricRow: View {
    let title: String
    let value: String
    let unit: String
    let status: HealthStatus

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                HStack(spacing: 4) {
                    Text(value)
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: status.icon)
                .foregroundColor(status.color)
                .font(.title3)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Supporting Views

struct MetricDetailCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let iconColor: Color
    let status: HealthStatus

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .font(.title2)

                Spacer()

                Image(systemName: status.icon)
                    .foregroundColor(status.color)
                    .font(.caption)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(.regularMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(status.color.opacity(0.3), lineWidth: 1)
                )
        }
    }
}

struct AlertPreferenceRow: View {
    let title: String
    let subtitle: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isEnabled)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Placeholder Views for Navigation
struct HealthPermissionsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "heart.text.square")
                .font(.system(size: 64))
                .foregroundColor(.red)

            Text("HealthKit Permissions")
                .font(.title2)
                .fontWeight(.bold)

            Text("Manage what health data VitalSense can access from your Apple Health app.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            VStack(alignment: .leading, spacing: 12) {
                PermissionRow(title: "Heart Rate", isGranted: true)
                PermissionRow(title: "Steps", isGranted: true)
                PermissionRow(title: "Walking Steadiness", isGranted: true)
                PermissionRow(title: "Active Energy", isGranted: false)
            }
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Spacer()
        }
        .padding()
        .navigationTitle("Health Permissions")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DataExportView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "square.and.arrow.up")
                .font(.system(size: 64))
                .foregroundColor(.blue)

            Text("Export Your Data")
                .font(.title2)
                .fontWeight(.bold)

            Text("Export your health data in various formats for backup or analysis.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            VStack(spacing: 12) {
                ExportOptionRow(title: "JSON Export", subtitle: "Machine-readable format")
                ExportOptionRow(title: "CSV Export", subtitle: "Spreadsheet compatible")
                ExportOptionRow(title: "PDF Report", subtitle: "Human-readable summary")
            }

            Spacer()
        }
        .padding()
        .navigationTitle("Export Data")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PrivacySettingsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "hand.raised.fill")
                .font(.system(size: 64))
                .foregroundColor(.green)

            Text("Privacy Settings")
                .font(.title2)
                .fontWeight(.bold)

            Text("Control how your health data is used and shared.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            VStack(alignment: .leading, spacing: 12) {
                PrivacyRow(title: "Data Sharing", subtitle: "Share anonymized data for research", isEnabled: .constant(false))
                PrivacyRow(title: "Analytics", subtitle: "Help improve VitalSense", isEnabled: .constant(true))
                PrivacyRow(title: "Cloud Sync", subtitle: "Sync data across devices", isEnabled: .constant(true))
            }
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            Spacer()
        }
        .padding()
        .navigationTitle("Privacy")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PermissionRow: View {
    let title: String
    let isGranted: Bool

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)

            Spacer()

            Image(systemName: isGranted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundColor(isGranted ? .green : .red)
        }
    }
}

struct ExportOptionRow: View {
    let title: String
    let subtitle: String

    var body: some View {
        Button(action: {
            // Export functionality
        }) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .foregroundColor(.primary)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct PrivacyRow: View {
    let title: String
    let subtitle: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isEnabled)
        }
    }
}

struct HealthAlert: View {
    enum AlertType {
        case info, warning, critical

        var color: Color {
            switch self {
            case .info: return .blue
            case .warning: return .yellow
            case .critical: return .red
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

    let type: AlertType
    let title: String
    let message: String
    let timestamp: Date

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: type.icon)
                .foregroundColor(type.color)
                .font(.title2)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)

                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 12)
                .fill(type.color.opacity(0.1))
        }
    }
}

#Preview {
    if #available(iOS 16.0, *) {
        EnhancedHealthMonitoringView()
    } else {
        Text("Enhanced Health Monitoring requires iOS 16+")
    }
}
