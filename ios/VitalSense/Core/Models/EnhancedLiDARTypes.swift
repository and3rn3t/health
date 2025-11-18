import Foundation

// Shared model types used by EnhancedLiDARMLManager and related components.

public struct LiDARPointCloud: Codable {
    public let timestamp: Date
    // Simplified representation; individual implementations can extend this later.
    public let pointCount: Int

    public init(timestamp: Date = Date(), pointCount: Int = 0) {
        self.timestamp = timestamp
        self.pointCount = pointCount
    }
}

public struct MotionMetrics: Codable {
    public let stepCount: Int?
    public let walkingSpeed: Double?
    public let cadence: Double?

    public init(stepCount: Int? = nil, walkingSpeed: Double? = nil, cadence: Double? = nil) {
        self.stepCount = stepCount
        self.walkingSpeed = walkingSpeed
        self.cadence = cadence
    }
}

public struct SharedHealthMetrics: Codable {
    public let gaitMetrics: GaitMetrics

    public init(gaitMetrics: GaitMetrics) {
        self.gaitMetrics = gaitMetrics
    }
}

public struct SharedEnvironmentalContext: Codable {
    public let indoors: Bool?
    public let stairsPresent: Bool?

    public init(indoors: Bool? = nil, stairsPresent: Bool? = nil) {
        self.indoors = indoors
        self.stairsPresent = stairsPresent
    }
}

public struct PerformanceMetrics: Codable {
    public var lastInferenceDurationMs: Double?
    public var averageInferenceDurationMs: Double?

    public init(lastInferenceDurationMs: Double? = nil, averageInferenceDurationMs: Double? = nil) {
        self.lastInferenceDurationMs = lastInferenceDurationMs
        self.averageInferenceDurationMs = averageInferenceDurationMs
    }
}

public struct LiDARUserProfile: Codable {
    public let id: UUID
    public let age: Int?
    public let height: Double?
    public let weight: Double?

    public init(id: UUID = UUID(), age: Int? = nil, height: Double? = nil, weight: Double? = nil) {
        self.id = id
        self.age = age
        self.height = height
        self.weight = weight
    }
}

// Sensor fusion configuration used by WebSocketManager+EnhancedIntegration and LiDAR ML manager.
public struct SensorFusionConfiguration: Codable {
    public var enableLiDAR: Bool
    public var enableIMU: Bool
    public var enableHealthKit: Bool

    public init(enableLiDAR: Bool = true, enableIMU: Bool = true, enableHealthKit: Bool = true) {
        self.enableLiDAR = enableLiDAR
        self.enableIMU = enableIMU
        self.enableHealthKit = enableHealthKit
    }
}

public struct SensorFusionResult: Codable {
    public let timestamp: Date
    public let stabilityIndex: Double
    public let fallRiskScore: Double
    public let confidence: Double

    public init(timestamp: Date = Date(), stabilityIndex: Double, fallRiskScore: Double, confidence: Double) {
        self.timestamp = timestamp
        self.stabilityIndex = stabilityIndex
        self.fallRiskScore = fallRiskScore
        self.confidence = confidence
    }
}

// These are processing helpers referenced by EnhancedLiDARMLManager; we define simple protocols so
// concrete implementations can live elsewhere, but compilation doesn't fail.

public protocol MultiModalSensorProcessor {
    func process(
        lidar: LiDARPointCloud,
        motion: MotionMetrics,
        health: SharedHealthMetrics,
        environment: SharedEnvironmentalContext
    ) throws -> SensorFusionResult
}

public protocol KalmanFilterProcessor {
    func smooth(_ fusionResult: SensorFusionResult) throws -> SensorFusionResult
}
