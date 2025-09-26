import Foundation
import SwiftUI

// Unified heart rate data point used across features
struct HeartRatePoint: Codable, Identifiable {
    let id = UUID()
    let bpm: Double
    let date: Date
    // Legacy aliases for existing call sites
    var heartRate: Double { bpm }
    var timestamp: Date { date }
    var value: Double { bpm }
    // Convenience initializers to match previous usages
    init(bpm: Double, date: Date) {
        self.bpm = bpm
        self.date = date
    }
    init(heartRate: Double, timestamp: Date) {
        self.bpm = heartRate
        self.date = timestamp
    }
    init(value: Double, date: Date) {
        self.bpm = value
        self.date = date
    }
}

// MARK: - Gait Analysis Data Models

struct GaitMetrics {
    var averageWalkingSpeed: Double? // m/s
    var averageStepLength: Double? // meters
    var walkingAsymmetry: Double? // percentage
    var doubleSupportTime: Double? // percentage of gait cycle
    var stanceTime: Double? // percentage of gait cycle
    var swingTime: Double? // percentage of gait cycle
    var stepFrequency: Double? // steps per minute
    var strideLength: Double? // meters
    var walkingSpeedVariability: Double? // coefficient of variation
    var stepLengthVariability: Double? // coefficient of variation
    var averageToeClearance: Double? // meters (engineered / LiDAR derived)
    // Engineered features
    var strideTimeVariability: Double? // coefficient of variation of stride time
    var harmonicRatio: Double? // stability smoothness proxy
    var mediolateralSwayProxy: Double? // normalized sway
    var nearTripEvents: Int? // count within session window
    var mobilityStatus: MobilityStatus
    var riskLevel: RiskLevel?

    init() {
        self.mobilityStatus = .unknown
    }
}

enum MobilityStatus: String, CaseIterable, Codable {
    case excellent
    case good
    case fair
    case poor
    case unknown

    var displayName: String {
        switch self {
        case .excellent: return "Excellent"
        case .good: return "Good"
        case .fair: return "Fair"
        case .poor: return "Poor"
        case .unknown: return "Unknown"
        }
    }

    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .orange
        case .poor: return .red
        case .unknown: return .gray
        }
    }
}

enum RiskLevel: String, CaseIterable, Codable {
    case low
    case moderate
    case high
    case critical

