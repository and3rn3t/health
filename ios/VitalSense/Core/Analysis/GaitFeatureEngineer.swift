import Foundation

/// Stateful feature engineering helper independent from ARKit for unit testability.
/// Maintains rolling windows to compute variability, harmonic ratio proxy, near-trip detection.
final class GaitFeatureEngineer {
    struct StepSample {
        let timestamp: TimeInterval
        let strideTime: Double? // seconds (time between every other step)
        let cadence: Double? // spm
        let toeClearance: Double? // m
        let stepLengthCV: Double? // coefficient of variation of step length so far
    }

    private var strideTimes: [Double] = []
    private var recentCadences: [Double] = []
    private var recentToeClearances: [Double] = []
    private let maxWindow = 60

    private(set) var baselineToeClearance: Double? = nil
    private(set) var nearTripEvents: Int = 0

    func ingest(sample: StepSample) {
        if let st = sample.strideTime { append(&strideTimes, st) }
        if let cad = sample.cadence { append(&recentCadences, cad) }
        if let tc = sample.toeClearance { append(&recentToeClearances, tc); updateBaseline(tc) }
        evaluateNearTrip(sample: sample)
    }

    private func append(_ arr: inout [Double], _ value: Double) {
        arr.append(value)
        if arr.count > maxWindow { arr.removeFirst(arr.count - maxWindow) }
    }

    private func updateBaseline(_ tc: Double) {
        // Exponential moving average for baseline
        if baselineToeClearance == nil { baselineToeClearance = tc }
        else { baselineToeClearance = baselineToeClearance!*0.95 + tc*0.05 }
    }

    private func evaluateNearTrip(sample: StepSample) {
        guard let tc = sample.toeClearance, let cad = sample.cadence else { return }
        guard let base = baselineToeClearance else { return }
        // Compute rolling average cadence
        let avgCad = recentCadences.isEmpty ? cad : recentCadences.reduce(0,+)/Double(recentCadences.count)
        // Heuristic triggers: toe clearance sudden dip + compensatory cadence spike
        let clearanceDip = tc < base * 0.6 || tc < 0.012
        let cadenceSpike = cad > avgCad * 1.05
        if clearanceDip && cadenceSpike { nearTripEvents += 1 }
    }

    // MARK: Derived Features
    var strideTimeCV: Double? { coefficientOfVariation(strideTimes) }

    /// Harmonic ratio proxy using inverse of step length variability and stride time smoothness.
    /// Not a true spectral harmonic ratio – kept lightweight for on-device heuristic.
    func harmonicRatio(stepLengthCV: Double?) -> Double? {
        let stSmooth = strideTimeCV.map { max(0.0, 1.0 - min(1.0, $0 * 5.0)) } // higher when less variable
        guard let baseSmooth = stSmooth else { return nil }
        if let slcv = stepLengthCV { return max(0, min(3.0, baseSmooth * (1.0 / (1.0 + slcv * 10.0)) * 3.0)) }
        return max(0, min(3.0, baseSmooth * 1.5))
    }

    /// Returns engineered feature snapshot for integration.
    func snapshot(stepLengthCV: Double?) -> (strideTimeCV: Double?, harmonicRatio: Double?, nearTrips: Int) {
        (strideTimeCV, harmonicRatio(stepLengthCV: stepLengthCV), nearTripEvents)
    }

    private func coefficientOfVariation(_ values: [Double]) -> Double? {
        guard values.count > 4 else { return nil }
        let mean = values.reduce(0,+)/Double(values.count)
        guard mean != 0 else { return nil }
        let varSum = values.reduce(0) { $0 + pow($1 - mean, 2) }
        let sd = sqrt(varSum / Double(values.count - 1))
        return sd / mean
    }

#if DEBUG
    func _reset() { strideTimes.removeAll(); recentCadences.removeAll(); recentToeClearances.removeAll(); baselineToeClearance = nil; nearTripEvents = 0 }
#endif
}
