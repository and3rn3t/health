//
//  WebSocketBridge.swift
//  Andernet Posture
//
//  Connects the iOS app to the VitalSense Cloudflare Workers WebSocket
//  for real-time session data sync to the web dashboard.
//

import Foundation
import os.log

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
    private var session: URLSession?
    private var pingTimer: Timer?
    private var reconnectTask: Task<Void, Never>?

    /// Maximum reconnect attempts before giving up.
    private static let maxReconnectAttempts = 10

    /// Base URL for the WebSocket endpoint (configured via AppConfig or environment).
    private let baseURL: String

    private let logger = AppLogger.cloudSync
    private let encoder = JSONEncoder()

    init(baseURL: String? = nil) {
        // Default to production endpoint; override in debug builds
        self.baseURL = baseURL ?? {
            #if DEBUG
            return "wss://health-app.andernet.dev/ws"
            #else
            return "wss://health-app.andernet.dev/ws"
            #endif
        }()
        super.init()
        encoder.dateEncodingStrategy = .iso8601
    }

    // MARK: - Lifecycle

    func connect(deviceToken: String? = nil) {
        guard case .disconnected = connectionState else { return }

        connectionState = .connecting
        logger.info("WebSocket connecting to \(self.baseURL)")

        var urlString = baseURL
        if let token = deviceToken {
            urlString += "?token=\(token)"
        }

        guard let url = URL(string: urlString) else {
            logger.error("Invalid WebSocket URL: \(urlString)")
            connectionState = .disconnected
            return
        }

        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        session = URLSession(configuration: config, delegate: self, delegateQueue: nil)

        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        startReceiving()
    }

    func disconnect() {
        reconnectTask?.cancel()
        reconnectTask = nil
        pingTimer?.invalidate()
        pingTimer = nil
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
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
        guard case .connected = connectionState else { return }

        let message = WSMessage(
            type: type,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            data: data
        )

        do {
            let jsonData = try encoder.encode(message)
            guard let jsonString = String(data: jsonData, encoding: .utf8) else { return }
            webSocket?.send(.string(jsonString)) { [weak self] error in
                if let error {
                    self?.logger.error("WebSocket send failed: \(error.localizedDescription)")
                }
            }
        } catch {
            logger.error("WebSocket encode failed: \(error.localizedDescription)")
        }
    }

    private func startReceiving() {
        webSocket?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                self.handleMessage(message)
                self.startReceiving() // Continue listening
            case .failure(let error):
                self.logger.error("WebSocket receive error: \(error.localizedDescription)")
                Task { @MainActor in
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
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.webSocket?.sendPing { error in
                if let error {
                    self?.logger.warning("Ping failed: \(error.localizedDescription)")
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
                guard let self else { return }
                self.connectionState = .disconnected
                self.connect()
            }
        }
    }
}

// MARK: - URLSessionWebSocketDelegate

extension WebSocketBridge: URLSessionWebSocketDelegate {
    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        Task { @MainActor in
            connectionState = .connected
            logger.info("WebSocket connected")
            startPingTimer()
        }
    }

    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        Task { @MainActor in
            logger.info("WebSocket closed: \(closeCode.rawValue)")
            handleDisconnect()
        }
    }
}
