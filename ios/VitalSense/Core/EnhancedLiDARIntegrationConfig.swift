import Foundation
import HealthKit
import CoreML
import ARKit

/// Enhanced LiDAR Integration Configuration
/// Central configuration for all enhanced LiDAR analysis features
/// Coordinates web-based ML with native iOS capabilities

@available(iOS 14.0, *)
public class EnhancedLiDARIntegrationConfig {

    // MARK: - Singleton

    public static let shared = EnhancedLiDARIntegrationConfig()

    private init() {
        setupIntegrationConfiguration()
    }

    // MARK: - Configuration Properties

    public struct IntegrationSettings {
        public let webMLEndpoint: String
        public let enableNativeML: Bool
        public let fallbackToNative: Bool
        public let enableAppleWatchIntegration: Bool
        public let enableRealTimeStreaming: Bool
        public let maxDataBufferSize: Int
        public let analysisInterval: TimeInterval
        public let enableBackgroundProcessing: Bool

        public static let `default` = IntegrationSettings(
            webMLEndpoint: "ws://localhost:3001/enhanced-ml",
            enableNativeML: true,
            fallbackToNative: true,
            enableAppleWatchIntegration: true,
            enableRealTimeStreaming: true,
            maxDataBufferSize: 1000,
            analysisInterval: 5.0,
            enableBackgroundProcessing: true
        )
    }

    public struct MLModelConfiguration {
        public let gaitAnalysisModelName: String
        public let fallPredictionModelName: String
        public let postureClassificationModelName: String
        public let movementPatternModelName: String
        public let modelUpdateInterval: TimeInterval
        public let confidenceThreshold: Float

        public static let `default` = MLModelConfiguration(
            gaitAnalysisModelName: "GaitAnalysisModel",
            fallPredictionModelName: "FallPredictionModel",
            postureClassificationModelName: "PostureClassificationModel",
            movementPatternModelName: "MovementPatternModel",
            modelUpdateInterval: 3600.0, // 1 hour
            confidenceThreshold: 0.75
        )
    }

    public struct HealthKitConfiguration {
        public let requiredReadTypes: Set<HKObjectType>
        public let requiredShareTypes: Set<HKSampleType>
        public let backgroundDeliveryEnabled: Bool
        public let observerQueryEnabled: Bool

        public static let `default`: HealthKitConfiguration = {
            let readTypes: Set<HKObjectType> = [
                HKObjectType.quantityType(forIdentifier: .heartRate)!,
                HKObjectType.quantityType(forIdentifier: .stepCount)!,
                HKObjectType.quantityType(forIdentifier: .walkingSpeed)!,
                HKObjectType.quantityType(forIdentifier: .walkingStepLength)!,
                HKObjectType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
                HKObjectType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
                HKObjectType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)!,
                HKObjectType.quantityType(forIdentifier: .stairAscentSpeed)!,
                HKObjectType.quantityType(forIdentifier: .stairDescentSpeed)!,
                HKObjectType.categoryType(forIdentifier: .appleWalkingSteadinessEvent)!
            ]

            let shareTypes: Set<HKSampleType> = [
                HKObjectType.quantityType(forIdentifier: .walkingSpeed)!,
                HKObjectType.quantityType(forIdentifier: .walkingStepLength)!,
                HKObjectType.categoryType(forIdentifier: .appleWalkingSteadinessEvent)!
            ]

