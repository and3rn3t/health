import Foundation
import SwiftUI

@MainActor
final class FallRiskViewModel: ObservableObject {
    enum LoadState { case idle, loading, error(String), empty, ready }

    @Published private(set) var state: LoadState = .idle
    @Published private(set) var riskLevel: FallRiskLevel = .unknown
    @Published private(set) var recommendations: [String] = []
    @Published private(set) var lastUpdated: Date? = nil

    private var loadTask: Task<Void, Never>? = nil
    private let haptics = Haptics.shared

    func load(simulated: Bool = true) {
        guard state != .loading else { return }
        state = .loading
        Telemetry.shared.record(.fallRiskLoad("loading"))
        loadTask?.cancel()
        loadTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: 800_000_000)
            if Task.isCancelled { return }
            if simulated {
                if Int.random(in: 0..<8) == 0 { // occasional error
                    state = .error("network")
                    haptics.trigger(.error)
                    Telemetry.shared.record(.fallRiskLoad("error"))
                    return
                }
                if Int.random(in: 0..<6) == 0 { // empty
                    state = .empty
                    riskLevel = .unknown
                    recommendations = []
                    haptics.trigger(.warning)
                    Telemetry.shared.record(.fallRiskLoad("empty"))
                    return
                }
                riskLevel = sampleRiskLevel()
                recommendations = sampleRecommendations(for: riskLevel)
                lastUpdated = Date()
                state = .ready
                haptics.trigger(.success)
                Telemetry.shared.record(.fallRiskLoad("ready"))
            } else {
                state = .empty
                Telemetry.shared.record(.fallRiskLoad("empty_real"))
            }
        }
    }

    func retry() {
        haptics.trigger(.selection)
        load(simulated: true)
    }

    private func sampleRiskLevel() -> FallRiskLevel {
        [.low, .medium, .high].randomElement() ?? .low
    }

    private func sampleRecommendations(for level: FallRiskLevel) -> [String] {
        var recos: [String] = [loc("fall_reco_exercise"), loc("fall_reco_balance"), loc("fall_reco_home")]
        switch level {
        case .high: recos.append(loc("fall_reco_medical"))
        case .medium: recos.append(loc("fall_reco_vision"))
        case .low, .unknown: break
        }
        return Array(Set(recos)).shuffled()
    }
}
