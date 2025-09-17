import Foundation

struct GaitMetricsPayload: Codable {
    struct Gait: Codable {
        var averageWalkingSpeed: Double?
        var stepFrequency: Double?
        var averageStepLength: Double?
        var doubleSupportTime: Double?
    }
    var gaitMetrics: Gait
}

@MainActor
final class LiDARSessionManager: ObservableObject {
    static let shared = LiDARSessionManager()
    private init() {}

    @Published var isRunning: Bool = false
    @Published var progress: Float = 0
    @Published var lastPayload: GaitMetricsPayload?
    @Published var qualityScore: Int = 90

    private var timer: Timer?
    private var startDate: Date?
    private var duration: TimeInterval = 30

    func startGaitSession(duration: TimeInterval, simulate: Bool, protocolTag: String) {
        stopSession()
        self.duration = duration
        isRunning = true
        startDate = Date()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] t in
            guard let self else { return }
            guard let start = self.startDate else { return }
            let elapsed = Date().timeIntervalSince(start)
            self.progress = Float(min(1.0, elapsed / self.duration))
            // Simulate payload
            let speed = 1.0 + Double.random(in: -0.1...0.1)
            let cadence = 110.0 + Double.random(in: -5...5)
            let step = 0.68 + Double.random(in: -0.05...0.05)
            let ds = 18.0 + Double.random(in: -2...2)
            self.lastPayload = GaitMetricsPayload(gaitMetrics: .init(
                averageWalkingSpeed: speed,
                stepFrequency: cadence,
                averageStepLength: step,
                doubleSupportTime: ds
            ))
            self.qualityScore = min(100, max(20, self.qualityScore + Int.random(in: -2...2)))
            // Push Live Activity state updates
#if canImport(ActivityKit)
            if #available(iOS 16.1, *) {
                let remaining = max(0, self.duration - elapsed)
                GaitLiveActivityController.shared.update(
                    elapsed: elapsed,
                    remaining: remaining,
                    qualityScore: self.qualityScore,
                    isConnected: WebSocketManager.shared.isConnected,
                    protocolName: protocolTag
                )
            }
#endif
            if elapsed >= self.duration { self.stopSession() }
        }
        if let timer { RunLoop.main.add(timer, forMode: .common) }
    }

    func stopSession() {
        timer?.invalidate(); timer = nil
        isRunning = false
        progress = 0
    }
}
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
    #endif

    private init() {}

    // MARK: - Public API

    func startGaitSession(
        duration: TimeInterval = 30,
        simulate: Bool = false,
        protocolTag: String? = nil
    ) {
        guard !isRunning else { return }

        isRunning = true
        progress = 0
        sessionStart = Date()
        sessionDuration = duration
        sessionProtocol = protocolTag

        // If simulate is requested, skip ARKit and stream synthetic data
        if simulate {
            scheduleSimulatedStream(duration: duration, protocolTag: protocolTag)
            return
        }

        #if canImport(ARKit)
        if #available(iOS 14.0, *) {
            let analyzer = LiDARPostureAnalyzer()
            self.analyzer = analyzer

            analyzer.$recordingProgress
                .receive(on: DispatchQueue.main)
                .sink { [weak self] in self?.progress = $0 }
                .store(in: &cancellables)

            analyzer.$sessionData
                .compactMap { $0 }
                .receive(on: DispatchQueue.global(qos: .userInitiated))
                .sink { [weak self] session in
                    self?.handleSessionData(session, protocolTag: protocolTag)
                }
                .store(in: &cancellables)

            analyzer.startAnalysis(type: .gait, duration: duration)

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
        isRunning = false
        progress = 1

        streamTimer?.invalidate()
        streamTimer = nil

        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()

        sessionStart = nil
        sessionDuration = 0
        sessionProtocol = nil

        #if canImport(ARKit)
        if #available(iOS 14.0, *) {
            analyzer?.stopAnalysis()
            analyzer = nil
        }
        #endif

        // End Live Activity defensively
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            GaitLiveActivityController.shared.end(success: true)
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
            if let stance = gait.temporalMetrics?.stancePhasePercentage,
               let swing = gait.temporalMetrics?.swingPhasePercentage {
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
            deviceId: deviceId(),
            userId: AppConfig.shared.userId,
            sessionId: session.sessionId,
            gaitMetrics: metrics,
            assessment: nil,
            rawSensorData: nil,
            meta: protocolTag != nil ? ["protocol": protocolTag!] : nil
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
                elapsed: elapsed,
                remaining: remaining,
                qualityScore: score,
                isConnected: connected,
                protocolName: proto
            )
        }
        #endif
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
                deviceId: deviceId(),
                userId: AppConfig.shared.userId,
                sessionId: "sim_\(Int(start.timeIntervalSince1970))",
                gaitMetrics: m,
                assessment: nil,
                rawSensorData: nil,
                meta: protocolTag != nil ? ["protocol": protocolTag!] : nil
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
                    elapsed: e,
                    remaining: r,
                    qualityScore: score,
                    isConnected: connected,
                    protocolName: proto
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
            if ds > 20 { score -= 20 }
            else if ds > 15 { score -= 10 }
            else if ds < 8 { score -= 5 }
        }

        if let stance = m.stanceTime, let swing = m.swingTime {
            let ratio = stance / max(1, swing)
            if ratio < 1.3 || ratio > 1.7 { score -= 10 }
        }

        if let stepLen = m.averageStepLength {
            if stepLen < 0.45 { score -= 10 }
            else if stepLen < 0.55 { score -= 5 }
        }

        // Ensure range 0...100
        return Int(max(0, min(100, round(score))))
    }
}
