//
//  EmergencyResponseSystem.swift
//  VitalSense
//
//  Emergency response and safety system for gait analysis and fall prevention
//  Created: 2025-11-01
//

import SwiftUI
import CoreLocation
import UserNotifications
import MessageUI
import AVFoundation

// MARK: - Emergency Response System

@MainActor
class EmergencyResponseSystem: NSObject, ObservableObject {
    static let shared = EmergencyResponseSystem()

    // MARK: - Published Properties
    @Published var isEmergencyActive = false
    @Published var emergencyContacts: [EmergencyContact] = []
    @Published var activeAlerts: [EmergencyAlert] = []
    @Published var responseHistory: [EmergencyResponse] = []
    @Published var sosCountdown: Int = 0

    // MARK: - Private Properties
    private let locationManager = CLLocationManager()
    private let notificationCenter = UNUserNotificationCenter.current()
    private var countdownTimer: Timer?
    private var audioPlayer: AVAudioPlayer?
    private let hapticFeedback = UIImpactFeedbackGenerator(style: .heavy)

    // Configuration
    private let sosCountdownDuration = 10 // seconds
    private let emergencyPhoneNumber = "911" // Configurable

    private override init() {
        super.init()
        setupLocationManager()
        loadEmergencyContacts()
    }

    // MARK: - Public Methods

    func setupEmergencySystem() async {
        await requestPermissions()
        setupNotifications()
    }

    func addEmergencyContact(_ contact: EmergencyContact) {
        emergencyContacts.append(contact)
        saveEmergencyContacts()
    }

    func removeEmergencyContact(_ contact: EmergencyContact) {
        emergencyContacts.removeAll { $0.id == contact.id }
        saveEmergencyContacts()
    }

    func triggerEmergencyResponse(alert: EmergencyAlert) async {
        isEmergencyActive = true
        activeAlerts.append(alert)

        // Start SOS countdown
        startSOSCountdown()

        // Immediate haptic feedback
        hapticFeedback.impactOccurred()

        // Play emergency sound
        playEmergencySound()

        // Send immediate notification to emergency contacts
        await sendEmergencyNotifications(alert: alert)

        // Log emergency event
        logEmergencyEvent(alert: alert)

        print("🚨 Emergency response triggered: \(alert.type)")
    }

    func cancelEmergencyResponse() {
        isEmergencyActive = false
        stopSOSCountdown()
        stopEmergencySound()
        activeAlerts.removeAll()

        // Send cancellation notifications
        Task {
            await sendCancellationNotifications()
        }

        print("❌ Emergency response cancelled")
    }

    func initiateSOSCall() {
        guard let phoneURL = URL(string: "tel://\(emergencyPhoneNumber)") else { return }

        if UIApplication.shared.canOpenURL(phoneURL) {
            UIApplication.shared.open(phoneURL)

            // Log SOS call
            let response = EmergencyResponse(
                id: UUID(),
                timestamp: Date(),
                type: .sosCallInitiated,
                location: getCurrentLocation(),
                responseTime: sosCountdownDuration,
                contacts: emergencyContacts.map { $0.id }
            )
            responseHistory.append(response)
        }
    }

    // MARK: - Private Methods

    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    private func requestPermissions() async {
        // Request location permission
        locationManager.requestWhenInUseAuthorization()

        // Request notification permission
        do {
            try await notificationCenter.requestAuthorization(options: [.alert, .sound, .badge])
            print("✅ Notification permissions granted")
        } catch {
            print("❌ Failed to request notification permissions: \(error)")
        }
    }

