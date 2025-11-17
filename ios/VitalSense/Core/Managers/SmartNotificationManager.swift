import Foundation
import UserNotifications
import UIKit
import HealthKit
import SwiftUI

// MARK: - Smart Notification Manager
// Enhanced intelligent health alerts and reminders system
// Provides context-aware notifications with privacy protection

@MainActor
class SmartNotificationManager: NSObject, ObservableObject {
    static let shared = SmartNotificationManager()

    // MARK: - Published Properties
    @Published var notificationsEnabled = false
    @Published var healthAlertsEnabled = true
    @Published var reminderNotificationsEnabled = true
    @Published var criticalAlertsEnabled = true
    @Published var lastNotificationTime: Date?
    @Published var notificationHistory: [NotificationItem] = []

    // MARK: - Configuration
    struct NotificationConfig {
        var quietHoursStart = Calendar.current.date(from: DateComponents(hour: 22))!
        var quietHoursEnd = Calendar.current.date(from: DateComponents(hour: 7))!
        var maxNotificationsPerDay = 10
        var fallRiskThreshold: Double = 0.7
        var heartRateVariabilityThreshold: Double = 30.0
        var minimumNotificationInterval: TimeInterval = 3600 // 1 hour
    }

    @Published var config = NotificationConfig()

    private var pendingNotifications: Set<String> = []
    private var dailyNotificationCount = 0
    private var lastNotificationDate: Date?
    private let center = UNUserNotificationCenter.current()

    override init() {
        super.init()
        center.delegate = self
        loadConfiguration()
        Task {
            await setupNotificationCategories()
        }
    }

    // MARK: - Permission Management
    func requestPermissions() async throws {
        let options: UNAuthorizationOptions = [
            .alert,
            .badge,
            .sound,
            .criticalAlert,
            .provisional
        ]

        let granted = try await center.requestAuthorization(options: options)

        await MainActor.run {
            notificationsEnabled = granted
        }

        if granted {
            print("✅ Notification permissions granted")
            await setupNotificationCategories()
        } else {
            print("❌ Notification permissions denied")
            throw NotificationError.permissionDenied
        }
    }

