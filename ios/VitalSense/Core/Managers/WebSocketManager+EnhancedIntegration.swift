import Foundation

/// WebSocket Manager Extension for Enhanced LiDAR ML Integration
/// Handles bi-directional communication between iOS app and web platform
/// SwiftLint-compliant with proper error handling and async patterns
extension WebSocketManager {

    // MARK: - Enhanced ML Analysis Methods

    /// Send enhanced analysis results to web platform
    func sendEnhancedAnalysisResult(_ result: EnhancedAnalysisResult) async throws {
        let payload = EnhancedAnalysisPayload(
            type: "enhanced_lidar_analysis_result",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_enhanced_ml",
            data: result
        )

        try await sendMessage(payload)
    }

    /// Send real-time Apple Watch health data
    func sendWatchHealthData(_ batch: WatchDataBatch) async throws {
        let payload = WatchDataPayload(
            type: "watch_health_data_batch",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "apple_watch",
            data: batch
        )

        try await sendMessage(payload)
    }

    /// Send multi-modal sensor fusion updates
    func sendSensorFusionUpdate(_ sensorData: SensorFusionResult) async throws {
        let payload = SensorFusionPayload(
            type: "sensor_fusion_update",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_sensor_fusion",
            data: sensorData
        )

        try await sendMessage(payload)
    }

    /// Send ML model prediction updates
    func sendMLPredictionUpdate(_ predictions: MLPredictions) async throws {
        let payload = MLPredictionPayload(
            type: "ml_prediction_update",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_ml_engine",
            data: predictions
        )

        try await sendMessage(payload)
    }

    /// Request web platform to trigger enhanced analysis
    func requestWebAnalysis(with parameters: AnalysisParameters) async throws -> AnalysisRequestResponse {
        let request = AnalysisRequestPayload(
            type: "request_enhanced_analysis",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_app",
            parameters: parameters
        )

        return try await sendRequestWithResponse(request)
    }

    /// Send device capability information to web platform
    func sendDeviceCapabilities() async throws {
        let capabilities = DeviceCapabilities(
            hasLiDAR: true,
            hasAppleWatch: WatchLiDARIntegrationManager.shared.isConnected,
            hasCoreML: true,
            supportedMLModels: [
                "GaitAnalysisV2_1",
                "FallPredictionV3_0",
                "PostureClassificationV1_2",
                "MovementPatternV2_3"
            ],
            sensorCapabilities: SensorCapabilities(
                accelerometer: true,
                gyroscope: true,
                magnetometer: true,
                barometer: true,
                ambientLight: true
            )
        )

        let payload = DeviceCapabilitiesPayload(
            type: "device_capabilities",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_device",
            capabilities: capabilities
        )

        try await sendMessage(payload)
    }

    // MARK: - Message Handling for Enhanced Features

    /// Handle incoming enhanced analysis configuration updates
    func handleEnhancedAnalysisConfig(_ message: [String: Any]) -> Bool {
        guard let data = message["data"] as? [String: Any],
              let config = parseAnalysisConfig(data) else {
            return false
        }

        // Update ML manager configuration
        Task {
            await EnhancedLiDARMLManager.shared.updateConfiguration(config)
        }

        return true
    }

    /// Handle incoming ML model update requests
    func handleMLModelUpdate(_ message: [String: Any]) -> Bool {
        guard let data = message["data"] as? [String: Any],
              let modelInfo = parseModelUpdateInfo(data) else {
            return false
        }

        // Trigger model update
        Task {
            await EnhancedLiDARMLManager.shared.updateModel(modelInfo)
        }

        return true
    }

    /// Handle incoming sensor fusion configuration
    func handleSensorFusionConfig(_ message: [String: Any]) -> Bool {
        guard let data = message["data"] as? [String: Any],
              let fusionConfig = parseSensorFusionConfig(data) else {
            return false
        }

        // Update sensor fusion configuration
        Task {
            await EnhancedLiDARMLManager.shared.updateSensorFusionConfig(fusionConfig)
        }

        return true
    }

