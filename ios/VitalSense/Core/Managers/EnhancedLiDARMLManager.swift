import Foundation
import Combine
import CoreML
import Vision
import CoreMotion
import ARKit
import HealthKit

/// Enhanced LiDAR ML Integration Manager for iOS
/// Integrates TensorFlow.js-style ML models with iOS CoreML for comprehensive health analysis
/// SwiftLint-compliant: proper line breaks and multi-line initializers
@MainActor
final class EnhancedLiDARMLManager: ObservableObject {
    static let shared = EnhancedLiDARMLManager()

    // MARK: - Published Properties
    @Published private(set) var isInitialized: Bool = false
    @Published private(set) var mlModelsLoaded: Bool = false
    @Published private(set) var analysisInProgress: Bool = false
    @Published private(set) var lastAnalysisResult: EnhancedAnalysisResult?
    @Published private(set) var systemStatus: MLSystemStatus = .initializing

    // MARK: - Core ML Models
    private var gaitAnalysisModel: MLModel?
    private var fallPredictionModel: MLModel?
    private var postureClassificationModel: MLModel?
    private var movementPatternModel: MLModel?

    // MARK: - Manager Dependencies
    private let healthKitManager = HealthKitManager.shared
    private let webSocketManager = WebSocketManager.shared
    private let lidarSessionManager = LiDARSessionManager.shared
    private let motionManager = CMMotionManager()

    // MARK: - Sensor Fusion Components
    private var sensorFusionProcessor: MultiModalSensorProcessor?
    private var kalmanFilter: KalmanFilterProcessor?

    // MARK: - Analysis Configuration
    private let analysisConfig = MLAnalysisConfiguration(
        gaitModelVersion: "2.1.0",
        fallPredictionVersion: "3.0.1",
        postureModelVersion: "1.2.0",
        movementPatternVersion: "2.3.0",
        processingFrequency: 10.0, // 10Hz
        enableFederatedLearning: true,
        privacyLevel: .high
    )

    // MARK: - Combine Publishers
    private var cancellables = Set<AnyCancellable>()
    private let analysisSubject = PassthroughSubject<EnhancedAnalysisResult, Never>()

    // MARK: - Performance Monitoring
    private var analysisMetrics = PerformanceMetrics()
    private let logger = Logger(subsystem: "com.vitalsense.ml", category: "EnhancedLiDARML")

    private init() {
        setupSensorFusion()
        loadMLModels()
        configureMotionManager()
    }

    // MARK: - Initialization

    private func setupSensorFusion() {
        sensorFusionProcessor = MultiModalSensorProcessor(
            configuration: SensorFusionConfiguration(
                enableSmartphoneMotion: true,
                enableAppleWatchIntegration: true,
                enableLiDARProcessing: true,
                enableCameraTracking: true,
                fusionFrequency: 10.0
            )
        )

        kalmanFilter = KalmanFilterProcessor(
            stateTransitionModel: createStateTransitionMatrix(),
            observationModel: createObservationMatrix(),
            processNoise: 0.01,
            measurementNoise: 0.1
        )
    }

    private func loadMLModels() {
        Task {
            do {
                systemStatus = .loadingModels

                // Load CoreML models asynchronously
                async let gaitModel = loadGaitAnalysisModel()
                async let fallModel = loadFallPredictionModel()
                async let postureModel = loadPostureClassificationModel()
                async let movementModel = loadMovementPatternModel()

                // Wait for all models to load
                let models = try await (gaitModel, fallModel, postureModel, movementModel)

                gaitAnalysisModel = models.0
                fallPredictionModel = models.1
                postureClassificationModel = models.2
                movementPatternModel = models.3

                mlModelsLoaded = true
                systemStatus = .ready
                isInitialized = true

                logger.info("All ML models loaded successfully")

            } catch {
                logger.error("Failed to load ML models: \(error.localizedDescription)")
                systemStatus = .error(error.localizedDescription)
            }
        }
    }