    func setupHealthAlerts() async {
        guard notificationsEnabled else { return }

        // Schedule periodic health check notifications
        await schedulePeriodicHealthChecks()

        print("✅ Health alerts configured")
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
            identifier: "anomaly_\(anomaly.type)_\(Date().timeIntervalSince1970)", content: content, trigger: trigger
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

    // MARK: - Health Alert Processing
    func processHealthAlerts(_ metrics: HealthMetrics) async {
        guard healthAlertsEnabled else { return }

        // Check fall risk threshold
        if metrics.fallRisk > config.fallRiskThreshold {
            await sendFallRiskAlert(risk: metrics.fallRisk)
        }

        // Check heart rate variability
        if let hrv = metrics.heartRateVariability,
           hrv > config.heartRateVariabilityThreshold {
            await sendHeartRateAlert(hrv: hrv)
        }

        // Check walking steadiness
        if let walkingSteadiness = metrics.walkingSteadiness,
           walkingSteadiness < 50.0 {
            await sendWalkingSteadinessAlert(steadiness: walkingSteadiness)
        }
    }

    private func sendFallRiskAlert(risk: Double) async {
        guard await shouldSendNotificationAsync() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Fall Risk Alert"
        content.body = String(format: "Your fall risk score is elevated (%.1f%%). Consider reviewing your balance exercises.", risk * 100)
        content.sound = .critical
        content.categoryIdentifier = "fall_risk"

        if risk > 0.8 {
            content.interruptionLevel = .critical
        }

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "fall_risk_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )

        do {
            try await center.add(request)
            await incrementNotificationCount()
            print("📱 Fall risk alert sent (risk: \(risk))")
        } catch {
            print("❌ Failed to send fall risk alert: \(error)")
        }
    }

    private func sendHeartRateAlert(hrv: Double) async {
        guard await shouldSendNotificationAsync() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Heart Rate Alert"
        content.body = String(format: "Unusual heart rate variability detected (%.1f ms). Consider checking with your healthcare provider.", hrv)
        content.sound = .default
        content.categoryIdentifier = "health_alert"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "hrv_alert_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )

        do {
            try await center.add(request)
            await incrementNotificationCount()
            print("📱 Heart rate variability alert sent (HRV: \(hrv))")
        } catch {
            print("❌ Failed to send HRV alert: \(error)")
        }
    }

    private func sendWalkingSteadinessAlert(steadiness: Double) async {
        guard await shouldSendNotificationAsync() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Walking Steadiness Notice"
        content.body = String(format: "Your walking steadiness is below average (%.1f%%). Regular balance exercises may help.", steadiness)
        content.sound = .default
        content.categoryIdentifier = "health_alert"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "steadiness_alert_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )

        do {
            try await center.add(request)
            await incrementNotificationCount()
            print("📱 Walking steadiness alert sent (steadiness: \(steadiness))")
        } catch {
            print("❌ Failed to send walking steadiness alert: \(error)")
        }
    }

    // MARK: - Configuration Management
    private func loadConfiguration() {
        healthAlertsEnabled = UserDefaults.standard.object(forKey: "healthAlertsEnabled") as? Bool ?? true
        reminderNotificationsEnabled = UserDefaults.standard.object(forKey: "reminderNotificationsEnabled") as? Bool ?? true
        criticalAlertsEnabled = UserDefaults.standard.object(forKey: "criticalAlertsEnabled") as? Bool ?? true
    }

    private func shouldSendNotification(for type: String) -> Bool {
        guard let lastTime = lastNotificationTime else { return true }
        return Date().timeIntervalSince(lastTime) > config.minimumNotificationInterval
    }

    private func shouldSendNotificationAsync() async -> Bool {
        // Check daily limit
        await resetDailyCountIfNeeded()
        if dailyNotificationCount >= config.maxNotificationsPerDay {
            return false
        }

        // Check if we're in quiet hours
        if await isInQuietHours() {
            return false
        }

        return true
    }

    private func isInQuietHours() async -> Bool {
        let now = Date()
        let calendar = Calendar.current

        let currentTime = calendar.dateComponents([.hour, .minute], from: now)
        let startTime = calendar.dateComponents([.hour, .minute], from: config.quietHoursStart)
        let endTime = calendar.dateComponents([.hour, .minute], from: config.quietHoursEnd)

        let current = currentTime.hour! * 60 + currentTime.minute!
        let start = startTime.hour! * 60 + startTime.minute!
        let end = endTime.hour! * 60 + endTime.minute!

        // Handle overnight quiet hours (e.g., 10 PM to 7 AM)
        if start > end {
            return current >= start || current <= end
        } else {
            return current >= start && current <= end
        }
    }

    private func resetDailyCountIfNeeded() async {
        let today = Calendar.current.startOfDay(for: Date())
        let lastNotificationDay = Calendar.current.startOfDay(for: lastNotificationDate ?? Date.distantPast)

        if today != lastNotificationDay {
            dailyNotificationCount = 0
        }
    }

    private func incrementNotificationCount() async {
        dailyNotificationCount += 1
        lastNotificationDate = Date()
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

    // MARK: - Notification History Management

    func loadNotificationHistory() {
        if let data = UserDefaults.standard.data(forKey: "NotificationHistory"),
           let history = try? JSONDecoder().decode([NotificationItem].self, from: data) {
            notificationHistory = history
        }
    }

    func markAsRead(_ id: UUID) {
        if let index = notificationHistory.firstIndex(where: { $0.id == id }) {
            notificationHistory[index].isRead = true
            saveNotificationHistory()
        }
    }

    func markAllAsRead() {
        for index in notificationHistory.indices {
            notificationHistory[index].isRead = true
        }
        saveNotificationHistory()
    }

    func deleteNotifications(ids: [UUID]) {
        notificationHistory.removeAll { ids.contains($0.id) }
        saveNotificationHistory()
    }

    func clearAllNotifications() {
        notificationHistory.removeAll()
        saveNotificationHistory()
    }

    func addNotification(_ notification: NotificationItem) {
        notificationHistory.insert(notification, at: 0)
        // Keep only last 500 notifications
        if notificationHistory.count > 500 {
            notificationHistory = Array(notificationHistory.prefix(500))
        }
        saveNotificationHistory()
    }

    private func saveNotificationHistory() {
        if let data = try? JSONEncoder().encode(notificationHistory) {
            UserDefaults.standard.set(data, forKey: "NotificationHistory")
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension SmartNotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        Task {
            await handleNotificationResponse(response)
            completionHandler()
        }
    }

    private func handleNotificationResponse(_ response: UNNotificationResponse) async {
        print("📱 Handled notification action: \(response.actionIdentifier)")
    }
}

// MARK: - Health Metrics Structure
struct HealthMetrics {
    let stepCount: Int?
    let heartRate: Double?
    let heartRateVariability: Double?
    let walkingSteadiness: Double?
    let fallRisk: Double
    let sleepQuality: Double?
    let timestamp: Date
}

// MARK: - Notification Item Model
struct NotificationItem: Identifiable, Codable, Equatable {
    let id = UUID()
    let title: String
    let message: String
    let type: NotificationType
    let timestamp: Date
    var isRead: Bool

    var iconName: String {
        switch type {
        case .alert:
            return "exclamationmark.triangle.fill"
        case .reminder:
            return "bell.fill"
        case .achievement:
            return "checkmark.circle.fill"
        case .info:
            return "info.circle.fill"
        }
    }

    enum NotificationType: String, Codable {
        case alert
        case reminder
        case achievement
        case info
    }
}

// MARK: - Notification Errors
enum NotificationError: LocalizedError {
    case permissionDenied
    case categorySetupFailed
    case invalidConfiguration

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Notification permissions were denied"
        case .categorySetupFailed:
            return "Failed to set up notification categories"
        case .invalidConfiguration:
            return "Invalid notification configuration"
        }
    }
}
