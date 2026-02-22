//
//  PerformanceReportView.swift
//  Andernet Posture
//
//  Developer-only view for inspecting live performance statistics.
//

#if DEBUG
import SwiftUI

struct PerformanceReportView: View {
    @State private var refreshID = UUID()
    @State private var autoRefresh = false
    @State private var timer: Timer?

    private let categories: [(String, [PerformanceMonitor.Operation])] = {
        let grouped = Dictionary(grouping: PerformanceMonitor.Operation.allCases, by: \.category)
        return grouped.sorted { $0.key < $1.key }
    }()

    var body: some View {
        List {
            ForEach(categories, id: \.0) { category, operations in
                Section(category) {
                    ForEach(operations, id: \.rawValue) { op in
                        OperationRow(operation: op)
                    }
                }
            }
        }
        .id(refreshID)
        .navigationTitle("Performance")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Toggle(isOn: $autoRefresh) {
                    Label("Auto-refresh", systemImage: "arrow.triangle.2.circlepath")
                }
                .onChange(of: autoRefresh) { _, on in
                    if on {
                        timer = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { _ in
                            refreshID = UUID()
                        }
                    } else {
                        timer?.invalidate()
                        timer = nil
                    }
                }

                Button {
                    refreshID = UUID()
                } label: {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }

                Menu {
                    Button("Copy Report") {
                        UIPasteboard.general.string = PerformanceMonitor.report()
                    }
                    Button("Log Report") {
                        PerformanceMonitor.logReport()
                    }
                    Button("Reset All", role: .destructive) {
                        PerformanceMonitor.resetAll()
                        refreshID = UUID()
                    }
                } label: {
                    Label("Actions", systemImage: "ellipsis.circle")
                }
            }
        }
        .onDisappear {
            timer?.invalidate()
            timer = nil
        }
    }
}

private struct OperationRow: View {
    let operation: PerformanceMonitor.Operation

    var body: some View {
        let stats = PerformanceMonitor.stats(for: operation)
        let count = stats?.sampleCount ?? 0

        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(operation.rawValue)
                    .font(.subheadline.bold())
                Spacer()
                if count > 0 {
                    statusBadge(stats: stats!)
                } else {
                    Text("No data")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if count > 0, let stats {
                HStack(spacing: 16) {
                    metricLabel("Avg", value: String(format: "%.2fms", stats.recentAverageMs))
                    metricLabel("P95", value: String(format: "%.2fms", stats.p95Ms))
                    metricLabel("Peak", value: String(format: "%.2fms", stats.peakDurationMs))
                    metricLabel("n", value: "\(stats.sampleCount)")
                }
                .font(.caption2.monospacedDigit())
                .foregroundStyle(.secondary)

                if let budget = stats.budgetMs {
                    ProgressView(value: min(stats.recentAverageMs / budget, 1.5), total: 1.5)
                        .tint(budgetColor(avg: stats.recentAverageMs, budget: budget))
                }
            }
        }
        .padding(.vertical, 2)
    }

    @ViewBuilder
    private func statusBadge(stats: PerformanceMonitor.OperationStats) -> some View {
        if let budget = stats.budgetMs {
            let ratio = stats.recentAverageMs / budget
            let color = budgetColor(avg: stats.recentAverageMs, budget: budget)
            Text(ratio < 0.7 ? "OK" : ratio < 1.0 ? "WARN" : "OVER")
                .font(.caption2.bold())
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(color.opacity(0.15))
                .foregroundStyle(color)
                .clipShape(Capsule())
        }
    }

    private func metricLabel(_ label: String, value: String) -> some View {
        VStack(alignment: .leading) {
            Text(label)
                .foregroundStyle(.tertiary)
            Text(value)
        }
    }

    private func budgetColor(avg: Double, budget: Double) -> Color {
        let ratio = avg / budget
        if ratio < 0.7 { return .green }
        if ratio < 1.0 { return .orange }
        return .red
    }
}

#Preview {
    NavigationStack {
        PerformanceReportView()
    }
}
#endif
