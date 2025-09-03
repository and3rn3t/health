import SwiftUI
import MapKit
import Charts

// MARK: - VitalSense Walking Session View
struct WalkingSessionView: View {
    @StateObject private var sessionTracker = WalkingSessionTracker()
    @State private var selectedTab: SessionTab = .overview
    @State private var showingSessionHistory = false
    @State private var showingSettings = false
    @State private var animateInterface = false
    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
    )

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // VitalSense Header
                VitalSenseWalkingHeader(
                    isTracking: sessionTracker.isTracking,
                    metrics: sessionTracker.sessionMetrics,
                    onSettingsTap: { showingSettings = true },
                    onHistoryTap: { showingSessionHistory = true }
                )
                .background(VitalSenseBrand.Colors.primaryGradient)

                // VitalSense Session Status
                VitalSenseSessionStatusBar(
                    isTracking: sessionTracker.isTracking,
                    metrics: sessionTracker.sessionMetrics
                )

                // Main Content with VitalSense Tabs
                VitalSenseTabView(selection: $selectedTab) {
                    // Overview Tab
                    VitalSenseSessionOverviewTab(
                        sessionTracker: sessionTracker,
                        mapRegion: $mapRegion
                    )
                    .vitalSenseTabItem(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "Overview",
                        tag: SessionTab.overview
                    )

                    // Real-time Tab
                    VitalSenseRealTimeTab(sessionTracker: sessionTracker)
                        .vitalSenseTabItem(
                            icon: "waveform.path.ecg",
                            title: "Live Data",
                            tag: SessionTab.realTime
                        )

                    // Map Tab
                    VitalSenseMapTab(
                        route: sessionTracker.route,
                        elevationProfile: sessionTracker.elevationProfile,
                        mapRegion: $mapRegion
                    )
                    .vitalSenseTabItem(
                        icon: "map",
                        title: "Route",
                        tag: SessionTab.map
                    )
                    )
                    .tabItem {
                        Image(systemName: "map")
                        Text("Route")
                    }
                    .tag(SessionTab.map)

                    // Analytics Tab
                    AnalyticsTab(
                        gaitMetrics: sessionTracker.realTimeGaitMetrics,
                        heartRateData: sessionTracker.heartRateData
                    )
                    .tabItem {
                        Image(systemName: "chart.bar.fill")
                        Text("Analytics")
                    }
                    .tag(SessionTab.analytics)
                }

                // Control Panel
                SessionControlPanel(sessionTracker: sessionTracker)
            }
            .navigationTitle("Walking Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { showingSessionHistory = true }) {
                        Image(systemName: "clock.arrow.circlepath")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingSettings = true }) {
                        Image(systemName: "gear")
                    }
                }
            }
            .sheet(isPresented: $showingSessionHistory) {
                SessionHistoryView()
            }
            .sheet(isPresented: $showingSettings) {
                SessionSettingsView()
            }
        }
    }
}

// MARK: - Session Status Bar
struct SessionStatusBar: View {
    let isTracking: Bool
    let metrics: WalkingSessionMetrics

    var body: some View {
        HStack {
            // Status Indicator
            HStack(spacing: 4) {
                Circle()
                    .fill(isTracking ? Color.green : Color.red)
                    .frame(width: 8, height: 8)

                Text(isTracking ? "Recording" : "Stopped")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isTracking ? .green : .secondary)
            }

            Spacer()

            // Quick Metrics
            if isTracking {
                HStack(spacing: 16) {
                    QuickMetric(
                        icon: "timer",
                        value: formatDuration(metrics.duration),
                        color: .blue
                    )

                    QuickMetric(
                        icon: "location",
                        value: String(format: "%.2f km", metrics.totalDistance / 1000),
                        color: .green
                    )

                    QuickMetric(
                        icon: "figure.walk",
                        value: "\(metrics.totalSteps)",
                        color: .orange
                    )
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .animation(.easeInOut(duration: 0.3), value: isTracking)
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: duration) ?? "0s"
    }
}

// MARK: - Quick Metric Component
struct QuickMetric: View {
    let icon: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.caption)

            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Session Overview Tab
struct SessionOverviewTab: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker
    @Binding var mapRegion: MKCoordinateRegion

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Mini Map
                if !sessionTracker.route.isEmpty {
                    MiniMapView(
                        route: sessionTracker.route,
                        region: $mapRegion
                    )
                    .frame(height: 120)
                    .cornerRadius(12)
                }

