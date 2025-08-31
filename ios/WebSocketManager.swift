import Foundation

class WebSocketManager: NSObject {
    private var task: URLSessionWebSocketTask?
    private var urlSession: URLSession!
    private let baseURL: URL
    private(set) var isConnected: Bool = false

    init(baseURL: URL) {
        self.baseURL = baseURL
        super.init()
        let config = URLSessionConfiguration.default
        self.urlSession = URLSession(configuration: config, delegate: self, delegateQueue: OperationQueue())
    }

    func connect(token: String, clientType: String, userId: String) {
        var url = baseURL
        if var comps = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            var items = comps.queryItems ?? []
            items.append(URLQueryItem(name: "token", value: token))
            comps.queryItems = items
            url = comps.url ?? baseURL
        }
        task = urlSession.webSocketTask(with: url)
        task?.resume()
        self.receive()
        // Identify this client
        let identify: [String: Any] = [
            "type": "client_identification",
            "clientType": clientType,
            "userId": userId
        ]
        self.send(identify)
    }

    func send(_ json: [String: Any]) {
        guard let task = task else { return }
        do {
            let data = try JSONSerialization.data(withJSONObject: json, options: [])
            task.send(.data(data)) { error in
                if let error = error { print("WS send error: \(error.localizedDescription)") }
            }
        } catch {
            print("WS serialize error: \(error.localizedDescription)")
        }
    }

    func close() {
        task?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
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
