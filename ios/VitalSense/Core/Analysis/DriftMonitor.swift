import Foundation

/// Online variance + drift detection using Welford algorithm.
final class DriftMonitor {
    private(set) var count: Int = 0
    private var mean: Double = 0
    private var m2: Double = 0
    private let warmup: Int
    private let epsilon = 1e-9

    init(warmup: Int = 20) { self.warmup = warmup }

    func update(_ value: Double) {
        count += 1
        let delta = value - mean
        mean += delta / Double(count)
        let delta2 = value - mean
        m2 += delta * delta2
    }

    var isReady: Bool { count >= warmup }
    var variance: Double? { count > 1 ? m2 / Double(count - 1) : nil }
    var std: Double? { variance.map { $0 < 0 ? 0 : sqrt($0) } }

    func zScore(_ value: Double) -> Double? {
        guard isReady else { return nil }
        guard let std = std else { return nil }
        if std < epsilon { return abs(value - mean) < 1e-6 ? 0 : 999 } // 999 sentinel large drift
        return (value - mean) / std
    }
}
