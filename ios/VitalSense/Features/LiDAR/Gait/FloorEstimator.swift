import Foundation
import simd

/// Estimates floor Y level in world coordinates by tracking the running low percentile of foot heights.
/// Without mesh plane data, this heuristic stabilizes after several steps.
final class FloorEstimator {
    private var samples: [Float] = []
    private var candidateHistory: [Float] = []
    private let maxSamples = 300
    private let maxCandidates = 120
    private let smoothingAlpha: Float = 0.1
    private var smoothedFloor: Float?

    func reset() {
        samples.removeAll()
        candidateHistory.removeAll()
        smoothedFloor = nil
    }

    func ingest(leftY: Float, rightY: Float) {
        samples.append(min(leftY, rightY))
        if samples.count > maxSamples { samples.removeFirst(samples.count - maxSamples) }
        guard samples.count >= 5 else { return }
        let sorted = samples.sorted()
        let idx = Int(Float(sorted.count - 1) * 0.1)
        let candidate = sorted[max(0, min(idx, sorted.count - 1))]
        candidateHistory.append(candidate)
        if candidateHistory.count > maxCandidates { candidateHistory.removeFirst(candidateHistory.count - maxCandidates) }
        if let current = smoothedFloor {
            smoothedFloor = current + smoothingAlpha * (candidate - current)
        } else {
            smoothedFloor = candidate
        }
    }

    var floorY: Float? { smoothedFloor }
    var floorStd: Double? {
        guard candidateHistory.count > 4 else { return nil }
        let mean = candidateHistory.reduce(0, +) / Float(candidateHistory.count)
        let varSum = candidateHistory.reduce(0) { $0 + pow($1 - mean, 2) }
        return Double(sqrt(varSum / Float(candidateHistory.count)))
    }
}
