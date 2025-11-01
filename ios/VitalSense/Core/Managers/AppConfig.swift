//
//  AppConfig.swift
//  VitalSense
//
//  Application configuration manager with environment-specific settings
//  Follows singleton pattern for consistent app-wide configuration
//

import Foundation
import SwiftUI

@MainActor
class AppConfig: ObservableObject {
    static let shared = AppConfig()

    // MARK: - Configuration Properties
    @Published var isInitialized = false
    @Published var hasCompletedOnboarding = false
    @Published var gaitMonitoringEnabled = true
    @Published var fallRiskAlertsEnabled = true
    @Published var privacyModeEnabled = false

    // MARK: - Network Configuration
    struct NetworkConfiguration {
        let webSocketURL: URL
        let apiBaseURL: URL
        let apiTimeout: TimeInterval
        let enableSSLPinning: Bool

        static let development = NetworkConfiguration(
            webSocketURL: URL(string: "ws://127.0.0.1:3001/ws")!,
            apiBaseURL: URL(string: "http://127.0.0.1:8789/api")!,
            apiTimeout: 30.0,
            enableSSLPinning: false
        )

        static let production = NetworkConfiguration(
            webSocketURL: URL(string: "wss://health.andernet.dev/ws")!,
            apiBaseURL: URL(string: "https://health.andernet.dev/api")!,
            apiTimeout: 30.0,
            enableSSLPinning: true
        )
    }

    @Published var networkConfiguration: NetworkConfiguration

    // MARK: - Health Monitoring Configuration
    struct HealthMonitoringConfig {
        var heartRateMonitoringInterval: TimeInterval = 300 // 5 minutes
        var gaitAnalysisFrequency: TimeInterval = 3600 // 1 hour
        var fallRiskAssessmentInterval: TimeInterval = 86400 // 24 hours
        var backgroundSyncInterval: TimeInterval = 1800 // 30 minutes

        var enabledMetrics: Set<String> = [
            "heartRate",
            "stepCount",
            "walkingSteadiness",
            "gaitSpeed",
            "fallRisk"
        ]
    }

    @Published var healthMonitoringConfig = HealthMonitoringConfig()

    // MARK: - Privacy Configuration
    struct PrivacyConfig {
        var dataRetentionDays: Int = 90
        var shareDataWithResearchers: Bool = false
        var enableCloudSync: Bool = true
        var requireBiometricAuth: Bool = false
        var enableDataExport: Bool = true
    }

    @Published var privacyConfig = PrivacyConfig()

    // MARK: - UI Configuration
    struct UIConfig {
        var enableHapticFeedback: Bool = true
        var preferredColorScheme: ColorScheme? = nil
        var enableVoiceOver: Bool = false
        var enableReducedMotion: Bool = false
        var fontSize: FontSize = .medium

        enum FontSize: String, CaseIterable {
            case small, medium, large, extraLarge

            var scale: CGFloat {
                switch self {
                case .small: return 0.8
                case .medium: return 1.0
                case .large: return 1.2
                case .extraLarge: return 1.4
                }
            }
        }
    }

    @Published var uiConfig = UIConfig()

    // MARK: - Initialization
    private init() {
        #if DEBUG
        networkConfiguration = .development
        #else
        networkConfiguration = .production
        #endif

        loadConfiguration()
    }

    func initialize() async throws {
        print("🔧 Initializing AppConfig...")

        // Load configuration from bundle and user defaults
        await loadConfigurationAsync()

        // Validate configuration
        try validateConfiguration()

        // Set up configuration observers
        setupConfigurationObservers()

        await MainActor.run {
            isInitialized = true
        }

        print("✅ AppConfig initialized successfully")
    }

    // MARK: - Configuration Loading
    private func loadConfiguration() {
        // Load from UserDefaults
        hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
        gaitMonitoringEnabled = UserDefaults.standard.object(forKey: "gaitMonitoringEnabled") as? Bool ?? true
        fallRiskAlertsEnabled = UserDefaults.standard.object(forKey: "fallRiskAlertsEnabled") as? Bool ?? true
        privacyModeEnabled = UserDefaults.standard.bool(forKey: "privacyModeEnabled")

        // Load privacy config
        privacyConfig.shareDataWithResearchers = UserDefaults.standard.bool(forKey: "shareDataWithResearchers")
        privacyConfig.enableCloudSync = UserDefaults.standard.object(forKey: "enableCloudSync") as? Bool ?? true
        privacyConfig.requireBiometricAuth = UserDefaults.standard.bool(forKey: "requireBiometricAuth")

        // Load UI config
        uiConfig.enableHapticFeedback = UserDefaults.standard.object(forKey: "enableHapticFeedback") as? Bool ?? true

        if let fontSizeRaw = UserDefaults.standard.string(forKey: "fontSize"),
           let fontSize = UIConfig.FontSize(rawValue: fontSizeRaw) {
            uiConfig.fontSize = fontSize
        }
    }

    private func loadConfigurationAsync() async {
        // Load configuration from Config.plist if available
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let configDict = NSDictionary(contentsOfFile: configPath) {

            await parseConfigPlist(configDict)
        }

        // Load environment-specific overrides
        await loadEnvironmentOverrides()
    }

