import Foundation

/// Placeholder ML-based gait risk scorer.
/// Attempts to load a model resource (not included here). Falls back to heuristic if model unavailable.
struct GaitMLRiskScorer: GaitRiskScoring {
    private let fallback: GaitRiskScorer
    private let modelLoaded: Bool

    init(fallback: GaitRiskScorer = GaitRiskScorer(), forceModelLoaded: Bool? = nil) {
        self.fallback = fallback
        if let forced = forceModelLoaded {
            modelLoaded = forced
        } else if Bundle.main.url(forResource: "GaitRiskModel", withExtension: "mlmodelc") != nil {
            modelLoaded = true
        } else {
            modelLoaded = false
        }
    }

    func score(_ inputs: GaitRiskScorer.Inputs) -> GaitRiskAssessment {
        guard modelLoaded else { return fallback.score(inputs) }
        // Deterministic pseudo-ML transformation: scale heuristic score & adjust confidence
        let base = fallback.score(inputs)
        let adjustedScore = min(100, max(0, base.score * 0.92 + mlFeatureBoost(inputs)))
        let adjustedConfidence = min(1.0, base.confidence * 1.05)
        return GaitRiskAssessment(score: adjustedScore, level: riskLevel(for: adjustedScore), confidence: adjustedConfidence)
    }

    private func mlFeatureBoost(_ inputs: GaitRiskScorer.Inputs) -> Double {
        var boost = 0.0
        if let tc = inputs.toeClearance, tc < 0.015 { boost += 3 }
        if let asym = inputs.asymmetryStepLength, asym > 6 { boost += 2 }
        if let ds = inputs.doubleSupport, ds > 22 { boost += 4 }
        return boost
    }

    private func riskLevel(for score: Double) -> RiskLevel {
        switch score {
        case 0..<25: return .low
        case 25..<50: return .moderate
        case 50..<75: return .high
        default: return .critical
        }
    }
}
