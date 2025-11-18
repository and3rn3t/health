//
//  RealTimeGaitMonitor.swift
//  VitalSense
//
//  Real-time gait monitoring with ML-powered fall prevention and emergency detection
//  Created: 2025-11-01
//

import Foundation
import HealthKit
import CoreMotion

// MARK: - Supporting Data Models

struct RealTimeGaitFeatures {
    let stepVariability: Double
    let walkingSpeed: Double
    let gaitAsymmetry: Double
    let stabilityIndex: Double
    let rhythmicity: Double
    let timestamp: Date
}

struct RealTimeGaitPrediction {
    let fallRisk: Double
    let gaitQuality: Double
    let stabilityScore: Double
    let confidence: Double
}

struct RealTimeGaitMetrics {
    let timestamp: Date
    let walkingSpeed: Double
    let stepVariability: Double
    let gaitAsymmetry: Double
    let stabilityIndex: Double
    let fallRisk: Double
    let gaitQuality: Double
    let confidence: Double
}

typealias RealTimeEmergencyAlert = EmergencyAlert

struct GaitRecommendation {
    let id: UUID
    let type: RecommendationType
    let priority: Priority
    let title: String
    let message: String
    let actionTitle: String
}

// MARK: - Enums

enum GaitState {
    case normal
    case cautious
    case unsteady
    case highRisk

    var color: Color {
        switch self {
        case .normal: return .green
        case .cautious: return .yellow
        case .unsteady: return .orange
        case .highRisk: return .red
        }
    }

    var icon: String {
        switch self {
        case .normal: return "checkmark.circle.fill"
        case .cautious: return "exclamationmark.triangle.fill"
        case .unsteady: return "exclamationmark.circle.fill"
        case .highRisk: return "exclamationmark.octagon.fill"
        }
    }
}

enum FallRiskLevel {
    case low, moderate, high, critical

    var color: Color {
        switch self {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

enum EmergencyType {
    case fallRiskDetected
    case fallDetected
    case medicalEmergency
}

enum EmergencySeverity {
    case low, medium, high, critical
}

enum RecommendationType {
    case safety, improvement, exercise, medical
}

enum Priority {
    case low, medium, high
}

struct UserProfile {
    let age: Int
    let height: Double
    let weight: Double
    let medicalConditions: [String]
}

// MARK: - Core Gait Models

public struct GaitMetrics: Codable {
    public var walkingSpeed: Double?
    public var cadence: Double?
    public var stepLength: Double?
    public var walkingAsymmetry: Double?
    public var doubleSupport: Double?

    public var strideTimeVariability: Double?
    public var stepLengthVariability: Double?
    public var walkingSpeedVariability: Double?

    public init(
        walkingSpeed: Double? = nil,
        cadence: Double? = nil,
        stepLength: Double? = nil,
        walkingAsymmetry: Double? = nil,
        doubleSupport: Double? = nil,
        strideTimeVariability: Double? = nil,
        stepLengthVariability: Double? = nil,
        walkingSpeedVariability: Double? = nil
    ) {
        self.walkingSpeed = walkingSpeed
        self.cadence = cadence
        self.stepLength = stepLength
        self.walkingAsymmetry = walkingAsymmetry
        self.doubleSupport = doubleSupport
        self.strideTimeVariability = strideTimeVariability
        self.stepLengthVariability = stepLengthVariability
        self.walkingSpeedVariability = walkingSpeedVariability
    }
}

public enum RiskLevel: String, CaseIterable, Codable {
    case low
    case moderate
    case high
    case critical
}

/// Canonical sensor reading used across gait components.
public struct SensorReading: Codable {
    public let timestamp: Date
    public let accelerationX: Double
    public let accelerationY: Double
    public let accelerationZ: Double

    public init(timestamp: Date, accelerationX: Double, accelerationY: Double, accelerationZ: Double) {
        self.timestamp = timestamp
        self.accelerationX = accelerationX
        self.accelerationY = accelerationY
        self.accelerationZ = accelerationZ
    }

    public init(timestamp: Date, acceleration: CMAcceleration) {
        self.init(timestamp: timestamp,
                  accelerationX: acceleration.x,
                  accelerationY: acceleration.y,
                  accelerationZ: acceleration.z)
    }
}

// GaitRiskAssessment is already defined by the LiDAR GaitRiskScorer; reuse it via import in those files.