    private func setupNotifications() {
        // Configure notification categories
        let emergencyAction = UNNotificationAction(
            identifier: "EMERGENCY_ACTION",
            title: "Call Emergency Services",
            options: [.destructive]
        )

        let cancelAction = UNNotificationAction(
            identifier: "CANCEL_ACTION",
            title: "Cancel Alert",
            options: [.foreground]
        )

        let emergencyCategory = UNNotificationCategory(
            identifier: "EMERGENCY_ALERT",
            actions: [emergencyAction, cancelAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )

        notificationCenter.setNotificationCategories([emergencyCategory])
    }

    private func startSOSCountdown() {
        sosCountdown = sosCountdownDuration

        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }

            Task { @MainActor in
                self.sosCountdown -= 1

                if self.sosCountdown <= 0 {
                    self.stopSOSCountdown()
                    self.initiateSOSCall()
                }
            }
        }
    }

    private func stopSOSCountdown() {
        countdownTimer?.invalidate()
        countdownTimer = nil
        sosCountdown = 0
    }

    private func playEmergencySound() {
        guard let soundURL = Bundle.main.url(forResource: "emergency_alert", withExtension: "mp3") else {
            // Use system sound as fallback
            AudioServicesPlaySystemSound(1315) // Emergency alert sound
            return
        }

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
            audioPlayer?.numberOfLoops = -1 // Repeat indefinitely
            audioPlayer?.play()
        } catch {
            print("❌ Failed to play emergency sound: \(error)")
            AudioServicesPlaySystemSound(1315)
        }
    }

    private func stopEmergencySound() {
        audioPlayer?.stop()
        audioPlayer = nil
    }

    private func sendEmergencyNotifications(alert: EmergencyAlert) async {
        let location = getCurrentLocation()

        for contact in emergencyContacts {
            switch contact.preferredMethod {
            case .sms:
                await sendEmergencySMS(to: contact, alert: alert, location: location)
            case .call:
                initiateEmergencyCall(to: contact)
            case .notification:
                await sendLocalNotification(for: contact, alert: alert)
            case .email:
                await sendEmergencyEmail(to: contact, alert: alert, location: location)
            }
        }
    }

    private func sendEmergencySMS(to contact: EmergencyContact, alert: EmergencyAlert, location: String?) async {
        guard MFMessageComposeViewController.canSendText() else { return }

        let message = buildEmergencyMessage(alert: alert, location: location)

        // Note: In a real app, you'd present the MFMessageComposeViewController
        // For this implementation, we'll simulate the SMS sending
        print("📱 Sending emergency SMS to \(contact.name): \(message)")

        // Log the notification
        let response = EmergencyResponse(
            id: UUID(),
            timestamp: Date(),
            type: .smsNotificationSent,
            location: location,
            responseTime: 0,
            contacts: [contact.id]
        )
        responseHistory.append(response)
    }

    private func initiateEmergencyCall(to contact: EmergencyContact) {
        guard let phoneURL = URL(string: "tel://\(contact.phoneNumber)") else { return }

        if UIApplication.shared.canOpenURL(phoneURL) {
            UIApplication.shared.open(phoneURL)

            let response = EmergencyResponse(
                id: UUID(),
                timestamp: Date(),
                type: .callInitiated,
                location: getCurrentLocation(),
                responseTime: 0,
                contacts: [contact.id]
            )
            responseHistory.append(response)
        }
    }

    private func sendLocalNotification(for contact: EmergencyContact, alert: EmergencyAlert) async {
        let content = UNMutableNotificationContent()
        content.title = "VitalSense Emergency Alert"
        content.body = buildEmergencyMessage(alert: alert, location: getCurrentLocation())
        content.sound = .critical
        content.categoryIdentifier = "EMERGENCY_ALERT"

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "emergency-\(alert.id)",
            content: content,
            trigger: trigger
        )

        do {
            try await notificationCenter.add(request)
            print("📢 Emergency notification sent for \(contact.name)")
        } catch {
            print("❌ Failed to send notification: \(error)")
        }
    }

    private func sendEmergencyEmail(to contact: EmergencyContact, alert: EmergencyAlert, location: String?) async {
        // Note: In a real app, you'd present the MFMailComposeViewController
        // For this implementation, we'll simulate the email sending
        let subject = "VitalSense Emergency Alert - \(alert.type)"
        let body = buildDetailedEmergencyMessage(alert: alert, location: location)

        print("📧 Sending emergency email to \(contact.name): \(subject)")

        let response = EmergencyResponse(
            id: UUID(),
            timestamp: Date(),
            type: .emailNotificationSent,
            location: location,
            responseTime: 0,
            contacts: [contact.id]
        )
        responseHistory.append(response)
    }

    private func sendCancellationNotifications() async {
        for contact in emergencyContacts {
            let content = UNMutableNotificationContent()
            content.title = "VitalSense Alert Cancelled"
            content.body = "The emergency alert has been cancelled. The user is safe."
            content.sound = .default

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
            let request = UNNotificationRequest(
                identifier: "cancel-\(UUID())",
                content: content,
                trigger: trigger
            )

            try? await notificationCenter.add(request)
        }
    }

    private func buildEmergencyMessage(alert: EmergencyAlert, location: String?) -> String {
        var message = "🚨 EMERGENCY ALERT from VitalSense\n\n"
        message += "Alert Type: \(alert.type)\n"
        message += "Time: \(alert.timestamp.formatted())\n"
        message += "Message: \(alert.message)\n"

        if let location = location {
            message += "Location: \(location)\n"
        }

        message += "\nThis is an automated message from the VitalSense health monitoring system."

        return message
    }

    private func buildDetailedEmergencyMessage(alert: EmergencyAlert, location: String?) -> String {
        var message = buildEmergencyMessage(alert: alert, location: location)
        message += "\n\nAdditional Information:\n"
        message += "- Severity: \(alert.severity)\n"
        message += "- Alert ID: \(alert.id)\n"

        if let fallRisk = alert.fallRisk {
            message += "- Fall Risk Score: \(Int(fallRisk * 100))%\n"
        }

        message += "\nPlease check on the user or contact emergency services if needed."

        return message
    }

    private func getCurrentLocation() -> String? {
        guard let location = locationManager.location else { return nil }

        // Convert coordinates to address (simplified)
        let latitude = location.coordinate.latitude
        let longitude = location.coordinate.longitude

        return "Lat: \(String(format: "%.6f", latitude)), Lon: \(String(format: "%.6f", longitude))"
    }

    private func logEmergencyEvent(alert: EmergencyAlert) {
        let response = EmergencyResponse(
            id: UUID(),
            timestamp: Date(),
            type: .emergencyTriggered,
            location: getCurrentLocation(),
            responseTime: 0,
            contacts: emergencyContacts.map { $0.id }
        )
        responseHistory.append(response)

        // In a real app, you might also log to analytics or health records
        print("📝 Emergency event logged: \(alert.id)")
    }

    private func loadEmergencyContacts() {
        // Load from UserDefaults or Core Data
        if let data = UserDefaults.standard.data(forKey: "EmergencyContacts"),
           let contacts = try? JSONDecoder().decode([EmergencyContact].self, from: data) {
            emergencyContacts = contacts
        }
    }

    private func saveEmergencyContacts() {
        if let data = try? JSONEncoder().encode(emergencyContacts) {
            UserDefaults.standard.set(data, forKey: "EmergencyContacts")
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension EmergencyResponseSystem: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // Handle location updates if needed
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error)")
    }
}

