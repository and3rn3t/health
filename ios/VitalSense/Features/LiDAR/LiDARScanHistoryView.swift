import SwiftUI
import Charts
import Foundation

/// View displaying LiDAR scan history with timeline and trend analysis
@available(iOS 16.0, *)
struct LiDARScanHistoryView: View {
    @StateObject private var dataManager = LiDARScanDataManager.shared
    @StateObject private var lidarManager = LiDARScanningManager.shared

    @State private var selectedScanType: LiDARScanningView.ScanType? = nil
    @State private var selectedTimeRange: TimeRange = .allTime
    @State private var searchText = ""
    @State private var showingFilterSheet = false
    @State private var selectedScan: LiDARScanResult? = nil
    @State private var showingScanDetails = false

    enum TimeRange: String, CaseIterable {
        case allTime = "All Time"
        case thisWeek = "This Week"
        case thisMonth = "This Month"
        case last3Months = "Last 3 Months"

        var dateRange: (Date?, Date?) {
            let calendar = Calendar.current
            let now = Date()

            switch self {
            case .allTime:
                return (nil, nil)
            case .thisWeek:
                return (calendar.date(byAdding: .day, value: -7, to: now), nil)
            case .thisMonth:
                return (calendar.date(byAdding: .day, value: -30, to: now), nil)
            case .last3Months:
                return (calendar.date(byAdding: .month, value: -3, to: now), nil)
            }
        }
    }

    private var filteredScans: [LiDARScanResult] {
        let (startDate, endDate) = selectedTimeRange.dateRange
        var scans = dataManager.fetchScans(
            scanType: selectedScanType,
            startDate: startDate,
            endDate: endDate
        )

        // Apply search filter
        if !searchText.isEmpty {
            scans = scans.filter { scan in
                scan.type.rawValue.localizedCaseInsensitiveContains(searchText) ||
                scan.insights.contains { insight in
                    insight.title.localizedCaseInsensitiveContains(searchText) ||
                    insight.description.localizedCaseInsensitiveContains(searchText)
                }
            }
        }

        return scans
    }

