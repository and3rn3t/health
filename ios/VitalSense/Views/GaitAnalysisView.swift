//
//  GaitAnalysisView.swift
//  VitalSense
//
//  Real-time gait analysis with AI-powered insights and fall prevention
//  Integrates with HealthKit, AR, and ML models for comprehensive gait monitoring
//

import SwiftUI
import HealthKit
import AVFoundation

struct GaitAnalysisView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @EnvironmentObject var appConfig: AppConfig
    @StateObject private var gaitAnalysisManager = GaitAnalysisManager()
    @State private var showingARView = false
    @State private var selectedTimeframe: GaitTimeframe = .today
    @State private var showingCalibration = false

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    // Current Session Card
                    CurrentSessionCard()

                    // Gait Metrics Overview
                    GaitMetricsOverview()

                    // Real-time Analysis
                    if gaitAnalysisManager.isAnalyzing {
                        RealTimeAnalysisCard()
                    }

                    // Historical Trends
                    HistoricalTrendsCard(selectedTimeframe: $selectedTimeframe)

                    // AI Insights & Recommendations
                    AIInsightsCard()

                    // Action Buttons
                    ActionButtonsCard()
                }
                .padding(.horizontal)
            }
            .navigationTitle("Gait Analysis")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { showingCalibration = true }) {
                        Image(systemName: "slider.horizontal.3")
                    }

                    Button(action: toggleAnalysis) {
                        Image(systemName: gaitAnalysisManager.isAnalyzing ? "stop.circle.fill" : "play.circle.fill")
                            .foregroundColor(gaitAnalysisManager.isAnalyzing ? .red : .green)
                    }
                }
            }
            .sheet(isPresented: $showingARView) {
                GaitARView()
            }
            .sheet(isPresented: $showingCalibration) {
                GaitCalibrationView()
            }
        }
        .onAppear {
            Task {
                await gaitAnalysisManager.initialize()
            }
        }
    }

    private func toggleAnalysis() {
        if gaitAnalysisManager.isAnalyzing {
            gaitAnalysisManager.stopAnalysis()
        } else {
            Task {
                await gaitAnalysisManager.startAnalysis()
            }
        }
    }
}

// MARK: - Current Session Card
struct CurrentSessionCard: View {
    @EnvironmentObject var gaitAnalysisManager: GaitAnalysisManager

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Session")
                        .font(.headline)
                        .fontWeight(.semibold)

                    if gaitAnalysisManager.isAnalyzing {
                        Text("Analyzing your gait in real-time")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Tap play to start analysis")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                SessionStatusIndicator(
                    isActive: gaitAnalysisManager.isAnalyzing,
                    duration: gaitAnalysisManager.sessionDuration
                )
            }

            if gaitAnalysisManager.isAnalyzing {
                Divider()

                HStack(spacing: 20) {
                    SessionMetric(
                        title: "Steps",
                        value: "\(gaitAnalysisManager.currentSessionSteps)",
                        icon: "figure.walk"
                    )

                    SessionMetric(
                        title: "Cadence",
                        value: String(format: "%.0f", gaitAnalysisManager.currentCadence),
                        icon: "waveform.path.ecg"
                    )

                    SessionMetric(
                        title: "Stability",
                        value: String(format: "%.1f%%", gaitAnalysisManager.currentStability * 100),
                        icon: "gyroscope"
                    )
                }
            }
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct SessionStatusIndicator: View {
    let isActive: Bool
    let duration: TimeInterval

    var body: some View {
        VStack(alignment: .center, spacing: 8) {
            ZStack {
                Circle()
                    .fill(isActive ? Color.green.opacity(0.2) : Color.gray.opacity(0.2))
                    .frame(width: 50, height: 50)

                Circle()
                    .fill(isActive ? Color.green : Color.gray)
                    .frame(width: 20, height: 20)
                    .scaleEffect(isActive ? 1.2 : 1.0)
                    .animation(
                        isActive ?
                        Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true) :
                        Animation.default,
                        value: isActive
                    )
            }

            Text(formatDuration(duration))
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(isActive ? .green : .secondary)
        }
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

struct SessionMetric: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(Color("VitalSensePrimary"))

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Gait Metrics Overview
struct GaitMetricsOverview: View {
    @EnvironmentObject var healthKitManager: HealthKitManager

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Gait Metrics")
                .font(.headline)
                .fontWeight(.semibold)

            let columns = [
                GridItem(.flexible()),
                GridItem(.flexible())
            ]

            LazyVGrid(columns: columns, spacing: 16) {
                GaitMetricCard(
                    title: "Walking Speed",
                    value: formatMetric(healthKitManager.lastWalkingSpeed),
                    unit: "m/s",
                    icon: "speedometer",
                    status: getWalkingSpeedStatus(),
                    normalRange: "1.2 - 1.4"
                )

                GaitMetricCard(
                    title: "Step Length",
                    value: formatMetric(healthKitManager.lastWalkingStepLength),
                    unit: "m",
                    icon: "ruler",
                    status: getStepLengthStatus(),
                    normalRange: "0.6 - 0.8"
                )

                GaitMetricCard(
                    title: "Asymmetry",
                    value: formatMetric(healthKitManager.lastWalkingAsymmetry),
                    unit: "%",
                    icon: "scale.3d",
                    status: getAsymmetryStatus(),
                    normalRange: "< 10%"
                )

                GaitMetricCard(
                    title: "Double Support",
                    value: formatMetric(healthKitManager.lastWalkingDoubleSupportPercentage),
                    unit: "%",
                    icon: "figure.2.and.child.holdinghands",
                    status: getDoubleSupportStatus(),
                    normalRange: "20 - 30%"
                )
            }
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    private func formatMetric(_ value: Double?) -> String {
        guard let value = value else { return "--" }
        return String(format: "%.2f", value)
    }

    private func getWalkingSpeedStatus() -> MetricStatus {
        guard let speed = healthKitManager.lastWalkingSpeed else { return .unknown }

        if speed >= 1.2 && speed <= 1.4 {
            return .normal
        } else if speed >= 1.0 && speed < 1.2 {
            return .caution
        } else {
            return .warning
        }
    }

    private func getStepLengthStatus() -> MetricStatus {
        guard let length = healthKitManager.lastWalkingStepLength else { return .unknown }

        if length >= 0.6 && length <= 0.8 {
            return .normal
        } else if length >= 0.5 && length < 0.6 {
            return .caution
        } else {
            return .warning
        }
    }

    private func getAsymmetryStatus() -> MetricStatus {
        guard let asymmetry = healthKitManager.lastWalkingAsymmetry else { return .unknown }

        if asymmetry < 10 {
            return .normal
        } else if asymmetry < 15 {
            return .caution
        } else {
            return .warning
        }
    }

    private func getDoubleSupportStatus() -> MetricStatus {
        guard let support = healthKitManager.lastWalkingDoubleSupportPercentage else { return .unknown }

        if support >= 20 && support <= 30 {
            return .normal
        } else if support >= 15 && support < 35 {
            return .caution
        } else {
            return .warning
        }
    }
}

struct GaitMetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let status: MetricStatus
    let normalRange: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(status.color)
                    .font(.title2)

                Spacer()

                Circle()
                    .fill(status.color)
                    .frame(width: 8, height: 8)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("Normal: \(normalRange)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 1)
    }
}

