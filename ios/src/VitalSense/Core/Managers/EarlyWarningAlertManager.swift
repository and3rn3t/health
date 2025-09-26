import Foundation
import UserNotifications

/// Manages early warning alerts for gait anomalies and fall risk indicators.
/// Provides configurable thresholds and notification management.
final class EarlyWarningAlertManager {
    
    // MARK: - Alert Types
    enum AlertType: String, CaseIterable {
        case highFallRisk = "high_fall_risk"
        case gaitAnomalies = "gait_anomalies"
        case lowStability = "low_stability"
        case nearTripEvents = "near_trip_events"
        
        var title: String {
            switch self {
            case .highFallRisk: return "High Fall Risk Detected"
            case .gaitAnomalies: return "Gait Anomalies Detected"
            case .lowStability: return "Low Stability Warning"
            case .nearTripEvents: return "Trip Risk Alert"
            }
        }
        
        var body: String {
            switch self {
            case .highFallRisk: return "Your walking pattern shows increased fall risk. Consider reviewing your mobility with a healthcare provider."
            case .gaitAnomalies: return "Unusual walking patterns detected. Monitor your gait and consider medical consultation if persistent."
            case .lowStability: return "Your walking stability has decreased. Take extra care when moving around."
            case .nearTripEvents: return "Multiple near-trip events detected. Please be cautious and consider environmental hazards."
            }
        }
    }
    
    // MARK: - Configuration
    struct AlertThresholds {
        var fallRiskScore: Double = 70.0
        var stabilityIndex: Double = 60.0
        var nearTripCount: Int = 3
        var gaitVariabilityThreshold: Double = 0.15
    }
    
    // MARK: - Properties
    static let shared = EarlyWarningAlertManager()
    private var thresholds = AlertThresholds()
    private var lastAlertTimes: [AlertType: Date] = [:]
    private let alertCooldownInterval: TimeInterval = 3600 // 1 hour
    
    private init() {
        requestNotificationPermissions()
    }
    
    // MARK: - Public Methods
    func updateThresholds(_ newThresholds: AlertThresholds) {
        thresholds = newThresholds
    }
    
    func evaluateAlerts(metrics: GaitMetrics?, riskScore: Double?, stabilityIndex: Double?) {
        guard let metrics = metrics else { return }
        
        // Check fall risk
        if let risk = riskScore, risk >= thresholds.fallRiskScore {
            triggerAlert(.highFallRisk)
        }
        
        // Check stability
        if let stability = stabilityIndex, stability <= thresholds.stabilityIndex {
            triggerAlert(.lowStability)
        }
        
        // Check near-trip events
        if let tripCount = metrics.nearTripEvents, tripCount >= thresholds.nearTripCount {
            triggerAlert(.nearTripEvents)
        }
        
        // Check gait variability
        let hasHighVariability = (metrics.walkingSpeedVariability ?? 0) > thresholds.gaitVariabilityThreshold ||
                                (metrics.stepLengthVariability ?? 0) > thresholds.gaitVariabilityThreshold ||
                                (metrics.strideTimeVariability ?? 0) > thresholds.gaitVariabilityThreshold
        
        if hasHighVariability {
            triggerAlert(.gaitAnomalies)
        }
    }
    
    // MARK: - Private Methods
    private func triggerAlert(_ type: AlertType) {
        // Check cooldown
        if let lastAlert = lastAlertTimes[type],
           Date().timeIntervalSince(lastAlert) < alertCooldownInterval {
            return
        }
        
        // Send notification
        sendNotification(for: type)
        lastAlertTimes[type] = Date()
    }
    
    private func sendNotification(for alertType: AlertType) {
        let content = UNMutableNotificationContent()
        content.title = alertType.title
        content.body = alertType.body
        content.sound = .default
        content.categoryIdentifier = "GAIT_ALERT"
        
        let request = UNNotificationRequest(
            identifier: "\(alertType.rawValue)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Failed to send notification: \(error)")
            }
        }
    }
    
    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification permission error: \(error)")
            }
        }
    }
}
