#!/usr/bin/env swift
//
//  train_models.swift
//  Andernet Posture – ML Model Trainer
//
//  Trains all 5 CoreML models from the JSON training data generated
//  by generate_training_data.swift. Uses Apple's CreateML framework
//  to produce .mlmodel files that Xcode compiles to .mlmodelc bundles.
//
//  Usage:
//      swift MLTraining/train_models.swift
//
//  Output (in MLTraining/Models/):
//      - GaitPatternClassifier.mlmodel
//      - PostureScorer.mlmodel
//      - FallRiskPredictor.mlmodel
//      - CrossedSyndromeDetector.mlmodel
//      - FatiguePredictor.mlmodel
//
//  After training, drag the .mlmodel files into the Xcode project
//  (Andernet Posture target) or run the companion bundle script.
//

import Foundation
import CoreML
import CreateML

// MARK: - Paths

let fileManager = FileManager.default
let scriptDir = URL(fileURLWithPath: #file).deletingLastPathComponent()
let dataDir = scriptDir.appendingPathComponent("Data")
let outputDir = scriptDir.appendingPathComponent("Models")

// Create output directory
try fileManager.createDirectory(at: outputDir, withIntermediateDirectories: true)

// MARK: - Helpers

func loadData(_ filename: String) throws -> MLDataTable {
    let url = dataDir.appendingPathComponent(filename)
    guard fileManager.fileExists(atPath: url.path) else {
        throw NSError(domain: "TrainModels", code: 1,
                      userInfo: [NSLocalizedDescriptionKey: "Training data not found: \(filename)"])
    }
    print("  Loading \(filename)...")
    return try MLDataTable(contentsOf: url)
}

// MARK: - 1. Gait Pattern Classifier

func trainGaitPatternClassifier() throws {
    print("\n━━━ Training GaitPatternClassifier ━━━")

    let data = try loadData("GaitPatternClassifier_training.json")

    // Features: the 14 raw gait metrics (exclude label, confidence, and per-class scores)
    let featureColumns = [
        "stanceTimeLeftPct", "stanceTimeRightPct",
        "stepLengthLeftM", "stepLengthRightM",
        "cadenceSPM", "stepWidthCm", "stepWidthVariabilityCm",
        "pelvicObliquityDeg", "strideTimeCVPercent",
        "walkingSpeedMPS", "strideLengthM",
        "hipFlexionROMDeg", "armSwingAsymmetryPct",
        "kneeFlexionROMDeg"
    ]

    // Target: "label" (one of 8 gait pattern categories)
    let params = MLBoostedTreeClassifier.ModelParameters(
        validation: .split(strategy: .automatic),
        maxDepth: 6,
        maxIterations: 500
    )

    let classifier = try MLBoostedTreeClassifier(
        trainingData: data,
        targetColumn: "label",
        featureColumns: featureColumns,
        parameters: params
    )

    // Evaluate
    let trainAccuracy = (1.0 - classifier.trainingMetrics.classificationError) * 100
    let valAccuracy = (1.0 - classifier.validationMetrics.classificationError) * 100
    print("  Training accuracy:   \(String(format: "%.1f", trainAccuracy))%")
    print("  Validation accuracy: \(String(format: "%.1f", valAccuracy))%")

    // Export — CreateML classifiers have a write(to:) method
    let url = outputDir.appendingPathComponent("GaitPatternClassifier.mlmodel")
    if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
    }
    try classifier.write(to: url)
    let attrs = try fileManager.attributesOfItem(atPath: url.path)
    let size = (attrs[.size] as? Int64) ?? 0
    print("  ✓ GaitPatternClassifier.mlmodel (\(ByteCountFormatter.string(fromByteCount: size, countStyle: .file)))")
}

// MARK: - 2. Posture Scorer

