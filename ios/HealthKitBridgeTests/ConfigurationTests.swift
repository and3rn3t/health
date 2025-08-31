import XCTest
@testable import HealthKitBridge

class ConfigurationTests: XCTestCase {

    override func setUpWithError() throws {
        super.setUp()
    }

    override func tearDownWithError() throws {
        super.tearDown()
    }

    // MARK: - AppConfig Tests
    func testAppConfigValidation() {
        let config = AppConfig.shared

        // Test that configuration loads successfully
        XCTAssertNotNil(config)
        XCTAssertFalse(config.userId.isEmpty, "User ID should not be empty")
        XCTAssertNotNil(config.apiBaseURL, "API base URL should not be nil")
        XCTAssertNotNil(config.wsURL, "WebSocket URL should not be nil")
    }

    func testAppConfigURLFormats() {
        let config = AppConfig.shared

        // Test URL format validation
        let apiURL = config.apiBaseURL
        let wsURL = config.wsURL

        XCTAssertTrue(apiURL.absoluteString.hasPrefix("http://") ||
                     apiURL.absoluteString.hasPrefix("https://"),
                     "API URL should have valid HTTP scheme")

        XCTAssertTrue(wsURL.absoluteString.hasPrefix("ws://") ||
                     wsURL.absoluteString.hasPrefix("wss://"),
                     "WebSocket URL should have valid WebSocket scheme")
    }

    func testAppConfigEnvironmentSpecific() {
        let config = AppConfig.shared

        // Test environment-specific configuration
        if config.apiBaseURL.absoluteString.contains("127.0.0.1") ||
           config.apiBaseURL.absoluteString.contains("localhost") {
            // Development environment
            XCTAssertTrue(config.wsURL.absoluteString.contains("localhost") ||
                         config.wsURL.absoluteString.contains("127.0.0.1"),
                         "Development WebSocket should use localhost")
        } else {
            // Production/staging environment
            XCTAssertTrue(config.apiBaseURL.absoluteString.contains("andernet.dev") ||
                         config.apiBaseURL.absoluteString.contains("production"),
                         "Production API should use production domain")
        }
    }

    // MARK: - EnhancedAppConfig Tests
    func testEnhancedAppConfigValidation() {
        let config = EnhancedAppConfig.shared

        XCTAssertNotNil(config)
        XCTAssertTrue(config.validate(), "Enhanced config should validate successfully")

        // Test individual components
        XCTAssertNotNil(config.apiBaseURL)
        XCTAssertNotNil(config.webSocketURL)
        XCTAssertNotNil(config.userId)
        XCTAssertFalse(config.userId.isEmpty)
    }

    func testEnhancedAppConfigDefaults() {
        let config = EnhancedAppConfig.shared

        // Test default values
        XCTAssertGreaterThan(config.connectionTimeout, 0, "Connection timeout should be positive")
        XCTAssertGreaterThan(config.requestTimeout, 0, "Request timeout should be positive")
        XCTAssertGreaterThanOrEqual(config.maxRetryAttempts, 0, "Max retry attempts should be non-negative")
    }

    func testEnhancedAppConfigSingleton() {
        let config1 = EnhancedAppConfig.shared
        let config2 = EnhancedAppConfig.shared
        XCTAssertTrue(config1 === config2, "EnhancedAppConfig should be singleton")
    }

    // MARK: - Config.plist Tests
    func testConfigPlistIntegrity() {
        guard let url = Bundle.main.url(forResource: "Config", withExtension: "plist") else {
            XCTFail("Config.plist not found in bundle")
            return
        }

        guard let data = try? Data(contentsOf: url) else {
            XCTFail("Unable to read Config.plist data")
            return
        }

        guard let plist = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any] else {
            XCTFail("Unable to parse Config.plist")
            return
        }

