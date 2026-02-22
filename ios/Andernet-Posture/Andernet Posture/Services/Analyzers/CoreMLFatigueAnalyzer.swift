//
//  CoreMLFatigueAnalyzer.swift
//  Andernet Posture
//
//  CoreML-backed fatigue analyzer. Conforms to the existing
//  FatigueAnalyzer protocol. Falls back to DefaultFatigueAnalyzer
//  when the model isn't available.
//
//  Architecture — temporal summary approach:
//  The FatigueAnalyzer protocol is time-series oriented (recordTimePoint
//  accumulates data, assess() evaluates it). Rather than requiring a
//  sequence model at inference, this wrapper:
//
//  1. Delegates all time-series accumulation to DefaultFatigueAnalyzer
//  2. Extracts the computed trend features (slopes, R², variability)
//  3. Feeds those summary features into a tabular CoreML model
//  4. The ML model predicts a fatigue index and isFatigued label
//
//  This lets us train a simple tabular model in Create ML while still
//  capturing complex non-linear fatigue onset patterns (e.g., posture
//  drops fast but cadence compensates, then both collapse).
//
//  Model architecture (when trained):
//  - Input:  8-feature vector (trend slopes, variability, thirds comparison)
//  - Output: fatigueIndex (0–100), isFatigued (Bool label)
//  - Type:   Regression + binary classification
//

import Foundation
import CoreML
import os.log

private let logger = AppLogger.ml

final class CoreMLFatigueAnalyzer: FatigueAnalyzer {

    private let modelService: MLModelService
    private let fallback = DefaultFatigueAnalyzer()

    init(modelService: MLModelService) {
        self.modelService = modelService
    }

    // MARK: - FatigueAnalyzer Protocol

    /// Delegate time-point accumulation to the rule-based analyzer.
    /// Both this wrapper and the fallback share the same accumulated data
    /// because the fallback IS the data accumulator.
    func recordTimePoint(
        timestamp: TimeInterval,
        postureScore: Double,
        trunkLeanDeg: Double,
        lateralLeanDeg: Double,
        cadenceSPM: Double,
        walkingSpeedMPS: Double
    ) {
        fallback.recordTimePoint(
            timestamp: timestamp,
            postureScore: postureScore,
            trunkLeanDeg: trunkLeanDeg,
            lateralLeanDeg: lateralLeanDeg,
            cadenceSPM: cadenceSPM,
            walkingSpeedMPS: walkingSpeedMPS
        )
    }

    func assess() -> FatigueAssessment {
        // Always compute the rule-based assessment first — it provides
        // both the fallback result and the summary features for ML.
        let ruleResult = fallback.assess()

        guard modelService.useMLModels,
              let model = modelService.loadModel(.fatiguePredictor) else {
            return ruleResult
        }

        // Build named-column feature dictionary matching the trained model schema.
        // These are "meta-features" derived from the raw time-series by the
        // rule-based analyzer (slopes, variability, composite index).
        do {
            let input = try MLDictionaryFeatureProvider(dictionary: [
                "postureTrendSlope":      MLFeatureValue(double: ruleResult.postureTrendSlope),
                "postureTrendR2":         MLFeatureValue(double: ruleResult.postureTrendR2),
                "postureVariabilitySD":   MLFeatureValue(double: ruleResult.postureVariabilitySD),
                "cadenceTrendSlope":      MLFeatureValue(double: ruleResult.cadenceTrendSlope),
                "speedTrendSlope":        MLFeatureValue(double: ruleResult.speedTrendSlope),
                "forwardLeanTrendSlope":  MLFeatureValue(double: ruleResult.forwardLeanTrendSlope),
                "lateralSwayTrendSlope":  MLFeatureValue(double: ruleResult.lateralSwayTrendSlope),
                "ruleBasedFatigueIndex":  MLFeatureValue(double: ruleResult.fatigueIndex)
            ])
            let prediction = try model.prediction(from: input)

            // Extract ML fatigue index
            let mlFatigueIndex: Double
            if let idx = prediction.featureValue(for: "fatigueIndex")?.doubleValue {
                mlFatigueIndex = min(100, max(0, idx))
            } else {
                mlFatigueIndex = ruleResult.fatigueIndex
            }

            // Extract ML isFatigued — derive from fatigueIndex threshold
            // since the tabular regressor only outputs the continuous score.
            let mlIsFatigued = mlFatigueIndex > 25

            logger.debug("Fatigue ML — index: \(mlFatigueIndex, format: .fixed(precision: 1)), fatigued: \(mlIsFatigued)")

            // Rebuild the assessment with ML predictions but keep all
            // the trend detail from the rule-based analyzer (interpretability).
            return FatigueAssessment(
                fatigueIndex: mlFatigueIndex,
                postureVariabilitySD: ruleResult.postureVariabilitySD,
                postureTrendSlope: ruleResult.postureTrendSlope,
                postureTrendR2: ruleResult.postureTrendR2,
                cadenceTrendSlope: ruleResult.cadenceTrendSlope,
                speedTrendSlope: ruleResult.speedTrendSlope,
                forwardLeanTrendSlope: ruleResult.forwardLeanTrendSlope,
                lateralSwayTrendSlope: ruleResult.lateralSwayTrendSlope,
                isFatigued: mlIsFatigued
            )
        } catch {
            logger.error("Fatigue prediction failed: \(error.localizedDescription)")
            return ruleResult
        }
    }

    func reset() {
        fallback.reset()
    }
}
