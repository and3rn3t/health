import Foundation
import Combine
import simd
#if canImport(ARKit)
import ARKit

/// Real-time LiDAR gait analyzer producing incremental GaitMetrics from AR body tracking.
@available(iOS 14.0, *)
final class GaitLiDARAnalyzer: NSObject, ObservableObject {
    @Published private(set) var currentMetrics: GaitMetrics = GaitMetrics()
    @Published private(set) var isRunning: Bool = false
    @Published private(set) var currentStability: StabilityAnalyzer.StabilityMetrics?
    @Published private(set) var currentRisk: GaitRiskAssessment?
    @Published private(set) var qualityConfidence: Double = 0 // 0-1 proportion of frames with both feet tracked
    @Published private(set) var floorStd: Double? // meters std of floor estimate
    @Published private(set) var averageProcessingMS: Double = 0

    private let session = ARSession()
    private let footTracker = FootPoseTracker()
    private let stepDetector = StepEventDetector()
    private let aggregator = GaitMetricsAggregator()
    private let stabilityAnalyzer = StabilityAnalyzer()
    private let floorEstimator = FloorEstimator()
    private let riskScorer: GaitRiskScoring = {
        if AppConfig.shared.useMLGaitRiskScorer {
            return GaitMLRiskScorer()
        } else {
            return GaitRiskScorer()
        }
    }()
    private let cadenceFusion = CadenceFusionManager.shared
    private let featureEngineer = GaitFeatureEngineer()

    private var startTime: Date?
    private var duration: TimeInterval = 0
    private var timer: Timer?

    private var lastLeftFoot: SIMD3<Float>?
    private var lastRightFoot: SIMD3<Float>?

    // Throttle control
    private var lastEmit: TimeInterval = 0
    private let minEmitInterval: TimeInterval = 0.4 // seconds

    private var totalFrames: Int = 0
    private var framesWithBothFeet: Int = 0

    // Performance timing
    private var procSamples: [Double] = []
    private let maxProcSamples = 100

    override init() {
        super.init()
        session.delegate = self
    }

    func start(duration: TimeInterval = 30.0) {
        guard !isRunning else { return }
        self.duration = duration
        startTime = Date()
        aggregator.reset()
        stabilityAnalyzer.reset()
        floorEstimator.reset()
        lastLeftFoot = nil; lastRightFoot = nil
        configureSession()
        isRunning = true
        scheduleProgressTimer()
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
        timer?.invalidate(); timer = nil
        session.pause()
    }

    private func configureSession() {
        if ARBodyTrackingConfiguration.isSupported {
            let cfg = ARBodyTrackingConfiguration()
            cfg.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
            session.run(cfg, options: [.resetTracking, .removeExistingAnchors])
        } else {
            let cfg = ARWorldTrackingConfiguration()
            cfg.frameSemantics = [.sceneDepth, .smoothedSceneDepth]
            session.run(cfg, options: [.resetTracking, .removeExistingAnchors])
        }
    }

