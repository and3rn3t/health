import SwiftUI
import Combine

struct LiveIngestionDiagnosticsPanel: View {
    @State private var events: [EventRow] = []
    @State private var cancellable: AnyCancellable?
    @State private var showPersisted = false
    @State private var simulationProbability: Double = 0
    @State private var energyGating = false

    private struct EventRow: Identifiable {
        let id = UUID()
        let timestamp: Date
        let description: String
        let color: Color
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            Divider()
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 6) {
                    ForEach(events) { row in
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text(Self.tsFormatter.string(from: row.timestamp))
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                            Text(row.description)
                                .font(.system(.caption))
                                .foregroundStyle(row.color)
                                .textSelection(.enabled)
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
            .background(Color(.secondarySystemBackground).opacity(0.4))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            controls
        }
        .padding()
        .onAppear { subscribe() }
        .onDisappear { cancellable?.cancel() }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Live Ingestion Diagnostics")
                    .font(.headline)
                Text("Realtime telemetry for gait batch ingestion & retries")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button(action: { events.removeAll() }) { Image(systemName: "trash").foregroundColor(.red) }
                .buttonStyle(.borderless)
        }
    }

    private var controls: some View {
        HStack(spacing: 16) {
            Button("Copy") { copyEvents() }
            Button(showPersisted ? "Hide Persisted" : "Show Persisted") { showPersisted.toggle() }
            Toggle("Energy Gate", isOn: $energyGating)
                .toggleStyle(.switch)
                .onChange(of: energyGating) { LiveIngestionClient.shared._setEnergyGatingEnabled($0) }
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text("Sim Fail:")
                    Slider(value: $simulationProbability, in: 0...1, step: 0.05) { Text("Simulated Failure Probability") }
                        .frame(width: 120)
                    Text(String(format: "%.2f", simulationProbability))
                        .monospacedDigit()
                }
            }
            .onChange(of: simulationProbability) { LiveIngestionClient.shared._setSimulationProbability($0) }
            Spacer()
            Text("Events: \(events.count)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .font(.caption)
    }

    private func copyEvents() {
        #if os(iOS)
        UIPasteboard.general.string = events.map { format(row: $0) }.joined(separator: "\n")
        #endif
    }

    private func subscribe() {
        cancellable = LiveIngestionClient.shared.telemetryPublisher
            .receive(on: DispatchQueue.main)
            .sink { event in
                append(event)
            }
    }

    private func append(_ event: LiveIngestionClient.TelemetryEvent) {
        let desc: String
        let color: Color
        switch event {
        case .gaitBuffered(let count):
            desc = "Buffered gait snapshot (batch size=\(count))"; color = .blue
        case .batchFlush(let reason, let snapshots):
            desc = "Flush: reason=\(reason) snapshots=\(snapshots)"; color = .indigo
        case .batchSuccess(let latency, let size):
            desc = "Success: latency=\(latency)ms size=\(size)B"; color = .green
        case .batchFailure(let status, let attempt):
            desc = "Failure: status=\(status.map(String.init) ?? "nil") attempt=\(attempt)"; color = .orange
        case .retryScheduled(let after, let attempt):
            desc = "Retry scheduled in \(after)s (attempt=\(attempt))"; color = .yellow
        case .retryDropped(let max):
            desc = "Retry dropped (attempt=\(max))"; color = .red
        case .retryRestored(let count):
            desc = "Restored retries: count=\(count)"; color = .purple
        case .retryQueuePersisted(let count):
            desc = "Persisted queue: count=\(count)"; color = .gray
        case .retryDeduped(let original, let new):
            desc = "Retry deduped: was=\(original) now=\(new)"; color = .pink
        case .batchIdentified(let id, let reason, let snapshots):
            desc = "Batch ID=\(id.prefix(8)) reason=\(reason) snaps=\(snapshots)"; color = .teal
        case .batchSuccessCorrelated(let id, let latency, let size):
            desc = "Batch \(id.prefix(8)) success latency=\(latency)ms size=\(size)"; color = .green
        case .batchFailureCorrelated(let id, let status, let attempt):
            desc = "Batch \(id.prefix(8)) fail status=\(status.map(String.init) ?? \"nil\") attempt=\(attempt)"; color = .orange
        case .simulationEnabled(let p):
            desc = "Simulation probability set=\(String(format: "%.2f", p))"; color = .yellow
        case .energyGateActive(let idle):
            desc = "Energy gate active (idle=\(idle)s)"; color = .brown
        case .logTrimmed(let newSize):
            desc = "Log trimmed newSize=\(newSize)B"; color = .gray
        case .logWriteError:
            desc = "Log write error"; color = .red
        }
        events.append(.init(timestamp: Date(), description: desc, color: color))
        trimIfNeeded()
    }

    private func trimIfNeeded(max: Int = 400) {
        if events.count > max { events.removeFirst(events.count - max) }
    }

    private func format(row: EventRow) -> String {
        "\(Self.tsFormatter.string(from: row.timestamp))\t\(row.description)"
    }

    private static let tsFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss.SSS"
        return f
    }()
}

#if DEBUG
struct LiveIngestionDiagnosticsPanel_Previews: PreviewProvider {
    static var previews: some View {
        LiveIngestionDiagnosticsPanel()
            .previewLayout(.sizeThatFits)
    }
}
#endif
