//
//  CloudSyncService.swift
//  Andernet Posture
//
//  Monitors CloudKit sync status and exposes observable state
//  for the Settings UI. Uses NSPersistentCloudKitContainer event
//  notifications to track import/export progress.
//

import Foundation
import CloudKit
import CoreData
import os.log
import Combine
import Network
import UIKit

private let logger = AppLogger.cloudSync

// MARK: - SyncStatus

/// Simplified sync status for display in Settings.
enum SyncStatus: Sendable {
    case idle
    case syncing
    case succeeded(Date)
    case failed(String)
    case disabled

    var label: String {
        switch self {
        case .idle:          return String(localized: "Waiting")
        case .syncing:       return String(localized: "Syncing…")
        case .succeeded:     return String(localized: "Up to date")
        case .failed(let m): return m
        case .disabled:      return String(localized: "Off")
        }
    }

    var systemImage: String {
        switch self {
        case .idle:      return "clock"
        case .syncing:   return "arrow.triangle.2.circlepath"
        case .succeeded: return "checkmark.icloud.fill"
        case .failed:    return "exclamationmark.icloud.fill"
        case .disabled:  return "icloud.slash"
        }
    }
}

// MARK: - CloudSyncService

@Observable
@MainActor
final class CloudSyncService {
    private(set) var status: SyncStatus = .idle
    private(set) var lastSyncDate: Date?

    /// Number of consecutive transient errors — used to decide
    /// whether to stay in "Syncing" or flip to "failed".
    private var consecutiveTransientErrors = 0
    private static let maxTransientRetries = 5

    /// Timestamp when the current sync operation started.
    private var syncStartTime: Date?
    
    /// Maximum duration for a sync operation before considering it stale (5 minutes).
    private static let syncTimeout: TimeInterval = 300
    
    /// Timer for detecting stale sync operations.
    private var timeoutTimer: Timer?
    
    /// Network path monitor for detecting connectivity changes.
    private let networkMonitor = NWPathMonitor()
    private let networkQueue = DispatchQueue(label: "dev.andernet.posture.network")
    
    /// Whether the device currently has network connectivity.
    private var hasNetworkConnection = true
    
    /// Exponential backoff delay tracker.
    private var currentBackoffDelay: TimeInterval = 1.0
    private static let maxBackoffDelay: TimeInterval = 60.0

    private var cancellables = Set<AnyCancellable>()

    init() {
        startObservingCloudKitEvents()
        startNetworkMonitoring()
        startLifecycleMonitoring()
    }

    // MARK: - CloudKit Event Monitoring

    private func startObservingCloudKitEvents() {
        NotificationCenter.default.publisher(
            for: NSPersistentCloudKitContainer.eventChangedNotification
        )
        .receive(on: RunLoop.main)
        .sink { [weak self] notification in
            self?.handleCloudKitEvent(notification)
        }
        .store(in: &cancellables)
    }
    
    // MARK: - Network Monitoring
    
