//
//  GaitPipeline.swift
//  Andernet Posture
//
//  Sub-coordinator extracted from CaptureViewModel.
//  Handles gait analysis, ROM, fall risk, pattern classification,
//  and smoothness analysis.
//

import Foundation
import simd

/// Groups gait-related analyzers into a single coordinator.
@MainActor
final class GaitPipeline {

    // MARK: - Dependencies

    private let gaitAnalyzer: any GaitAnalyzer
    private let romAnalyzer: any ROMAnalyzer
    private let fallRiskAnalyzer: any FallRiskAnalyzer
    private let gaitPatternClassifier: any GaitPatternClassifying
    private let smoothnessAnalyzer: any SmoothnessAnalyzer

    // MARK: - State

    private(set) var stepWidthValues: [Double] = []

    // MARK: - Init

    init(
        gaitAnalyzer: any GaitAnalyzer = DefaultGaitAnalyzer(),
        romAnalyzer: any ROMAnalyzer = DefaultROMAnalyzer(),
        fallRiskAnalyzer: any FallRiskAnalyzer = CoreMLFallRiskAnalyzer(modelService: .shared),
        gaitPatternClassifier: any GaitPatternClassifying = CoreMLGaitPatternClassifier(modelService: .shared),
        smoothnessAnalyzer: any SmoothnessAnalyzer = DefaultSmoothnessAnalyzer()
    ) {
        self.gaitAnalyzer = gaitAnalyzer
        self.romAnalyzer = romAnalyzer
        self.fallRiskAnalyzer = fallRiskAnalyzer
        self.gaitPatternClassifier = gaitPatternClassifier
        self.smoothnessAnalyzer = smoothnessAnalyzer
    }

    // MARK: - Per-Frame Processing

    /// Process a body frame for gait metrics.
    func processGait(joints: [JointName: SIMD3<Float>], timestamp: TimeInterval) -> GaitMetrics {
        gaitAnalyzer.processFrame(joints: joints, timestamp: timestamp)
    }

    /// Analyze ROM from joint positions. Call throttled.
    func processROM(joints: [JointName: SIMD3<Float>]) -> ROMMetrics {
        let metrics = romAnalyzer.analyze(joints: joints)
        romAnalyzer.recordFrame(metrics)
        return metrics
    }

    /// Record accelerometer sample for smoothness analysis.
    func recordSmoothnessSample(timestamp: TimeInterval, ap: Double, ml: Double, v: Double) {
        smoothnessAnalyzer.recordSample(timestamp: timestamp, accelerationAP: ap, accelerationML: ml, accelerationV: v)
    }

    /// Track step width for fall risk calculation.
    func recordStepWidth(_ widthCm: Double) {
        stepWidthValues.append(widthCm)
    }

    // MARK: - Session Summary

    func romSummary() -> ROMSessionSummary {
        romAnalyzer.sessionSummary()
    }

    func smoothnessAnalysis() -> SmoothnessMetrics {
        smoothnessAnalyzer.analyze()
    }

    func assessFallRisk(
        walkingSpeedMPS: Double?,
        strideTimeCVPercent: Double?,
        doubleSupportPercent: Double?,
        swayVelocityMMS: Double?,
        stepAsymmetryPercent: Double?,
        tugTimeSec: Double?,
        footClearanceM: Double?
    ) -> FallRiskAssessment {
        let stepWidthSD = standardDeviation(stepWidthValues)
        return fallRiskAnalyzer.assess(
            walkingSpeedMPS: walkingSpeedMPS,
            strideTimeCVPercent: strideTimeCVPercent,
            doubleSupportPercent: doubleSupportPercent,
            stepWidthVariabilityCm: stepWidthSD,
            swayVelocityMMS: swayVelocityMMS,
            stepAsymmetryPercent: stepAsymmetryPercent,
            tugTimeSec: tugTimeSec,
            footClearanceM: footClearanceM
        )
    }

    func classifyGaitPattern(
        stanceTimeLeftPercent: Double?, stanceTimeRightPercent: Double?,
        stepLengthLeftM: Double?, stepLengthRightM: Double?,
        cadenceSPM: Double?, avgStepWidthCm: Double?,
        pelvicObliquityDeg: Double?, strideTimeCVPercent: Double?,
        walkingSpeedMPS: Double?, strideLengthM: Double?,
        hipFlexionROMDeg: Double?, armSwingAsymmetryPercent: Double?,
        kneeFlexionROMDeg: Double?
    ) -> GaitPatternResult {
        let stepWidthSD = standardDeviation(stepWidthValues)
        return gaitPatternClassifier.classify(
            stanceTimeLeftPercent: stanceTimeLeftPercent,
            stanceTimeRightPercent: stanceTimeRightPercent,
            stepLengthLeftM: stepLengthLeftM, stepLengthRightM: stepLengthRightM,
            cadenceSPM: cadenceSPM, avgStepWidthCm: avgStepWidthCm,
            stepWidthVariabilityCm: stepWidthSD,
            pelvicObliquityDeg: pelvicObliquityDeg,
            strideTimeCVPercent: strideTimeCVPercent,
            walkingSpeedMPS: walkingSpeedMPS, strideLengthM: strideLengthM,
            hipFlexionROMDeg: hipFlexionROMDeg,
            armSwingAsymmetryPercent: armSwingAsymmetryPercent,
            kneeFlexionROMDeg: kneeFlexionROMDeg
        )
    }

    // MARK: - Reset

    func reset() {
        gaitAnalyzer.reset()
        romAnalyzer.reset()
        smoothnessAnalyzer.reset()
        stepWidthValues.removeAll()
    }
}
