import SwiftUI
import HealthKit
import WatchConnectivity

@available(watchOS 9.0, *)
struct VitalSenseWatchDashboard: View {
    @StateObject private var healthManager = WatchHealthManager.shared
    @StateObject private var connectivityManager = WatchAppConnectivityManager.shared
    @State private var selectedTab = 0
    @State private var showingHeartRateDetail = false
    @State private var animateHeartRate = false

    // Real-time data
    @State private var currentHeartRate: Double?
    @State private var dailySteps: Double?
    @State private var activeEnergy: Double?

    var body: some View {
        NavigationStack {
            TabView(selection: $selectedTab) {
                // Main Dashboard
                dashboardView
                    .tag(0)

                // Heart Rate Detail
                heartRateDetailView
                    .tag(1)

                // Activity Summary
                activitySummaryView
                    .tag(2)

                // Settings
                settingsView
                    .tag(3)
            }
            .tabViewStyle(.page)
            .navigationTitle("VitalSense")
            .onAppear {
                setupHealthMonitoring()
            }
        }
    }

    // MARK: - Dashboard View
    var dashboardView: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Connection Status
                connectionStatusView

                // Primary Metrics
                VStack(spacing: 12) {
                    // Heart Rate Card
                    heartRateCard

                    // Steps Card
                    stepsCard

                    // Energy Card
                    energyCard
                }

                // Quick Actions
                HStack(spacing: 12) {
                    Button(action: {
                        startWorkout()
                    }) {
                        VStack(spacing: 4) {
                            Image(systemName: "figure.run")
                                .font(.title2)
                            Text("Workout")
                                .font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(.green.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(PlainButtonStyle())

                    Button(action: {
                        sendDataToPhone()
                    }) {
                        VStack(spacing: 4) {
                            Image(systemName: "iphone")
                                .font(.title2)
                            Text("Sync")
                                .font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(.blue.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.horizontal, 4)
            }
            .padding(.horizontal, 8)
        }
    }

    // MARK: - Connection Status
    var connectionStatusView: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(connectivityManager.isConnectedToPhone ? .green : .red)
                .frame(width: 6, height: 6)
                .scaleEffect(connectivityManager.isConnectedToPhone ? 1.2 : 1.0)
                .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                          value: connectivityManager.isConnectedToPhone)

            Text(connectivityManager.isConnectedToPhone ? "Connected" : "Disconnected")
                .font(.caption2)
                .foregroundColor(.secondary)

            Spacer()

            if healthManager.isRealTimeMonitoringActive {
                HStack(spacing: 4) {
                    Image(systemName: "waveform.path.ecg")
                        .foregroundColor(.red)
                        .font(.caption2)
                    Text("Live")
                        .font(.caption2)
                        .foregroundColor(.red)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.regularMaterial)
        .clipShape(Capsule())
    }

    // MARK: - Heart Rate Card
    var heartRateCard: some View {
        Button(action: {
            showingHeartRateDetail.toggle()
        }) {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.title3)
                        .scaleEffect(animateHeartRate ? 1.2 : 1.0)
                        .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true),
                                  value: animateHeartRate)

                    Text("Heart Rate")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        if let heartRate = currentHeartRate {
                            Text("\(Int(heartRate))")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)

                            Text("bpm")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        } else {
                            Text("--")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    // Mini trend indicator
                    Image(systemName: "chevron.up")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
            .padding(12)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showingHeartRateDetail) {
            heartRateDetailView
        }
    }

    // MARK: - Steps Card
    var stepsCard: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                    .font(.title3)

                Text("Steps Today")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    if let steps = dailySteps {
                        Text("\(Int(steps))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        Text("steps")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Progress ring (simplified)
                Circle()
                    .stroke(.blue.opacity(0.3), lineWidth: 3)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .trim(from: 0, to: min((dailySteps ?? 0) / 10000, 1.0))
                            .stroke(.blue, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                    )
            }
        }
        .padding(12)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Energy Card
    var energyCard: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                    .font(.title3)

                Text("Active Energy")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    if let energy = activeEnergy {
                        Text("\(Int(energy))")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        Text("kcal")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Goal indicator
                Text("75%")
                    .font(.caption2)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.orange.opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .padding(12)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Heart Rate Detail View
    var heartRateDetailView: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Current heart rate
                VStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                        .font(.largeTitle)
                        .scaleEffect(animateHeartRate ? 1.3 : 1.0)
                        .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true),
                                  value: animateHeartRate)

                    if let heartRate = currentHeartRate {
                        Text("\(Int(heartRate))")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("beats per minute")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text("--")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)

                        Text("No recent data")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Heart rate zones
                VStack(alignment: .leading, spacing: 8) {
                    Text("Heart Rate Zones")
                        .font(.headline)

                    HeartRateZoneView(zone: "Resting", range: "50-70", isActive: (currentHeartRate ?? 0) < 70)
                    HeartRateZoneView(zone: "Fat Burn", range: "70-133", isActive: (currentHeartRate ?? 0) >= 70 && (currentHeartRate ?? 0) < 133)
                    HeartRateZoneView(zone: "Cardio", range: "133-162", isActive: (currentHeartRate ?? 0) >= 133 && (currentHeartRate ?? 0) < 162)
                    HeartRateZoneView(zone: "Peak", range: "162+", isActive: (currentHeartRate ?? 0) >= 162)
                }
                .padding()
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Quick actions
                VStack(spacing: 12) {
                    Button("Start Heart Rate Workout") {
                        startHeartRateWorkout()
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)

                    Button("Send to iPhone") {
                        sendHeartRateDataToPhone()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }
            .padding(.horizontal, 8)
        }
        .navigationTitle("Heart Rate")
    }

    // MARK: - Activity Summary View
    var activitySummaryView: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Today's summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Today's Activity")
                        .font(.headline)

                    ActivityRingView(
                        moveProgress: (activeEnergy ?? 0) / 400,
                        exerciseProgress: 0.6,
                        standProgress: 0.8
                    )

                    VStack(spacing: 8) {
                        ActivityMetricRow(title: "Move", value: "\(Int(activeEnergy ?? 0))", unit: "kcal", color: .red)
                        ActivityMetricRow(title: "Exercise", value: "24", unit: "min", color: .green)
                        ActivityMetricRow(title: "Stand", value: "10", unit: "hrs", color: .blue)
                    }
                }
                .padding()
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Weekly progress
                VStack(alignment: .leading, spacing: 12) {
                    Text("This Week")
                        .font(.headline)

                    WeeklyProgressView()
                }
                .padding()
                .background(.regularMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 8)
        }
        .navigationTitle("Activity")
    }

    // MARK: - Settings View
    var settingsView: some View {
        List {
            Section("Monitoring") {
                Toggle("Real-time Heart Rate", isOn: $healthManager.isRealTimeMonitoringActive)
                Toggle("Background Sync", isOn: .constant(true))
            }

            Section("Notifications") {
                Toggle("High Heart Rate", isOn: .constant(true))
                Toggle("Workout Reminders", isOn: .constant(false))
            }

            Section("Connectivity") {
                HStack {
                    Text("iPhone")
                    Spacer()
                    Text(connectivityManager.isConnectedToPhone ? "Connected" : "Disconnected")
                        .foregroundColor(connectivityManager.isConnectedToPhone ? .green : .red)
                }

                if !connectivityManager.isConnectedToPhone {
                    Button("Reconnect") {
                        connectivityManager.startSession()
                    }
                }
            } header: {
                Text("Connection")
            }
        }
        .navigationTitle("Settings")
    }

    // MARK: - Helper Functions
    private func setupHealthMonitoring() {
        healthManager.requestAuthorization { success in
            if success {
                healthManager.startRealTimeHeartRateMonitoring { heartRate in
                    DispatchQueue.main.async {
                        self.currentHeartRate = heartRate
                        self.animateHeartRate = true
                    }
                }

                healthManager.fetchTodaySteps { steps in
                    DispatchQueue.main.async {
                        self.dailySteps = steps
                    }
                }

                healthManager.fetchTodayActiveEnergy { energy in
                    DispatchQueue.main.async {
                        self.activeEnergy = energy
                    }
                }
            }
        }
    }

    private func startWorkout() {
        // Start a workout session
        healthManager.startWorkout()
    }

    private func startHeartRateWorkout() {
        // Start heart rate focused workout
        healthManager.startHeartRateWorkout()
    }

    private func sendDataToPhone() {
        connectivityManager.sendHealthDataToPhone([
            "heartRate:\(currentHeartRate ?? 0)",
            "steps:\(dailySteps ?? 0)",
            "activeEnergy:\(activeEnergy ?? 0)",
            "timestamp:\(Date().timeIntervalSince1970)"
        ])
    }

    private func sendHeartRateDataToPhone() {
        connectivityManager.sendHeartRateToPhone(currentHeartRate ?? 0)
    }
}

