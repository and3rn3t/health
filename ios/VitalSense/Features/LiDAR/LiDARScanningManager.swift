import Foundation
import ARKit
import Combine
import CoreMotion

// MARK: - LiDAR Scanning Manager
@MainActor
class LiDARScanningManager: ObservableObject {
    static let shared = LiDARScanningManager()

    // MARK: - Published Properties
    @Published var isLiDARAvailable = false
    @Published var isCollectingData = false
    @Published var isPaused = false
    @Published var currentPointCount = 0
    @Published var scanQuality: Double = 0.0
    @Published var totalScans = 0
    @Published var scansThisWeek = 0
    @Published var averageScore: Double = 0.0
    @Published var recentScans: [LiDARScanResult] = []
    @Published var lastScanResults: LiDARScanResult?

    // MARK: - Private Properties
    private var scanTimer: Timer?
    private var scanStartTime: Date?
    private var scanDuration: TimeInterval = 30.0
    private var progressCallback: ((Double) -> Void)?
    private var currentScanType: LiDARScanningView.ScanType = .fallRiskAssessment
    private var collectedFrames: [ARFrame] = []
    private var motionManager = CMMotionManager()
    private var accelerometerData: [CMAccelerometerData] = []
    private var gyroscopeData: [CMGyroData] = []

    // Analytics data
    private var scanAnalytics = LiDARScanAnalytics()

    private init() {
        checkLiDARAvailability()
        loadScanHistory()
        setupMotionTracking()
    }

