import Foundation

// MARK: - Message Types from WS server

public struct ConnectionEstablished: Codable {
    public let connectionId: String?
    public let timestamp: String?
    public let server: String?

    public var isValid: Bool { connectionId != nil }
}

public struct LiveHealthUpdate: Codable {
    public let metric: String?
    public let value: Double?
    public let unit: String?
    public let timestamp: String?
    public let userId: String?
    public let deviceId: String?
    public let extra: [String: String]?

    public var isValid: Bool { metric != nil && value != nil }
}

public struct HistoricalDataUpdate: Codable {
    public let data: [LiveHealthUpdate]?
    public let nextCursor: String?
    public let hasMore: Bool?
}

public struct EmergencyAlert: Codable {
    public enum Level: String, Codable { case info, warning, critical }
    public let level: Level?
    public let message: String?
    public let timestamp: String?
    public let userId: String?
    public let deviceId: String?
    public let details: [String: String]?

    public var isValid: Bool { level != nil && message?.isEmpty == false }
}