    private func configureMotionManager() {
        motionManager.deviceMotionUpdateInterval = 1.0 / analysisConfig.processingFrequency
        motionManager.accelerometerUpdateInterval = 1.0 / analysisConfig.processingFrequency
        motionManager.gyroUpdateInterval = 1.0 / analysisConfig.processingFrequency
    }

    // MARK: - Model Loading

    private func loadGaitAnalysisModel() async throws -> MLModel {
        guard let modelURL = Bundle.main.url(forResource: "GaitAnalysisV2_1", withExtension: "mlmodelc") else {
            throw MLModelError.modelNotFound("GaitAnalysisV2_1.mlmodelc")
        }
        return try MLModel(contentsOf: modelURL)
    }

    private func loadFallPredictionModel() async throws -> MLModel {
        guard let modelURL = Bundle.main.url(forResource: "FallPredictionV3_0", withExtension: "mlmodelc") else {
            throw MLModelError.modelNotFound("FallPredictionV3_0.mlmodelc")
        }
        return try MLModel(contentsOf: modelURL)
    }

    private func loadPostureClassificationModel() async throws -> MLModel {
        guard let modelURL = Bundle.main.url(forResource: "PostureClassificationV1_2", withExtension: "mlmodelc") else {
            throw MLModelError.modelNotFound("PostureClassificationV1_2.mlmodelc")
        }
        return try MLModel(contentsOf: modelURL)
    }

    private func loadMovementPatternModel() async throws -> MLModel {
        guard let modelURL = Bundle.main.url(forResource: "MovementPatternV2_3", withExtension: "mlmodelc") else {
            throw MLModelError.modelNotFound("MovementPatternV2_3.mlmodelc")
        }
        return try MLModel(contentsOf: modelURL)
    }

    // MARK: - Enhanced Analysis

    func performEnhancedAnalysis() async -> Result<EnhancedAnalysisResult, AnalysisError> {
        guard isInitialized && mlModelsLoaded else {
            return .failure(.systemNotReady)
        }

        guard !analysisInProgress else {
            return .failure(.analysisInProgress)
        }

        analysisInProgress = true
        let startTime = CFAbsoluteTimeGetCurrent()

        do {
            // Step 1: Collect multi-modal sensor data
            let sensorData = try await collectMultiModalData()

            // Step 2: Apply sensor fusion
            let fusedData = try await applySensorFusion(sensorData)

            // Step 3: Run ML predictions
            let mlPredictions = try await runMLPredictions(fusedData)

            // Step 4: Generate insights
            let insights = try await generateEnhancedInsights(mlPredictions, fusedData)

            // Step 5: Calculate analysis quality
            let processingTime = CFAbsoluteTimeGetCurrent() - startTime
            let qualityScore = calculateAnalysisQuality(mlPredictions, fusedData)

            let result = EnhancedAnalysisResult(
                mlPredictions: mlPredictions,
                sensorFusion: fusedData,
                insights: insights,
                metadata: AnalysisMetadata(
                    analysisQuality: qualityScore,
                    processingTime: processingTime,
                    dataPoints: sensorData.totalDataPoints,
                    timestamp: Date(),
                    modelVersions: analysisConfig.modelVersions
                )
            )

            lastAnalysisResult = result
            analysisSubject.send(result)

            // Stream to web platform
            try await streamResultToWeb(result)

            analysisInProgress = false
            return .success(result)

        } catch {
            analysisInProgress = false
            logger.error("Enhanced analysis failed: \(error.localizedDescription)")
            return .failure(.processingFailed(error.localizedDescription))
        }
    }

    // MARK: - Data Collection

