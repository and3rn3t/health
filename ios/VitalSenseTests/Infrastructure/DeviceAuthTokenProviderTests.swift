import XCTest
@testable import VitalSense

final class DeviceAuthTokenProviderTests: XCTestCase {
    func testSecureProviderReturnsCachedFirst() async throws {
        let keychain = InMemoryKeychain()
        // Pre-seed access token
        _ = keychain.write(key: "vitalsense.device.access", data: Data("cached_access".utf8))
        let provider = SecureKeychainTokenProvider(keychain: keychain) { refresh in
            XCTFail("Should not call fetch closure when cached token present")
            return ("network_access", "network_refresh")
        }
        let token = try await provider.fetchToken()
        XCTAssertEqual(token, "cached_access")
    }

    func testSecureProviderUsesFetchWhenNoCache() async throws {
        let keychain = InMemoryKeychain()
        let provider = SecureKeychainTokenProvider(keychain: keychain) { refresh in
            XCTAssertEqual(refresh, "")
            return ("new_access", "new_refresh")
        }
        let token = try await provider.fetchToken()
        XCTAssertEqual(token, "new_access")
        // Second call should hit cache
        let token2 = try await provider.fetchToken()
        XCTAssertEqual(token2, "new_access")
    }

    func testSecureProviderRefreshFlow() async throws {
        let keychain = InMemoryKeychain()
        // Simulate existing refresh but missing access
        _ = keychain.write(key: "vitalsense.device.refresh", data: Data("existing_refresh".utf8))
        var refreshUsed: String?
        let provider = SecureKeychainTokenProvider(keychain: keychain) { refresh in
            refreshUsed = refresh
            return ("next_access", "next_refresh")
        }
        let token = try await provider.fetchToken()
        XCTAssertEqual(token, "next_access")
        XCTAssertEqual(refreshUsed, "existing_refresh")
    }

    // MARK: - Expiry Added Tests
    func testTokenExpiresAfterTTL() async throws {
        let keychain = InMemoryKeychain()
        var now = Date()
        var fetchCount = 0
        let provider = SecureKeychainTokenProvider(keychain: keychain, ttl: 10, clock: { now }) { _ in
            fetchCount += 1
            return ("token_\(fetchCount)", "refresh_\(fetchCount)")
        }
        // First fetch -> network
        let t1 = try await provider.fetchToken()
        XCTAssertEqual(t1, "token_1")
        // Second fetch within TTL -> cached
        let t2 = try await provider.fetchToken()
        XCTAssertEqual(t2, "token_1")
        XCTAssertEqual(fetchCount, 1)
        // Advance beyond ttl + skew (skew=5) -> should refetch
        now = now.addingTimeInterval(11) // 10 + 1 safety
        let t3 = try await provider.fetchToken()
        XCTAssertEqual(t3, "token_2")
        XCTAssertEqual(fetchCount, 2)
    }

    func testImmediateExpiryTTLZeroAlwaysRefetches() async throws {
        let keychain = InMemoryKeychain()
        var fetchCount = 0
        let provider = SecureKeychainTokenProvider(keychain: keychain, ttl: 0, fetch: { _ in
            fetchCount += 1
            return ("immediate_\(fetchCount)", "r_\(fetchCount)")
        })
        let a = try await provider.fetchToken()
        let b = try await provider.fetchToken()
        XCTAssertNotEqual(a, b) // Each call should produce new token
        XCTAssertEqual(fetchCount, 2)
    }
}
