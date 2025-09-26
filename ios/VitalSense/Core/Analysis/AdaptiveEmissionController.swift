import Foundation

/// Adjusts emission interval based on stability & risk signals.
/// Stateless decisions except for internal stability counter tracking.
final class AdaptiveEmissionController {
    private(set) var stabilityCounter: Int = 0
    private let requiredStableSnapshots = 5
    private let increaseStep: TimeInterval = 0.1
    private let decreaseMultiplier: Double = 0.5

    let minInterval: TimeInterval = 0.3
    let baselineInterval: TimeInterval = 0.4
    let maxInterval: TimeInterval = 1.2

    func suggest(current: TimeInterval, metrics: GaitMetrics, risk: GaitRiskAssessment?, alertsActive: Bool, driftFlags: [String]) -> TimeInterval {
        // Determine stability
        let strideCV = metrics.strideTimeVariability ?? 0
        let stepLenCV = metrics.stepLengthVariability ?? 0
        let speedCV = metrics.walkingSpeedVariability ?? 0
        let stable = strideCV < 0.02 && stepLenCV < 0.03 && speedCV < 0.04
        let highVariability = strideCV > 0.05 || stepLenCV > 0.07 || speedCV > 0.08
        let highRisk = risk?.level == .high || risk?.level == .critical
        let anyDrift = !driftFlags.isEmpty
        let shouldTighten = highVariability || highRisk || alertsActive || anyDrift

        var interval = current
        if shouldTighten {
            stabilityCounter = 0
            // Decrease interval (faster updates) toward baseline
            interval = max(minInterval, min(baselineInterval, interval * decreaseMultiplier))
            return interval
        }
        // If stable, increment counter
        if stable { stabilityCounter += 1 } else { stabilityCounter = 0 }
        if stabilityCounter >= requiredStableSnapshots {
            stabilityCounter = 0 // reset after applying increase to avoid runaway rapid growth
            interval = min(maxInterval, interval + increaseStep)
        }
        // Avoid ever falling below min
        interval = max(minInterval, interval)
        return interval
    }

#if DEBUG
    func _forceStabilityCounter(_ v: Int) { stabilityCounter = v }
#endif
}