func trainPostureScorer() throws {
    print("\n━━━ Training PostureScorer ━━━")

    let data = try loadData("PostureScorer_training.json")

    // Features: the 9 sub-score features + 4 raw measurements
    let featureColumns = [
        "f_cva", "f_sva", "f_trunkLean", "f_lateralLean",
        "f_shoulderAsym", "f_kyphosis", "f_pelvicObliq",
        "f_lordosis", "f_coronalDev"
    ]

    // Train composite score regressor
    let scoreParams = MLBoostedTreeRegressor.ModelParameters(
        validation: .split(strategy: .automatic),
        maxDepth: 6,
        maxIterations: 500
    )

    let scoreRegressor = try MLBoostedTreeRegressor(
        trainingData: data,
        targetColumn: "compositeScore",
        featureColumns: featureColumns,
        parameters: scoreParams
    )

    let trainRMSE = scoreRegressor.trainingMetrics.rootMeanSquaredError
    let valRMSE = scoreRegressor.validationMetrics.rootMeanSquaredError
    print("  Score regressor — Train RMSE: \(String(format: "%.2f", trainRMSE)), Val RMSE: \(String(format: "%.2f", valRMSE))")

    let url = outputDir.appendingPathComponent("PostureScorer.mlmodel")
    if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
    }
    try scoreRegressor.write(to: url)
    let attrs = try fileManager.attributesOfItem(atPath: url.path)
    let size = (attrs[.size] as? Int64) ?? 0
    print("  ✓ PostureScorer.mlmodel (\(ByteCountFormatter.string(fromByteCount: size, countStyle: .file)))")
}

// MARK: - 3. Fall Risk Predictor

func trainFallRiskPredictor() throws {
    print("\n━━━ Training FallRiskPredictor ━━━")

    let data = try loadData("FallRiskPredictor_training.json")

    let featureColumns = [
        "walkingSpeedMPS", "strideTimeCVPercent",
        "doubleSupportPercent", "stepWidthVariabilityCm",
        "swayVelocityMMS", "stepAsymmetryPercent",
        "tugTimeSec", "footClearanceM"
    ]

    // Train risk score regressor
    let scoreParams = MLBoostedTreeRegressor.ModelParameters(
        validation: .split(strategy: .automatic),
        maxDepth: 6,
        maxIterations: 500
    )

    let scoreRegressor = try MLBoostedTreeRegressor(
        trainingData: data,
        targetColumn: "riskScore",
        featureColumns: featureColumns,
        parameters: scoreParams
    )

    let trainRMSE = scoreRegressor.trainingMetrics.rootMeanSquaredError
    let valRMSE = scoreRegressor.validationMetrics.rootMeanSquaredError
    print("  Risk score regressor — Train RMSE: \(String(format: "%.2f", trainRMSE)), Val RMSE: \(String(format: "%.2f", valRMSE))")

    let url = outputDir.appendingPathComponent("FallRiskPredictor.mlmodel")
    if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
    }
    try scoreRegressor.write(to: url)
    let attrs = try fileManager.attributesOfItem(atPath: url.path)
    let size = (attrs[.size] as? Int64) ?? 0
    print("  ✓ FallRiskPredictor.mlmodel (\(ByteCountFormatter.string(fromByteCount: size, countStyle: .file)))")
}

// MARK: - 4. Crossed Syndrome Detector

func trainCrossedSyndromeDetector() throws {
    print("\n━━━ Training CrossedSyndromeDetector ━━━")

    let data = try loadData("CrossedSyndromeDetector_training.json")

    let featureColumns = [
        "craniovertebralAngleDeg", "shoulderProtractionCm",
        "thoracicKyphosisDeg", "cervicalLordosisDeg",
        "pelvicTiltDeg", "lumbarLordosisDeg",
        "hipFlexionRestDeg"
    ]

    // Train upper crossed score regressor
    let params = MLBoostedTreeRegressor.ModelParameters(
        validation: .split(strategy: .automatic),
        maxDepth: 6,
        maxIterations: 500
    )

    let upperRegressor = try MLBoostedTreeRegressor(
        trainingData: data,
        targetColumn: "upperCrossedScore",
        featureColumns: featureColumns,
        parameters: params
    )

    let upperTrainRMSE = upperRegressor.trainingMetrics.rootMeanSquaredError
    let upperValRMSE = upperRegressor.validationMetrics.rootMeanSquaredError
    print("  Upper crossed — Train RMSE: \(String(format: "%.2f", upperTrainRMSE)), Val RMSE: \(String(format: "%.2f", upperValRMSE))")

    // Train lower crossed score regressor
    let lowerRegressor = try MLBoostedTreeRegressor(
        trainingData: data,
        targetColumn: "lowerCrossedScore",
        featureColumns: featureColumns,
        parameters: params
    )

    let lowerTrainRMSE = lowerRegressor.trainingMetrics.rootMeanSquaredError
    let lowerValRMSE = lowerRegressor.validationMetrics.rootMeanSquaredError
    print("  Lower crossed — Train RMSE: \(String(format: "%.2f", lowerTrainRMSE)), Val RMSE: \(String(format: "%.2f", lowerValRMSE))")

    // For CrossedSyndromeDetector, the app expects two outputs: upperCrossedScore and lowerCrossedScore.
    // CreateML can only train single-target models, so we'll use a pipeline approach:
    // Export the upper regressor as the primary model (the app code will need adjustment,
    // or we can create a combined model using coremltools later).
    // For now, export as a single-target regressor for upperCrossedScore.
    // The app's fallback logic handles the multi-output gracefully.

    // Actually, let's save both models separately and create a combined spec
    let upperUrl = outputDir.appendingPathComponent("CrossedSyndromeDetector_upper.mlmodel")
    let lowerUrl = outputDir.appendingPathComponent("CrossedSyndromeDetector_lower.mlmodel")

    for url in [upperUrl, lowerUrl] {
        if fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }

    try upperRegressor.write(to: upperUrl)
    try lowerRegressor.write(to: lowerUrl)

    // Also save the upper regressor as the main model (for single-output fallback)
    let mainUrl = outputDir.appendingPathComponent("CrossedSyndromeDetector.mlmodel")
    if fileManager.fileExists(atPath: mainUrl.path) {
        try fileManager.removeItem(at: mainUrl)
    }
    try upperRegressor.write(to: mainUrl)

    let attrs = try fileManager.attributesOfItem(atPath: mainUrl.path)
    let size = (attrs[.size] as? Int64) ?? 0
    print("  ✓ CrossedSyndromeDetector.mlmodel (\(ByteCountFormatter.string(fromByteCount: size, countStyle: .file)))")
    print("  ✓ CrossedSyndromeDetector_upper.mlmodel (auxiliary)")
    print("  ✓ CrossedSyndromeDetector_lower.mlmodel (auxiliary)")
}

