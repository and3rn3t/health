import SwiftUI
import Charts

struct LiDARResultsView: View {
    let scanResult: LiDARScanResult
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header with score
                    VStack(spacing: 8) {
                        Text(scanResult.type.rawValue.capitalized)
                            .font(.title2)
                            .fontWeight(.semibold)

                        // Score display
                        ZStack {
                            Circle()
                                .stroke(Color.gray.opacity(0.3), lineWidth: 8)
                                .frame(width: 120, height: 120)

                            Circle()
                                .trim(from: 0, to: scanResult.score / 100.0)
                                .stroke(scoreColor, lineWidth: 8)
                                .frame(width: 120, height: 120)
                                .rotationEffect(.degrees(-90))
                                .animation(.easeInOut(duration: 1.0), value: scanResult.score)

                            VStack {
                                Text("\(Int(scanResult.score))")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(scoreColor)
                                Text("SCORE")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Text(scoreDescription)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(radius: 2)

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

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Share") {
                        shareResults()
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
        VStack(spacing: 12) {
            Text("Gait Analysis")
                .font(.headline)
                .padding(.top)

            HStack(spacing: 16) {
                MetricCard(
                    title: "Steps",
                    value: "24",  // Placeholder
                    subtitle: "Detected",
                    icon: "figure.walk",
                    color: .green
                )

                MetricCard(
                    title: "Cadence",
                    value: "110",  // Placeholder
                    subtitle: "Steps/min",
                    icon: "metronome",
                    color: .purple
                )
            }

            HStack(spacing: 16) {
                MetricCard(
                    title: "Stride",
                    value: "0.72m",  // Placeholder
                    subtitle: "Average",
                    icon: "ruler",
                    color: .orange
                )

                MetricCard(
                    title: "Symmetry",
                    value: "94%",  // Placeholder
                    subtitle: "L/R balance",
                    icon: "balance.horizontal",
                    color: .blue
                )
            }
        }
    }

    private var balanceMetricsView: some View {
        VStack(spacing: 12) {
            Text("Balance Assessment")
                .font(.headline)
                .padding(.top)

            HStack(spacing: 16) {
                MetricCard(
                    title: "Sway Area",
                    value: "2.1 cm²",  // Placeholder
                    subtitle: "Postural sway",
                    icon: "target",
                    color: .red
                )

                MetricCard(
                    title: "Stability",
                    value: "Good",  // Placeholder
                    subtitle: "Overall",
                    icon: "checkmark.circle",
                    color: .green
                )
            }
        }
    }

    private var environmentalMetricsView: some View {
        VStack(spacing: 12) {
            Text("Environmental Analysis")
                .font(.headline)
                .padding(.top)

            HStack(spacing: 16) {
                MetricCard(
                    title: "Obstacles",
                    value: "2",  // Placeholder
                    subtitle: "Detected",
                    icon: "exclamationmark.triangle",
                    color: .orange
                )

                MetricCard(
                    title: "Clear Path",
                    value: "85%",  // Placeholder
                    subtitle: "Walking area",
                    icon: "checkmark.circle",
                    color: .green
                )
            }
        }
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

    private func shareResults() {
        // Create shareable content
        let text = """
        VitalSense \(scanResult.type.rawValue.capitalized) Results
        Score: \(Int(scanResult.score))/100
        Date: \(formatDate(scanResult.date))
        Duration: \(formatDuration(scanResult.duration))

        \(scanResult.insights.count) insights generated
        """

        let activityController = UIActivityViewController(
            activityItems: [text],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityController, animated: true)
        }
    }
}

// MARK: - Preview
struct LiDARResultsView_Previews: PreviewProvider {
    static var previews: some View {
        LiDARResultsView(scanResult: sampleScanResult)
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
