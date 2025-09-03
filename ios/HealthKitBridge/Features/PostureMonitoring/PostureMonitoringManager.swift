import SwiftUI
import CoreMotion
import Foundation

// MARK: - Posture Monitoring Manager
class PostureMonitoringManager: ObservableObject {
    static let shared = PostureMonitoringManager()

    @Published var currentPosture: PostureState = .unknown
    @Published var postureScore: Double = 0.0
    @Published var dailyPostureQuality: PostureQualityMetrics?
    @Published var postureAlerts: [PostureAlert] = []
    @Published var isMonitoring = false

    private let motionManager = CMMotionManager()
    private var postureTimer: Timer?
    private var postureReadings: [PostureReading] = []
    private let webSocketManager = WebSocketManager.shared

    // Posture configuration
    private let monitoringInterval: TimeInterval = 30.0 // Check every 30 seconds
    private let alertThreshold: TimeInterval = 600.0 // Alert after 10 minutes of poor posture
    private let idealNeckAngle: Double = 15.0 // degrees from vertical
    private let maxAcceptableNeckAngle: Double = 30.0

    private init() {
        setupMotionManager()
    }

    // MARK: - Posture Monitoring Control

    func startPostureMonitoring() {
        guard !isMonitoring else { return }

        isMonitoring = true
        startDeviceMotionUpdates()
        schedulePostureChecks()

        print("📱 Posture monitoring started")
    }

    func stopPostureMonitoring() {
        isMonitoring = false
        motionManager.stopDeviceMotionUpdates()
        postureTimer?.invalidate()
        postureTimer = nil

        print("📱 Posture monitoring stopped")
    }

    // MARK: - Motion Manager Setup

    private func setupMotionManager() {
        guard motionManager.isDeviceMotionAvailable else {
            print("❌ Device motion not available")
            return
        }

        motionManager.deviceMotionUpdateInterval = 1.0 // Update every second
    }

