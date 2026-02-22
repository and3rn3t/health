//
//  KeyValueStoreSyncProtocol.swift
//  Andernet Posture
//
//  Protocol abstraction for KeyValueStoreSync to enable testability.
//

import Foundation

/// Abstraction over iCloud Key-Value Store synchronization.
@MainActor
protocol KeyValueStoreSyncProtocol: AnyObject {
    /// Push a single synced preference to iCloud KVS.
    func push(_ key: SyncedPreferenceKey)

    /// Push all synced keys to iCloud KVS.
    func pushAll()
}

// MARK: - Conformance

extension KeyValueStoreSync: KeyValueStoreSyncProtocol {}
