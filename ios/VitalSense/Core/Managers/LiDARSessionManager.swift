import Foundation
import Combine
import UIKit

#if canImport(ActivityKit)
import ActivityKit
#endif

#if canImport(ARKit)
import ARKit
#endif

/// Singleton manager that coordinates LiDAR-based gait sessions and streams
/// summarized metrics to the platform via WebSocket.
/// SwiftLint-compliant: multiline initializers and short lines where possible.
final class LiDARSessionManager: ObservableObject {
    static let shared = LiDARSessionManager()

    @Published private(set) var isRunning: Bool = false
    @Published private(set) var progress: Float = 0
    @Published private(set) var lastPayload: GaitDataPayload?
    @Published private(set) var qualityScore: Int = 100

    private var cancellables = Set<AnyCancellable>()
    private var streamTimer: Timer?
    private var sessionStart: Date?
    private var sessionDuration: TimeInterval = 0
    private var sessionProtocol: String?

    // Analyzer available on iOS 14+. We keep it optional for build safety.
    #if canImport(ARKit)
    @available(iOS 14.0, *)
    private var analyzer: LiDARPostureAnalyzer?
    private var gaitAnalyzer: GaitLiDARAnalyzer?
    #endif

    private var lastStabilityMetrics: StabilityAnalyzer.StabilityMetrics?
    private var lastRisk: GaitRiskAssessment?
    private var lastMetricsSnapshot: GaitMetrics?
    private var lastFloorStd: Double?
    private var lastQualityConfidence: Double?
    private var lastProcessingMS: Double?

    // Calibration & quality instrumentation
    private var calibration: GaitCalibrationManager?
    private var lastCalibrationDeviations: (Double?, Double?, Double?, Double?) = (nil,nil,nil,nil)

    // Frame / point density tracking (ARKit frames or simulated via test seams)
    private var frameCount: Int = 0
    private var pointSum: Int = 0
    private var pointMin: Int = .max
    private var pointMax: Int = 0
    private var sessionPlannedFrames: Int? = nil
    private let expectedFrameRate: Double = 15 // heuristic; used for drop % expectation

    // Fallback tracking
    private var emissionCount: Int = 0
    private var missingRiskCount: Int = 0
    private var missingStabilityCount: Int = 0
    private let missingThreshold = 5

    // Added: session bookkeeping for incremental streaming
    private var currentSessionId: String?
    private var lastStreamSendTime: TimeInterval = 0
    private let streamingThrottleInterval: TimeInterval = 0.5 // seconds

    // Posture fusion flags
    private var simulationMode: Bool = false
    private var postureFusionInProgress = false
    private let postureFusionDuration: TimeInterval = 3.0
    private var postureFusionCancellable: AnyCancellable?

    private var lastExplainFactors: [RiskExplainabilityEngine.Factor]? // explainability snapshot
    // Drift monitors
    private let speedDrift = DriftMonitor(warmup: 25)
    private let stepLenDrift = DriftMonitor(warmup: 25)
    private let dsDrift = DriftMonitor(warmup: 25)
    private let cadenceDrift = DriftMonitor(warmup: 25)
    private var lastZSpeed: Double?
    private var lastZStep: Double?
    private var lastZDS: Double?
    private var lastZCadence: Double?
    private var driftFlags: [String] = []
    private var lastCanaryResult: String?
    // Adaptive emission
    private let adaptiveController = AdaptiveEmissionController()
    private var dynamicThrottleInterval: TimeInterval = 0.5

    private init() {}

    // MARK: - Public API

