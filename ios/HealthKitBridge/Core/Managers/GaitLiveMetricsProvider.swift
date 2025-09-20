import Foundation
import Combine

// MARK: - Live Gait Metrics Provider (Placeholder Implementation)
// Generates synthetic gait metrics until real sensor / HealthKit integration is wired.
// Replace the random generation with motion / step data aggregation and variability analysis.

struct GaitMetricsSnapshot: Codable {
    let speed: Double     // m/s
    let stepFrequency: Double // steps/min
    let asymmetry: Double // 0-1
    let variability: Double // 0-1
    let timestamp: Date
}

final class GaitLiveMetricsProvider: ObservableObject {
    static let shared = GaitLiveMetricsProvider()

    @Published private(set) var currentSnapshot: GaitMetricsSnapshot?
    private let subject = PassthroughSubject<GaitMetricsSnapshot, Never>()
    var publisher: AnyPublisher<GaitMetricsSnapshot, Never> { subject.eraseToAnyPublisher() }

    private var timer: Timer?
    private let queue = DispatchQueue(label: "gait.live.metrics")

    private init() { start() }

    private func start() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            self?.generateSnapshot()
        }
        if let timer { RunLoop.main.add(timer, forMode: .common) }
    }

    private func generateSnapshot() {
        // Synthetic but plausible ranges
        let snapshot = GaitMetricsSnapshot(
            speed: Double.random(in: 0.6...1.4),
            stepFrequency: Double.random(in: 80...115),
            asymmetry: Double.random(in: 0.00...0.08),
            variability: Double.random(in: 0.00...0.06),
            timestamp: Date()
        )
        currentSnapshot = snapshot
        subject.send(snapshot)
    }
}

// MARK: - Balance Test Streaming Supporting Types
struct BalanceTestProgress {
    let percent: Double
    let instantaneousStability: Double?
    let elapsed: TimeInterval
    let testKind: String?
}

struct BalanceTestResultEvent {
    let overallScore: Double
    let componentScores: [String: Double]
    let testKind: String?
}