    private func startNetworkMonitoring() {
        networkMonitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor [weak self] in
                guard let self else { return }
                let wasConnected = self.hasNetworkConnection
                self.hasNetworkConnection = path.status == .satisfied
                
                if !wasConnected && self.hasNetworkConnection {
                    logger.info("Network connection restored")
                    // Reset backoff when network comes back
                    self.currentBackoffDelay = 1.0
                    // If we were in a failed state, reset to allow retry
                    if case .failed = self.status {
                        self.resetSyncState()
                    }
                } else if wasConnected && !self.hasNetworkConnection {
                    logger.warning("Network connection lost")
                }
            }
        }
        networkMonitor.start(queue: networkQueue)
    }
    
    // MARK: - Lifecycle Monitoring
    
    private func startLifecycleMonitoring() {
        NotificationCenter.default.publisher(
            for: UIApplication.willEnterForegroundNotification
        )
        .receive(on: RunLoop.main)
        .sink { [weak self] _ in
            self?.handleAppReturnedToForeground()
        }
        .store(in: &cancellables)
    }
    
    private func handleAppReturnedToForeground() {
        logger.debug("App returned to foreground, checking sync state")
        
        // If we have a stale sync operation (started but no end event for >5 min)
        if case .syncing = status, let startTime = syncStartTime {
            let elapsed = Date.now.timeIntervalSince(startTime)
            if elapsed > Self.syncTimeout {
                logger.warning("Detected stale sync operation (\(String(format: "%.0f", elapsed))s), resetting")
                resetSyncState()
            }
        }
    }

    private func handleCloudKitEvent(_ notification: Notification) {
        guard let event = notification.userInfo?[NSPersistentCloudKitContainer.eventNotificationUserInfoKey]
                as? NSPersistentCloudKitContainer.Event else {
            logger.debug("Received cloud event notification without parseable event.")
            return
        }

        Task { @MainActor [weak self] in
            guard let self else { return }

            if event.endDate == nil {
                // Event is in progress
                self.syncStartTime = Date.now
                self.status = .syncing
                self.startTimeoutTimer()
                logger.info("CloudKit sync started: type=\(String(describing: event.type))")
            } else if let error = event.error {
                self.timeoutTimer?.invalidate()
                self.syncStartTime = nil
                self.handleSyncError(error, eventType: event.type)
            } else {
                // Success — reset all error tracking
                self.timeoutTimer?.invalidate()
                self.syncStartTime = nil
                self.consecutiveTransientErrors = 0
                self.currentBackoffDelay = 1.0  // Reset exponential backoff
                let now = Date.now
                self.status = .succeeded(now)
                self.lastSyncDate = now
                logger.info("CloudKit sync completed: type=\(String(describing: event.type))")
            }
        }
    }

    // MARK: - Error Classification

    /// Classify the error and decide whether to show a user-facing failure
    /// or treat it as transient (the container will retry automatically).
    private func handleSyncError(_ error: Error, eventType: NSPersistentCloudKitContainer.EventType) {
        let nsError = error as NSError
        let code = nsError.code
        let domain = nsError.domain

        // Log full details for debugging
        logger.error("""
        CloudKit sync error — domain=\(domain) code=\(code) \
        type=\(String(describing: eventType)) \
        description=\(nsError.localizedDescription) \
        underlying=\(String(describing: nsError.userInfo[NSUnderlyingErrorKey]))
        """)

        // Special handling for partial failures
        if domain == CKError.errorDomain, code == CKError.partialFailure.rawValue {
            handlePartialFailure(nsError)
            return
        }

        // Determine if this is transient
        let isTransient: Bool
        if domain == CKError.errorDomain {
            isTransient = Self.isTransientCKErrorCode(code)
        } else {
            // CoreData / NSPersistentCloudKitContainer internal errors
            // often wrap transient CK errors in the underlying-error chain
            isTransient = Self.containsTransientCKError(nsError)
        }

        if isTransient {
            consecutiveTransientErrors += 1
            if consecutiveTransientErrors <= Self.maxTransientRetries {
                // Stay in "syncing" — the container retries automatically
                // Implement exponential backoff logging
                currentBackoffDelay = min(currentBackoffDelay * 2.0, Self.maxBackoffDelay)
                status = .syncing
                logger.info("Transient sync error (\(self.consecutiveTransientErrors)/\(Self.maxTransientRetries)), will retry with backoff ~\(String(format: "%.0f", self.currentBackoffDelay))s")
                return
            } else {
                // Too many retries — reset backoff for next attempt
                currentBackoffDelay = Self.maxBackoffDelay
            }
        }

        // Permanent or too many transient retries — show user-friendly message
        status = .failed(Self.friendlyMessage(domain: domain, code: code))
    }

    /// Handle CKError.partialFailure — inspect individual record errors.
    /// If some records succeeded, mark sync as successful. If all failed
    /// with permanent errors, show appropriate message.
    private func handlePartialFailure(_ error: NSError) {
        guard let partialErrors = error.userInfo[CKPartialErrorsByItemIDKey] as? [AnyHashable: Error] else {
            logger.warning("Partial failure without error details — treating as transient")
            consecutiveTransientErrors += 1
            if consecutiveTransientErrors <= Self.maxTransientRetries {
                status = .syncing
            } else {
                status = .failed(String(localized: "Some items failed to sync"))
            }
            return
        }

        // Analyze individual errors
        var hasTransientErrors = false
        var hasPermanentErrors = false

        for (itemID, itemError) in partialErrors {
            let nsItemError = itemError as NSError
            logger.debug("Partial failure for item \(itemID): \(nsItemError.domain) code=\(nsItemError.code)")

            if nsItemError.domain == CKError.errorDomain {
                if Self.isTransientCKErrorCode(nsItemError.code) {
                    hasTransientErrors = true
                } else {
                    hasPermanentErrors = true
                }
            } else {
                // Unknown error domain — treat as permanent
                hasPermanentErrors = true
            }
        }

        // Decide on status
        if hasTransientErrors && !hasPermanentErrors {
            // All failures are transient — CloudKit will retry
            consecutiveTransientErrors += 1
            if consecutiveTransientErrors <= Self.maxTransientRetries {
                status = .syncing
                logger.info("Partial failure with transient errors (\(self.consecutiveTransientErrors)/\(Self.maxTransientRetries))")
            } else {
                // Too many retries
                status = .failed(String(localized: "Some items couldn't sync"))
            }
        } else if hasPermanentErrors {
            // At least some permanent failures — but some may have succeeded
            // Reset counter and mark last successful sync
            consecutiveTransientErrors = 0
            let now = Date.now
            lastSyncDate = now
            status = .succeeded(now)
            logger.warning("Partial failure: some items succeeded, some failed permanently. Treating as successful.")
        } else {
            // No errors found in dictionary (shouldn't happen)
            consecutiveTransientErrors = 0
            let now = Date.now
            status = .succeeded(now)
            lastSyncDate = now
        }
    }

    /// Whether a CKError code represents a transient/retryable condition.
    private static func isTransientCKErrorCode(_ code: Int) -> Bool {
        switch CKError.Code(rawValue: code) {
        case .networkUnavailable,
             .networkFailure,
             .serviceUnavailable,
             .zoneBusy,
             .requestRateLimited:
            return true
        default:
            return false
        }
    }

    /// Walk the `NSUnderlyingError` chain looking for a transient CKError.
    private static func containsTransientCKError(_ error: NSError) -> Bool {
        var current: NSError? = error
        while let err = current {
            if err.domain == CKError.errorDomain, isTransientCKErrorCode(err.code) {
                return true
            }
            current = err.userInfo[NSUnderlyingErrorKey] as? NSError
        }
        return false
    }

    /// Map raw error codes to short, actionable messages.
    private static func friendlyMessage(domain: String, code: Int) -> String {
        if domain == CKError.errorDomain {
            switch CKError.Code(rawValue: code) {
            case .notAuthenticated:
                return String(localized: "Sign in to iCloud in Settings")
            case .networkUnavailable, .networkFailure:
                return String(localized: "No network connection")
            case .quotaExceeded:
                return String(localized: "iCloud storage full")
            case .badContainer, .missingEntitlement:
                return String(localized: "iCloud configuration error")
            case .incompatibleVersion:
                return String(localized: "Update the app to sync")
            case .serviceUnavailable, .zoneBusy, .requestRateLimited:
                return String(localized: "iCloud busy — will retry")
            default:
                return String(localized: "Sync error (\(code))")
            }
        }
        return String(localized: "Sync error (\(code))")
    }

    // MARK: - Account Availability

    /// Check whether the user is signed in to iCloud.
    func checkAccountStatus() async -> Bool {
        do {
            let status = try await CKContainer(identifier: "iCloud.dev.andernet.posture")
                .accountStatus()
            let available = status == .available
            if !available {
                logger.warning("iCloud account not available: \(String(describing: status))")
            }
            return available
        } catch {
            logger.error("iCloud account check failed: \(error.localizedDescription)")
            return false
        }
    }

    // MARK: - Timeout Detection
    
    private func startTimeoutTimer() {
        timeoutTimer?.invalidate()
        timeoutTimer = Timer.scheduledTimer(
            withTimeInterval: Self.syncTimeout,
            repeats: false
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.handleSyncTimeout()
            }
        }
    }
    
    private func handleSyncTimeout() {
        guard case .syncing = status else { return }
        
        logger.error("Sync operation timed out after \(Self.syncTimeout)s")
        syncStartTime = nil
        
        // Check network status
        if !hasNetworkConnection {
            status = .failed(String(localized: "No network connection"))
        } else {
            status = .failed(String(localized: "Sync timed out — tap Retry"))
        }
    }
    
    // MARK: - Manual Retry

    /// Reset the error counter and sync status to allow CloudKit to retry.
    /// Useful when user wants to manually trigger a retry after a persistent error.
    func resetSyncState() {
        timeoutTimer?.invalidate()
        syncStartTime = nil
        consecutiveTransientErrors = 0
        currentBackoffDelay = 1.0
        status = .idle
        logger.info("Sync state manually reset")
    }
}