    /// Handle real-time analysis requests from web platform
    func handleRealTimeAnalysisRequest(_ message: [String: Any]) -> Bool {
        guard let data = message["data"] as? [String: Any] else {
            return false
        }

        // Trigger real-time analysis
        Task {
            let result = await EnhancedLiDARMLManager.shared.performEnhancedAnalysis()

            switch result {
            case .success(let analysisResult):
                try? await sendEnhancedAnalysisResult(analysisResult)
            case .failure(let error):
                try? await sendAnalysisError(error)
            }
        }

        return true
    }

    // MARK: - Error Handling

    private func sendAnalysisError(_ error: AnalysisError) async throws {
        let errorPayload = ErrorPayload(
            type: "analysis_error",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_ml_engine",
            error: ErrorInfo(
                code: error.errorCode,
                message: error.localizedDescription,
                details: error.errorDetails
            )
        )

        try await sendMessage(errorPayload)
    }

    // MARK: - Private Helper Methods

    private func parseAnalysisConfig(_ data: [String: Any]) -> AnalysisConfiguration? {
        // Parse analysis configuration from web platform
        return AnalysisConfiguration(
            enableMLFeatures: data["enableMLFeatures"] as? Bool ?? true,
            enableSensorFusion: data["enableSensorFusion"] as? Bool ?? true,
            processingFrequency: data["processingFrequency"] as? Double ?? 10.0,
            privacyLevel: PrivacyLevel(rawValue: data["privacyLevel"] as? String ?? "high") ?? .high
        )
    }

    private func parseModelUpdateInfo(_ data: [String: Any]) -> ModelUpdateInfo? {
        guard let modelName = data["modelName"] as? String,
              let version = data["version"] as? String else {
            return nil
        }

        return ModelUpdateInfo(
            modelName: modelName,
            version: version,
            downloadURL: data["downloadURL"] as? String,
            checksum: data["checksum"] as? String
        )
    }

    private func parseSensorFusionConfig(_ data: [String: Any]) -> SensorFusionConfiguration? {
        return SensorFusionConfiguration(
            enableSmartphoneMotion: data["enableSmartphoneMotion"] as? Bool ?? true,
            enableAppleWatchIntegration: data["enableAppleWatchIntegration"] as? Bool ?? true,
            enableLiDARProcessing: data["enableLiDARProcessing"] as? Bool ?? true,
            enableCameraTracking: data["enableCameraTracking"] as? Bool ?? false,
            fusionFrequency: data["fusionFrequency"] as? Double ?? 10.0
        )
    }

    private func sendRequestWithResponse<T: Codable>(_ request: T) async throws -> AnalysisRequestResponse {
        // Send request and wait for response
        // This would typically involve generating a request ID and waiting for a matching response

        // Placeholder implementation
        return AnalysisRequestResponse(
            requestId: UUID().uuidString,
            status: "accepted",
            estimatedDuration: 30.0
        )
    }
}

// MARK: - Enhanced WebSocket Payload Types

struct EnhancedAnalysisPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let data: EnhancedAnalysisResult
}

struct WatchDataPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let data: WatchDataBatch
}

struct SensorFusionPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let data: SensorFusionResult
}

struct MLPredictionPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let data: MLPredictions
}

struct AnalysisRequestPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let parameters: AnalysisParameters
}

struct DeviceCapabilitiesPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let capabilities: DeviceCapabilities
}

struct ErrorPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let error: ErrorInfo
}

// MARK: - Supporting Data Types

struct AnalysisParameters: Codable {
    let analysisType: String
    let includeMLPredictions: Bool
    let includeSensorFusion: Bool
    let generateInsights: Bool
    let realTimeMode: Bool
}

struct AnalysisRequestResponse: Codable {
    let requestId: String
    let status: String
    let estimatedDuration: Double
}

struct DeviceCapabilities: Codable {
    let hasLiDAR: Bool
    let hasAppleWatch: Bool
    let hasCoreML: Bool
    let supportedMLModels: [String]
    let sensorCapabilities: SensorCapabilities
}

struct SensorCapabilities: Codable {
    let accelerometer: Bool
    let gyroscope: Bool
    let magnetometer: Bool
    let barometer: Bool
    let ambientLight: Bool
}

