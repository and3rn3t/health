import Foundation

// MARK: - WebSocket Events
public enum WebSocketEvent: String, CaseIterable, Hashable, Codable {
    case connectionOpen = "connection_open"
    case connectionClose = "connection_close"
    case reconnectAttempt = "reconnect_attempt"
    case reconnectSuccess = "reconnect_success"
    case reconnectGiveUp = "reconnect_give_up"
    case heartbeatPing = "heartbeat_ping"
    case heartbeatMiss = "heartbeat_miss"
    case heartbeatRecover = "heartbeat_recover"
    case bufferEnqueue = "buffer_enqueue"
    case bufferDrop = "buffer_drop"
    case messageReceive = "message_receive"
    case messageDecodeFail = "message_decode_fail"
}

// MARK: - Metrics Recorder (Actor for thread-safety)
public actor WebSocketMetrics {
    public static let shared = WebSocketMetrics()

    public struct Snapshot: Sendable {
        public let counters: [WebSocketEvent: Int]
        public let lastTimestamps: [WebSocketEvent: Date]
        public let createdAt: Date = Date()
    }

    private var counters: [WebSocketEvent: Int] = [:]
    private var lastTimestamps: [WebSocketEvent: Date] = [:]

    // Per-event record
    public func record(_ event: WebSocketEvent, count: Int = 1) {
        if count <= 0 { return }
        counters[event, default: 0] += count
        lastTimestamps[event] = Date()
    }

    public func snapshot() -> Snapshot {
        Snapshot(counters: counters, lastTimestamps: lastTimestamps)
    }

    // Reset (TEST / DEBUG use)
    public func reset() {
        counters.removeAll()
        lastTimestamps.removeAll()
    }
}

// Convenience non-async fire-and-forget API
public extension WebSocketMetrics {
    static func record(_ event: WebSocketEvent, count: Int = 1) {
        Task { await WebSocketMetrics.shared.record(event, count: count) }
    }
}

// MARK: - Simple Rate Limiter (MainActor-safe usage)
final class RateLimiter {
    private let limit: Int
    private let interval: TimeInterval
    private var count: Int = 0
    private var windowStart: Date = Date()

    init(limit: Int, interval: TimeInterval) {
        self.limit = limit
        self.interval = interval
    }

    func shouldAllow() -> Bool {
        let now = Date()
        if now.timeIntervalSince(windowStart) > interval {
            windowStart = now
            count = 0
        }
        if count < limit {
            count += 1
            return true
        }
        return false
    }
}
