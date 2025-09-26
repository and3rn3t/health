import SwiftUI
#if canImport(TipKit)
import TipKit
#endif

struct GaitShowcaseHomeView: View {
    @StateObject private var lidar = LiDARSessionManager.shared
    @StateObject private var webSocket = WebSocketManager.shared

    @State private var simulate: Bool = false
    @State private var selectedProtocol: ProtocolType = .freeWalk
    @State private var stabilityIndex: Double = 1.0

    enum ProtocolType: String, CaseIterable, Identifiable {
        case freeWalk = "free_walk"
        case tug = "tug"
        case tenMWT = "10mwt"
        case sixMWT = "6mwt"

        var id: String { rawValue }
        var label: String {
            switch self {
            case .freeWalk: return "Free Walk"
            case .tug: return "TUG"
            case .tenMWT: return "10MWT"
            case .sixMWT: return "6MWT"
            }
        }
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.blue.opacity(0.15), Color.teal.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    header
                    arPreview
                    statusCard
                    controlsCard
                    metricsCard
                }
                .padding(16)
            }
        }
        .navigationTitle("Gait Analysis")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    webSocket.connect()
                } label: {
                    Label("Connect", systemImage: "bolt.horizontal.circle")
                }
            }
        }
        .task {
#if canImport(TipKit)
            if #available(iOS 17.0, *) { GaitTipsManager.configure() }
#endif
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("VitalSense")
                    .font(.title2).bold()
                Text("LiDAR Gait Showcase")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                statusPill
                qualityPill
                stabilityPill
            }
        }
    }

    private var statusPill: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(webSocket.isConnected ? Color.green : Color.red)
                .frame(width: 8, height: 8)
            Text(webSocket.connectionStatus)
                .font(.caption)
                .foregroundStyle(webSocket.isConnected ? .green : .red)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
        )
    }

    private var statusCard: some View {
        GlassCard {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 10) {
                    Text(lidar.isRunning ? "Session Active" : "Ready to Start")
                        .font(.headline)
                    Text("Protocol: \(selectedProtocol.label)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
#if canImport(TipKit)
                    if #available(iOS 17.0, *) {
                        // Removed ProtocolTip().popoverTip for build compatibility on iOS 17; placeholder only.
                        // Tip content intentionally suppressed until TipKit integration stabilized.
                    }
#endif
                    Toggle(isOn: $simulate) {
                        Label("Simulate (no ARKit required)", systemImage: "wand.and.stars")
                            .font(.caption)
                    }
                    .toggleStyle(.switch)
                }
                Spacer()
                Button {
                    if lidar.isRunning {
                        lidar.stopSession()
#if canImport(ActivityKit)
                        if #available(iOS 16.1, *) { GaitLiveActivityController.shared.end(success: true) }
#endif
                    } else {
                        lidar.startGaitSession(
                            duration: 30, simulate: simulate, protocolTag: selectedProtocol.rawValue
                        )
#if canImport(ActivityKit)
                        if #available(iOS 16.1, *) {
                            GaitLiveActivityController.shared.startSessionActivity(
                                protocolName: selectedProtocol.label, duration: 30, isConnected: webSocket.isConnected
                            )
                        }
#endif
                    }
                } label: {
                    Label(
                        lidar.isRunning ? "Stop" : "Start", systemImage: lidar.isRunning ? "stop.circle.fill" : "figure.walk"
                    )
                        .font(.title3.weight(.semibold))
                        .frame(minWidth: 120)
                }
            }
        }
    }

    private var controlsCard: some View {
        GlassCard {
            HStack {
                VStack(alignment: .leading) {
                    Text("Protocol")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("Protocol", selection: $selectedProtocol) {
                        ForEach(ProtocolType.allCases) { proto in
                            Text(proto.label).tag(proto)
                        }
                    }
                    .pickerStyle(.segmented)
#if canImport(TipKit)
                    if #available(iOS 17.0, *) {
                        // Removed ARSpaceTip().popoverTip for build compatibility.
                    }
#endif
                }
                Spacer()
                VStack(alignment: .leading) {
                    Text("Progress")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ProgressView(value: Double(lidar.progress))
                        .progressViewStyle(.linear)
                        .frame(width: 120)
                }
            }
        }
    }

    private var metricsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Last Metrics")
                    .font(.headline)
                if let payload = lidar.lastPayload {
                    VStack(spacing: 8) {
                        metricRow(title: "Speed", value: String(format: "%.2f m/s", payload.gaitMetrics.averageWalkingSpeed ?? 0))
                        metricRow(title: "Cadence", value: String(format: "%.0f spm", payload.gaitMetrics.stepFrequency ?? 0))
                        metricRow(title: "Step Length", value: String(format: "%.2f m", payload.gaitMetrics.averageStepLength ?? 0))
                        metricRow(title: "Double Support", value: String(format: "%.1f %%", payload.gaitMetrics.doubleSupportTime ?? 0))
                    }
                } else {
                    Text("No metrics yet. Start a session to stream data.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func metricRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
        }
        .font(.subheadline)
    }
}

// MARK: - Reusable Glass Card
private struct GlassCard<Content: View>: View {
    let content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }

    var body: some View {
        VStack(alignment: .leading) { content() }
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
            )
    }
}

#Preview {
    NavigationView { GaitShowcaseHomeView() } 
}

// MARK: - AR Preview Section
private extension GaitShowcaseHomeView {
    var arPreview: some View {
        GaitAROverlayView(
            protocolName: selectedProtocol.label, goalDistanceMeters: (goalDistance(for: selectedProtocol) ?? 0)
        ) { index in
                // index is 0.0 (unstable) .. 1.0 (stable)
                stabilityIndex = max(0, min(1, index))
            }
            .frame(height: 140)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.primary.opacity(0.08), lineWidth: 0.5)
            )
    }
}

// MARK: - Quality Pill
private extension GaitShowcaseHomeView {
    var qualityPill: some View {
        HStack(spacing: 6) {
            Image(systemName: "shield.checkerboard")
                .foregroundStyle(qualityColor)
            Text("Quality: \(lidar.qualityScore)")
                .font(.caption)
                .foregroundStyle(qualityColor)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(
            Capsule().stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
        )
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: lidar.qualityScore)
    }

    var qualityColor: Color {
        let score = lidar.qualityScore
        if score >= 85 { return .green }
        if score >= 70 { return .blue }
        if score >= 55 { return .yellow }
        if score >= 40 { return .orange }
        return .red
    }
}

// MARK: - Stability Pill
private extension GaitShowcaseHomeView {
    var stabilityPill: some View {
        let pct = Int((stabilityIndex * 100).rounded())
        let color: Color = {
            if stabilityIndex >= 0.85 { return .green }
            if stabilityIndex >= 0.7 { return .blue }
            if stabilityIndex >= 0.55 { return .yellow }
            if stabilityIndex >= 0.4 { return .orange }
            return .red
        }()
        return HStack(spacing: 6) {
            Image(systemName: "figure.stand")
                .foregroundStyle(color)
            Text("Stability: \(pct)%")
                .font(.caption)
                .foregroundStyle(color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(
            Capsule().stroke(Color.primary.opacity(0.1), lineWidth: 0.5)
        )
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: stabilityIndex)
    }
}

// MARK: - Protocol helpers
private extension GaitShowcaseHomeView {
    func goalDistance(for proto: ProtocolType) -> Double? {
        switch proto {
        case .tenMWT: return 10.0
        case .tug: return 3.0
        default: return nil
        }
    }
}
