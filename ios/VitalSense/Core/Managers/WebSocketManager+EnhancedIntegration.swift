//
//  WebSocketManager+EnhancedMLLiDAR.swift
//  VitalSense
//
//  Enhanced ML and LiDAR integration for real-time gait analysis
//  Created: 2025-11-01
//

import Foundation

extension WebSocketManager {
    // MARK: - Enhanced ML / LiDAR Integration Payloads

    struct EnhancedAnalysisPayload: Codable {
        let id: UUID
        let result: EnhancedAnalysisResult
    }

    struct MLPredictionPayload: Codable {
        let id: UUID
        let predictions: MLPredictions
    }

    enum PrivacyLevel: String, Codable {
        case minimal
        case standard
        case enhanced
    }

    struct AnalysisConfiguration: Codable {
        let privacyLevel: PrivacyLevel
        let samplingRateHz: Double
    }

    enum AnalysisError: Error, Codable {
        case invalidPayload
        case processingFailed(String)
    }

    struct EnhancedAnalysisResult: Codable {
        let score: Double
        let details: String?
    }

    struct MLPredictions: Codable {
        let values: [Double]
    }

    // ...existing enhanced WebSocket integration methods that use these types...
}