    var displayName: String {
        switch self {
        case .low: return "Low Risk"
        case .moderate: return "Moderate Risk"
        case .high: return "High Risk"
        case .critical: return "Critical Risk"
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
}

// MARK: - Gait Assessment Result
struct GaitAssessment {
    let timestamp: Date
    let metrics: GaitMetrics
    let riskScore: FallRiskScore
    let recommendations: [String]
    let detailedAnalysis: DetailedGaitAnalysis
    let environmentalFactors: EnvironmentalFactors?

    init(
        metrics: GaitMetrics, riskScore: FallRiskScore, recommendations: [String] = [], detailedAnalysis: DetailedGaitAnalysis, environmentalFactors: EnvironmentalFactors? = nil
    ) {
        self.timestamp = Date()
        self.metrics = metrics
        self.riskScore = riskScore
        self.recommendations = recommendations
        self.detailedAnalysis = detailedAnalysis
        self.environmentalFactors = environmentalFactors
    }
}

// MARK: - Fall Risk Score
struct FallRiskScore {
    let score: Double // 0-100 scale
    let confidence: Double // 0-1 scale
    let riskLevel: RiskLevel
    let factors: [RiskFactor]

    init(score: Double, confidence: Double, factors: [RiskFactor] = []) {
        self.score = max(0, min(100, score))
        self.confidence = max(0, min(1, confidence))
        self.factors = factors

        // Determine risk level based on score
        switch score {
        case 0..<25:
            self.riskLevel = .low
        case 25..<50:
            self.riskLevel = .moderate
        case 50..<75:
            self.riskLevel = .high
        default:
            self.riskLevel = .critical
        }
    }
}

struct RiskFactor {
    let name: String
    let severity: Double // 0-1 scale
    let description: String
    let category: RiskCategory

    enum RiskCategory: String, CaseIterable {
        case gaitPattern = "Gait Pattern"
        case balance = "Balance"
        case strength = "Strength"
        case cognitive = "Cognitive"
        case environmental = "Environmental"
        case medical = "Medical History"
    }
}

// MARK: - Detailed Gait Analysis
struct DetailedGaitAnalysis {
    let gaitCycle: GaitCycleAnalysis
    let balanceMetrics: BalanceMetrics
    let temporalSpatialParameters: TemporalSpatialParameters
    let asymmetryAnalysis: AsymmetryAnalysis
    let variabilityAnalysis: VariabilityAnalysis
}

struct GaitCycleAnalysis {
    let stancePhasePercentage: Double
    let swingPhasePercentage: Double
    let doubleSupportPercentage: Double
    let singleSupportPercentage: Double
    let cadence: Double // steps per minute
    let strideTime: Double // seconds
    let stepTime: Double // seconds

    var isNormalGaitCycle: Bool {
        // Normal gait cycle: stance ~60%, swing ~40%, double support ~10-12%
        stancePhasePercentage >= 55 && stancePhasePercentage <= 65 &&
               swingPhasePercentage >= 35 && swingPhasePercentage <= 45 &&
               doubleSupportPercentage >= 8 && doubleSupportPercentage <= 15
    }
}

struct BalanceMetrics {
    let mediolateralSway: Double // mm
    let anteroposteriorSway: Double // mm
    let swayVelocity: Double // mm/s
    let postualStability: Double // 0-100 scale
    let dynamicBalance: Double // 0-100 scale

    var overallBalanceScore: Double {
        // Weighted average of balance components
        (postualStability * 0.4) + (dynamicBalance * 0.6)
    }
}

struct TemporalSpatialParameters {
    let stepLength: StepMeasurement
    let strideLength: StepMeasurement
    let stepWidth: Double // cm
    let walkingSpeed: Double // m/s
    let cadence: Double // steps/min
    let stepTime: StepTiming
    let strideTime: Double // seconds

    struct StepMeasurement {
        let left: Double // cm
        let right: Double // cm
        let average: Double // cm

        var asymmetryPercentage: Double {
            guard average > 0 else { return 0 }
            return abs(left - right) / average * 100
        }
    }

    struct StepTiming {
        let left: Double // seconds
        let right: Double // seconds
        let average: Double // seconds

        var asymmetryPercentage: Double {
            guard average > 0 else { return 0 }
            return abs(left - right) / average * 100
        }
    }
}

struct AsymmetryAnalysis {
    let stepLengthAsymmetry: Double // percentage
    let stepTimeAsymmetry: Double // percentage
    let swingTimeAsymmetry: Double // percentage
    let stanceTimeAsymmetry: Double // percentage
    let overallAsymmetryScore: Double // 0-100 scale

    init(
        stepLengthAsymmetry: Double, stepTimeAsymmetry: Double, swingTimeAsymmetry: Double, stanceTimeAsymmetry: Double
    ) {
        self.stepLengthAsymmetry = stepLengthAsymmetry
        self.stepTimeAsymmetry = stepTimeAsymmetry
        self.swingTimeAsymmetry = swingTimeAsymmetry
        self.stanceTimeAsymmetry = stanceTimeAsymmetry

        // Calculate overall asymmetry score (lower is better)
        let asymmetries = [
            stepLengthAsymmetry, stepTimeAsymmetry, swingTimeAsymmetry, stanceTimeAsymmetry
        ]
        let averageAsymmetry = asymmetries.reduce(0, +) / Double(asymmetries.count)
        self.overallAsymmetryScore = max(0, 100 - (averageAsymmetry * 10))
    }

    var isSignificantAsymmetry: Bool {
        // Asymmetry > 3% is generally considered significant
        stepLengthAsymmetry > 3.0 || stepTimeAsymmetry > 3.0
    }
}

struct VariabilityAnalysis {
    let stepTimeVariability: Double // coefficient of variation
    let stepLengthVariability: Double // coefficient of variation
    let walkingSpeedVariability: Double // coefficient of variation
    let strideTimeVariability: Double // coefficient of variation
    let overallVariabilityScore: Double // 0-100 scale

    init(
        stepTimeVariability: Double, stepLengthVariability: Double, walkingSpeedVariability: Double, strideTimeVariability: Double
    ) {
        self.stepTimeVariability = stepTimeVariability
        self.stepLengthVariability = stepLengthVariability
        self.walkingSpeedVariability = walkingSpeedVariability
        self.strideTimeVariability = strideTimeVariability

        // Calculate overall variability score (lower variability = higher score)
        let variabilities = [
            stepTimeVariability, stepLengthVariability, walkingSpeedVariability, strideTimeVariability
        ]
        let averageVariability = variabilities.reduce(0, +) / Double(variabilities.count)
        self.overallVariabilityScore = max(0, 100 - (averageVariability * 100))
    }

    var isExcessiveVariability: Bool {
        // High variability (CV > 0.05) indicates potential issues
        stepTimeVariability > 0.05 || stepLengthVariability > 0.05
    }
}

// MARK: - Environmental Factors
struct EnvironmentalFactors {
    let surface: SurfaceType
    let lighting: LightingCondition
    let obstacles: [Obstacle]
    let weatherConditions: WeatherCondition?
    let noiseLevel: Double? // dB

    enum SurfaceType: String, CaseIterable {
        case indoor
        case outdoor
        case carpet
        case hardwood
        case concrete
        case grass
        case uneven

        var riskMultiplier: Double {
            switch self {
            case .indoor, .hardwood, .concrete: return 1.0
            case .carpet: return 1.1
            case .outdoor, .grass: return 1.2
            case .uneven: return 1.5
            }
        }
    }

    enum LightingCondition: String, CaseIterable {
        case bright
        case normal
        case dim
        case dark

        var riskMultiplier: Double {
            switch self {
            case .bright, .normal: return 1.0
            case .dim: return 1.2
            case .dark: return 1.5
            }
        }
    }

    struct Obstacle {
        let type: ObstacleType
        let distance: Double // meters from user
        let height: Double? // cm

        enum ObstacleType: String, CaseIterable {
            case step
            case curb
            case furniture
            case person
            case pet
            case other
        }
    }

    enum WeatherCondition: String, CaseIterable {
        case clear
        case cloudy
        case rainy
        case snowy
        case windy

        var riskMultiplier: Double {
            switch self {
            case .clear, .cloudy: return 1.0
            case .windy: return 1.1
            case .rainy: return 1.3
            case .snowy: return 1.5
            }
        }
    }
}

// MARK: - Gait Data Transmission Models
struct GaitDataPayload: Codable {
    let deviceId: String
    let userId: String
    let timestamp: Date
    let sessionId: String
    let gaitMetrics: CodableGaitMetrics
    let assessment: CodableGaitAssessment?
    let rawSensorData: [SensorReading]?
    let meta: [String: String]?

    init(
        deviceId: String, userId: String, sessionId: String, gaitMetrics: GaitMetrics, assessment: GaitAssessment? = nil, rawSensorData: [SensorReading]? = nil, meta: [String: String]? = nil
    ) {
        self.deviceId = deviceId
        self.userId = userId
        self.timestamp = Date()
        self.sessionId = sessionId
        self.gaitMetrics = CodableGaitMetrics(from: gaitMetrics)
        self.assessment = assessment.map(CodableGaitAssessment.init)
        self.rawSensorData = rawSensorData
        self.meta = meta
    }
}

// Codable versions of the main structs
struct CodableGaitMetrics: Codable {
    let averageWalkingSpeed: Double?
    let averageStepLength: Double?
    let walkingAsymmetry: Double?
    let doubleSupportTime: Double?
    let stanceTime: Double?
    let swingTime: Double?
    let stepFrequency: Double?
    let strideLength: Double?
    let walkingSpeedVariability: Double?
    let stepLengthVariability: Double?
    let averageToeClearance: Double?
    let strideTimeVariability: Double? // coefficient of variation of stride time
    let harmonicRatio: Double? // stability smoothness proxy
    let mediolateralSwayProxy: Double? // normalized sway
    let nearTripEvents: Int? // count within session window
    let mobilityStatus: String
    let riskLevel: String?

    init(from metrics: GaitMetrics) {
        self.averageWalkingSpeed = metrics.averageWalkingSpeed
        self.averageStepLength = metrics.averageStepLength
        self.walkingAsymmetry = metrics.walkingAsymmetry
        self.doubleSupportTime = metrics.doubleSupportTime
        self.stanceTime = metrics.stanceTime
        self.swingTime = metrics.swingTime
        self.stepFrequency = metrics.stepFrequency
        self.strideLength = metrics.strideLength
        self.walkingSpeedVariability = metrics.walkingSpeedVariability
        self.stepLengthVariability = metrics.stepLengthVariability
        self.averageToeClearance = metrics.averageToeClearance
        self.strideTimeVariability = metrics.strideTimeVariability
        self.harmonicRatio = metrics.harmonicRatio
        self.mediolateralSwayProxy = metrics.mediolateralSwayProxy
        self.nearTripEvents = metrics.nearTripEvents
        self.mobilityStatus = metrics.mobilityStatus.rawValue
        self.riskLevel = metrics.riskLevel?.rawValue
    }
}

struct CodableGaitAssessment: Codable {
    let timestamp: Date
    let riskScore: Double
    let riskLevel: String
    let confidence: Double
    let recommendations: [String]

    init(from assessment: GaitAssessment) {
        self.timestamp = assessment.timestamp
        self.riskScore = assessment.riskScore.score
        self.riskLevel = assessment.riskScore.riskLevel.rawValue
        self.confidence = assessment.riskScore.confidence
        self.recommendations = assessment.recommendations
    }
}

struct SensorReading: Codable {
    let timestamp: Date
    let sensorType: SensorType
    let x: Double
    let y: Double
    let zValue: Double
    let accuracy: Double?

    enum SensorType: String, Codable, CaseIterable {
        case accelerometer
        case gyroscope
        case magnetometer
        case barometer
        case gps
    }
}

// MARK: - Historical Gait Data
struct HistoricalGaitData {
    let userId: String
    let dateRange: DateInterval
    let dailyMetrics: [DailyGaitMetrics]
    let trends: GaitTrends
    let alerts: [GaitAlert]

    struct DailyGaitMetrics {
        let date: Date
        let totalSteps: Int
        let totalDistance: Double // meters
        let averageSpeed: Double // m/s
        let activeMinutes: Double
        let gaitSessions: [GaitSession]
        let riskScore: Double
    }

    struct GaitSession {
        let startTime: Date
        let duration: TimeInterval
        let metrics: GaitMetrics
        let location: String?
    }

    struct GaitTrends {
        let speedTrend: TrendDirection
        let asymmetryTrend: TrendDirection
        let variabilityTrend: TrendDirection
        let riskTrend: TrendDirection
        let weeklyChange: Double // percentage
        let monthlyChange: Double // percentage

        enum TrendDirection: String, CaseIterable {
            case improving
            case stable
            case declining

            var color: Color {
                switch self {
                case .improving: return .green
                case .stable: return .blue
                case .declining: return .red
                }
            }
        }
    }

    struct GaitAlert {
        let id: UUID
        let timestamp: Date
        let type: AlertType
        let severity: AlertSeverity
        let message: String
        let acknowledged: Bool

        enum AlertType: String, CaseIterable {
            case fallRiskIncrease = "fall_risk_increase"
            case asymmetryDetected = "asymmetry_detected"
            case speedDecrease = "speed_decrease"
            case variabilityIncrease = "variability_increase"
            case missedSession = "missed_session"
        }

        enum AlertSeverity: String, CaseIterable {
            case low
            case medium
            case high
            case critical

            var color: Color {
                switch self {
                case .low: return .green
                case .medium: return .yellow
                case .high: return .orange
                case .critical: return .red
                }
            }
        }
    }
}