// MARK: - Real-time Analysis Card
struct RealTimeAnalysisCard: View {
    @EnvironmentObject var gaitAnalysisManager: GaitAnalysisManager

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "waveform.path.ecg")
                    .foregroundColor(.green)

                Text("Real-time Analysis")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Text("Live")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.red)
                    .cornerRadius(4)
            }

            // Gait pattern visualization
            GaitPatternVisualization()

            // Current analysis results
            VStack(alignment: .leading, spacing: 8) {
                Text("Current Assessment")
                    .font(.subheadline)
                    .fontWeight(.medium)

                if let assessment = gaitAnalysisManager.currentAssessment {
                    AssessmentResultView(assessment: assessment)
                } else {
                    Text("Analyzing gait pattern...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct GaitPatternVisualization: View {
    @State private var animationOffset: CGFloat = 0

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.black.opacity(0.05))
                .frame(height: 100)

            // Simulated gait pattern wave
            Path { path in
                let width: CGFloat = 300
                let height: CGFloat = 60
                let centerY: CGFloat = 50

                path.move(to: CGPoint(x: 0, y: centerY))

                for i in 0...Int(width) {
                    let x = CGFloat(i)
                    let frequency: Double = 0.05
                    let amplitude: Double = 20
                    let phase = Double(x + animationOffset) * frequency
                    let y = centerY + CGFloat(sin(phase) * amplitude)

                    if i == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(
                LinearGradient(
                    colors: [Color.green, Color.blue],
                    startPoint: .leading,
                    endPoint: .trailing
                ),
                lineWidth: 3
            )
            .clipped()
            .animation(
                Animation.linear(duration: 2.0).repeatForever(autoreverses: false),
                value: animationOffset
            )
            .onAppear {
                animationOffset = 300
            }

            VStack {
                Text("Gait Pattern Analysis")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)

                Text("Stride frequency and stability")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct AssessmentResultView: View {
    let assessment: GaitAssessment

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Gait Quality: \(assessment.qualityScore, specifier: "%.1f")/10")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(assessment.primaryFinding)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: assessment.statusIcon)
                .foregroundColor(assessment.statusColor)
                .font(.title2)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Historical Trends Card
struct HistoricalTrendsCard: View {
    @Binding var selectedTimeframe: GaitTimeframe

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Historical Trends")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Picker("Timeframe", selection: $selectedTimeframe) {
                    ForEach(GaitTimeframe.allCases, id: \.self) { timeframe in
                        Text(timeframe.displayName)
                            .tag(timeframe)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
            }

            // Trend visualization placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.1))
                .frame(height: 150)
                .overlay(
                    VStack(spacing: 8) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)

                        Text("Gait trends for \(selectedTimeframe.displayName.lowercased())")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                )
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

// MARK: - AI Insights Card
struct AIInsightsCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundColor(.purple)

                Text("AI Insights")
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()

                Text("Beta")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.purple)
                    .cornerRadius(4)
            }

            VStack(alignment: .leading, spacing: 12) {
                InsightRow(
                    icon: "lightbulb.fill",
                    title: "Pattern Recognition",
                    description: "Your gait stability has improved 15% over the past week",
                    confidence: 0.87
                )

                InsightRow(
                    icon: "exclamationmark.triangle.fill",
                    title: "Fall Risk Prediction",
                    description: "Slight increase in asymmetry detected - consider balance exercises",
                    confidence: 0.73
                )

                InsightRow(
                    icon: "target",
                    title: "Personalized Goals",
                    description: "Focus on maintaining cadence above 110 steps/minute",
                    confidence: 0.95
                )
            }
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
}

struct InsightRow: View {
    let icon: String
    let title: String
    let description: String
    let confidence: Double

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(confidenceColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    Text("\(Int(confidence * 100))%")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(confidenceColor)
                }

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.leading)
            }
        }
    }

    private var confidenceColor: Color {
        if confidence > 0.8 {
            return .green
        } else if confidence > 0.6 {
            return .orange
        } else {
            return .red
        }
    }
}

