import SwiftUI
import MapKit
import Charts

// MARK: - VitalSense Session Overview Tab
struct VitalSenseSessionOverviewTab: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker
    @Binding var mapRegion: MKCoordinateRegion
    @State private var animateCards = false

    var body: some View {
        ScrollView {
            LazyVStack(spacing: VitalSenseBrand.Layout.large) {
                // Main Control Card
                VitalSenseSessionControlCard(sessionTracker: sessionTracker)
                    .scaleEffect(animateCards ? 1.0 : 0.9)
                    .opacity(animateCards ? 1.0 : 0.0)
                    .animation(VitalSenseBrand.Animations.spring, value: animateCards)

                // Metrics Grid
                VitalSenseSessionMetricsGrid(metrics: sessionTracker.sessionMetrics)
                    .scaleEffect(animateCards ? 1.0 : 0.9)
                    .opacity(animateCards ? 1.0 : 0.0)
                    .animation(VitalSenseBrand.Animations.spring.delay(0.1), value: animateCards)

                // Mini Map
                VitalSenseMiniMapCard(
                    route: sessionTracker.route,
                    mapRegion: $mapRegion
                )
                .scaleEffect(animateCards ? 1.0 : 0.9)
                .opacity(animateCards ? 1.0 : 0.0)
                .animation(VitalSenseBrand.Animations.spring.delay(0.2), value: animateCards)

                // Recent Sessions
                VitalSenseRecentSessionsCard()
                    .scaleEffect(animateCards ? 1.0 : 0.9)
                    .opacity(animateCards ? 1.0 : 0.0)
                    .animation(VitalSenseBrand.Animations.spring.delay(0.3), value: animateCards)
            }
            .padding(VitalSenseBrand.Layout.medium)
        }
        .background(VitalSenseBrand.Colors.backgroundPrimary)
        .onAppear {
            withAnimation {
                animateCards = true
            }
        }
    }
}

// MARK: - VitalSense Real-Time Tab
struct VitalSenseRealTimeTab: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker
    @State private var animateCharts = false

    var body: some View {
        ScrollView {
            LazyVStack(spacing: VitalSenseBrand.Layout.large) {
                // Real-time Metrics
                VitalSenseRealTimeMetricsCard(
                    heartRate: sessionTracker.currentHeartRate,
                    cadence: sessionTracker.currentCadence,
                    speed: sessionTracker.sessionMetrics?.currentSpeed ?? 0
                )

                // Live Charts
                VitalSenseLiveChartsCard(sessionTracker: sessionTracker)

                // Gait Analysis
                VitalSenseRealTimeGaitCard(gaitMetrics: sessionTracker.currentGaitMetrics)
            }
            .padding(VitalSenseBrand.Layout.medium)
        }
        .background(VitalSenseBrand.Colors.backgroundPrimary)
        .scaleEffect(animateCharts ? 1.0 : 0.95)
        .opacity(animateCharts ? 1.0 : 0.0)
        .animation(VitalSenseBrand.Animations.spring, value: animateCharts)
        .onAppear {
            withAnimation(VitalSenseBrand.Animations.spring.delay(0.1)) {
                animateCharts = true
            }
        }
    }
}

// MARK: - VitalSense Map Tab
struct VitalSenseMapTab: View {
    let route: [CLLocationCoordinate2D]
    let elevationProfile: [ElevationPoint]
    @Binding var mapRegion: MKCoordinateRegion
    @State private var mapStyle: MapStyle = .standard
    @State private var showElevation = false

