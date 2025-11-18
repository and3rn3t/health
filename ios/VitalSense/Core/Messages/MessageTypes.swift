import Foundation

// Canonical WebSocket message envelope types used across WebSocketManager,
// EnhancedLiDARMLManager, and other components.

public struct ConnectionEstablished: Codable {
    public let connectionId: String?
    public let timestamp: String?
    public let server: String?
}

public struct LiveHealthUpdate: Codable {
    public let metric: String?
    public let value: Double?
    public let unit: String?
    public let timestamp: String?
    public let userId: String?
    public let deviceId: String?
    public let extra: [String: String]?
}

public struct HistoricalDataUpdate: Codable {
    public let data: [LiveHealthUpdate]?
    public let nextCursor: String?
    public let hasMore: Bool?
}

public struct EmergencyAlertMessage: Codable {
    public enum Level: String, Codable { case info, warning, critical }
    public let level: Level?
    public let message: String?
    public let timestamp: String?
    public let userId: String?
    public let deviceId: String?
    public let details: [String: String]?
}

// Note: Any previous duplicate definitions of these types in
// EnhancedLiDARMLManager.swift have been removed in favor of this file.
