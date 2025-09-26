import Foundation
import simd

/// Computes basic stability metrics from recent foot midpoints (projected onto horizontal plane).
/// - lateral sway: standard deviation of lateral (X) offsets (meters -> mm)
/// - dynamic balance index: 0..100 derived from normalized lateral sway (0 stable)
/// - sway velocity (optional future) currently placeholder derived from diff of midpoints
final class StabilityAnalyzer {
    private var midpoints: [SIMD3<Float>] = []
    private let maxSamples = 60 // roughly last ~24 seconds if fed every ~0.4s (step events)

    struct StabilityMetrics {
        let lateralSwayMM: Double
        let stabilityIndex: Double // 0..100 higher better
        let swayVelocityMMs: Double
    }

    func reset() { midpoints.removeAll() }

    func ingest(left: SIMD3<Float>, right: SIMD3<Float>) -> StabilityMetrics? {
        let mid = (left + right) / 2
        midpoints.append(mid)
        if midpoints.count > maxSamples { midpoints.removeFirst(midpoints.count - maxSamples) }
        guard midpoints.count >= 5 else { return nil }

        // Compute lateral axis relative to initial heading (approx: use x axis in world for now)
        let xs = midpoints.map { $0.x }
        let mean = xs.reduce(0, +) / Float(xs.count)
        let variance = xs.reduce(0) { $0 + powf($1 - mean, 2) } / Float(xs.count)
        let std = sqrtf(variance) // meters
        let lateralSwayMM = Double(std * 1000)

        // Normalize sway: assume 0.0..0.12m typical; clamp >0.25 as worst
        let normalized = min(max(Double(std / 0.12), 0), 1)
        let stabilityIndex = max(0, 100.0 - normalized * 100.0)

        // Sway velocity approx (distance between last two midpoints per second) requires timestamps; we lack them here so placeholder using std derivative concept.
        var swayVelocityMMs = 0.0
        if midpoints.count >= 6 {
            let recent = xs.suffix(6)
            let first = recent.first ?? mean
            let last = recent.last ?? mean
            let delta = Double(abs(last - first)) * 1000
            swayVelocityMMs = delta / 2.0 // assume ~2s window (heuristic) for coarse velocity
        }

        return StabilityMetrics(lateralSwayMM: lateralSwayMM, stabilityIndex: stabilityIndex, swayVelocityMMs: swayVelocityMMs)
    }
}
