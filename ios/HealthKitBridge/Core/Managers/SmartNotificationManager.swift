import Foundation
import UserNotifications
import UIKit

// MARK: - Smart Notification Manager
// Provides intelligent health alerts and reminders

class SmartNotificationManager: NSObject, ObservableObject {
    static let shared = SmartNotificationManager()
    
    @Published var notificationsEnabled = false
    @Published var lastNotificationTime: Date?
    
    private let minimumNotificationInterval: TimeInterval = 3600 // 1 hour
    private var pendingNotifications: Set<String> = []
    
    override init() {
        super.init()
        requestPermission()
    }
    
    private func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            DispatchQueue.main.async {
                self.notificationsEnabled = granted
                if let error = error {
                    print("❌ Notification permission error: \(error)")
                }
            }
        }
    }
    
    func scheduleHealthReminder() {
        guard notificationsEnabled else { return }
        guard shouldSendNotification(for: "health_reminder") else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "HealthKit Bridge"
        content.body = "Remember to check your health metrics today!"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
        let request = UNNotificationRequest(identifier: "health_reminder", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to schedule reminder: \(error)")
            } else {
                self.markNotificationSent("health_reminder")
            }
        }
    }
    
    func sendAnomalyAlert(anomaly: HealthAnalyticsEngine.HealthAnomaly) {
        guard notificationsEnabled else { return }
        guard anomaly.severity == .high else { return }
        guard shouldSendNotification(for: "anomaly_\(anomaly.type)") else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Health Alert"
        content.body = "\(anomaly.type) reading of \(Int(anomaly.value)) is outside normal range"
        content.sound = .default
        content.categoryIdentifier = "HEALTH_ALERT"
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "anomaly_\(anomaly.type)_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send anomaly alert: \(error)")
            } else {
                self.markNotificationSent("anomaly_\(anomaly.type)")
            }
        }
    }
    
    func sendConnectionAlert(message: String) {
        guard notificationsEnabled else { return }
        guard shouldSendNotification(for: "connection_issue") else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Connection Issue"
        content.body = message
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "connection_issue", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send connection alert: \(error)")
            } else {
                self.markNotificationSent("connection_issue")
            }
        }
    }
    
    func sendDailySummary(summary: HealthAnalyticsEngine.DailySummary) {
        guard notificationsEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Daily Health Summary"
        content.body = """
        Steps: \(summary.totalSteps) | Heart Rate: \(Int(summary.avgHeartRate)) BPM
        Health Score: \(Int(summary.healthScore))/100
        """
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "daily_summary", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send daily summary: \(error)")
            }
        }
    }
    
    private func shouldSendNotification(for type: String) -> Bool {
        guard let lastTime = lastNotificationTime else { return true }
        return Date().timeIntervalSince(lastTime) > minimumNotificationInterval
    }
    
    private func markNotificationSent(_ type: String) {
        DispatchQueue.main.async {
            self.lastNotificationTime = Date()
            self.pendingNotifications.insert(type)
        }
    }
    
    func clearPendingNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        pendingNotifications.removeAll()
    }
}