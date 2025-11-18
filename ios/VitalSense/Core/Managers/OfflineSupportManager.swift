//
//  OfflineSupportManager.swift
//  VitalSense
//
//  Enhanced offline support with better queue management and sync status
//

import Foundation
import Network
import Combine

// MARK: - Offline Support Manager

@MainActor
class OfflineSupportManager: ObservableObject {
    static let shared = OfflineSupportManager()

    @Published var isOnline: Bool = true
    @Published var connectionType: ConnectionType = .unknown
    @Published var syncStatus: SyncStatus = .idle
    @Published var queuedItems: Int = 0
    @Published var lastSyncTime: Date?

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "dev.andernet.vitalsense.offline")
    private var cancellables = Set<AnyCancellable>()

    enum ConnectionType: String {
        case wifi = "WiFi"
        case cellular = "Cellular"
        case ethernet = "Ethernet"
        case other = "Other"
        case unknown = "Unknown"

        var icon: String {
            switch self {
            case .wifi: return "wifi"
            case .cellular: return "antenna.radiowaves.left.and.right"
            case .ethernet: return "cable.connector"
            default: return "questionmark.circle"
            }
        }
    }

    enum SyncStatus: String {
        case idle = "Idle"
        case syncing = "Syncing"
        case error = "Error"
        case paused = "Paused"
    }

    private init() {
        startMonitoring()
    }

    deinit {
        monitor.cancel()
    }

    // MARK: - Network Monitoring

    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                guard let self = self else { return }

                let wasOnline = self.isOnline
                self.isOnline = path.status == .satisfied
                self.connectionType = self.determineConnectionType(path)

                // If connection restored, trigger sync
                if !wasOnline && self.isOnline {
                    await self.triggerSync()
                }

                // Update UI based on connection status
                NotificationCenter.default.post(
                    name: .networkStatusChanged,
                    object: nil,
                    userInfo: ["isOnline": self.isOnline]
                )
            }
        }

        monitor.start(queue: queue)
    }

    private func determineConnectionType(_ path: NWPath) -> ConnectionType {
        if path.usesInterfaceType(.wifi) {
            return .wifi
        } else if path.usesInterfaceType(.cellular) {
            return .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            return .ethernet
        } else if path.usesInterfaceType(.other) {
            return .other
        }
        return .unknown
    }

    // MARK: - Sync Management

    func triggerSync() async {
        guard isOnline else {
            syncStatus = .paused
            return
        }

        syncStatus = .syncing

        do {
            // Sync queued data
            let offlineManager = OfflineDataSyncManager.shared
            if offlineManager.queuedDataCount > 0 {
                await offlineManager.syncQueuedData(webSocketManager: WebSocketManager.shared)
            }

            // Update sync time
            lastSyncTime = Date()
            syncStatus = .idle
            queuedItems = offlineManager.queuedDataCount

        } catch {
            syncStatus = .error
            ErrorHandler.shared.handle(
                error,
                context: "Offline sync failed",
                recovery: .retry(maxAttempts: 3)
            )
        }
    }

    func pauseSync() {
        syncStatus = .paused
    }

    func resumeSync() {
        if isOnline {
            syncStatus = .idle
            Task {
                await triggerSync()
            }
        }
    }

    // MARK: - Queue Status

    func updateQueueStatus() {
        let offlineManager = OfflineDataSyncManager.shared
        queuedItems = offlineManager.queuedDataCount
    }
}

// MARK: - Notification Extension

extension Notification.Name {
    static let networkStatusChanged = Notification.Name("networkStatusChanged")
}