    // MARK: - LiDAR Availability
    private func checkLiDARAvailability() {
        // Check if device supports LiDAR
        isLiDARAvailable = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) ||
                          ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification)

        // Additional checks for specific devices
        if !isLiDARAvailable {
            // Check device model for LiDAR support
            isLiDARAvailable = deviceSupportsLiDAR()
        }
    }

    private func deviceSupportsLiDAR() -> Bool {
        // Check device model for LiDAR support
        var systemInfo = utsname()
        uname(&systemInfo)

        let modelCode = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String.init(validatingUTF8: ptr)
            }
        }

        guard let model = modelCode else { return false }

        // LiDAR supported devices
        let lidarDevices = [
            "iPhone13,2", "iPhone13,3", "iPhone13,4", // iPhone 12 Pro, Pro Max
            "iPhone14,2", "iPhone14,3", // iPhone 13 Pro, Pro Max
            "iPhone15,2", "iPhone15,3", // iPhone 14 Pro, Pro Max
            "iPhone16,1", "iPhone16,2", // iPhone 15 Pro, Pro Max
            "iPad13,8", "iPad13,9", "iPad13,10", "iPad13,11", // iPad Pro 12.9" (5th gen)
            "iPad13,4", "iPad13,5", "iPad13,6", "iPad13,7", // iPad Pro 11" (3rd gen)
            "iPad14,3", "iPad14,4", // iPad Pro 11" (4th gen)
            "iPad14,5", "iPad14,6"  // iPad Pro 12.9" (6th gen)
        ]

        return lidarDevices.contains { model.hasPrefix($0) }
    }

    // MARK: - Motion Tracking Setup
    private func setupMotionTracking() {
        if motionManager.isAccelerometerAvailable {
            motionManager.accelerometerUpdateInterval = 0.02 // 50Hz
        }

        if motionManager.isGyroAvailable {
            motionManager.gyroUpdateInterval = 0.02 // 50Hz
        }
    }

    // MARK: - Scan Management
    func startScan(type: LiDARScanningView.ScanType, progressCallback: @escaping (Double) -> Void) {
        guard isLiDARAvailable else {
            print("LiDAR not available on this device")
            return
        }

        currentScanType = type
        scanDuration = type.scanDuration
        self.progressCallback = progressCallback

        isCollectingData = true
        isPaused = false
        scanStartTime = Date()
        collectedFrames.removeAll()

        // Start motion tracking
        startMotionTracking()

        // Start scan timer
        scanTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateScanProgress()
        }

        print("Started \(type.rawValue) scan")
    }

    func pauseScan() {
        isPaused = true
        scanTimer?.invalidate()
        stopMotionTracking()
    }

    func resumeScan() {
        isPaused = false
        startMotionTracking()

        // Resume timer
        scanTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateScanProgress()
        }
    }

    func stopScan() {
        scanTimer?.invalidate()
        isCollectingData = false
        isPaused = false
        stopMotionTracking()

        // Process collected data
        if !collectedFrames.isEmpty {
            processScanData()
        }

        print("Stopped scan")
    }

    private func updateScanProgress() {
        guard let startTime = scanStartTime else { return }

        let elapsed = Date().timeIntervalSince(startTime)
        let progress = elapsed / scanDuration

        progressCallback?(progress)

        if progress >= 1.0 {
            // Scan completed
            completeScan()
        }
    }

    private func completeScan() {
        scanTimer?.invalidate()
        isCollectingData = false
        stopMotionTracking()

        // Process the scan data
        processScanData()

        // Update statistics
        totalScans += 1
        updateWeeklyStats()

        progressCallback?(1.0)
    }

    // MARK: - Motion Tracking
    private func startMotionTracking() {
        // Start accelerometer
        if motionManager.isAccelerometerAvailable {
            motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, error in
                if let data = data {
                    self?.accelerometerData.append(data)

                    // Keep only recent data
                    if self?.accelerometerData.count ?? 0 > 1000 {
                        self?.accelerometerData.removeFirst(500)
                    }
                }
            }
        }

        // Start gyroscope
        if motionManager.isGyroAvailable {
            motionManager.startGyroUpdates(to: .main) { [weak self] data, error in
                if let data = data {
                    self?.gyroscopeData.append(data)

                    // Keep only recent data
                    if self?.gyroscopeData.count ?? 0 > 1000 {
                        self?.gyroscopeData.removeFirst(500)
                    }
                }
            }
        }
    }

    private func stopMotionTracking() {
        motionManager.stopAccelerometerUpdates()
        motionManager.stopGyroUpdates()
    }

    // MARK: - Data Processing
    func processFrame(_ frame: ARFrame) {
        guard isCollectingData && !isPaused else { return }

        collectedFrames.append(frame)

        // Keep memory usage reasonable
        if collectedFrames.count > 300 {
            collectedFrames.removeFirst(150)
        }

        // Update real-time metrics
        updateRealTimeMetrics(frame)
    }

    private func updateRealTimeMetrics(_ frame: ARFrame) {
        // Update point count
        if let depthData = frame.sceneDepth {
            let depthMap = depthData.depthMap
            currentPointCount = CVPixelBufferGetWidth(depthMap) * CVPixelBufferGetHeight(depthMap)
        }

        // Update scan quality
        scanQuality = calculateFrameQuality(frame)
    }

    private func calculateFrameQuality(_ frame: ARFrame) -> Double {
        var quality = 1.0

        // Tracking state quality
        switch frame.camera.trackingState {
        case .normal:
            quality *= 1.0
        case .limited(_):
            quality *= 0.7
        case .notAvailable:
            quality *= 0.3
        }

        // Lighting quality
        if let lightEstimate = frame.lightEstimate?.ambientIntensity {
            if lightEstimate < 500 {
                quality *= 0.8
            }
        }

        // Depth data availability
        if frame.sceneDepth == nil {
            quality *= 0.6
        }

        return max(0.0, min(1.0, quality))
    }

    private func processScanData() {
        guard !collectedFrames.isEmpty else { return }

        let result = LiDARScanResult(
            id: UUID(),
            type: currentScanType,
            date: Date(),
            duration: scanDuration,
            frameCount: collectedFrames.count,
            averageQuality: scanAnalytics.calculateAverageQuality(from: collectedFrames),
            score: calculateScanScore(),
            insights: generateInsights(),
            rawData: LiDARRawData(
                frames: collectedFrames,
                accelerometerData: accelerometerData,
                gyroscopeData: gyroscopeData
            )
        )

        // Save the result
        lastScanResults = result
        recentScans.insert(result, at: 0)

        // Keep only recent scans
        if recentScans.count > 20 {
            recentScans.removeLast()
        }

        // Update average score
        updateAverageScore()

        // Save to persistent storage
        saveScanResult(result)
    }

    private func calculateScanScore() -> Double {
        switch currentScanType {
        case .fallRiskAssessment:
            return calculateFallRiskScore()
        case .gaitAnalysis:
            return calculateGaitScore()
        case .environmentalScan:
            return calculateEnvironmentalScore()
        case .balanceTest:
            return calculateBalanceScore()
        }
    }

    private func calculateFallRiskScore() -> Double {
        // Analyze collected data for fall risk factors
        var score = 100.0

        // Factors that reduce score:
        // - Unsteady gait patterns
        // - Environmental hazards
        // - Poor balance
        // - Obstacles in walking path

        // Analyze gait stability from accelerometer data
        let gaitStability = analyzeGaitStability()
        score -= (1.0 - gaitStability) * 20

        // Analyze environmental hazards from LiDAR data
        let hazardScore = analyzeEnvironmentalHazards()
        score -= hazardScore * 30

        // Analyze balance from motion data
        let balanceScore = analyzeBalance()
        score -= (1.0 - balanceScore) * 25

        return max(0, min(100, score))
    }

    private func calculateGaitScore() -> Double {
        // Analyze gait patterns and biomechanics
        var score = 100.0

        // Analyze stride regularity
        let strideRegularity = analyzeStrideRegularity()
        score -= (1.0 - strideRegularity) * 25

        // Analyze walking speed consistency
        let speedConsistency = analyzeWalkingSpeedConsistency()
        score -= (1.0 - speedConsistency) * 20

        // Analyze step symmetry
        let stepSymmetry = analyzeStepSymmetry()
        score -= (1.0 - stepSymmetry) * 25

        return max(0, min(100, score))
    }

    private func calculateEnvironmentalScore() -> Double {
        // Analyze environmental safety
        var score = 100.0

        // Detect obstacles
        let obstacleCount = detectObstacles()
        score -= Double(obstacleCount) * 10

        // Detect stairs without railings
        let unsafeStairs = detectUnsafeStairs()
        score -= Double(unsafeStairs) * 20

        // Analyze floor levelness
        let floorLevelness = analyzeFloorLevelness()
        score -= (1.0 - floorLevelness) * 15

        return max(0, min(100, score))
    }

    private func calculateBalanceScore() -> Double {
        // Analyze balance and postural stability
        var score = 100.0

        // Analyze postural sway
        let posturalSway = analyzePosturalSway()
        score -= posturalSway * 40

        // Analyze stability during movement
        let movementStability = analyzeMovementStability()
        score -= (1.0 - movementStability) * 30

        return max(0, min(100, score))
    }

    // MARK: - Analysis Methods
    private func analyzeGaitStability() -> Double {
        // Analyze accelerometer data for gait stability
        guard !accelerometerData.isEmpty else { return 0.5 }

        // Calculate variance in acceleration patterns
        let yAccelerations = accelerometerData.map { $0.acceleration.y }
        let variance = calculateVariance(yAccelerations)

        // Lower variance indicates more stable gait
        return max(0, min(1, 1.0 - variance / 10.0))
    }

    private func analyzeEnvironmentalHazards() -> Double {
        // Analyze LiDAR frames for hazards (0-1 scale)
        // This would use computer vision to detect obstacles, stairs, etc.
        return 0.2 // Placeholder
    }

    private func analyzeBalance() -> Double {
        // Analyze motion data for balance
        guard !gyroscopeData.isEmpty else { return 0.5 }

        // Calculate stability from gyroscope data
        let angularVelocities = gyroscopeData.map { sqrt($0.rotationRate.x * $0.rotationRate.x +
                                                         $0.rotationRate.y * $0.rotationRate.y +
                                                         $0.rotationRate.z * $0.rotationRate.z) }
        let avgAngularVelocity = angularVelocities.reduce(0, +) / Double(angularVelocities.count)

        // Lower angular velocity indicates better balance
        return max(0, min(1, 1.0 - avgAngularVelocity / 2.0))
    }

    private func analyzeStrideRegularity() -> Double {
        // Analyze stride patterns from accelerometer data
        guard accelerometerData.count > 50 else { return 0.5 }

        // Detect step patterns and calculate regularity
        let steps = detectStepsFromAccelerometer()
        guard steps.count > 5 else { return 0.5 }

        // Calculate stride time variance
        let strideTimes = calculateStrideTimes(from: steps)
        let strideVariance = calculateVariance(strideTimes)

        // Lower variance indicates more regular stride
        return max(0, min(1, 1.0 - strideVariance / 0.5))
    }

    private func analyzeWalkingSpeedConsistency() -> Double {
        // Analyze walking speed consistency
        // This would analyze the change in position over time from AR tracking
        return 0.8 // Placeholder
    }

    private func analyzeStepSymmetry() -> Double {
        // Analyze symmetry between left and right steps
        return 0.75 // Placeholder
    }

    private func detectObstacles() -> Int {
        // Detect obstacles from LiDAR data
        // This would use computer vision on the collected frames
        return Int.random(in: 0...3) // Placeholder
    }

    private func detectUnsafeStairs() -> Int {
        // Detect stairs without proper railings
        return Int.random(in: 0...1) // Placeholder
    }

    private func analyzeFloorLevelness() -> Double {
        // Analyze floor levelness from LiDAR data
        return 0.9 // Placeholder
    }

    private func analyzePosturalSway() -> Double {
        // Analyze postural sway from accelerometer data
        guard !accelerometerData.isEmpty else { return 0.5 }

        // Calculate sway magnitude
        let xAccelerations = accelerometerData.map { $0.acceleration.x }
        let zAccelerations = accelerometerData.map { $0.acceleration.z }

        let xVariance = calculateVariance(xAccelerations)
        let zVariance = calculateVariance(zAccelerations)

        let totalSway = sqrt(xVariance + zVariance)

        // Return sway as 0-1 scale (higher is worse)
        return min(1.0, totalSway / 2.0)
    }

    private func analyzeMovementStability() -> Double {
        // Analyze stability during movement
        return 0.7 // Placeholder
    }

    // MARK: - Helper Methods
    private func detectStepsFromAccelerometer() -> [TimeInterval] {
        guard !accelerometerData.isEmpty else { return [] }

        var steps: [TimeInterval] = []
        let threshold = 1.2 // Acceleration threshold for step detection

        for i in 1..<accelerometerData.count-1 {
            let current = accelerometerData[i].acceleration.y
            let prev = accelerometerData[i-1].acceleration.y
            let next = accelerometerData[i+1].acceleration.y

            // Detect local maxima above threshold
            if current > threshold && current > prev && current > next {
                steps.append(accelerometerData[i].timestamp)
            }
        }

        return steps
    }

    private func calculateStrideTimes(from steps: [TimeInterval]) -> [Double] {
        guard steps.count > 1 else { return [] }

        var strideTimes: [Double] = []

        for i in 1..<steps.count {
            let strideTime = steps[i] - steps[i-1]
            strideTimes.append(strideTime)
        }

        return strideTimes
    }

    private func calculateVariance(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }

        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2) }.reduce(0, +) / Double(values.count)

        return variance
    }

    private func generateInsights() -> [LiDARInsight] {
        var insights: [LiDARInsight] = []

        switch currentScanType {
        case .fallRiskAssessment:
            insights.append(contentsOf: generateFallRiskInsights())
        case .gaitAnalysis:
            insights.append(contentsOf: generateGaitInsights())
        case .environmentalScan:
            insights.append(contentsOf: generateEnvironmentalInsights())
        case .balanceTest:
            insights.append(contentsOf: generateBalanceInsights())
        }

        return insights
    }

    private func generateFallRiskInsights() -> [LiDARInsight] {
        var insights: [LiDARInsight] = []

        let gaitStability = analyzeGaitStability()
        if gaitStability < 0.7 {
            insights.append(LiDARInsight(
                type: .warning,
                title: "Gait Instability Detected",
                description: "Your walking pattern shows some irregularities that may increase fall risk.",
                recommendation: "Consider gait training exercises or consult with a physical therapist."
            ))
        }

        let hazardScore = analyzeEnvironmentalHazards()
        if hazardScore > 0.3 {
            insights.append(LiDARInsight(
                type: .alert,
                title: "Environmental Hazards Found",
                description: "Several obstacles or hazards were detected in your walking area.",
                recommendation: "Remove obstacles from walking paths and improve lighting."
            ))
        }

        return insights
    }

    private func generateGaitInsights() -> [LiDARInsight] {
        var insights: [LiDARInsight] = []

        let strideRegularity = analyzeStrideRegularity()
        if strideRegularity < 0.8 {
            insights.append(LiDARInsight(
                type: .info,
                title: "Irregular Stride Pattern",
                description: "Your stride pattern shows some variability.",
                recommendation: "Practice walking with consistent step length and timing."
            ))
        }

        return insights
    }

    private func generateEnvironmentalInsights() -> [LiDARInsight] {
        var insights: [LiDARInsight] = []

        let obstacleCount = detectObstacles()
        if obstacleCount > 2 {
            insights.append(LiDARInsight(
                type: .warning,
                title: "Multiple Obstacles Detected",
                description: "Several obstacles were found that could pose tripping hazards.",
                recommendation: "Clear walkways and consider rearranging furniture for better accessibility."
            ))
        }

        return insights
    }

    private func generateBalanceInsights() -> [LiDARInsight] {
        var insights: [LiDARInsight] = []

        let sway = analyzePosturalSway()
        if sway > 0.6 {
            insights.append(LiDARInsight(
                type: .warning,
                title: "Increased Postural Sway",
                description: "You show increased body sway while standing, which may indicate balance challenges.",
                recommendation: "Consider balance training exercises or consult with a healthcare provider."
            ))
        }

        return insights
    }

    // MARK: - Data Persistence
    private func loadScanHistory() {
        // Load scan history from UserDefaults or Core Data
        // For now, generate some sample data
        totalScans = UserDefaults.standard.integer(forKey: "lidar_total_scans")
        scansThisWeek = UserDefaults.standard.integer(forKey: "lidar_scans_this_week")
        averageScore = UserDefaults.standard.double(forKey: "lidar_average_score")

        if averageScore == 0 {
            averageScore = 75.0 // Default average
        }
    }

    private func saveScanResult(_ result: LiDARScanResult) {
        // Save to persistent storage
        UserDefaults.standard.set(totalScans, forKey: "lidar_total_scans")
        UserDefaults.standard.set(scansThisWeek, forKey: "lidar_scans_this_week")
        UserDefaults.standard.set(averageScore, forKey: "lidar_average_score")

        // In a real app, you would save the full result to Core Data or similar
    }

    private func updateWeeklyStats() {
        let calendar = Calendar.current
        let weekOfYear = calendar.component(.weekOfYear, from: Date())
        let lastWeekOfYear = UserDefaults.standard.integer(forKey: "lidar_last_week")

        if weekOfYear != lastWeekOfYear {
            scansThisWeek = 1
            UserDefaults.standard.set(weekOfYear, forKey: "lidar_last_week")
        } else {
            scansThisWeek += 1
        }
    }

    private func updateAverageScore() {
        let totalScore = recentScans.reduce(0) { $0 + $1.score }
        averageScore = totalScore / Double(recentScans.count)
    }
}

