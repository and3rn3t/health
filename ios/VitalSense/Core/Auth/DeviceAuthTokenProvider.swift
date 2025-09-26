import Foundation

// MARK: - Keychain Abstraction
protocol KeychainStorable {
    func read(key: String) -> Data?
    @discardableResult func write(key: String, data: Data) -> Bool
    @discardableResult func delete(key: String) -> Bool
}

/// Simple in-memory keychain (used in unit tests and as a fallback)
final class InMemoryKeychain: KeychainStorable {
    private var store: [String: Data] = [:]
    private let lock = NSLock()
    func read(key: String) -> Data? { lock.lock(); defer { lock.unlock() }; return store[key] }
    @discardableResult func write(key: String, data: Data) -> Bool { lock.lock(); defer { lock.unlock() }; store[key] = data; return true }
    @discardableResult func delete(key: String) -> Bool { lock.lock(); defer { lock.unlock() }; return store.removeValue(forKey: key) != nil }
}

// MARK: - Provider Protocol
protocol DeviceAuthTokenProvider { func fetchToken() async throws -> String }

enum DeviceAuthError: Error { case fetchFailed }

/// SecureKeychainTokenProvider
/// Responsibilities:
/// 1. Return cached access token if available AND not expired.
/// 2. If missing/expired, call provided network closure with existing refresh token (may be empty string).
/// 3. Persist newly returned access + refresh tokens (and expiry) in keychain.
/// Backward compatibility: legacy tests rely on access token key existing alone; if no expiry key is stored we treat token as non-expiring.
final class SecureKeychainTokenProvider: DeviceAuthTokenProvider {
    private let keychain: KeychainStorable
    private let fetchClosure: (_ existingRefresh: String) async throws -> (access: String, refresh: String)
    private let accessKey = "vitalsense.device.access"
    private let refreshKey = "vitalsense.device.refresh"
    private let expiryKey = "vitalsense.device.access.expiry"
    private let ttl: TimeInterval
    private let clock: () -> Date
    private let skew: TimeInterval = 5 // seconds safety window

    /// Designated initializer with TTL + clock injection
    init(keychain: KeychainStorable = InMemoryKeychain(), ttl: TimeInterval = 3600, clock: @escaping () -> Date = Date.init, fetch: @escaping (_ existingRefresh: String) async throws -> (String, String)) {
        self.keychain = keychain
        self.ttl = ttl
        self.clock = clock
        self.fetchClosure = fetch
    }

    /// Backward-compatible convenience initializer (no TTL argument in existing tests)
    convenience init(keychain: KeychainStorable = InMemoryKeychain(), fetch: @escaping (_ existingRefresh: String) async throws -> (String, String)) {
        self.init(keychain: keychain, ttl: 3600, clock: Date.init, fetch: fetch)
    }

    func fetchToken() async throws -> String {
        // 1. Return cached access if present and not expired
        if let data = keychain.read(key: accessKey),
           let token = String(data: data, encoding: .utf8), !token.isEmpty,
           !isExpired() {
            return token
        }
        // 2. Provide existing refresh (may be empty)
        let existingRefresh = keychain.read(key: refreshKey).flatMap { String(data: $0, encoding: .utf8) } ?? ""
        let pair = try await fetchClosure(existingRefresh)
        guard !pair.access.isEmpty else { throw DeviceAuthError.fetchFailed }
        // 3. Persist tokens & expiry
        _ = keychain.write(key: accessKey, data: Data(pair.access.utf8))
        if !pair.refresh.isEmpty { _ = keychain.write(key: refreshKey, data: Data(pair.refresh.utf8)) }
        writeExpiry()
        return pair.access
    }

    private func isExpired() -> Bool {
        // If no expiry stored treat as non-expiring for backward compatibility
        guard let expData = keychain.read(key: expiryKey),
              let expString = String(data: expData, encoding: .utf8),
              let seconds = TimeInterval(expString) else { return false }
        return (clock().timeIntervalSince1970 + skew) >= seconds
    }

    private func writeExpiry() {
        guard ttl > 0 else {
            // Immediate expiry semantics
            let past = clock().timeIntervalSince1970 - 1
            _ = keychain.write(key: expiryKey, data: Data(String(past).utf8))
            return
        }
        let expiry = clock().addingTimeInterval(ttl).timeIntervalSince1970
        _ = keychain.write(key: expiryKey, data: Data(String(expiry).utf8))
    }
}