                // Primary Metrics Grid
                MetricsGridView(metrics: sessionTracker.sessionMetrics)

                // Real-time Gait Metrics
                if let gaitMetrics = sessionTracker.realTimeGaitMetrics {
                    RealTimeGaitCard(gaitMetrics: gaitMetrics)
                }

                // Progress Indicators
                ProgressIndicatorsView(metrics: sessionTracker.sessionMetrics)
            }
            .padding()
        }
    }
}

// MARK: - Mini Map View
struct MiniMapView: View {
    let route: [CLLocationCoordinate2D]
    @Binding var region: MKCoordinateRegion

    var body: some View {
        Map(coordinateRegion: $region, annotationItems: routeAnnotations) { point in
            MapPin(coordinate: point.coordinate, tint: .blue)
        }
        .disabled(true)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(.separator), lineWidth: 1)
        )
        .onAppear {
            updateMapRegion()
        }
        .onChange(of: route) { _ in
            updateMapRegion()
        }
    }

    private var routeAnnotations: [RoutePoint] {
        route.enumerated().map { index, coordinate in
            RoutePoint(id: index, coordinate: coordinate)
        }
    }

    private func updateMapRegion() {
        guard !route.isEmpty else { return }

        let latitudes = route.map { $0.latitude }
        let longitudes = route.map { $0.longitude }

        let minLat = latitudes.min() ?? 0
        let maxLat = latitudes.max() ?? 0
        let minLon = longitudes.min() ?? 0
        let maxLon = longitudes.max() ?? 0

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )

        let span = MKCoordinateSpan(
            latitudeDelta: max(maxLat - minLat, 0.01) * 1.3,
            longitudeDelta: max(maxLon - minLon, 0.01) * 1.3
        )

        region = MKCoordinateRegion(center: center, span: span)
    }
}

// MARK: - Metrics Grid View
struct MetricsGridView: View {
    let metrics: WalkingSessionMetrics

    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            MetricCard(
                title: "Duration",
                value: formatDuration(metrics.duration),
                icon: "timer",
                color: .blue
            )

            MetricCard(
                title: "Distance",
                value: String(format: "%.2f km", metrics.totalDistance / 1000),
                icon: "location",
                color: .green
            )

            MetricCard(
                title: "Steps",
                value: "\(metrics.totalSteps)",
                icon: "figure.walk",
                color: .orange
            )

            MetricCard(
                title: "Avg Speed",
                value: String(format: "%.2f m/s", metrics.averageSpeed),
                icon: "speedometer",
                color: .purple
            )

            MetricCard(
                title: "Cadence",
                value: String(format: "%.0f spm", metrics.averageCadence),
                icon: "metronome",
                color: .red
            )

            MetricCard(
                title: "Calories",
                value: String(format: "%.0f kcal", metrics.calories),
                icon: "flame",
                color: .pink
            )
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let formatter = DateComponentsFormatter()
        formatter.allowedUnits = [.hour, .minute, .second]
        formatter.unitsStyle = .abbreviated
        return formatter.string(from: duration) ?? "0s"
    }
}

// MARK: - Metric Card
struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Real-time Gait Card
struct RealTimeGaitCard: View {
    let gaitMetrics: GaitMetrics

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Real-time Gait Analysis")
                .font(.headline)
                .fontWeight(.semibold)

            HStack(spacing: 16) {
                GaitMetricIndicator(
                    title: "Speed",
                    value: String(format: "%.2f m/s", gaitMetrics.averageWalkingSpeed ?? 0),
                    color: .blue
                )

                GaitMetricIndicator(
                    title: "Cadence",
                    value: String(format: "%.0f spm", gaitMetrics.cadence ?? 0),
                    color: .orange
                )

                GaitMetricIndicator(
                    title: "Symmetry",
                    value: String(format: "%.1f%%", (1.0 - (gaitMetrics.walkingAsymmetry ?? 0)) * 100),
                    color: .green
                )
            }

            // Quality Indicator
            HStack {
                Text("Gait Quality:")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(gaitMetrics.quality?.rawValue.capitalized ?? "Unknown")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(gaitQualityColor)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }

    private var gaitQualityColor: Color {
        switch gaitMetrics.quality {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .red
        case .none: return .gray
        }
    }
}

