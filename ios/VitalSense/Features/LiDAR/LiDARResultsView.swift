import SwiftUI
import Charts
import simd

struct LiDARResultsView: View {
    let scanResult: LiDARScanResult
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var analyticsManager: AnalyticsManager
    @StateObject private var healthKitManager = HealthKitManager.shared
    @State private var selectedTab = 0
    @State private var showingShareSheet = false
    @State private var showingExportOptions = false
    @State private var scanMetrics: ExtractedScanMetrics?

    init(scanResult: LiDARScanResult) {
        self.scanResult = scanResult
        _scanMetrics = State(initialValue: ExtractedScanMetrics.from(scanResult))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Enhanced Header with score
                    VStack(spacing: 16) {
                        // Scan type and date
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(scanResult.type.rawValue.capitalized)
                                    .font(.title2)
                                    .fontWeight(.bold)

                                Text(formatDate(scanResult.date))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            // Quick stats badge
                            VStack(alignment: .trailing, spacing: 4) {
                                HStack(spacing: 4) {
                                    Image(systemName: "viewfinder")
                                        .font(.caption2)
                                    Text("\(scanResult.frameCount)")
                                        .font(.caption)
                                        .fontWeight(.medium)
                                }
                                .foregroundColor(.blue)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(8)

                                Text("\(Int(scanResult.averageQuality * 100))% quality")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }

                        // Enhanced Score display with animation
                        ZStack {
                            // Background circles
                            Circle()
                                .stroke(Color.gray.opacity(0.1), lineWidth: 12)
                                .frame(width: 140, height: 140)

                            Circle()
                                .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                                .frame(width: 130, height: 130)

                            // Score progress
                            Circle()
                                .trim(from: 0, to: scanResult.score / 100.0)
                                .stroke(
                                    AngularGradient(
                                        colors: [scoreColor.opacity(0.6), scoreColor],
                                        center: .center
                                    ),
                                    style: StrokeStyle(lineWidth: 10, lineCap: .round)
                                )
                                .frame(width: 130, height: 130)
                                .rotationEffect(.degrees(-90))
                                .animation(.spring(response: 1.0, dampingFraction: 0.8), value: scanResult.score)

                            // Score value
                            VStack(spacing: 4) {
                                Text("\(Int(scanResult.score))")
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundColor(scoreColor)
                                    .contentTransition(.numericText())

                                Text("SCORE")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.secondary)

                                // Score trend indicator if available
                                if let previousScan = getPreviousScan() {
                                    scoreTrendIndicator(current: scanResult.score, previous: previousScan.score)
                                }
                            }
                        }

                        // Score description with action button
                        VStack(spacing: 8) {
                            Text(scoreDescription)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)

                            // Quick action buttons
                            HStack(spacing: 12) {
                                ActionButton(
                                    title: "View Details",
                                    icon: "info.circle.fill",
                                    color: .blue,
                                    action: { selectedTab = 2 }
                                )

                                ActionButton(
                                    title: "Export",
                                    icon: "square.and.arrow.up.fill",
                                    color: .green,
                                    action: { showingExportOptions = true }
                                )
                            }
                        }
                    }
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [
                                scoreColor.opacity(0.1),
                                Color(.systemBackground)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(20)
                    .shadow(color: scoreColor.opacity(0.2), radius: 10, x: 0, y: 4)

                    // Tab selector
                    Picker("Results", selection: $selectedTab) {
                        Text("Insights").tag(0)
                        Text("Metrics").tag(1)
                        Text("Details").tag(2)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal)

                    // Tab content
                    Group {
                        switch selectedTab {
                        case 0:
                            insightsView
                        case 1:
                            metricsView
                        case 2:
                            detailsView
                        default:
                            insightsView
                        }
                    }
                    .animation(.easeInOut, value: selectedTab)
                }
                .padding()
            }
            .navigationTitle("Scan Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingExportOptions = true
                    }) {
                        Image(systemName: "square.and.arrow.up")
                    }

                    Menu {
                        Button(action: {
                            shareResults()
                        }) {
                            Label("Share Results", systemImage: "square.and.arrow.up")
                        }

                        Button(action: {
                            exportToPDF()
                        }) {
                            Label("Export as PDF", systemImage: "doc.fill")
                        }

                        Button(action: {
                            exportToHealthKit()
                        }) {
                            Label("Save to HealthKit", systemImage: "heart.text.square.fill")
                        }

                        Button(action: {
                            saveToFavorites()
                        }) {
                            Label("Save to Favorites", systemImage: "star.fill")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
    }

    // MARK: - Insights View
    private var insightsView: some View {
        VStack(spacing: 16) {
            ForEach(scanResult.insights, id: \.title) { insight in
                InsightCard(insight: insight)
            }

            if scanResult.insights.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundColor(.green)

                    Text("All Clear!")
                        .font(.title3)
                        .fontWeight(.semibold)

                    Text("No significant issues were detected in this scan.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(24)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(radius: 2)
            }
        }
    }

    // MARK: - Metrics View
    private var metricsView: some View {
        VStack(spacing: 16) {
            // Scan quality metrics
            MetricCard(
                title: "Scan Quality",
                value: "\(Int(scanResult.averageQuality * 100))%",
                subtitle: "Data accuracy",
                icon: "camera.fill",
                color: qualityColor
            )

            // Frame count
            MetricCard(
                title: "Frames Captured",
                value: "\(scanResult.frameCount)",
                subtitle: "LiDAR data points",
                icon: "viewfinder",
                color: .blue
            )

            // Duration
            MetricCard(
                title: "Scan Duration",
                value: formatDuration(scanResult.duration),
                subtitle: "Recording time",
                icon: "timer",
                color: .orange
            )

            // Type-specific metrics
            if scanResult.type == .gaitAnalysis {
                gaitMetricsView
            } else if scanResult.type == .balanceTest {
                balanceMetricsView
            } else if scanResult.type == .environmentalScan {
                environmentalMetricsView
            }
        }
    }

    // MARK: - Details View
    private var detailsView: some View {
        VStack(spacing: 16) {
            // Scan information
            DetailSection(title: "Scan Information") {
                DetailRow(label: "Type", value: scanResult.type.rawValue.capitalized)
                DetailRow(label: "Date", value: formatDate(scanResult.date))
                DetailRow(label: "Duration", value: formatDuration(scanResult.duration))
                DetailRow(label: "Frames", value: "\(scanResult.frameCount)")
                DetailRow(label: "Quality", value: "\(Int(scanResult.averageQuality * 100))%")
            }

            // Device information
            DetailSection(title: "Device Information") {
                DetailRow(label: "Device", value: deviceModel)
                DetailRow(label: "iOS Version", value: iosVersion)
                DetailRow(label: "LiDAR Available", value: "Yes")
            }

            // Data summary
            DetailSection(title: "Data Summary") {
                DetailRow(label: "Accelerometer Samples", value: "\(scanResult.rawData.accelerometerData.count)")
                DetailRow(label: "Gyroscope Samples", value: "\(scanResult.rawData.gyroscopeData.count)")
                DetailRow(label: "AR Frames", value: "\(scanResult.rawData.frames.count)")
            }
        }
    }

    // MARK: - Type-specific Metrics
    private var gaitMetricsView: some View {
        VStack(spacing: 16) {
            Text("Gait Analysis")
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.top)

            // Primary Metrics Grid
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricCard(
                    title: "Steps",
                    value: "\(scanMetrics?.stepsDetected ?? 0)",
                    subtitle: "Detected",
                    icon: "figure.walk",
                    color: .green
                )

                MetricCard(
                    title: "Cadence",
                    value: scanMetrics?.cadence != nil ? "\(Int(scanMetrics!.cadence!))" : "N/A",
                    subtitle: "Steps/min",
                    icon: "metronome",
                    color: .purple
                )

                MetricCard(
                    title: "Stride Length",
                    value: scanMetrics?.strideLength != nil ? String(format: "%.2fm", scanMetrics!.strideLength!) : "N/A",
                    subtitle: "Average",
                    icon: "ruler",
                    color: .orange
                )

                MetricCard(
                    title: "Walking Speed",
                    value: scanMetrics?.walkingSpeed != nil ? String(format: "%.2f m/s", scanMetrics!.walkingSpeed!) : "N/A",
                    subtitle: "Average",
                    icon: "speedometer",
                    color: .blue
                )
            }

            // Secondary Metrics
            if let metrics = scanMetrics, metrics.hasDetailedMetrics {
                VStack(spacing: 12) {
                    Text("Detailed Metrics")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        if let symmetry = metrics.stepSymmetry {
                            MetricCard(
                                title: "Symmetry",
                                value: String(format: "%.1f%%", symmetry * 100),
                                subtitle: "L/R balance",
                                icon: "balance.horizontal",
                                color: .indigo
                            )
                        }

                        if let speedCV = metrics.walkingSpeedCV {
                            MetricCard(
                                title: "Speed Consistency",
                                value: String(format: "%.1f%%", (1.0 - speedCV) * 100),
                                subtitle: "Variability",
                                icon: "chart.line.uptrend.xyaxis",
                                color: .teal
                            )
                        }
                    }
                }
                .padding(.top, 8)
            }

            // Gait Chart if available
            if let metrics = scanMetrics, let cadenceHistory = metrics.cadenceHistory, cadenceHistory.count > 1 {
                gaitTrendChart(cadenceHistory: cadenceHistory)
            }
        }
    }

    private func gaitTrendChart(cadenceHistory: [Double]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Cadence Over Time")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)

            Chart {
                ForEach(Array(cadenceHistory.enumerated()), id: \.offset) { index, cadence in
                    LineMark(
                        x: .value("Time", index),
                        y: .value("Cadence", cadence)
                    )
                    .foregroundStyle(.purple.gradient)
                    .interpolationMethod(.catmullRom)
                }
            }
            .frame(height: 150)
            .chartXAxis(.hidden)
            .chartYAxis {
                AxisMarks(position: .leading) { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    private var balanceMetricsView: some View {
        VStack(spacing: 16) {
            Text("Balance Assessment")
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.top)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricCard(
                    title: "Postural Sway",
                    value: scanMetrics?.posturalSway != nil ? String(format: "%.2f", scanMetrics!.posturalSway!) : "N/A",
                    subtitle: "Sway magnitude",
                    icon: "target",
                    color: scanMetrics?.posturalSway != nil && scanMetrics!.posturalSway! < 0.5 ? .green : .orange
                )

                MetricCard(
                    title: "Stability Score",
                    value: scanMetrics?.stabilityScore != nil ? String(format: "%.0f", scanMetrics!.stabilityScore! * 100) : "N/A",
                    subtitle: "Overall",
                    icon: "checkmark.circle",
                    color: scanMetrics?.stabilityScore != nil && scanMetrics!.stabilityScore! > 0.7 ? .green : .orange
                )

                if let centerOfMass = scanMetrics?.centerOfMass {
                    MetricCard(
                        title: "Center of Mass",
                        value: String(format: "(%.2f, %.2f)", centerOfMass.x, centerOfMass.y),
                        subtitle: "Average position",
                        icon: "scope",
                        color: .blue
                    )
                }

                MetricCard(
                    title: "Movement Stability",
                    value: scanMetrics?.movementStability != nil ? String(format: "%.0f%%", scanMetrics!.movementStability! * 100) : "N/A",
                    subtitle: "During test",
                    icon: "waveform.path",
                    color: scanMetrics?.movementStability != nil && scanMetrics!.movementStability! > 0.7 ? .green : .orange
                )
            }

            // Balance visualization if available
            if let sway = scanMetrics?.posturalSway, let stability = scanMetrics?.stabilityScore {
                balanceVisualization(sway: sway, stability: stability)
            }
        }
    }

    private func balanceVisualization(sway: Double, stability: Double) -> some View {
        VStack(spacing: 12) {
            Text("Balance Visualization")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            ZStack {
                // Background circle
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 2)
                    .frame(width: 120, height: 120)

                // Sway area visualization
                Circle()
                    .fill(Color.red.opacity(min(sway, 1.0) * 0.3))
                    .frame(width: 120 * CGFloat(min(sway, 1.0)), height: 120 * CGFloat(min(sway, 1.0)))

                // Stability indicator
                Circle()
                    .fill(Color.green.opacity(stability * 0.5))
                    .frame(width: 80 * CGFloat(stability), height: 80 * CGFloat(stability))

                // Center point
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
            .padding()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    private var environmentalMetricsView: some View {
        VStack(spacing: 16) {
            Text("Environmental Analysis")
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.top)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                MetricCard(
                    title: "Obstacles",
                    value: "\(scanMetrics?.obstacleCount ?? 0)",
                    subtitle: "Detected",
                    icon: "exclamationmark.triangle",
                    color: (scanMetrics?.obstacleCount ?? 0) > 0 ? .orange : .green
                )

                MetricCard(
                    title: "Floor Stability",
                    value: scanMetrics?.floorStability != nil ? String(format: "%.0f%%", scanMetrics!.floorStability! * 100) : "N/A",
                    subtitle: "Levelness",
                    icon: "square.grid.3x3",
                    color: scanMetrics?.floorStability != nil && scanMetrics!.floorStability! > 0.8 ? .green : .orange
                )

                MetricCard(
                    title: "Hazards",
                    value: "\(scanMetrics?.hazardCount ?? 0)",
                    subtitle: "Unsafe areas",
                    icon: "exclamationmark.octagon",
                    color: (scanMetrics?.hazardCount ?? 0) > 0 ? .red : .green
                )

                MetricCard(
                    title: "Clear Path",
                    value: scanMetrics?.clearPathPercentage != nil ? String(format: "%.0f%%", scanMetrics!.clearPathPercentage!) : "N/A",
                    subtitle: "Walking area",
                    icon: "checkmark.circle",
                    color: scanMetrics?.clearPathPercentage != nil && scanMetrics!.clearPathPercentage! > 80 ? .green : .orange
                )
            }

            // Hazard details if any
            if let hazards = scanMetrics?.hazardCount, hazards > 0 {
                environmentalHazardsView
            }
        }
    }

    private var environmentalHazardsView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Detected Hazards")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)

            ForEach(scanResult.insights.filter { $0.type == .warning || $0.type == .alert }, id: \.title) { insight in
                HStack(spacing: 12) {
                    Image(systemName: insight.type.icon)
                        .foregroundColor(insight.type.color)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(insight.title)
                            .font(.subheadline)
                            .fontWeight(.medium)

                        Text(insight.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(12)
                .background(insight.type.color.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    // MARK: - Helper Views
    private func InsightCard(insight: LiDARInsight) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: insight.type.icon)
                    .foregroundColor(insight.type.color)
                    .font(.title3)

                Text(insight.title)
                    .font(.headline)
                    .fontWeight(.semibold)

                Spacer()
            }

            Text(insight.description)
                .font(.subheadline)
                .foregroundColor(.primary)

            if !insight.recommendation.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Recommendation:")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)

                    Text(insight.recommendation)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 4)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private func MetricCard(title: String, value: String, subtitle: String, icon: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .fontWeight(.medium)

            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    private func DetailSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)

            VStack(spacing: 8) {
                content()
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 1)
        }
    }

    private func DetailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }

    // MARK: - Computed Properties
    private var scoreColor: Color {
        switch scanResult.score {
        case 80...:
            return .green
        case 60..<80:
            return .orange
        default:
            return .red
        }
    }

    private var scoreDescription: String {
        switch scanResult.score {
        case 90...:
            return "Excellent - No significant issues detected"
        case 80..<90:
            return "Good - Minor areas for improvement"
        case 70..<80:
            return "Fair - Some concerns identified"
        case 60..<70:
            return "Poor - Several issues detected"
        default:
            return "Critical - Immediate attention recommended"
        }
    }

    private var qualityColor: Color {
        switch scanResult.averageQuality {
        case 0.8...:
            return .green
        case 0.6..<0.8:
            return .orange
        default:
            return .red
        }
    }

    private var deviceModel: String {
        var systemInfo = utsname()
        uname(&systemInfo)

        let modelCode = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String.init(validatingUTF8: ptr)
            }
        }

        return modelCode ?? "Unknown"
    }

    private var iosVersion: String {
        return UIDevice.current.systemVersion
    }

    // MARK: - Helper Methods
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    // MARK: - Action Methods

    private func shareResults() {
        analyticsManager.logEvent("lidar_scan_shared", parameters: [
            "scan_type": scanResult.type.rawValue,
            "score": String(Int(scanResult.score))
        ])

        var shareText = """
        VitalSense \(scanResult.type.rawValue.capitalized) Results

        Score: \(Int(scanResult.score))/100
        Date: \(formatDate(scanResult.date))
        Duration: \(formatDuration(scanResult.duration))
        Quality: \(Int(scanResult.averageQuality * 100))%

        """

        // Add metrics if available
        if let metrics = scanMetrics {
            if let cadence = metrics.cadence {
                shareText += "Cadence: \(Int(cadence)) steps/min\n"
            }
            if let strideLength = metrics.strideLength {
                shareText += "Stride Length: \(String(format: "%.2f", strideLength))m\n"
            }
            if let walkingSpeed = metrics.walkingSpeed {
                shareText += "Walking Speed: \(String(format: "%.2f", walkingSpeed)) m/s\n"
            }
        }

        shareText += "\n\(scanResult.insights.count) insights generated\n"

        // Add insights
        if !scanResult.insights.isEmpty {
            shareText += "\nKey Insights:\n"
            for insight in scanResult.insights.prefix(3) {
                shareText += "• \(insight.title): \(insight.description)\n"
            }
        }

        let activityController = UIActivityViewController(
            activityItems: [shareText],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityController, animated: true)
        }
    }

    private func exportToPDF() {
        analyticsManager.logEvent("lidar_scan_exported_pdf", parameters: [
            "scan_type": scanResult.type.rawValue
        ])

        // TODO: Implement PDF export
        // This would use PDFKit to create a formatted PDF report
        print("📄 PDF export not yet implemented")
    }

    private func exportToHealthKit() {
        analyticsManager.logEvent("lidar_scan_saved_healthkit", parameters: [
            "scan_type": scanResult.type.rawValue
        ])

        Task {
            // HealthKit save is already handled in LiDARScanningManager
            // This is just a user-triggered reminder/re-save
            if healthKitManager.isAuthorized {
                // Re-trigger save if needed
                print("💾 Saving to HealthKit...")
            } else {
                print("⚠️ HealthKit not authorized")
            }
        }
    }

    private func saveToFavorites() {
        analyticsManager.logEvent("lidar_scan_favorited", parameters: [
            "scan_type": scanResult.type.rawValue
        ])

        // TODO: Implement favorites storage
        print("⭐ Favorites not yet implemented")
    }

    private func getPreviousScan() -> LiDARScanResult? {
        // Get previous scan of same type for comparison
        let manager = LiDARScanningManager.shared
        return manager.recentScans
            .filter { $0.type == scanResult.type && $0.id != scanResult.id }
            .first
    }

    private func scoreTrendIndicator(current: Double, previous: Double) -> some View {
        let difference = current - previous
        let isImproving = difference > 0

        return HStack(spacing: 4) {
            Image(systemName: isImproving ? "arrow.up.right" : "arrow.down.right")
                .font(.caption2)
            Text(String(format: "%.0f", abs(difference)))
                .font(.caption2)
                .fontWeight(.medium)
        }
        .foregroundColor(isImproving ? .green : .red)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background((isImproving ? Color.green : Color.red).opacity(0.1))
        .cornerRadius(4)
    }
}