    private func collectMultiModalData() async throws -> MultiModalSensorData {
        let dataCollectionStart = CFAbsoluteTimeGetCurrent()

        // Collect from multiple sources concurrently
        async let lidarData = collectLiDARData()
        async let motionData = collectMotionData()
        async let healthKitData = collectHealthKitData()
        async let environmentalData = collectEnvironmentalData()

        let allData = try await (lidarData, motionData, healthKitData, environmentalData)

        let collectionTime = CFAbsoluteTimeGetCurrent() - dataCollectionStart

        return MultiModalSensorData(
            lidarPoints: allData.0,
            motionMetrics: allData.1,
            healthMetrics: allData.2,
            environmentalContext: allData.3,
            collectionDuration: collectionTime,
            timestamp: Date()
        )
    }

    private func collectLiDARData() async throws -> LiDARPointCloud {
        // Get latest LiDAR session data
        guard let sessionData = lidarSessionManager.lastPayload else {
            throw AnalysisError.noLiDARData
        }

        return LiDARPointCloud(
            points: sessionData.pointCloudData ?? [],
            confidence: sessionData.qualityScore ?? 100,
            frameRate: sessionData.frameRate ?? 30,
            timestamp: Date()
        )
    }

    private func collectMotionData() async throws -> MotionMetrics {
        guard motionManager.isDeviceMotionAvailable else {
            throw AnalysisError.motionUnavailable
        }

        return try await withCheckedThrowingContinuation { continuation in
            motionManager.startDeviceMotionUpdates(
                using: .xMagneticNorthZVertical,
                to: .main
            ) { motion, error in
                self.motionManager.stopDeviceMotionUpdates()

                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let motion = motion else {
                    continuation.resume(throwing: AnalysisError.noMotionData)
                    return
                }

                let metrics = MotionMetrics(
                    acceleration: motion.userAcceleration,
                    rotation: motion.rotationRate,
                    attitude: motion.attitude,
                    gravity: motion.gravity,
                    timestamp: Date()
                )

                continuation.resume(returning: metrics)
            }
        }
    }

    private func collectHealthKitData() async throws -> HealthMetrics {
        // Get recent health data from HealthKit
        let recentMetrics = try await healthKitManager.fetchRecentHealthMetrics()

        return HealthMetrics(
            heartRate: recentMetrics.heartRate,
            walkingSteadiness: recentMetrics.walkingSteadiness,
            stepCount: recentMetrics.stepCount,
            walkingSpeed: recentMetrics.walkingSpeed,
            timestamp: Date()
        )
    }

    private func collectEnvironmentalData() async throws -> EnvironmentalContext {
        // Collect environmental sensors data
        return EnvironmentalContext(
            lightLevel: await measureAmbientLight(),
            proximityState: await checkProximityState(),
            batteryLevel: UIDevice.current.batteryLevel,
            timestamp: Date()
        )
    }

    // MARK: - Sensor Fusion

    private func applySensorFusion(_ data: MultiModalSensorData) async throws -> SensorFusionResult {
        guard let processor = sensorFusionProcessor,
              let filter = kalmanFilter else {
            throw AnalysisError.sensorFusionUnavailable
        }

        // Apply Kalman filtering
        let filteredData = try await filter.process(data)

        // Combine sensor modalities
        let fusedResult = try await processor.fuseSensorData(filteredData)

        return SensorFusionResult(
            combinedStability: fusedResult.stabilityScore,
            coordinationScore: fusedResult.coordinationMetrics,
            symmetryIndex: fusedResult.movementSymmetry,
            fluidityRating: fusedResult.movementFluidity,
            overallRiskScore: fusedResult.riskAssessment,
            contributingSensors: fusedResult.activeSensors,
            confidence: fusedResult.fusionConfidence
        )
    }

    // MARK: - ML Predictions

    private func runMLPredictions(_ fusedData: SensorFusionResult) async throws -> MLPredictions {
        let predictionStart = CFAbsoluteTimeGetCurrent()

        // Run all ML models concurrently
        async let gaitPrediction = predictGaitPattern(fusedData)
        async let fallRiskPrediction = predictFallRisk(fusedData)
        async let posturePrediction = classifyPosture(fusedData)

        let predictions = try await (gaitPrediction, fallRiskPrediction, posturePrediction)

        let predictionTime = CFAbsoluteTimeGetCurrent() - predictionStart

        return MLPredictions(
            gaitPattern: predictions.0,
            fallRisk: predictions.1,
            postureAssessment: predictions.2,
            processingTime: predictionTime,
            modelConfidence: calculateOverallConfidence(predictions)
        )
    }

