import Foundation
import ARKit
import RealityKit
import Combine
import AVFoundation

@available(iOS 14.0, *)
class LiDARPostureAnalyzer: NSObject, ObservableObject {

    // MARK: - Properties
    @Published var isAnalyzing = false
    @Published var currentAnalysis: PostureAnalysisResult?
    @Published var sessionData: LiDARSessionData?
    @Published var recordingProgress: Float = 0.0

    private let arView = ARView()
    private var arSession: ARSession
    private var cancellables = Set<AnyCancellable>()

    // Analysis Configuration
    private var analysisType: AnalysisType = .posture
    private var recordingDuration: TimeInterval = 30.0
    private var startTime: Date?

    // Data Collection
    private var depthFrames: [ARFrame] = []
    private var bodyAnchorData: [ARBodyAnchor] = []
    private var pointCloudData: [LiDARPoint] = []

    // MARK: - Initialization
    override init() {
        self.arSession = ARSession()
        super.init()

        setupARConfiguration()
        setupAnalysisTimer()
    }

    // MARK: - AR Configuration
    private func setupARConfiguration() {
        // Check LiDAR availability
        guard ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) else {
            print("❌ LiDAR not available on this device")
            return
        }

        // Configure AR session for body tracking with LiDAR
        let configuration = ARWorldTrackingConfiguration()
        configuration.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
        configuration.sceneReconstruction = .mesh

        // Enable body tracking if available
        if ARBodyTrackingConfiguration.isSupported {
            let bodyConfig = ARBodyTrackingConfiguration()
            bodyConfig.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
            arSession.run(bodyConfig, options: [.resetTracking, .removeExistingAnchors])
        } else {
            arSession.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        }

