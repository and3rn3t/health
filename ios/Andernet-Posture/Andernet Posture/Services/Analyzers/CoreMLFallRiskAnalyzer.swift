//
//  CoreMLFallRiskAnalyzer.swift
//  Andernet Posture
//
//  CoreML-backed fall risk predictor. Conforms to the existing
//  FallRiskAnalyzer protocol. Falls back to DefaultFallRiskAnalyzer
//  when the model isn't available.
//
//  The ML model can capture non-linear interactions between risk
//  factors (e.g., low speed + high stride variability is worse than
//  either alone) that the linear weighted sum cannot.
//

import Foundation
import CoreML
import os.log

private let logger = AppLogger.ml

final class CoreMLFallRiskAnalyzer: FallRiskAnalyzer {

    private let modelService: MLModelService
    private let fallback = DefaultFallRiskAnalyzer()

    init(modelService: MLModelService) {
        self.modelService = modelService
    }

    // MARK: - FallRiskAnalyzer Protocol

    func assess(
        walkingSpeedMPS: Double?,
        strideTimeCVPercent: Double?,
        doubleSupportPercent: Double?,
        stepWidthVariabilityCm: Double?,
        swayVelocityMMS: Double?,
        stepAsymmetryPercent: Double?,
        tugTimeSec: Double?,
        footClearanceM: Double?
    ) -> FallRiskAssessment {

        guard modelService.useMLModels,
              let model = modelService.loadModel(.fallRiskPredictor) else {
            return fallback.assess(
                walkingSpeedMPS: walkingSpeedMPS,
                strideTimeCVPercent: strideTimeCVPercent,
                doubleSupportPercent: doubleSupportPercent,
                stepWidthVariabilityCm: stepWidthVariabilityCm,
                swayVelocityMMS: swayVelocityMMS,
                stepAsymmetryPercent: stepAsymmetryPercent,
                tugTimeSec: tugTimeSec,
                footClearanceM: footClearanceM
            )
        }

        // Build named-column feature dictionary matching the trained model schema.
        // Sentinel −1 is used for missing values (consistent with training data).
        let sentinel = -1.0
        do {
            let provider = try MLDictionaryFeatureProvider(dictionary: [
                "walkingSpeedMPS":        MLFeatureValue(double: walkingSpeedMPS ?? sentinel),
                "strideTimeCVPercent":    MLFeatureValue(double: strideTimeCVPercent ?? sentinel),
                "doubleSupportPercent":   MLFeatureValue(double: doubleSupportPercent ?? sentinel),
                "stepWidthVariabilityCm": MLFeatureValue(double: stepWidthVariabilityCm ?? sentinel),
                "swayVelocityMMS":        MLFeatureValue(double: swayVelocityMMS ?? sentinel),
                "stepAsymmetryPercent":   MLFeatureValue(double: stepAsymmetryPercent ?? sentinel),
                "tugTimeSec":             MLFeatureValue(double: tugTimeSec ?? sentinel),
                "footClearanceM":         MLFeatureValue(double: footClearanceM ?? sentinel)
            ])
            let prediction = try model.prediction(from: provider)
            return parsePrediction(prediction, features: [
                walkingSpeedMPS, strideTimeCVPercent, doubleSupportPercent,
                stepWidthVariabilityCm, swayVelocityMMS, stepAsymmetryPercent,
                tugTimeSec, footClearanceM
            ])
        } catch {
            logger.error("CoreML fall risk prediction failed: \(error.localizedDescription)")
            return fallback.assess(
                walkingSpeedMPS: walkingSpeedMPS,
                strideTimeCVPercent: strideTimeCVPercent,
                doubleSupportPercent: doubleSupportPercent,
                stepWidthVariabilityCm: stepWidthVariabilityCm,
                swayVelocityMMS: swayVelocityMMS,
                stepAsymmetryPercent: stepAsymmetryPercent,
                tugTimeSec: tugTimeSec,
                footClearanceM: footClearanceM
            )
        }
    }

    // MARK: - Prediction Parsing

    private func parsePrediction(
        _ prediction: MLFeatureProvider,
        features: [Double?]
    ) -> FallRiskAssessment {

        // Extract composite risk score (model outputs "riskScore")
        let mlScore: Double
        if let score = prediction.featureValue(for: "riskScore")?.doubleValue {
            mlScore = max(0, min(100, score))
        } else {
            mlScore = 0
        }

        // Derive risk level from score thresholds — the tabular regressor
        // only predicts the continuous score; classification uses the same
        // clinically validated thresholds as the rule-based analyzer.
        let mlLevel: FallRiskLevel
        if mlScore >= 60 {
            mlLevel = .high
        } else if mlScore >= 30 {
            mlLevel = .moderate
        } else {
            mlLevel = .low
        }

        // Build factor breakdown using the rule-based analyzer
        // (for interpretability — the ML score may differ from
        // the sum of per-factor sub-scores, and that's expected)
        let ruleResult = fallback.assess(
            walkingSpeedMPS: features[0],
            strideTimeCVPercent: features[1],
            doubleSupportPercent: features[2],
            stepWidthVariabilityCm: features[3],
            swayVelocityMMS: features[4],
            stepAsymmetryPercent: features[5],
            tugTimeSec: features[6],
            footClearanceM: features[7]
        )

        return FallRiskAssessment(
            compositeScore: mlScore,
            riskLevel: mlLevel,
            factorBreakdown: ruleResult.factorBreakdown,
            riskFactorCount: ruleResult.riskFactorCount
        )
    }
}