    private func parseConfigPlist(_ config: NSDictionary) async {
        // Parse network configuration
        if let networkDict = config["Network"] as? [String: Any] {
            if let webSocketURLString = networkDict["WebSocketURL"] as? String,
               let webSocketURL = URL(string: webSocketURLString) {
                await MainActor.run {
                    networkConfiguration.webSocketURL = webSocketURL
                }
            }

            if let apiBaseURLString = networkDict["APIBaseURL"] as? String,
               let apiBaseURL = URL(string: apiBaseURLString) {
                await MainActor.run {
                    networkConfiguration.apiBaseURL = apiBaseURL
                }
            }
        }

        // Parse health monitoring configuration
        if let healthDict = config["HealthMonitoring"] as? [String: Any] {
            if let interval = healthDict["HeartRateInterval"] as? TimeInterval {
                await MainActor.run {
                    healthMonitoringConfig.heartRateMonitoringInterval = interval
                }
            }
        }
    }

    private func loadEnvironmentOverrides() async {
        // Check for environment variable overrides
        if let webSocketURL = ProcessInfo.processInfo.environment["WEBSOCKET_URL"],
           let url = URL(string: webSocketURL) {
            await MainActor.run {
                networkConfiguration.webSocketURL = url
            }
        }

        if let apiBaseURL = ProcessInfo.processInfo.environment["API_BASE_URL"],
           let url = URL(string: apiBaseURL) {
            await MainActor.run {
                networkConfiguration.apiBaseURL = url
            }
        }
    }

    // MARK: - Configuration Validation
    private func validateConfiguration() throws {
        // Validate network URLs
        guard networkConfiguration.webSocketURL.scheme != nil else {
            throw ConfigurationError.invalidWebSocketURL
        }

        guard networkConfiguration.apiBaseURL.scheme != nil else {
            throw ConfigurationError.invalidAPIBaseURL
        }

        // Validate intervals
        guard healthMonitoringConfig.heartRateMonitoringInterval > 0 else {
            throw ConfigurationError.invalidMonitoringInterval
        }

        print("✅ Configuration validation passed")
    }

    // MARK: - Configuration Observers
    private func setupConfigurationObservers() {
        // Observe changes and save to UserDefaults
        $hasCompletedOnboarding
            .sink { UserDefaults.standard.set($0, forKey: "hasCompletedOnboarding") }
            .store(in: &cancellables)

        $gaitMonitoringEnabled
            .sink { UserDefaults.standard.set($0, forKey: "gaitMonitoringEnabled") }
            .store(in: &cancellables)

        $fallRiskAlertsEnabled
            .sink { UserDefaults.standard.set($0, forKey: "fallRiskAlertsEnabled") }
            .store(in: &cancellables)

        $privacyModeEnabled
            .sink { UserDefaults.standard.set($0, forKey: "privacyModeEnabled") }
            .store(in: &cancellables)
    }

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Configuration Updates
    func updateHealthMonitoringConfig(_ config: HealthMonitoringConfig) {
        healthMonitoringConfig = config
        saveConfiguration()
    }

    func updatePrivacyConfig(_ config: PrivacyConfig) {
        privacyConfig = config
        saveConfiguration()
    }

    func updateUIConfig(_ config: UIConfig) {
        uiConfig = config
        saveConfiguration()
    }

    func completeOnboarding() {
        hasCompletedOnboarding = true
        saveConfiguration()

        print("✅ Onboarding completed")
    }

    // MARK: - Configuration Persistence
    private func saveConfiguration() {
        // Save to UserDefaults
        UserDefaults.standard.set(privacyConfig.shareDataWithResearchers, forKey: "shareDataWithResearchers")
        UserDefaults.standard.set(privacyConfig.enableCloudSync, forKey: "enableCloudSync")
        UserDefaults.standard.set(privacyConfig.requireBiometricAuth, forKey: "requireBiometricAuth")
        UserDefaults.standard.set(uiConfig.enableHapticFeedback, forKey: "enableHapticFeedback")
        UserDefaults.standard.set(uiConfig.fontSize.rawValue, forKey: "fontSize")

        print("💾 Configuration saved")
    }

    // MARK: - Reset Configuration
    func resetToDefaults() {
        let domain = Bundle.main.bundleIdentifier!
        UserDefaults.standard.removePersistentDomain(forName: domain)
        UserDefaults.standard.synchronize()

        // Reload default configuration
        loadConfiguration()

        print("🔄 Configuration reset to defaults")
    }
}

// MARK: - Configuration Errors
enum ConfigurationError: LocalizedError {
    case invalidWebSocketURL
    case invalidAPIBaseURL
    case invalidMonitoringInterval
    case configurationFileNotFound

    var errorDescription: String? {
        switch self {
        case .invalidWebSocketURL:
            return "Invalid WebSocket URL configuration"
        case .invalidAPIBaseURL:
            return "Invalid API base URL configuration"
        case .invalidMonitoringInterval:
            return "Invalid monitoring interval configuration"
        case .configurationFileNotFound:
            return "Configuration file not found"
        }
    }
}

// MARK: - Configuration Extensions
extension AppConfig {
    var isProductionEnvironment: Bool {
        networkConfiguration.webSocketURL.host?.contains("andernet.dev") ?? false
    }

    var isDevelopmentEnvironment: Bool {
        !isProductionEnvironment
    }

    var shouldEnableDebugLogging: Bool {
        #if DEBUG
        return true
        #else
        return isDevelopmentEnvironment
        #endif
    }
}

import Combine