    private func predictGaitPattern(_ data: SensorFusionResult) async throws -> GaitPrediction {
        guard let model = gaitAnalysisModel else {
            throw MLModelError.modelNotLoaded("Gait Analysis")
        }

        let inputFeatures = createGaitFeatureVector(data)
        let prediction = try model.prediction(from: inputFeatures)

        return GaitPrediction(
            classification: extractGaitClassification(prediction),
            confidence: extractConfidenceScore(prediction),
            riskScore: extractRiskScore(prediction)
        )
    }

    private func predictFallRisk(_ data: SensorFusionResult) async throws -> FallRiskPrediction {
        guard let model = fallPredictionModel else {
            throw MLModelError.modelNotLoaded("Fall Prediction")
        }

        let inputFeatures = createFallRiskFeatureVector(data)
        let prediction = try model.prediction(from: inputFeatures)

        return FallRiskPrediction(
            level: extractRiskLevel(prediction),
            probability: extractProbability(prediction),
            timeToRisk: extractTimeHorizon(prediction)
        )
    }

    private func classifyPosture(_ data: SensorFusionResult) async throws -> PosturePrediction {
        guard let model = postureClassificationModel else {
            throw MLModelError.modelNotLoaded("Posture Classification")
        }

        let inputFeatures = createPostureFeatureVector(data)
        let prediction = try model.prediction(from: inputFeatures)

        return PosturePrediction(
            alignment: extractPostureAlignment(prediction),
            compensations: extractCompensations(prediction),
            recommendations: generatePostureRecommendations(prediction)
        )
    }

    // MARK: - Insights Generation

    private func generateEnhancedInsights(
        _ predictions: MLPredictions,
        _ fusedData: SensorFusionResult
    ) async throws -> AnalysisInsights {
        let insightEngine = InsightEngine(
            mlPredictions: predictions,
            sensorData: fusedData,
            userProfile: await loadUserProfile()
        )

        return AnalysisInsights(
            primaryConcerns: insightEngine.identifyPrimaryConcerns(),
            improvementAreas: insightEngine.suggestImprovements(),
            personalizationTips: insightEngine.generatePersonalizedTips(),
            nextSteps: insightEngine.recommendNextSteps()
        )
    }

    // MARK: - Web Integration

    private func streamResultToWeb(_ result: EnhancedAnalysisResult) async throws {
        let payload = WebSocketPayload(
            type: "enhanced_lidar_analysis",
            timestamp: ISO8601DateFormatter().string(from: Date()),
            source: "ios_enhanced_ml",
            data: result.toWebSocketData()
        )

        try await webSocketManager.sendMessage(payload)
    }

    // MARK: - Utility Methods

    private func calculateAnalysisQuality(
        _ predictions: MLPredictions,
        _ fusedData: SensorFusionResult
    ) -> Double {
        let mlQuality = predictions.modelConfidence * 0.6
        let sensorQuality = fusedData.confidence * 0.4
        return min(100.0, (mlQuality + sensorQuality) * 100)
    }

    private func createStateTransitionMatrix() -> [[Double]] {
        // 6x6 matrix for position, velocity, acceleration in 3D
        return [
            [1, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 1],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ]
    }