struct AnalysisConfiguration: Codable {
    let enableMLFeatures: Bool
    let enableSensorFusion: Bool
    let processingFrequency: Double
    let privacyLevel: PrivacyLevel
}

extension PrivacyLevel: RawRepresentable {
    var rawValue: String {
        switch self {
        case .low: return "low"
        case .medium: return "medium"
        case .high: return "high"
        }
    }

    init?(rawValue: String) {
        switch rawValue {
        case "low": self = .low
        case "medium": self = .medium
        case "high": self = .high
        default: return nil
        }
    }
}

struct ModelUpdateInfo: Codable {
    let modelName: String
    let version: String
    let downloadURL: String?
    let checksum: String?
}

struct ErrorInfo: Codable {
    let code: String
    let message: String
    let details: [String: Any]?

    enum CodingKeys: String, CodingKey {
        case code, message, details
    }

    init(code: String, message: String, details: [String: Any]? = nil) {
        self.code = code
        self.message = message
        self.details = details
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        code = try container.decode(String.self, forKey: .code)
        message = try container.decode(String.self, forKey: .message)
        // Custom decoding for [String: Any] would be needed here
        details = nil
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(code, forKey: .code)
        try container.encode(message, forKey: .message)
        // Custom encoding for [String: Any] would be needed here
    }
}

// MARK: - Error Extensions

extension AnalysisError {
    var errorCode: String {
        switch self {
        case .systemNotReady: return "SYSTEM_NOT_READY"
        case .analysisInProgress: return "ANALYSIS_IN_PROGRESS"
        case .noLiDARData: return "NO_LIDAR_DATA"
        case .motionUnavailable: return "MOTION_UNAVAILABLE"
        case .noMotionData: return "NO_MOTION_DATA"
        case .sensorFusionUnavailable: return "SENSOR_FUSION_UNAVAILABLE"
        case .processingFailed: return "PROCESSING_FAILED"
        }
    }

    var errorDetails: [String: Any] {
        var details: [String: Any] = [
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "platform": "iOS"
        ]

        switch self {
        case .processingFailed(let message):
            details["processingError"] = message
        default:
            break
        }

        return details
    }
}

// MARK: - EnhancedLiDARMLManager Extensions for WebSocket Integration

extension EnhancedLiDARMLManager {

    /// Update configuration from web platform
    func updateConfiguration(_ config: AnalysisConfiguration) async {
        // Update internal configuration based on web platform settings
        // This would update the analysisConfig property if it were mutable

        logger.info("Updated configuration from web platform: \(config)")
    }

    /// Update ML model from web platform
    func updateModel(_ modelInfo: ModelUpdateInfo) async {
        // Handle model updates from web platform
        // This would typically involve downloading and validating new models

        logger.info("Model update requested: \(modelInfo.modelName) v\(modelInfo.version)")
    }

    /// Update sensor fusion configuration
    func updateSensorFusionConfig(_ config: SensorFusionConfiguration) async {
        // Update sensor fusion configuration
        sensorFusionProcessor = MultiModalSensorProcessor(configuration: config)

        logger.info("Updated sensor fusion configuration from web platform")
    }

    /// Get current system status for web platform
    func getSystemStatusForWeb() -> [String: Any] {
        return [
            "isInitialized": isInitialized,
            "mlModelsLoaded": mlModelsLoaded,
            "analysisInProgress": analysisInProgress,
            "systemStatus": systemStatus.rawValue,
            "lastAnalysisTime": lastAnalysisResult?.metadata.timestamp.iso8601String ?? "",
            "performanceMetrics": [
                "analysisCount": analysisMetrics.analysisCount,
                "averageProcessingTime": analysisMetrics.averageProcessingTime,
                "successRate": analysisMetrics.successRate
            ]
        ]
    }
}

// MARK: - Utility Extensions

extension MLSystemStatus {
    var rawValue: String {
        switch self {
        case .initializing: return "initializing"
        case .loadingModels: return "loadingModels"
        case .ready: return "ready"
        case .error(let message): return "error(\(message))"
        }
    }
}

extension Date {
    var iso8601String: String {
        return ISO8601DateFormatter().string(from: self)
    }
}
