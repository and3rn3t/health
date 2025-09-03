import Foundation
import SwiftUI

// MARK: - Gait Analysis Data Models

struct GaitMetrics {
    var averageWalkingSpeed: Double? // m/s
    var averageStepLength: Double? // meters
    var walkingAsymmetry: Double? // percentage
    var doubleSupportTime: Double? // percentage of gait cycle
    var stairAscentSpeed: Double? // m/s
    var stairDescentSpeed: Double? // m/s
    var cadence: Double? // steps per minute
    var lastUpdated: Date?
    
    init() {
        self.lastUpdated = Date()
    }
    
    var isComplete: Bool {
        averageWalkingSpeed != nil && averageStepLength != nil && 
        walkingAsymmetry != nil && doubleSupportTime != nil
    }
    
    var mobilityStatus: MobilityStatus {
        guard let speed = averageWalkingSpeed else { return .unknown }
        
        if speed >= 1.2 {
            return .excellent
        } else if speed >= 1.0 {
            return .good
        } else if speed >= 0.8 {
            return .concerning
        } else {
            return .impaired
        }
    }
}

enum MobilityStatus: String, CaseIterable {
    case excellent = "Excellent"
    case good = "Good"
    case concerning = "Concerning"
    case impaired = "Impaired"
    case unknown = "Unknown"
    
    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .concerning: return .orange
        case .impaired: return .red
        case .unknown: return .gray
        }
    }
    
    var description: String {
        switch self {
        case .excellent: return "Walking speed and gait patterns are optimal"
        case .good: return "Good mobility with minor variations"
        case .concerning: return "Some mobility concerns detected"
        case .impaired: return "Significant mobility limitations present"
        case .unknown: return "Insufficient data for assessment"
        }
    }
}

// MARK: - Fall Risk Assessment Models

struct FallRiskScore {
    let overallScore: Double // 1.0 (low) to 4.0 (critical)
    let riskLevel: FallRiskLevel
    let riskFactors: [FallRiskFactor]
    let lastAssessment: Date
    
    var recommendations: [String] {
        var recs: [String] = []
        
        switch riskLevel {
        case .low:
            recs.append("Continue current activity level")
            recs.append("Regular walking for maintenance")
        case .moderate:
            recs.append("Consider balance exercises")
            recs.append("Review home safety")
            recs.append("Monitor gait changes")
        case .high:
            recs.append("Consult healthcare provider")
            recs.append("Consider physical therapy")
            recs.append("Implement fall prevention strategies")
        case .critical:
            recs.append("Immediate medical evaluation recommended")
            recs.append("Consider mobility aids")
            recs.append("Home safety assessment needed")
        }
        
        return recs
    }
}

enum FallRiskLevel: String, CaseIterable {
    case low = "Low Risk"
    case moderate = "Moderate Risk"
    case high = "High Risk"
    case critical = "Critical Risk"
    
    static func fromScore(_ score: Double) -> FallRiskLevel {
        if score <= 1.5 {
            return .low
        } else if score <= 2.5 {
            return .moderate
        } else if score <= 3.5 {
            return .high
        } else {
            return .critical
        }
    }
    
