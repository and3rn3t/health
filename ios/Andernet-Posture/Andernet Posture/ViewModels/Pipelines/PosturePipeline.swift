//
//  PosturePipeline.swift
//  Andernet Posture
//
//  Sub-coordinator extracted from CaptureViewModel.
//  Handles posture analysis, REBA scoring, and crossed syndrome detection.
//

import Foundation
import simd

/// Groups posture-related analyzers into a single coordinator.
/// Reduces CaptureViewModel's direct dependency count by encapsulating
/// posture analysis, ergonomic scoring, and crossed syndrome detection.
@MainActor
final class PosturePipeline {

    // MARK: - Dependencies

    private let postureAnalyzer: any PostureAnalyzer
    private let ergonomicScorer: any ErgonomicScorer
    private let crossedSyndromeDetector: any CrossedSyndromeDetecting
    private let painRiskEngine: any PainRiskEngine

    // MARK: - State

    private(set) var currentPosture: PostureMetrics?
    private(set) var rebaScore: Int = 1
    private(set) var postureMetricsHistory: [PostureMetrics] = []
    private(set) var severities: [String: ClinicalSeverity] = [:]

    // MARK: - Init

    init(
        postureAnalyzer: any PostureAnalyzer = CoreMLPostureAnalyzer(modelService: .shared),
        ergonomicScorer: any ErgonomicScorer = DefaultErgonomicScorer(),
        crossedSyndromeDetector: any CrossedSyndromeDetecting = DefaultCrossedSyndromeDetector(),
        painRiskEngine: any PainRiskEngine = DefaultPainRiskEngine()
    ) {
        self.postureAnalyzer = postureAnalyzer
        self.ergonomicScorer = ergonomicScorer
        self.crossedSyndromeDetector = crossedSyndromeDetector
        self.painRiskEngine = painRiskEngine
    }

    // MARK: - Per-Frame Processing

    /// Analyze posture from joint positions. Call every frame.
    func processPosture(joints: [JointName: SIMD3<Float>]) -> PostureMetrics? {
        guard let metrics = postureAnalyzer.analyze(joints: joints) else { return nil }
        currentPosture = metrics
        severities = metrics.severities
        postureMetricsHistory.append(metrics)
        return metrics
    }

    /// Compute REBA score. Call throttled (every ~10 frames).
    func processREBA(joints: [JointName: SIMD3<Float>]) -> REBAResult {
        let result = ergonomicScorer.computeREBA(joints: joints)
        rebaScore = result.score
        return result
    }

    /// Compute session posture score from accumulated data.
    func computeSessionScore(trunkLeans: [Double], lateralLeans: [Double]) -> Double {
        postureAnalyzer.computeSessionScore(trunkLeans: trunkLeans, lateralLeans: lateralLeans)
    }

    /// Detect crossed syndromes for session summary.
    func detectCrossedSyndromes(
        craniovertebralAngleDeg: Double,
        shoulderProtractionCm: Double,
        thoracicKyphosisDeg: Double,
        cervicalLordosisDeg: Double?,
        pelvicTiltDeg: Double,
        lumbarLordosisDeg: Double,
        hipFlexionRestDeg: Double?
    ) -> CrossedSyndromeResult {
        crossedSyndromeDetector.detect(
            craniovertebralAngleDeg: craniovertebralAngleDeg,
            shoulderProtractionCm: shoulderProtractionCm,
            thoracicKyphosisDeg: thoracicKyphosisDeg,
            cervicalLordosisDeg: cervicalLordosisDeg,
            pelvicTiltDeg: pelvicTiltDeg,
            lumbarLordosisDeg: lumbarLordosisDeg,
            hipFlexionRestDeg: hipFlexionRestDeg
        )
    }

    /// Assess pain risk for session summary.
    func assessPainRisk(
        craniovertebralAngleDeg: Double,
        sagittalVerticalAxisCm: Double,
        thoracicKyphosisDeg: Double,
        lumbarLordosisDeg: Double,
        shoulderAsymmetryCm: Double,
        pelvicObliquityDeg: Double,
        pelvicTiltDeg: Double,
        coronalSpineDeviationCm: Double,
        kneeFlexionStandingDeg: Double?,
        gaitAsymmetryPercent: Double?
    ) -> PainRiskAssessment {
        painRiskEngine.assess(
            craniovertebralAngleDeg: craniovertebralAngleDeg,
            sagittalVerticalAxisCm: sagittalVerticalAxisCm,
            thoracicKyphosisDeg: thoracicKyphosisDeg,
            lumbarLordosisDeg: lumbarLordosisDeg,
            shoulderAsymmetryCm: shoulderAsymmetryCm,
            pelvicObliquityDeg: pelvicObliquityDeg,
            pelvicTiltDeg: pelvicTiltDeg,
            coronalSpineDeviationCm: coronalSpineDeviationCm,
            kneeFlexionStandingDeg: kneeFlexionStandingDeg,
            gaitAsymmetryPercent: gaitAsymmetryPercent
        )
    }

    /// Reset all state for a new session.
    func reset() {
        currentPosture = nil
        rebaScore = 1
        postureMetricsHistory.removeAll()
        severities = [:]
    }
}
