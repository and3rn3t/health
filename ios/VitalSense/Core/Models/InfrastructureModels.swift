import Foundation

// MARK: - WebSocket Infrastructure

protocol HeartbeatScheduling {
    func scheduleHeartbeat(interval: TimeInterval)
    func cancelHeartbeat()
}

final class DefaultHeartbeatScheduler: HeartbeatScheduling {
    private var timer: Timer?

    func scheduleHeartbeat(interval: TimeInterval) {
        cancelHeartbeat()
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in
            // WebSocketManager drives actual heartbeat transmissions.
        }
    }

    func cancelHeartbeat() {
        timer?.invalidate()
        timer = nil
    }
}

struct WebSocketFeatureFlags {
    var enableEnhancedLiDAR: Bool = true
    var enableRealtimeGaitStreaming: Bool = true
    var enableFallRiskStreaming: Bool = true
    var enableWidgetPushUpdates: Bool = true

    static let `default` = WebSocketFeatureFlags()
}

// MARK: - Watch / Connectivity

struct WatchDataBatch: Codable {
    let sessionId: String
    let timestamp: Date
    let samples: [SensorReading]?
    let metadata: [String: String]?

    init(sessionId: String,
         timestamp: Date = Date(),
         samples: [SensorReading]? = nil,
         metadata: [String: String]? = nil) {
        self.sessionId = sessionId
        self.timestamp = timestamp
        self.samples = samples
        self.metadata = metadata
    }
}

/// Canonical in-app emergency alert model used across gait, emergency response,
/// and caregiver UI. This is distinct from the wire-level EmergencyAlertMessage
/// defined in `Core/Messages/MessageTypes.swift`, which represents the server
/// payload. Conversion between the two should be handled in a single place.
public struct EmergencyAlert: Identifiable, Codable {
    public enum EmergencyType: String, Codable {
        case fallRiskDetected
        case fallDetected
        case medicalEmergency
    }

    public enum EmergencySeverity: String, Codable {
        case low, medium, high, critical
    }

    public let id: UUID
    public let type: EmergencyType
    public let severity: EmergencySeverity
    public let message: String
    public let timestamp: Date
    public var isAcknowledged: Bool

    public init(
        id: UUID = UUID(),
        type: EmergencyType,
        severity: EmergencySeverity,
        message: String,
        timestamp: Date = Date(),
        isAcknowledged: Bool = false
    ) {
        self.id = id
        self.type = type
        self.severity = severity
        self.message = message
        self.timestamp = timestamp
        self.isAcknowledged = isAcknowledged
    }
}

// ...keep existing types below...
