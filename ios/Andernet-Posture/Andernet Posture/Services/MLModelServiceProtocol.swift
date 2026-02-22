//
//  MLModelServiceProtocol.swift
//  Andernet Posture
//
//  Protocol abstraction for MLModelService to enable testability.
//

import Foundation
import CoreML

/// Abstraction over the ML model lifecycle manager.
/// Views consume `useMLModels`, `modelStatuses`, and `warmUp()`.
/// Analyzers additionally use `loadModel(_:)`.
@MainActor
protocol MLModelServiceProtocol: AnyObject, Observable {
    /// Whether CoreML models should be preferred over rule-based analyzers.
    var useMLModels: Bool { get set }

    /// Status of all registered models.
    var modelStatuses: [MLModelStatus] { get }

    /// Number of models available in the bundle.
    var availableModelCount: Int { get }

    /// Load a CoreML model from the app bundle. Returns nil if unavailable.
    func loadModel(_ identifier: MLModelIdentifier) -> MLModel?

    /// Check if a specific model is available in the bundle.
    func isModelAvailable(_ identifier: MLModelIdentifier) -> Bool

    /// Pre-warm all available models on a background thread.
    func warmUp()
}

// MARK: - Conformance

extension MLModelService: MLModelServiceProtocol {}
