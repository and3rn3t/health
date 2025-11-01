import SwiftUI
import HealthKit
import WatchKit
import WatchConnectivity
import Symbols

/// Enhanced LiDAR Watch View
/// Apple Watch interface for enhanced health analysis integration
/// SwiftLint-compliant SwiftUI implementation
struct EnhancedLiDARWatchView: View {
    @StateObject private var watchManager = WatchLiDARIntegrationManager.shared
    @State private var showingDetailView = false
    @State private var lastAnalysisRequest: Date?
    @State private var analysisRequestCount = 0

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Header Section
                    VStack(spacing: 8) {
                        Image(systemName: "brain")
                            .font(.system(size: 32))
                            .foregroundColor(.blue)

                        Text("VitalSense ML")
                            .font(.title3)
                            .fontWeight(.bold)

                        Text("Enhanced Analysis")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 8)

                    // Connection Status Card
                    ConnectionStatusCard()

                    // Data Streaming Status
                    DataStreamingCard()

                    // Analysis Trigger Button
                    AnalysisTriggerButton(
                        isConnected: watchManager.isConnected,
                        onTrigger: triggerEnhancedAnalysis
                    )

                    // Quick Metrics Overview
                    if watchManager.isStreamingData {
                        QuickMetricsCard()
                    }

                    // Action Buttons
                    ActionButtonsView()
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Health Analysis")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            watchManager.startDataStreaming()
        }
        .sheet(isPresented: $showingDetailView) {
            AnalysisDetailView()
        }
    }

    // MARK: - Actions

    private func triggerEnhancedAnalysis() {
        guard watchManager.isConnected else { return }

        let now = Date()
        lastAnalysisRequest = now
        analysisRequestCount += 1

        // Send analysis request to iPhone
        let message: [String: Any] = [
            "type": "trigger_enhanced_analysis",
            "timestamp": ISO8601DateFormatter().string(from: now),
            "requestId": UUID().uuidString,
            "source": "apple_watch"
        ]

        if WCSession.default.isReachable {
            WCSession.default.sendMessage(message, replyHandler: { reply in
                DispatchQueue.main.async {
                    handleAnalysisResponse(reply)
                }
            }) { error in
                print("Failed to trigger analysis: \(error.localizedDescription)")
            }
        }

        // Provide haptic feedback
        WKInterfaceDevice.current().play(.success)
    }

    private func handleAnalysisResponse(_ response: [String: Any]) {
        if let status = response["status"] as? String, status == "success" {
            // Analysis started successfully
            showingDetailView = true
        }
    }
}

// MARK: - Connection Status Card

struct ConnectionStatusCard: View {
    @StateObject private var watchManager = WatchLiDARIntegrationManager.shared

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Circle()
                    .fill(connectionColor)
                    .frame(width: 8, height: 8)

                Text("iPhone Connection")
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer()
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(connectionStatusText)
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    if let lastSync = watchManager.lastSyncTime {
                        Text("Last sync: \(formatTime(lastSync))")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                if watchManager.isConnected {
                    Image(systemName: "iphone")
                        .foregroundColor(.green)
                        .font(.caption)
                }
            }
        }
        .padding(12)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }

    private var connectionColor: Color {
        switch watchManager.connectionStatus {
        case .connected: return .green
        case .connecting: return .orange
        case .disconnected, .inactive: return .red
        }
    }

    private var connectionStatusText: String {
        switch watchManager.connectionStatus {
        case .connected: return "Connected"
        case .connecting: return "Connecting..."
        case .disconnected: return "Disconnected"
        case .inactive: return "Inactive"
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Data Streaming Card

struct DataStreamingCard: View {
    @StateObject private var watchManager = WatchLiDARIntegrationManager.shared

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "waveform.path.ecg")
                    .foregroundColor(watchManager.isStreamingData ? .blue : .gray)

                Text("Data Streaming")
                    .font(.caption)
                    .fontWeight(.medium)

                Spacer()

                Toggle("", isOn: .constant(watchManager.isStreamingData))
                    .labelsHidden()
                    .disabled(true)
            }

            if watchManager.isStreamingData {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Data Points Sent")
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        Text("\(watchManager.dataPointsSent)")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Status")
                            .font(.caption2)
                            .foregroundColor(.secondary)

                        Text("Active")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                }
            }
        }
        .padding(12)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Analysis Trigger Button