    var color: Color {
        switch self {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
    
    var iconName: String {
        switch self {
        case .low: return "checkmark.shield.fill"
        case .moderate: return "exclamationmark.shield.fill"
        case .high: return "exclamationmark.triangle.fill"
        case .critical: return "xmark.shield.fill"
        }
    }
}

struct FallRiskFactor {
    let name: String
    let value: Double
    let unit: String
    let score: Double // 1.0 (low risk) to 4.0 (high risk)
    let severity: FallRiskSeverity
    let description: String
    let recommendation: String
}

enum FallRiskSeverity: String, CaseIterable {
    case low = "Low"
    case moderate = "Moderate"
    case high = "High"
    case critical = "Critical"
    
    var color: Color {
        switch self {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

// MARK: - Balance Assessment Models

struct BalanceAssessment {
    let score: Double // 0-10 scale
    let maxScore: Double
    let indicators: [BalanceIndicator]
    let timestamp: Date
    
    var balanceLevel: BalanceLevel {
        let percentage = score / maxScore
        
        if percentage >= 0.8 {
            return .good
        } else if percentage >= 0.6 {
            return .fair
        } else if percentage >= 0.4 {
            return .poor
        } else {
            return .concerning
        }
    }
}

enum BalanceLevel: String, CaseIterable {
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case concerning = "Concerning"
    
    var color: Color {
        switch self {
        case .good: return .green
        case .fair: return .blue
        case .poor: return .orange
        case .concerning: return .red
        }
    }
}

struct BalanceIndicator {
    let type: BalanceIndicatorType
    let severity: FallRiskSeverity
    let description: String
}

enum BalanceIndicatorType: String, CaseIterable {
    case asymmetry = "Gait Asymmetry"
    case stability = "Dynamic Stability"
    case mobility = "Mobility"
    case coordination = "Coordination"
}

// MARK: - Daily Mobility Trends

struct DailyMobilityTrends {
    var stepCount: Int?
    var walkingDistance: Double? // meters
    var standTime: Double? // minutes
    var exerciseTime: Double? // minutes
    var flightsClimbed: Int?
    var mobilityScore: Double?
    var date: Date
    
    init() {
        self.date = Date()
    }
    
    var activityLevel: ActivityLevel {
        guard let steps = stepCount else { return .unknown }
        
        if steps >= 8000 {
            return .active
        } else if steps >= 5000 {
            return .moderate
        } else if steps >= 2000 {
            return .limited
        } else {
            return .sedentary
        }
    }
}

enum ActivityLevel: String, CaseIterable {
    case active = "Active"
    case moderate = "Moderate"
    case limited = "Limited"
    case sedentary = "Sedentary"
    case unknown = "Unknown"
    
    var color: Color {
        switch self {
        case .active: return .green
        case .moderate: return .blue
        case .limited: return .orange
        case .sedentary: return .red
        case .unknown: return .gray
        }
    }
    
    var description: String {
        switch self {
        case .active: return "Great mobility and activity level"
        case .moderate: return "Good daily movement"
        case .limited: return "Limited daily activity"
        case .sedentary: return "Very low activity level"
        case .unknown: return "Insufficient activity data"
        }
    }
}

// MARK: - Walking Stability Data

struct WalkingStabilityReading {
    let timestamp: Date
    let stabilityScore: Double // 0-1 scale
    let confidence: Double // measurement confidence
    let context: WalkingContext
}

enum WalkingContext: String, CaseIterable {
    case indoor = "Indoor"
    case outdoor = "Outdoor"
    case stairs = "Stairs"
    case uneven = "Uneven Surface"
    case unknown = "Unknown"
}

// MARK: - Gait Analysis for Data Transmission

struct GaitAnalysisPayload: Codable {
    let userId: String
    let deviceId: String
    let timestamp: Date
    let gaitMetrics: GaitMetricsData
    let fallRiskAssessment: FallRiskData
    let balanceAssessment: BalanceData?
    let dailyMobility: DailyMobilityData?
    let analysisVersion: String
    
    init(userId: String, deviceId: String, gait: GaitMetrics, fallRisk: FallRiskScore, balance: BalanceAssessment?, mobility: DailyMobilityTrends?) {
        self.userId = userId
        self.deviceId = deviceId
        self.timestamp = Date()
        self.gaitMetrics = GaitMetricsData(from: gait)
        self.fallRiskAssessment = FallRiskData(from: fallRisk)
        self.balanceAssessment = balance.map { BalanceData(from: $0) }
        self.dailyMobility = mobility.map { DailyMobilityData(from: $0) }
        self.analysisVersion = "1.0"
    }
}

struct GaitMetricsData: Codable {
    let averageWalkingSpeed: Double?
    let averageStepLength: Double?
    let walkingAsymmetry: Double?
    let doubleSupportTime: Double?
    let stairAscentSpeed: Double?
    let stairDescentSpeed: Double?
    let cadence: Double?
    let mobilityStatus: String
    
    init(from gait: GaitMetrics) {
        self.averageWalkingSpeed = gait.averageWalkingSpeed
        self.averageStepLength = gait.averageStepLength
        self.walkingAsymmetry = gait.walkingAsymmetry
        self.doubleSupportTime = gait.doubleSupportTime
        self.stairAscentSpeed = gait.stairAscentSpeed
        self.stairDescentSpeed = gait.stairDescentSpeed
        self.cadence = gait.cadence
        self.mobilityStatus = gait.mobilityStatus.rawValue
    }
}

struct FallRiskData: Codable {
    let overallScore: Double
    let riskLevel: String
    let riskFactors: [FallRiskFactorData]
    let lastAssessment: Date
    
    init(from fallRisk: FallRiskScore) {
        self.overallScore = fallRisk.overallScore
        self.riskLevel = fallRisk.riskLevel.rawValue
        self.riskFactors = fallRisk.riskFactors.map { FallRiskFactorData(from: $0) }
        self.lastAssessment = fallRisk.lastAssessment
    }
}

struct FallRiskFactorData: Codable {
    let name: String
    let value: Double
    let unit: String
    let score: Double
    let severity: String
    let description: String
    
    init(from factor: FallRiskFactor) {
        self.name = factor.name
        self.value = factor.value
        self.unit = factor.unit
        self.score = factor.score
        self.severity = factor.severity.rawValue
        self.description = factor.description
    }
}

struct BalanceData: Codable {
    let score: Double
    let maxScore: Double
    let balanceLevel: String
    let indicators: [BalanceIndicatorData]
    let assessmentDate: Date
    
    init(from balance: BalanceAssessment) {
        self.score = balance.score
        self.maxScore = balance.maxScore
        self.balanceLevel = balance.balanceLevel.rawValue
        self.indicators = balance.indicators.map { BalanceIndicatorData(from: $0) }
        self.assessmentDate = balance.timestamp
    }
}

struct BalanceIndicatorData: Codable {
    let type: String
    let severity: String
    let description: String
    
    init(from indicator: BalanceIndicator) {
        self.type = indicator.type.rawValue
        self.severity = indicator.severity.rawValue
        self.description = indicator.description
    }
}

struct DailyMobilityData: Codable {
    let stepCount: Int?
    let walkingDistance: Double?
    let standTime: Double?
    let activityLevel: String
    let trendDate: Date
    
    init(from mobility: DailyMobilityTrends) {
        self.stepCount = mobility.stepCount
        self.walkingDistance = mobility.walkingDistance
        self.standTime = mobility.standTime
        self.activityLevel = mobility.activityLevel.rawValue
        self.trendDate = mobility.date
    }
}

// MARK: - Additional Payload Types for WebSocket Transmission

struct RealtimeGaitDataPayload: Codable {
    let userId: String
    let deviceId: String
    let timestamp: Date
    let stepCount: Int
    let stepCadence: Double
    let stabilityScore: Double
    let walkingPattern: String
    let sessionDuration: TimeInterval
    
    init(userId: String, deviceId: String, stepCount: Int, stepCadence: Double, stabilityScore: Double, walkingPattern: String, sessionDuration: TimeInterval) {
        self.userId = userId
        self.deviceId = deviceId
        self.timestamp = Date()
        self.stepCount = stepCount
        self.stepCadence = stepCadence
        self.stabilityScore = stabilityScore
        self.walkingPattern = walkingPattern
        self.sessionDuration = sessionDuration
    }
}

struct FallRiskAssessmentPayload: Codable {
    let userId: String
    let deviceId: String
    let timestamp: Date
    let fallRiskScore: FallRiskData
    let assessmentTrigger: String // "scheduled", "threshold", "manual"
    let dataQuality: String // "high", "medium", "low"
    
    init(userId: String, deviceId: String, fallRisk: FallRiskScore, trigger: String = "manual") {
        self.userId = userId
        self.deviceId = deviceId
        self.timestamp = Date()
        self.fallRiskScore = FallRiskData(from: fallRisk)
        self.assessmentTrigger = trigger
        self.dataQuality = "high" // Default to high quality
    }
}

// MARK: - Dictionary Conversion Extensions
extension GaitAnalysisPayload {
    func toDictionary() throws -> [String: Any] {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(self)
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        return json as? [String: Any] ?? [:]
    }
}

extension RealtimeGaitDataPayload {
    func toDictionary() throws -> [String: Any] {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(self)
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        return json as? [String: Any] ?? [:]
    }
}

extension FallRiskAssessmentPayload {
    func toDictionary() throws -> [String: Any] {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(self)
        let json = try JSONSerialization.jsonObject(with: data, options: [])
        return json as? [String: Any] ?? [:]
    }
}
