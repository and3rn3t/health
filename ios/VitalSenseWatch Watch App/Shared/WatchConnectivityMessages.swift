import Foundation

#if os(watchOS)
// Duplicate of iOS message models for now; consolidate later into a shared target folder.
public enum WatchMessageType: String, Codable, CaseIterable {
    case requestLiveStatus, startMonitoring, stopMonitoring, triggerFallRiskAssessment, performBalanceTest, acknowledgeAlert, sendQuickEvent
    case liveStatusUpdate, fallRiskSummary, balanceTestProgress, balanceTestResult, alert
}

public struct WatchMessageEnvelope<P: Codable>: Codable {
    public let id: UUID
    public let type: WatchMessageType
    public let timestamp: Date
    public let payload: P
    public init(id: UUID = UUID(), type: WatchMessageType, timestamp: Date = Date(), payload: P) { self.id = id; self.type = type; self.timestamp = timestamp; self.payload = payload }
}

public struct LiveStatusPayload: Codable { public let isMonitoring: Bool; public let walkingSpeed: Double?; public let stepFrequency: Double?; public let asymmetry: Double?; public let variability: Double?; public let fallRiskLevel: String?; public let connectionStatus: String; public let lastAssessmentMinutesAgo: Int? }
public struct FallRiskSummaryPayload: Codable { public let riskLevel: String; public let score: Double?; public let highSeverityFactors: [String]; public let mediumSeverityFactors: [String]; public let recommendations: [String] }
public struct AlertPayload: Codable { public enum AlertKind: String, Codable { case fallRiskHigh = "fall_risk_high", instabilityDetected = "instability_detected", emergency }; public let kind: AlertKind; public let message: String; public let severity: String }
public struct QuickEventPayload: Codable { public let data: [String: String] }
public struct HealthDataPayload: Codable { public let healthData: [String] }
public struct HeartRatePayload: Codable { public let heartRate: Double }
public struct BalanceTestProgressPayload: Codable { public let progress: Double; public let status: String }
public struct BalanceTestResultPayload: Codable { public let result: Double; public let grade: String; public let details: String }

public enum WatchMessageCodec { private static let e: JSONEncoder = { let e = JSONEncoder(); e.dateEncodingStrategy = .iso8601; return e }(); private static let d: JSONDecoder = { let d = JSONDecoder(); d.dateDecodingStrategy = .iso8601; return d }(); public static func encode<P: Codable>(_ env: WatchMessageEnvelope<P>) throws -> Data { try e.encode(env) }; public static func decodeType(from data: Data) -> WatchMessageType? { (try? d.decode(Partial.self, from: data))?.type }; public static func decodePayload<P: Codable>(_ data: Data, as: P.Type) -> WatchMessageEnvelope<P>? { try? d.decode(WatchMessageEnvelope<P>.self, from: data) }; private struct Partial: Codable { let type: WatchMessageType } }
#endif
