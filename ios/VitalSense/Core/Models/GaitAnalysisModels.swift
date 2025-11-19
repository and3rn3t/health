//
//  GaitAnalysisModels.swift
//  VitalSense
//
//  Core gait analysis model types
//  Created: 2025-11-01
//

import Foundation
import HealthKit
import CoreMotion

// NOTE: Duplicate type definitions have been removed from this file.
// Types like RealTimeGaitFeatures, GaitState, FallRiskLevel, etc. are now
// defined in RealTimeGaitMonitor.swift to avoid ambiguity.

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
    
    // Additional commonly used properties
    public var averageWalkingSpeed: Double? { walkingSpeed }
    public var gaitVariability: Double? { strideTimeVariability }

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

// MARK: - Gait Analysis Results

public struct GaitAnalysisResult: Codable {
    public let timestamp: Date
    public let metrics: GaitMetrics
    public let quality: GaitQuality
    public let recommendations: [String]
    
    public init(timestamp: Date, metrics: GaitMetrics, quality: GaitQuality, recommendations: [String]) {
        self.timestamp = timestamp
        self.metrics = metrics
        self.quality = quality
        self.recommendations = recommendations
    }
}

public enum GaitQuality: String, Codable {
    case excellent
    case good
    case fair
    case poor
    case unknown
}

// MARK: - Sensor Data

public struct SensorReading: Codable {
    public let timestamp: Date
    public let accelerationX: Double
    public let accelerationY: Double
    public let accelerationZ: Double
    public let rotationX: Double
    public let rotationY: Double
    public let rotationZ: Double
    
    public init(
        timestamp: Date,
        accelerationX: Double,
        accelerationY: Double,
        accelerationZ: Double,
        rotationX: Double,
        rotationY: Double,
        rotationZ: Double
    ) {
        self.timestamp = timestamp
        self.accelerationX = accelerationX
        self.accelerationY = accelerationY
        self.accelerationZ = accelerationZ
        self.rotationX = rotationX
        self.rotationY = rotationY
        self.rotationZ = rotationZ
    }
}