    private func startDeviceMotionUpdates() {
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let self = self, let motion = motion else { return }

            self.processMotionData(motion)
        }
    }

    // MARK: - Posture Analysis

    private func processMotionData(_ motion: CMDeviceMotion) {
        let attitude = motion.attitude

        // Calculate device orientation relative to gravity
        let pitch = attitude.pitch * 180 / .pi
        let roll = attitude.roll * 180 / .pi

        // Estimate neck angle based on device orientation
        // Assumes phone is in typical usage position
        let neckAngle = calculateNeckAngle(pitch: pitch, roll: roll)

        let reading = PostureReading(
            timestamp: Date(),
            neckAngle: neckAngle,
            devicePitch: pitch,
            deviceRoll: roll,
            postureState: determinePostureState(neckAngle: neckAngle)
        )

        updatePostureState(with: reading)
    }

    private func calculateNeckAngle(pitch: Double, roll: Double) -> Double {
        // Simplified neck angle calculation
        // In reality, this would need calibration and more sophisticated analysis

        // When phone is held normally, pitch indicates forward head position
        let forwardHeadAngle = abs(pitch)

        // Adjust based on roll (phone tilt)
        let adjustedAngle = forwardHeadAngle + abs(roll) * 0.3

        return min(adjustedAngle, 90.0) // Cap at 90 degrees
    }

    private func determinePostureState(neckAngle: Double) -> PostureState {
        if neckAngle <= idealNeckAngle {
            return .excellent
        } else if neckAngle <= idealNeckAngle + 10 {
            return .good
        } else if neckAngle <= maxAcceptableNeckAngle {
            return .fair
        } else if neckAngle <= maxAcceptableNeckAngle + 15 {
            return .poor
        } else {
            return .critical
        }
    }

    private func updatePostureState(with reading: PostureReading) {
        postureReadings.append(reading)

        // Keep only last hour of readings
        let oneHourAgo = Date().addingTimeInterval(-3600)
        postureReadings = postureReadings.filter { $0.timestamp > oneHourAgo }

        // Update current posture
        currentPosture = reading.postureState

        // Calculate posture score
        updatePostureScore()

        // Check for alerts
        checkForPostureAlerts()
    }

    // MARK: - Posture Scoring

    private func updatePostureScore() {
        guard !postureReadings.isEmpty else { return }

        let recentReadings = postureReadings.suffix(10) // Last 10 readings (last 10 seconds)
        let totalScore = recentReadings.reduce(0.0) { sum, reading in
            return sum + getScoreForPosture(reading.postureState)
        }

        postureScore = totalScore / Double(recentReadings.count)
    }

    private func getScoreForPosture(_ state: PostureState) -> Double {
        switch state {
        case .excellent: return 100.0
        case .good: return 80.0
        case .fair: return 60.0
        case .poor: return 40.0
        case .critical: return 20.0
        case .unknown: return 50.0
        }
    }

    // MARK: - Alert System

    private func checkForPostureAlerts() {
        let poorPostureReadings = postureReadings.filter {
            $0.postureState == .poor || $0.postureState == .critical
        }

        // Check if we've had poor posture for extended period
        if poorPostureReadings.count >= 20 { // 20 seconds of poor posture
            let lastAlert = postureAlerts.last?.timestamp ?? Date.distantPast
            let timeSinceLastAlert = Date().timeIntervalSince(lastAlert)

            if timeSinceLastAlert > 300 { // Don't alert more than once per 5 minutes
                createPostureAlert()
            }
        }
    }

    private func createPostureAlert() {
        let alert = PostureAlert(
            id: UUID(),
            type: determineAlertType(),
            message: generateAlertMessage(),
            timestamp: Date(),
            severity: .moderate
        )

        DispatchQueue.main.async {
            self.postureAlerts.append(alert)
            self.sendPostureAlert(alert)
        }
    }

    private func determineAlertType() -> PostureAlertType {
        guard let lastReading = postureReadings.last else { return .general }

        if lastReading.neckAngle > 45 {
            return .forwardHead
        } else if abs(lastReading.deviceRoll) > 20 {
            return .shoulderTilt
        } else {
            return .general
        }
    }

    private func generateAlertMessage() -> String {
        let messages = [
            "Time for a posture check! Roll your shoulders back and lift your head.",
            "Notice your posture - straighten up and take a deep breath.",
            "Posture reminder: Align your head over your shoulders.",
            "Take a moment to improve your posture and prevent strain."
        ]

        return messages.randomElement() ?? "Check your posture"
    }

    // MARK: - Daily Quality Calculation

    func calculateDailyPostureQuality() {
        let today = Calendar.current.startOfDay(for: Date())
        let todayReadings = postureReadings.filter {
            Calendar.current.isDate($0.timestamp, inSameDayAs: today)
        }

        guard !todayReadings.isEmpty else { return }

        let excellentTime = Double(todayReadings.filter { $0.postureState == .excellent }.count)
        let goodTime = Double(todayReadings.filter { $0.postureState == .good }.count)
        let fairTime = Double(todayReadings.filter { $0.postureState == .fair }.count)
        let poorTime = Double(todayReadings.filter { $0.postureState == .poor }.count)
        let criticalTime = Double(todayReadings.filter { $0.postureState == .critical }.count)

        let totalTime = Double(todayReadings.count)

        let quality = PostureQualityMetrics(
            date: today,
            excellentPercentage: (excellentTime / totalTime) * 100,
            goodPercentage: (goodTime / totalTime) * 100,
            fairPercentage: (fairTime / totalTime) * 100,
            poorPercentage: (poorTime / totalTime) * 100,
            criticalPercentage: (criticalTime / totalTime) * 100,
            averageNeckAngle: todayReadings.reduce(0.0) { $0 + $1.neckAngle } / totalTime,
            totalAlerts: postureAlerts.filter {
                Calendar.current.isDate($0.timestamp, inSameDayAs: today)
            }.count
        )

        DispatchQueue.main.async {
            self.dailyPostureQuality = quality
        }
    }

    // MARK: - Scheduled Tasks

    private func schedulePostureChecks() {
        postureTimer = Timer.scheduledTimer(withTimeInterval: monitoringInterval, repeats: true) { [weak self] _ in
            self?.performScheduledPostureCheck()
        }
    }

    private func performScheduledPostureCheck() {
        calculateDailyPostureQuality()

        // Send data to backend if connected
        if webSocketManager.isConnected {
            sendPostureDataToBackend()
        }
    }

    // MARK: - Backend Communication

    private func sendPostureAlert(_ alert: PostureAlert) {
        let alertData: [String: Any] = [
            "type": "posture_alert",
            "alert_type": alert.type.rawValue,
            "message": alert.message,
            "severity": alert.severity.rawValue,
            "timestamp": ISO8601DateFormatter().string(from: alert.timestamp),
            "user_id": AppConfig.shared.userId
        ]

        webSocketManager.sendMessage(alertData)
    }

    private func sendPostureDataToBackend() {
        guard let quality = dailyPostureQuality else { return }

        let postureData: [String: Any] = [
            "type": "posture_data",
            "date": ISO8601DateFormatter().string(from: quality.date),
            "excellent_percentage": quality.excellentPercentage,
            "good_percentage": quality.goodPercentage,
            "fair_percentage": quality.fairPercentage,
            "poor_percentage": quality.poorPercentage,
            "critical_percentage": quality.criticalPercentage,
            "average_neck_angle": quality.averageNeckAngle,
            "total_alerts": quality.totalAlerts,
            "current_score": postureScore,
            "user_id": AppConfig.shared.userId
        ]

        webSocketManager.sendMessage(postureData)
    }
}