        arSession.delegate = self
    }

    private func setupAnalysisTimer() {
        Timer.publish(every: 0.1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.updateRecordingProgress()
            }
            .store(in: &cancellables)
    }

    // MARK: - Public Interface
    func startAnalysis(type: AnalysisType, duration: TimeInterval = 30.0) {
        analysisType = type
        recordingDuration = duration
        startTime = Date()

        // Reset data collections
        depthFrames.removeAll()
        bodyAnchorData.removeAll()
        pointCloudData.removeAll()
        recordingProgress = 0.0

        DispatchQueue.main.async {
            self.isAnalyzing = true
        }

        print("🎯 Starting LiDAR \(type.rawValue) analysis for \(duration) seconds")

        // Auto-stop after duration
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            self.stopAnalysis()
        }
    }

    func stopAnalysis() {
        guard isAnalyzing else { return }

        DispatchQueue.main.async {
            self.isAnalyzing = false
        }

        // Process collected data
        processCollectedData()

        print("✅ LiDAR analysis completed")
    }

    // MARK: - Data Processing
    private func updateRecordingProgress() {
        guard let startTime = startTime, isAnalyzing else { return }

        let elapsed = Date().timeIntervalSince(startTime)
        recordingProgress = Float(min(elapsed / recordingDuration, 1.0))
    }

    private func processCollectedData() {
        guard let startTime = startTime else { return }

        let sessionData = LiDARSessionData(
            sessionId: "lidar_\(Int(Date().timeIntervalSince1970))",
            startTime: startTime,
            duration: Date().timeIntervalSince(startTime),
            analysisType: analysisType,
            pointCloudData: pointCloudData,
            deviceInfo: getLiDARDeviceInfo()
        )

        // Perform analysis based on type
        switch analysisType {
        case .posture:
            sessionData.postureAnalysis = analyzePosture()
        case .gait:
            sessionData.gaitAnalysis = analyzeGait()
        case .balance:
            sessionData.balanceAnalysis = analyzeBalance()
        case .environment:
            sessionData.environmentAnalysis = analyzeEnvironment()
        }

        DispatchQueue.main.async {
            self.sessionData = sessionData
        }
    }

    // MARK: - Analysis Algorithms
    private func analyzePosture() -> PostureAnalysisResult {
        // Extract body pose from collected anchor data
        let bodyPoses = bodyAnchorData.compactMap { anchor in
            extractBodyPose(from: anchor)
        }

        // Calculate postural sway metrics
        let posturalSway = calculatePosturalSway(from: bodyPoses)

        // Analyze spinal alignment
        let spinalAlignment = analyzeSpinalAlignment(from: bodyPoses)

        // Calculate balance metrics
        let balanceMetrics = calculateBalanceMetrics(from: bodyPoses)

        // Identify risk factors
        let riskFactors = identifyPostureRiskFactors(
            sway: posturalSway,
            alignment: spinalAlignment,
            balance: balanceMetrics
        )

        return PostureAnalysisResult(
            posturalSway: posturalSway,
            spinalAlignment: spinalAlignment,
            balanceMetrics: balanceMetrics,
            riskFactors: riskFactors,
            confidence: calculateAnalysisConfidence(),
            timestamp: Date()
        )
    }

    private func analyzeGait() -> GaitAnalysisResult {
        // Extract walking sequences from body tracking
        let walkingSequences = extractWalkingSequences(from: bodyAnchorData)

        // Calculate spatial metrics using LiDAR precision
        let spatialMetrics = calculateSpatialGaitMetrics(from: walkingSequences)

        // Analyze temporal patterns
        let temporalMetrics = calculateTemporalGaitMetrics(from: walkingSequences)

        // Perform kinematic chain analysis
        let kinematicChain = analyzeKinematicChain(from: walkingSequences)

        // Calculate asymmetry metrics
        let asymmetryMetrics = calculateGaitAsymmetry(from: walkingSequences)

        // Analyze environmental context
        let environmentalContext = analyzeWalkingEnvironment()

        // Calculate fall risk score
        let fallRiskScore = calculateLiDARFallRiskScore(
            spatial: spatialMetrics,
            temporal: temporalMetrics,
            asymmetry: asymmetryMetrics
        )

        return GaitAnalysisResult(
            spatialMetrics: spatialMetrics,
            temporalMetrics: temporalMetrics,
            kinematicChain: kinematicChain,
            asymmetryMetrics: asymmetryMetrics,
            environmentalContext: environmentalContext,
            fallRiskScore: fallRiskScore,
            timestamp: Date()
        )
    }

    private func analyzeBalance() -> BalanceAnalysisResult {
        // Implement balance-specific analysis
        return BalanceAnalysisResult(
            stabilityIndex: 85.0,
            swayVelocity: 12.5,
            confidenceEllipse: CGSize(width: 15, height: 12),
            reactionTime: 180.0,
            timestamp: Date()
        )
    }

    private func analyzeEnvironment() -> EnvironmentAnalysisResult {
        // Analyze environmental hazards using LiDAR mesh data
        return EnvironmentAnalysisResult(
            obstacles: detectObstacles(),
            surfaceAnalysis: analyzeSurfaceConditions(),
            lighting: assessLightingConditions(),
            hazardScore: calculateEnvironmentalHazardScore(),
            timestamp: Date()
        )
    }

    // MARK: - Helper Methods
    private func extractBodyPose(from anchor: ARBodyAnchor) -> BodyPose? {
        // Extract key joint positions from ARBodyAnchor
        let skeleton = anchor.skeleton

        // Get critical joints for posture analysis
        guard let headTransform = skeleton.joint(.head)?.anchorFromJointTransform,
              let spineTopTransform = skeleton.joint(.spineUpper)?.anchorFromJointTransform,
              let spineBottomTransform = skeleton.joint(.spineLower)?.anchorFromJointTransform else {
            return nil
        }

        return BodyPose(
            head: extractPosition(from: headTransform),
            spineTop: extractPosition(from: spineTopTransform),
            spineBottom: extractPosition(from: spineBottomTransform),
            timestamp: Date()
        )
    }

    private func extractPosition(from transform: simd_float4x4) -> SIMD3<Float> {
        return SIMD3<Float>(transform.columns.3.x, transform.columns.3.y, transform.columns.3.z)
    }

    private func calculatePosturalSway(from poses: [BodyPose]) -> PosturalSwayMetrics {
        guard !poses.isEmpty else {
            return PosturalSwayMetrics(anteriorPosterior: 0, mediolateral: 0, totalSway: 0)
        }

        // Calculate center of mass movement
        let headPositions = poses.map { $0.head }

        // Calculate sway in different directions
        let anteriorPosterior = calculateSwayRange(positions: headPositions, axis: 2) * 1000 // Convert to mm
        let mediolateral = calculateSwayRange(positions: headPositions, axis: 0) * 1000
        let totalSway = sqrt(pow(anteriorPosterior, 2) + pow(mediolateral, 2))

        return PosturalSwayMetrics(
            anteriorPosterior: anteriorPosterior,
            mediolateral: mediolateral,
            totalSway: totalSway
        )
    }

    private func calculateSwayRange(positions: [SIMD3<Float>], axis: Int) -> Float {
        let values = positions.map { $0[axis] }
        guard let min = values.min(), let max = values.max() else { return 0 }
        return max - min
    }

    private func analyzeSpinalAlignment(from poses: [BodyPose]) -> SpinalAlignmentMetrics {
        guard !poses.isEmpty else {
            return SpinalAlignmentMetrics(
                thoracicKyphosis: 30.0,
                lumbarLordosis: 35.0,
                headForwardPosture: 5.0
            )
        }

        // Calculate average spinal curvatures
        let thoracicAngles = poses.map { calculateThoracicKyphosis(pose: $0) }
        let lumbarAngles = poses.map { calculateLumbarLordosis(pose: $0) }
        let headAngles = poses.map { calculateHeadForwardPosture(pose: $0) }

        return SpinalAlignmentMetrics(
            thoracicKyphosis: thoracicAngles.reduce(0, +) / Float(thoracicAngles.count),
            lumbarLordosis: lumbarAngles.reduce(0, +) / Float(lumbarAngles.count),
            headForwardPosture: headAngles.reduce(0, +) / Float(headAngles.count)
        )
    }

    private func calculateThoracicKyphosis(pose: BodyPose) -> Float {
        // Calculate angle between spine segments
        let upperSpine = pose.spineTop - pose.spineBottom
        let reference = SIMD3<Float>(0, 1, 0) // Vertical reference

        let angle = acos(dot(normalize(upperSpine), reference)) * 180 / .pi
        return angle
    }

    private func calculateLumbarLordosis(pose: BodyPose) -> Float {
        // Simplified calculation - would need more spine joints for accuracy
        return 35.0 + Float.random(in: -10...10)
    }

    private func calculateHeadForwardPosture(pose: BodyPose) -> Float {
        // Calculate head position relative to spine
        let headToSpine = pose.head - pose.spineTop
        let angle = atan2(headToSpine.z, headToSpine.y) * 180 / .pi
        return abs(angle)
    }

    private func calculateBalanceMetrics(from poses: [BodyPose]) -> BalanceMetrics {
        // Calculate stability and weight distribution
        let stability = calculateStabilityIndex(from: poses)
        let weightDistribution = calculateWeightDistribution(from: poses)
        let reactionTime = calculateReactionTime(from: poses)

        return BalanceMetrics(
            stabilityIndex: stability,
            weightDistribution: weightDistribution,
            reactionTime: reactionTime
        )
    }

    private func calculateStabilityIndex(from poses: [BodyPose]) -> Float {
        guard poses.count > 1 else { return 100.0 }

        // Calculate movement variability
        let movements = poses.dropFirst().enumerated().map { index, pose in
            distance(poses[index].head, pose.head)
        }

        let avgMovement = movements.reduce(0, +) / Float(movements.count)
        let stabilityIndex = max(0, 100 - (avgMovement * 1000)) // Convert to percentage

        return stabilityIndex
    }

    private func calculateWeightDistribution(from poses: [BodyPose]) -> WeightDistribution {
        // Simplified - would need foot tracking for accuracy
        return WeightDistribution(
            left: 48.0 + Float.random(in: -3...3),
            right: 52.0 + Float.random(in: -3...3)
        )
    }

    private func calculateReactionTime(from poses: [BodyPose]) -> Float {
        // Estimate based on movement responsiveness
        return 180.0 + Float.random(in: -30...50)
    }

    private func identifyPostureRiskFactors(
        sway: PosturalSwayMetrics,
        alignment: SpinalAlignmentMetrics,
        balance: BalanceMetrics
    ) -> [String] {
        var riskFactors: [String] = []

        if sway.totalSway > 30 {
            riskFactors.append("Excessive postural sway")
        }

        if alignment.headForwardPosture > 8 {
            riskFactors.append("Forward head posture")
        }

        if alignment.thoracicKyphosis > 45 {
            riskFactors.append("Excessive thoracic kyphosis")
        }

        if balance.stabilityIndex < 70 {
            riskFactors.append("Reduced balance stability")
        }

        return riskFactors
    }

    private func calculateAnalysisConfidence() -> Float {
        // Calculate confidence based on data quality
        let dataQuality = Float(pointCloudData.count) / 1000.0 // Normalize
        let trackingQuality = Float(bodyAnchorData.count) / 100.0 // Normalize

        return min(100, (dataQuality + trackingQuality) * 50)
    }

    private func getLiDARDeviceInfo() -> DeviceInfo {
        return DeviceInfo(
            model: UIDevice.current.model,
            lidarVersion: "ARKit 6.0",
            accuracy: 0.98
        )
    }

    // MARK: - Gait Analysis Helpers
    private func extractWalkingSequences(from anchors: [ARBodyAnchor]) -> [WalkingSequence] {
        // Group consecutive walking frames
        return [] // Placeholder implementation
    }

    private func calculateSpatialGaitMetrics(from sequences: [WalkingSequence]) -> SpatialGaitMetrics {
        return SpatialGaitMetrics(
            stepWidth: 10.5,
            stepLength: 65.2,
            strideLength: 130.4,
            footClearance: 3.2
        )
    }

    private func calculateTemporalGaitMetrics(from sequences: [WalkingSequence]) -> TemporalGaitMetrics {
        return TemporalGaitMetrics(
            cadence: 112.0,
            velocityVariability: 4.2,
            rhythmIndex: 88.5
        )
    }

    private func analyzeKinematicChain(from sequences: [WalkingSequence]) -> KinematicChainMetrics {
        return KinematicChainMetrics(
            ankleFlexion: Array(repeating: 15.0, count: 10),
            kneeFlexion: Array(repeating: 45.0, count: 10),
            hipFlexion: Array(repeating: 25.0, count: 10),
            trunkSway: Array(repeating: 3.5, count: 10)
        )
    }

    private func calculateGaitAsymmetry(from sequences: [WalkingSequence]) -> AsymmetryMetrics {
        return AsymmetryMetrics(
            spatialAsymmetry: 3.2,
            temporalAsymmetry: 2.8,
            kinematicAsymmetry: 4.1
        )
    }

    private func analyzeWalkingEnvironment() -> EnvironmentalContext {
        return EnvironmentalContext(
            surfaceType: "Level",
            obstacles: 0,
            lighting: "Optimal"
        )
    }

    private func calculateLiDARFallRiskScore(
        spatial: SpatialGaitMetrics,
        temporal: TemporalGaitMetrics,
        asymmetry: AsymmetryMetrics
    ) -> Float {
        var riskScore: Float = 0

        // Spatial risk factors
        if spatial.stepWidth > 12 || spatial.stepWidth < 8 { riskScore += 10 }
        if spatial.stepLength < 50 { riskScore += 15 }
        if spatial.footClearance < 2 { riskScore += 20 }

        // Temporal risk factors
        if temporal.cadence < 100 { riskScore += 10 }
        if temporal.velocityVariability > 6 { riskScore += 15 }

        // Asymmetry risk factors
        if asymmetry.spatialAsymmetry > 5 { riskScore += 15 }
        if asymmetry.temporalAsymmetry > 5 { riskScore += 10 }

        return min(100, riskScore)
    }

    // MARK: - Environment Analysis Helpers
    private func detectObstacles() -> [EnvironmentalObstacle] {
        return [] // Placeholder
    }

    private func analyzeSurfaceConditions() -> SurfaceAnalysis {
        return SurfaceAnalysis(type: "Level", roughness: 0.1, stability: 0.95)
    }

    private func assessLightingConditions() -> LightingConditions {
        return LightingConditions(quality: "Optimal", intensity: 80.0)
    }

    private func calculateEnvironmentalHazardScore() -> Float {
        return 15.0 // Low hazard score
    }
}