    private func createObservationMatrix() -> [[Double]] {
        // 3x6 matrix observing position from state
        return [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0]
        ]
    }

    // MARK: - Helper Methods for Model Integration

    private func measureAmbientLight() async -> Double {
        // Placeholder for ambient light measurement
        return 0.5
    }

    private func checkProximityState() async -> Bool {
        return UIDevice.current.proximityState
    }

    private func loadUserProfile() async -> UserProfile {
        // Load user profile from persistent storage
        return UserProfile.default
    }

    // Additional helper methods for ML feature extraction...
    private func createGaitFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for gait analysis
        // Implementation depends on your specific model input requirements
        fatalError("Implement based on your trained model's input specification")
    }

    private func createFallRiskFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for fall risk prediction
        fatalError("Implement based on your trained model's input specification")
    }

    private func createPostureFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for posture classification
        fatalError("Implement based on your trained model's input specification")
    }

    private func extractGaitClassification(_ prediction: MLFeatureProvider) -> String {
        // Extract classification from model output
        return "normal" // Placeholder
    }

    private func extractConfidenceScore(_ prediction: MLFeatureProvider) -> Double {
        // Extract confidence score from model output
        return 0.95 // Placeholder
    }

    private func extractRiskScore(_ prediction: MLFeatureProvider) -> Double {
        // Extract risk score from model output
        return 15.0 // Placeholder
    }

    private func extractRiskLevel(_ prediction: MLFeatureProvider) -> String {
        return "low" // Placeholder
    }

    private func extractProbability(_ prediction: MLFeatureProvider) -> Double {
        return 0.1 // Placeholder
    }

    private func extractTimeHorizon(_ prediction: MLFeatureProvider) -> Double {
        return 72.0 // Placeholder - hours
    }

    private func extractPostureAlignment(_ prediction: MLFeatureProvider) -> String {
        return "good" // Placeholder
    }

    private func extractCompensations(_ prediction: MLFeatureProvider) -> [String] {
        return [] // Placeholder
    }

    private func generatePostureRecommendations(_ prediction: MLFeatureProvider) -> [String] {
        return ["Maintain current posture"] // Placeholder
    }

    private func calculateOverallConfidence(_ predictions: (GaitPrediction, FallRiskPrediction, PosturePrediction)) -> Double {
        let avg = (predictions.0.confidence + predictions.1.probability + 0.9) / 3.0
        return avg
    }
}

// MARK: - Supporting Types

enum MLSystemStatus {
    case initializing
    case loadingModels
    case ready
    case error(String)
}

enum MLModelError: Error {
    case modelNotFound(String)
    case modelNotLoaded(String)
    case predictionFailed(String)
}

enum AnalysisError: Error {
    case systemNotReady
    case analysisInProgress
    case noLiDARData
    case motionUnavailable
    case noMotionData
    case sensorFusionUnavailable
    case processingFailed(String)
}

struct MLAnalysisConfiguration {
    let gaitModelVersion: String
    let fallPredictionVersion: String
    let postureModelVersion: String
    let movementPatternVersion: String
    let processingFrequency: Double
    let enableFederatedLearning: Bool
    let privacyLevel: PrivacyLevel

    var modelVersions: [String: String] {
        return [
            "gait": gaitModelVersion,
            "fall": fallPredictionVersion,
            "posture": postureModelVersion,
            "movement": movementPatternVersion
        ]
    }
}

enum PrivacyLevel {
    case low, medium, high
}

// Data structures for enhanced analysis
struct EnhancedAnalysisResult: Codable {
    let mlPredictions: MLPredictions
    let sensorFusion: SensorFusionResult
    let insights: AnalysisInsights
    let metadata: AnalysisMetadata

    func toWebSocketData() -> [String: Any] {
        // Convert to dictionary for WebSocket transmission
        return [
            "mlPredictions": mlPredictions.toDictionary(),
            "sensorFusion": sensorFusion.toDictionary(),
            "insights": insights.toDictionary(),
            "metadata": metadata.toDictionary()
        ]
    }
}

struct MLPredictions: Codable {
    let gaitPattern: GaitPrediction
    let fallRisk: FallRiskPrediction
    let postureAssessment: PosturePrediction
    let processingTime: Double
    let modelConfidence: Double