// MARK: - Supporting Models

struct PostureReading {
    let timestamp: Date
    let neckAngle: Double
    let devicePitch: Double
    let deviceRoll: Double
    let postureState: PostureState
}

struct PostureAlert {
    let id: UUID
    let type: PostureAlertType
    let message: String
    let timestamp: Date
    let severity: AlertSeverity
}

struct PostureQualityMetrics {
    let date: Date
    let excellentPercentage: Double
    let goodPercentage: Double
    let fairPercentage: Double
    let poorPercentage: Double
    let criticalPercentage: Double
    let averageNeckAngle: Double
    let totalAlerts: Int

    var overallQuality: PostureQuality {
        if excellentPercentage + goodPercentage >= 80 {
            return .excellent
        } else if excellentPercentage + goodPercentage >= 60 {
            return .good
        } else if excellentPercentage + goodPercentage + fairPercentage >= 70 {
            return .fair
        } else {
            return .poor
        }
    }
}

enum PostureState: String, CaseIterable, Codable {
    case excellent = "excellent"
    case good = "good"
    case fair = "fair"
    case poor = "poor"
    case critical = "critical"
    case unknown = "unknown"

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .yellow
        case .poor: return .orange
        case .critical: return .red
        case .unknown: return .gray
        }
    }

    var description: String {
        switch self {
        case .excellent: return "Perfect posture alignment"
        case .good: return "Good posture with minor adjustments needed"
        case .fair: return "Acceptable posture, room for improvement"
        case .poor: return "Poor posture detected, needs correction"
        case .critical: return "Critical posture issues, immediate attention needed"
        case .unknown: return "Posture state unknown"
        }
    }
}

enum PostureAlertType: String, CaseIterable {
    case forwardHead = "forward_head"
    case shoulderTilt = "shoulder_tilt"
    case general = "general"
}

enum PostureQuality: String, CaseIterable {
    case excellent = "excellent"
    case good = "good"
    case fair = "fair"
    case poor = "poor"
}

enum AlertSeverity: String, CaseIterable {
    case low = "low"
    case moderate = "moderate"
    case high = "high"
}
