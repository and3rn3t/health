import SwiftUI
import Combine

#if os(watchOS)
struct RemoteControlDashboard: View {
    @StateObject private var connectivity = WatchAppConnectivityManager.shared
    @State private var showRiskDetail = false

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                statusSection
                controlsSection
                riskSection
            }
            .padding(.vertical, 4)
        }
        .onAppear { connectivity.requestLiveStatus() }
        .sheet(isPresented: $showRiskDetail) { riskDetailSheet }
    }

    private var statusSection: some View {
        GroupBox(label: Label("Status", systemImage: "waveform.path.ecg")) {
            if let s = connectivity.latestStatus {
                VStack(alignment: .leading, spacing: 4) {
                    Label(s.fallRiskLevel?.capitalized ?? "Unknown", systemImage: "shield")
                        .foregroundColor(color(for: s.fallRiskLevel))
                    if let spd = s.walkingSpeed { Text("Speed: \(String(format: "%.2f", spd)) m/s") }
                    if let freq = s.stepFrequency { Text("Steps/min: \(Int(freq))") }
                    if let asym = s.asymmetry { Text("Asym: \(String(format: "%.1f%%", asym * 100))") }
                    if let prog = connectivity.balanceProgress { ProgressView(value: prog.percent, total: 100).progressViewStyle(.linear).tint(.blue) }
                    if let result = connectivity.balanceResult { Text("Balance Score: \(Int(result.overallScore))").font(.caption.bold()) }
                    Text(s.connectionStatus).font(.caption2).foregroundColor(.secondary)
                }
            } else {
                Text("No data yet")
            }
        }
    }

    private var controlsSection: some View {
        GroupBox(label: Label("Controls", systemImage: "playpause")) {
            VStack(spacing: 6) {
                HStack {
                    Button("Refresh") { connectivity.requestLiveStatus() }
                    Button("Assess") { connectivity.triggerAssessment() }
                }
                .buttonStyle(.bordered)
                HStack {
                    Button("Start") { connectivity.startMonitoring() }
                    Button("Stop") { connectivity.stopMonitoring() }
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private var riskSection: some View {
        GroupBox(label: Label("Fall Risk", systemImage: "exclamationmark.triangle")) {
            if let summary = connectivity.latestRiskSummary {
                VStack(alignment: .leading, spacing: 4) {
                    Text(summary.riskLevel.capitalized)
                        .font(.headline)
                        .foregroundColor(color(for: summary.riskLevel))
                    if let score = summary.score { Text("Score: \(Int(score))") }
                    Button("Details") { showRiskDetail = true }
                        .buttonStyle(.bordered)
                }
            } else {
                Text("No recent assessment")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var riskDetailSheet: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let summary = connectivity.latestRiskSummary {
                Text("Risk: \(summary.riskLevel.capitalized)").font(.headline)
                if !summary.highSeverityFactors.isEmpty {
                    Text("High Factors:").bold()
                    ForEach(summary.highSeverityFactors, id: \.self) { Text($0.replacingOccurrences(of: "_", with: " ")) }
                }
                if !summary.mediumSeverityFactors.isEmpty {
                    Text("Medium Factors:").bold().padding(.top, 4)
                    ForEach(summary.mediumSeverityFactors, id: \.self) { Text($0.replacingOccurrences(of: "_", with: " ")) }
                }
                if !summary.recommendations.isEmpty {
                    Text("Recommendations:").bold().padding(.top, 4)
                    ForEach(summary.recommendations.prefix(5), id: \.self) { Text("• \($0)") }
                }
            } else {
                Text("No data")
            }
            Button("Close") { showRiskDetail = false }.buttonStyle(.borderedProminent)
        }
        .padding()
    }

    private func color(for risk: String?) -> Color {
        switch risk?.lowercased() {
        case "low": return .green
        case "medium", "moderate": return .yellow
        case "high", "critical": return .red
        default: return .gray
        }
    }
}

#Preview {
    RemoteControlDashboard()
}
#endif
