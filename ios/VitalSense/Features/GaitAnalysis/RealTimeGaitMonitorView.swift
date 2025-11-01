//
//  RealTimeGaitMonitorView.swift
//  VitalSense
//
//  Real-time gait monitoring interface with emergency alerts and ML insights
//  Created: 2025-11-01
//

import SwiftUI
import Charts

struct RealTimeGaitMonitorView: View {
    @StateObject private var gaitMonitor = RealTimeGaitMonitor.shared
    @State private var showingEmergencyAlert = false
    @State private var showingCalibration = false
    @State private var showingRecommendations = false
    @State private var pulseAnimation = false

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Header Status
                headerStatusView

                // Current Gait State
                currentGaitStateView

                // Real-time Metrics
                if let metrics = gaitMonitor.realTimeMetrics {
                    realTimeMetricsView(metrics: metrics)
                }

                // Fall Risk Assessment
                fallRiskAssessmentView

                // Recommendations
                if !gaitMonitor.gaitRecommendations.isEmpty {
                    recommendationsView
                }

                // Controls
                controlsView
            }
            .padding(.horizontal)
        }
        .navigationTitle("Real-Time Gait Monitor")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button("Calibrate") {
                    showingCalibration = true
                }

                if gaitMonitor.isMonitoring {
                    Button("Stop") {
                        gaitMonitor.stopMonitoring()
                    }
                    .foregroundColor(.red)
                }
            }
        }
        .alert("Emergency Alert", isPresented: $showingEmergencyAlert) {
            if let alert = gaitMonitor.emergencyAlert {
                Button("Dismiss", role: .cancel) {
                    // Handle emergency dismissal
                }
                Button("Call Emergency", role: .destructive) {
                    // Handle emergency call
                }
            }
        } message: {
            if let alert = gaitMonitor.emergencyAlert {
                Text(alert.message)
            }
        }
        .sheet(isPresented: $showingCalibration) {
            GaitCalibrationView()
        }
        .sheet(isPresented: $showingRecommendations) {
            GaitRecommendationsView(recommendations: gaitMonitor.gaitRecommendations)
        }
        .onChange(of: gaitMonitor.emergencyAlert) { alert in
            if alert != nil {
                showingEmergencyAlert = true
            }
        }
        .onAppear {
            startPulseAnimation()
        }
    }

    // MARK: - Header Status View

    private var headerStatusView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Gait Monitoring")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text(gaitMonitor.isMonitoring ? "Active" : "Inactive")
                    .font(.subheadline)
                    .foregroundColor(gaitMonitor.isMonitoring ? .green : .secondary)
            }

            Spacer()

            // Status Indicator
            Circle()
                .fill(gaitMonitor.isMonitoring ? Color.green : Color.gray)
                .frame(width: 12, height: 12)
                .scaleEffect(pulseAnimation && gaitMonitor.isMonitoring ? 1.2 : 1.0)
                .animation(.easeInOut(duration: 1).repeatForever(autoreverses: true), value: pulseAnimation)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Current Gait State View

    private var currentGaitStateView: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: gaitMonitor.currentGaitState.icon)
                    .font(.title)
                    .foregroundColor(gaitMonitor.currentGaitState.color)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Current State")
                        .font(.headline)

                    Text(gaitStateDescription)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            // Gait State Progress Bar
            ProgressView(value: gaitStateProgress)
                .tint(gaitMonitor.currentGaitState.color)
                .scaleEffect(y: 2)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Real-time Metrics View

    private func realTimeMetricsView(metrics: RealTimeGaitMetrics) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Live Metrics")
                .font(.headline)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                MetricCard(
                    title: "Walking Speed",
                    value: String(format: "%.2f m/s", metrics.walkingSpeed),
                    icon: "speedometer",
                    color: speedColor(for: metrics.walkingSpeed)
                )

                MetricCard(
                    title: "Step Variability",
                    value: String(format: "%.1f%%", metrics.stepVariability * 100),
                    icon: "waveform.path.ecg",
                    color: variabilityColor(for: metrics.stepVariability)
                )

                MetricCard(
                    title: "Gait Asymmetry",
                    value: String(format: "%.1f%%", metrics.gaitAsymmetry * 100),
                    icon: "arrow.left.and.right.righttriangle.left.righttriangle.right",
                    color: asymmetryColor(for: metrics.gaitAsymmetry)
                )

                MetricCard(
                    title: "Stability Index",
                    value: String(format: "%.0f%%", metrics.stabilityIndex * 100),
                    icon: "gyroscope",
                    color: stabilityColor(for: metrics.stabilityIndex)
                )
            }

            // Confidence Indicator
            HStack {
                Text("Analysis Confidence")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text(String(format: "%.0f%%", metrics.confidence * 100))
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(confidenceColor(for: metrics.confidence))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Fall Risk Assessment View

    private var fallRiskAssessmentView: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "exclamationmark.shield.fill")
                    .font(.title2)
                    .foregroundColor(gaitMonitor.fallRiskLevel.color)

                Text("Fall Risk Assessment")
                    .font(.headline)

                Spacer()

                Text(fallRiskLevelText)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(gaitMonitor.fallRiskLevel.color)
            }

            // Fall Risk Progress
            if let metrics = gaitMonitor.realTimeMetrics {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 8)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(gaitMonitor.fallRiskLevel.color)
                            .frame(width: geometry.size.width * CGFloat(metrics.fallRisk), height: 8)
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)

                HStack {
                    Text("Low Risk")
                        .font(.caption)
                        .foregroundColor(.green)

                    Spacer()

                    Text("High Risk")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Recommendations View

    private var recommendationsView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .font(.title2)
                    .foregroundColor(.yellow)

                Text("AI Recommendations")
                    .font(.headline)

                Spacer()

                Button("View All") {
                    showingRecommendations = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            ForEach(gaitMonitor.gaitRecommendations.prefix(3), id: \.id) { recommendation in
                RecommendationRow(recommendation: recommendation)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Controls View

    private var controlsView: some View {
        VStack(spacing: 16) {
            if !gaitMonitor.isMonitoring {
                Button(action: startMonitoring) {
                    HStack {
                        Image(systemName: "play.fill")
                        Text("Start Monitoring")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
            }

            Button(action: { showingCalibration = true }) {
                HStack {
                    Image(systemName: "gearshape.fill")
                    Text("Calibrate for Your Profile")
                }
                .font(.subheadline)
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Helper Methods

    private func startMonitoring() {
        Task {
            await gaitMonitor.startMonitoring()
        }
    }

    private func startPulseAnimation() {
        pulseAnimation = true
    }

    private var gaitStateDescription: String {
        switch gaitMonitor.currentGaitState {
        case .normal:
            return "Walking pattern is normal and stable"
        case .cautious:
            return "Walking with increased caution detected"
        case .unsteady:
            return "Unsteady gait pattern detected"
        case .highRisk:
            return "High fall risk - exercise extreme caution"
        }
    }

    private var gaitStateProgress: Double {
        switch gaitMonitor.currentGaitState {
        case .normal: return 0.25
        case .cautious: return 0.5
        case .unsteady: return 0.75
        case .highRisk: return 1.0
        }
    }

    private var fallRiskLevelText: String {
        switch gaitMonitor.fallRiskLevel {
        case .low: return "Low"
        case .moderate: return "Moderate"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }

    // MARK: - Color Helpers

    private func speedColor(for speed: Double) -> Color {
        if speed < 0.8 { return .orange }
        else if speed > 1.5 { return .red }
        else { return .green }
    }

    private func variabilityColor(for variability: Double) -> Color {
        if variability > 0.3 { return .red }
        else if variability > 0.2 { return .orange }
        else { return .green }
    }

    private func asymmetryColor(for asymmetry: Double) -> Color {
        if asymmetry > 0.3 { return .red }
        else if asymmetry > 0.2 { return .orange }
        else { return .green }
    }

    private func stabilityColor(for stability: Double) -> Color {
        if stability < 0.3 { return .red }
        else if stability < 0.5 { return .orange }
        else { return .green }
    }

    private func confidenceColor(for confidence: Double) -> Color {
        if confidence < 0.6 { return .red }
        else if confidence < 0.8 { return .orange }
        else { return .green }
    }
}

// MARK: - Supporting Views

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Spacer()
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(value)
                    .font(.headline)
                    .fontWeight(.semibold)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct RecommendationRow: View {
    let recommendation: GaitRecommendation

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconForRecommendationType(recommendation.type))
                .font(.title2)
                .foregroundColor(colorForPriority(recommendation.priority))

            VStack(alignment: .leading, spacing: 2) {
                Text(recommendation.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(recommendation.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(recommendation.actionTitle) {
                // Handle recommendation action
            }
            .font(.caption)
            .foregroundColor(.blue)
        }
        .padding(8)
        .background(Color(.systemGray6).opacity(0.5))
        .cornerRadius(8)
    }

    private func iconForRecommendationType(_ type: RecommendationType) -> String {
        switch type {
        case .safety: return "shield.fill"
        case .improvement: return "arrow.up.circle.fill"
        case .exercise: return "figure.strengthtraining.traditional"
        case .medical: return "cross.fill"
        }
    }

    private func colorForPriority(_ priority: Priority) -> Color {
        switch priority {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }
}

// MARK: - Supporting Views for Sheets

struct GaitCalibrationView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var age = 50
    @State private var height = 170.0
    @State private var weight = 70.0
    @State private var selectedConditions: Set<String> = []

    private let medicalConditions = [
        "Arthritis", "Parkinson's Disease", "Multiple Sclerosis",
        "Previous Falls", "Balance Issues", "Vision Problems",
        "Medication Side Effects", "Muscle Weakness"
    ]

    var body: some View {
        NavigationView {
            Form {
                Section("Personal Information") {
                    HStack {
                        Text("Age")
                        Spacer()
                        Stepper("\(age)", value: $age, in: 18...120)
                    }

                    HStack {
                        Text("Height (cm)")
                        Spacer()
                        TextField("Height", value: $height, format: .number)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .frame(width: 80)
                    }

                    HStack {
                        Text("Weight (kg)")
                        Spacer()
                        TextField("Weight", value: $weight, format: .number)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .frame(width: 80)
                    }
                }

                Section("Medical Conditions") {
                    ForEach(medicalConditions, id: \.self) { condition in
                        HStack {
                            Text(condition)
                            Spacer()
                            if selectedConditions.contains(condition) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.blue)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedConditions.contains(condition) {
                                selectedConditions.remove(condition)
                            } else {
                                selectedConditions.insert(condition)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Calibration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        calibrateMonitor()
                        dismiss()
                    }
                }
            }
        }
    }

    private func calibrateMonitor() {
        RealTimeGaitMonitor.shared.calibrateForUser(
            age: age,
            height: height,
            weight: weight,
            medicalConditions: Array(selectedConditions)
        )
    }
}

struct GaitRecommendationsView: View {
    @Environment(\.dismiss) private var dismiss
    let recommendations: [GaitRecommendation]

    var body: some View {
        NavigationView {
            List(recommendations, id: \.id) { recommendation in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: iconForType(recommendation.type))
                            .foregroundColor(colorForPriority(recommendation.priority))

                        Text(recommendation.title)
                            .font(.headline)

                        Spacer()

                        Text(priorityText(recommendation.priority))
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(colorForPriority(recommendation.priority).opacity(0.2))
                            .cornerRadius(4)
                    }

                    Text(recommendation.message)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Button(recommendation.actionTitle) {
                        // Handle action
                    }
                    .font(.subheadline)
                    .foregroundColor(.blue)
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Recommendations")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func iconForType(_ type: RecommendationType) -> String {
        switch type {
        case .safety: return "shield.fill"
        case .improvement: return "arrow.up.circle.fill"
        case .exercise: return "figure.strengthtraining.traditional"
        case .medical: return "cross.fill"
        }
    }

    private func colorForPriority(_ priority: Priority) -> Color {
        switch priority {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }

    private func priorityText(_ priority: Priority) -> String {
        switch priority {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        }
    }
}

#Preview {
    NavigationView {
        RealTimeGaitMonitorView()
    }
}
