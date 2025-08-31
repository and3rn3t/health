import Foundation

class WebSocketManager: NSObject, ObservableObject {
    static let shared = WebSocketManager()

    private var task: URLSessionWebSocketTask?
    private var urlSession: URLSession!
    private let baseURL: URL
    @Published var isConnected: Bool = false
    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private var currentToken: String?

    private override init() {
        // Get WebSocket URL from config
        let config = AppConfig.shared
        self.baseURL = config.wsURL
        super.init()

        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = 10
        sessionConfig.timeoutIntervalForResource = 30
        self.urlSession = URLSession(configuration: sessionConfig, delegate: self, delegateQueue: OperationQueue())
    }

    func connect(with token: String) async {
        print("🔌 Connecting to WebSocket with token...")
        currentToken = token

        var url = baseURL
        if var components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            var queryItems = components.queryItems ?? []
            queryItems.append(URLQueryItem(name: "token", value: token))
            components.queryItems = queryItems
            url = components.url ?? baseURL
        }

        await MainActor.run {
            task?.cancel()
            task = urlSession.webSocketTask(with: url)
            task?.resume()

            // Start receiving messages
            receive()
            startHeartbeat()

            // Send client identification
            let identification: [String: Any] = [
                "type": "client_identification",
                "clientType": "ios_app",
                "userId": AppConfig.shared.userId,
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]

            Task {
                await self.sendJSON(identification)
            }
        }
    }

    func disconnect() {
        print("🔌 Disconnecting WebSocket...")
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        isConnected = false
        stopHeartbeat()
    }

    func send(message: String) async {
        guard let task = task else {
            print("❌ WebSocket not connected")
            return
        }

        do {
            let message = URLSessionWebSocketTask.Message.string(message)
            try await task.send(message)
            print("📤 WebSocket message sent")
        } catch {
            print("❌ Failed to send WebSocket message: \(error)")
            await handleConnectionLoss()
        }
    }

    private func sendJSON(_ object: [String: Any]) async {
        do {
            let data = try JSONSerialization.data(withJSONObject: object)
            if let jsonString = String(data: data, encoding: .utf8) {
                await send(message: jsonString)
            }
        } catch {
            print("❌ Failed to serialize JSON: \(error)")
        }
    }

    private func receive() {
        guard let task = task else { return }

        task.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    print("📥 WebSocket received: \(text)")
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        print("📥 WebSocket received data: \(text)")
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }

                // Continue receiving
                self?.receive()

            case .failure(let error):
                print("❌ WebSocket receive error: \(error)")
                Task {
                    await self?.handleConnectionLoss()
                }
            }
        }
    }

    private func handleMessage(_ message: String) {
        // Parse and handle incoming WebSocket messages
        guard let data = message.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            print("❌ Invalid WebSocket message format")
            return
        }

        switch type {
        case "connection_established":
            Task { @MainActor in
                self.isConnected = true
                self.reconnectAttempts = 0
                print("✅ WebSocket connection established")
            }

        case "pong":
            print("💓 WebSocket heartbeat received")

        case "error":
            if let errorMessage = json["message"] as? String {
                print("❌ WebSocket server error: \(errorMessage)")
            }

        default:
            print("📨 Received WebSocket message type: \(type)")
        }
    }

    private func startHeartbeat() {
        stopHeartbeat()

        Task { @MainActor in
            reconnectTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
                Task {
                    await self?.sendHeartbeat()
                }
            }
        }
    }

    private func stopHeartbeat() {
        reconnectTimer?.invalidate()
        reconnectTimer = nil
    }

    private func sendHeartbeat() async {
        let ping: [String: Any] = [
            "type": "ping",
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        await sendJSON(ping)
        print("💓 WebSocket heartbeat sent")
    }

    private func handleConnectionLoss() async {
        await MainActor.run {
            isConnected = false
        }

        print("🔄 WebSocket connection lost, attempting reconnection...")

        guard reconnectAttempts < maxReconnectAttempts else {
            print("❌ Max reconnection attempts reached")
            return
        }

        reconnectAttempts += 1

        // Wait before reconnecting
        try? await Task.sleep(nanoseconds: UInt64(reconnectAttempts * 2) * 1_000_000_000)

        if let token = currentToken {
            await connect(with: token)
        }
    }
}

// MARK: - URLSessionWebSocketDelegate
extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("✅ WebSocket connection opened")
        Task { @MainActor in
            isConnected = true
        }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("🔌 WebSocket connection closed: \(closeCode)")
        Task { @MainActor in
            isConnected = false
        }

        Task {
            await handleConnectionLoss()
        }
    }
}
