import Foundation

/// Manages baseline gait calibration over an initial time window.
/// Collects simple averages used to personalize later quality/risk adjustments.
final class GaitCalibrationManager {
    struct Baseline {
        let speed: Double?
        let stepLength: Double?
        let cadence: Double?
        let doubleSupport: Double?
    }

    private let window: TimeInterval
    private var start: Date?
    private var locked = false

    private var speedSum: Double = 0
    private var speedCount: Int = 0
    private var stepLenSum: Double = 0
    private var stepLenCount: Int = 0
    private var cadenceSum: Double = 0
    private var cadenceCount: Int = 0
    private var dsSum: Double = 0
    private var dsCount: Int = 0

    private(set) var baseline: Baseline?

    init(window: TimeInterval) { self.window = window }

    func startIfNeeded(now: Date = Date()) { if start == nil { start = now } }

    func ingest(metrics: GaitMetrics, now: Date = Date()) {
        guard !locked else { return }
        guard let s = start else { return }
        // Accumulate only while within window
        if now.timeIntervalSince(s) <= window {
            if let v = metrics.averageWalkingSpeed { speedSum += v; speedCount += 1 }
            if let v = metrics.averageStepLength { stepLenSum += v; stepLenCount += 1 }
            if let v = metrics.stepFrequency { cadenceSum += v; cadenceCount += 1 }
            if let v = metrics.doubleSupportTime { dsSum += v; dsCount += 1 }
        }
        if now.timeIntervalSince(s) > window { finalize() }
    }

    private func finalize() {
        guard !locked else { return }
        locked = true
        baseline = Baseline(
            speed: speedCount > 0 ? speedSum / Double(speedCount) : nil,
            stepLength: stepLenCount > 0 ? stepLenSum / Double(stepLenCount) : nil,
            cadence: cadenceCount > 0 ? cadenceSum / Double(cadenceCount) : nil,
            doubleSupport: dsCount > 0 ? dsSum / Double(dsCount) : nil
        )
    }

    var isComplete: Bool { baseline != nil }

    func deviations(for metrics: GaitMetrics) -> (speedPct: Double?, stepLengthPct: Double?, cadencePct: Double?, doubleSupportPct: Double?) {
        func pct(_ current: Double?, _ base: Double?) -> Double? {
            guard let c = current, let b = base, b != 0 else { return nil }
            return (c - b) / b * 100.0
        }
        let b = baseline
        return (
            pct(metrics.averageWalkingSpeed, b?.speed),
            pct(metrics.averageStepLength, b?.stepLength),
            pct(metrics.stepFrequency, b?.cadence),
            pct(metrics.doubleSupportTime, b?.doubleSupport)
        )
    }

#if DEBUG
    func _forceFinalize(now: Date = Date()) { finalize() }
#endif
}
