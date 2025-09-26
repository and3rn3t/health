import Foundation
import SwiftUI

@MainActor
final class GaitAnalysisViewModel: ObservableObject {
    enum LoadState { case idle, loading, error(String), empty, ready }

    @Published private(set) var state: LoadState = .idle
    @Published private(set) var recommendations: [String] = []
    @Published private(set) var metric: GaitMetricType = .strideLength
    @Published private(set) var value: Double = 0
    @Published private(set) var target: Double = 1

    private var loadTask: Task<Void, Never>? = nil
    private let haptics = Haptics.shared

    func load(simulated: Bool = true) {
        guard state != .loading else { return }
    state = .loading
    Telemetry.shared.record(.gaitLoad("loading"))
        loadTask?.cancel()
        loadTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: 700_000_000)
            if Task.isCancelled { return }
            if simulated {
                // Simulate occasional error
                if Int.random(in: 0..<8) == 0 {
                    state = .error("network")
                    haptics.trigger(.error)
                    Telemetry.shared.record(.gaitLoad("error"))
                    return
                }
                // Simulate empty dataset
                if Int.random(in: 0..<6) == 0 {
                    state = .empty
                    haptics.trigger(.warning)
                    Telemetry.shared.record(.gaitLoad("empty"))
                    return
                }
                // Provide sample data
                metric = .strideLength
                target = 1.2
                value = Double.random(in: 0.6...1.1)
                recommendations = sampleRecommendations()
                state = .ready
                haptics.trigger(.success)
                Telemetry.shared.record(.gaitLoad("ready"))
            } else {
                // Hook for real data pipeline later
                state = .empty
                Telemetry.shared.record(.gaitLoad("empty_real"))
            }
        }
    }

    func retry() {
        haptics.trigger(.selection)
        load(simulated: true)
    }

    private func sampleRecommendations() -> [String] {
        [
            loc("fall_reco_exercise"),
            loc("fall_reco_balance"),
            loc("fall_reco_home")
        ]
    }
}