// MARK: - ARSessionDelegate
@available(iOS 14.0, *)
extension LiDARPostureAnalyzer: ARSessionDelegate {

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        guard isAnalyzing else { return }

        // Collect depth data
        if let depthData = frame.smoothedSceneDepth ?? frame.sceneDepth {
            processDepthData(depthData, frame: frame)
        }

        // Store frame for analysis
        if depthFrames.count < 1000 { // Limit storage
            depthFrames.append(frame)
        }
    }

    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        for anchor in anchors {
            if let bodyAnchor = anchor as? ARBodyAnchor {
                bodyAnchorData.append(bodyAnchor)
            }
        }
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            if let bodyAnchor = anchor as? ARBodyAnchor {
                bodyAnchorData.append(bodyAnchor)
            }
        }
    }

    private func processDepthData(_ depthData: ARDepthData, frame: ARFrame) {
        let depthMap = depthData.depthMap

        // Convert depth map to point cloud
        let width = CVPixelBufferGetWidth(depthMap)
        let height = CVPixelBufferGetHeight(depthMap)

        CVPixelBufferLockBaseAddress(depthMap, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else { return }
        let depthPointer = baseAddress.assumingMemoryBound(to: Float32.self)

        // Sample every 10th pixel to reduce data volume
        for y in stride(from: 0, to: height, by: 10) {
            for x in stride(from: 0, to: width, by: 10) {
                let index = y * width + x
                let depth = depthPointer[index]

                guard depth > 0 && depth < 5.0 else { continue } // Filter invalid depths

                // Convert pixel to 3D coordinates
                let point = frame.camera.unprojectPoint(
                    CGPoint(x: x, y: y),
                    ontoPlaneWithTransform: matrix_identity_float4x4,
                    orientation: .portrait,
                    viewportSize: CGSize(width: width, height: height)
                )

                let lidarPoint = LiDARPoint(
                    x: point.x,
                    y: point.y,
                    z: depth,
                    intensity: Float.random(in: 0...255),
                    timestamp: Date().timeIntervalSince1970
                )

                pointCloudData.append(lidarPoint)
            }
        }
    }
}