struct AnalysisTriggerButton: View {
    let isConnected: Bool
    let onTrigger: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: {
            onTrigger()

            // Visual feedback
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = true
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = false
                }
            }
        }) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 16, weight: .semibold))

                Text("Trigger Analysis")
                    .font(.system(size: 14, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 40)
            .background(
                isConnected
                    ? (isPressed ? Color.blue.opacity(0.8) : Color.blue)
                    : Color.gray
            )
            .cornerRadius(20)
            .scaleEffect(isPressed ? 0.95 : 1.0)
        }
        .disabled(!isConnected)
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Quick Metrics Card

struct QuickMetricsCard: View {
    @State private var currentHeartRate: Double = 0
    @State private var currentSteps: Int = 0

    var body: some View {
        VStack(spacing: 8) {
            Text("Live Metrics")
                .font(.caption)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 16) {
                MetricItem(
                    icon: "heart.fill",
                    value: "\(Int(currentHeartRate))",
                    unit: "BPM",
                    color: .red
                )

                MetricItem(
                    icon: "figure.walk",
                    value: "\(currentSteps)",
                    unit: "steps",
                    color: .green
                )
            }
        }
        .padding(12)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
        .onAppear {
            startMetricsUpdates()
        }
    }

    private func startMetricsUpdates() {
        // Simulate real-time metrics updates
        Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            currentHeartRate = Double.random(in: 60...100)
            currentSteps += Int.random(in: 0...3)
        }
    }
}

struct MetricItem: View {
    let icon: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.system(size: 16))

            Text(value)
                .font(.system(size: 14, weight: .bold))

            Text(unit)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Action Buttons View

struct ActionButtonsView: View {
    @StateObject private var watchManager = WatchLiDARIntegrationManager.shared

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                ActionButton(
                    icon: "arrow.clockwise",
                    title: "Sync",
                    color: .blue,
                    isEnabled: watchManager.isConnected
                ) {
                    watchManager.triggerManualSync()
                    WKInterfaceDevice.current().play(.click)
                }

                ActionButton(
                    icon: "gear",
                    title: "Settings",
                    color: .gray,
                    isEnabled: true
                ) {
                    // Open settings
                    WKInterfaceDevice.current().play(.click)
                }
            }
        }
    }
}

struct ActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let isEnabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 14))

                Text(title)
                    .font(.system(size: 10))
            }
            .foregroundColor(isEnabled ? color : .gray)
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
        }
        .disabled(!isEnabled)
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Analysis Detail View

struct AnalysisDetailView: View {
    @Environment(\.presentationMode) var presentationMode
    @State private var analysisProgress: Double = 0.0
    @State private var currentStep = "Initializing..."
    @State private var isComplete = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Progress Section
                    VStack(spacing: 12) {
                        Text("Enhanced Analysis")
                            .font(.title3)
                            .fontWeight(.bold)

                        if !isComplete {
                            ProgressView(value: analysisProgress)
                                .progressViewStyle(LinearProgressViewStyle())

                            Text(currentStep)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.green)

                            Text("Analysis Complete!")
                                .font(.headline)
                                .foregroundColor(.green)
                        }
                    }
                    .padding()

                    if isComplete {
                        // Results Summary
                        VStack(spacing: 12) {
                            ResultCard(
                                title: "Gait Pattern",
                                value: "Normal",
                                confidence: 92,
                                color: .green
                            )

                            ResultCard(
                                title: "Fall Risk",
                                value: "Low",
                                confidence: 88,
                                color: .green
                            )

                            ResultCard(
                                title: "Stability Score",
                                value: "85%",
                                confidence: 90,
                                color: .blue
                            )
                        }
                        .padding(.horizontal)
                    }

                    Spacer()
                }
            }
            .navigationTitle("Analysis")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden(true)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .onAppear {
                startAnalysisSimulation()
            }
        }
    }

    private func startAnalysisSimulation() {
        let steps = [
            (0.2, "Collecting sensor data..."),
            (0.4, "Running ML models..."),
            (0.6, "Analyzing gait patterns..."),
            (0.8, "Processing fall risk..."),
            (1.0, "Generating insights...")
        ]

        for (index, step) in steps.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index + 1) * 1.5) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    analysisProgress = step.0
                    currentStep = step.1
                }

                if step.0 >= 1.0 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        withAnimation(.easeInOut(duration: 0.5)) {
                            isComplete = true
                        }

                        WKInterfaceDevice.current().play(.success)
                    }
                }
            }
        }
    }
}

// MARK: - Result Card

struct ResultCard: View {
    let title: String
    let value: String
    let confidence: Int
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text("\(confidence)%")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            HStack {
                Text(value)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(color)

                Spacer()
            }
        }
        .padding(12)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

// MARK: - Preview

struct EnhancedLiDARWatchView_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedLiDARWatchView()
    }
}
