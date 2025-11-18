import Foundation
import Network
import os

// NOTE: This file previously contained a full duplicate implementation of WebSocketManager
// (including CodableJSON, RawEnvelope, and all WebSocket connection logic). That logic
// has been moved to and is owned by `Core/Managers/WebSocketManager.swift`. To avoid
// invalid redeclaration and ambiguity errors, SecurityManager.swift should not define
// WebSocketManager or any overlapping WebSocket types. Use the shared WebSocketManager
// via its public API instead.

// MARK: - Keychain Accessibility

enum KeychainAccessibility: String {
    case whenUnlockedThisDeviceOnly = "whenUnlockedThisDeviceOnly"
    case whenUnlocked = "whenUnlocked"

    var cfValue: CFString {
        switch self {
        case .whenUnlockedThisDeviceOnly:
            return kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        case .whenUnlocked:
            return kSecAttrAccessibleWhenUnlocked
        }
    }
}

// MARK: - SecurityManager

final class SecurityManager {
    static let shared = SecurityManager()

    private init() {
        // Private initialization to ensure just one instance is created.
    }

    // Add security-related methods here
}

// Update any Keychain query building code to use `accessibility.cfValue` when
// setting kSecAttrAccessible, for example:
// query[kSecAttrAccessible as String] = accessibility.cfValue
