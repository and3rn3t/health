import Foundation
import SwiftUI

// MARK: - Missing Type Definitions for Gait Analysis

struct FallRiskScore: Codable {
    let score: Double // 0-100
    let level: FallRiskLevel
    let confidence: Double
    let timestamp: Date
    
    init(score: Double, level: FallRiskLevel, confidence: Double, timestamp: Date = Date()) {
        self.score = score
        self.level = level
        self.confidence = confidence
        self.timestamp = timestamp
    }
}

struct WalkingStabilityReading: Codable {
    let timestamp: Date
    let stabilityScore: Double
    let classification: String
    
    init(timestamp: Date, stabilityScore: Double, classification: String) {
        self.timestamp = timestamp
        self.stabilityScore = stabilityScore
        self.classification = classification
    }
}

struct BalanceAssessment: Codable {
    let timestamp: Date
    let overallScore: Double
    let leftRightBalance: Double
    let stabilityIndex: Double
    
    init(timestamp: Date, overallScore: Double, leftRightBalance: Double, stabilityIndex: Double) {
        self.timestamp = timestamp
        self.overallScore = overallScore
        self.leftRightBalance = leftRightBalance
        self.stabilityIndex = stabilityIndex
    }
}

struct DailyMobilityTrends: Codable {
    let date: Date
    let stepCount: Int
    let distanceWalked: Double
    let activeTime: Double
    let averageSpeed: Double
    
    init(date: Date, stepCount: Int, distanceWalked: Double, activeTime: Double, averageSpeed: Double) {
        self.date = date
        self.stepCount = stepCount
        self.distanceWalked = distanceWalked
        self.activeTime = activeTime
        self.averageSpeed = averageSpeed
    }
}

struct HealthTrend: Codable {
    let metricType: String
    let direction: TrendDirection
    let changePercentage: Double
    let timestamp: Date
    
    typealias TrendType = String
    typealias Direction = TrendDirection
    
    init(metricType: String, direction: TrendDirection, changePercentage: Double, timestamp: Date = Date()) {
        self.metricType = metricType
        self.direction = direction
        self.changePercentage = changePercentage
        self.timestamp = timestamp
    }
}

struct HealthPrediction: Codable {
    let predictionType: String
    let predictedValue: Double
    let confidence: Double
    let timeframe: String
    
    init(predictionType: String, predictedValue: Double, confidence: Double, timeframe: String) {
        self.predictionType = predictionType
        self.predictedValue = predictedValue
        self.confidence = confidence
        self.timeframe = timeframe
    }
}

struct HealthCorrelation: Codable {
    let metric1: String
    let metric2: String
    let correlationStrength: Double
    let significance: String
    
    init(metric1: String, metric2: String, correlationStrength: Double, significance: String) {
        self.metric1 = metric1
        self.metric2 = metric2
        self.correlationStrength = correlationStrength
        self.significance = significance
    }
}

struct HeartRatePoint: Codable {
    let timestamp: Date
    let value: Double
    let context: String?
    
    init(timestamp: Date, value: Double, context: String? = nil) {
        self.timestamp = timestamp
        self.value = value
        self.context = context
    }
}

struct DailyStepData: Codable {
    let date: Date
    let stepCount: Int
    let goalPercentage: Double
    
    init(date: Date, stepCount: Int, goalPercentage: Double) {
        self.date = date
        self.stepCount = stepCount
        self.goalPercentage = goalPercentage
    }
}

struct MobilityStatus: Codable {
    let level: String
    let description: String
    let score: Double
    
    init(level: String, description: String, score: Double) {
        self.level = level
        self.description = description
        self.score = score
    }
}

struct EnvironmentalFactors: Codable {
    let lighting: String
    let terrain: String
    let weather: String?
    
    init(lighting: String, terrain: String, weather: String? = nil) {
        self.lighting = lighting
        self.terrain = terrain
        self.weather = weather
    }
}

struct RiskFactor: Codable {
    let type: String
    let severity: String
    let description: String
    
    init(type: String, severity: String, description: String) {
        self.type = type
        self.severity = severity
        self.description = description
    }
}

struct GaitAssessment: Codable {
    let timestamp: Date
    let overallScore: Double
    let metrics: GaitMetrics
    let riskFactors: [RiskFactor]
    
    init(timestamp: Date, overallScore: Double, metrics: GaitMetrics, riskFactors: [RiskFactor]) {
        self.timestamp = timestamp
        self.overallScore = overallScore
        self.metrics = metrics
        self.riskFactors = riskFactors
    }
}

struct ElevationPoint: Codable {
    let distance: Double
    let elevation: Double
    
    init(distance: Double, elevation: Double) {
        self.distance = distance
        self.elevation = elevation
    }
}

struct HealthMetricType: Codable {
    let name: String
    let unit: String
    let category: String
    
    init(name: String, unit: String, category: String) {
        self.name = name
        self.unit = unit
        self.category = category
    }
}

struct EnhancedMetricCard: Identifiable {
    let id = UUID()
    let title: String
    let value: String
    let trend: TrendDirection
    let color: Color
    
    init(title: String, value: String, trend: TrendDirection, color: Color) {
        self.title = title
        self.value = value
        self.trend = trend
        self.color = color
    }
}

struct NotificationItem: Identifiable, Codable {
    let id: UUID
    let title: String
    let message: String
    let timestamp: Date
    let priority: String
    let isRead: Bool
    
    init(id: UUID = UUID(), title: String, message: String, timestamp: Date = Date(), priority: String, isRead: Bool = false) {
        self.id = id
        self.title = title
        self.message = message
        self.timestamp = timestamp
        self.priority = priority
        self.isRead = isRead
    }
}

// MARK: - Placeholder Protocol for Testing
// Use GaitRiskScoring from Features/LiDAR/Gait/Risk/GaitRiskScoring.swift

struct BalanceMetrics: Codable {
    let leftRightBalance: Double
    let forwardBackwardBalance: Double
    let overallStability: Double
    let postureScore: Double
    
    init(leftRightBalance: Double, forwardBackwardBalance: Double, overallStability: Double, postureScore: Double) {
        self.leftRightBalance = leftRightBalance
        self.forwardBackwardBalance = forwardBackwardBalance
        self.overallStability = overallStability
        self.postureScore = postureScore
    }
}
