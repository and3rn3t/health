//
//  ComprehensiveWatchGaitView.swift
//  VitalSenseWatch Watch App
//
//  Advanced gait analysis and monitoring for Apple Watch
//  Created: 2024-12-19
//

import SwiftUI
import HealthKit
import CoreMotion
import WatchConnectivity
import OSLog
import Combine

struct ComprehensiveWatchGaitView: View {
    @StateObject private var gaitManager = WatchGaitManager()
    @StateObject private var healthManager = WatchHealthManager.shared
    @StateObject private var connectivityManager = WatchAppConnectivityManager.shared

    @State private var isMonitoring = false
    @State private var showingStartWorkout = false
    @State private var showingGaitDetail = false
    @State private var hapticFeedbackEnabled = true

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 12) {
                    // Monitoring Status Card
                    monitoringStatusCard

                    // Real-time Gait Metrics
                    if isMonitoring {
                        realTimeGaitMetrics
                    }

                    // Gait Assessment Summary
                    gaitAssessmentSummary

                    // Fall Risk Indicator
                    fallRiskIndicator

                    // Quick Actions
                    quickActionsSection
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Gait Analysis")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        showingGaitDetail.toggle()
                    }) {
                        Image(systemName: "chart.bar.doc.horizontal")
                    }
                }
            }
        }
        .sheet(isPresented: $showingGaitDetail) {
            GaitDetailView(gaitData: gaitManager.currentGaitData)
        }
        .onAppear {
            gaitManager.startMonitoring()
        }
        .onDisappear {
            if !isMonitoring {
                gaitManager.stopMonitoring()
            }
        }
    }

    // MARK: - Monitoring Status Card

    private var monitoringStatusCard: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: isMonitoring ? "figure.walk.motion" : "figure.walk")
                    .font(.title2)
                    .foregroundStyle(isMonitoring ? .green : .secondary)
                    .animation(.easeInOut(duration: 0.3), value: isMonitoring)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Gait Monitoring")
                        .font(.headline)

                    Text(isMonitoring ? "Active" : "Standby")
                        .font(.caption)
                        .foregroundStyle(isMonitoring ? .green : .secondary)
                }

                Spacer()

                Button(action: toggleMonitoring) {
                    Image(systemName: isMonitoring ? "stop.circle.fill" : "play.circle.fill")
                        .font(.title)
                        .foregroundStyle(isMonitoring ? .red : .green)
                }
                .buttonStyle(.plain)
            }
            .padding()
        }
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Real-time Gait Metrics

    private var realTimeGaitMetrics: some View {
        VStack(spacing: 8) {
            Text("Live Metrics")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 8) {
                GaitMetricCard(
                    title: "Cadence",
                    value: "\(Int(gaitManager.currentGaitData.cadence))",
                    unit: "steps/min",
                    color: .blue,
                    icon: "metronome"
                )

                GaitMetricCard(
                    title: "Speed",
                    value: String(format: "%.1f", gaitManager.currentGaitData.walkingSpeed),
                    unit: "m/s",
                    color: .green,
                    icon: "speedometer"
                )
            }

            HStack(spacing: 8) {
                GaitMetricCard(
                    title: "Step Length",
                    value: String(format: "%.0f", gaitManager.currentGaitData.stepLength * 100),
                    unit: "cm",
                    color: .orange,
                    icon: "ruler"
                )

                GaitMetricCard(
                    title: "Asymmetry",
                    value: String(format: "%.1f", gaitManager.currentGaitData.walkingAsymmetry * 100),
                    unit: "%",
                    color: gaitManager.currentGaitData.walkingAsymmetry > 0.1 ? .red : .green,
                    icon: "scale.3d"
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Gait Assessment Summary

    private var gaitAssessmentSummary: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Gait Assessment")
                    .font(.headline)

                Spacer()

                Text(gaitManager.gaitQualityScore, format: .percent.precision(.fractionLength(0)))
                    .font(.title2.bold())
                    .foregroundStyle(gaitQualityColor)
            }

            ProgressView(value: gaitManager.gaitQualityScore)
                .tint(gaitQualityColor)

            Text(gaitQualityDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Fall Risk Indicator

    private var fallRiskIndicator: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: fallRiskIcon)
                    .font(.title2)
                    .foregroundStyle(fallRiskColor)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Fall Risk")
                        .font(.headline)

                    Text(fallRiskDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack {
                    Text("\(Int(gaitManager.fallRiskScore * 100))")
                        .font(.title2.bold())
                        .foregroundStyle(fallRiskColor)

                    Text("SCORE")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            if gaitManager.fallRiskScore > 0.3 {
                Text("⚠️ Consider taking breaks and walking more carefully")
                    .font(.caption2)
                    .foregroundStyle(.orange)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Quick Actions

    private var quickActionsSection: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                Button(action: startWorkoutSession) {
                    Label("Start Workout", systemImage: "figure.run")
                        .font(.caption)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)

                Button(action: syncToiPhone) {
                    Label("Sync to iPhone", systemImage: "iphone")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }

            HStack(spacing: 12) {
                Button(action: emergencyContact) {
                    Label("Emergency", systemImage: "exclamationmark.triangle.fill")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .foregroundStyle(.red)

                Button(action: toggleHaptics) {
                    Label(hapticFeedbackEnabled ? "Haptics On" : "Haptics Off",
                          systemImage: hapticFeedbackEnabled ? "iphone.radiowaves.left.and.right" : "iphone.slash")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
    }

    // MARK: - Computed Properties

    private var gaitQualityColor: Color {
        switch gaitManager.gaitQualityScore {
        case 0.8...1.0: return .green
        case 0.6..<0.8: return .blue
        case 0.4..<0.6: return .yellow
        case 0.2..<0.4: return .orange
        default: return .red
        }
    }

    private var gaitQualityDescription: String {
        switch gaitManager.gaitQualityScore {
        case 0.8...1.0: return "Excellent gait pattern"
        case 0.6..<0.8: return "Good gait stability"
        case 0.4..<0.6: return "Moderate gait quality"
        case 0.2..<0.4: return "Poor gait pattern"
        default: return "Very poor gait stability"
        }
    }

    private var fallRiskColor: Color {
        switch gaitManager.fallRiskScore {
        case 0.0..<0.2: return .green
        case 0.2..<0.4: return .yellow
        case 0.4..<0.6: return .orange
        case 0.6..<0.8: return .red
        default: return .purple
        }
    }

    private var fallRiskIcon: String {
        switch gaitManager.fallRiskScore {
        case 0.0..<0.2: return "checkmark.shield.fill"
        case 0.2..<0.4: return "exclamationmark.shield"
        case 0.4..<0.6: return "exclamationmark.triangle.fill"
        default: return "xmark.shield.fill"
        }
    }

    private var fallRiskDescription: String {
        switch gaitManager.fallRiskScore {
        case 0.0..<0.2: return "Low Risk"
        case 0.2..<0.4: return "Moderate Risk"
        case 0.4..<0.6: return "High Risk"
        case 0.6..<0.8: return "Very High Risk"
        default: return "Critical Risk"
        }
    }

    // MARK: - Actions

    private func toggleMonitoring() {
        withAnimation {
            isMonitoring.toggle()
        }

        if isMonitoring {
            gaitManager.startActiveMonitoring()

            // Haptic feedback
            if hapticFeedbackEnabled {
                WKInterfaceDevice.current().play(.start)
            }
        } else {
            gaitManager.stopActiveMonitoring()

            if hapticFeedbackEnabled {
                WKInterfaceDevice.current().play(.stop)
            }
        }
    }

    private func startWorkoutSession() {
        showingStartWorkout = true
        gaitManager.startWorkoutSession()

        if hapticFeedbackEnabled {
            WKInterfaceDevice.current().play(.click)
        }
    }

    private func syncToiPhone() {
        let gaitDict = [
            "walkingSpeed": gaitManager.currentGaitData.walkingSpeed,
            "stepLength": gaitManager.currentGaitData.stepLength,
            "cadence": gaitManager.currentGaitData.cadence,
            "walkingAsymmetry": gaitManager.currentGaitData.walkingAsymmetry,
            "doubleSupportPercentage": gaitManager.currentGaitData.doubleSupportPercentage
        ] as [String: Any]
        connectivityManager.sendQuickEvent(gaitDict)

        if hapticFeedbackEnabled {
            WKInterfaceDevice.current().play(.success)
        }
    }

    private func emergencyContact() {
        // Trigger emergency contact system
        connectivityManager.sendQuickEvent(["emergencyAlert": true, "timestamp": Date().timeIntervalSince1970])

        if hapticFeedbackEnabled {
            WKInterfaceDevice.current().play(.failure)
        }
    }

    private func toggleHaptics() {
        hapticFeedbackEnabled.toggle()

        if hapticFeedbackEnabled {
            WKInterfaceDevice.current().play(.click)
        }
    }
}

// MARK: - Gait Metric Card

struct GaitMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)

            Text(value)
                .font(.title3.bold())
                .foregroundStyle(.primary)

            Text(unit)
                .font(.caption2)
                .foregroundStyle(.secondary)

            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(8)
        .frame(maxWidth: .infinity)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Gait Detail View

struct GaitDetailView: View {
    let gaitData: GaitAnalysisData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Detailed metrics
                    detailedMetricsSection

                    // Historical trends
                    historicalTrendsSection

                    // Recommendations
                    recommendationsSection
                }
                .padding()
            }
            .navigationTitle("Gait Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var detailedMetricsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Detailed Metrics")
                .font(.headline)

            VStack(spacing: 4) {
                MetricRow(title: "Walking Speed", value: String(format: "%.2f m/s", gaitData.walkingSpeed))
                MetricRow(title: "Step Length", value: String(format: "%.0f cm", gaitData.stepLength * 100))
                MetricRow(title: "Cadence", value: String(format: "%.0f steps/min", gaitData.cadence))
                MetricRow(title: "Asymmetry", value: String(format: "%.1f%%", gaitData.walkingAsymmetry * 100))
                MetricRow(title: "Double Support", value: String(format: "%.1f%%", gaitData.doubleSupportPercentage * 100))
            }
        }
    }

    private var historicalTrendsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("7-Day Trend")
                .font(.headline)

            Text("Coming Soon: Trend charts and historical analysis")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recommendations")
                .font(.headline)

            VStack(alignment: .leading, spacing: 4) {
                if gaitData.walkingAsymmetry > 0.1 {
                    RecommendationRow(
                        icon: "exclamationmark.triangle",
                        text: "High asymmetry detected. Consider consulting a healthcare provider.",
                        color: .orange
                    )
                }

                if gaitData.walkingSpeed < 1.0 {
                    RecommendationRow(
                        icon: "figure.walk",
                        text: "Walking speed is below average. Try to increase pace gradually.",
                        color: .blue
                    )
                }

                RecommendationRow(
                    icon: "heart.fill",
                    text: "Maintain regular walking exercise for optimal health.",
                    color: .green
                )
            }
        }
    }
}

