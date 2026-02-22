//
//  MLModelService.swift
//  Andernet Posture
//
//  Central CoreML model lifecycle manager. Handles loading, caching,
//  version tracking, and warm-up for all on-device ML models.
//
//  Architecture:
//  - Models are loaded lazily on first use
//  - Compiled .mlmodelc bundles live in the app bundle
//  - Future: download updated models from CloudKit / on-demand resources
//

import Foundation
import CoreML
import os.log

private let logger = AppLogger.ml

// MARK: - Model Identifier

/// Registry of all CoreML models used by the app.
enum MLModelIdentifier: String, CaseIterable, Sendable {
    case gaitPatternClassifier  = "GaitPatternClassifier"
    case postureScorer          = "PostureScorer"
    case fallRiskPredictor      = "FallRiskPredictor"
    case crossedSyndromeDetector = "CrossedSyndromeDetector"
    case crossedSyndromeDetectorLower = "CrossedSyndromeDetector_lower"
    case fatiguePredictor       = "FatiguePredictor"

    /// Human-readable display name.
    var displayName: String {
        switch self {
        case .gaitPatternClassifier: return String(localized: "Gait Pattern Classifier")
        case .postureScorer:         return String(localized: "Posture Scorer")
        case .fallRiskPredictor:     return String(localized: "Fall Risk Predictor")
        case .crossedSyndromeDetector: return String(localized: "Crossed Syndrome Detector (Upper)")
        case .crossedSyndromeDetectorLower: return String(localized: "Crossed Syndrome Detector (Lower)")
        case .fatiguePredictor:      return String(localized: "Fatigue Predictor")
        }
    }

    /// Short description of what the model does.
    var summary: String {
        switch self {
        case .gaitPatternClassifier:
            return String(localized: "Classifies 8 gait patterns from session metrics")
        case .postureScorer:
            return String(localized: "Predicts composite posture score from sub-metrics")
        case .fallRiskPredictor:
            return String(localized: "Estimates fall risk from gait and balance data")
        case .crossedSyndromeDetector:
            return String(localized: "Detects upper crossed syndrome")
        case .crossedSyndromeDetectorLower:
            return String(localized: "Detects lower crossed syndrome")
        case .fatiguePredictor:
            return String(localized: "Predicts fatigue onset from session trend features")
        }
    }

    /// Number of input features the model expects.
    var featureCount: Int {
        switch self {
        case .gaitPatternClassifier: return 14
        case .postureScorer:         return 9
        case .fallRiskPredictor:     return 8
        case .crossedSyndromeDetector: return 7
        case .crossedSyndromeDetectorLower: return 7
        case .fatiguePredictor:      return 8
        }
    }
}

// MARK: - Model Status

/// Status of a single model in the registry.
struct MLModelStatus: Sendable {
    let identifier: MLModelIdentifier
    let isAvailable: Bool
    let version: String
    let lastLoaded: Date?
}

// MARK: - MLModelService

@Observable
@MainActor
final class MLModelService {

    /// Shared instance — used by CoreML analyzer classes and the app environment.
    static let shared = MLModelService()

    /// Whether CoreML models should be preferred over rule-based analyzers.
    var useMLModels: Bool = false {
        didSet {
            UserDefaults.standard.set(useMLModels, forKey: "useMLModels")
            logger.info("ML models \(self.useMLModels ? "enabled" : "disabled")")
        }
    }

    /// Cached compiled models keyed by identifier.
    private var loadedModels: [MLModelIdentifier: MLModel] = [:]

    /// Model version strings (embedded in model metadata or hardcoded).
    private let modelVersions: [MLModelIdentifier: String] = [
        .gaitPatternClassifier: "1.0.0",
        .postureScorer: "1.0.0",
        .fallRiskPredictor: "1.0.0",
        .crossedSyndromeDetector: "1.0.0",
        .crossedSyndromeDetectorLower: "1.0.0",
        .fatiguePredictor: "1.0.0"
    ]

    init() {
        useMLModels = UserDefaults.standard.bool(forKey: "useMLModels")
    }

    // MARK: - Model Loading

    /// Load a CoreML model from the app bundle. Returns nil if the model
    /// file isn't bundled (e.g., not yet trained / shipped).
    func loadModel(_ identifier: MLModelIdentifier) -> MLModel? {
        // Return cached if already loaded
        if let cached = loadedModels[identifier] {
            return cached
        }

        // Look for compiled model in bundle
        guard let url = Bundle.main.url(
            forResource: identifier.rawValue,
            withExtension: "mlmodelc"
        ) else {
            logger.info("Model '\(identifier.rawValue)' not found in bundle — using rule-based fallback.")
            return nil
        }

        do {
            let config = MLModelConfiguration()
            config.computeUnits = .cpuAndNeuralEngine
            let model = try MLModel(contentsOf: url, configuration: config)
            loadedModels[identifier] = model
            logger.info("Loaded CoreML model: \(identifier.rawValue)")
            return model
        } catch {
            logger.error("Failed to load model '\(identifier.rawValue)': \(error.localizedDescription)")
            return nil
        }
    }

    /// Check if a specific model is available in the bundle.
    func isModelAvailable(_ identifier: MLModelIdentifier) -> Bool {
        if loadedModels[identifier] != nil { return true }
        return Bundle.main.url(
            forResource: identifier.rawValue,
            withExtension: "mlmodelc"
        ) != nil
    }

    /// Pre-warm all available models on a background thread.
    func warmUp() {
        Task.detached(priority: .utility) { [weak self] in
            for identifier in MLModelIdentifier.allCases {
                _ = await MainActor.run { self?.loadModel(identifier) }
            }
            logger.info("Model warm-up complete.")
        }
    }

    // MARK: - Status

    /// Status of all registered models.
    var modelStatuses: [MLModelStatus] {
        MLModelIdentifier.allCases.map { id in
            MLModelStatus(
                identifier: id,
                isAvailable: isModelAvailable(id),
                version: modelVersions[id] ?? "—",
                lastLoaded: loadedModels[id] != nil ? .now : nil
            )
        }
    }

    /// Number of models available in the bundle.
    var availableModelCount: Int {
        MLModelIdentifier.allCases.filter { isModelAvailable($0) }.count
    }

    // MARK: - Prediction Helpers

    /// Create an MLMultiArray of Doubles with the given values.
    /// Missing values (nil) are replaced with `sentinelValue`.
    static func makeFeatureArray(
        _ values: [Double?],
        sentinelValue: Double = -1.0
    ) -> MLMultiArray? {
        let array: MLMultiArray
        do {
            array = try MLMultiArray(shape: [NSNumber(value: values.count)], dataType: .double)
        } catch {
            logger.error("Failed to create MLMultiArray(\(values.count) features): \(error.localizedDescription)")
            return nil
        }
        for (i, value) in values.enumerated() {
            array[i] = NSNumber(value: value ?? sentinelValue)
        }
        return array
    }
}
