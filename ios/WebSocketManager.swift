import Foundation

class WebSocketManager: NSObject {
    private var task: URLSessionWebSocketTask?
    private var urlSession: URLSession!
    private let baseURL: URL
    private(set) var isConnected: Bool = false
    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private var currentToken: String?
    private var currentClientType: String?
    private var currentUserId: String?

    override init(baseURL: URL) {
        self.baseURL = baseURL
        super.init()
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 30
        self.urlSession = URLSession(configuration: config, delegate: self, delegateQueue: OperationQueue())
    }

    func connect(token: String, clientType: String, userId: String) {
        currentToken = token
        currentClientType = clientType
        currentUserId = userId

        var url = baseURL
        if var comps = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            var items = comps.queryItems ?? []
            items.append(URLQueryItem(name: "token", value: token))
            comps.queryItems = items
            url = comps.url ?? baseURL
        }

        task?.cancel()
        task = urlSession.webSocketTask(with: url)
        task?.resume()

        self.receive()
        self.startHeartbeat()

        // Identify this client
        let identify: [String: Any] = [
            "type": "client_identification",
            "clientType": clientType,
            "userId": userId,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        self.send(identify)
    }

    private func startHeartbeat() {
        // Send ping every 30 seconds to keep connection alive
        Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] timer in
            guard let self = self, self.isConnected else {
                timer.invalidate()
                return
            }

            self.task?.sendPing { error in
                if let error = error {
                    print("WebSocket ping failed: \(error.localizedDescription)")
                    self.handleDisconnection()
                }
            }
        }
    }

    private func handleDisconnection() {
        isConnected = false

        // Attempt to reconnect with exponential backoff
        if reconnectAttempts < maxReconnectAttempts {
            let delay = min(pow(2.0, Double(reconnectAttempts)), 30.0) // Max 30 second delay
            reconnectAttempts += 1

            print("WebSocket disconnected. Attempting reconnect \(reconnectAttempts)/\(maxReconnectAttempts) in \(delay) seconds")

            reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                self?.attemptReconnect()
            }
        } else {
            print("WebSocket reconnection failed after \(maxReconnectAttempts) attempts")
        }
    }

    private func attemptReconnect() {
        guard let token = currentToken,
              let clientType = currentClientType,
              let userId = currentUserId else {
            print("Missing connection parameters for reconnect")
            return
        }

        connect(token: token, clientType: clientType, userId: userId)
    }

    func send(_ json: [String: Any]) {
        guard let task = task, isConnected else {
            print("WebSocket not connected, cannot send message")
            return
        }

        do {
            let data = try JSONSerialization.data(withJSONObject: json, options: [])
            task.send(.data(data)) { error in
                if let error = error {
                    print("WS send error: \(error.localizedDescription)")
                    self.handleDisconnection()
                }
            }
        } catch {
            print("WS serialize error: \(error.localizedDescription)")
        }
    }

    func close() {
        reconnectTimer?.invalidate()
        task?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
        reconnectAttempts = 0
    }

    private func receive() {
        task?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                print("WebSocket receive error: \(error.localizedDescription)")
                self?.handleDisconnection()
            case .success(let message):
                self?.handleMessage(message)
                self?.receive() // Continue listening
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            handleTextMessage(text)
        case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
                handleTextMessage(text)
            }
        @unknown default:
            print("Unknown WebSocket message type")
        }
    }

    private func handleTextMessage(_ text: String) {
        do {
            guard let data = text.data(using: .utf8),
                  let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else {
                return
            }

            switch type {
            case "connection_established":
                isConnected = true
                reconnectAttempts = 0
                print("WebSocket connection established")
            case "pong":
                // Heartbeat response
                break
            case "error":
                if let errorData = json["data"] as? [String: Any],
                   let message = errorData["message"] as? String {
                    print("WebSocket server error: \(message)")
                }
            default:
                print("Received WebSocket message type: \(type)")
            }
        } catch {
            print("Error parsing WebSocket message: \(error.localizedDescription)")
        }
    }
}

extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("WebSocket connection opened")
        isConnected = true
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        print("WebSocket connection closed with code: \(closeCode)")
        handleDisconnection()
    }
}
    }

    private func receive() {
        task?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .failure(let error):
                print("WS receive error: \(error.localizedDescription)")
                self.isConnected = false
            case .success:
                // Ignore messages on iOS side for now
                self.receive()
            }
        }
    }
}

extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        isConnected = true
    }
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        isConnected = false
    }
}
