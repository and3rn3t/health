import Foundation
import Combine
import CoreML
import Vision
import CoreMotion
import ARKit
import HealthKit
import UIKit

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

                // Load CoreML models asynchronously with fallback
                async let gaitModel = loadGaitAnalysisModel()
                async let fallModel = loadFallPredictionModel()
                async let postureModel = loadPostureClassificationModel()
                async let movementModel = loadMovementPatternModel()

                // Wait for all models to load (allow partial failures)
                // Use withTaskGroup to handle errors individually
                let gaitResult: Result<MLModel, Error> = await withCheckedContinuation { continuation in
                    Task {
                        do {
                            let model = try await gaitModel
                            continuation.resume(returning: .success(model))
                        } catch {
                            continuation.resume(returning: .failure(error))
                        }
                    }
                }

                let fallResult: Result<MLModel, Error> = await withCheckedContinuation { continuation in
                    Task {
                        do {
                            let model = try await fallModel
                            continuation.resume(returning: .success(model))
                        } catch {
                            continuation.resume(returning: .failure(error))
                        }
                    }
                }

                let postureResult: Result<MLModel, Error> = await withCheckedContinuation { continuation in
                    Task {
                        do {
                            let model = try await postureModel
                            continuation.resume(returning: .success(model))
                        } catch {
                            continuation.resume(returning: .failure(error))
                        }
                    }
                }

                let movementResult: Result<MLModel, Error> = await withCheckedContinuation { continuation in
                    Task {
                        do {
                            let model = try await movementModel
                            continuation.resume(returning: .success(model))
                        } catch {
                            continuation.resume(returning: .failure(error))
                        }
                    }
                }

                // Set models that loaded successfully
                if case .success(let model) = gaitResult {
                    gaitAnalysisModel = model
                } else {
                    logger.warning("Gait analysis model not found - using fallback")
                }

                if case .success(let model) = fallResult {
                    fallPredictionModel = model
                } else {
                    logger.warning("Fall prediction model not found - using fallback")
                }

                if case .success(let model) = postureResult {
                    postureClassificationModel = model
                } else {
                    logger.warning("Posture classification model not found - using fallback")
                }

                if case .success(let model) = movementResult {
                    movementPatternModel = model
                } else {
                    logger.warning("Movement pattern model not found - using fallback")
                }

                // Mark as ready even if some models are missing (we have fallbacks)
                mlModelsLoaded = true
                systemStatus = .ready
                isInitialized = true

                if gaitAnalysisModel != nil || fallPredictionModel != nil || postureClassificationModel != nil {
                    logger.info("ML models loaded successfully (some may use fallback)")
                } else {
                    logger.info("No ML models found - all predictions will use rule-based fallbacks")
                }

            } catch {
                logger.error("Failed to load ML models: \(error.localizedDescription)")
                ErrorHandler.shared.handle(
                    error,
                    context: "Loading ML models",
                    category: .ml,
                    severity: .medium,
                    recovery: .fallback
                )

                // Still mark as initialized with fallback mode
                mlModelsLoaded = true
                systemStatus = .ready
                isInitialized = true
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
        // Try to load from bundle first
        if let modelURL = Bundle.main.url(forResource: "GaitAnalysisV2_1", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        // Try alternative names
        if let modelURL = Bundle.main.url(forResource: "GaitAnalysis", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        // Try to load from downloaded models
        let downloadManager = MLModelDownloadManager.shared
        if let modelPath = downloadManager.getLocalModelPath(modelName: "GaitAnalysis", version: "2.1.0") {
            return try MLModel(contentsOf: modelPath)
        }

        // Try alternative downloaded versions
        for version in ["2.1", "2.0", "1.0"] {
            if let modelPath = downloadManager.getLocalModelPath(modelName: "GaitAnalysis", version: version) {
                return try MLModel(contentsOf: modelPath)
            }
        }

        // Try downloading from server
        do {
            let availableModels = try await downloadManager.fetchAvailableModels()
            if let gaitModel = availableModels.first(where: { $0.name.lowercased().contains("gait") }) {
                let modelURL = try await downloadManager.downloadModel(gaitModel)
                return try MLModel(contentsOf: modelURL)
            }
        } catch {
            logger.warning("Failed to download gait model: \(error.localizedDescription)")
        }

        throw MLModelError.modelNotFound("GaitAnalysisV2_1.mlmodelc")
    }

    private func loadFallPredictionModel() async throws -> MLModel {
        // Try bundle first
        if let modelURL = Bundle.main.url(forResource: "FallPredictionV3_0", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        if let modelURL = Bundle.main.url(forResource: "FallPrediction", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        // Try downloaded models
        let downloadManager = MLModelDownloadManager.shared
        if let modelPath = downloadManager.getLocalModelPath(modelName: "FallPrediction", version: "3.0.0") {
            return try MLModel(contentsOf: modelPath)
        }

        // Try downloading
        do {
            let availableModels = try await downloadManager.fetchAvailableModels()
            if let fallModel = availableModels.first(where: { $0.name.lowercased().contains("fall") }) {
                let modelURL = try await downloadManager.downloadModel(fallModel)
                return try MLModel(contentsOf: modelURL)
            }
        } catch {
            logger.warning("Failed to download fall prediction model: \(error.localizedDescription)")
        }

        throw MLModelError.modelNotFound("FallPredictionV3_0.mlmodelc")
    }

    private func loadPostureClassificationModel() async throws -> MLModel {
        // Try bundle first
        if let modelURL = Bundle.main.url(forResource: "PostureClassificationV1_2", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        if let modelURL = Bundle.main.url(forResource: "PostureClassification", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        // Try downloaded models
        let downloadManager = MLModelDownloadManager.shared
        if let modelPath = downloadManager.getLocalModelPath(modelName: "PostureClassification", version: "1.2.0") {
            return try MLModel(contentsOf: modelPath)
        }

        // Try downloading
        do {
            let availableModels = try await downloadManager.fetchAvailableModels()
            if let postureModel = availableModels.first(where: { $0.name.lowercased().contains("posture") }) {
                let modelURL = try await downloadManager.downloadModel(postureModel)
                return try MLModel(contentsOf: modelURL)
            }
        } catch {
            logger.warning("Failed to download posture model: \(error.localizedDescription)")
        }

        throw MLModelError.modelNotFound("PostureClassificationV1_2.mlmodelc")
    }

    private func loadMovementPatternModel() async throws -> MLModel {
        // Try bundle first
        if let modelURL = Bundle.main.url(forResource: "MovementPatternV2_3", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        if let modelURL = Bundle.main.url(forResource: "MovementPattern", withExtension: "mlmodelc") {
            return try MLModel(contentsOf: modelURL)
        }

        // Try downloaded models
        let downloadManager = MLModelDownloadManager.shared
        if let modelPath = downloadManager.getLocalModelPath(modelName: "MovementPattern", version: "2.3.0") {
            return try MLModel(contentsOf: modelPath)
        }

        // Try downloading
        do {
            let availableModels = try await downloadManager.fetchAvailableModels()
            if let movementModel = availableModels.first(where: { $0.name.lowercased().contains("movement") }) {
                let modelURL = try await downloadManager.downloadModel(movementModel)
                return try MLModel(contentsOf: modelURL)
            }
        } catch {
            logger.warning("Failed to download movement pattern model: \(error.localizedDescription)")
        }

        throw MLModelError.modelNotFound("MovementPatternV2_3.mlmodelc")
    }

    // MARK: - Model Update Checking

    /// Checks for model updates and downloads if available
    func checkForModelUpdates() async {
        let downloadManager = MLModelDownloadManager.shared

        do {
            let updates = await downloadManager.checkForUpdates()

            if !updates.isEmpty {
                logger.info("Found \(updates.count) model update(s)")

                // Download updates in background
                for update in updates {
                    do {
                        _ = try await downloadManager.downloadModel(update)
                        logger.info("Successfully updated model: \(update.displayName)")
                    } catch {
                        logger.error("Failed to update model \(update.name): \(error.localizedDescription)")
                    }
                }

                // Reload models after updates
                await loadMLModels()
            }
        } catch {
            logger.error("Failed to check for model updates: \(error.localizedDescription)")
        }
    }

    // MARK: - Enhanced Analysis

    func performEnhancedAnalysis() async -> Result<EnhancedAnalysisResult, AnalysisError> {
        guard isInitialized && mlModelsLoaded else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "EnhancedLiDARMLManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "System not ready"]),
                    context: "Enhanced analysis",
                    category: .ml,
                    severity: .medium,
                    recovery: .retry(maxAttempts: 2)
                )
            )
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

            // Step 3: Run ML predictions (with fallback)
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

            // Log analytics
            AnalyticsManager.shared.logEvent("enhanced_ml_analysis_completed", parameters: [
                "processing_time": String(format: "%.2f", processingTime),
                "quality_score": String(format: "%.2f", qualityScore),
                "models_used": gaitAnalysisModel != nil ? "gait" : "fallback"
            ])

            analysisInProgress = false
            return .success(result)

        } catch {
            analysisInProgress = false
            logger.error("Enhanced analysis failed: \(error.localizedDescription)")

            ErrorHandler.shared.handle(
                error,
                context: "Enhanced ML analysis",
                category: .ml,
                severity: .medium,
                recovery: .retry(maxAttempts: 1)
            )

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
        // Try ML model first, fallback to rule-based if unavailable
        if let model = gaitAnalysisModel {
            do {
                let inputFeatures = createGaitFeatureVector(data)
                let prediction = try model.prediction(from: inputFeatures)

                return GaitPrediction(
                    classification: extractGaitClassification(prediction),
                    confidence: extractConfidenceScore(prediction),
                    riskScore: extractRiskScore(prediction)
                )
            } catch {
                logger.warning("ML gait prediction failed: \(error.localizedDescription), using fallback")
                ErrorHandler.shared.handle(
                    error,
                    context: "Gait pattern prediction",
                    category: .ml,
                    severity: .low,
                    recovery: .fallback
                )
                // Fall through to rule-based fallback
            }
        }

        // Rule-based fallback
        return predictGaitPatternFallback(data)
    }

    private func predictFallRisk(_ data: SensorFusionResult) async throws -> FallRiskPrediction {
        // Try ML model first, fallback to rule-based if unavailable
        if let model = fallPredictionModel {
            do {
                let inputFeatures = createFallRiskFeatureVector(data)
                let prediction = try model.prediction(from: inputFeatures)

                return FallRiskPrediction(
                    level: extractRiskLevel(prediction),
                    probability: extractProbability(prediction),
                    timeToRisk: extractTimeHorizon(prediction)
                )
            } catch {
                logger.warning("ML fall risk prediction failed: \(error.localizedDescription), using fallback")
                ErrorHandler.shared.handle(
                    error,
                    context: "Fall risk prediction",
                    category: .ml,
                    severity: .low,
                    recovery: .fallback
                )
                // Fall through to rule-based fallback
            }
        }

        // Rule-based fallback
        return predictFallRiskFallback(data)
    }

    private func classifyPosture(_ data: SensorFusionResult) async throws -> PosturePrediction {
        // Try ML model first, fallback to rule-based if unavailable
        if let model = postureClassificationModel {
            do {
                let inputFeatures = createPostureFeatureVector(data)
                let prediction = try model.prediction(from: inputFeatures)

                return PosturePrediction(
                    alignment: extractPostureAlignment(prediction),
                    compensations: extractCompensations(prediction),
                    recommendations: generatePostureRecommendations(prediction)
                )
            } catch {
                logger.warning("ML posture classification failed: \(error.localizedDescription), using fallback")
                ErrorHandler.shared.handle(
                    error,
                    context: "Posture classification",
                    category: .ml,
                    severity: .low,
                    recovery: .fallback
                )
                // Fall through to rule-based fallback
            }
        }

        // Rule-based fallback
        return classifyPostureFallback(data)
    }

    // MARK: - Fallback Predictions (Rule-Based)

    private func predictGaitPatternFallback(_ data: SensorFusionResult) -> GaitPrediction {
        // Rule-based gait pattern classification
        var classification = "normal"
        var confidence = 0.7
        var riskScore = 20.0

        // Classify based on stability and symmetry
        if data.combinedStability < 60 {
            classification = "unstable"
            confidence = 0.8
            riskScore = 45.0
        } else if data.symmetryIndex < 70 {
            classification = "asymmetric"
            confidence = 0.75
            riskScore = 35.0
        } else if data.combinedStability >= 85 && data.symmetryIndex >= 85 {
            classification = "excellent"
            confidence = 0.85
            riskScore = 10.0
        }

        // Adjust risk score based on overall risk
        riskScore += data.overallRiskScore

        return GaitPrediction(
            classification: classification,
            confidence: confidence,
            riskScore: min(100.0, riskScore)
        )
    }

    private func predictFallRiskFallback(_ data: SensorFusionResult) -> FallRiskPrediction {
        // Rule-based fall risk assessment
        let riskScore = data.overallRiskScore
        var level = "low"
        var probability = 0.1
        var timeToRisk = 168.0 // 7 days default

        if riskScore >= 60 {
            level = "high"
            probability = 0.6 + (riskScore - 60) / 100.0
            timeToRisk = 24.0 // 24 hours
        } else if riskScore >= 40 {
            level = "moderate"
            probability = 0.3 + (riskScore - 40) / 100.0
            timeToRisk = 72.0 // 3 days
        } else if riskScore >= 20 {
            level = "low"
            probability = 0.1 + (riskScore - 20) / 100.0
            timeToRisk = 168.0 // 7 days
        }

        probability = min(0.95, probability)

        return FallRiskPrediction(
            level: level,
            probability: probability,
            timeToRisk: timeToRisk
        )
    }

    private func classifyPostureFallback(_ data: SensorFusionResult) -> PosturePrediction {
        // Rule-based posture classification
        var alignment = "good"
        var compensations: [String] = []
        var recommendations: [String] = []

        // Assess alignment based on stability and symmetry
        if data.combinedStability < 70 {
            alignment = "poor"
            compensations.append("Reduced core stability")
            recommendations.append("Focus on core strengthening exercises")
        } else if data.symmetryIndex < 75 {
            alignment = "fair"
            compensations.append("Asymmetric posture detected")
            recommendations.append("Work on bilateral strength and flexibility")
        }

        // Additional recommendations based on fluidity
        if data.fluidityRating < 70 {
            compensations.append("Reduced movement fluidity")
            recommendations.append("Consider stretching and mobility work")
        }

        if compensations.isEmpty {
            recommendations.append("Maintain current posture and activity level")
        }

        return PosturePrediction(
            alignment: alignment,
            compensations: compensations,
            recommendations: recommendations
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

    // MARK: - Feature Vector Creation

    private func createGaitFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for gait analysis
        // Standard features: stability, symmetry, coordination, fluidity, risk score
        // This is a generic implementation - adjust based on your specific model requirements

        guard let featureArray = try? MLMultiArray(
            shape: [1, 5],
            dataType: .double
        ) else {
            // Fallback to dictionary if array creation fails
            return createGaitFeatureDictionary(data)
        }

        // Normalize features to 0-1 range
        featureArray[0] = NSNumber(value: data.combinedStability / 100.0)
        featureArray[1] = NSNumber(value: data.symmetryIndex / 100.0)
        featureArray[2] = NSNumber(value: data.coordinationScore / 100.0)
        featureArray[3] = NSNumber(value: data.fluidityRating / 100.0)
        featureArray[4] = NSNumber(value: data.overallRiskScore / 100.0)

        do {
            return try MLDictionaryFeatureProvider(
                dictionary: ["features": MLFeatureValue(multiArray: featureArray)]
            )
        } catch {
            // Fallback to dictionary format
            return createGaitFeatureDictionary(data)
        }
    }

    private func createGaitFeatureDictionary(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Dictionary-based feature vector (more flexible)
        do {
            return try MLDictionaryFeatureProvider(dictionary: [
                "stability": MLFeatureValue(double: data.combinedStability),
                "symmetry": MLFeatureValue(double: data.symmetryIndex),
                "coordination": MLFeatureValue(double: data.coordinationScore),
                "fluidity": MLFeatureValue(double: data.fluidityRating),
                "risk_score": MLFeatureValue(double: data.overallRiskScore)
            ])
        } catch {
            logger.error("Failed to create gait feature dictionary: \(error.localizedDescription)")
            // Return minimal feature vector
            return try! MLDictionaryFeatureProvider(dictionary: [
                "stability": MLFeatureValue(double: data.combinedStability)
            ])
        }
    }

    private func createFallRiskFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for fall risk prediction
        // Features: stability, risk score, symmetry, coordination
        do {
            guard let featureArray = try? MLMultiArray(
                shape: [1, 6],
                dataType: .double
            ) else {
                return try MLDictionaryFeatureProvider(dictionary: [
                    "stability": MLFeatureValue(double: data.combinedStability),
                    "risk_score": MLFeatureValue(double: data.overallRiskScore),
                    "symmetry": MLFeatureValue(double: data.symmetryIndex),
                    "coordination": MLFeatureValue(double: data.coordinationScore),
                    "fluidity": MLFeatureValue(double: data.fluidityRating),
                    "confidence": MLFeatureValue(double: data.confidence)
                ])
            }

            featureArray[0] = NSNumber(value: data.combinedStability / 100.0)
            featureArray[1] = NSNumber(value: data.overallRiskScore / 100.0)
            featureArray[2] = NSNumber(value: data.symmetryIndex / 100.0)
            featureArray[3] = NSNumber(value: data.coordinationScore / 100.0)
            featureArray[4] = NSNumber(value: data.fluidityRating / 100.0)
            featureArray[5] = NSNumber(value: data.confidence)

            return try MLDictionaryFeatureProvider(
                dictionary: ["features": MLFeatureValue(multiArray: featureArray)]
            )
        } catch {
            logger.error("Failed to create fall risk feature vector: \(error.localizedDescription)")
            return try! MLDictionaryFeatureProvider(dictionary: [
                "risk_score": MLFeatureValue(double: data.overallRiskScore)
            ])
        }
    }

    private func createPostureFeatureVector(_ data: SensorFusionResult) -> MLFeatureProvider {
        // Create feature vector for posture classification
        // Features: stability, symmetry, coordination, risk
        do {
            return try MLDictionaryFeatureProvider(dictionary: [
                "stability": MLFeatureValue(double: data.combinedStability),
                "symmetry": MLFeatureValue(double: data.symmetryIndex),
                "coordination": MLFeatureValue(double: data.coordinationScore),
                "fluidity": MLFeatureValue(double: data.fluidityRating),
                "risk_score": MLFeatureValue(double: data.overallRiskScore),
                "confidence": MLFeatureValue(double: data.confidence)
            ])
        } catch {
            logger.error("Failed to create posture feature vector: \(error.localizedDescription)")
            return try! MLDictionaryFeatureProvider(dictionary: [
                "stability": MLFeatureValue(double: data.combinedStability)
            ])
        }
    }

    // MARK: - Prediction Extraction

    private func extractGaitClassification(_ prediction: MLFeatureProvider) -> String {
        // Try to extract classification from model output
        // Common output formats: "classification", "class", "label", "prediction"

        if let classification = try? prediction.featureValue(for: "classification")?.stringValue {
            return classification
        }

        if let classification = try? prediction.featureValue(for: "class")?.stringValue {
            return classification
        }

        if let classification = try? prediction.featureValue(for: "label")?.stringValue {
            return classification
        }

        if let classification = try? prediction.featureValue(for: "prediction")?.stringValue {
            return classification
        }

        // If no classification found, derive from confidence scores
        if let scores = try? prediction.featureValue(for: "classLabelProbs")?.dictionaryValue {
            // Find highest probability class
            let maxProb = scores.values.max { first, second in
                (try? first.doubleValue ?? 0) < (try? second.doubleValue ?? 0)
            }

            if let maxProb = maxProb, let classLabel = scores.first(where: { $0.value == maxProb })?.key {
                return classLabel
            }
        }

        // Fallback: derive from numeric outputs
        let riskScore = extractRiskScore(prediction)
        if riskScore > 40 {
            return "unstable"
        } else if riskScore > 20 {
            return "at_risk"
        } else {
            return "normal"
        }
    }

    private func extractConfidenceScore(_ prediction: MLFeatureProvider) -> Double {
        // Try common confidence field names
        if let confidence = try? prediction.featureValue(for: "confidence")?.doubleValue {
            return confidence
        }

        if let confidence = try? prediction.featureValue(for: "confidenceScore")?.doubleValue {
            return confidence
        }

        if let confidence = try? prediction.featureValue(for: "prob")?.doubleValue {
            return confidence
        }

        // Calculate from class probabilities if available
        if let scores = try? prediction.featureValue(for: "classLabelProbs")?.dictionaryValue {
            let maxProb = scores.values.compactMap { try? $0.doubleValue }.max() ?? 0.0
            return maxProb
        }

        // Default confidence
        return 0.85
    }

    private func extractRiskScore(_ prediction: MLFeatureProvider) -> Double {
        // Try common risk score field names
        if let riskScore = try? prediction.featureValue(for: "riskScore")?.doubleValue {
            return riskScore * 100.0 // Normalize to 0-100 if model outputs 0-1
        }

        if let riskScore = try? prediction.featureValue(for: "risk")?.doubleValue {
            return riskScore * 100.0
        }

        if let riskScore = try? prediction.featureValue(for: "score")?.doubleValue {
            return riskScore * 100.0
        }

        // Try multi-array output
        if let array = try? prediction.featureValue(for: "output")?.multiArrayValue {
            if array.count > 0 {
                return array[0].doubleValue * 100.0
            }
        }

        // Fallback: derive from classification
        let classification = extractGaitClassification(prediction)
        switch classification.lowercased() {
        case "unstable", "poor", "critical":
            return 50.0
        case "at_risk", "fair":
            return 30.0
        default:
            return 15.0
        }
    }

    private func extractRiskLevel(_ prediction: MLFeatureProvider) -> String {
        // Try direct risk level extraction
        if let level = try? prediction.featureValue(for: "riskLevel")?.stringValue {
            return level
        }

        if let level = try? prediction.featureValue(for: "level")?.stringValue {
            return level
        }

        // Derive from probability
        let probability = extractProbability(prediction)
        if probability >= 0.6 {
            return "high"
        } else if probability >= 0.3 {
            return "moderate"
        } else {
            return "low"
        }
    }

    private func extractProbability(_ prediction: MLFeatureProvider) -> Double {
        // Try common probability field names
        if let prob = try? prediction.featureValue(for: "probability")?.doubleValue {
            return prob
        }

        if let prob = try? prediction.featureValue(for: "prob")?.doubleValue {
            return prob
        }

        if let prob = try? prediction.featureValue(for: "fallRisk")?.doubleValue {
            return prob
        }

        // Derive from risk level
        let level = extractRiskLevel(prediction)
        switch level.lowercased() {
        case "high":
            return 0.7
        case "moderate":
            return 0.4
        default:
            return 0.1
        }
    }

    private func extractTimeHorizon(_ prediction: MLFeatureProvider) -> Double {
        // Try to extract time horizon
        if let hours = try? prediction.featureValue(for: "timeHorizon")?.doubleValue {
            return hours
        }

        if let hours = try? prediction.featureValue(for: "timeToRisk")?.doubleValue {
            return hours
        }

        if let days = try? prediction.featureValue(for: "daysToRisk")?.doubleValue {
            return days * 24.0
        }

        // Default based on risk level
        let level = extractRiskLevel(prediction)
        switch level.lowercased() {
        case "high":
            return 24.0 // 24 hours
        case "moderate":
            return 72.0 // 3 days
        default:
            return 168.0 // 7 days
        }
    }

    private func extractPostureAlignment(_ prediction: MLFeatureProvider) -> String {
        // Try direct alignment extraction
        if let alignment = try? prediction.featureValue(for: "alignment")?.stringValue {
            return alignment
        }

        if let alignment = try? prediction.featureValue(for: "postureAlignment")?.stringValue {
            return alignment
        }

        if let alignment = try? prediction.featureValue(for: "classification")?.stringValue {
            return alignment
        }

        // Derive from numeric scores if available
        if let score = try? prediction.featureValue(for: "alignmentScore")?.doubleValue {
            if score >= 80 {
                return "excellent"
            } else if score >= 60 {
                return "good"
            } else if score >= 40 {
                return "fair"
            } else {
                return "poor"
            }
        }

        // Default
        return "good"
    }

    private func extractCompensations(_ prediction: MLFeatureProvider) -> [String] {
        // Try to extract compensations array
        if let compensations = try? prediction.featureValue(for: "compensations")?.multiArrayValue {
            var result: [String] = []
            for i in 0..<compensations.count {
                let value = compensations[i].doubleValue
                if value > 0.5 { // Threshold
                    result.append("Compensation \(i + 1)")
                }
            }
            return result
        }

        // Try string array
        if let compensations = try? prediction.featureValue(for: "compensations")?.stringValue {
            return compensations.split(separator: ",").map(String.init)
        }

        // Derive from alignment
        let alignment = extractPostureAlignment(prediction)
        if alignment == "poor" || alignment == "fair" {
            return ["Postural compensation detected"]
        }

        return []
    }

    private func generatePostureRecommendations(_ prediction: MLFeatureProvider) -> [String] {
        // Try to extract recommendations
        if let recommendations = try? prediction.featureValue(for: "recommendations")?.stringValue {
            return recommendations.split(separator: ",").map(String.init)
        }

        // Generate based on alignment and compensations
        let alignment = extractPostureAlignment(prediction)
        let compensations = extractCompensations(prediction)
        var recommendations: [String] = []

        if alignment == "poor" {
            recommendations.append("Consider consulting a physical therapist")
            recommendations.append("Focus on core strengthening exercises")
        } else if alignment == "fair" {
            recommendations.append("Work on postural awareness")
            recommendations.append("Include stretching in daily routine")
        }

        if !compensations.isEmpty {
            recommendations.append("Address movement compensations with targeted exercises")
        }

        if recommendations.isEmpty {
            recommendations.append("Maintain current posture and activity level")
        }

        return recommendations
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

// MARK: - Sensor Fusion Processors

/// Multi-modal sensor fusion processor combining LiDAR, motion, and health data
class MultiModalSensorProcessor {
    private let configuration: SensorFusionConfiguration
    private var sensorWeights: [String: Double] = [:]

    init(configuration: SensorFusionConfiguration) {
        self.configuration = configuration
        setupSensorWeights()
    }

    private func setupSensorWeights() {
        // Weight sensors based on availability and reliability
        sensorWeights["lidar"] = configuration.enableLiDARProcessing ? 0.4 : 0.0
        sensorWeights["motion"] = configuration.enableSmartphoneMotion ? 0.3 : 0.0
        sensorWeights["healthkit"] = configuration.enableAppleWatchIntegration ? 0.2 : 0.0
        sensorWeights["camera"] = configuration.enableCameraTracking ? 0.1 : 0.0

        // Normalize weights
        let total = sensorWeights.values.reduce(0, +)
        if total > 0 {
            for key in sensorWeights.keys {
                sensorWeights[key] = sensorWeights[key]! / total
            }
        }
    }

    func fuseSensorData(_ data: MultiModalSensorData) async throws -> SensorFusionProcessedResult {
        // Calculate stability from multiple sources
        let stabilityScores: [Double] = [
            calculateLiDARStability(data.lidarPoints),
            calculateMotionStability(data.motionMetrics),
            calculateHealthKitStability(data.healthMetrics)
        ].compactMap { $0 }

        let combinedStability = weightedAverage(stabilityScores, weights: [0.4, 0.3, 0.3])

        // Calculate coordination from motion and LiDAR
        let coordinationScores: [Double] = [
            calculateMotionCoordination(data.motionMetrics),
            calculateLiDARCoordination(data.lidarPoints)
        ].compactMap { $0 }

        let coordinationMetrics = weightedAverage(coordinationScores, weights: [0.6, 0.4])

        // Calculate symmetry from motion data
        let movementSymmetry = calculateMovementSymmetry(data.motionMetrics)

        // Calculate fluidity from motion patterns
        let movementFluidity = calculateMovementFluidity(data.motionMetrics)

        // Calculate risk assessment
        let riskFactors: [Double] = [
            (100.0 - combinedStability) / 100.0,
            (100.0 - movementSymmetry) / 100.0,
            (100.0 - coordinationMetrics) / 100.0
        ]

        let riskAssessment = min(100.0, riskFactors.reduce(0, +) * 33.33)

        // Determine active sensors
        var activeSensors: [String] = []
        if !data.lidarPoints.points.isEmpty {
            activeSensors.append("lidar")
        }
        activeSensors.append("motion")
        if data.healthMetrics.walkingSteadiness != nil {
            activeSensors.append("healthkit")
        }

        // Calculate fusion confidence
        let fusionConfidence = calculateFusionConfidence(
            lidarConfidence: data.lidarPoints.confidence,
            sensorCount: activeSensors.count
        )

        return SensorFusionProcessedResult(
            stabilityScore: combinedStability,
            coordinationMetrics: coordinationMetrics,
            movementSymmetry: movementSymmetry,
            movementFluidity: movementFluidity,
            riskAssessment: riskAssessment,
            activeSensors: activeSensors,
            fusionConfidence: fusionConfidence
        )
    }

    private func calculateLiDARStability(_ cloud: LiDARPointCloud) -> Double? {
        guard !cloud.points.isEmpty else { return nil }

        // Analyze point cloud density and distribution
        let pointCount = cloud.points.count
        let confidence = Double(cloud.confidence)

        // Higher point count and confidence = better stability estimate
        let stabilityEstimate = min(100.0, (Double(pointCount) / 1000.0) * 50.0 + (confidence / 100.0) * 50.0)

        return stabilityEstimate
    }

    private func calculateMotionStability(_ motion: MotionMetrics) -> Double? {
        // Calculate stability from motion metrics
        let accelMagnitude = sqrt(
            motion.acceleration.x * motion.acceleration.x +
            motion.acceleration.y * motion.acceleration.y +
            motion.acceleration.z * motion.acceleration.z
        )

        // Lower acceleration = more stability
        let stability = max(0.0, min(100.0, 100.0 - accelMagnitude * 10.0))

        return stability
    }

    private func calculateHealthKitStability(_ health: HealthMetrics) -> Double? {
        guard let steadiness = health.walkingSteadiness else { return nil }
        return steadiness * 100.0 // Convert to 0-100 scale
    }

    private func calculateMotionCoordination(_ motion: MotionMetrics) -> Double? {
        // Calculate coordination from rotation and acceleration correlation
        let rotationMagnitude = sqrt(
            motion.rotation.x * motion.rotation.x +
            motion.rotation.y * motion.rotation.y +
            motion.rotation.z * motion.rotation.z
        )

        // Coordinated movement has balanced rotation and acceleration
        let accelMagnitude = sqrt(
            motion.acceleration.x * motion.acceleration.x +
            motion.acceleration.y * motion.acceleration.y +
            motion.acceleration.z * motion.acceleration.z
        )

        // Lower variance between rotation and acceleration = better coordination
        let difference = abs(rotationMagnitude - accelMagnitude)
        let coordination = max(0.0, min(100.0, 100.0 - difference * 20.0))

        return coordination
    }

    private func calculateLiDARCoordination(_ cloud: LiDARPointCloud) -> Double? {
        guard !cloud.points.isEmpty else { return nil }

        // Analyze point cloud regularity (coordinated movement = regular patterns)
        let frameRate = cloud.frameRate
        let pointDensity = Double(cloud.points.count) / frameRate

        // Higher frame rate and consistent density = better coordination
        let coordination = min(100.0, (frameRate / 30.0) * 50.0 + (pointDensity / 100.0) * 50.0)

        return coordination
    }

    private func calculateMovementSymmetry(_ motion: MotionMetrics) -> Double {
        // Analyze symmetry from rotation patterns
        // Symmetric movement has balanced left/right rotation
        let xRotation = abs(motion.rotation.x)
        let zRotation = abs(motion.rotation.z)

        // Calculate symmetry as 1 - (difference / average)
        let avg = (xRotation + zRotation) / 2.0
        guard avg > 0 else { return 80.0 } // Default

        let difference = abs(xRotation - zRotation)
        let symmetry = max(0.0, min(100.0, (1.0 - difference / avg) * 100.0))

        return symmetry
    }

    private func calculateMovementFluidity(_ motion: MotionMetrics) -> Double {
        // Analyze fluidity from smooth motion patterns
        // Fluid movement has gradual changes, not abrupt stops/starts

        // Use attitude changes to assess fluidity
        let attitudeChange = sqrt(
            motion.attitude.pitch * motion.attitude.pitch +
            motion.attitude.roll * motion.attitude.roll +
            motion.attitude.yaw * motion.attitude.yaw
        )

        // Lower attitude change = more fluid (simplified)
        let fluidity = max(0.0, min(100.0, 100.0 - attitudeChange * 50.0))

        return fluidity
    }

    private func calculateFusionConfidence(lidarConfidence: Int, sensorCount: Int) -> Double {
        // Confidence increases with more sensors and higher LiDAR quality
        let sensorFactor = min(1.0, Double(sensorCount) / 4.0)
        let qualityFactor = Double(lidarConfidence) / 100.0

        return (sensorFactor * 0.6 + qualityFactor * 0.4)
    }

    private func weightedAverage(_ values: [Double], weights: [Double]) -> Double {
        guard !values.isEmpty, values.count == weights.count else {
            return values.isEmpty ? 50.0 : values.reduce(0, +) / Double(values.count)
        }

        let weightedSum = zip(values, weights).map { $0 * $1 }.reduce(0, +)
        let totalWeight = weights.reduce(0, +)

        return totalWeight > 0 ? weightedSum / totalWeight : 50.0
    }
}

/// Kalman filter processor for sensor data smoothing
class KalmanFilterProcessor {
    private let stateTransitionModel: [[Double]]
    private let observationModel: [[Double]]
    private let processNoise: Double
    private let measurementNoise: Double

    private var state: [Double] = [0, 0, 0, 0, 0, 0] // Position (3) + Velocity (3)
    private var covariance: [[Double]] = []

    init(
        stateTransitionModel: [[Double]],
        observationModel: [[Double]],
        processNoise: Double,
        measurementNoise: Double
    ) {
        self.stateTransitionModel = stateTransitionModel
        self.observationModel = observationModel
        self.processNoise = processNoise
        self.measurementNoise = measurementNoise

        // Initialize covariance matrix (6x6 identity)
        self.covariance = Array(repeating: Array(repeating: 0.0, count: 6), count: 6)
        for i in 0..<6 {
            covariance[i][i] = 1.0
        }
    }

    func process(_ data: MultiModalSensorData) async throws -> MultiModalSensorData {
        // Extract position from motion data (simplified - using acceleration)
        let observation: [Double] = [
            Double(data.motionMetrics.acceleration.x),
            Double(data.motionMetrics.acceleration.y),
            Double(data.motionMetrics.acceleration.z)
        ]

        // Kalman filter prediction step
        let predictedState = predictState()
        let predictedCovariance = predictCovariance()

        // Kalman filter update step
        let (updatedState, updatedCovariance) = update(
            predictedState: predictedState,
            predictedCovariance: predictedCovariance,
            observation: observation
        )

        state = updatedState
        covariance = updatedCovariance

        // Create filtered motion data
        let filteredAcceleration = CMAcceleration(
            x: state[0],
            y: state[1],
            z: state[2]
        )

        let filteredMotion = MotionMetrics(
            acceleration: filteredAcceleration,
            rotation: data.motionMetrics.rotation,
            attitude: data.motionMetrics.attitude,
            gravity: data.motionMetrics.gravity,
            timestamp: data.motionMetrics.timestamp
        )

        return MultiModalSensorData(
            lidarPoints: data.lidarPoints,
            motionMetrics: filteredMotion,
            healthMetrics: data.healthMetrics,
            environmentalContext: data.environmentalContext,
            collectionDuration: data.collectionDuration,
            timestamp: data.timestamp
        )
    }

    private func predictState() -> [Double] {
        // x_k|k-1 = F * x_k-1|k-1
        var predicted: [Double] = Array(repeating: 0.0, count: 6)
        for i in 0..<6 {
            for j in 0..<6 {
                predicted[i] += stateTransitionModel[i][j] * state[j]
            }
        }
        return predicted
    }

    private func predictCovariance() -> [[Double]] {
        // P_k|k-1 = F * P_k-1|k-1 * F^T + Q
        var predicted: [[Double]] = Array(repeating: Array(repeating: 0.0, count: 6), count: 6)

        // F * P
        for i in 0..<6 {
            for j in 0..<6 {
                for k in 0..<6 {
                    predicted[i][j] += stateTransitionModel[i][k] * covariance[k][j]
                }
            }
        }

        // (F * P) * F^T
        var temp: [[Double]] = Array(repeating: Array(repeating: 0.0, count: 6), count: 6)
        for i in 0..<6 {
            for j in 0..<6 {
                for k in 0..<6 {
                    temp[i][j] += predicted[i][k] * stateTransitionModel[j][k]
                }
            }
        }

        // Add process noise Q
        for i in 0..<6 {
            temp[i][i] += processNoise
        }

        return temp
    }

    private func update(
        predictedState: [Double],
        predictedCovariance: [[Double]],
        observation: [Double]
    ) -> ([Double], [[Double]]) {
        // Kalman gain: K = P * H^T * (H * P * H^T + R)^-1
        // Innovation: y = z - H * x
        // Update: x = x + K * y
        // Covariance: P = (I - K * H) * P

        // H * P (3x6)
        var hp: [[Double]] = Array(repeating: Array(repeating: 0.0, count: 6), count: 3)
        for i in 0..<3 {
            for j in 0..<6 {
                for k in 0..<3 {
                    hp[i][j] += observationModel[i][k] * predictedCovariance[k][j]
                }
            }
        }

        // H * P * H^T + R (3x3)
        var s: [[Double]] = Array(repeating: Array(repeating: 0.0, count: 3), count: 3)
        for i in 0..<3 {
            for j in 0..<3 {
                for k in 0..<6 {
                    s[i][j] += hp[i][k] * observationModel[j][k]
                }
                if i == j {
                    s[i][j] += measurementNoise
                }
            }
        }

        // Kalman gain: K = P * H^T * S^-1 (simplified - assume S is diagonal)
        var gain: [[Double]] = Array(repeating: Array(repeating: 0.0, count: 3), count: 6)
        for i in 0..<6 {
            for j in 0..<3 {
                for k in 0..<3 {
                    gain[i][j] += predictedCovariance[i][k] * observationModel[j][k] / max(s[j][j], 0.001)
                }
            }
        }

        // Innovation
        var innovation: [Double] = Array(repeating: 0.0, count: 3)
        for i in 0..<3 {
            var hx = 0.0
            for j in 0..<6 {
                hx += observationModel[i][j] * predictedState[j]
            }
            innovation[i] = observation[i] - hx
        }

        // Updated state
        var updatedState = predictedState
        for i in 0..<6 {
            for j in 0..<3 {
                updatedState[i] += gain[i][j] * innovation[j]
            }
        }

        // Updated covariance (simplified)
        var updatedCovariance = predictedCovariance
        for i in 0..<6 {
            for j in 0..<6 {
                for k in 0..<3 {
                    updatedCovariance[i][j] -= gain[i][k] * observationModel[k][j]
                }
            }
        }

        return (updatedState, updatedCovariance)
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
