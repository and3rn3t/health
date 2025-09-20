import SwiftUI
import UIKit

struct TelemetryDiagnosticsView: View {
    @ObservedObject private var telemetry = Telemetry.shared
    @State private var selectedFilter: String = "All"
    @State private var timeWindow: TimeWindow = .last15m
    @State private var copied: Bool = false
    @State private var showShare: Bool = false
    @State private var shareItems: [Any] = []

    private var filters: [String] {
        let names = Set(telemetry.recent.map { $0.name })
        return ["All"] + names.sorted()
    }

    private enum TimeWindow: String, CaseIterable { case last5m = "5m", last15m = "15m", lastHour = "1h", all = "All" }

    private var filtered: [Telemetry.Event] {
        let base: [Telemetry.Event]
        if selectedFilter == "All" { base = Array(telemetry.recent.prefix(200)) } else { base = telemetry.recent.filter { $0.name == selectedFilter } }
        let cutoff: Date? = {
            let now = Date()
            switch timeWindow {
            case .last5m: return now.addingTimeInterval(-300)
            case .last15m: return now.addingTimeInterval(-900)
            case .lastHour: return now.addingTimeInterval(-3600)
            case .all: return nil
            }
        }()
        if let cutoff { return base.filter { $0.timestamp >= cutoff } } else { return base }
    }

    var body: some View {
        VStack(spacing: 8) {
            Picker("Filter", selection: $selectedFilter) {
                ForEach(filters, id: \..self) { f in Text(f.capitalized) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            Picker("Window", selection: $timeWindow) {
                ForEach(TimeWindow.allCases, id: \.self) { tw in Text(tw.rawValue) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            List(filtered) { event in
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        badge(for: event.name)
                        Text(event.name)
                            .font(.headline)
                        Spacer()
                        Text(event.timestamp, style: .time)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    if let md = event.metadata, !md.isEmpty {
                        Text(md.map { "\($0.key)=\($0.value)" }.joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 2)
            }
        }
        .navigationTitle("Telemetry")
        .toolbar { toolbarContent }
        .alert("Copied JSON", isPresented: $copied) { Button("OK", role: .cancel) { copied = false } }
    }

    @ToolbarContentBuilder private var toolbarContent: some ToolbarContent {
        ToolbarItemGroup(placement: .navigationBarTrailing) {
            Button("Copy") { exportJSON(copyOnly: true) }
            Button("Share") { exportJSON(copyOnly: false) }
            Button("Clear") { Telemetry.shared.clear() }
        }
    }

    private func exportJSON(copyOnly: Bool) {
        Task { @MainActor in
            let subset = Telemetry.shared.scrubbed(filtered)
            let metaHeader = "{" + "\"exported_at\":\"\(ISO8601DateFormatter().string(from: Date()))\",\"count\":\"\(subset.count)\",\"session_hint\":\"\(subset.first?.metadata?[\"session_id\"] ?? "-")\",\"events\":"
            if let eventsData = try? JSONEncoder().encode(subset), let eventsJson = String(data: eventsData, encoding: .utf8) {
                let str = metaHeader + eventsJson.dropFirst() // replace opening [ with its remainder
                if copyOnly {
                    UIPasteboard.general.string = str
                    copied = true
                } else {
                    shareItems = [str]
                    showShare = true
                }
            }
        }
    }

    private func badge(for name: String) -> some View {
        let color: Color = {
            switch name {
            case "error_state": return .red
            case "empty_state": return .orange
            case "metric_select": return .blue
            case "permission_funnel": return .purple
            case "fall_risk_load": return .teal
            case "gait_load": return .green
            case "haptics_toggle": return .pink
            case "pseudo_locale_toggle": return .indigo
            case "stream_status": return .cyan
            default: return .gray
            }
        }()
    return Circle().fill(color.opacity(0.85)).frame(width: 10, height: 10)
            .accessibilityHidden(true)
    }
        .sheet(isPresented: $showShare) {
            ActivityView(activityItems: shareItems)
        }
    }

    private struct ActivityView: UIViewControllerRepresentable {
        let activityItems: [Any]
        func makeUIViewController(context: Context) -> UIActivityViewController {
            UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        }
        func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
    }
}

#if DEBUG
struct TelemetryDiagnosticsView_Previews: PreviewProvider { static var previews: some View { NavigationStack { TelemetryDiagnosticsView() } } }
#endif
