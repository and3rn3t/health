import XCTest
@testable import HealthKitBridge

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
}