// MARK: - Supporting Types
struct LiDARScanResult: Identifiable {
    let id: UUID
    let type: LiDARScanningView.ScanType
    let date: Date
    let duration: TimeInterval
    let frameCount: Int
    let averageQuality: Double
    let score: Double
    let insights: [LiDARInsight]
    let rawData: LiDARRawData
}

struct LiDARInsight {
    enum InsightType {
        case info, warning, alert, success

        var color: Color {
            switch self {
            case .info: return .blue
            case .warning: return .orange
            case .alert: return .red
            case .success: return .green
            }
        }

        var icon: String {
            switch self {
            case .info: return "info.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .alert: return "exclamationmark.octagon.fill"
            case .success: return "checkmark.circle.fill"
            }
        }
    }

    let type: InsightType
    let title: String
    let description: String
    let recommendation: String
}

struct LiDARRawData {
    let frames: [ARFrame]
    let accelerometerData: [CMAccelerometerData]
    let gyroscopeData: [CMGyroData]
}

// MARK: - Analytics Helper
struct LiDARScanAnalytics {
    func calculateAverageQuality(from frames: [ARFrame]) -> Double {
        guard !frames.isEmpty else { return 0 }

        let totalQuality = frames.compactMap { frame -> Double? in
            var quality = 1.0

            switch frame.camera.trackingState {
            case .normal: quality *= 1.0
            case .limited(_): quality *= 0.7
            case .notAvailable: quality *= 0.3
            }

            if frame.sceneDepth == nil {
                quality *= 0.6
            }

            return quality
        }.reduce(0, +)

        return totalQuality / Double(frames.count)
    }
}

// MARK: - Gait Analysis Manager
@MainActor
class GaitAnalysisManager: ObservableObject {
    @Published var detectedSteps = 0
    @Published var currentCadence: Double = 0
    @Published var strideLength: Double = 0
    @Published var walkingSpeed: Double = 0
    @Published var gaitSymmetry: Double = 0

    func analyzeGaitFrame(_ frame: ARFrame) {
        // Analyze frame for gait patterns
        // This would integrate with ARKit body tracking
    }

    func resetGaitAnalysis() {
        detectedSteps = 0
        currentCadence = 0
        strideLength = 0
        walkingSpeed = 0
        gaitSymmetry = 0
    }
}
