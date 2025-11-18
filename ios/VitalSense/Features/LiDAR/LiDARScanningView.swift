import SwiftUI
import ARKit
import RealityKit
import Combine
import AVFoundation

// MARK: - LiDAR Scanning View
@available(iOS 16.0, *)
struct LiDARScanningView: View {
    @StateObject private var lidarManager = LiDARScanningManager()
    @StateObject private var gaitAnalyzer = GaitAnalysisManager()
    @State private var selectedScanType: ScanType = .fallRiskAssessment
    @State private var isScanning = false
    @State private var showingResults = false
    @State private var scanProgress: Double = 0.0
    @State private var showingPermissionSheet = false
    @State private var showingInstructions = false
    @State private var showingHistory = false

    enum ScanType: String, CaseIterable {
        case fallRiskAssessment = "Fall Risk Assessment"
        case gaitAnalysis = "Gait Analysis"
        case environmentalScan = "Environmental Scan"
        case balanceTest = "Balance Test"

        var icon: String {
            switch self {
            case .fallRiskAssessment: return "figure.fall"
            case .gaitAnalysis: return "figure.walk"
            case .environmentalScan: return "viewfinder"
            case .balanceTest: return "figure.mind.and.body"
            }
        }

        var description: String {
            switch self {
            case .fallRiskAssessment:
                return "Analyze walking patterns and stability to assess fall risk"
            case .gaitAnalysis:
                return "Detailed analysis of walking biomechanics and stride patterns"
            case .environmentalScan:
                return "Scan surroundings for potential hazards and obstacles"
            case .balanceTest:
                return "Measure balance and postural stability"
            }
        }

        var scanDuration: TimeInterval {
            switch self {
            case .fallRiskAssessment: return 30.0
            case .gaitAnalysis: return 45.0
            case .environmentalScan: return 20.0
            case .balanceTest: return 60.0
            }
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [
                        Color.blue.opacity(0.1),
                        Color.teal.opacity(0.05),
                        Color.purple.opacity(0.1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                if isScanning {
                    // AR Scanning Interface
                    scanningInterface
                } else {
                    // Setup and Configuration Interface
                    setupInterface
                }
            }
            .navigationTitle(loc("lidar.scan.title"))
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingHistory = true
                    }) {
                        Image(systemName: "clock.arrow.circlepath")
                            .foregroundColor(.blue)
                    }
                    .accessibilityLabel(loc("accessibility.button.view_history"))
                    .accessibilityHint(NSLocalizedString("accessibility.button.view_history.hint", value: "Double tap to view scan history", comment: ""))
                    .voiceControlSupport(identifier: "view_history_button")

