import Foundation
import Network
import Combine

// MARK: - WebSocket Manager
@MainActor
final class WebSocketManager: ObservableObject {
    static let shared = WebSocketManager()

    private var connection: NWConnection?
    @Published var isConnected = false
    private var heartbeatTimer: Timer?
    private var config: AppConfig {
        AppConfig.shared
    }

    @Published var receivedData: String = ""
    @Published var connectionStatus: String = "Disconnected"
    @Published var isReconnecting: Bool = false

    private var url: URL {
        var components = URLComponents()
        components.scheme = "ws"
        components.host = config.websocketHost
        components.port = config.websocketPort
        components.path = "/"
        return components.url!
    }

    // MARK: - Lifecycle
    init() {
        setupConnection()
    }

    deinit {
        stop()
    }

    // MARK: - Connection Management
    private func setupConnection() {
        connection = NWConnection(to: NWEndpoint.url(url), using: .ws(version: .rfc6455))
        connection?.stateUpdateHandler = { [weak self] state in
            DispatchQueue.main.async {
                switch state {
                case .ready:
                    self?.didConnect()
                case .failed(let error):
                    self?.didFail(with: error)
                case .waiting:
                    self?.didWait()
                case .cancelled:
                    self?.didDisconnect()
                default:
                    break
                }
            }
        }

        startReceiving()
        connection?.start(queue: .main)
    }

    private func startReceiving() {
        connection?.receive(minimumIncompleteLength: 1, maximumLength: 1024) { [weak self] result in
            switch result {
            case .success(let message):
                self?.didReceiveMessage(message)
            case .failure(let error):
                DispatchQueue.main.async {
                    self?.didFail(with: error)
                }
            }

            // Continue receiving
            self?.startReceiving()
        }
    }

    private func didConnect() {
        isConnected = true
        connectionStatus = "Connected"
        isReconnecting = false
        startHeartbeat()
        print("✅ WebSocket connected")
    }

    private func didDisconnect() {
        isConnected = false
        connectionStatus = "Disconnected"
        stopHeartbeat()
        print("🔌 WebSocket disconnected")
    }

    private func didFail(with error: Error) {
        isConnected = false
        connectionStatus = "Failed"
        stopHeartbeat()
        print("❌ WebSocket connection failed: \(error.localizedDescription)")
    }

    private func didWait() {
        connectionStatus = "Waiting"
        print("⏳ WebSocket connection waiting")
    }

    // MARK: - Heartbeat Management
    private func startHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: config.heartbeatInterval, repeats: true) { [weak self] _ in
            self?.sendHeartbeat()
        }
    }

    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
    }

    private func sendHeartbeat() {
        guard isConnected else { return }
        let heartbeatMessage = "ping"
        send(message: heartbeatMessage)
    }

    // MARK: - Public Methods
    func send(message: String) {
        guard isConnected else {
            print("⚠️ Cannot send message, WebSocket is not connected")
            return
        }

        let data = message.data(using: .utf8)
        let wsMessage = NWProtocolWebSocket.Message(opcode: .text, data: data!)
        connection?.send(content: nil, contentContext: .init(identifier: "WebSocketMessage", metadata: [wsMessage]), isComplete: true, completion: .contentProcessed({ error in
            if let error = error {
                print("❌ Error sending message: \(error.localizedDescription)")
            } else {
                print("📤 Sent message successfully")
            }
        }))
    }

    func stop() {
        connection?.cancel()
        didDisconnect()
    }

    // MARK: - Debugging
    func printConnectionDetails() {
        guard let connection = connection else {
            print("❌ Connection not established")
            return
        }

        print("🌐 WebSocket Connection Details:")
        print("  - State: \(connection.state)")
        print("  - Endpoint: \(connection.endpoint)")
        print("  - Parameters: \(connection.parameters)")
    }

    // MARK: - Health Data Integration
    func sendHealthData(_ data: HealthData) async throws {
        let jsonData = try JSONEncoder().encode(data)
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            send(message: jsonString)
        }
    }

    // MARK: - WebSocket Message Handling
    private func didReceiveMessage(_ message: NWProtocolWebSocket.Message) {
        switch message.opcode {
        case .text:
            if let data = message.data, let text = String(data: data, encoding: .utf8) {
                DispatchQueue.main.async {
                    self.handleTextMessage(text)
                }
            }
        case .binary:
            print("Received binary message, ignoring")
        default:
            break
        }
    }

    private func handleTextMessage(_ text: String) {
        print("📥 Received: \(text)")
        receivedData = text
        
        // Handle ping/pong
        if text == "ping" {
            sendPong()
        }
    }

    private func sendPong() {
        let pongMessage = "pong"
        send(message: pongMessage)
    }
}