    var body: some View {
        VStack(spacing: 0) {
            // Map Controls
            VitalSenseMapControls(
                mapStyle: $mapStyle,
                showElevation: $showElevation
            )

            ZStack {
                // Main Map
                Map(coordinateRegion: $mapRegion, annotationItems: []) { _ in
                    // Route overlay would be implemented here
                }
                .mapStyle(mapStyle)

                // Overlay controls
                VStack {
                    Spacer()

                    HStack {
                        VitalSenseMapLegend()

                        Spacer()

                        VitalSenseMapStatsOverlay(
                            distance: calculateRouteDistance(),
                            elevation: calculateElevationGain()
                        )
                    }
                    .padding(VitalSenseBrand.Layout.medium)
                }
            }

            // Elevation Profile
            if showElevation {
                VitalSenseElevationProfileCard(elevationProfile: elevationProfile)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }

    private func calculateRouteDistance() -> Double {
        // Calculate total route distance
        return 0.0 // Placeholder
    }

    private func calculateElevationGain() -> Double {
        // Calculate total elevation gain
        return 0.0 // Placeholder
    }
}

// MARK: - Supporting Components

struct VitalSenseSessionControlCard: View {
    @ObservedObject var sessionTracker: WalkingSessionTracker
    @State private var animateButton = false

    var body: some View {
        VStack(spacing: VitalSenseBrand.Layout.large) {
            // Main Control Button
            Button(action: {
                withAnimation(VitalSenseBrand.Animations.bouncy) {
                    if sessionTracker.isTracking {
                        sessionTracker.stopSession()
                    } else {
                        sessionTracker.startSession()
                    }
                }
            }) {
                ZStack {
                    Circle()
                        .fill(
                            sessionTracker.isTracking ?
                            VitalSenseBrand.Colors.errorGradient :
                            VitalSenseBrand.Colors.successGradient
                        )
                        .frame(width: 120, height: 120)
                        .scaleEffect(animateButton ? 1.1 : 1.0)
                        .animation(
                            sessionTracker.isTracking ?
                            VitalSenseBrand.Animations.pulse.repeatForever(autoreverses: true) :
                            .default,
                            value: animateButton
                        )

                    Image(systemName: sessionTracker.isTracking ? "stop.fill" : "play.fill")
                        .foregroundStyle(Color.white)
                        .font(.system(size: 40, weight: .bold))
                }
            }
            .buttonStyle(PlainButtonStyle())

            // Status Text
            VStack(spacing: VitalSenseBrand.Layout.small) {
                Text(sessionTracker.isTracking ? "Recording Session" : "Ready to Start")
                    .font(VitalSenseBrand.Typography.heading2)
                    .fontWeight(.bold)
                    .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

                Text(sessionTracker.isTracking ? "Tap to stop and save" : "Tap to begin tracking")
                    .font(VitalSenseBrand.Typography.body)
                    .foregroundStyle(VitalSenseBrand.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(VitalSenseBrand.Layout.extraLarge)
        .vitalSenseCard()
        .onAppear {
            animateButton = true
        }
    }
}

struct VitalSenseSessionMetricsGrid: View {
    let metrics: SessionMetrics?

    private let columns = [
        GridItem(.flexible(), spacing: VitalSenseBrand.Layout.medium),
        GridItem(.flexible(), spacing: VitalSenseBrand.Layout.medium)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: VitalSenseBrand.Layout.medium) {
            Text("Session Metrics")
                .font(VitalSenseBrand.Typography.heading3)
                .foregroundStyle(VitalSenseBrand.Colors.textPrimary)

            LazyVGrid(columns: columns, spacing: VitalSenseBrand.Layout.medium) {
                VitalSenseMetricCard(
                    title: "Distance",
                    value: formatDistance(metrics?.distance ?? 0),
                    unit: "",
                    trend: .neutral,
                    isSelected: false,
                    gradient: VitalSenseBrand.Colors.primaryGradient
                ) { }

                VitalSenseMetricCard(
                    title: "Avg Speed",
                    value: formatSpeed(metrics?.averageSpeed ?? 0),
                    unit: "",
                    trend: .neutral,
                    isSelected: false,
                    gradient: VitalSenseBrand.Colors.accentGradient
                ) { }

                VitalSenseMetricCard(
                    title: "Calories",
                    value: "\(Int(metrics?.caloriesBurned ?? 0))",
                    unit: "kcal",
                    trend: .neutral,
                    isSelected: false,
                    gradient: VitalSenseBrand.Colors.successGradient
                ) { }

                VitalSenseMetricCard(
                    title: "Heart Rate",
                    value: "\(Int(metrics?.averageHeartRate ?? 0))",
                    unit: "bpm",
                    trend: .neutral,
                    isSelected: false,
                    gradient: VitalSenseBrand.Colors.warningGradient
                ) { }
            }
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