    private func scheduleProgressTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            guard let self, let st = self.startTime else { return }
            if Date().timeIntervalSince(st) >= self.duration { self.stop() }
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    private func handleStepEvent(_ event: StepEvent) {
        let startT = CFAbsoluteTimeGetCurrent()

        // Drain any double support durations produced since last step and feed to aggregator first
        let dsDurations = stepDetector.drainDoubleSupportDurations()
        if !dsDurations.isEmpty { aggregator.ingestDoubleSupportDurations(dsDurations) }

        let aggregate = aggregator.ingest(step: event)
        let now = event.timestamp
        if now - lastEmit < minEmitInterval { return }
        lastEmit = now

        var metrics = GaitMetrics()
        metrics.averageStepLength = aggregate.averageStepLength
        metrics.strideLength = aggregate.averageStrideLength

        // Fuse cadence if enabled / available
        let fusedCadence = cadenceFusion.fuse(lidarCadence: aggregate.cadence)
        metrics.stepFrequency = fusedCadence ?? aggregate.cadence
        metrics.averageWalkingSpeed = aggregate.walkingSpeed
        metrics.walkingSpeedVariability = aggregate.walkingSpeedCV
        metrics.stanceTime = aggregate.stancePercentage
        metrics.swingTime = aggregate.swingPercentage
        metrics.doubleSupportTime = aggregate.doubleSupportPercentage
        metrics.walkingAsymmetry = aggregate.asymmetryStepLength
        metrics.stepLengthVariability = aggregate.stepLengthCV
        metrics.averageToeClearance = aggregate.averageToeClearance
        // Engineered features ingestion
        let strideTimeSample = (aggregate.cadence > 0) ? (120.0 / aggregate.cadence) : nil
        featureEngineer.ingest(sample: .init(
            timestamp: now,
            strideTime: strideTimeSample,
            cadence: metrics.stepFrequency,
            toeClearance: metrics.averageToeClearance,
            stepLengthCV: metrics.stepLengthVariability
        ))
        let feSnap = featureEngineer.snapshot(stepLengthCV: metrics.stepLengthVariability)
        metrics.strideTimeVariability = feSnap.strideTimeCV
        metrics.harmonicRatio = feSnap.harmonicRatio
        metrics.nearTripEvents = feSnap.nearTrips

        // Stability metrics (require latest foot positions of both feet)
        if let l = lastLeftFoot, let r = lastRightFoot, let stability = stabilityAnalyzer.ingest(left: l, right: r) {
            currentStability = stability
            metrics.mobilityStatus = mobilityStatus(from: stability.stabilityIndex)
            // Derive mediolateral sway proxy (normalized lateral sway by step length*1000 mm)
            if let stepLen = metrics.averageStepLength ?? metrics.strideLength.map({ $0 / 2.0 }), stepLen > 0 {
                let norm = stability.lateralSwayMM / max(stepLen * 1000.0, 1.0)
                metrics.mediolateralSwayProxy = max(0.0, min(1.0, norm))
            }
        } else {
            metrics.mobilityStatus = .unknown
        }

        // Risk scoring (includes toe clearance now)
        let riskInputs = GaitRiskScorer.Inputs(
            walkingSpeed: metrics.averageWalkingSpeed,
            cadence: metrics.stepFrequency,
            doubleSupport: metrics.doubleSupportTime,
            stepLengthCV: metrics.stepLengthVariability,
            speedCV: metrics.walkingSpeedVariability,
            asymmetryStepLength: metrics.walkingAsymmetry,
            toeClearance: metrics.averageToeClearance,
            stabilityIndex: currentStability?.stabilityIndex
        )
        let risk = riskScorer.score(riskInputs)
        metrics.riskLevel = risk.level
        currentRisk = risk

        // Update quality confidence
        if totalFrames > 0 { qualityConfidence = Double(framesWithBothFeet) / Double(totalFrames) }
        floorStd = floorEstimator.floorStd
        let elapsed = (CFAbsoluteTimeGetCurrent() - startT) * 1000.0
        procSamples.append(elapsed)
        if procSamples.count > maxProcSamples { procSamples.removeFirst(procSamples.count - maxProcSamples) }
        averageProcessingMS = procSamples.reduce(0,+)/Double(procSamples.count)

        DispatchQueue.main.async { self.currentMetrics = metrics }
    }

    private func mobilityStatus(from stabilityIndex: Double) -> MobilityStatus {
        switch stabilityIndex {
        case 85...: return .excellent
        case 70..<85: return .good
        case 55..<70: return .fair
        case 0..<55: return .poor
        default: return .unknown
        }
    }

#if DEBUG
    // Test helper: set raw frame counters to simulate quality confidence changes
    func _testUpdateQuality(total: Int, withBoth: Int) {
        totalFrames = max(0,total)
        framesWithBothFeet = max(0, min(withBoth,totalFrames))
        if totalFrames > 0 { qualityConfidence = Double(framesWithBothFeet)/Double(totalFrames) } else { qualityConfidence = 0 }
    }
    func _testResetFeatures() { featureEngineer._reset() }
    func _testSwayProxy(stepLengthMeters: Double, lateralSwayMM: Double) -> Double {
        guard stepLengthMeters > 0 else { return 0 }
        let norm = lateralSwayMM / max(stepLengthMeters * 1000.0, 1.0)
        return max(0.0, min(1.0, norm))
    }
#endif
}

@available(iOS 14.0, *)
extension GaitLiDARAnalyzer: ARSessionDelegate {
    func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
        guard isRunning else { return }
        for anchor in anchors { if let body = anchor as? ARBodyAnchor { processBodyAnchor(body) } }
    }

    func session(_ session: ARSession, didAdd anchors: [ARAnchor]) { session(session, didUpdate: anchors) }

    private func processBodyAnchor(_ body: ARBodyAnchor) {
        totalFrames += 1
        let ts = Date().timeIntervalSince1970
        guard let poses = footTracker.process(bodyAnchor: body, frameTimestamp: ts) else { return }
        lastLeftFoot = poses.left
        lastRightFoot = poses.right
        framesWithBothFeet += 1
        floorEstimator.ingest(leftY: poses.left.y, rightY: poses.right.y)
        let floorY = floorEstimator.floorY
        if let step = stepDetector.process(timestamp: poses.timestamp, leftPos: poses.left, rightPos: poses.right, floorY: floorY) {
            handleStepEvent(step)
        } else {
            // Even without a step event, double support intervals may have closed
            let dsDurations = stepDetector.drainDoubleSupportDurations()
            if !dsDurations.isEmpty { aggregator.ingestDoubleSupportDurations(dsDurations) }
            if totalFrames > 0 { qualityConfidence = Double(framesWithBothFeet) / Double(totalFrames) }
            floorStd = floorEstimator.floorStd
        }
    }
}
#endif
