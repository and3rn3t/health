//
//  NotificationService.swift
//  Andernet Posture
//
//  Local notification manager for session reminders and clinical alerts.
//

import Foundation
import UserNotifications
import os

// MARK: - NotificationService Protocol

/// Manages local notifications for reminders and clinical alerts.
protocol NotificationService: Sendable {
    /// Request notification permission from the user. Returns `true` if granted.
    func requestPermission() async -> Bool

    /// Schedule a daily session reminder at the specified hour and minute.
    func scheduleSessionReminder(hour: Int, minute: Int)

    /// Cancel all pending reminder notifications.
    func cancelAllReminders()

    /// Send an immediate notification alerting the user to a declining metric.
    func sendDeclineAlert(metric: String, message: String)
}

// MARK: - DefaultNotificationService

/// Production implementation using `UNUserNotificationCenter`.
final class DefaultNotificationService: NotificationService {

    // Unique identifiers for each notification type
    private enum Identifiers {
        static let dailyReminder = "com.andernet.posture.dailyReminder"
        static let declineAlertPrefix = "com.andernet.posture.decline."
    }

    private var center: UNUserNotificationCenter {
        UNUserNotificationCenter.current()
    }

    // MARK: - Permission

    func requestPermission() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            AppLogger.notifications.info("Notification permission \(granted ? "granted" : "denied")")
            return granted
        } catch {
            AppLogger.notifications.error("Notification permission error: \(error.localizedDescription)")
            return false
        }
    }

    // MARK: - Daily Reminder

    func scheduleSessionReminder(hour: Int, minute: Int) {
        // Remove any existing daily reminder first
        center.removePendingNotificationRequests(withIdentifiers: [Identifiers.dailyReminder])

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Time for a Posture Check")
        content.body = String(localized: "Take a few minutes to capture a session and track your posture health.")
        content.sound = .default
        content.categoryIdentifier = "sessionReminder"

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let request = UNNotificationRequest(
            identifier: Identifiers.dailyReminder,
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error {
                AppLogger.notifications.error("Failed to schedule reminder: \(error.localizedDescription)")
            } else {
                AppLogger.notifications.info("Daily reminder scheduled for \(hour):\(String(format: "%02d", minute))")
            }
        }
    }

    // MARK: - Cancel Reminders

    func cancelAllReminders() {
        center.removePendingNotificationRequests(withIdentifiers: [Identifiers.dailyReminder])
        AppLogger.notifications.info("All reminders cancelled")
    }

    // MARK: - Decline Alert

    func sendDeclineAlert(metric: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = String(localized: "\(metric) Alert")
        content.body = message
        content.sound = .default
        content.categoryIdentifier = "declineAlert"

        // Fire after a short delay so it doesn't overlap with the session
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)

        let identifier = "\(Identifiers.declineAlertPrefix)\(metric.lowercased().replacingOccurrences(of: " ", with: "_"))"

        // Remove old alert for the same metric before scheduling a new one
        center.removePendingNotificationRequests(withIdentifiers: [identifier])

        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error {
                AppLogger.notifications.error("Failed to send decline alert: \(error.localizedDescription)")
            }
        }
    }
}