// MARK: - Supporting Data Models

struct EmergencyContact: Codable, Identifiable {
    let id = UUID()
    let name: String
    let phoneNumber: String
    let email: String?
    let relationship: String
    let preferredMethod: ContactMethod
    let isPrimary: Bool

    enum ContactMethod: String, Codable, CaseIterable {
        case sms = "SMS"
        case call = "Call"
        case notification = "Notification"
        case email = "Email"
    }
}

struct EmergencyResponse: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ResponseType
    let location: String?
    let responseTime: Int // seconds
    let contacts: [UUID]

    enum ResponseType {
        case emergencyTriggered
        case sosCallInitiated
        case callInitiated
        case smsNotificationSent
        case emailNotificationSent
        case emergencyCancelled
    }
}

// MARK: - Extensions

extension EmergencyAlert.EmergencyType {
    var displayName: String {
        switch self {
        case .fallRiskDetected:
            return "Fall Risk Detected"
        case .fallDetected:
            return "Fall Detected"
        case .medicalEmergency:
            return "Medical Emergency"
        }
    }

    var icon: String {
        switch self {
        case .fallRiskDetected:
            return "exclamationmark.triangle.fill"
        case .fallDetected:
            return "figure.fall"
        case .medicalEmergency:
            return "cross.circle.fill"
        }
    }
}

extension EmergencyAlert.EmergencySeverity {
    var color: Color {
        switch self {
        case .low:
            return .yellow
        case .medium:
            return .orange
        case .high:
            return .red
        case .critical:
            return .purple
        }
    }
}
