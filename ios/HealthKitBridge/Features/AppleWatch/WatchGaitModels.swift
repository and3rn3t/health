import Foundation
import HealthKit
import CoreMotion

struct WatchGaitMetrics: Codable {
    let timestamp: Date
    let walkingSpeed: Double
    let stepLength: Double
    let asymmetry: Double
    let doubleSupportTime: Double
    let cadence: Double
    let stabilityIndex: Double?
    let heartRate: Double?
    let accelerationVariability: Double
    let rotationRate: Double
    let sessionDuration: TimeInterval
    let stepCount: Int
    let distanceTraveled: Double
    
    var overallRiskLevel: FallRiskLevel {
        var riskFactors = 0
        if walkingSpeed < 1.2 { riskFactors += 1 }
        if asymmetry > 3.0 { riskFactors += 1 }
        if doubleSupportTime > 25.0 { riskFactors += 1 }
        if cadence < 100 { riskFactors += 1 }
        
        switch riskFactors {
        case 0: return .low
        case 1: return .moderate
        case 2: return .high
        default: return .critical
        }
    }
}

struct RealtimeGaitMetrics: Codable {
    var walkingSpeed: Double = 0.0
    var stepLength: Double = 0.0
    var asymmetry: Double = 0.0
    var doubleSupportTime: Double = 0.0
    var cadence: Double = 0.0
    var stabilityIndex: Double? = nil
    var sessionStepCount: Int = 0
    var sessionDistance: Double = 0.0
    var sessionStartTime: Date?
}

enum FallRiskLevel: String, CaseIterable, Codable {
    case low, moderate, high, critical
    
    var displayName: String {
        switch self {
        case .low: return "Low Risk"
        case .moderate: return "Moderate Risk"
        case .high: return "High Risk"
        case .critical: return "Critical Risk"
        }
    }
}

enum GaitMonitoringType: String, CaseIterable, Codable {
    case continuous, walking, assessment, emergency
}

enum MonitoringSensitivity: String, CaseIterable, Codable {
    case low, standard, high, maximum
}

struct GaitMonitoringSession: Codable {
    let id: UUID
    let startTime: Date
    var endTime: Date?
    var duration: TimeInterval = 0
    let monitoringType: GaitMonitoringType
    let sensitivity: MonitoringSensitivity
    var metrics: [WatchGaitMetrics] = []
    
    init(type: GaitMonitoringType = .continuous, sensitivity: MonitoringSensitivity = .standard) {
        self.id = UUID()
        self.startTime = Date()
        self.monitoringType = type
        self.sensitivity = sensitivity
    }
}
