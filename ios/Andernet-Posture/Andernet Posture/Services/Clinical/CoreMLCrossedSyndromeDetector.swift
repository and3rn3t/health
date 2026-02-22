//
//  CoreMLCrossedSyndromeDetector.swift
//  Andernet Posture
//
//  CoreML-backed crossed syndrome detector. Conforms to the existing
//  CrossedSyndromeDetecting protocol. Falls back to
//  DefaultCrossedSyndromeDetector when the model isn't available.
//
//  The ML model can capture interaction effects between upper and
//  lower body deviations — e.g., kyphosis + anterior pelvic tilt
//  co-occurring is more significant than either alone, and threshold-
//  based rules miss these non-linear interactions.
//
//  Model architecture (when trained):
//  - Input:  7-feature vector (angles/distances, sentinel −1 for nil)
//  - Output: upperCrossedScore (0–100), lowerCrossedScore (0–100)
//  - Type:   Multi-output regression (tabular)
//

import Foundation
import CoreML
import os.log

private let logger = AppLogger.ml

final class CoreMLCrossedSyndromeDetector: CrossedSyndromeDetecting {

    private let modelService: MLModelService
    private let fallback = DefaultCrossedSyndromeDetector()

    init(modelService: MLModelService) {
        self.modelService = modelService
    }

    // MARK: - CrossedSyndromeDetecting Protocol

    func detect(
        craniovertebralAngleDeg: Double,
        shoulderProtractionCm: Double,
        thoracicKyphosisDeg: Double,
        cervicalLordosisDeg: Double?,
        pelvicTiltDeg: Double,
        lumbarLordosisDeg: Double,
        hipFlexionRestDeg: Double?
    ) -> CrossedSyndromeResult {

        guard modelService.useMLModels,
              let upperModel = modelService.loadModel(.crossedSyndromeDetector) else {
            return fallback.detect(
                craniovertebralAngleDeg: craniovertebralAngleDeg,
                shoulderProtractionCm: shoulderProtractionCm,
                thoracicKyphosisDeg: thoracicKyphosisDeg,
                cervicalLordosisDeg: cervicalLordosisDeg,
                pelvicTiltDeg: pelvicTiltDeg,
                lumbarLordosisDeg: lumbarLordosisDeg,
                hipFlexionRestDeg: hipFlexionRestDeg
            )
        }

        // Build named-column feature dictionary matching the trained model schema.
        // Sentinel −1 is used for missing optional values (consistent with training data).
        let sentinel = -1.0
        do {
            let provider = try MLDictionaryFeatureProvider(dictionary: [
                "craniovertebralAngleDeg": MLFeatureValue(double: craniovertebralAngleDeg),
                "shoulderProtractionCm":   MLFeatureValue(double: shoulderProtractionCm),
                "thoracicKyphosisDeg":     MLFeatureValue(double: thoracicKyphosisDeg),
                "cervicalLordosisDeg":     MLFeatureValue(double: cervicalLordosisDeg ?? sentinel),
                "pelvicTiltDeg":           MLFeatureValue(double: pelvicTiltDeg),
                "lumbarLordosisDeg":       MLFeatureValue(double: lumbarLordosisDeg),
                "hipFlexionRestDeg":       MLFeatureValue(double: hipFlexionRestDeg ?? sentinel)
            ])

            // Upper crossed score from the primary model
            let upperPrediction = try upperModel.prediction(from: provider)
            let mlUpperScore = clampScore(upperPrediction, key: "upperCrossedScore")

            // Lower crossed score from the companion model (if available)
            let mlLowerScore: Double
            if let lowerModel = modelService.loadModel(.crossedSyndromeDetectorLower) {
                let lowerPrediction = try lowerModel.prediction(from: provider)
                mlLowerScore = clampScore(lowerPrediction, key: "lowerCrossedScore")
            } else {
                // Fallback: use rule-based lower score
                let ruleResult = fallback.detect(
                    craniovertebralAngleDeg: craniovertebralAngleDeg,
                    shoulderProtractionCm: shoulderProtractionCm,
                    thoracicKyphosisDeg: thoracicKyphosisDeg,
                    cervicalLordosisDeg: cervicalLordosisDeg,
                    pelvicTiltDeg: pelvicTiltDeg,
                    lumbarLordosisDeg: lumbarLordosisDeg,
                    hipFlexionRestDeg: hipFlexionRestDeg
                )
                mlLowerScore = ruleResult.lowerCrossedScore
            }

            // Use rule-based detector for factor breakdown (interpretability)
            let ruleResult = fallback.detect(
                craniovertebralAngleDeg: craniovertebralAngleDeg,
                shoulderProtractionCm: shoulderProtractionCm,
                thoracicKyphosisDeg: thoracicKyphosisDeg,
                cervicalLordosisDeg: cervicalLordosisDeg,
                pelvicTiltDeg: pelvicTiltDeg,
                lumbarLordosisDeg: lumbarLordosisDeg,
                hipFlexionRestDeg: hipFlexionRestDeg
            )

            // Determine syndromes from ML scores
            var syndromes: [CrossedSyndromeType] = []
            if mlUpperScore >= 40 { syndromes.append(.upperCrossed) }
            if mlLowerScore >= 40 { syndromes.append(.lowerCrossed) }

            logger.debug("CrossedSyndrome ML — upper: \(mlUpperScore, format: .fixed(precision: 1)), lower: \(mlLowerScore, format: .fixed(precision: 1))")

            return CrossedSyndromeResult(
                upperCrossedScore: mlUpperScore,
                lowerCrossedScore: mlLowerScore,
                detectedSyndromes: syndromes,
                upperFactors: ruleResult.upperFactors,
                lowerFactors: ruleResult.lowerFactors
            )
        } catch {
            logger.error("CrossedSyndrome prediction failed: \(error.localizedDescription)")
            return fallback.detect(
                craniovertebralAngleDeg: craniovertebralAngleDeg,
                shoulderProtractionCm: shoulderProtractionCm,
                thoracicKyphosisDeg: thoracicKyphosisDeg,
                cervicalLordosisDeg: cervicalLordosisDeg,
                pelvicTiltDeg: pelvicTiltDeg,
                lumbarLordosisDeg: lumbarLordosisDeg,
                hipFlexionRestDeg: hipFlexionRestDeg
            )
        }
    }

    // MARK: - Helpers

    /// Extract a Double score from the prediction output, clamped to 0–100.
    private func clampScore(_ prediction: MLFeatureProvider, key: String) -> Double {
        guard let value = prediction.featureValue(for: key)?.doubleValue else {
            return 0
        }
        return min(100, max(0, value))
    }
}
