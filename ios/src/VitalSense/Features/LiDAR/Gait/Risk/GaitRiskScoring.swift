import Foundation

/// Abstract risk scoring interface to allow heuristic vs ML implementations.
protocol GaitRiskScoring {
    func score(_ inputs: GaitRiskScorer.Inputs) -> GaitRiskAssessment
}
