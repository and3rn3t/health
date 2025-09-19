import Foundation

/// Abstraction for retrieving a device or session authorization token.
/// Implementations:
/// - DevStaticTokenProvider: returns a fixed development token.
/// - EphemeralMemoryTokenProvider: holds a token injected at launch (useful for tests / previews).
/// - (Future) SecureKeychainTokenProvider: pulls a persisted refresh token and exchanges it.
protocol DeviceAuthTokenProvider {
    /// Returns a bearer / session token. Implementations may throw on transport / parsing failure.
    func fetchToken() async throws -> String
}

struct DevStaticTokenProvider: DeviceAuthTokenProvider {
    func fetchToken() async throws -> String { "device-dev-token" }
}

struct EphemeralMemoryTokenProvider: DeviceAuthTokenProvider {
    private let token: String
    init(_ token: String) { self.token = token }
    func fetchToken() async throws -> String { token }
}

enum DeviceAuthError: Error, LocalizedError {
    case tokenUnavailable
    var errorDescription: String? { "Device auth token unavailable" }
}

// MARK: - Secure (Keychain-backed) Provider

/// Minimal keychain accessor protocol to allow mocking in tests.
protocol KeychainAccessing {
    func read(key: String) -> Data?
    func write(key: String, data: Data) -> Bool
    func delete(key: String)
}

/// Real keychain facade (placeholder behavior on non-iOS platforms / simulators without entitlements).
final class SystemKeychainAccessor: KeychainAccessing {
    func read(key: String) -> Data? {
        #if os(iOS)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var out: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &out)
        if status == errSecSuccess, let data = out as? Data { return data }
        return nil
        #else
        return nil
        #endif
    }
    func write(key: String, data: Data) -> Bool {
        #if os(iOS)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        let attributes: [String: Any] = [kSecValueData as String: data]
        let status: OSStatus
        if SecItemCopyMatching(query as CFDictionary, nil) == errSecSuccess {
            status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        } else {
            var addQuery = query
            addQuery[kSecValueData as String] = data
            status = SecItemAdd(addQuery as CFDictionary, nil)
        }
        return status == errSecSuccess
        #else
        return true
        #endif
    }
    func delete(key: String) { /* future implementation */ }
}

/// Secure provider that attempts to load a cached access token, falling back to refresh flow.
final class SecureKeychainTokenProvider: DeviceAuthTokenProvider {
    private let keychain: KeychainAccessing
    private let accessTokenKey = "vitalsense.device.access"
    private let refreshTokenKey = "vitalsense.device.refresh"
    private let fetchClosure: (_ refresh: String) async throws -> (access: String, refresh: String)

    /// - Parameters:
    ///   - keychain: Abstraction for Keychain operations.
    ///   - fetchClosure: Closure executing network exchange given a refresh token (or empty for bootstrap).
    init(keychain: KeychainAccessing = SystemKeychainAccessor(),
         fetchClosure: @escaping (_ refresh: String) async throws -> (access: String, refresh: String)) {
        self.keychain = keychain
        self.fetchClosure = fetchClosure
    }

    func fetchToken() async throws -> String {
        if let cached = keychain.read(key: accessTokenKey).flatMap({ String(data: $0, encoding: .utf8) }), !cached.isEmpty {
            return cached
        }
        let refresh = keychain.read(key: refreshTokenKey).flatMap { String(data: $0, encoding: .utf8) } ?? ""
        let pair = try await fetchClosure(refresh)
        _ = keychain.write(key: accessTokenKey, data: Data(pair.access.utf8))
        _ = keychain.write(key: refreshTokenKey, data: Data(pair.refresh.utf8))
        return pair.access
    }
}

// MARK: - Test Doubles

final class InMemoryKeychain: KeychainAccessing {
    private var store: [String: Data] = [:]
    func read(key: String) -> Data? { store[key] }
    func write(key: String, data: Data) -> Bool { store[key] = data; return true }
    func delete(key: String) { store.removeValue(forKey: key) }
}