// MARK: - Gait Metric Indicator
struct GaitMetricIndicator: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)

            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Progress Indicators View
struct ProgressIndicatorsView: View {
    let metrics: WalkingSessionMetrics

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress Goals")
                .font(.headline)
                .fontWeight(.semibold)

            VStack(spacing: 8) {
                ProgressBar(
                    title: "Steps Goal",
                    current: Double(metrics.totalSteps),
                    target: 10000,
                    unit: "steps",
                    color: .orange
                )

                ProgressBar(
                    title: "Distance Goal",
                    current: metrics.totalDistance / 1000,
                    target: 5.0,
                    unit: "km",
                    color: .green
                )

                ProgressBar(
                    title: "Duration Goal",
                    current: metrics.duration / 60,
                    target: 30,
                    unit: "min",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Progress Bar
struct ProgressBar: View {
    let title: String
    let current: Double
    let target: Double
    let unit: String
    let color: Color

    private var progress: Double {
        min(current / target, 1.0)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(String(format: "%.1f", current))/\(String(format: "%.0f", target)) \(unit)")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(.tertiarySystemBackground))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * progress, height: 6)
                        .cornerRadius(3)
                        .animation(.easeInOut(duration: 0.3), value: progress)
                }
            }
            .frame(height: 6)
        }
    }
}

// MARK: - Session Control Panel
struct SessionControlPanel: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker
    @State private var showingConfirmation = false

    var body: some View {
        VStack(spacing: 12) {
            if sessionTracker.isTracking {
                HStack(spacing: 16) {
                    // Pause/Resume Button
                    Button(action: {
                        if sessionTracker.currentSession?.isPaused == true {
                            sessionTracker.resumeSession()
                        } else {
                            sessionTracker.pauseSession()
                        }
                    }) {
                        HStack {
                            Image(systemName: sessionTracker.currentSession?.isPaused == true ? "play.fill" : "pause.fill")
                            Text(sessionTracker.currentSession?.isPaused == true ? "Resume" : "Pause")
                        }
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(12)
                    }

                    // Stop Button
                    Button(action: { showingConfirmation = true }) {
                        HStack {
                            Image(systemName: "stop.fill")
                            Text("Stop")
                        }
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
            } else {
                // Start Button
                Button(action: {
                    Task {
                        try await sessionTracker.startSession()
                    }
                }) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start Walking Session")
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(radius: 2)
        .confirmationDialog(
            "Stop Session",
            isPresented: $showingConfirmation,
            titleVisibility: .visible
        ) {
            Button("Stop Session", role: .destructive) {
                Task {
                    try await sessionTracker.stopSession()
                }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Are you sure you want to stop this walking session? Your progress will be saved.")
        }
    }
}

// MARK: - Supporting Types

enum SessionTab: String, CaseIterable {
    case overview = "overview"
    case realTime = "realTime"
    case map = "map"
    case analytics = "analytics"
}

struct RoutePoint: Identifiable {
    let id: Int
    let coordinate: CLLocationCoordinate2D
}

// MARK: - Placeholder Views

struct RealTimeTab: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("Real-time Monitoring")
                    .font(.title2)
                    .fontWeight(.bold)

                // Real-time charts and metrics would go here
                Text("Real-time gait analysis, heart rate monitoring, and coaching feedback")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
            }
            .padding()
        }
    }
}

struct MapTab: View {
    let route: [CLLocationCoordinate2D]
    let elevationProfile: [ElevationPoint]
    @Binding var mapRegion: MKCoordinateRegion

    var body: some View {
        VStack {
            Text("Route Map")
                .font(.title2)
                .fontWeight(.bold)

            // Full map view would go here
            Text("Interactive route map with elevation profile")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding()
        }
        .padding()
    }
}

struct AnalyticsTab: View {
    let gaitMetrics: GaitMetrics?
    let heartRateData: [HeartRatePoint]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("Advanced Analytics")
                    .font(.title2)
                    .fontWeight(.bold)

                // Advanced analytics charts would go here
                Text("Detailed gait analysis, heart rate zones, and performance insights")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
            }
            .padding()
        }
    }
}

struct SessionHistoryView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Session History")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Previous walking sessions will be displayed here")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()

                Spacer()
            }
            .padding()
            .navigationTitle("History")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct SessionSettingsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Session Settings")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Configure walking session preferences, goals, and notifications")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()

                Spacer()
            }
            .padding()
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