            return HealthKitConfiguration(
                requiredReadTypes: readTypes,
                requiredShareTypes: shareTypes,
                backgroundDeliveryEnabled: true,
                observerQueryEnabled: true
            )
        }()
    }

    // MARK: - Public Properties

    public var integrationSettings = IntegrationSettings.default
    public var mlModelConfiguration = MLModelConfiguration.default
    public var healthKitConfiguration = HealthKitConfiguration.default

    public private(set) var isConfigured = false
    public private(set) var availableFeatures: Set<EnhancedLiDARFeature> = []

    // MARK: - Feature Availability

    public enum EnhancedLiDARFeature: String, CaseIterable {
        case webMLIntegration = "web_ml_integration"
        case nativeMLProcessing = "native_ml_processing"
        case appleWatchStreaming = "apple_watch_streaming"
        case realTimeAnalysis = "real_time_analysis"
        case backgroundProcessing = "background_processing"
        case arKitIntegration = "arkit_integration"
        case healthKitIntegration = "healthkit_integration"
        case coreMLInference = "coreml_inference"
        case sensorFusion = "sensor_fusion"
        case cloudSync = "cloud_sync"

        public var displayName: String {
            switch self {
            case .webMLIntegration: return "Web ML Integration"
            case .nativeMLProcessing: return "Native ML Processing"
            case .appleWatchStreaming: return "Apple Watch Streaming"
            case .realTimeAnalysis: return "Real-time Analysis"
            case .backgroundProcessing: return "Background Processing"
            case .arKitIntegration: return "ARKit Integration"
            case .healthKitIntegration: return "HealthKit Integration"
            case .coreMLInference: return "CoreML Inference"
            case .sensorFusion: return "Sensor Fusion"
            case .cloudSync: return "Cloud Sync"
            }
        }

        public var isAvailableOnCurrentDevice: Bool {
            switch self {
            case .webMLIntegration:
                return true // Always available with network
            case .nativeMLProcessing:
                return true // Always available
            case .appleWatchStreaming:
                return WCSession.isSupported()
            case .realTimeAnalysis:
                return ProcessInfo.processInfo.processorCount >= 4
            case .backgroundProcessing:
                return UIApplication.shared.backgroundRefreshStatus == .available
            case .arKitIntegration:
                return ARWorldTrackingConfiguration.isSupported
            case .healthKitIntegration:
                return HKHealthStore.isHealthDataAvailable()
            case .coreMLInference:
                return true // Always available on iOS 14+
            case .sensorFusion:
                return CMMotionManager().isDeviceMotionAvailable
            case .cloudSync:
                return true // Depends on network availability
            }
        }
    }

    // MARK: - Setup Methods

    private func setupIntegrationConfiguration() {
        determineAvailableFeatures()
        validateConfiguration()
        isConfigured = true

        NotificationCenter.default.post(
            name: .enhancedLiDARConfigurationReady,
            object: self
        )
    }

    private func determineAvailableFeatures() {
        availableFeatures = Set(
            EnhancedLiDARFeature.allCases.filter { $0.isAvailableOnCurrentDevice }
        )
    }

    private func validateConfiguration() {
        // Validate WebSocket endpoint
        guard URL(string: integrationSettings.webMLEndpoint) != nil else {
            print("Warning: Invalid WebML endpoint URL")
            return
        }

        // Validate required permissions
        if availableFeatures.contains(.healthKitIntegration) {
            validateHealthKitConfiguration()
        }

        // Validate ML model files
        if integrationSettings.enableNativeML {
            validateMLModelFiles()
        }
    }

    private func validateHealthKitConfiguration() {
        let healthStore = HKHealthStore()

        for type in healthKitConfiguration.requiredReadTypes {
            let authStatus = healthStore.authorizationStatus(for: type)
            if authStatus == .notDetermined {
                print("HealthKit authorization needed for: \(type)")
            }
        }
    }

    private func validateMLModelFiles() {
        let modelNames = [
            mlModelConfiguration.gaitAnalysisModelName,
            mlModelConfiguration.fallPredictionModelName,
            mlModelConfiguration.postureClassificationModelName,
            mlModelConfiguration.movementPatternModelName
        ]

        for modelName in modelNames {
            if Bundle.main.url(forResource: modelName, withExtension: "mlmodelc") == nil {
                print("Warning: ML model file not found: \(modelName).mlmodelc")
            }
        }
    }

    // MARK: - Public Configuration Methods

    public func updateIntegrationSettings(_ settings: IntegrationSettings) {
        integrationSettings = settings
        determineAvailableFeatures()
        validateConfiguration()
    }

    public func updateMLConfiguration(_ config: MLModelConfiguration) {
        mlModelConfiguration = config
        validateMLModelFiles()
    }

    public func isFeatureAvailable(_ feature: EnhancedLiDARFeature) -> Bool {
        return availableFeatures.contains(feature)
    }

    public func getFeatureCapabilities() -> [String: Any] {
        var capabilities: [String: Any] = [:]

        for feature in EnhancedLiDARFeature.allCases {
            capabilities[feature.rawValue] = [
                "available": availableFeatures.contains(feature),
                "displayName": feature.displayName,
                "enabled": isFeatureEnabled(feature)
            ]
        }

        return capabilities
    }

    private func isFeatureEnabled(_ feature: EnhancedLiDARFeature) -> Bool {
        guard availableFeatures.contains(feature) else { return false }

        switch feature {
        case .webMLIntegration:
            return true
        case .nativeMLProcessing:
            return integrationSettings.enableNativeML
        case .appleWatchStreaming:
            return integrationSettings.enableAppleWatchIntegration
        case .realTimeAnalysis:
            return integrationSettings.enableRealTimeStreaming
        case .backgroundProcessing:
            return integrationSettings.enableBackgroundProcessing
        case .arKitIntegration:
            return true
        case .healthKitIntegration:
            return true
        case .coreMLInference:
            return integrationSettings.enableNativeML
        case .sensorFusion:
            return true
        case .cloudSync:
            return true
        }
    }
}