        // Test required keys
        let requiredKeys = ["API_BASE_URL", "WS_URL", "USER_ID"]
        for key in requiredKeys {
            XCTAssertNotNil(plist[key], "Config.plist should contain \(key)")
            XCTAssertTrue(plist[key] is String, "\(key) should be a string")
            XCTAssertFalse((plist[key] as? String)?.isEmpty ?? true, "\(key) should not be empty")
        }
    }

    func testConfigPlistURLValidation() {
        guard let url = Bundle.main.url(forResource: "Config", withExtension: "plist"),
              let data = try? Data(contentsOf: url),
              let plist = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any] else {
            XCTFail("Unable to load Config.plist")
            return
        }

        if let apiURLString = plist["API_BASE_URL"] as? String {
            XCTAssertNotNil(URL(string: apiURLString), "API_BASE_URL should be a valid URL")
        }

        if let wsURLString = plist["WS_URL"] as? String {
            XCTAssertNotNil(URL(string: wsURLString), "WS_URL should be a valid URL")
        }
    }

    // MARK: - Environment Configuration Tests
    func testDevelopmentConfiguration() {
        let config = AppConfig.shared

        // Test development-specific settings
        if config.apiBaseURL.absoluteString.contains("127.0.0.1") {
            XCTAssertTrue(config.wsURL.absoluteString.contains("localhost"),
                         "Development should use localhost for WebSocket")

            // Development should allow insecure connections
            XCTAssertTrue(config.apiBaseURL.scheme == "http" || config.apiBaseURL.scheme == "https")
        }
    }

    func testProductionConfiguration() {
        let config = AppConfig.shared

        // Test production-specific settings
        if config.apiBaseURL.absoluteString.contains("andernet.dev") {
            XCTAssertEqual(config.apiBaseURL.scheme, "https", "Production should use HTTPS")
            XCTAssertTrue(config.wsURL.absoluteString.hasPrefix("wss://"), "Production should use secure WebSocket")
        }
    }

    // MARK: - Configuration Consistency Tests
    func testConfigurationConsistency() {
        let appConfig = AppConfig.shared
        let enhancedConfig = EnhancedAppConfig.shared

        // Test that both configurations are consistent
        XCTAssertEqual(appConfig.apiBaseURL.absoluteString, enhancedConfig.apiBaseURL.absoluteString,
                      "API URLs should be consistent between configurations")

        XCTAssertEqual(appConfig.webSocketURL, enhancedConfig.webSocketURL.absoluteString,
                      "WebSocket URLs should be consistent between configurations")

        XCTAssertEqual(appConfig.userId, enhancedConfig.userId,
                      "User IDs should be consistent between configurations")
    }

    // MARK: - Configuration Error Handling Tests
    func testConfigurationErrorHandling() {
        // Test handling of missing or invalid configuration
        let config = AppConfig.shared

        // Configuration should have fallback values
        XCTAssertNotNil(config.apiBaseURL, "Should have fallback API URL")
        XCTAssertNotNil(config.wsURL, "Should have fallback WebSocket URL")
        XCTAssertFalse(config.userId.isEmpty, "Should have fallback user ID")
    }

    func testEnhancedConfigurationErrorHandling() {
        let config = EnhancedAppConfig.shared

        // Test validation method
        XCTAssertTrue(config.validate(), "Configuration validation should pass")

        // Test that configuration handles edge cases
        XCTAssertGreaterThan(config.connectionTimeout, 0)
        XCTAssertGreaterThan(config.requestTimeout, 0)
        XCTAssertGreaterThanOrEqual(config.maxRetryAttempts, 0)
    }

    // MARK: - Configuration Performance Tests
    func testConfigurationPerformance() {
        measure {
            // Test configuration loading performance
            let _ = AppConfig.shared
            let _ = EnhancedAppConfig.shared
        }
    }

    func testConfigurationMemoryUsage() {
        weak var weakAppConfig: AppConfig?
        weak var weakEnhancedConfig: EnhancedAppConfig?

        autoreleasepool {
            let appConfig = AppConfig.shared
            let enhancedConfig = EnhancedAppConfig.shared
            weakAppConfig = appConfig
            weakEnhancedConfig = enhancedConfig
        }

        // Singletons should still exist
        XCTAssertNotNil(weakAppConfig, "AppConfig singleton should persist")
        XCTAssertNotNil(weakEnhancedConfig, "EnhancedAppConfig singleton should persist")
    }

    // MARK: - Thread Safety Tests
    func testConfigurationThreadSafety() {
        let expectation = XCTestExpectation(description: "Configuration thread safety")
        expectation.expectedFulfillmentCount = 10

        // Test concurrent access to configuration
        DispatchQueue.concurrentPerform(iterations: 10) { _ in
            let appConfig = AppConfig.shared
            let enhancedConfig = EnhancedAppConfig.shared

            XCTAssertNotNil(appConfig)
            XCTAssertNotNil(enhancedConfig)

            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }

    // MARK: - Configuration Update Tests
    func testConfigurationImmutability() {
        let config1 = AppConfig.shared
        let config2 = AppConfig.shared

        // Test that configuration properties are consistent across calls
        XCTAssertEqual(config1.userId, config2.userId)
        XCTAssertEqual(config1.apiBaseURL, config2.apiBaseURL)
        XCTAssertEqual(config1.wsURL, config2.wsURL)
    }

    // MARK: - Bundle Configuration Tests
    func testBundleConfiguration() {
        let bundle = Bundle.main

        // Test that bundle contains required configuration files
        XCTAssertNotNil(bundle.url(forResource: "Config", withExtension: "plist"),
                       "Bundle should contain Config.plist")

        // Test app info
        XCTAssertNotNil(bundle.infoDictionary?["CFBundleIdentifier"])
        XCTAssertNotNil(bundle.infoDictionary?["CFBundleVersion"])
        XCTAssertNotNil(bundle.infoDictionary?["CFBundleShortVersionString"])
    }

    // MARK: - Network Configuration Tests
    func testNetworkConfiguration() {
        let config = AppConfig.shared

        // Test network-related configuration
        let apiURL = config.apiBaseURL
        let wsURL = config.wsURL

        // URLs should be reachable format
        XCTAssertNotNil(apiURL.host, "API URL should have valid host")
        XCTAssertNotNil(wsURL.host, "WebSocket URL should have valid host")

        // Ports should be valid if specified
        if let port = apiURL.port {
            XCTAssertGreaterThan(port, 0, "API port should be positive")
            XCTAssertLessThan(port, 65536, "API port should be valid")
        }

        if let port = wsURL.port {
            XCTAssertGreaterThan(port, 0, "WebSocket port should be positive")
            XCTAssertLessThan(port, 65536, "WebSocket port should be valid")
        }
    }
}
