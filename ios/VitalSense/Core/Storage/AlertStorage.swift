//
//  AlertStorage.swift
//  VitalSense
//
//  Alert storage and acknowledgment system
//  Created: 2025-11-01
//

import Foundation
import OSLog

/// Simple alert storage system for tracking alert acknowledgments
class AlertStorage: ObservableObject {
    static let shared = AlertStorage()

    private let logger = Logger(subsystem: "com.vitalsense.alerts", category: "AlertStorage")
    private let userDefaults = UserDefaults.standard
    private let acknowledgedAlertsKey = "vitalsense.acknowledged.alerts"

    @Published var acknowledgedAlerts: Set<String> = []

    private init() {
        loadAcknowledgedAlerts()
    }

    /// Mark an alert as acknowledged
    func acknowledgeAlert(_ alertId: String) {
        guard !alertId.isEmpty else { return }

        acknowledgedAlerts.insert(alertId)
        saveAcknowledgedAlerts()

        logger.info("Alert acknowledged: \(alertId)")
    }

    /// Check if an alert has been acknowledged
    func isAlertAcknowledged(_ alertId: String) -> Bool {
        return acknowledgedAlerts.contains(alertId)
    }

    /// Clear old acknowledgments (older than 7 days)
    func clearOldAcknowledgments() {
        let sevenDaysAgo = Date().addingTimeInterval(-7 * 24 * 60 * 60)
        let calendar = Calendar.current

        // Filter out old alerts (assuming alertId contains timestamp)
        acknowledgedAlerts = acknowledgedAlerts.filter { alertId in
            guard let timestamp = extractTimestamp(from: alertId) else { return true }
            return timestamp > sevenDaysAgo
        }

        saveAcknowledgedAlerts()
        logger.info("Cleared old alert acknowledgments")
    }

    private func loadAcknowledgedAlerts() {
        if let data = userDefaults.data(forKey: acknowledgedAlertsKey),
           let alerts = try? JSONDecoder().decode(Set<String>.self, from: data) {
            acknowledgedAlerts = alerts
        }
    }

    private func saveAcknowledgedAlerts() {
        if let data = try? JSONEncoder().encode(acknowledgedAlerts) {
            userDefaults.set(data, forKey: acknowledgedAlertsKey)
        }
    }

    private func extractTimestamp(from alertId: String) -> Date? {
        // Assuming alertId format includes timestamp: "alert-type-timestamp"
        let components = alertId.components(separatedBy: "-")
        guard let timestampString = components.last,
              let timestamp = Double(timestampString) else {
            return nil
        }
        return Date(timeIntervalSince1970: timestamp)
    }
}

// MARK: - Alert Message Types

enum AlertType: String, CaseIterable {
    case fallRisk = "fall_risk"
    case heartRateAnomaly = "heart_rate_anomaly"
    case activityDecline = "activity_decline"
    case sleepDisruption = "sleep_disruption"
    case emergency = "emergency"

    var displayName: String {
        switch self {
        case .fallRisk: return "Fall Risk Alert"
        case .heartRateAnomaly: return "Heart Rate Alert"
        case .activityDecline: return "Activity Alert"
        case .sleepDisruption: return "Sleep Alert"
        case .emergency: return "Emergency Alert"
        }
    }
}

struct HealthAlert: Identifiable, Codable {
    let id: String
    let type: AlertType
    let title: String
    let message: String
    let severity: AlertSeverity
    let timestamp: Date
    let isAcknowledged: Bool

    enum AlertSeverity: String, Codable, CaseIterable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        case critical = "critical"

        var color: String {
            switch self {
            case .low: return "green"
            case .medium: return "yellow"
            case .high: return "orange"
            case .critical: return "red"
            }
        }
    }
}