    func startGaitSession(
        duration: TimeInterval = 30, simulate: Bool = false, protocolTag: String? = nil
    ) {
        guard !isRunning else { return }

        isRunning = true
        progress = 0
        sessionStart = Date()
        sessionDuration = duration
        sessionProtocol = protocolTag
        currentSessionId = "gait_\(Int(Date().timeIntervalSince1970))"
        lastStreamSendTime = 0
        simulationMode = simulate

        // Reset quality instrumentation
        calibration = GaitCalibrationManager(window: min(30, duration * 0.5))
        frameCount = 0; pointSum = 0; pointMin = .max; pointMax = 0
        sessionPlannedFrames = Int(duration * expectedFrameRate)
        lastCalibrationDeviations = (nil,nil,nil,nil)
        // Start motion fusion collection
        MotionFusionManager.shared.start()

        // If simulate is requested, skip ARKit and stream synthetic data
        if simulate {
            scheduleSimulatedStream(duration: duration, protocolTag: protocolTag)
            return
        }

        #if canImport(ARKit)
        if #available(iOS 14.0, *) {
            let gaitAnalyzer = GaitLiDARAnalyzer()
            self.gaitAnalyzer = gaitAnalyzer

            gaitAnalyzer.$currentMetrics
                .receive(on: DispatchQueue.global(qos: .userInitiated))
                .sink { [weak self] metrics in
                    self?.handleIncrementalGaitMetrics(metrics, protocolTag: protocolTag)
                }
                .store(in: &cancellables)

            gaitAnalyzer.$currentStability
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] stability in
                    self?.lastStabilityMetrics = stability
                }
                .store(in: &cancellables)

            gaitAnalyzer.$currentRisk
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] risk in
                    self?.lastRisk = risk
                }
                .store(in: &cancellables)

            gaitAnalyzer.$qualityConfidence
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] qc in self?.lastQualityConfidence = qc }
                .store(in: &cancellables)

            gaitAnalyzer.$floorStd
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] std in self?.lastFloorStd = std }
                .store(in: &cancellables)

            gaitAnalyzer.$averageProcessingMS
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] ms in self?.lastProcessingMS = ms }
                .store(in: &cancellables)

            gaitAnalyzer.start(duration: duration)

            // Safety stop in case analyzer doesn't call stop
            DispatchQueue.main.asyncAfter(deadline: .now() + duration + 1) {
                if self.isRunning { self.stopSession() }
            }
        } else {
            // iOS <14 fallback
            scheduleSimulatedStream(duration: duration, protocolTag: protocolTag)
        }
        #else
        // No ARKit in this build environment; simulate metrics
        scheduleSimulatedStream(duration: duration, protocolTag: protocolTag)
        #endif
    }

    func stopSession() {
        guard isRunning else { return }
        // Decide whether to run posture fusion (only if not simulation and we have metrics+risk)
        let canFusePosture = !simulationMode && lastMetricsSnapshot != nil && lastRisk != nil
        let shouldRunPostureFusion: Bool = {
            #if canImport(ARKit)
            if #available(iOS 14.0, *) { return canFusePosture } else { return false }
            #else
            return false
            #endif
        }()

        if shouldRunPostureFusion {
            // Kick off asynchronous posture fusion before final teardown meta is cleared
            runPostureFusion(metrics: lastMetricsSnapshot!, risk: lastRisk!)
        } else if let metrics = lastMetricsSnapshot, let risk = lastRisk { // immediate fallback assessment
            let assessment = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk, posture: nil)
            let sessionId = currentSessionId ?? "gait_unknown"
            let payload = GaitDataPayload(
                deviceId: deviceId(),
                userId: AppConfig.shared.userId,
                sessionId: sessionId,
                gaitMetrics: metrics,
                assessment: assessment,
                rawSensorData: nil,
                meta: buildMeta(protocolTag: sessionProtocol, metrics: metrics)
            )
            Task { await WebSocketManager.shared.sendGaitDataPayload(payload) }
        }

        // Proceed with standard shutdown
        isRunning = false
        progress = 1
        streamTimer?.invalidate(); streamTimer = nil
        cancellables.forEach { $0.cancel() }; cancellables.removeAll()
        sessionStart = nil; sessionDuration = 0; sessionProtocol = nil
        // Stop motion fusion collection
        MotionFusionManager.shared.stop()
        #if canImport(ARKit)
        if #available(iOS 14.0, *) {
            analyzer?.stopAnalysis(); analyzer = nil
            gaitAnalyzer?.stop(); gaitAnalyzer = nil
        }
        #endif
        currentSessionId = nil
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) { GaitLiveActivityController.shared.end(success: true) }
        #endif
    }

    private func runPostureFusion(metrics: GaitMetrics, risk: GaitRiskAssessment) {
        #if canImport(ARKit)
        guard !postureFusionInProgress else { return }
        postureFusionInProgress = true
        if #available(iOS 14.0, *) {
            let postureAnalyzer = LiDARPostureAnalyzer()
            // We only care about a single posture session result
            postureFusionCancellable = postureAnalyzer.$sessionData
                .compactMap { $0 }
                .receive(on: DispatchQueue.global(qos: .utility))
                .sink { [weak self] sessionData in
                    guard let self else { return }
                    if let posture = sessionData.postureAnalysis {
                        let fused = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk, posture: posture)
                        var meta = buildMeta(protocolTag: sessionProtocol, metrics: metrics) ?? [:]
                        meta["posture_fused"] = "1"
                        let payload = GaitDataPayload(
                            deviceId: deviceId(),
                            userId: AppConfig.shared.userId,
                            sessionId: sessionData.sessionId,
                            gaitMetrics: metrics,
                            assessment: fused,
                            rawSensorData: nil,
                            meta: meta
                        )
                        Task { await WebSocketManager.shared.sendGaitDataPayload(payload) }
                    }
                    self.postureFusionCancellable?.cancel(); self.postureFusionCancellable = nil
                }
            postureAnalyzer.startAnalysis(type: .posture, duration: postureFusionDuration)
            // Safety timeout to cancel if no data
            DispatchQueue.main.asyncAfter(deadline: .now() + postureFusionDuration + 2) { [weak self] in
                guard let self else { return }
                self.postureFusionCancellable?.cancel(); self.postureFusionCancellable = nil
            }
        }
        #endif
    }

    // MARK: - Internal

    private func handleSessionData(_ session: LiDARSessionData, protocolTag: String? = nil) {
        // Build a minimal gait metrics payload using optional fields.
        var metrics = GaitMetrics()

        if let gait = session.gaitAnalysis {
            // Temporal-spatial mapping
            if let cadence = gait.temporalMetrics?.cadence {
                metrics.stepFrequency = Double(cadence)
            }
            if let stride = gait.spatialMetrics?.strideLength {
                metrics.strideLength = Double(stride) / 100.0 // cm → meters
            }
            if let step = gait.spatialMetrics?.stepLength {
                metrics.averageStepLength = Double(step) / 100.0
            }
            if let ds = gait.temporalMetrics?.doubleSupportPercentage {
                metrics.doubleSupportTime = Double(ds)
            }
            if let stance = gait.temporalMetrics?.stancePhasePercentage, let swing = gait.temporalMetrics?.swingPhasePercentage {
                metrics.stanceTime = Double(stance)
                metrics.swingTime = Double(swing)
            }
            if let speed = gait.environmentalContext?.estimatedWalkingSpeed {
                metrics.averageWalkingSpeed = Double(speed)
            }
            // Risk level approximation if available
            if let score = gait.fallRiskScore?.score {
                metrics.riskLevel = score < 25 ? .low : (score < 50 ? .moderate : .high)
            }
        }

        let payload = GaitDataPayload(
            deviceId: deviceId(), userId: AppConfig.shared.userId, sessionId: session.sessionId, gaitMetrics: metrics, assessment: nil, rawSensorData: nil, meta: buildMeta(protocolTag: protocolTag)
        )

        Task {
            await WebSocketManager.shared.sendGaitDataPayload(payload)
            await MainActor.run { self.lastPayload = payload }
        }

        // Live Activity update with simple quality score
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            let (elapsed, remaining) = sessionTimes()
            let score = computeQualityScore(from: metrics)
            let proto = protocolTag ?? sessionProtocol ?? "free_walk"
            let connected = WebSocketManager.shared.isConnected
            Task { @MainActor in self.qualityScore = score }
            GaitLiveActivityController.shared.update(
                elapsed: elapsed, remaining: remaining, qualityScore: score, isConnected: connected, protocolName: proto
            )
        }
        #endif
    }

    private func handleIncrementalGaitMetrics(_ metrics: GaitMetrics, protocolTag: String? = nil) {
        // Throttle & ensure minimal useful data
        let now = Date().timeIntervalSince1970
        guard now - lastStreamSendTime >= dynamicThrottleInterval else { return }
        if metrics.stepFrequency == nil && metrics.averageStepLength == nil { return }
        // Calibration ingest
        calibration?.startIfNeeded()
        calibration?.ingest(metrics: metrics)
        if let cal = calibration, cal.isComplete {
            lastCalibrationDeviations = cal.deviations(for: metrics)
        }
        let includeHeavy = (emissionCount % 3 == 0) || !EarlyWarningAlertManager.shared.activeAlertCodes.isEmpty || !driftFlags.isEmpty
        let payload = GaitDataPayload(
            deviceId: deviceId(),
            userId: AppConfig.shared.userId,
            sessionId: sessionId,
            gaitMetrics: metrics,
            assessment: nil,
            rawSensorData: nil,
            meta: buildMeta(protocolTag: protocolTag, metrics: metrics, includeHeavy: includeHeavy)
        )

        // Adapt interval for next emission AFTER building current payload
        dynamicThrottleInterval = adaptiveController.suggest(
            current: dynamicThrottleInterval,
            metrics: metrics,
            risk: lastRisk,
            alertsActive: !EarlyWarningAlertManager.shared.activeAlertCodes.isEmpty,
            driftFlags: driftFlags
        )
        lastStreamSendTime = now
        Task {
            _ = await WebSocketManager.shared.sendGaitDataPayload(payload)
            await MainActor.run { self.lastPayload = payload }
            #if canImport(ActivityKit)
            if #available(iOS 16.1, *) {
                let (elapsed, remaining) = self.sessionTimes()
                let score = self.computeQualityScore(from: metrics)
                let proto = protocolTag ?? self.sessionProtocol ?? "free_walk"
                let connected = WebSocketManager.shared.isConnected
                Task { @MainActor in self.qualityScore = score }
                GaitLiveActivityController.shared.update(
                    elapsed: elapsed,
                    remaining: remaining,
                    qualityScore: score,
                    isConnected: connected,
                    protocolName: proto
                )
            }
            #endif
        }
    }

    private func scheduleSimulatedStream(duration: TimeInterval, protocolTag: String? = nil) {
        let start = Date()
        streamTimer?.invalidate()
        streamTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) {
            [weak self] timer in
            guard let self else { return }

            let elapsed = Date().timeIntervalSince(start)
            if elapsed >= duration {
                timer.invalidate()
                self.stopSession()
                return
            }

            // Update progress based on elapsed time for better UI feedback
            let progressValue = Float(elapsed / duration)
            DispatchQueue.main.async { self.progress = min(max(progressValue, 0), 1) }

            var m = GaitMetrics()
            m.averageWalkingSpeed = 1.2 + Double.random(in: -0.1...0.1)
            m.averageStepLength = 0.65 + Double.random(in: -0.05...0.05)
            m.stepFrequency = 100 + Double.random(in: -5...5)
            m.doubleSupportTime = 11 + Double.random(in: -1...1)
            m.stanceTime = 60 + Double.random(in: -2...2)
            m.swingTime = 40 + Double.random(in: -2...2)

            let payload = GaitDataPayload(
                deviceId: deviceId(), userId: AppConfig.shared.userId, sessionId: "sim_\(Int(start.timeIntervalSince1970))", gaitMetrics: m, assessment: nil, rawSensorData: nil, meta: protocolTag != nil ? ["protocol": protocolTag!] : nil
            )

            Task {
                await WebSocketManager.shared.sendGaitDataPayload(payload)
                await MainActor.run { self.lastPayload = payload }
            }

            // Live Activity update from simulated values
            #if canImport(ActivityKit)
            if #available(iOS 16.1, *) {
                let (e, r) = self.sessionTimes(from: start, duration: duration)
                let score = self.computeQualityScore(from: m)
                let proto = protocolTag ?? self.sessionProtocol ?? "free_walk"
                let connected = WebSocketManager.shared.isConnected
                Task { @MainActor in self.qualityScore = score }
                GaitLiveActivityController.shared.update(
                    elapsed: e, remaining: r, qualityScore: score, isConnected: connected, protocolName: proto
                )
            }
            #endif
        }

        RunLoop.main.add(streamTimer!, forMode: .common)
    }

    private func deviceId() -> String {
        UIDevice.current.identifierForVendor?.uuidString ?? "unknown-device"
    }

    // MARK: - Helpers
    private func sessionTimes() -> (TimeInterval, TimeInterval) {
        guard let start = sessionStart else { return (0, max(0, sessionDuration)) }
        let elapsed = Date().timeIntervalSince(start)
        let remaining = max(0, sessionDuration - elapsed)
        return (max(0, elapsed), remaining)
    }

    private func sessionTimes(from start: Date, duration: TimeInterval) -> (TimeInterval, TimeInterval) {
        let elapsed = Date().timeIntervalSince(start)
        return (max(0, elapsed), max(0, duration - elapsed))
    }

    private func computeQualityScore(from m: GaitMetrics) -> Int {
        // Simple, bounded heuristic (0–100)
        var score = 100.0

        if let speed = m.averageWalkingSpeed {
            if speed < 0.8 { score -= 15 }
            if speed < 0.6 { score -= 10 }
            if speed > 1.6 { score -= 5 } // possible rushing/instability
        } else {
            score -= 5
        }

        if let ds = m.doubleSupportTime {
            if ds > 20 { score -= 20 } else if ds > 15 { score -= 10 } else if ds < 8 { score -= 5 }
        }

        if let stance = m.stanceTime, let swing = m.swingTime {
            let ratio = stance / max(1, swing)
            if ratio < 1.3 || ratio > 1.7 { score -= 10 }
        }

        if let stepLen = m.averageStepLength {
            if stepLen < 0.45 { score -= 10 } else if stepLen < 0.55 { score -= 5 }
        }

        // Calibration deviation penalties (personalization)
        if let speedDev = lastCalibrationDeviations.0, speedDev < -20 { score -= 5 }
        if let dsDev = lastCalibrationDeviations.3, dsDev > 20 { score -= 5 }
        if let cadenceDev = lastCalibrationDeviations.2, abs(cadenceDev) > 30 { score -= 5 }

        // Ensure range 0...100
        return Int(max(0, min(100, round(score))))
    }

    private func buildMeta(protocolTag: String?, metrics: GaitMetrics? = nil, includeHeavy: Bool = true) -> [String: String]? {
        var meta: [String: String] = [:]
        if let protocolTag { meta["protocol"] = protocolTag }
        if let sessionProtocol { meta["session_protocol"] = sessionProtocol }
        if let stability = lastStabilityMetrics {
            meta["stability_index"] = String(format: "%.1f", stability.stabilityIndex)
            if includeHeavy { meta["lateral_sway_mm"] = String(format: "%.1f", stability.lateralSwayMM) }
        }
        if let m = metrics ?? lastMetricsSnapshot {
            if let ds = m.doubleSupportTime { meta["double_support_pct"] = String(format: "%.2f", ds) }
            if let tc = m.averageToeClearance { meta["toe_clearance_avg_m"] = String(format: "%.3f", tc) }
            if let scv = m.walkingSpeedVariability { meta["speed_cv"] = String(format: "%.4f", scv) }
            if let v = m.strideTimeVariability { meta["stride_time_cv"] = String(format: "%.4f", v) }
            if let v = m.harmonicRatio { meta["harmonic_ratio"] = String(format: "%.3f", v) }
            if let v = m.nearTripEvents { meta["near_trip_events"] = String(v) }
            if let v = m.mediolateralSwayProxy, includeHeavy { meta["sway_proxy"] = String(format: "%.3f", v) }
        }
        if let risk = lastRisk { meta["risk_score"] = String(format: "%.1f", risk.score); meta["risk_confidence"] = String(format: "%.2f", risk.confidence); meta["risk_level"] = risk.level.rawValue }
        if let q = lastQualityConfidence, includeHeavy { meta["quality_confidence"] = String(format: "%.2f", q) }
        if let fs = lastFloorStd, includeHeavy { meta["floor_std_m"] = String(format: "%.4f", fs) }
        if let ms = lastProcessingMS, includeHeavy { meta["avg_processing_ms"] = String(format: "%.2f", ms) }
        if missingRiskCount >= missingThreshold { meta["risk_missing_flag"] = "1" }
        if missingStabilityCount >= missingThreshold { meta["stability_missing_flag"] = "1" }
        meta["ml_risk_flag"] = AppConfig.shared.useMLGaitRiskScorer ? "1" : "0"
        meta["watch_cadence_fusion_flag"] = AppConfig.shared.useWatchCadenceFusion ? "1" : "0"
        if let fused = CadenceFusionManager.shared.lastFusedCadence { meta["cadence_fused_spm"] = String(format: "%.2f", fused) }
        if CadenceFusionManager.shared.lastFusionApplied { meta["fused_cadence"] = "1" } else if AppConfig.shared.useWatchCadenceFusion { meta["fused_cadence"] = "0" }
        if let rawWatch = CadenceFusionManager.shared.lastWatchCadence, includeHeavy { meta["watch_cadence_raw_spm"] = String(format: "%.2f", rawWatch) }
        if includeHeavy, let planned = sessionPlannedFrames, planned > 0 {
            let dropPct = max(0, Double(planned - frameCount) / Double(planned) * 100.0)
            meta["frame_drop_pct"] = String(format: "%.1f", dropPct)
        }
        if includeHeavy, frameCount > 0 {
            let avg = Double(pointSum) / Double(frameCount)
            meta["point_density_avg"] = String(format: "%.1f", avg)
            if pointMin != .max { meta["point_density_min"] = String(pointMin) }
            if pointMax > 0 { meta["point_density_max"] = String(pointMax) }
        }
        if includeHeavy, let base = calibration?.baseline {
            if let v = base.speed { meta["baseline_speed_mps"] = String(format: "%.3f", v) }
            if let v = base.stepLength { meta["baseline_step_len_m"] = String(format: "%.3f", v) }
            if let v = base.cadence { meta["baseline_cadence_spm"] = String(format: "%.2f", v) }
            if let v = base.doubleSupport { meta["baseline_double_support_pct"] = String(format: "%.2f", v) }
        }
        if includeHeavy {
            func fmt(_ v: Double?) -> String? { v.map { String(format: "%.1f", $0) } }
            if let d = fmt(lastCalibrationDeviations.0) { meta["dev_speed_pct"] = d }
            if let d = fmt(lastCalibrationDeviations.1) { meta["dev_step_len_pct"] = d }
            if let d = fmt(lastCalibrationDeviations.2) { meta["dev_cadence_pct"] = d }
            if let d = fmt(lastCalibrationDeviations.3) { meta["dev_double_support_pct"] = d }
            let motionSnap = MotionFusionManager.shared.snapshot()
            if let av = motionSnap.accelVar { meta["accel_var"] = String(format: "%.5f", av) }
            if let mr = motionSnap.meanRot { meta["mean_rot_rate"] = String(format: "%.4f", mr) }
            if let elev = motionSnap.elev { meta["micro_elev_m"] = String(format: "%.3f", elev) }
            func fmtZ(_ z: Double?) -> String? { z.map { String(format: "%.2f", $0) } }
            if let z = fmtZ(lastZSpeed) { meta["speed_z"] = z }
            if let z = fmtZ(lastZStep) { meta["step_len_z"] = z }
            if let z = fmtZ(lastZDS) { meta["double_support_z"] = z }
            if let z = fmtZ(lastZCadence) { meta["cadence_z"] = z }
            if !driftFlags.isEmpty { meta["drift_flags"] = driftFlags.joined(separator: ";") }
            if let canary = lastCanaryResult { meta["canary_status"] = canary }
        }
        if let factors = lastExplainFactors, !factors.isEmpty {
            meta["explain_top_factors"] = factors.map { $0.code }.joined(separator: ",")
            meta["explain_factor_scores"] = factors.map { "\($0.code):" + String(format: "%.2f", $0.score) }.joined(separator: ",")
        }
        let alerts = EarlyWarningAlertManager.shared.activeAlertCodes
        if !alerts.isEmpty { meta["alerts"] = alerts.joined(separator: ";") }
        return meta.isEmpty ? nil : meta
    }
}

#if DEBUG
extension LiDARSessionManager {
    // Test seams for quality instrumentation
    func _testInjectFrame(pointCount: Int) {
        frameCount += 1
        pointSum += pointCount
        if pointCount < pointMin { pointMin = pointCount }
        if pointCount > pointMax { pointMax = pointCount }
    }
    func _testQualityMeta() -> [String:String]? { buildMeta(protocolTag: nil, metrics: nil) }
    func _testForceCalibrationBaseline(metrics: GaitMetrics) {
        calibration?.startIfNeeded()
        // Force finalize baseline immediately
        calibration?._forceFinalize()
        lastCalibrationDeviations = calibration?.deviations(for: metrics)
    }
}
#endif