    private var statistics: ScanStatistics {
        let (startDate, endDate) = selectedTimeRange.dateRange
        return dataManager.getScanStatistics(
            scanType: selectedScanType,
            startDate: startDate,
            endDate: endDate
        )
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Statistics Overview
                    statisticsView

                    // Trend Chart
                    if filteredScans.count > 1 {
                        trendChartView
                    }

                    // Filter and Search
                    filterSearchView

                    // Scan List
                    scanListView
                }
                .padding()
                .rtlAware()
            }
            .navigationTitle(loc("lidar.history.title"))
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingFilterSheet = true
                    }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                    .accessibilityLabel(loc("lidar.history.filter"))
                    .accessibilityHint(NSLocalizedString("accessibility.button.filter.hint", value: "Double tap to filter scan history", comment: ""))
                    .voiceControlSupport(identifier: "filter_button")
                    .switchControlSupport()

                    Menu {
                        Button(action: {
                            exportHistory()
                        }) {
                            Label("Export History", systemImage: "square.and.arrow.up")
                        }

                        Button(role: .destructive, action: {
                            deleteAllScans()
                        }) {
                            Label("Delete All", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showingFilterSheet) {
                filterSheet
            }
            .sheet(item: $selectedScan) { scan in
                LiDARResultsView(scanResult: scan)
            }
        }
    }

    // MARK: - Statistics View

    private var statisticsView: some View {
        VStack(spacing: 16) {
            Text(NSLocalizedString("lidar.history.statistics", value: "Statistics", comment: ""))
                .font(.headline)
                .lidarDynamicType(size: .headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isHeader)

            HStack(spacing: 16) {
                StatisticCard(
                    title: loc("lidar.history.total_scans"),
                    value: "\(statistics.totalScans)",
                    icon: "viewfinder",
                    color: .blue
                )

                StatisticCard(
                    title: loc("lidar.history.average_score"),
                    value: formatNumber(statistics.averageScore, precision: 1),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .green
                )

                StatisticCard(
                    title: loc("lidar.history.this_week"),
                    value: "\(statistics.scansThisWeek)",
                    icon: "calendar",
                    color: .orange
                )
            }
        }
    }

    // MARK: - Trend Chart

    private var trendChartView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(loc("lidar.history.score_trend"))
                .font(.headline)
                .lidarDynamicType(size: .headline)
                .accessibilityAddTraits(.isHeader)

            Chart {
                ForEach(filteredScans.prefix(50).sorted(by: { $0.date < $1.date }), id: \.id) { scan in
                    LineMark(
                        x: .value("Date", scan.date),
                        y: .value("Score", scan.score)
                    )
                    .foregroundStyle(scanTypeColor(scan.type))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", scan.date),
                        y: .value("Score", scan.score)
                    )
                    .foregroundStyle(scanTypeColor(scan.type))
                    .symbolSize(60)
                }
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: max(1, filteredScans.count / 5))) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month().day())
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Filter and Search

    private var filterSearchView: some View {
        VStack(spacing: 12) {
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField(loc("lidar.history.search_placeholder"), text: $searchText)
                    .textFieldStyle(.plain)
                    .lidarDynamicType(size: .body)
                    .accessibilityLabel(NSLocalizedString("accessibility.search_field", value: "Search scans", comment: ""))
                    .voiceControlSupport(identifier: "search_scans_field")

                if !searchText.isEmpty {
                    Button(action: {
                        searchText = ""
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Quick Filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FilterChip(
                        title: "All Types",
                        isSelected: selectedScanType == nil,
                        action: { selectedScanType = nil }
                    )

                    ForEach(LiDARScanningView.ScanType.allCases, id: \.self) { scanType in
                        FilterChip(
                            title: scanType.rawValue,
                            isSelected: selectedScanType == scanType,
                            action: { selectedScanType = scanType }
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Scan List

    private var scanListView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locFormat("lidar.history.all_scans", filteredScans.count))
                .font(.headline)
                .lidarDynamicType(size: .headline)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isHeader)

            if filteredScans.isEmpty {
                emptyStateView
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(filteredScans, id: \.id) { scan in
                        ScanHistoryRow(scan: scan) {
                            selectedScan = scan
                        }
                    }
                }
            }
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "viewfinder")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Scans Found")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Start scanning to build your history")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Filter Sheet

    private var filterSheet: some View {
        NavigationView {
            Form {
                Section("Time Range") {
                    Picker("Time Range", selection: $selectedTimeRange) {
                        ForEach(TimeRange.allCases, id: \.self) { range in
                            Text(range.rawValue).tag(range)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Scan Type") {
                    Picker("Scan Type", selection: $selectedScanType) {
                        Text("All Types").tag(nil as LiDARScanningView.ScanType?)
                        ForEach(LiDARScanningView.ScanType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type as LiDARScanningView.ScanType?)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilterSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Methods

    private func scanTypeColor(_ type: LiDARScanningView.ScanType) -> Color {
        switch type {
        case .fallRiskAssessment: return .red
        case .gaitAnalysis: return .blue
        case .environmentalScan: return .green
        case .balanceTest: return .orange
        }
    }

    private func exportHistory() {
        // Export functionality
        let scans = filteredScans
        let csv = generateCSV(scans: scans)

        let activityVC = UIActivityViewController(
            activityItems: [csv],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootViewController = windowScene.windows.first?.rootViewController {
            rootViewController.present(activityVC, animated: true)
        }

        AnalyticsManager.shared.logEvent("lidar_history_exported", parameters: [
            "scan_count": String(scans.count)
        ])
    }

    private func generateCSV(scans: [LiDARScanResult]) -> String {
        var csv = "Date,Type,Duration,Frame Count,Quality,Score\n"

        for scan in scans {
            let dateFormatter = ISO8601DateFormatter()
            csv += "\(dateFormatter.string(from: scan.date)),"
            csv += "\(scan.type.rawValue),"
            csv += "\(scan.duration),"
            csv += "\(scan.frameCount),"
            csv += "\(scan.averageQuality),"
            csv += "\(scan.score)\n"
        }

        return csv
    }

    private func deleteAllScans() {
        dataManager.deleteAllScans()
        AnalyticsManager.shared.logEvent("lidar_history_deleted_all")
    }

    // MARK: - Formatting Helpers

    private func formatNumber(_ value: Double, precision: Int = 2) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = precision
        formatter.maximumFractionDigits = precision
        formatter.locale = Locale.current
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.\(precision)f", value)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale.current
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Views

struct StatisticCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .accessibilityHidden(true)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .lidarDynamicType(size: .title3)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .lidarDynamicType(size: .caption)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .metricCardAccessibility(name: title, value: value, unit: nil, subtitle: nil)
        .switchControlSupport()
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .lidarDynamicType(size: .subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray6))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
        .accessibilityLabel(title)
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : [.isButton])
        .accessibilityHint(NSLocalizedString("accessibility.filter_chip.hint", value: "Double tap to filter by \(title)", comment: ""))
        .voiceControlSupport(identifier: "filter_chip_\(title.lowercased().replacingOccurrences(of: " ", with: "_"))")
        .switchControlSupport()
    }
}

struct ScanHistoryRow: View {
    let scan: LiDARScanResult
    let onTap: () -> Void

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale.current
        return formatter.string(from: date)
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Icon
                Image(systemName: scanTypeIcon(scan.type))
                    .font(.title2)
                    .foregroundColor(scanTypeColor(scan.type))
                    .frame(width: 44, height: 44)
                    .background(scanTypeColor(scan.type).opacity(0.1))
                    .cornerRadius(12)
                    .accessibilityHidden(true)

                // Details
                VStack(alignment: .leading, spacing: 4) {
                    Text(scan.type.rawValue)
                        .font(.headline)
                        .foregroundColor(.primary)
                        .lidarDynamicType(size: .headline)

                    Text(formatDate(scan.date))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lidarDynamicType(size: .subheadline)

                    HStack(spacing: 8) {
                        Label(NSLocalizedString("lidar.scan.frames_label", value: "%d frames", comment: "").replacingOccurrences(of: "%d", with: "\(scan.frameCount)"),
                              systemImage: "viewfinder")
                        Label(formatDuration(scan.duration), systemImage: "clock")
                    }
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lidarDynamicType(size: .caption)
                }

                Spacer()

                // Score
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(scan.score))")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(scoreColor(scan.score))
                        .lidarDynamicType(size: .title3)

                    Text(loc("lidar.results.score"))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lidarDynamicType(size: .caption2)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 3, x: 0, y: 1)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(NSLocalizedString("accessibility.scan_history_row", value: "\(scan.type.rawValue) scan, score \(Int(scan.score)), \(formatDate(scan.date))", comment: ""))
        .accessibilityHint(NSLocalizedString("accessibility.scan_history_row.hint", value: "Double tap to view scan details", comment: ""))
        .voiceControlSupport(identifier: "scan_row_\(scan.id.uuidString.prefix(8))")
        .switchControlSupport()
    }

    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        if minutes > 0 {
            return String(format: NSLocalizedString("format.duration.minutes_seconds", value: "%d:%02d", comment: ""), minutes, seconds)
        } else {
            return String(format: NSLocalizedString("format.duration.seconds_only", value: "%d seconds", comment: ""), seconds)
        }
    }

    private func scanTypeIcon(_ type: LiDARScanningView.ScanType) -> String {
        switch type {
        case .fallRiskAssessment: return "figure.fall"
        case .gaitAnalysis: return "figure.walk"
        case .environmentalScan: return "viewfinder"
        case .balanceTest: return "figure.mind.and.body"
        }
    }

    private func scanTypeColor(_ type: LiDARScanningView.ScanType) -> Color {
        switch type {
        case .fallRiskAssessment: return .red
        case .gaitAnalysis: return .blue
        case .environmentalScan: return .green
        case .balanceTest: return .orange
        }
    }

    private func scoreColor(_ score: Double) -> Color {
        if score >= 80 {
            return .green
        } else if score >= 60 {
            return .orange
        } else {
            return .red
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Preview

@available(iOS 16.0, *)
struct LiDARScanHistoryView_Previews: PreviewProvider {
    static var previews: some View {
        LiDARScanHistoryView()
            .environmentObject(AnalyticsManager.shared)
    }
}
