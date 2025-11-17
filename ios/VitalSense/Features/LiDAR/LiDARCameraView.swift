import SwiftUI
import ARKit
import RealityKit
import UIKit

// MARK: - LiDAR Camera View
struct LiDARCameraView: UIViewRepresentable {
    let lidarManager: LiDARScanningManager
    let scanType: LiDARScanningView.ScanType

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        // Configure AR session for LiDAR
        let config = ARWorldTrackingConfiguration()

        // Enable LiDAR scene reconstruction
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification) {
            config.sceneReconstruction = .meshWithClassification
        } else if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            config.sceneReconstruction = .mesh
        } else {
            // No LiDAR support - report error
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "ARKit", code: -1, userInfo: [NSLocalizedDescriptionKey: "Scene reconstruction not supported"]),
                    context: "AR configuration",
                    category: .arkit,
                    severity: .high,
                    recovery: .none
                )
            )
            return arView
        }

        // Enable plane detection
        config.planeDetection = [.horizontal, .vertical]

        // Enable person occlusion for better AR effects
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
            config.frameSemantics.insert(.personSegmentationWithDepth)
        }

        // Enable body tracking for gait analysis
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.bodyDetection) {
            config.frameSemantics.insert(.bodyDetection)
        }

        // Start AR session with error handling
        do {
            arView.session.run(config)

            // Log analytics event
            AnalyticsManager.shared.logEvent("lidar_ar_session_started", parameters: [
                "scan_type": scanType.rawValue,
                "scene_reconstruction": config.sceneReconstruction == .meshWithClassification ? "meshWithClassification" : "mesh"
            ])
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Starting AR session",
                category: .arkit,
                severity: .critical,
                recovery: .retry(maxAttempts: 2)
            )
        }

        // Set up session delegate
        arView.session.delegate = context.coordinator

        // Configure environment for LiDAR visualization
        setupLiDARVisualization(arView: arView)

        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Update visualization based on scan type
        context.coordinator.updateScanType(scanType)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(lidarManager: lidarManager)
    }

    private func setupLiDARVisualization(arView: ARView) {
        // Add lighting for better 3D visualization
        let lightAnchor = AnchorEntity()
        let light = DirectionalLight()
        light.light.intensity = 1000
        light.shadow = DirectionalLightComponent.Shadow()
        lightAnchor.addChild(light)
        arView.scene.addAnchor(lightAnchor)

        // Enable debug options for development
        #if DEBUG
        arView.debugOptions = [
            .showFeaturePoints,
            .showWorldOrigin
        ]
        #endif
    }
}

// MARK: - AR Session Coordinator
class LiDARCameraCoordinator: NSObject, ARSessionDelegate {
    private let lidarManager: LiDARScanningManager
    private var currentScanType: LiDARScanningView.ScanType = .fallRiskAssessment
    private var pointCloudNode: SCNNode?
    private var meshNodes: [SCNNode] = []
    private var gaitTrackingPoints: [simd_float3] = []

    // Gait analysis tracking
    private var stepTimestamps: [TimeInterval] = []
    private var leftFootPositions: [(timestamp: TimeInterval, position: simd_float3)] = []
    private var rightFootPositions: [(timestamp: TimeInterval, position: simd_float3)] = []
    private var lastLeftStrike: TimeInterval?
    private var lastRightStrike: TimeInterval?

    // Environmental analysis
    private var detectedPlanes: [ARPlaneAnchor] = []
    private var detectedObstacles: [simd_float3] = []
    private var floorPlanes: [ARPlaneAnchor] = []

    // Balance analysis
    private var centerOfMassHistory: [simd_float3] = []
    private var posturalSwayData: [simd_float2] = []

    init(lidarManager: LiDARScanningManager) {
        self.lidarManager = lidarManager
        super.init()
    }

    func updateScanType(_ scanType: LiDARScanningView.ScanType) {
        currentScanType = scanType
        // Clear previous visualizations
        clearVisualization()
    }

    // MARK: - ARSessionDelegate
    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        // Process LiDAR depth data
        guard let depthData = frame.sceneDepth else {
            ErrorHandler.shared.handle(
                AppError(
                    error: NSError(domain: "ARKit", code: -1, userInfo: [NSLocalizedDescriptionKey: "No scene depth data available"]),
                    context: "AR frame processing",
                    category: .arkit,
                    severity: .low,
                    recovery: .none
                )
            )
            return
        }

