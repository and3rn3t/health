//
//  CoreMLGaitPatternClassifier.swift
//  Andernet Posture
//
//  CoreML-backed gait pattern classifier. Conforms to the existing
//  GaitPatternClassifying protocol so it drops into CaptureViewModel
//  via dependency injection with zero call-site changes.
//
//  When the .mlmodelc bundle is present the model runs inference;
//  otherwise it falls back to the rule-based DefaultGaitPatternClassifier.
//

import Foundation
import CoreML
import os.log

private let logger = AppLogger.ml

final class CoreMLGaitPatternClassifier: GaitPatternClassifying {

    private let modelService: MLModelService
    private let fallback = DefaultGaitPatternClassifier()

    init(modelService: MLModelService) {
        self.modelService = modelService
    }

    // MARK: - GaitPatternClassifying Protocol

    // swiftlint:disable:next function_parameter_count
    func classify(
        stanceTimeLeftPercent: Double?,
        stanceTimeRightPercent: Double?,
        stepLengthLeftM: Double?,
        stepLengthRightM: Double?,
        cadenceSPM: Double?,
        avgStepWidthCm: Double?,
        stepWidthVariabilityCm: Double?,
        pelvicObliquityDeg: Double?,
        strideTimeCVPercent: Double?,
        walkingSpeedMPS: Double?,
        strideLengthM: Double?,
        hipFlexionROMDeg: Double?,
        armSwingAsymmetryPercent: Double?,
        kneeFlexionROMDeg: Double?
    ) -> GaitPatternResult {

        // Attempt CoreML prediction
        guard modelService.useMLModels,
              let model = modelService.loadModel(.gaitPatternClassifier) else {
            return fallback.classify(
                stanceTimeLeftPercent: stanceTimeLeftPercent,
                stanceTimeRightPercent: stanceTimeRightPercent,
                stepLengthLeftM: stepLengthLeftM,
                stepLengthRightM: stepLengthRightM,
                cadenceSPM: cadenceSPM,
                avgStepWidthCm: avgStepWidthCm,
                stepWidthVariabilityCm: stepWidthVariabilityCm,
                pelvicObliquityDeg: pelvicObliquityDeg,
                strideTimeCVPercent: strideTimeCVPercent,
                walkingSpeedMPS: walkingSpeedMPS,
                strideLengthM: strideLengthM,
                hipFlexionROMDeg: hipFlexionROMDeg,
                armSwingAsymmetryPercent: armSwingAsymmetryPercent,
                kneeFlexionROMDeg: kneeFlexionROMDeg
            )
        }

        // Build named-column feature dictionary matching the trained model schema.
        // Sentinel −1 is used for missing values (consistent with training data).
        let sentinel = -1.0
        do {
            let provider = try MLDictionaryFeatureProvider(dictionary: [
                "stanceTimeLeftPct":      MLFeatureValue(double: stanceTimeLeftPercent ?? sentinel),
                "stanceTimeRightPct":     MLFeatureValue(double: stanceTimeRightPercent ?? sentinel),
                "stepLengthLeftM":        MLFeatureValue(double: stepLengthLeftM ?? sentinel),
                "stepLengthRightM":       MLFeatureValue(double: stepLengthRightM ?? sentinel),
                "cadenceSPM":             MLFeatureValue(double: cadenceSPM ?? sentinel),
                "stepWidthCm":            MLFeatureValue(double: avgStepWidthCm ?? sentinel),
                "stepWidthVariabilityCm": MLFeatureValue(double: stepWidthVariabilityCm ?? sentinel),
                "pelvicObliquityDeg":     MLFeatureValue(double: pelvicObliquityDeg ?? sentinel),
                "strideTimeCVPercent":    MLFeatureValue(double: strideTimeCVPercent ?? sentinel),
                "walkingSpeedMPS":        MLFeatureValue(double: walkingSpeedMPS ?? sentinel),
                "strideLengthM":          MLFeatureValue(double: strideLengthM ?? sentinel),
                "hipFlexionROMDeg":       MLFeatureValue(double: hipFlexionROMDeg ?? sentinel),
                "armSwingAsymmetryPct":   MLFeatureValue(double: armSwingAsymmetryPercent ?? sentinel),
                "kneeFlexionROMDeg":      MLFeatureValue(double: kneeFlexionROMDeg ?? sentinel)
            ])
            let prediction = try model.prediction(from: provider)
            return parsePrediction(prediction)
        } catch {
            logger.error("CoreML prediction failed: \(error.localizedDescription)")
            return fallback.classify(
                stanceTimeLeftPercent: stanceTimeLeftPercent,
                stanceTimeRightPercent: stanceTimeRightPercent,
                stepLengthLeftM: stepLengthLeftM,
                stepLengthRightM: stepLengthRightM,
                cadenceSPM: cadenceSPM,
                avgStepWidthCm: avgStepWidthCm,
                stepWidthVariabilityCm: stepWidthVariabilityCm,
                pelvicObliquityDeg: pelvicObliquityDeg,
                strideTimeCVPercent: strideTimeCVPercent,
                walkingSpeedMPS: walkingSpeedMPS,
                strideLengthM: strideLengthM,
                hipFlexionROMDeg: hipFlexionROMDeg,
                armSwingAsymmetryPercent: armSwingAsymmetryPercent,
                kneeFlexionROMDeg: kneeFlexionROMDeg
            )
        }
    }

    // MARK: - Prediction Parsing

    /// Parse the model output into a GaitPatternResult.
    /// Expected outputs: "label" (String) and "labelProbability" (Dictionary).
    private func parsePrediction(_ prediction: MLFeatureProvider) -> GaitPatternResult {
        // Try to get class probabilities dictionary
        var scores: [GaitPatternType: Double] = [:]
        if let probDict = prediction.featureValue(for: "labelProbability")?.dictionaryValue {
            for (key, value) in probDict {
                if let keyStr = key as? String,
                   let pattern = GaitPatternType(rawValue: keyStr),
                   let prob = value as? Double {
                    scores[pattern] = prob
                }
            }
        }

        // Get predicted label
        let labelStr = prediction.featureValue(for: "label")?.stringValue ?? "normal"
        let primary = GaitPatternType(rawValue: labelStr) ?? .normal
        let confidence = scores[primary] ?? 1.0

        // Fill missing patterns with 0
        for pattern in [GaitPatternType.normal, .antalgic, .trendelenburg, .festinating,
                        .circumduction, .ataxic, .waddling, .stiffKnee] where scores[pattern] == nil {
            scores[pattern] = 0.0
        }

        return GaitPatternResult(
            primaryPattern: primary,
            confidence: confidence,
            patternScores: scores,
            flags: ["CoreML v\(modelService.modelStatuses.first { $0.identifier == .gaitPatternClassifier }?.version ?? "?")"]
        )
    }

}
