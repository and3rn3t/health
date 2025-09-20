import SwiftUI

struct LiDARShowcaseView: View {
    @StateObject private var lidar = LiDARSessionManager.shared
    @StateObject private var webSocket = WebSocketManager.shared

    @State private var duration: Double = 30
    @State private var simulate: Bool = false
    @State private var selectedProtocol: ProtocolType = .freeWalk
    @State private var showCountdown: Bool = false
    @State private var countdown: Int = 3
    @State private var sessionStart: Date?

    enum ProtocolType: String, CaseIterable, Identifiable {
        case freeWalk = "free_walk"
        case tug = "tug" // Timed Up and Go
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

        var recommendedDuration: Double {
            switch self {
            case .freeWalk: 
                return 30 // seconds, default demo
            case .tug: 
                return 20 // typical completion time window
            case .tenMWT: 
                return 30 // approximate for 10m at ~0.33 m/s for demo
            case .sixMWT: 
                return 360 // 6 minutes
            }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Text("LiDAR Showcase")
                    .font(.title2).bold()
                Spacer()
                // Protocol badge
                Text(selectedProtocol.label)
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(Color.blue.opacity(0.1)))
                    .overlay(Capsule().stroke(Color.blue.opacity(0.3), lineWidth: 0.5))
                // Simulation badge
                if simulate {
                    Text("Simulated")
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color.orange.opacity(0.1)))
                        .overlay(Capsule().stroke(Color.orange.opacity(0.3), lineWidth: 0.5))
                }
                Circle()
                    .fill(webSocket.isConnected ? Color.green : Color.red)
                    .frame(width: 10, height: 10)
                Text(webSocket.connectionStatus)
                    .font(.caption)
                    .foregroundColor(webSocket.isConnected ? .green : .red)
            }

            HStack {
                Text("Duration: \(Int(duration))s")
                Slider(value: $duration, in: 10...120, step: 5)
            }

            HStack {
                Text("Protocol")
                Spacer()
                Picker("Protocol", selection: $selectedProtocol) {
                    ForEach(ProtocolType.allCases) { proto in
                        Text(proto.label).tag(proto)
                    }
                }
                .pickerStyle(.menu)
            }

            Toggle(isOn: $simulate) {
                Label("Simulate (no ARKit required)", systemImage: "wand.and.stars")
            }
            .toggleStyle(.switch)

            VStack(alignment: .leading, spacing: 8) {
                ProgressView(value: Double(lidar.progress))
                    .progressViewStyle(.linear)
                HStack {
                    let elapsed = sessionStart.map { Date().timeIntervalSince($0) } ?? 0
                    let remaining = max(0, duration - elapsed)
                    Text("Elapsed: \(formatTime(elapsed))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("Remaining: \(formatTime(remaining))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            HStack(spacing: 12) {
                Button(action: {
                    webSocket.connect()
                }) {
                    Label("Connect", systemImage: "bolt.horizontal.circle")
                }
                .buttonStyle(.bordered)

                Button(action: {
                    startWithCountdown()
                }) {
                    Label("Start Gait", systemImage: "figure.walk")
                }
                .buttonStyle(.borderedProminent)
                .disabled(lidar.isRunning)

                Button(action: {
                    lidar.stopSession()
                }) {
                    Label("Stop", systemImage: "stop.circle")
                }
                .buttonStyle(.bordered)
                .disabled(!lidar.isRunning)
            }

            Divider()

            if let payload = lidar.lastPayload {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Last Metrics")
                        .font(.headline)
                    HStack {
                        Text("Speed")
                        Spacer()
                        Text(String(format: "%.2f m/s", payload.gaitMetrics.averageWalkingSpeed ?? 0))
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Cadence")
                        Spacer()
                        Text(String(format: "%.0f spm", payload.gaitMetrics.stepFrequency ?? 0))
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Step Length")
                        Spacer()
                        Text(String(format: "%.2f m", payload.gaitMetrics.averageStepLength ?? 0))
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Double Support")
                        Spacer()
                        Text(String(format: "%.1f %%", payload.gaitMetrics.doubleSupportTime ?? 0))
                            .foregroundColor(.secondary)
                    }
                }
            } else {
                Text("No metrics yet. Start a session to stream data.")
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .navigationTitle("LiDAR")
        .onChange(of: selectedProtocol) { _, newValue in
            // Auto-apply recommended duration when protocol changes
            duration = newValue.recommendedDuration
        }
        .overlay(alignment: .center) {
            if showCountdown {
                ZStack {
                    Color.black.opacity(0.4).ignoresSafeArea()
                    Text("\(countdown)")
                        .font(.system(size: 80, weight: .bold))
                        .foregroundColor(.white)
                        .padding(24)
                        .background(Circle().fill(Color.black.opacity(0.5)))
                }
                .transition(.opacity)
            }
        }
    }

    private func startWithCountdown() {
        guard !lidar.isRunning else { return }
        showCountdown = true
        countdown = 3
        impact(.medium)
        Task {
            for counter in stride(from: 3, through: 1, by: -1) {
                await MainActor.run { countdown = counter } 
                if counter > 1 { impact(.light) }
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            await MainActor.run { showCountdown = false } 
            impact(.heavy)
            sessionStart = Date()
            lidar.startGaitSession(
                duration: duration, simulate: simulate, protocolTag: selectedProtocol.rawValue
            )
        }
    }

    private func formatTime(_ seconds: Double) -> String {
        let total = Int(seconds.rounded())
        let minutes = total / 60
        let remainder = total % 60
        return String(format: "%01d:%02d", minutes, remainder)
    }

    private func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        #if os(iOS)
        let gen = UIImpactFeedbackGenerator(style: style)
        gen.impactOccurred()
        #endif
    }
}

#Preview {
    NavigationView { LiDARShowcaseView() } 
}
