import Foundation
import WatchConnectivity
import Combine

@MainActor
class SmartNotificationManager: ObservableObject {
    static let shared = SmartNotificationManager()
    
    @Published var notifications: [NotificationItem] = []
    @Published var unreadCount: Int = 0
    
    private init() {
        loadNotifications()
    }
    
    func addNotification(_ notification: NotificationItem) {
        notifications.insert(notification, at: 0)
        if !notification.isRead {
            unreadCount += 1
        }
        saveNotifications()
    }
    
    func markAsRead(id: UUID) {
        if let index = notifications.firstIndex(where: { $0.id == id }) {
            var notification = notifications[index]
            if !notification.isRead {
                notifications[index] = NotificationItem(
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    timestamp: notification.timestamp,
                    priority: notification.priority,
                    isRead: true
                )
                unreadCount = max(0, unreadCount - 1)
                saveNotifications()
            }
        }
    }
    
    func deleteNotifications(ids: [UUID]) {
        let deleted = notifications.filter { ids.contains($0.id) }
        notifications.removeAll { ids.contains($0.id) }
        unreadCount = max(0, unreadCount - deleted.filter { !$0.isRead }.count)
        saveNotifications()
    }
    
    func clearAll() {
        notifications.removeAll()
        unreadCount = 0
        saveNotifications()
    }
    
    private func loadNotifications() {
        if let data = UserDefaults.standard.data(forKey: "notifications"),
           let decoded = try? JSONDecoder().decode([NotificationItem].self, from: data) {
            notifications = decoded
            unreadCount = notifications.filter { !$0.isRead }.count
        }
    }
    
    private func saveNotifications() {
        if let encoded = try? JSONEncoder().encode(notifications) {
            UserDefaults.standard.set(encoded, forKey: "notifications")
        }
    }
}

// NOTE: A duplicate `WatchLiDARIntegrationManager` class previously lived in this file.
// The canonical implementation now resides in `Core/Managers/WatchLiDARIntegrationManager.swift`.
// All code should use `WatchLiDARIntegrationManager.shared` from that file; do not
// redeclare the class here.
