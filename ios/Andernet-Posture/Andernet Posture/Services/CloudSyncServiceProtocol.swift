//
//  CloudSyncServiceProtocol.swift
//  Andernet Posture
//
//  Protocol abstraction for CloudSyncService to enable testability
//  and decouple Views from the concrete implementation.
//

import Foundation

/// Abstraction over cloud sync status and control.
/// Views and ViewModels should depend on this protocol, not the concrete class.
@MainActor
protocol CloudSyncServiceProtocol: AnyObject, Observable {
    /// Current sync status (idle, syncing, succeeded, failed, disabled).
    var status: SyncStatus { get }

    /// Timestamp of the last successful sync, if any.
    var lastSyncDate: Date? { get }

    /// Reset error counters and allow CloudKit to retry.
    func resetSyncState()

    /// Check whether the user's iCloud account is available.
    func checkAccountStatus() async -> Bool
}

// MARK: - Conformance

extension CloudSyncService: CloudSyncServiceProtocol {}
