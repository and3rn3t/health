import Foundation
import ARKit
import SwiftUI
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

    public init() {
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
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "LiDARScanningManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "LiDAR not available on this device"]),
                    context: "LiDAR scan start",
                    category: .lidar,
                    severity: .high,
                    recovery: .none
                )
            )
            return
        }

        do {
            currentScanType = type
            scanDuration = type.scanDuration
            self.progressCallback = progressCallback

            isCollectingData = true
            isPaused = false
            scanStartTime = Date()
            collectedFrames.removeAll()
            accelerometerData.removeAll()
            gyroscopeData.removeAll()

            // Start motion tracking
            startMotionTracking()

            // Start scan timer
            scanTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                self?.updateScanProgress()
            }

            // Log analytics event
            AnalyticsManager.shared.logEvent("lidar_scan_started", parameters: [
                "scan_type": type.rawValue,
                "duration": String(scanDuration)
            ])

            print("✅ Started \(type.rawValue) scan")
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Starting LiDAR scan",
                recovery: .retry(maxAttempts: 2)
            )
        }
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

        // Stream progress to web platform (throttled)
        if Int(elapsed * 10) % 5 == 0 { // Every 0.5 seconds
            Task {
                await WebSocketManager.shared.sendLiDARScanProgress(
                    scanType: currentScanType.rawValue,
                    progress: progress,
                    pointCount: currentPointCount,
                    quality: scanQuality,
                    metrics: [
                        "frames_collected": collectedFrames.count,
                        "motion_samples": accelerometerData.count
                    ]
                )
            }
        }

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
                if let error = error {
                    ErrorHandler.shared.handle(
                        error,
                        context: "Accelerometer tracking",
                        category: .data,
                        severity: .low,
                        recovery: .fallback
                    )
                    return
                }

                if let data = data {
                    self?.accelerometerData.append(data)

                    // Keep only recent data
                    if self?.accelerometerData.count ?? 0 > 1000 {
                        self?.accelerometerData.removeFirst(500)
                    }
                }
            }
        } else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "CMMotionManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Accelerometer not available"]),
                    context: "Motion tracking setup",
                    category: .data,
                    severity: .medium,
                    recovery: .fallback
                )
            )
        }

        // Start gyroscope
        if motionManager.isGyroAvailable {
            motionManager.startGyroUpdates(to: .main) { [weak self] data, error in
                if let error = error {
                    ErrorHandler.shared.handle(
                        error,
                        context: "Gyroscope tracking",
                        category: .data,
                        severity: .low,
                        recovery: .fallback
                    )
                    return
                }

                if let data = data {
                    self?.gyroscopeData.append(data)

                    // Keep only recent data
                    if self?.gyroscopeData.count ?? 0 > 1000 {
                        self?.gyroscopeData.removeFirst(500)
                    }
                }
            }
        } else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "CMMotionManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Gyroscope not available"]),
                    context: "Motion tracking setup",
                    category: .data,
                    severity: .low,
                    recovery: .fallback
                )
            )
        }
    }

    private func stopMotionTracking() {
        motionManager.stopAccelerometerUpdates()
        motionManager.stopGyroUpdates()
    }

    // MARK: - Data Processing
    func processFrame(_ frame: ARFrame) {
        guard isCollectingData && !isPaused else { return }

        do {
            collectedFrames.append(frame)

            // Keep memory usage reasonable
            if collectedFrames.count > 300 {
                collectedFrames.removeFirst(150)
            }

            // Update real-time metrics
            updateRealTimeMetrics(frame)

        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Processing AR frame",
                category: .arkit,
                severity: .medium,
                recovery: .retry(maxAttempts: 1)
            )
        }
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
        guard !collectedFrames.isEmpty else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "LiDARScanningManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "No frames collected"]),
                    context: "LiDAR scan processing",
                    category: .lidar,
                    severity: .medium,
                    recovery: .none
                )
            )
            return
        }

        do {
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

            // Stream to web platform via WebSocket
            Task {
                let success = await WebSocketManager.shared.sendLiDARScanResult(result)
                if !success {
                    ErrorHandler.shared.handle(
                        AppError(
                            error: NSError(domain: "WebSocketManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to send LiDAR scan result"]),
                            context: "LiDAR scan result streaming",
                            category: .websocket,
                            severity: .low,
                            recovery: .reconnect
                        )
                    )
                }
            }

        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "LiDAR scan data processing",
                recovery: .retry(maxAttempts: 3)
            )
        }
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
        // Analyze walking speed consistency from accelerometer data
        guard accelerometerData.count > 20 else { return 0.5 }

        // Calculate speed estimates from acceleration patterns
        var speedEstimates: [Double] = []

        // Use sliding window to estimate speed
        let windowSize = 10
        for i in windowSize..<accelerometerData.count {
            let window = accelerometerData[(i-windowSize)..<i]
            let yAccels = window.map { $0.acceleration.y }
            let variance = calculateVariance(yAccels.map { Double($0) })
            let estimatedSpeed = sqrt(variance) * 0.5
            speedEstimates.append(estimatedSpeed)
        }

        // Calculate coefficient of variation
        guard !speedEstimates.isEmpty else { return 0.5 }
        let avgSpeed = speedEstimates.reduce(0, +) / Double(speedEstimates.count)
        guard avgSpeed > 0 else { return 0.5 }

        let speedVariance = calculateVariance(speedEstimates)
        let cv = sqrt(speedVariance) / avgSpeed

        // Lower CV = more consistent speed = better score
        return max(0, min(1, 1.0 - cv / 0.3))
    }

    private func analyzeStepSymmetry() -> Double {
        // Analyze symmetry between left and right steps
        guard accelerometerData.count > 50 else { return 0.5 }

        // Detect steps from accelerometer
        let steps = detectStepsFromAccelerometer()
        guard steps.count > 5 else { return 0.5 }

        // Separate left and right steps (alternating)
        var leftStepTimes: [Double] = []
        var rightStepTimes: [Double] = []

        for (index, stepTime) in steps.enumerated() {
            if index % 2 == 0 {
                leftStepTimes.append(stepTime)
            } else {
                rightStepTimes.append(stepTime)
            }
        }

        // Calculate stride times for each foot
        var leftStrideTimes: [Double] = []
        var rightStrideTimes: [Double] = []

        for i in 1..<leftStepTimes.count {
            leftStrideTimes.append(leftStepTimes[i] - leftStepTimes[i-1])
        }
        for i in 1..<rightStepTimes.count {
            rightStrideTimes.append(rightStepTimes[i] - rightStepTimes[i-1])
        }

        guard !leftStrideTimes.isEmpty && !rightStrideTimes.isEmpty else { return 0.5 }

        // Calculate symmetry: 1 - (difference / average)
        let avgLeftStride = leftStrideTimes.reduce(0, +) / Double(leftStrideTimes.count)
        let avgRightStride = rightStrideTimes.reduce(0, +) / Double(rightStrideTimes.count)

        guard avgLeftStride > 0 && avgRightStride > 0 else { return 0.5 }

        let avgStride = (avgLeftStride + avgRightStride) / 2.0
        let difference = abs(avgLeftStride - avgRightStride)
        let symmetry = 1.0 - (difference / avgStride)

        return max(0, min(1, symmetry))
    }

    private func detectObstacles() -> Int {
        // Detect obstacles from accelerometer data patterns
        // Sudden decelerations or changes in acceleration may indicate obstacles
        guard accelerometerData.count > 20 else { return 0 }

        var obstacleIndicators = 0

        // Look for sudden acceleration changes
        for i in 1..<accelerometerData.count {
            let prev = accelerometerData[i-1].acceleration
            let curr = accelerometerData[i].acceleration

            let prevMagnitude = sqrt(prev.x * prev.x + prev.y * prev.y + prev.z * prev.z)
            let currMagnitude = sqrt(curr.x * curr.x + curr.y * curr.y + curr.z * curr.z)

            let change = abs(currMagnitude - prevMagnitude)

            // Sudden large change might indicate obstacle avoidance
            if change > 2.0 {
                obstacleIndicators += 1
            }
        }

        // Normalize to expected count (rough heuristic)
        return min(5, obstacleIndicators / 10)
    }

    private func detectUnsafeStairs() -> Int {
        // Detect stairs from acceleration patterns
        // Stairs typically show rhythmic vertical acceleration
        guard accelerometerData.count > 30 else { return 0 }

        var stairPatterns = 0

        // Look for rhythmic vertical acceleration (Y axis)
        let yAccels = accelerometerData.map { $0.acceleration.y }
        var peaks = 0

        for i in 1..<(yAccels.count - 1) {
            if yAccels[i] > yAccels[i-1] && yAccels[i] > yAccels[i+1] && yAccels[i] > 1.5 {
                peaks += 1
            }
        }

        // Multiple peaks in a short time might indicate stairs
        if peaks > 5 && peaks < 20 {
            stairPatterns = 1
        }

        return stairPatterns
    }

    private func analyzeFloorLevelness() -> Double {
        // Analyze floor levelness from accelerometer data
        // Level floor should have consistent Z-axis (gravity) component
        guard !accelerometerData.isEmpty else { return 0.5 }

        // When stationary or walking on level floor, Z acceleration should be stable
        let zAccels = accelerometerData.map { $0.acceleration.z }
        let zVariance = calculateVariance(zAccels.map { Double($0) })

        // Lower variance = more level floor
        let levelness = max(0, min(1, 1.0 - zVariance / 0.5))

        return levelness
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
        // Analyze stability during movement from accelerometer and gyroscope
        guard !accelerometerData.isEmpty && !gyroscopeData.isEmpty else { return 0.5 }

        // Combine accelerometer and gyroscope data for stability assessment
        let accelVariance = calculateVariance(
            accelerometerData.map { Double(sqrt($0.acceleration.x * $0.acceleration.x +
                                                $0.acceleration.y * $0.acceleration.y +
                                                $0.acceleration.z * $0.acceleration.z)) }
        )

        let gyroVariance = calculateVariance(
            gyroscopeData.map { Double(sqrt($0.rotationRate.x * $0.rotationRate.x +
                                            $0.rotationRate.y * $0.rotationRate.y +
                                            $0.rotationRate.z * $0.rotationRate.z)) }
        )

        // Lower variance = more stability
        let accelStability = max(0, min(1, 1.0 - accelVariance / 2.0))
        let gyroStability = max(0, min(1, 1.0 - gyroVariance / 3.0))

        // Combined stability score
        return (accelStability * 0.6 + gyroStability * 0.4)
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
        // Load scan history from Core Data
        let dataManager = LiDARScanDataManager.shared
        recentScans = dataManager.fetchScans(limit: 20)

        // Update statistics
        let stats = dataManager.getScanStatistics()
        totalScans = stats.totalScans
        scansThisWeek = stats.scansThisWeek
        averageScore = stats.averageScore

        // Also update recent scans count (this week)
        updateAverageScore()
    }

    private func saveScanResult(_ result: LiDARScanResult) {
        // Save to Core Data
        let dataManager = LiDARScanDataManager.shared
        dataManager.saveScan(result)

        // Update statistics
        let stats = dataManager.getScanStatistics()
        totalScans = stats.totalScans
        scansThisWeek = stats.scansThisWeek
        averageScore = stats.averageScore

        // Save to HealthKit
        Task {
            await saveToHealthKit(result)
        }
    }

    private func saveToHealthKit(_ result: LiDARScanResult) async {
        let healthKitManager = HealthKitManager.shared

        // Ensure HealthKit is authorized
        guard healthKitManager.isAuthorized else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "HealthKit", code: 4, userInfo: [NSLocalizedDescriptionKey: "HealthKit not authorized"]),
                    context: "Saving LiDAR scan to HealthKit",
                    category: .healthKit,
                    severity: .medium,
                    recovery: .userAction
                )
            )
            return
        }

        do {
            switch result.type {
            case .gaitAnalysis:
                // Save gait metrics to HealthKit
                await saveGaitMetricsToHealthKit(result)
            case .fallRiskAssessment:
                // Save fall risk assessment
                await saveFallRiskToHealthKit(result)
            case .balanceTest:
                // Balance test results could be saved as walking steadiness event
                await saveBalanceMetricsToHealthKit(result)
            case .environmentalScan:
                // Environmental scan results don't directly map to HealthKit
                break
            }
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Saving LiDAR scan to HealthKit",
                category: .healthKit,
                severity: .medium,
                recovery: .retry(maxAttempts: 2)
            )
        }
    }

    private func saveGaitMetricsToHealthKit(_ result: LiDARScanResult) async {
        let healthKitManager = HealthKitManager.shared

        // Extract gait metrics from accelerometer and AR data
        guard let gaitScore = extractGaitMetrics(from: result) else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "LiDARScanningManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to extract gait metrics"]),
                    context: "Saving gait metrics to HealthKit",
                    category: .lidar,
                    severity: .low,
                    recovery: .none
                )
            )
            return
        }

        // Save walking speed if available
        if let walkingSpeed = gaitScore.walkingSpeed {
            do {
                await healthKitManager.saveWalkingSpeed(
                    speed: walkingSpeed,
                    date: result.date,
                    metadata: ["source": "LiDAR", "scan_id": result.id.uuidString]
                )
            } catch {
                ErrorHandler.shared.handle(
                    error,
                    context: "Saving walking speed to HealthKit",
                    category: .healthKit,
                    severity: .low,
                    recovery: .retry(maxAttempts: 1)
                )
            }
        }

        // Save step length if available
        if let stepLength = gaitScore.stepLength {
            do {
                await healthKitManager.saveWalkingStepLength(
                    stepLength: stepLength,
                    date: result.date,
                    metadata: ["source": "LiDAR", "scan_id": result.id.uuidString]
                )
            } catch {
                ErrorHandler.shared.handle(
                    error,
                    context: "Saving step length to HealthKit",
                    category: .healthKit,
                    severity: .low,
                    recovery: .retry(maxAttempts: 1)
                )
            }
        }
    }

    private func saveFallRiskToHealthKit(_ result: LiDARScanResult) async {
        // Save fall risk as walking steadiness event
        let healthKitManager = HealthKitManager.shared

        // Map score to walking steadiness event
        // Lower score = higher risk = lower steadiness
        let steadinessScore = max(0.0, min(1.0, result.score / 100.0))

        // Save as walking steadiness category event
        // Note: This would need a custom implementation if HKCategoryType doesn't support it
        // For now, save as metadata in walking speed sample
        if let gaitMetrics = extractGaitMetrics(from: result) {
            if let speed = gaitMetrics.walkingSpeed {
                await healthKitManager.saveWalkingSpeed(
                    speed: speed,
                    date: result.date,
                    metadata: [
                        "source": "LiDAR",
                        "scan_id": result.id.uuidString,
                        "fall_risk_score": String(format: "%.2f", result.score),
                        "steadiness": String(format: "%.2f", steadinessScore)
                    ]
                )
            }
        }
    }

    private func saveBalanceMetricsToHealthKit(_ result: LiDARScanResult) async {
        // Balance test results can inform walking steadiness
        let healthKitManager = HealthKitManager.shared

        // Calculate steadiness from balance score
        let steadinessScore = max(0.0, min(1.0, result.score / 100.0))

        // Save as metadata in a health sample
        if let gaitMetrics = extractGaitMetrics(from: result), let speed = gaitMetrics.walkingSpeed {
            await healthKitManager.saveWalkingSpeed(
                speed: speed,
                date: result.date,
                metadata: [
                    "source": "LiDAR_Balance",
                    "scan_id": result.id.uuidString,
                    "balance_score": String(format: "%.2f", result.score),
                    "steadiness": String(format: "%.2f", steadinessScore)
                ]
            )
        }
    }

    private func extractGaitMetrics(from result: LiDARScanResult) -> (walkingSpeed: Double?, stepLength: Double?)? {
        // Extract gait metrics from raw data
        // Calculate average walking speed from accelerometer data
        guard !accelerometerData.isEmpty else { return nil }

        // Estimate walking speed from accelerometer variance
        // Higher variance in Y direction suggests more walking activity
        let yAccelerations = accelerometerData.map { $0.acceleration.y }
        let variance = calculateVariance(yAccelerations.map { Double($0) })

        // Estimate speed based on acceleration patterns (simplified)
        // In a full implementation, this would use proper biomechanical models
        let estimatedSpeed = sqrt(variance) * 0.5 // Rough approximation in m/s

        // Estimate step length from stride regularity
        let strideRegularity = analyzeStrideRegularity()
        let estimatedStepLength = 0.65 + (strideRegularity - 0.5) * 0.2 // 0.55-0.75m range

        return (walkingSpeed: estimatedSpeed > 0 ? estimatedSpeed : nil,
                stepLength: estimatedStepLength)
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

struct LiDARInsight: Codable {
    enum InsightType: String, Codable {
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
