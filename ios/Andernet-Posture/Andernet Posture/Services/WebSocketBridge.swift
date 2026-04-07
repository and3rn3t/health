//
//  WebSocketBridge.swift
//  Andernet Posture
//
//  Connects the iOS app to the VitalSense Cloudflare Workers WebSocket
//  for real-time session data sync to the web dashboard.
//

import Foundation
import os.log
import SwiftData

// MARK: - WebSocket Message Types

/// Outbound message envelope matching the Workers WebSocket protocol.
struct WSMessage: Encodable {
    let type: String
    let timestamp: String
    let data: WSMessageData
}

/// Union of possible message payloads sent to the server.
enum WSMessageData: Encodable {
    case sessionSummary(SessionSummaryPayload)
    case liveMetrics(LiveMetricsPayload)
    case ping

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .sessionSummary(let payload): try container.encode(payload)
        case .liveMetrics(let payload):    try container.encode(payload)
        case .ping:                        try container.encode([String: String]())
        }
    }
}

struct SessionSummaryPayload: Encodable {
    let sessionId: String
    let duration: Double
    let postureScore: Double?
    let cadenceSPM: Double?
    let walkingSpeedMPS: Double?
    let strideLengthM: Double?
    let fallRiskScore: Double?
    let fallRiskLevel: String?
    let totalSteps: Int?
    let totalDistanceM: Double?
}

struct LiveMetricsPayload: Encodable {
    let postureScore: Double
    let cadenceSPM: Double
    let walkingSpeedMPS: Double
    let fallRiskLevel: String?
}

// MARK: - Connection State

enum WSConnectionState: Sendable {
    case disconnected
    case connecting
    case connected
    case reconnecting(attempt: Int)
}

// MARK: - WebSocketBridge

@Observable
@MainActor
final class WebSocketBridge: NSObject {

    private(set) var connectionState: WSConnectionState = .disconnected

    private var webSocket: URLSessionWebSocketTask?
    private var urlSessionInstance: URLSession?
    private var pingTimer: Timer?
    private var reconnectTask: Task<Void, Never>?

    /// Maximum reconnect attempts before giving up.
    private static let maxReconnectAttempts = AppConfig.WebSocket.maxReconnectAttempts

    /// Maximum number of messages to hold in the offline queue.
    private static let maxQueueSize = AppConfig.WebSocket.maxMessageQueueSize

    /// Minimum interval between queued message sends (backpressure).
    private static let queueDrainInterval: TimeInterval = AppConfig.WebSocket.queueDrainInterval

    /// Offline message queue — messages are buffered when disconnected and replayed on reconnect.
    private var messageQueue: [String] = []

    /// Base URL for the WebSocket endpoint (configured via AppConfig or environment).
    private let baseURL: String

    /// Tracks whether `disconnect()` has been called to prevent reconnect after teardown.
    private var isShutDown = false

