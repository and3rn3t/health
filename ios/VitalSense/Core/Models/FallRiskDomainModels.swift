import Foundation

public enum CanonicalFallRiskLevel: String, Codable, CaseIterable {
    case low
    case moderate
    case high
    case critical
}

// Canonical fall-risk related models shared across ML, LiDAR, and dashboard features.
// The CanonicalFallRiskLevel enum is defined in MLHealthDataTypes.swift and used throughout the app.

public struct CanonicalFallRiskPrediction: Codable {
    public let score: Double   // 0.0 - 1.0
    public let level: CanonicalFallRiskLevel

    public init(score: Double, level: CanonicalFallRiskLevel) {
        self.score = score
        self.level = level
    }
}
