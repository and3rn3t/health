import Foundation
import UserNotifications
import Combine

// MARK: - Smart Notification Manager
class SmartNotificationManager: NSObject, ObservableObject {
    static let shared = SmartNotificationManager()
    
    @Published var isEnabled: Bool = true
    @Published var notificationCount: Int = 0
    @Published var lastNotificationSent: Date?
    
    private let notificationCenter = UNUserNotificationCenter.current()
    private var cancellables = Set<AnyCancellable>()
    
    private override init() {
        super.init()
        requestNotificationPermissions()
        setupNotificationHandling()
    }
    
    private func requestNotificationPermissions() {
        notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                self.isEnabled = granted
            }
            if let error = error {
                print("Notification permission error: \(error)")
            }
        }
    }
    
    private func setupNotificationHandling() {
        // Setup notification delegate and handlers
        notificationCenter.delegate = self
    }
    
    func sendFallRiskAlert(riskLevel: String, recommendations: [String]) {
        guard isEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Fall Risk Assessment"
        content.body = "Risk level: \(riskLevel). \(recommendations.first ?? "Review your gait metrics.")"
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: "fall-risk-\(UUID().uuidString)",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        notificationCenter.add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            } else {
                DispatchQueue.main.async {
                    self.notificationCount += 1
                    self.lastNotificationSent = Date()
                }
            }
        }
    }
    
    func sendGaitQualityAlert(qualityScore: Int, recommendations: [String]) {
        guard isEnabled else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Gait Quality Update"
        content.body = "Quality score: \(qualityScore). \(recommendations.first ?? "Keep up the good work!")"
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: "gait-quality-\(UUID().uuidString)",
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        )
        
        notificationCenter.add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            } else {
                DispatchQueue.main.async {
                    self.notificationCount += 1
                    self.lastNotificationSent = Date()
                }
            }
        }
    }
    
    func clearAllNotifications() {
        notificationCenter.removeAllPendingNotificationRequests()
        notificationCenter.removeAllDeliveredNotifications()
    }
}

// MARK: - Notification Delegate
extension SmartNotificationManager: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.alert, .sound])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        // Handle notification tap
        completionHandler()
    }
}
