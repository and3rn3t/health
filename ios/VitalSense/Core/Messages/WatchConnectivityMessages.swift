import Foundation
import SwiftUI

// MARK: - Shared Watch ↔︎ iPhone Connectivity Models
// These models are kept deliberately small and Codable to allow simple JSON bridging
// via WatchConnectivity sendMessage / updateApplicationContext. They avoid references
// to large app types so both targets (iOS + watchOS) can include them safely.

public enum WatchMessageType: String, Codable, CaseIterable {
    // Requests
    case requestLiveStatus          // Watch → iPhone: ask for the latest live status snapshot
    case startMonitoring            // Watch → iPhone: start gait / fall risk monitoring
    case stopMonitoring             // Watch → iPhone: stop monitoring
    case triggerFallRiskAssessment  // Watch → iPhone: run comprehensive fall risk assessment
    case performBalanceTest         // Watch → iPhone: start quick balance test (single‑leg / dynamic)
    case acknowledgeAlert           // Watch → iPhone: user acknowledged an alert
    case sendQuickEvent             // Watch → iPhone: lightweight event (e.g., stumble, near_fall)

    // Responses / Streams
    case liveStatusUpdate           // iPhone → Watch: periodic live update snapshot
    case fallRiskSummary            // iPhone → Watch: summary of latest fall risk assessment
    case balanceTestProgress        // iPhone → Watch: progress / partial metrics
    case balanceTestResult          // iPhone → Watch: final result
    case alert                      // iPhone → Watch: push an important alert
}

// Envelope for all messages.
public struct WatchMessageEnvelope<P: Codable>: Codable {
    public let id: UUID
    public let type: WatchMessageType
    public let timestamp: Date
    public let payload: P

    public init(id: UUID = UUID(), type: WatchMessageType, timestamp: Date = Date(), payload: P) {
        self.id = id
        self.type = type
        self.timestamp = timestamp
        self.payload = payload
    }
}

// MARK: - Payloads
public struct LiveStatusPayload: Codable {
    public let isMonitoring: Bool
    public let walkingSpeed: Double? // m/s
    public let stepFrequency: Double? // steps/min
    public let asymmetry: Double? // 0-1
    public let variability: Double? // 0-1
    public let fallRiskLevel: String? // low / medium / high / unknown
    public let connectionStatus: String
    public let lastAssessmentMinutesAgo: Int?
}

public struct FallRiskSummaryPayload: Codable {
    public let riskLevel: String
    public let score: Double?
    public let highSeverityFactors: [String]
    public let mediumSeverityFactors: [String]
    public let recommendations: [String]
}

public struct BalanceTestCommandPayload: Codable {
    public enum TestKind: String, Codable { case singleLeg, eyesClosed, dynamic, tandem }
    public let kind: TestKind
}

public struct BalanceTestProgressPayload: Codable {
    public let percent: Double // 0-100
    public let instantaneousStability: Double?
    public let elapsedSeconds: Double
    public let testKind: String?
}

public struct BalanceTestResultPayload: Codable {
    public let overallScore: Double
    public let componentScores: [String: Double]
    public let testKind: String?
}

public struct QuickEventPayload: Codable {
    public enum EventKind: String, Codable { case stumble, nearFall = "near_fall", manualFall = "manual_fall" }
    public let kind: EventKind
    public let note: String?
}

public struct AlertPayload: Codable {
    public enum AlertKind: String, Codable { case fallRiskHigh = "fall_risk_high", instabilityDetected = "instability_detected", emergency }
    public let kind: AlertKind
    public let message: String
    public let severity: String // low / medium / high / critical
    public let alertId: String?
    public let acknowledged: Bool?
}

// MARK: - Generic helper for encoding/decoding erased envelopes
public enum WatchMessageCodec {
    private static let jsonEncoder: JSONEncoder = { let e = JSONEncoder(); e.dateEncodingStrategy = .iso8601; return e }()
    private static let jsonDecoder: JSONDecoder = { let d = JSONDecoder(); d.dateDecodingStrategy = .iso8601; return d }()

    public static func encode<P: Codable>(_ envelope: WatchMessageEnvelope<P>) throws -> Data { try jsonEncoder.encode(envelope) }

    // Decodes to a generic dictionary so caller can switch on type then re-decode payload.
    public static func decodeType(from data: Data) -> WatchMessageType? {
        (try? jsonDecoder.decode(PartialEnvelope.self, from: data))?.type
    }

    public static func decodePayload<P: Codable>(_ data: Data, as: P.Type) -> WatchMessageEnvelope<P>? {
        try? jsonDecoder.decode(WatchMessageEnvelope<P>.self, from: data)
    }

    private struct PartialEnvelope: Codable { let type: WatchMessageType }
}