// MARK: - Supporting Views

struct HeartRateZoneView: View {
    let zone: String
    let range: String
    let isActive: Bool

    var body: some View {
        HStack {
            Circle()
                .fill(isActive ? .red : .gray.opacity(0.3))
                .frame(width: 8, height: 8)

            Text(zone)
                .font(.caption)
                .foregroundColor(isActive ? .primary : .secondary)

            Spacer()

            Text(range)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct ActivityRingView: View {
    let moveProgress: Double
    let exerciseProgress: Double
    let standProgress: Double

    var body: some View {
        ZStack {
            // Stand ring (outer)
            Circle()
                .stroke(.blue.opacity(0.3), lineWidth: 6)
                .frame(width: 60, height: 60)

            Circle()
                .trim(from: 0, to: min(standProgress, 1.0))
                .stroke(.blue, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .frame(width: 60, height: 60)
                .rotationEffect(.degrees(-90))

            // Exercise ring (middle)
            Circle()
                .stroke(.green.opacity(0.3), lineWidth: 6)
                .frame(width: 45, height: 45)

            Circle()
                .trim(from: 0, to: min(exerciseProgress, 1.0))
                .stroke(.green, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .frame(width: 45, height: 45)
                .rotationEffect(.degrees(-90))

            // Move ring (inner)
            Circle()
                .stroke(.red.opacity(0.3), lineWidth: 6)
                .frame(width: 30, height: 30)

            Circle()
                .trim(from: 0, to: min(moveProgress, 1.0))
                .stroke(.red, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .frame(width: 30, height: 30)
                .rotationEffect(.degrees(-90))
        }
    }
}

struct ActivityMetricRow: View {
    let title: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        HStack {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)

            Text(title)
                .font(.caption)

            Spacer()

            Text(value)
                .font(.caption)
                .fontWeight(.semibold)

            Text(unit)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

struct WeeklyProgressView: View {
    var body: some View {
        HStack {
            ForEach(0..<7) { day in
                VStack(spacing: 4) {
                    Text(["S", "M", "T", "W", "T", "F", "S"][day])
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(.red)
                        .frame(width: 12, height: CGFloat.random(in: 10...30))
                }
            }
        }
    }
}

#Preview {
    if #available(watchOS 9.0, *) {
        VitalSenseWatchDashboard()
    } else {
        Text("VitalSense Watch requires watchOS 9+")
    }
}