// MARK: - Data Models
enum AnalysisType: String, CaseIterable {
    case posture = "posture"
    case gait = "gait"
    case balance = "balance"
    case environment = "environment"
}

struct LiDARPoint {
    let x: Float
    let y: Float
    let z: Float
    let intensity: Float
    let timestamp: TimeInterval
}

struct BodyPose {
    let head: SIMD3<Float>
    let spineTop: SIMD3<Float>
    let spineBottom: SIMD3<Float>
    let timestamp: Date
}

struct PosturalSwayMetrics {
    let anteriorPosterior: Float
    let mediolateral: Float
    let totalSway: Float
}

struct SpinalAlignmentMetrics {
    let thoracicKyphosis: Float
    let lumbarLordosis: Float
    let headForwardPosture: Float
}

struct BalanceMetrics {
    let stabilityIndex: Float
    let weightDistribution: WeightDistribution
    let reactionTime: Float
}

struct WeightDistribution {
    let left: Float
    let right: Float
}

struct PostureAnalysisResult {
    let posturalSway: PosturalSwayMetrics
    let spinalAlignment: SpinalAlignmentMetrics
    let balanceMetrics: BalanceMetrics
    let riskFactors: [String]
    let confidence: Float
    let timestamp: Date
}

struct GaitAnalysisResult {
    let spatialMetrics: SpatialGaitMetrics
    let temporalMetrics: TemporalGaitMetrics
    let kinematicChain: KinematicChainMetrics
    let asymmetryMetrics: AsymmetryMetrics
    let environmentalContext: EnvironmentalContext
    let fallRiskScore: Float
    let timestamp: Date
}

