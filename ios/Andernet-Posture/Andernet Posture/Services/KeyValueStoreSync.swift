//
//  KeyValueStoreSync.swift
//  Andernet Posture
//
//  Bridges NSUbiquitousKeyValueStore ↔ @AppStorage for lightweight
//  user preferences that should sync across devices (demographics).
//  Device-local prefs (haptics, overlay, sampling rate) stay in UserDefaults only.
//

import Foundation
import Combine
import os.log

private let logger = AppLogger.kvSync

/// Keys synced to iCloud Key-Value Store.
enum SyncedPreferenceKey: String, CaseIterable {
    case userAge    = "userAge"
    case userSex    = "userSex"
}

@MainActor
final class KeyValueStoreSync: ObservableObject {

    static let shared = KeyValueStoreSync()

    private let kvs = NSUbiquitousKeyValueStore.default
    private let defaults = UserDefaults.standard
    private var cancellables = Set<AnyCancellable>()
    
    /// Track last successful sync to detect stale operations.
    private var lastSuccessfulSync: Date?
    
    /// Whether quota has been exceeded (shows warning in UI).
    @Published private(set) var quotaExceeded = false

    private init() {
        startObserving()
        // Force an initial pull from iCloud with retry logic
        syncWithRetry()
    }

    // MARK: - Observe iCloud → Local

    private func startObserving() {
        NotificationCenter.default.publisher(
            for: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: kvs
        )
        .receive(on: RunLoop.main)
        .sink { [weak self] notification in
            self?.handleExternalChange(notification)
        }
        .store(in: &cancellables)
    }

    private func handleExternalChange(_ notification: Notification) {
        guard let reason = notification.userInfo?[NSUbiquitousKeyValueStoreChangeReasonKey] as? Int else {
            return
        }

        switch reason {
        case NSUbiquitousKeyValueStoreServerChange,
             NSUbiquitousKeyValueStoreInitialSyncChange:
            // Pull changed keys from iCloud → UserDefaults
            if let changedKeys = notification.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] {
                for key in changedKeys {
                    if let syncKey = SyncedPreferenceKey(rawValue: key) {
                        pullFromCloud(syncKey)
                    }
                }
            }
            logger.info("Pulled preferences from iCloud (reason: \(reason))")

        case NSUbiquitousKeyValueStoreAccountChange:
            // Account changed — pull everything
            for key in SyncedPreferenceKey.allCases {
                pullFromCloud(key)
            }
            logger.info("iCloud account changed — refreshed all synced preferences")

        case NSUbiquitousKeyValueStoreQuotaViolationChange:
            logger.warning("iCloud KVS quota exceeded")
            quotaExceeded = true

        default:
            logger.debug("Unknown KVS change reason: \(reason)")
            break
        }
        
        // Update last successful sync timestamp
        lastSuccessfulSync = Date.now
    }

    // MARK: - Push Local → iCloud

    /// Call after the user changes a synced preference.
    func push(_ key: SyncedPreferenceKey) {
        switch key {
        case .userAge:
            let value = defaults.integer(forKey: key.rawValue)
            kvs.set(value, forKey: key.rawValue)
        case .userSex:
            let value = defaults.string(forKey: key.rawValue) ?? "notSet"
            kvs.set(value, forKey: key.rawValue)
        }
        
        let success = kvs.synchronize()
        if success {
            logger.debug("Pushed \(key.rawValue) to iCloud KVS")
            lastSuccessfulSync = Date.now
        } else {
            logger.warning("Failed to synchronize \(key.rawValue) to iCloud KVS")
        }
    }

    /// Push all synced keys to iCloud (e.g., on first launch after enabling sync).
    func pushAll() {
        for key in SyncedPreferenceKey.allCases {
            push(key)
        }
    }
    
    // MARK: - Sync with Retry
    
    /// Attempt to sync with exponential backoff on failure.
    private func syncWithRetry(attempt: Int = 0) {
        let success = kvs.synchronize()
        
        if success {
            logger.info("Initial KVS sync successful")
            lastSuccessfulSync = Date.now
        } else if attempt < 3 {
            let delay = pow(2.0, Double(attempt))  // 1s, 2s, 4s
            logger.warning("KVS sync failed (attempt \(attempt + 1)), retrying in \(String(format: "%.0f", delay))s")

            Task { [weak self] in
                try? await Task.sleep(for: .seconds(delay))
                self?.syncWithRetry(attempt: attempt + 1)
            }
        } else {
            logger.error("KVS sync failed after 3 attempts")
        }
    }

    // MARK: - Pull iCloud → Local

    private func pullFromCloud(_ key: SyncedPreferenceKey) {
        switch key {
        case .userAge:
            if let cloudValue = kvs.object(forKey: key.rawValue) as? Int {
                defaults.set(cloudValue, forKey: key.rawValue)
                logger.debug("Pulled userAge = \(cloudValue) from iCloud")
            } else {
                logger.debug("No cloud value for userAge")
            }
        case .userSex:
            if let cloudValue = kvs.string(forKey: key.rawValue) {
                defaults.set(cloudValue, forKey: key.rawValue)
                logger.debug("Pulled userSex = \(cloudValue) from iCloud")
            } else {
                logger.debug("No cloud value for userSex")
            }
        }
    }
}