    func toDictionary() -> [String: Any] {
        return [
            "gaitPattern": gaitPattern.toDictionary(),
            "fallRisk": fallRisk.toDictionary(),
            "postureAssessment": postureAssessment.toDictionary(),
            "processingTime": processingTime,
            "modelConfidence": modelConfidence
        ]
    }
}

struct GaitPrediction: Codable {
    let classification: String
    let confidence: Double
    let riskScore: Double

    func toDictionary() -> [String: Any] {
        return [
            "classification": classification,
            "confidence": confidence,
            "riskScore": riskScore
        ]
    }
}

struct FallRiskPrediction: Codable {
    let level: String
    let probability: Double
    let timeToRisk: Double

    func toDictionary() -> [String: Any] {
        return [
            "level": level,
            "probability": probability,
            "timeToRisk": timeToRisk
        ]
    }
}

struct PosturePrediction: Codable {
    let alignment: String
    let compensations: [String]
    let recommendations: [String]

    func toDictionary() -> [String: Any] {
        return [
            "alignment": alignment,
            "compensations": compensations,
            "recommendations": recommendations
        ]
    }
}

struct SensorFusionResult: Codable {
    let combinedStability: Double
    let coordinationScore: Double
    let symmetryIndex: Double
    let fluidityRating: Double
    let overallRiskScore: Double
    let contributingSensors: [String]
    let confidence: Double

    func toDictionary() -> [String: Any] {
        return [
            "combinedStability": combinedStability,
            "coordinationScore": coordinationScore,
            "symmetryIndex": symmetryIndex,
            "fluidityRating": fluidityRating,
            "overallRiskScore": overallRiskScore,
            "contributingSensors": contributingSensors,
            "confidence": confidence
        ]
    }
}

struct AnalysisInsights: Codable {
    let primaryConcerns: [String]
    let improvementAreas: [String]
    let personalizationTips: [String]
    let nextSteps: [String]

    func toDictionary() -> [String: Any] {
        return [
            "primaryConcerns": primaryConcerns,
            "improvementAreas": improvementAreas,
            "personalizationTips": personalizationTips,
            "nextSteps": nextSteps
        ]
    }
}

struct AnalysisMetadata: Codable {
    let analysisQuality: Double
    let processingTime: Double
    let dataPoints: Int
    let timestamp: Date
    let modelVersions: [String: String]

    func toDictionary() -> [String: Any] {
        return [
            "analysisQuality": analysisQuality,
            "processingTime": processingTime,
            "dataPoints": dataPoints,
            "timestamp": ISO8601DateFormatter().string(from: timestamp),
            "modelVersions": modelVersions
        ]
    }
}

// Additional supporting types
struct MultiModalSensorData {
    let lidarPoints: LiDARPointCloud
    let motionMetrics: MotionMetrics
    let healthMetrics: HealthMetrics
    let environmentalContext: EnvironmentalContext
    let collectionDuration: Double
    let timestamp: Date

    var totalDataPoints: Int {
        return lidarPoints.points.count + 100 // Approximation
    }
}

struct LiDARPointCloud {
    let points: [SIMD3<Float>]
    let confidence: Int
    let frameRate: Double
    let timestamp: Date
}

struct MotionMetrics {
    let acceleration: CMAcceleration
    let rotation: CMRotationRate
    let attitude: CMAttitude
    let gravity: CMAcceleration
    let timestamp: Date
}

struct HealthMetrics {
    let heartRate: Double?
    let walkingSteadiness: Double?
    let stepCount: Int?
    let walkingSpeed: Double?
    let timestamp: Date
}

struct EnvironmentalContext {
    let lightLevel: Double
    let proximityState: Bool
    let batteryLevel: Float
    let timestamp: Date
}

struct PerformanceMetrics {
    var analysisCount: Int = 0
    var averageProcessingTime: Double = 0.0
    var successRate: Double = 1.0
}

struct UserProfile {
    let userId: String
    let age: Int?
    let conditions: [String]

    static let `default` = UserProfile(userId: "default", age: nil, conditions: [])
}