    private let logger = AppLogger.webSocket
    private let encoder = JSONEncoder()
    private let iso8601Formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.timeZone = TimeZone(secondsFromGMT: 0)
        return f
    }()

    init(baseURL: String? = nil) {
        self.baseURL = baseURL ?? AppConfig.WebSocket.url
        super.init()
        encoder.dateEncodingStrategy = .iso8601
    }

    deinit {
        MainActor.assumeIsolated {
            reconnectTask?.cancel()
            pingTimer?.invalidate()
            webSocket?.cancel(with: .normalClosure, reason: nil)
            urlSessionInstance?.invalidateAndCancel()
        }
    }

    // MARK: - Lifecycle

    func connect(deviceToken: String? = nil) {
        guard case .disconnected = connectionState else { return }
        isShutDown = false

        connectionState = .connecting
        logger.info("WebSocket connecting to \(self.baseURL)")

        guard let url = URL(string: baseURL) else {
            logger.error("Invalid WebSocket URL: \(self.baseURL)")
            connectionState = .disconnected
            return
        }

        var request = URLRequest(url: url)
        if let token = deviceToken, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        // Invalidate any prior session to avoid delegate retention.
        urlSessionInstance?.invalidateAndCancel()
        urlSessionInstance = URLSession(configuration: config, delegate: self, delegateQueue: nil)

        webSocket = urlSessionInstance?.webSocketTask(with: request)
        webSocket?.resume()
        startReceiving()
    }

    func disconnect() {
        isShutDown = true
        reconnectTask?.cancel()
        reconnectTask = nil
        pingTimer?.invalidate()
        pingTimer = nil
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        urlSessionInstance?.invalidateAndCancel()
        urlSessionInstance = nil
        messageQueue.removeAll()
        connectionState = .disconnected
        logger.info("WebSocket disconnected")
    }

    // MARK: - Send

    /// Send a completed session summary to the web dashboard.
    func sendSessionSummary(_ session: GaitSession) {
        let payload = SessionSummaryPayload(
            sessionId: session.persistentModelID.hashValue.description,
            duration: session.duration,
            postureScore: session.postureScore,
            cadenceSPM: session.averageCadenceSPM,
            walkingSpeedMPS: session.averageWalkingSpeedMPS,
            strideLengthM: session.averageStrideLengthM,
            fallRiskScore: session.fallRiskScore,
            fallRiskLevel: session.fallRiskLevel,
            totalSteps: session.totalSteps,
            totalDistanceM: session.totalDistanceM
        )
        send(type: "session_summary", data: .sessionSummary(payload))
    }

    /// Send live metrics during an active capture session.
    func sendLiveMetrics(
        postureScore: Double,
        cadenceSPM: Double,
        walkingSpeedMPS: Double,
        fallRiskLevel: String?
    ) {
        let payload = LiveMetricsPayload(
            postureScore: postureScore,
            cadenceSPM: cadenceSPM,
            walkingSpeedMPS: walkingSpeedMPS,
            fallRiskLevel: fallRiskLevel
        )
        send(type: "live_health_update", data: .liveMetrics(payload))
    }

    // MARK: - Private

    private func send(type: String, data: WSMessageData) {
        let message = WSMessage(
            type: type,
            timestamp: iso8601Formatter.string(from: .now),
            data: data
        )

        do {
            let jsonData = try encoder.encode(message)
            guard let jsonString = String(data: jsonData, encoding: .utf8) else { return }

            guard case .connected = connectionState else {
                enqueue(jsonString)
                return
            }

            webSocket?.send(.string(jsonString)) { error in
                if let error {
                    Task { @MainActor in
                        AppLogger.webSocket.error("WebSocket send failed: \(error.localizedDescription)")
                    }
                }
            }
        } catch {
            logger.error("WebSocket encode failed: \(error.localizedDescription)")
        }
    }

    private func enqueue(_ jsonString: String) {
        if messageQueue.count >= Self.maxQueueSize {
            messageQueue.removeFirst()
            logger.debug("Offline queue full — dropped oldest message")
        }
        messageQueue.append(jsonString)
        logger.debug("Message queued (count: \(self.messageQueue.count))")
    }

    private func flushQueue() {
        guard !messageQueue.isEmpty else { return }
        let pending = messageQueue
        messageQueue.removeAll()
        logger.info("Flushing \(pending.count) queued messages")

        Task { @MainActor [weak self] in
            for jsonString in pending {
                guard let self, case .connected = self.connectionState else { break }
                self.webSocket?.send(.string(jsonString)) { error in
                    if let error {
                        Task { @MainActor in
                            AppLogger.webSocket.error("Queue flush send failed: \(error.localizedDescription)")
                        }
                    }
                }
                try? await Task.sleep(for: .seconds(Self.queueDrainInterval))
            }
        }
    }

    private func startReceiving() {
        webSocket?.receive { [weak self] result in
            Task { @MainActor [weak self] in
                guard let self else { return }
                switch result {
                case .success(let message):
                    self.handleMessage(message)
                    self.startReceiving()
                case .failure(let error):
                    self.logger.error("WebSocket receive error: \(error.localizedDescription)")
                    self.handleDisconnect()
                }
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            guard let data = text.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else { return }

            switch type {
            case "connection_established":
                logger.info("WebSocket connection confirmed by server")
            case "pong":
                break // Heartbeat response
            case "error":
                let msg = json["message"] as? String ?? "Unknown"
                logger.warning("Server error: \(msg)")
            default:
                logger.debug("Received message type: \(type)")
            }
        case .data:
            break // Binary messages not expected
        @unknown default:
            break
        }
    }

    private func startPingTimer() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: AppConfig.WebSocket.pingInterval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.webSocket?.sendPing { error in
                    if let error {
                        Task { @MainActor in
                            AppLogger.webSocket.warning("Ping failed: \(error.localizedDescription)")
                        }
                    }
                }
            }
        }
    }

    private func handleDisconnect() {
        pingTimer?.invalidate()
        pingTimer = nil
        webSocket = nil

        guard case .connected = connectionState else {
            // Already reconnecting or intentionally disconnected
            if case .reconnecting = connectionState { return }
            return
        }

        scheduleReconnect(attempt: 1)
    }

    private func scheduleReconnect(attempt: Int) {
        guard !isShutDown else { return }
        guard attempt <= Self.maxReconnectAttempts else {
            logger.warning("WebSocket max reconnect attempts reached")
            connectionState = .disconnected
            return
        }

        connectionState = .reconnecting(attempt: attempt)

        // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at 60s
        let delay = min(pow(2.0, Double(attempt - 1)), 60.0)
        logger.info("WebSocket reconnecting in \(delay, format: .fixed(precision: 0))s (attempt \(attempt))")

        reconnectTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(delay))
            guard !Task.isCancelled else { return }
            await MainActor.run {
                guard let self, !self.isShutDown else { return }
                self.connectionState = .disconnected
                self.connect()
            }
        }
    }
}

// MARK: - URLSessionWebSocketDelegate

extension WebSocketBridge: URLSessionWebSocketDelegate {
    nonisolated func urlSession(
        _: URLSession,
        webSocketTask _: URLSessionWebSocketTask,
        didOpenWithProtocol _: String?
    ) {
        Task { @MainActor in
            connectionState = .connected
            logger.info("WebSocket connected")
            startPingTimer()
            flushQueue()
        }
    }

    nonisolated func urlSession(
        _: URLSession,
        webSocketTask _: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason _: Data?
    ) {
        Task { @MainActor in
            logger.info("WebSocket closed: \(closeCode.rawValue)")
            handleDisconnect()
        }
    }
}
