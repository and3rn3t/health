import Foundation

// Core payloads for streaming gait data over WebSocket and to the watch.

public struct GaitDataPayload: Codable {
    public let sessionId: UUID
    public let timestamp: Date
    public let gaitMetrics: GaitMetrics
    public let riskLevel: RiskLevel?

    // Optional raw sensor/frame data for advanced analytics; kept simple for now.
    public let sensorSamples: [SensorReading]?

    public init(
        sessionId: UUID,
        timestamp: Date = Date(),
        gaitMetrics: GaitMetrics,
        riskLevel: RiskLevel? = nil,
        sensorSamples: [SensorReading]? = nil
    ) {
        self.sessionId = sessionId
        self.timestamp = timestamp
        self.gaitMetrics = gaitMetrics
        self.riskLevel = riskLevel
        self.sensorSamples = sensorSamples
    }
}

/// Lightweight, watch-friendly streaming payload used by iPhoneWatch connectivity.
public struct RealtimeGaitDataPayload: Codable {
    public let timestamp: Date
    public let walkingSpeed: Double?
    public let cadence: Double?
    public let stepLength: Double?
    public let stabilityIndex: Double?
    public let fallRiskScore: Double?

    public init(
        timestamp: Date = Date(),
        walkingSpeed: Double? = nil,
        cadence: Double? = nil,
        stepLength: Double? = nil,
        stabilityIndex: Double? = nil,
        fallRiskScore: Double? = nil
    ) {
        self.timestamp = timestamp
        self.walkingSpeed = walkingSpeed
        self.cadence = cadence
        self.stepLength = stepLength
        self.stabilityIndex = stabilityIndex
        self.fallRiskScore = fallRiskScore
    }
}