// MARK: - Integration Coordinator

@available(iOS 14.0, *)
public class EnhancedLiDARIntegrationCoordinator {

    public static let shared = EnhancedLiDARIntegrationCoordinator()

    private let config = EnhancedLiDARIntegrationConfig.shared
    private let mlManager = EnhancedLiDARMLManager.shared
    private let watchManager = WatchLiDARIntegrationManager.shared
    private let webSocketManager = WebSocketManager.shared

    private var isActive = false

    private init() {
        setupCoordination()
    }

    // MARK: - Coordination Setup

    private func setupCoordination() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(configurationReady),
            name: .enhancedLiDARConfigurationReady,
            object: nil
        )
    }

    @objc private func configurationReady() {
        guard config.isConfigured else { return }

        initializeComponents()
        setupDataFlow()
        startIntegration()
    }

    private func initializeComponents() {
        // Initialize ML Manager
        if config.isFeatureAvailable(.nativeMLProcessing) {
            mlManager.initialize()
        }

        // Initialize Watch Manager
        if config.isFeatureAvailable(.appleWatchStreaming) {
            watchManager.startSession()
        }

        // Setup WebSocket connection
        if config.isFeatureAvailable(.webMLIntegration) {
            setupWebSocketConnection()
        }
    }

    private func setupWebSocketConnection() {
        let endpoint = config.integrationSettings.webMLEndpoint
        webSocketManager.connect(to: endpoint)

        // Setup message handlers for enhanced analysis
        webSocketManager.onMessage = { [weak self] message in
            self?.handleWebSocketMessage(message)
        }
    }

    private func setupDataFlow() {
        // Watch -> ML Manager -> WebSocket flow
        watchManager.onHealthDataUpdate = { [weak self] healthData in
            self?.processHealthData(healthData)
        }

        // ML Manager -> WebSocket results flow
        mlManager.onAnalysisComplete = { [weak self] results in
            self?.sendAnalysisResults(results)
        }
    }

    private func startIntegration() {
        isActive = true

        // Start real-time streaming if enabled
        if config.integrationSettings.enableRealTimeStreaming {
            startRealTimeStreaming()
        }

        // Start background processing if enabled
        if config.integrationSettings.enableBackgroundProcessing {
            enableBackgroundProcessing()
        }

        print("Enhanced LiDAR Integration started with features: \(config.availableFeatures)")
    }

    // MARK: - Data Processing

    private func processHealthData(_ healthData: [String: Any]) {
        guard isActive else { return }

        // Process with native ML if available
        if config.isFeatureAvailable(.nativeMLProcessing) {
            mlManager.processHealthData(healthData)
        }

        // Send to web ML system
        if config.isFeatureAvailable(.webMLIntegration) {
            sendToWebML(healthData)
        }
    }

    private func sendToWebML(_ data: [String: Any]) {
        let message: [String: Any] = [
            "type": "enhanced_health_data",
            "data": data,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_integration"
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: message)
            webSocketManager.send(data: jsonData)
        } catch {
            print("Failed to serialize health data: \(error)")
        }
    }

    private func sendAnalysisResults(_ results: [String: Any]) {
        let message: [String: Any] = [
            "type": "native_analysis_results",
            "results": results,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_coreml"
        ]

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: message)
            webSocketManager.send(data: jsonData)
        } catch {
            print("Failed to serialize analysis results: \(error)")
        }
    }

    private func handleWebSocketMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }

        switch type {
        case "web_analysis_results":
            handleWebAnalysisResults(message)
        case "trigger_analysis":
            triggerNativeAnalysis(message)
        case "configuration_update":
            handleConfigurationUpdate(message)
        default:
            print("Unknown WebSocket message type: \(type)")
        }
    }

    private func handleWebAnalysisResults(_ message: [String: Any]) {
        // Forward results to Apple Watch if connected
        if config.isFeatureAvailable(.appleWatchStreaming) {
            watchManager.sendAnalysisResults(message)
        }

        // Store results locally if needed
        // TODO: Implement local storage
    }

    private func triggerNativeAnalysis(_ message: [String: Any]) {
        guard config.isFeatureAvailable(.nativeMLProcessing) else { return }

        if let analysisType = message["analysisType"] as? String {
            mlManager.triggerAnalysis(type: analysisType)
        } else {
            mlManager.triggerFullAnalysis()
        }
    }

    private func handleConfigurationUpdate(_ message: [String: Any]) {
        // Update configuration based on web system requirements
        print("Received configuration update: \(message)")
    }

    // MARK: - Real-time Features

    private func startRealTimeStreaming() {
        // Start continuous health data streaming
        watchManager.startDataStreaming()

        // Setup periodic analysis triggers
        Timer.scheduledTimer(withTimeInterval: config.integrationSettings.analysisInterval, repeats: true) { _ in
            if self.isActive {
                self.mlManager.triggerPeriodicAnalysis()
            }
        }
    }

    private func enableBackgroundProcessing() {
        // Enable background app refresh
        UIApplication.shared.setMinimumBackgroundFetchInterval(
            UIApplication.backgroundFetchIntervalMinimum
        )
    }

    // MARK: - Public Interface

    public func getIntegrationStatus() -> [String: Any] {
        return [
            "isActive": isActive,
            "availableFeatures": config.availableFeatures.map { $0.rawValue },
            "mlManagerStatus": mlManager.getCurrentStatus(),
            "watchManagerStatus": watchManager.getConnectionStatus(),
            "webSocketStatus": webSocketManager.isConnected ? "connected" : "disconnected"
        ]
    }

    public func triggerManualAnalysis() {
        guard isActive else { return }

        // Trigger both native and web analysis
        if config.isFeatureAvailable(.nativeMLProcessing) {
            mlManager.triggerFullAnalysis()
        }

        if config.isFeatureAvailable(.webMLIntegration) {
            let triggerMessage: [String: Any] = [
                "type": "trigger_analysis",
                "source": "ios_manual",
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]

            do {
                let jsonData = try JSONSerialization.data(withJSONObject: triggerMessage)
                webSocketManager.send(data: jsonData)
            } catch {
                print("Failed to send manual analysis trigger: \(error)")
            }
        }
    }

    public func stopIntegration() {
        isActive = false

        // Stop all components
        watchManager.stopDataStreaming()
        mlManager.stopProcessing()
        webSocketManager.disconnect()

        print("Enhanced LiDAR Integration stopped")
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let enhancedLiDARConfigurationReady = Notification.Name("enhancedLiDARConfigurationReady")
    static let enhancedLiDARAnalysisComplete = Notification.Name("enhancedLiDARAnalysisComplete")
    static let enhancedLiDARConnectionStatusChanged = Notification.Name("enhancedLiDARConnectionStatusChanged")
}

// MARK: - Extensions

extension EnhancedLiDARIntegrationConfig.EnhancedLiDARFeature: Identifiable {
    public var id: String { rawValue }
}