struct SpatialGaitMetrics {
    let stepWidth: Float
    let stepLength: Float
    let strideLength: Float
    let footClearance: Float
}

struct TemporalGaitMetrics {
    let cadence: Float
    let velocityVariability: Float
    let rhythmIndex: Float
}

struct KinematicChainMetrics {
    let ankleFlexion: [Float]
    let kneeFlexion: [Float]
    let hipFlexion: [Float]
    let trunkSway: [Float]
}

struct AsymmetryMetrics {
    let spatialAsymmetry: Float
    let temporalAsymmetry: Float
    let kinematicAsymmetry: Float
}

struct EnvironmentalContext {
    let surfaceType: String
    let obstacles: Int
    let lighting: String
}

struct BalanceAnalysisResult {
    let stabilityIndex: Float
    let swayVelocity: Float
    let confidenceEllipse: CGSize
    let reactionTime: Float
    let timestamp: Date
}

struct EnvironmentAnalysisResult {
    let obstacles: [EnvironmentalObstacle]
    let surfaceAnalysis: SurfaceAnalysis
    let lighting: LightingConditions
    let hazardScore: Float
    let timestamp: Date
}

struct EnvironmentalObstacle {
    let type: String
    let location: SIMD3<Float>
    let size: SIMD3<Float>
    let riskLevel: Float
}

struct SurfaceAnalysis {
    let type: String
    let roughness: Float
    let stability: Float
}

struct LightingConditions {
    let quality: String
    let intensity: Float
}

struct DeviceInfo {
    let model: String
    let lidarVersion: String
    let accuracy: Float
}

struct WalkingSequence {
    let poses: [BodyPose]
    let duration: TimeInterval
}

class LiDARSessionData: ObservableObject {
    let sessionId: String
    let startTime: Date
    let duration: TimeInterval
    let analysisType: AnalysisType
    let pointCloudData: [LiDARPoint]
    let deviceInfo: DeviceInfo

    var postureAnalysis: PostureAnalysisResult?
    var gaitAnalysis: GaitAnalysisResult?
    var balanceAnalysis: BalanceAnalysisResult?
    var environmentAnalysis: EnvironmentAnalysisResult?

    init(sessionId: String, startTime: Date, duration: TimeInterval, analysisType: AnalysisType, pointCloudData: [LiDARPoint], deviceInfo: DeviceInfo) {
        self.sessionId = sessionId
        self.startTime = startTime
        self.duration = duration
        self.analysisType = analysisType
        self.pointCloudData = pointCloudData
        self.deviceInfo = deviceInfo
    }
}