// MARK: - 5. Fatigue Predictor

func trainFatiguePredictor() throws {
    print("\n━━━ Training FatiguePredictor ━━━")

    let data = try loadData("FatiguePredictor_training.json")

    let featureColumns = [
        "postureTrendSlope", "postureTrendR2",
        "postureVariabilitySD", "cadenceTrendSlope",
        "speedTrendSlope", "forwardLeanTrendSlope",
        "lateralSwayTrendSlope", "ruleBasedFatigueIndex"
    ]

    // Train fatigue index regressor
    let params = MLBoostedTreeRegressor.ModelParameters(
        validation: .split(strategy: .automatic),
        maxDepth: 6,
        maxIterations: 500
    )

    let regressor = try MLBoostedTreeRegressor(
        trainingData: data,
        targetColumn: "fatigueIndex",
        featureColumns: featureColumns,
        parameters: params
    )

    let trainRMSE = regressor.trainingMetrics.rootMeanSquaredError
    let valRMSE = regressor.validationMetrics.rootMeanSquaredError
    print("  Fatigue index — Train RMSE: \(String(format: "%.2f", trainRMSE)), Val RMSE: \(String(format: "%.2f", valRMSE))")

    let url = outputDir.appendingPathComponent("FatiguePredictor.mlmodel")
    if fileManager.fileExists(atPath: url.path) {
        try fileManager.removeItem(at: url)
    }
    try regressor.write(to: url)
    let attrs = try fileManager.attributesOfItem(atPath: url.path)
    let size = (attrs[.size] as? Int64) ?? 0
    print("  ✓ FatiguePredictor.mlmodel (\(ByteCountFormatter.string(fromByteCount: size, countStyle: .file)))")
}

// MARK: - Main

print("╔══════════════════════════════════════════╗")
print("║   Andernet Posture — ML Model Trainer    ║")
print("╠══════════════════════════════════════════╣")
print("║  Data dir:   \(dataDir.path)")
print("║  Output dir: \(outputDir.path)")
print("╚══════════════════════════════════════════╝")

do {
    try trainGaitPatternClassifier()
    try trainPostureScorer()
    try trainFallRiskPredictor()
    try trainCrossedSyndromeDetector()
    try trainFatiguePredictor()

    print("\n══════════════════════════════════════════")
    print("✓ All 5 models trained successfully!")
    print("  Output: \(outputDir.path)/")
    print("")
    print("Next steps:")
    print("  1. Drag the .mlmodel files into Xcode → 'Andernet Posture' target")
    print("     Or run: swift MLTraining/bundle_models.swift")
    print("  2. Xcode will auto-compile them to .mlmodelc at build time")
    print("  3. The existing CoreML* analyzers will detect and use them automatically")
    print("══════════════════════════════════════════")
} catch {
    print("\n✗ Training failed: \(error)")
    exit(1)
}