// Placeholder classes for sensor fusion components
class MultiModalSensorProcessor {
    init(configuration: SensorFusionConfiguration) {}

    func fuseSensorData(_ data: MultiModalSensorData) async throws -> SensorFusionProcessedResult {
        return SensorFusionProcessedResult(
            stabilityScore: 85.0,
            coordinationMetrics: 78.0,
            movementSymmetry: 82.0,
            movementFluidity: 80.0,
            riskAssessment: 15.0,
            activeSensors: ["lidar", "motion", "healthkit"],
            fusionConfidence: 0.9
        )
    }
}

class KalmanFilterProcessor {
    init(stateTransitionModel: [[Double]], observationModel: [[Double]], processNoise: Double, measurementNoise: Double) {}

    func process(_ data: MultiModalSensorData) async throws -> MultiModalSensorData {
        return data // Placeholder - return filtered data
    }
}

struct SensorFusionConfiguration {
    let enableSmartphoneMotion: Bool
    let enableAppleWatchIntegration: Bool
    let enableLiDARProcessing: Bool
    let enableCameraTracking: Bool
    let fusionFrequency: Double
}

struct SensorFusionProcessedResult {
    let stabilityScore: Double
    let coordinationMetrics: Double
    let movementSymmetry: Double
    let movementFluidity: Double
    let riskAssessment: Double
    let activeSensors: [String]
    let fusionConfidence: Double
}

class InsightEngine {
    private let mlPredictions: MLPredictions
    private let sensorData: SensorFusionResult
    private let userProfile: UserProfile

    init(mlPredictions: MLPredictions, sensorData: SensorFusionResult, userProfile: UserProfile) {
        self.mlPredictions = mlPredictions
        self.sensorData = sensorData
        self.userProfile = userProfile
    }

    func identifyPrimaryConcerns() -> [String] {
        var concerns: [String] = []

        if mlPredictions.gaitPattern.riskScore > 20 {
            concerns.append("Gait instability detected")
        }

        if mlPredictions.fallRisk.level == "high" {
            concerns.append("Elevated fall risk")
        }

        if sensorData.combinedStability < 70 {
            concerns.append("Stability concerns identified")
        }

        return concerns.isEmpty ? ["No significant concerns identified"] : concerns
    }

    func suggestImprovements() -> [String] {
        var improvements: [String] = []

        if mlPredictions.gaitPattern.riskScore > 20 {
            improvements.append("Balance training recommended")
        }

        if sensorData.combinedStability < 70 {
            improvements.append("Core strengthening exercises")
        }

        if sensorData.symmetryIndex < 75 {
            improvements.append("Address movement asymmetries")
        }

        return improvements.isEmpty ? ["Maintain current activity level"] : improvements
    }

    func generatePersonalizedTips() -> [String] {
        return [
            "Customize exercise routine based on findings",
            "Track progress with regular assessments",
            "Consider consulting a physical therapist"
        ]
    }

    func recommendNextSteps() -> [String] {
        var steps: [String] = []

        if mlPredictions.fallRisk.level == "high" {
            steps.append("Consult healthcare provider")
        }

        steps.append("Schedule next assessment in 2 weeks")

        return steps
    }
}

struct WebSocketPayload: Codable {
    let type: String
    let timestamp: String
    let source: String
    let data: [String: Any]

    init(type: String, timestamp: String, source: String, data: [String: Any]) {
        self.type = type
        self.timestamp = timestamp
        self.source = source
        self.data = data
    }

    enum CodingKeys: String, CodingKey {
        case type, timestamp, source, data
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(type, forKey: .type)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(source, forKey: .source)
        // Note: Encoding [String: Any] requires custom handling
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(String.self, forKey: .type)
        timestamp = try container.decode(String.self, forKey: .timestamp)
        source = try container.decode(String.self, forKey: .source)
        // Note: Decoding [String: Any] requires custom handling
        data = [:]
    }
}