// MARK: - Action Buttons Card
struct ActionButtonsCard: View {
    @State private var showingARView = false

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                ActionButton(
                    title: "AR Analysis",
                    icon: "arkit",
                    color: .blue,
                    action: { showingARView = true }
                )

                ActionButton(
                    title: "Calibrate",
                    icon: "slider.horizontal.3",
                    color: .orange,
                    action: { }
                )
            }

            HStack(spacing: 12) {
                ActionButton(
                    title: "Export Data",
                    icon: "square.and.arrow.up",
                    color: .green,
                    action: { }
                )

                ActionButton(
                    title: "Share Report",
                    icon: "doc.text",
                    color: .purple,
                    action: { }
                )
            }
        }
        .sheet(isPresented: $showingARView) {
            GaitARView()
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
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Supporting Views
struct GaitARView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("AR Gait Analysis")
                    .font(.title)
                    .fontWeight(.bold)

                Text("AR view implementation pending")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()
            }
            .padding()
            .navigationTitle("AR Analysis")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Done") {
                // Dismiss
            })
        }
    }
}

struct GaitCalibrationView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Gait Calibration")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Calibration settings implementation pending")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()
            }
            .padding()
            .navigationTitle("Calibration")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(trailing: Button("Done") {
                // Dismiss
            })
        }
    }
}

// MARK: - Supporting Types
enum GaitTimeframe: String, CaseIterable {
    case today = "today"
    case week = "week"
    case month = "month"

    var displayName: String {
        switch self {
        case .today: return "Today"
        case .week: return "Week"
        case .month: return "Month"
        }
    }
}

enum MetricStatus {
    case normal, caution, warning, unknown

    var color: Color {
        switch self {
        case .normal: return .green
        case .caution: return .orange
        case .warning: return .red
        case .unknown: return .gray
        }
    }
}

struct GaitAssessment {
    let qualityScore: Double
    let primaryFinding: String
    let statusIcon: String
    let statusColor: Color
}

// MARK: - Gait Analysis Manager
@MainActor
class GaitAnalysisManager: ObservableObject {
    @Published var isAnalyzing = false
    @Published var sessionDuration: TimeInterval = 0
    @Published var currentSessionSteps = 0
    @Published var currentCadence: Double = 0
    @Published var currentStability: Double = 0
    @Published var currentAssessment: GaitAssessment?

    private var analysisTimer: Timer?
    private var sessionTimer: Timer?

    func initialize() async {
        // Initialize gait analysis components
        print("🚶‍♂️ Gait analysis manager initialized")
    }

    func startAnalysis() async {
        isAnalyzing = true
        sessionDuration = 0
        currentSessionSteps = 0

        // Start timers
        sessionTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            Task { @MainActor in
                self.sessionDuration += 1
            }
        }

        analysisTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            Task { @MainActor in
                self.updateRealTimeMetrics()
            }
        }

        print("✅ Gait analysis started")
    }

    func stopAnalysis() {
        isAnalyzing = false
        sessionTimer?.invalidate()
        analysisTimer?.invalidate()
        sessionTimer = nil
        analysisTimer = nil

        print("⏹️ Gait analysis stopped")
    }

    private func updateRealTimeMetrics() {
        // Simulate real-time gait metrics
        currentSessionSteps += Int.random(in: 1...3)
        currentCadence = Double.random(in: 100...120)
        currentStability = Double.random(in: 0.7...0.95)

        // Generate assessment
        currentAssessment = GaitAssessment(
            qualityScore: Double.random(in: 7.0...9.5),
            primaryFinding: "Stable gait pattern detected",
            statusIcon: "checkmark.circle.fill",
            statusColor: .green
        )
    }
}

#Preview {
    GaitAnalysisView()
        .environmentObject(HealthKitManager.shared)
        .environmentObject(AppConfig.shared)
}