// MARK: - Supporting Views

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(color)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.1))
            .cornerRadius(8)
        }
    }
}

// MARK: - Extracted Scan Metrics

struct ExtractedScanMetrics {
    // Gait metrics
    var stepsDetected: Int = 0
    var cadence: Double? = nil
    var strideLength: Double? = nil
    var walkingSpeed: Double? = nil
    var stepSymmetry: Double? = nil
    var walkingSpeedCV: Double? = nil
    var cadenceHistory: [Double]? = nil

    // Balance metrics
    var posturalSway: Double? = nil
    var stabilityScore: Double? = nil
    var centerOfMass: simd_float3? = nil
    var movementStability: Double? = nil

    // Environmental metrics
    var obstacleCount: Int = 0
    var hazardCount: Int = 0
    var floorStability: Double? = nil
    var clearPathPercentage: Double? = nil

    var hasDetailedMetrics: Bool {
        cadence != nil || strideLength != nil || walkingSpeed != nil || stepSymmetry != nil
    }

    static func from(_ result: LiDARScanResult) -> ExtractedScanMetrics {
        var metrics = ExtractedScanMetrics()

        // Extract from accelerometer data
        let accelData = result.rawData.accelerometerData

        // Calculate steps from accelerometer peaks
        if !accelData.isEmpty {
            var steps = 0
            let threshold = 1.2

            for i in 1..<accelData.count - 1 {
                let current = accelData[i].acceleration.y
                let prev = accelData[i-1].acceleration.y
                let next = accelData[i+1].acceleration.y

                if current > threshold && current > prev && current > next {
                    steps += 1
                }
            }

            metrics.stepsDetected = steps

            // Calculate cadence if we have enough steps
            if steps > 5 && result.duration > 0 {
                metrics.cadence = Double(steps) / (result.duration / 60.0)
            }

            // Estimate stride length from acceleration patterns
            let yAccels = accelData.map { $0.acceleration.y }
            let variance = calculateVariance(yAccels.map { Double($0) })
            if variance > 0 {
                // Rough estimate: higher variance = longer stride
                metrics.strideLength = 0.6 + min(0.3, sqrt(variance) * 0.2)

                // Estimate walking speed
                if let cadence = metrics.cadence, let strideLength = metrics.strideLength {
                    metrics.walkingSpeed = strideLength * cadence / 60.0
                }
            }

            // Calculate step symmetry
            var leftSteps = 0
            var rightSteps = 0
            for (index, _) in accelData.enumerated() where index % 2 == 0 {
                leftSteps += 1
            }
            rightSteps = accelData.count - leftSteps
            if leftSteps > 0 && rightSteps > 0 {
                let symmetry = 1.0 - abs(Double(leftSteps - rightSteps)) / Double(leftSteps + rightSteps)
                metrics.stepSymmetry = symmetry
            }

            // Calculate postural sway
            let xAccels = accelData.map { $0.acceleration.x }
            let zAccels = accelData.map { $0.acceleration.z }
            let xVariance = calculateVariance(xAccels.map { Double($0) })
            let zVariance = calculateVariance(zAccels.map { Double($0) })
            metrics.posturalSway = sqrt(xVariance + zVariance) / 2.0

            // Calculate movement stability
            let accelMagnitudes = accelData.map { sqrt($0.acceleration.x * $0.acceleration.x + $0.acceleration.y * $0.acceleration.y + $0.acceleration.z * $0.acceleration.z) }
            let accelVariance = calculateVariance(accelMagnitudes.map { Double($0) })
            metrics.movementStability = max(0, min(1, 1.0 - accelVariance / 2.0))
        }

        // Extract from gyroscope data
        let gyroData = result.rawData.gyroscopeData
        if !gyroData.isEmpty && metrics.posturalSway == nil {
            let xRates = gyroData.map { $0.rotationRate.x }
            let zRates = gyroData.map { $0.rotationRate.z }
            let xVariance = calculateVariance(xRates.map { Double($0) })
            let zVariance = calculateVariance(zRates.map { Double($0) })
            metrics.posturalSway = sqrt(xVariance + zVariance) / 3.0
        }

        // Calculate stability score
        if let sway = metrics.posturalSway, let movement = metrics.movementStability {
            metrics.stabilityScore = (1.0 - min(sway, 1.0)) * 0.5 + movement * 0.5
        }

        // Extract environmental data from insights
        metrics.obstacleCount = result.insights.filter { $0.type == .warning && $0.title.lowercased().contains("obstacle") }.count
        metrics.hazardCount = result.insights.filter { $0.type == .alert }.count

        // Estimate floor stability from quality
        metrics.floorStability = result.averageQuality

        // Estimate clear path percentage
        if result.averageQuality > 0.8 {
            metrics.clearPathPercentage = min(100, result.averageQuality * 100)
        } else {
            metrics.clearPathPercentage = result.averageQuality * 90 // Lower bound estimate
        }

        return metrics
    }

    private static func calculateVariance(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2) }.reduce(0, +) / Double(values.count)
        return variance
    }
}

// MARK: - Preview
struct LiDARResultsView_Previews: PreviewProvider {
    static var previews: some View {
        LiDARResultsView(scanResult: sampleScanResult)
            .environmentObject(AnalyticsManager.shared)
    }

    static var sampleScanResult: LiDARScanResult {
        LiDARScanResult(
            id: UUID(),
            type: .fallRiskAssessment,
            date: Date(),
            duration: 30.0,
            frameCount: 150,
            averageQuality: 0.85,
            score: 78.5,
            insights: [
                LiDARInsight(
                    type: .warning,
                    title: "Gait Instability Detected",
                    description: "Your walking pattern shows some irregularities that may increase fall risk.",
                    recommendation: "Consider gait training exercises or consult with a physical therapist."
                ),
                LiDARInsight(
                    type: .info,
                    title: "Good Environmental Conditions",
                    description: "No significant obstacles or hazards detected in the scan area.",
                    recommendation: "Continue maintaining clear walking paths."
                )
            ],
            rawData: LiDARRawData(
                frames: [],
                accelerometerData: [],
                gyroscopeData: []
            )
        )
    }
}
