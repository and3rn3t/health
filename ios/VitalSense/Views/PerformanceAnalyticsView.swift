//
//  PerformanceAnalyticsView.swift
//  VitalSense
//
//  Performance analytics dashboard for viewing metrics and performance data
//

import SwiftUI
import Charts

@available(iOS 16.0, *)
struct PerformanceAnalyticsView: View {
    @StateObject private var analytics = AnalyticsManager.shared
    @State private var selectedTimeRange: TimeRange = .hour

    enum TimeRange: String, CaseIterable {
        case hour = "Last Hour"
        case day = "Last 24 Hours"
        case week = "Last Week"

        var filterDate: Date {
            switch self {
            case .hour: return Date().addingTimeInterval(-3600)
            case .day: return Date().addingTimeInterval(-86400)
            case .week: return Date().addingTimeInterval(-604800)
            }
        }
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Time Range Selector
                    Picker("Time Range", selection: $selectedTimeRange) {
                        ForEach(TimeRange.allCases, id: \.self) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding()

                    // Performance Metrics Chart
                    if #available(iOS 16.0, *) {
                        performanceChart
                            .padding(.horizontal)
                    }

                    // Session Metrics
                    sessionMetricsCard
                        .padding(.horizontal)

                    // Memory & Battery
                    systemMetricsCards
                        .padding(.horizontal)

                    // Recent Performance Metrics
                    recentMetricsList
                        .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Performance Analytics")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                // Refresh metrics
                analytics.recordMemoryUsage()
                analytics.recordBatteryUsage()
            }
        }
    }

    // MARK: - Performance Chart

    @available(iOS 16.0, *)
    private var performanceChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Operation Duration Trends")
                .font(.headline)

            let filteredMetrics = filteredMetrics

            if filteredMetrics.isEmpty {
                Text("No performance data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                Chart(filteredMetrics) { metric in
                    LineMark(
                        x: .value("Time", metric.timestamp),
                        y: .value("Duration", metric.duration)
                    )
                    .foregroundStyle(.blue)
                    .lineStyle(StrokeStyle(lineWidth: 2))

                    PointMark(
                        x: .value("Time", metric.timestamp),
                        y: .value("Duration", metric.duration)
                    )
                    .foregroundStyle(.blue)
                    .symbolSize(36)
                }
                .frame(height: 200)
                .chartXAxis {
                    AxisMarks { value in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.hour().minute())
                    }
                }
                .chartYAxis {
                    AxisMarks { value in
                        AxisGridLine()
                        AxisValueLabel(format: .number)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private var filteredMetrics: [PerformanceMetric] {
        analytics.performanceMetrics.filter { $0.timestamp > selectedTimeRange.filterDate }
    }

    // MARK: - Session Metrics Card

    private var sessionMetricsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Session Metrics")
                .font(.headline)

            if let session = analytics.sessionMetrics {
                VStack(spacing: 12) {
                    MetricRow(
                        label: "Session Duration",
                        value: formatDuration(session.duration ?? 0),
                        icon: "clock.fill",
                        color: .blue
                    )

                    MetricRow(
                        label: "Events Count",
                        value: "\(session.eventsCount)",
                        icon: "number.circle.fill",
                        color: .green
                    )

                    MetricRow(
                        label: "Errors Count",
                        value: "\(session.errorsCount)",
                        icon: "exclamationmark.triangle.fill",
                        color: .red
                    )
                }
            } else {
                Text("No active session")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - System Metrics Cards

    private var systemMetricsCards: some View {
        VStack(spacing: 16) {
            if let memory = analytics.memoryUsage {
                SystemMetricCard(
                    title: "Memory Usage",
                    value: String(format: "%.1f%%", memory.percentage),
                    detail: String(format: "%.2f MB / %.2f MB", memory.usedMB, memory.totalMB),
                    icon: "memorychip.fill",
                    color: memoryColor(for: memory.percentage),
                    percentage: memory.percentage / 100.0
                )
            }

            if let battery = analytics.batteryUsage {
                SystemMetricCard(
                    title: "Battery Level",
                    value: String(format: "%.0f%%", battery.level * 100),
                    detail: batteryStateString(battery.state),
                    icon: batteryIcon(for: battery.level),
                    color: batteryColor(for: battery.level),
                    percentage: battery.level
                )
            }
        }
    }

    // MARK: - Recent Metrics List

    private var recentMetricsList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Performance Metrics")
                .font(.headline)

            let recentMetrics = analytics.getRecentMetrics(limit: 20)

            if recentMetrics.isEmpty {
                Text("No recent performance data")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
            } else {
                VStack(spacing: 0) {
                    ForEach(recentMetrics.prefix(10)) { metric in
                        PerformanceMetricRow(metric: metric)

                        if metric.id != recentMetrics.prefix(10).last?.id {
                            Divider()
                        }
                    }
                }
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Helper Methods

    private func formatDuration(_ duration: TimeInterval) -> String {
        if duration < 60 {
            return String(format: "%.1fs", duration)
        } else if duration < 3600 {
            return String(format: "%.1fm", duration / 60)
        } else {
            return String(format: "%.1fh", duration / 3600)
        }
    }

    private func memoryColor(for percentage: Double) -> Color {
        if percentage > 80 {
            return .red
        } else if percentage > 60 {
            return .orange
        } else {
            return .green
        }
    }

    private func batteryColor(for level: Double) -> Color {
        if level < 0.2 {
            return .red
        } else if level < 0.5 {
            return .orange
        } else {
            return .green
        }
    }

    private func batteryIcon(for level: Double) -> String {
        if level < 0.1 {
            return "battery.0.fill"
        } else if level < 0.25 {
            return "battery.25.fill"
        } else if level < 0.5 {
            return "battery.50.fill"
        } else if level < 0.75 {
            return "battery.75.fill"
        } else {
            return "battery.100.fill"
        }
    }

    private func batteryStateString(_ state: UIDevice.BatteryState) -> String {
        switch state {
        case .charging: return "Charging"
        case .full: return "Full"
        case .unplugged: return "Unplugged"
        default: return "Unknown"
        }
    }
}

// MARK: - Supporting Views

struct MetricRow: View {
    let label: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(label)

            Spacer()

            Text(value)
                .fontWeight(.semibold)
        }
    }
}

struct SystemMetricCard: View {
    let title: String
    let value: String
    let detail: String
    let icon: String
    let color: Color
    let percentage: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title2)

                Text(title)
                    .font(.headline)

                Spacer()

                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(color)
            }

            Text(detail)
                .font(.subheadline)
                .foregroundColor(.secondary)

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)

                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * percentage, height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PerformanceMetricRow: View {
    let metric: PerformanceMetric

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(metric.operation)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(metric.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "%.3fs", metric.duration))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(metric.duration > 5.0 ? .red : .primary)

                if metric.duration > 5.0 {
                    Text("Slow")
                        .font(.caption2)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
    }
}