struct MetricRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
            Spacer()
            Text(value)
                .font(.caption.bold())
        }
    }
}

struct RecommendationRow: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.caption)

            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Watch Gait Manager

class WatchGaitManager: ObservableObject {
    @Published var currentGaitData = GaitAnalysisData()
    @Published var isMonitoring = false
    @Published var gaitQualityScore: Double = 0.75
    @Published var fallRiskScore: Double = 0.15

    private let motionManager = CMMotionManager()
    private let pedometer = CMPedometer()
    private let logger = Logger(subsystem: "com.vitalsense.watch", category: "GaitManager")

    init() {
        setupMotionTracking()
    }

    private func setupMotionTracking() {
        guard motionManager.isDeviceMotionAvailable else {
            logger.error("Device motion not available")
            return
        }

        motionManager.deviceMotionUpdateInterval = 0.1
    }

    func startMonitoring() {
        logger.info("Starting gait monitoring")
        isMonitoring = true

        // Start motion updates
        if motionManager.isDeviceMotionAvailable {
            motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
                guard let motion = motion else { return }
                self?.processMotionData(motion)
            }
        }

        // Start pedometer updates
        if CMPedometer.isStepCountingAvailable() {
            pedometer.startUpdates(from: Date()) { [weak self] data, error in
                guard let data = data else { return }
                DispatchQueue.main.async {
                    self?.processPedometerData(data)
                }
            }
        }
    }

    func stopMonitoring() {
        logger.info("Stopping gait monitoring")
        isMonitoring = false
        motionManager.stopDeviceMotionUpdates()
        pedometer.stopUpdates()
    }

    func startActiveMonitoring() {
        startMonitoring()
        // Additional active monitoring features
    }

    func stopActiveMonitoring() {
        stopMonitoring()
        // Save session data
    }

    func startWorkoutSession() {
        logger.info("Starting workout session")
        // Implement HKWorkoutSession integration
    }

    private func processMotionData(_ motion: CMDeviceMotion) {
        // Process motion data for gait analysis
        let userAcceleration = motion.userAcceleration
        let rotationRate = motion.rotationRate

        // Update gait metrics based on motion data
        updateGaitMetrics(acceleration: userAcceleration, rotation: rotationRate)
    }

    private func processPedometerData(_ data: CMPedometerData) {
        // Update step-based metrics
        if let cadence = data.currentCadence {
            currentGaitData.cadence = cadence.doubleValue
        }

        if let pace = data.currentPace {
            currentGaitData.walkingSpeed = 1.0 / pace.doubleValue // Convert pace to speed
        }
    }

    private func updateGaitMetrics(acceleration: CMAcceleration, rotation: CMRotationRate) {
        // Implement gait analysis algorithms
        // This is a simplified version - real implementation would be more complex

        let totalAcceleration = sqrt(acceleration.x * acceleration.x +
                                   acceleration.y * acceleration.y +
                                   acceleration.z * acceleration.z)

        // Update walking steadiness based on acceleration patterns
        if totalAcceleration > 0.5 {
            // Detected walking
            currentGaitData.walkingAsymmetry = min(0.3, totalAcceleration * 0.1)

            // Update gait quality score
            gaitQualityScore = max(0.0, min(1.0, 1.0 - currentGaitData.walkingAsymmetry * 2))

            // Update fall risk score
            fallRiskScore = min(1.0, currentGaitData.walkingAsymmetry * 3 + (totalAcceleration > 2.0 ? 0.2 : 0.0))
        }
    }
}

// MARK: - Supporting Types

struct GaitAnalysisData {
    var walkingSpeed: Double = 1.2
    var stepLength: Double = 0.65
    var cadence: Double = 110.0
    var walkingAsymmetry: Double = 0.05
    var doubleSupportPercentage: Double = 0.25
    var walkingSteadiness: Double = 0.85

    var timestamp: Date = Date()
}