                    Button(action: {
                        showingInstructions = true
                    }) {
                        Image(systemName: "questionmark.circle")
                            .foregroundColor(.blue)
                    }
                    .accessibilityLabel(loc("accessibility.button.view_instructions"))
                    .accessibilityHint(NSLocalizedString("accessibility.button.view_instructions.hint", value: "Double tap to view scan instructions", comment: ""))
                    .voiceControlSupport(identifier: "view_instructions_button")
                }
            }
            .sheet(isPresented: $showingPermissionSheet) {
                LiDARPermissionView()
            }
            .sheet(isPresented: $showingInstructions) {
                LiDARInstructionsView()
            }
            .sheet(isPresented: $showingResults) {
                if let results = lidarManager.lastScanResults {
                    LiDARResultsView(scanResult: results)
                }
            }
            .sheet(isPresented: $showingHistory) {
                if #available(iOS 16.0, *) {
                    LiDARScanHistoryView()
                }
            }
            .onAppear {
                checkLiDARAvailability()
            }
        }
    }

    // MARK: - Setup Interface
    var setupInterface: some View {
        ScrollView {
            VStack(spacing: 24) {
                // LiDAR Status Card
                lidarStatusCard

                // Scan Type Selection
                scanTypeSelectionCard

                // Quick Stats
                quickStatsCard

                // Recent Scans
                recentScansCard

                // Start Scan Button
                startScanButton
            }
            .padding()
            .rtlAware()
        }
    }

    // MARK: - LiDAR Status Card
    var lidarStatusCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(NSLocalizedString("lidar.scan.status.title", value: "LiDAR Scanner Status", comment: ""))
                        .font(.headline)
                        .fontWeight(.bold)
                        .lidarDynamicType(size: .headline)

                    HStack(spacing: 8) {
                        Circle()
                            .fill(lidarManager.isLiDARAvailable ? .green : .red)
                            .frame(width: 8, height: 8)
                            .scaleEffect(lidarManager.isLiDARAvailable ? 1.2 : 1.0)
                            .animation(lidarManager.isLiDARAvailable ? .easeInOut(duration: 1.0).repeatForever(autoreverses: true) : .default,
                                     value: lidarManager.isLiDARAvailable)
                            .accessibilityLabel(lidarManager.isLiDARAvailable ?
                                              NSLocalizedString("accessibility.status.ready", value: "Ready", comment: "") :
                                              NSLocalizedString("accessibility.status.unavailable", value: "Unavailable", comment: ""))

                        Text(loc("lidar.scan.status.ready"))
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lidarDynamicType(size: .caption)
                            .opacity(lidarManager.isLiDARAvailable ? 1 : 0)
                            .overlay(
                                Text(loc("lidar.scan.status.unavailable"))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lidarDynamicType(size: .caption)
                                    .opacity(lidarManager.isLiDARAvailable ? 0 : 1)
                            )
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel(lidarManager.isLiDARAvailable ? loc("lidar.scan.status.ready") : loc("lidar.scan.status.unavailable"))
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Image(systemName: "viewfinder")
                        .font(.largeTitle)
                        .foregroundColor(lidarManager.isLiDARAvailable ? .blue : .gray)

                    Text("3D Scanning")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            if !lidarManager.isLiDARAvailable {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)

                        Text(loc("device.lidar.required"))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lidarDynamicType(size: .subheadline)

                        Spacer()
                    }

                    Text(loc("device.lidar.required.message"))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lidarDynamicType(size: .caption)
                        .multilineTextAlignment(.leading)
                }
                .padding()
                .background(Color.orange.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Scan Type Selection Card
    var scanTypeSelectionCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(loc("lidar.scan.select_type"))
                .font(.headline)
                .fontWeight(.bold)
                .lidarDynamicType(size: .headline)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(ScanType.allCases, id: \.rawValue) { scanType in
                    ScanTypeCard(
                        scanType: scanType,
                        isSelected: selectedScanType == scanType,
                        action: {
                            selectedScanType = scanType
                        }
                    )
                    .lidarScanButtonAccessibility(scanType: scanType, isEnabled: true)
                    .switchControlSupport()
                }
            }

            // Selected scan description
            VStack(alignment: .leading, spacing: 8) {
                Text(locFormat("lidar.scan.about", selectedScanType.rawValue))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lidarDynamicType(size: .subheadline)

                Text(selectedScanType.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lidarDynamicType(size: .caption)

                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.blue)
                        .font(.caption)

                    Text(locFormat("lidar.scan.duration", Int(selectedScanType.scanDuration)))
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lidarDynamicType(size: .caption)

                    Spacer()
                }
            }
            .padding()
            .background(selectedScanType == .fallRiskAssessment ? Color.red.opacity(0.1) :
                       selectedScanType == .gaitAnalysis ? Color.blue.opacity(0.1) :
                       selectedScanType == .environmentalScan ? Color.green.opacity(0.1) :
                       Color.purple.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Quick Stats Card
    var quickStatsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Scan History")
                .font(.headline)
                .fontWeight(.bold)

            HStack(spacing: 20) {
                StatItem(
                    title: "Total Scans",
                    value: "\(lidarManager.totalScans)",
                    icon: "viewfinder",
                    color: .blue
                )

                StatItem(
                    title: "This Week",
                    value: "\(lidarManager.scansThisWeek)",
                    icon: "calendar",
                    color: .green
                )

                StatItem(
                    title: "Avg Score",
                    value: String(format: "%.1f", lidarManager.averageScore),
                    icon: "chart.line.uptrend.xyaxis",
                    color: .orange
                )
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Recent Scans Card
    var recentScansCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Recent Scans")
                    .font(.headline)
                    .fontWeight(.bold)

                Spacer()

                Button("View All") {
                    showingHistory = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }

            if lidarManager.recentScans.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "viewfinder")
                        .font(.largeTitle)
                        .foregroundColor(.gray)

                    Text("No scans yet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("Start your first LiDAR scan to begin tracking your health metrics")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(lidarManager.recentScans.prefix(3), id: \.id) { scan in
                        RecentScanRow(scan: scan)
                    }
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.regularMaterial)
        }
    }

    // MARK: - Start Scan Button
    var startScanButton: some View {
        Button(action: {
            startScan()
        }) {
            HStack(spacing: 12) {
                Image(systemName: selectedScanType.icon)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Start \(selectedScanType.rawValue)")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("~\(Int(selectedScanType.scanDuration)) seconds")
                        .font(.caption)
                        .opacity(0.8)
                }

                Spacer()

                Image(systemName: "arrow.right.circle.fill")
                    .font(.title2)
            }
            .foregroundColor(.white)
            .padding()
            .frame(maxWidth: .infinity)
            .background {
                LinearGradient(
                    colors: [.blue, .teal],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(!lidarManager.isLiDARAvailable)
        .opacity(lidarManager.isLiDARAvailable ? 1.0 : 0.6)
        .lidarScanButtonAccessibility(scanType: selectedScanType, isEnabled: lidarManager.isLiDARAvailable)
        .voiceControlSupport(identifier: "start_scan_button")
        .switchControlSupport()
    }

    // MARK: - Scanning Interface
    var scanningInterface: some View {
        ZStack {
            // AR Camera View
            LiDARCameraView(
                lidarManager: lidarManager,
                scanType: selectedScanType
            )
            .ignoresSafeArea()

            // Scanning Overlay
            VStack {
                // Top UI
                scanningTopUI

                Spacer()

                // Bottom UI
                scanningBottomUI
            }
            .padding()
        }
    }

    // MARK: - Scanning Top UI
    var scanningTopUI: some View {
        VStack(spacing: 16) {
            // Progress and Status
            VStack(spacing: 8) {
                HStack {
                    Text(selectedScanType.rawValue)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Spacer()

                    Button(loc("lidar.scan.cancel")) {
                        stopScan()
                    }
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .lidarDynamicType(size: .subheadline)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.3))
                    .clipShape(Capsule())
                    .accessibilityLabel(loc("accessibility.button.cancel_scan"))
                    .accessibilityHint(NSLocalizedString("accessibility.button.cancel_scan.hint", value: "Double tap to cancel the current scan", comment: ""))
                    .voiceControlSupport(identifier: "cancel_scan_button")
                    .switchControlSupport()
                }

                // Progress Bar
                ProgressView(value: scanProgress)
                    .progressViewStyle(LinearProgressViewStyle(tint: .white))
                    .scaleEffect(y: 2)
                    .scanProgressAccessibility(
                        progress: scanProgress,
                        scanType: selectedScanType.rawValue,
                        additionalInfo: String(format: "%d seconds of %d",
                                              Int(scanProgress * selectedScanType.scanDuration),
                                              Int(selectedScanType.scanDuration))
                    )

                HStack {
                    Text(NSLocalizedString("lidar.scan.progress.label", value: "Scanning...", comment: ""))
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                        .lidarDynamicType(size: .subheadline)

                    Spacer()

                    Text(locFormat("lidar.scan.progress",
                                  Int(scanProgress * selectedScanType.scanDuration),
                                  Int(selectedScanType.scanDuration)))
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))
                        .lidarDynamicType(size: .caption)
                }
            }
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .background(Color.black.opacity(0.3))
            }

            // Real-time Data
            if lidarManager.isCollectingData {
                realTimeDataCard
            }
        }
    }

    // MARK: - Real-time Data Card
    var realTimeDataCard: some View {
        VStack(spacing: 12) {
            Text("Real-time Analysis")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)

            HStack(spacing: 20) {
                RealTimeMetric(
                    title: "Points",
                    value: "\(lidarManager.currentPointCount)",
                    icon: "point.3.connected.trianglepath.dotted",
                    color: .cyan
                )

                RealTimeMetric(
                    title: "Quality",
                    value: "\(Int(lidarManager.scanQuality * 100))%",
                    icon: "checkmark.seal",
                    color: .green
                )

                if selectedScanType == .gaitAnalysis {
                    RealTimeMetric(
                        title: "Steps",
                        value: "\(gaitAnalyzer.detectedSteps)",
                        icon: "figure.walk",
                        color: .orange
                    )
                }
            }
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .background(Color.black.opacity(0.2))
        }
    }

    // MARK: - Scanning Bottom UI
    var scanningBottomUI: some View {
        VStack(spacing: 16) {
            // Instructions based on scan type
            instructionsCard

            // Control Buttons
            HStack(spacing: 20) {
                // Pause/Resume Button
                Button(action: {
                    if lidarManager.isPaused {
                        lidarManager.resumeScan()
                    } else {
                        lidarManager.pauseScan()
                    }
                }) {
                    Image(systemName: lidarManager.isPaused ? "play.circle.fill" : "pause.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.white)
                }

                Spacer()

                // Stop Button
                Button(action: {
                    stopScan()
                }) {
                    Image(systemName: "stop.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.red)
                }
            }
        }
    }

    // MARK: - Instructions Card
    var instructionsCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Instructions")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)

            Text(getInstructionsForScanType())
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
                .multilineTextAlignment(.leading)
        }
        .padding()
        .background {
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .background(Color.black.opacity(0.2))
        }
    }

    // MARK: - Helper Functions
    private func checkLiDARAvailability() {
        if !lidarManager.isLiDARAvailable {
            // Show information about LiDAR requirements
        }
    }

    private func startScan() {
        guard lidarManager.isLiDARAvailable else {
            showingPermissionSheet = true
            return
        }

        isScanning = true
        scanProgress = 0.0

        lidarManager.startScan(type: selectedScanType) { progress in
            DispatchQueue.main.async {
                scanProgress = progress

                if progress >= 1.0 {
                    // Scan completed
                    completeScan()
                }
            }
        }
    }

    private func stopScan() {
        lidarManager.stopScan()
        isScanning = false
        scanProgress = 0.0
    }

    private func completeScan() {
        isScanning = false
        scanProgress = 0.0
        showingResults = true
    }

    private func getInstructionsForScanType() -> String {
        switch selectedScanType {
        case .fallRiskAssessment:
            return "Hold the device steady and slowly scan your walking area. Walk naturally in front of the camera."
        case .gaitAnalysis:
            return "Walk back and forth in a straight line while keeping the device pointed at your lower body."
        case .environmentalScan:
            return "Slowly pan the device around the room to capture obstacles and hazards."
        case .balanceTest:
            return "Stand still in front of the camera and perform the balance poses as instructed."
        }
    }
}

// MARK: - Supporting Views
struct ScanTypeCard: View {
    let scanType: LiDARScanningView.ScanType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: scanType.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : .primary)

                Text(scanType.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background {
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? .blue : .regularMaterial)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.headline)
                .fontWeight(.bold)

            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct RecentScanRow: View {
    let scan: LiDARScanResult

    var body: some View {
        HStack {
            Image(systemName: scan.type.icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(scan.type.rawValue)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(scan.date, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(Int(scan.score))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(scan.score >= 80 ? .green : scan.score >= 60 ? .orange : .red)

                Text("Score")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct RealTimeMetric: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)
                .accessibilityHidden(true)

            Text(value)
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .lidarDynamicType(size: .caption)

            Text(title)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.7))
                .lidarDynamicType(size: .caption2)
        }
        .metricCardAccessibility(name: title, value: value, unit: nil, subtitle: NSLocalizedString("accessibility.metric.realtime", value: "Real-time metric", comment: "")))
        .accessibilityAddTraits(.updatesFrequently)
    }
}

// MARK: - Preview
#Preview {
    if #available(iOS 16.0, *) {
        LiDARScanningView()
    } else {
        Text("LiDAR Scanning requires iOS 16+")
    }
}