        // Update point count for UI
        let depthMap = depthData.depthMap
        let width = CVPixelBufferGetWidth(depthMap)
        let height = CVPixelBufferGetHeight(depthMap)

        DispatchQueue.main.async {
            self.lidarManager.currentPointCount = width * height
            self.lidarManager.scanQuality = self.calculateScanQuality(frame: frame)
        }

        // Process based on scan type
        do {
            switch currentScanType {
            case .fallRiskAssessment:
                processFallRiskFrame(frame)
            case .gaitAnalysis:
                processGaitAnalysisFrame(frame)
                // Stream real-time gait metrics
                streamGaitMetricsIfNeeded()
            case .environmentalScan:
                processEnvironmentalFrame(frame)
                // Stream environmental data
                streamEnvironmentalDataIfNeeded()
            case .balanceTest:
                processBalanceTestFrame(frame)
                // Stream balance data
                streamBalanceDataIfNeeded()
            }
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Processing AR frame for \(currentScanType.rawValue)",
                category: .arkit,
                severity: .medium,
                recovery: .retry(maxAttempts: 1)
            )
        }

        // Send frame to manager for processing
        lidarManager.processFrame(frame)
    }

    // MARK: - Real-time Streaming

    private var lastStreamTime: TimeInterval = 0
    private let streamThrottleInterval: TimeInterval = 1.0 // Stream every second

    private func streamGaitMetricsIfNeeded() {
        let now = Date().timeIntervalSince1970
        guard now - lastStreamTime >= streamThrottleInterval else { return }
        lastStreamTime = now

        // Calculate metrics if we have enough data
        guard stepTimestamps.count >= 2, !leftFootPositions.isEmpty else { return }

        let cadence = calculateCadence()
        let strideLength = calculateStrideLength()
        let walkingSpeed = strideLength * cadence / 60.0

        // Calculate step symmetry from accelerometer if available
        // This is a simplified version - full implementation would use more data
        let stepSymmetry = 0.75 // Placeholder - would calculate from actual data

        Task {
            await WebSocketManager.shared.sendLiDARGaitMetrics(
                cadence: cadence,
                strideLength: strideLength,
                walkingSpeed: walkingSpeed,
                stepSymmetry: stepSymmetry,
                scanType: currentScanType.rawValue
            )
        }
    }

    private func streamEnvironmentalDataIfNeeded() {
        let now = Date().timeIntervalSince1970
        guard now - lastStreamTime >= streamThrottleInterval else { return }
        lastStreamTime = now

        // Calculate floor stability from detected planes
        let floorStability = floorPlanes.first.map { plane -> Double in
            let extent = plane.planeExtent
            let area = extent.width * extent.height
            return min(1.0, area / 10.0)
        }

        Task {
            await WebSocketManager.shared.sendLiDAREnvironmentalData(
                obstacles: detectedObstacles,
                floorStability: floorStability,
                hazards: detectedObstacles.count
            )
        }
    }

    private func streamBalanceDataIfNeeded() {
        let now = Date().timeIntervalSince1970
        guard now - lastStreamTime >= streamThrottleInterval else { return }
        lastStreamTime = now

        // Calculate stability score from postural sway
        let stabilityScore = posturalSwayData.isEmpty ? nil : {
            let swayVariances = posturalSwayData.map { sqrt(Double($0.x * $0.x + $0.y * $0.y)) }
            let avgSway = swayVariances.reduce(0, +) / Double(swayVariances.count)
            return max(0, min(1, 1.0 - avgSway / 2.0))
        }()

        let centerOfMass = centerOfMassHistory.last

        Task {
            await WebSocketManager.shared.sendLiDARBalanceData(
                centerOfMass: centerOfMass,
                posturalSway: posturalSwayData.isEmpty ? nil : Double(posturalSwayData.last!.x + posturalSwayData.last!.y),
                stabilityScore: stabilityScore
            )
        }
    }

    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
        for anchor in anchors {
            if let meshAnchor = anchor as? ARMeshAnchor {
                processMeshAnchor(meshAnchor)
            } else if let planeAnchor = anchor as? ARPlaneAnchor {
                processPlaneAnchor(planeAnchor)
                // Track detected planes
                if !detectedPlanes.contains(where: { $0.identifier == planeAnchor.identifier }) {
                    detectedPlanes.append(planeAnchor)
                }
            }
        }
    }

    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        for anchor in anchors {
            if let meshAnchor = anchor as? ARMeshAnchor {
                updateMeshAnchor(meshAnchor)
            }
        }
    }

    // MARK: - Scan Processing Methods
    private func processFallRiskFrame(_ frame: ARFrame) {
        // Analyze floor detection, obstacles, and walking patterns
        guard let depthData = frame.sceneDepth else { return }

        // Detect floor plane and obstacles
        analyzeFloorStability(frame: frame)
        detectObstacles(frame: frame, depthData: depthData)

        // If person is detected, analyze gait
        if frame.detectedBody != nil {
            analyzeWalkingPattern(frame: frame)
        }
    }

    private func processGaitAnalysisFrame(_ frame: ARFrame) {
        // Detailed gait analysis with body tracking
        guard let bodyAnchor = frame.detectedBody else { return }

        // Track joint positions for gait analysis
        trackJointMovement(bodyAnchor: bodyAnchor)

        // Calculate stride length, cadence, etc.
        calculateGaitMetrics(bodyAnchor: bodyAnchor)
    }

    private func processEnvironmentalFrame(_ frame: ARFrame) {
        // Scan for environmental hazards and obstacles
        guard let depthData = frame.sceneDepth else { return }

        // Detect stairs, furniture, and other hazards
        detectStairs(frame: frame, depthData: depthData)
        detectFurniture(frame: frame, depthData: depthData)
        analyzeRoomLayout(frame: frame, depthData: depthData)
    }

    private func processBalanceTestFrame(_ frame: ARFrame) {
        // Analyze postural sway and balance
        guard let bodyAnchor = frame.detectedBody else { return }

        // Track center of mass movement
        analyzeCenterOfMass(bodyAnchor: bodyAnchor)

        // Measure postural sway
        measurePosturalSway(bodyAnchor: bodyAnchor)
    }

    // MARK: - Analysis Methods
    private func analyzeFloorStability(frame: ARFrame) {
        // Check for level flooring and potential trip hazards
        // Analyze detected horizontal planes for stability
        let horizontalPlanes = detectedPlanes.filter { $0.alignment == .horizontal }

        guard !horizontalPlanes.isEmpty else { return }

        // Find the lowest horizontal plane (likely the floor)
        let floorPlane = horizontalPlanes.min { $0.transform.columns.3.y < $1.transform.columns.3.y }

        guard let floor = floorPlane else { return }

        // Check floor levelness by analyzing plane extent
        let extent = floor.planeExtent
        let area = extent.width * extent.height

        // Larger area = more stable floor detection
        let stabilityScore = min(1.0, area / 10.0) // Normalize to 0-1

        // Store floor planes for hazard detection
        if !floorPlanes.contains(where: { $0.identifier == floor.identifier }) {
            floorPlanes.append(floor)
        }

        // Analyze for irregularities (would use mesh analysis in full implementation)
        // For now, just check if floor plane has reasonable extent
    }

    private func detectObstacles(frame: ARFrame, depthData: ARDepthData) {
        // Identify obstacles in the walking path using depth data
        let depthMap = depthData.depthMap
        let width = CVPixelBufferGetWidth(depthMap)
        let height = CVPixelBufferGetHeight(depthMap)

        guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else { return }

        CVPixelBufferLockBaseAddress(depthMap, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(depthMap, .readOnly) }

        let bytesPerRow = CVPixelBufferGetBytesPerRow(depthMap)
        let baseBuffer = baseAddress.assumingMemoryBound(to: Float32.self)

        // Sample depth values to detect obstacles
        // Obstacles are points significantly closer than expected floor distance
        var obstaclePoints: [simd_float3] = []

        // Sample every 10th pixel for performance
        for y in stride(from: 0, to: height, by: 10) {
            for x in stride(from: 0, to: width, by: 10) {
                let pixelIndex = y * (bytesPerRow / MemoryLayout<Float32>.size) + x
                let depth = baseBuffer[pixelIndex]

                // Convert depth to world position using camera intrinsics
                // Simple approximation: use depth and pixel coordinates
                // Note: Full implementation would use proper camera matrix projection
                let normalizedX = (Float(x) / Float(width)) * 2.0 - 1.0
                let normalizedY = 1.0 - (Float(y) / Float(height)) * 2.0

                // Approximate world position from depth
                // This is a simplified version - full implementation would use camera intrinsics
                let cameraTransform = frame.camera.transform
                let cameraForward = simd_make_float3(cameraTransform.columns.2)
                let cameraRight = simd_make_float3(cameraTransform.columns.0)
                let cameraUp = simd_make_float3(cameraTransform.columns.1)
                let cameraPos = simd_make_float3(cameraTransform.columns.3)

                // Approximate world position
                let worldPos = cameraPos + cameraForward * depth +
                              cameraRight * normalizedX * depth * 0.5 +
                              cameraUp * normalizedY * depth * 0.5

                // Check if this point is significantly above the floor
                if let floor = floorPlanes.first {
                    let floorY = floor.transform.columns.3.y
                    let obstacleHeight = worldPos.y - floorY

                    // Detect obstacles between 0.1m and 1.5m height
                    if obstacleHeight > 0.1 && obstacleHeight < 1.5 {
                        obstaclePoints.append(worldPos)
                    }
                } else {
                    // If no floor detected, still detect obstacles based on depth
                    // Objects closer than 2m might be obstacles
                    if depth > 0.1 && depth < 2.0 {
                        obstaclePoints.append(worldPos)
                    }
                }
            }
        }

        // Cluster obstacle points and store significant obstacles
        if obstaclePoints.count > 10 {
            // Simple clustering - group nearby points
            var clusteredObstacles: [simd_float3] = []
            var processed = Set<Int>()

            for (index, point) in obstaclePoints.enumerated() {
                if processed.contains(index) { continue }

                // Find nearby points (within 0.3m)
                var cluster = [point]
                for (otherIndex, otherPoint) in obstaclePoints.enumerated() where otherIndex != index {
                    if simd_distance(point, otherPoint) < 0.3 {
                        cluster.append(otherPoint)
                        processed.insert(otherIndex)
                    }
                }

                // If cluster is significant, add its center
                if cluster.count >= 5 {
                    let center = cluster.reduce(simd_float3(0, 0, 0), +) / Float(cluster.count)
                    clusteredObstacles.append(center)
                    processed.insert(index)
                }
            }

            detectedObstacles = clusteredObstacles
        }
    }

    private func analyzeWalkingPattern(frame: ARFrame) {
        // Analyze walking biomechanics from body tracking
        guard let bodyAnchor = frame.detectedBody else { return }

        let skeleton = bodyAnchor.skeleton
        guard let leftFoot = skeleton.joint(.leftFoot)?.anchorFromJointTransform,
              let rightFoot = skeleton.joint(.rightFoot)?.anchorFromJointTransform,
              let leftHip = skeleton.joint(.leftLegRoot)?.anchorFromJointTransform,
              let rightHip = skeleton.joint(.rightLegRoot)?.anchorFromJointTransform else {
            return
        }

        let bodyTransform = bodyAnchor.transform
        let leftFootWorld = simd_make_float3((bodyTransform * leftFoot).columns.3)
        let rightFootWorld = simd_make_float3((bodyTransform * rightFoot).columns.3)
        let leftHipWorld = simd_make_float3((bodyTransform * leftHip).columns.3)
        let rightHipWorld = simd_make_float3((bodyTransform * rightHip).columns.3)

        // Calculate step width (lateral distance between feet)
        let stepWidth = abs(leftFootWorld.x - rightFootWorld.x)

        // Calculate hip height difference (asymmetry indicator)
        let hipHeightDiff = abs(leftHipWorld.y - rightHipWorld.y)

        // Analyze step symmetry
        if let lastLeft = leftFootPositions.last, let lastRight = rightFootPositions.last {
            let leftStepLength = simd_distance(leftFootWorld, lastLeft.position)
            let rightStepLength = simd_distance(rightFootWorld, lastRight.position)

            // Store for later analysis
            gaitTrackingPoints.append(leftFootWorld)
            gaitTrackingPoints.append(rightFootWorld)

            if gaitTrackingPoints.count > 100 {
                analyzeGaitPattern()
            }
        }
    }

    private func trackJointMovement(bodyAnchor: ARBodyAnchor) {
        // Track key joints for gait analysis
        let skeleton = bodyAnchor.skeleton

        // Get key joint positions
        if let leftAnkle = skeleton.modelTransform(for: .leftFoot),
           let rightAnkle = skeleton.modelTransform(for: .rightFoot),
           let leftKnee = skeleton.modelTransform(for: .leftLeg),
           let rightKnee = skeleton.modelTransform(for: .rightLeg) {

            // Store joint positions for analysis
            let leftAnklePos = simd_make_float3(leftAnkle.columns.3)
            let rightAnklePos = simd_make_float3(rightAnkle.columns.3)

            gaitTrackingPoints.append(leftAnklePos)
            gaitTrackingPoints.append(rightAnklePos)

            // Analyze gait pattern
            if gaitTrackingPoints.count > 100 {
                analyzeGaitPattern()
                gaitTrackingPoints.removeFirst(50) // Keep recent data
            }
        }
    }

    private func calculateGaitMetrics(bodyAnchor: ARBodyAnchor) {
        // Calculate stride length, cadence, walking speed from joint positions
        let skeleton = bodyAnchor.skeleton
        let timestamp = Date().timeIntervalSince1970

        guard let leftFootTransform = skeleton.joint(.leftFoot)?.anchorFromJointTransform,
              let rightFootTransform = skeleton.joint(.rightFoot)?.anchorFromJointTransform else {
            return
        }

        // Get world positions
        let bodyTransform = bodyAnchor.transform
        let leftFootWorld = simd_make_float3((bodyTransform * leftFootTransform).columns.3)
        let rightFootWorld = simd_make_float3((bodyTransform * rightFootTransform).columns.3)

        // Track foot positions
        leftFootPositions.append((timestamp: timestamp, position: leftFootWorld))
        rightFootPositions.append((timestamp: timestamp, position: rightFootWorld))

        // Keep only recent data (last 5 seconds at ~30fps = 150 frames)
        if leftFootPositions.count > 150 {
            leftFootPositions.removeFirst(leftFootPositions.count - 150)
            rightFootPositions.removeFirst(rightFootPositions.count - 150)
        }

        // Detect step events (foot moving upward then downward)
        detectStepEvents(leftFoot: leftFootWorld, rightFoot: rightFootWorld, timestamp: timestamp)

        // Calculate metrics if we have enough data
        if stepTimestamps.count >= 2 {
            let cadence = calculateCadence()
            let strideLength = calculateStrideLength()
            let walkingSpeed = strideLength * cadence / 60.0 // m/s

            // Update step count in manager
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                // Step count will be used when processing scan results
            }
        }
    }

    private func detectStepEvents(leftFoot: simd_float3, rightFoot: simd_float3, timestamp: TimeInterval) {
        // Simple step detection based on vertical movement
        // A step occurs when a foot reaches its lowest point after being raised

        if leftFootPositions.count >= 3 {
            let prevLeft = leftFootPositions[leftFootPositions.count - 2].position
            let prevPrevLeft = leftFootPositions[leftFootPositions.count - 3].position

            // Detect local minimum (heel strike)
            if prevLeft.y < leftFoot.y && prevLeft.y < prevPrevLeft.y {
                if let lastRight = lastRightStrike, timestamp - lastRight > 0.3 {
                    // Valid step detected
                    stepTimestamps.append(timestamp)
                    lastLeftStrike = timestamp
                } else if lastRightStrike == nil {
                    // First step
                    stepTimestamps.append(timestamp)
                    lastLeftStrike = timestamp
                }
            }
        }

        if rightFootPositions.count >= 3 {
            let prevRight = rightFootPositions[rightFootPositions.count - 2].position
            let prevPrevRight = rightFootPositions[rightFootPositions.count - 3].position

            // Detect local minimum (heel strike)
            if prevRight.y < rightFoot.y && prevRight.y < prevPrevRight.y {
                if let lastLeft = lastLeftStrike, timestamp - lastLeft > 0.3 {
                    // Valid step detected
                    stepTimestamps.append(timestamp)
                    lastRightStrike = timestamp
                } else if lastLeftStrike == nil {
                    // First step
                    stepTimestamps.append(timestamp)
                    lastRightStrike = timestamp
                }
            }
        }

        // Keep only recent step timestamps
        if stepTimestamps.count > 100 {
            stepTimestamps.removeFirst(stepTimestamps.count - 100)
        }
    }

    private func calculateCadence() -> Double {
        // Cadence = steps per minute
        guard stepTimestamps.count >= 2 else { return 0 }

        let timeSpan = stepTimestamps.last! - stepTimestamps.first!
        guard timeSpan > 0 else { return 0 }

        let stepsPerSecond = Double(stepTimestamps.count - 1) / timeSpan
        return stepsPerSecond * 60.0
    }

    private func calculateStrideLength() -> Double {
        // Average stride length from foot positions
        guard leftFootPositions.count >= 2 && rightFootPositions.count >= 2 else { return 0 }

        var totalDistance: Double = 0
        var count = 0

        // Calculate distance between consecutive left foot positions
        for i in 1..<leftFootPositions.count {
            let prev = leftFootPositions[i-1].position
            let curr = leftFootPositions[i].position
            let distance = simd_distance(prev, curr)
            totalDistance += Double(distance * 2) // Stride = 2 steps
            count += 1
        }

        return count > 0 ? totalDistance / Double(count) : 0
    }

    private func detectStairs(frame: ARFrame, depthData: ARDepthData) {
        // Detect stairs and step hazards
        // Implementation would analyze depth patterns for step-like structures
    }

    private func detectFurniture(frame: ARFrame, depthData: ARDepthData) {
        // Detect furniture and potential obstacles
        // Implementation would use object detection on the depth map
    }

    private func analyzeRoomLayout(frame: ARFrame, depthData: ARDepthData) {
        // Analyze overall room layout for accessibility
        // Implementation would create a 3D map of the environment
    }

    private func analyzeCenterOfMass(bodyAnchor: ARBodyAnchor) {
        // Calculate and track center of mass for balance analysis
        let skeleton = bodyAnchor.skeleton
        let bodyTransform = bodyAnchor.transform

        // Get key joint positions for COM estimation
        var weightedPositions: [(position: simd_float3, weight: Float)] = []

        // Head (7% of body weight)
        if let head = skeleton.joint(.head)?.anchorFromJointTransform {
            let headWorld = simd_make_float3((bodyTransform * head).columns.3)
            weightedPositions.append((headWorld, 0.07))
        }

        // Torso/Spine (50% of body weight - approximate)
        if let spine = skeleton.joint(.spineLower)?.anchorFromJointTransform {
            let spineWorld = simd_make_float3((bodyTransform * spine).columns.3)
            weightedPositions.append((spineWorld, 0.50))
        }

        // Hips (15% of body weight)
        if let leftHip = skeleton.joint(.leftLegRoot)?.anchorFromJointTransform,
           let rightHip = skeleton.joint(.rightLegRoot)?.anchorFromJointTransform {
            let leftHipWorld = simd_make_float3((bodyTransform * leftHip).columns.3)
            let rightHipWorld = simd_make_float3((bodyTransform * rightHip).columns.3)
            let hipCenter = (leftHipWorld + rightHipWorld) / 2.0
            weightedPositions.append((hipCenter, 0.15))
        }

        // Calculate weighted center of mass
        guard !weightedPositions.isEmpty else { return }

        var totalWeight: Float = 0
        var weightedSum = simd_float3(0, 0, 0)

        for (position, weight) in weightedPositions {
            weightedSum += position * weight
            totalWeight += weight
        }

        guard totalWeight > 0 else { return }
        let centerOfMass = weightedSum / totalWeight

        // Track COM history for sway analysis
        centerOfMassHistory.append(centerOfMass)
        if centerOfMassHistory.count > 100 {
            centerOfMassHistory.removeFirst(centerOfMassHistory.count - 100)
        }
    }

    private func measurePosturalSway(bodyAnchor: ARBodyAnchor) {
        // Measure how much the person sways while standing
        guard centerOfMassHistory.count >= 2 else { return }

        // Calculate sway as deviation from average position
        let avgCOM = centerOfMassHistory.reduce(simd_float3(0, 0, 0), +) / Float(centerOfMassHistory.count)

        // Calculate lateral (x) and anteroposterior (z) sway
        var lateralSway: [Float] = []
        var anteroposteriorSway: [Float] = []

        for com in centerOfMassHistory {
            let deviation = com - avgCOM
            lateralSway.append(deviation.x)
            anteroposteriorSway.append(deviation.z)
        }

        // Calculate sway magnitude (standard deviation)
        let lateralVariance = calculateVariance(lateralSway.map { Double($0) })
        let apVariance = calculateVariance(anteroposteriorSway.map { Double($0) })
        let totalSway = sqrt(lateralVariance + apVariance)

        // Store for analysis
        posturalSwayData.append(simd_float2(Float(lateralVariance), Float(apVariance)))
        if posturalSwayData.count > 100 {
            posturalSwayData.removeFirst(posturalSwayData.count - 100)
        }
    }

    private func calculateVariance(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        let mean = values.reduce(0, +) / Double(values.count)
        let variance = values.map { pow($0 - mean, 2) }.reduce(0, +) / Double(values.count)
        return variance
    }

    private func analyzeGaitPattern() {
        // Analyze the collected gait tracking points
        guard gaitTrackingPoints.count >= 10 else { return }

        // Calculate step detection
        let stepCount = detectSteps(from: gaitTrackingPoints)

        DispatchQueue.main.async {
            // Update gait analyzer if available
            // self.lidarManager.gaitAnalyzer?.detectedSteps = stepCount
        }
    }

    private func detectSteps(from points: [simd_float3]) -> Int {
        // Simple step detection based on vertical movement patterns
        var steps = 0
        var lastPeakIndex = 0

        for i in 1..<points.count-1 {
            let current = points[i].y
            let prev = points[i-1].y
            let next = points[i+1].y

            // Detect local maxima (potential heel strikes)
            if current > prev && current > next && i - lastPeakIndex > 5 {
                steps += 1
                lastPeakIndex = i
            }
        }

        return steps / 2 // Divide by 2 since we're tracking both feet
    }

    // MARK: - Mesh Processing
    private func processMeshAnchor(_ meshAnchor: ARMeshAnchor) {
        // Process the 3D mesh data from LiDAR
        let geometry = meshAnchor.geometry

        // Create visualization node if needed
        if currentScanType == .environmentalScan {
            createMeshVisualization(for: meshAnchor)
        }

        // Analyze mesh for hazards and obstacles
        analyzeMeshGeometry(geometry)
    }

    private func updateMeshAnchor(_ meshAnchor: ARMeshAnchor) {
        // Update existing mesh visualization
        updateMeshVisualization(for: meshAnchor)
    }

    private func processPlaneAnchor(_ planeAnchor: ARPlaneAnchor) {
        // Process detected planes (floors, walls, etc.)
        if planeAnchor.alignment == .horizontal {
            // Floor plane detected
            analyzeFloorPlane(planeAnchor)
        } else if planeAnchor.alignment == .vertical {
            // Wall plane detected
            analyzeWallPlane(planeAnchor)
        }
    }

    private func createMeshVisualization(for meshAnchor: ARMeshAnchor) {
        // Create 3D visualization of the scanned mesh
        // Implementation would create SceneKit nodes for visualization
    }

    private func updateMeshVisualization(for meshAnchor: ARMeshAnchor) {
        // Update existing mesh visualization
        // Implementation would update the corresponding SceneKit nodes
    }

    private func analyzeMeshGeometry(_ geometry: ARMeshGeometry) {
        // Analyze the mesh geometry for health-related insights
        let vertices = geometry.vertices
        let faces = geometry.faces
        let classifications = geometry.classification

        // Process geometry data to identify hazards, obstacles, etc.
        // Implementation would analyze the 3D structure
    }

    private func analyzeFloorPlane(_ planeAnchor: ARPlaneAnchor) {
        // Analyze floor plane for levelness and obstacles
        let extent = planeAnchor.planeExtent

        // Check if floor is level and clear
        // Implementation would analyze the plane's properties
    }

    private func analyzeWallPlane(_ planeAnchor: ARPlaneAnchor) {
        // Analyze wall planes for room layout
        // Implementation would use wall detection for spatial analysis
    }

    // MARK: - Utility Methods
    private func calculateScanQuality(frame: ARFrame) -> Double {
        // Calculate scan quality based on various factors
        var quality = 1.0

        // Check tracking state
        switch frame.camera.trackingState {
        case .normal:
            quality *= 1.0
        case .limited(_):
            quality *= 0.7
        case .notAvailable:
            quality *= 0.3
        }

        // Check lighting conditions
        let lightEstimate = frame.lightEstimate?.ambientIntensity ?? 1000
        if lightEstimate < 500 {
            quality *= 0.8 // Poor lighting
        }

        // Check depth data availability
        if frame.sceneDepth == nil {
            quality *= 0.5
        }

        return max(0.0, min(1.0, quality))
    }

    private func clearVisualization() {
        // Clear previous visualization nodes
        meshNodes.removeAll()
        pointCloudNode?.removeFromParentNode()
        pointCloudNode = nil
        gaitTrackingPoints.removeAll()
    }
}

// MARK: - Type Extensions
extension LiDARCameraView {
    typealias Coordinator = LiDARCameraCoordinator
}
