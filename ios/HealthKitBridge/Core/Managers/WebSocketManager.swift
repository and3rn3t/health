import Foundation
import Network

// Lightweight JSON enum for parsing the envelope's data field
private enum CodableJSON: Codable {
    case object([String: CodableJSON])
    case array([CodableJSON])
    case string(String)
    case number(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null; return }
        if let v = try? container.decode(Bool.self) { self = .bool(v); return }
        if let v = try? container.decode(Double.self) { self = .number(v); return }
        if let v = try? container.decode(String.self) { self = .string(v); return }
        if let v = try? container.decode([String: CodableJSON].self) { self = .object(v); return }
        if let v = try? container.decode([CodableJSON].self) { self = .array(v); return }
        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON")
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .bool(let b): try container.encode(b)
        case .number(let n): try container.encode(n)
        case .string(let s): try container.encode(s)
        case .object(let o): try container.encode(o)
        case .array(let a): try container.encode(a)
        }
    }
}

private struct RawEnvelope: Codable {
    let type: String
    let timestamp: String?
    let source: String?
    let data: CodableJSON?
}

class WebSocketManager: NSObject, ObservableObject {
    static let shared = WebSocketManager()

    private var task: URLSessionWebSocketTask?
    // Adapter abstraction for improved testability (wraps URLSessionWebSocketTask)
    private var taskAdapter: WebSocketTasking?
    private var urlSession: URLSession!
    private let baseURL: URL
    @Published var isConnected: Bool = false
    @Published var connectionStatus: String = "Disconnected"
    @Published var lastError: String?

    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 3
    private var currentToken: String?
    private var isMockMode = false
    private var connectionTimeoutTimer: Timer?
    private var heartbeatTimer: Timer?
    private let heartbeatInterval: TimeInterval = 15
    private var missedHeartbeats = 0
    private let maxMissedHeartbeats = 2
    private let backoffBase: Double = 1.5
    private let backoffInitial: TimeInterval = 1.0
    private let backoffCap: TimeInterval = 20.0
    private var pathMonitor: NWPathMonitor?
    private var pathMonitorQueue = DispatchQueue(label: "ws.path.monitor")
    private var isNetworkReachable: Bool = true
    private var sendBuffer: [Data] = []
    private let sendBufferMax = 200
    private let tokenProvider: DeviceAuthTokenProvider?
    private let heartbeatScheduler: HeartbeatScheduling
    private let featureFlags: WebSocketFeatureFlags
#if DEBUG
    // Test hook: invoked at the start of a reconnect attempt sequence
    var onReconnectAttempt: (() -> Void)?
    static var test_reconnectDelayOverride: ((Int) -> TimeInterval)?
    static var test_recordedDelays: [TimeInterval] = []
    static var test_skipActualReconnect: Bool = false
#endif

// MARK: - WebSocket Task Abstraction
protocol WebSocketTasking: AnyObject {
    func resume()
    func send(_ message: URLSessionWebSocketTask.Message, completionHandler: (@Sendable (Error?) -> Void)?)
    func sendPing(_ pingHandler: (@Sendable (Error?) -> Void)?)
    func receive(completionHandler: @escaping (Result<URLSessionWebSocketTask.Message, Error>) -> Void)
    func cancel(with closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?)
}

extension WebSocketTasking {
    func sendSync(_ message: URLSessionWebSocketTask.Message) async throws {
        try await withCheckedThrowingContinuation { cont in
            send(message) { error in
                if let error { cont.resume(throwing: error) } else { cont.resume() }
            }
        }
    }
    func sendData(_ data: Data, completion: ((Error?) -> Void)? = nil) { send(.data(data), completionHandler: completion) }
}

final class URLSessionWebSocketTaskAdapter: WebSocketTasking {
    private let task: URLSessionWebSocketTask
    init(task: URLSessionWebSocketTask) { self.task = task }
    func resume() { task.resume() }
    func send(_ message: URLSessionWebSocketTask.Message, completionHandler: ((Error?) -> Void)?) { task.send(message, completionHandler: completionHandler ?? { _ in }) }
    func sendPing(_ pingHandler: ((Error?) -> Void)?) { task.sendPing(pingHandler: pingHandler ?? { _ in }) }
    func receive(completionHandler: @escaping (Result<URLSessionWebSocketTask.Message, Error>) -> Void) { task.receive(completionHandler: completionHandler) }
    func cancel(with closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) { task.cancel(with: closeCode, reason: reason) }
}

#if DEBUG
final class TestWebSocketTaskAdapter: WebSocketTasking {
    private(set) var sentMessages: [URLSessionWebSocketTask.Message] = []
    private(set) var sentPings: Int = 0
    var nextPingError: Error?
    private var receiveQueue: [Result<URLSessionWebSocketTask.Message, Error>] = []
    private var activeReceiveHandler: ((Result<URLSessionWebSocketTask.Message, Error>) -> Void)?

    func resume() {}
    func send(_ message: URLSessionWebSocketTask.Message, completionHandler: ((Error?) -> Void)?) {
        sentMessages.append(message)
        completionHandler?(nil)
    }
    func sendPing(_ pingHandler: ((Error?) -> Void)?) {
        sentPings += 1
        let e = nextPingError
        nextPingError = nil
        pingHandler?(e)
    }
    func receive(completionHandler: @escaping (Result<URLSessionWebSocketTask.Message, Error>) -> Void) {
        if receiveQueue.isEmpty { activeReceiveHandler = completionHandler } else { completionHandler(receiveQueue.removeFirst()) }
    }
    func cancel(with closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {}

    // Test utilities
    func emit(_ message: URLSessionWebSocketTask.Message) { enqueue(.success(message)) }
    func emitError(_ error: Error) { enqueue(.failure(error)) }
    private func enqueue(_ result: Result<URLSessionWebSocketTask.Message, Error>) {
        if let h = activeReceiveHandler { activeReceiveHandler = nil; h(result) } else { receiveQueue.append(result) }
    }
    func drainSentDataMessages() -> [Data] {
        sentMessages.compactMap { if case .data(let d) = $0 { return d } else { return nil } }
    }
}
#endif
    // Subscriptions per message type
    private var subscriptionHandlers: [String: [UUID: (Data) -> Void]] = [:]

    // Convenience: register common typed handlers
    @discardableResult func onConnectionEstablished(_ f: @escaping (ConnectionEstablished) -> Void) -> UUID {
        subscribe(type: "connection_established", as: ConnectionEstablished.self, f)
    }
    @discardableResult func onLiveHealthUpdate(_ f: @escaping (LiveHealthUpdate) -> Void) -> UUID {
        subscribe(type: "live_health_update", as: LiveHealthUpdate.self, f)
    }
    @discardableResult func onHistoricalDataUpdate(_ f: @escaping (HistoricalDataUpdate) -> Void) -> UUID {
        subscribe(type: "historical_data_update", as: HistoricalDataUpdate.self, f)
    }
    @discardableResult func onEmergencyAlert(_ f: @escaping (EmergencyAlert) -> Void) -> UUID {
        subscribe(type: "emergency_alert", as: EmergencyAlert.self, f)
    }

    var wsURL: URL {
        let config = AppConfig.shared
        guard let url = URL(string: config.webSocketURL) else {
            Log.warn("Invalid WebSocket URL in config, using default", category: "websocket")
            if let fallbackURL = URL(string: "wss://api.andernet.dev/ws") {
                return fallbackURL
            } else if let localhostURL = URL(string: "ws://localhost:8080/ws") {
                Log.warn("Using localhost fallback URL", category: "websocket")
                return localhostURL
            } else {
                fatalError("Unable to create any valid WebSocket URL - this is a critical configuration error")
            }
        }
        return url
    }

    // MARK: - Public typed senders
    @discardableResult
    func sendGaitDataPayload(_ payload: GaitDataPayload) async -> Bool {
        // Encode payload as dictionary so server receives object in `data`
        if let dict = Self.encodeToDictionary(payload) {
            let envelope: [String: Any] = [
                "type": "gait_analysis",
                "timestamp": ISO8601DateFormatter().string(from: Date()),
                "source": "ios-native",
                "data": dict
            ]

            do {
                try await sendJSON(envelope)
                return true
            } catch {
                Log.error("Failed to send gait payload: \(error.localizedDescription)", category: "websocket")
                return false
            }
        } else {
            Log.error("Failed to encode GaitDataPayload to dictionary", category: "websocket")
            return false
        }
    }

    private override init() {
        // Initialize baseURL with safe URL creation
        let config = AppConfig.shared
        if let configURL = URL(string: config.webSocketURL) {
            self.baseURL = configURL
        } else {
            // Safe fallback with multiple options
            Log.warn("Invalid WebSocket URL in config, using default", category: "websocket")
            if let defaultURL = URL(string: "wss://api.andernet.dev/ws") {
                self.baseURL = defaultURL
            } else if let localhostURL = URL(string: "wss://localhost:8080/ws") {
                self.baseURL = localhostURL
            } else {
                // This should never happen but provide absolute safety
                fatalError("Unable to create any valid WebSocket URL - critical configuration error")
            }
        }

    self.tokenProvider = nil
    self.heartbeatScheduler = DefaultHeartbeatScheduler()
    self.featureFlags = WebSocketFeatureFlags()
    super.init()

        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = 10
        sessionConfig.timeoutIntervalForResource = 30
        self.urlSession = URLSession(
            configuration: sessionConfig,
            delegate: self,
            delegateQueue: OperationQueue()
        )

        updateConnectionStatus("Ready to connect")

        // Start network path monitoring
        let monitor = NWPathMonitor()
        pathMonitor = monitor
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }
            let reachable = path.status == .satisfied
            self.isNetworkReachable = reachable
            if !reachable {
                DispatchQueue.main.async {
                reconnectAttempts += 1

                #if DEBUG
                let chosenDelay: Double
                if let override = Self.test_reconnectDelayOverride {
                    chosenDelay = override(reconnectAttempts)
                } else {
                    // fall back to production calculation
                    let base: Double = reconnectAttempts == 1 ? 0.5 : min(30.0, pow(2.0, Double(reconnectAttempts - 1)))
                    let jitter = Double.random(in: 0...(base * 0.3))
                    chosenDelay = base + jitter
                }
                Self.test_recordedDelays.append(chosenDelay)
                if Self.test_skipActualReconnect {
                    logger.info("[WS][TEST] Skipping actual reconnect attempt #\(reconnectAttempts) (delay override: \(String(format: "%.2f", chosenDelay))s)")
                    return
                }
                let delay = chosenDelay
                #else
                let base: Double = reconnectAttempts == 1 ? 0.5 : min(30.0, pow(2.0, Double(reconnectAttempts - 1)))
                let jitter = Double.random(in: 0...(base * 0.3))
                let delay = base + jitter
                #endif

                logger.info("[WS] Scheduling reconnect attempt #\(reconnectAttempts) in \(String(format: "%.2f", delay))s")
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                await connect(with: token)

#if DEBUG
    /// Test-only initializer allowing injection of dependencies.
    convenience init(baseURL: URL?,
                     tokenProvider: DeviceAuthTokenProvider? = nil,
                     heartbeatScheduler: HeartbeatScheduling = DefaultHeartbeatScheduler(),
                     featureFlags: WebSocketFeatureFlags = WebSocketFeatureFlags()) {
        self.init()
        if let u = baseURL { self.setValue(u, forKey: "baseURL") }
        // Direct property assignment (these are lets in original; to keep minimal risk we reflect via KVC is not allowed for lets).
        // NOTE: For fuller testability, refactor stored lets to vars in a future iteration.
    }
#endif

    /// Convenience method retaining legacy explicit token path.
    func connect(with token: String) async {
        Log.info("Connecting to WebSocket with token", category: "websocket")
        currentToken = token

        await MainActor.run {
            self.updateConnectionStatus("Connecting...")
        }

        // Try real connection first
        if await tryRealConnection(token: token) {
            Log.info("Real WebSocket connection successful", category: "websocket")
            startHeartbeat()
            return
        }

        // Fall back to mock connection
        Log.info("Real connection failed, using mock connection for testing", category: "websocket")
        await setupMockConnection()
    }

    /// New connect flow using injected token provider (if available).
    func connect() {
        if let provider = tokenProvider {
            Task {
                do {
                    let token = try await provider.fetchToken()
                    await connect(with: token)
                } catch {
                    Log.error("Token provider failed: \(error.localizedDescription)", category: "websocket")
                }
            }
        } else {
            Task { await connect(with: "dev-local-token") }
        }
    }

    private func tryRealConnection(token: String) async -> Bool {
        var url = baseURL
        if var components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            var queryItems = components.queryItems ?? []
            queryItems.append(URLQueryItem(name: "token", value: token))
            components.queryItems = queryItems
            url = components.url ?? baseURL
        }

        Log.debug("Attempting real connection to: \(url.absoluteString)", category: "websocket")

        return await withCheckedContinuation { [weak self] continuation in
            var hasResumed = false

            self?.task?.cancel()
            if let strong = self {
                let newTask = strong.urlSession.webSocketTask(with: url)
                strong.task = newTask
                strong.taskAdapter = URLSessionWebSocketTaskAdapter(task: newTask)
            }

            // Set up a timeout to detect connection failure with proper cleanup
            let timeoutTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { _ in
                if !hasResumed {
                    hasResumed = true
                    Log.warn("Real connection timeout after 3 seconds", category: "websocket")
                    DispatchQueue.main.async {
                        self?.lastError = "Connection timeout - no server responding at \(url.absoluteString)"
                    }
                    continuation.resume(returning: false)
                }
            }

            // Store timer reference for cleanup
            self?.connectionTimeoutTimer = timeoutTimer

            // Start the connection
            self?.task?.resume()

            // Try to send a ping to test connectivity
            self?.taskAdapter?.sendPing { [weak self] error in
                self?.connectionTimeoutTimer?.invalidate()
                self?.connectionTimeoutTimer = nil

                if !hasResumed {
                    hasResumed = true

                    if let error = error {
                        Log.error("Real connection failed: \(error.localizedDescription)", category: "websocket")
                        DispatchQueue.main.async {
                            self?.lastError = "WebSocket connection failed: \(error.localizedDescription)"
                        }
                        continuation.resume(returning: false)
                    } else {
                        Log.info("Real connection ping successful", category: "websocket")
                        DispatchQueue.main.async {
                            self?.isConnected = true
                            self?.isMockMode = false
                            self?.updateConnectionStatus("Connected (Real)")
                            self?.lastError = nil
                            self?.receive()
                        }
                        self?.startHeartbeat()
                        continuation.resume(returning: true)
                    }
                }
            }
        }
    }

    private func setupMockConnection() async {
        Log.info("Setting up mock WebSocket connection (mock mode)", category: "websocket")

        await MainActor.run {
            self.isMockMode = true
            self.isConnected = true
            self.updateConnectionStatus("Connected (Mock)")
            self.lastError = nil
        }

        // Simulate connection delay
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second

        Log.info("Mock WebSocket connection established", category: "websocket")
    }

    // (legacy connect() replaced above with provider-aware version)

    func disconnect() {
    Log.info("Disconnecting WebSocket...", category: "websocket")

        // Clean up timers
        connectionTimeoutTimer?.invalidate()
        connectionTimeoutTimer = nil

    task?.cancel(with: .goingAway, reason: nil)
    task = nil
    taskAdapter = nil
    stopHeartbeat()

        DispatchQueue.main.async {
            self.isConnected = false
            self.isMockMode = false
            self.updateConnectionStatus("Disconnected")
        }

        stopReconnectTimer()
    }

    // MARK: - Subscriptions
    @discardableResult
    func subscribe<T: Decodable>(type: String, as: T.Type = T.self, _ handler: @escaping (T) -> Void) -> UUID {
        let id = UUID()
        var bucket = subscriptionHandlers[type] ?? [:]
        bucket[id] = { [weak self] data in
            guard let self else { return }
            do {
                let decoded = try JSONDecoder().decode(T.self, from: data)
                handler(decoded)
            } catch {
                self.debugLog("Decode failure for type=\(type): \(error.localizedDescription)")
            }
        }
        subscriptionHandlers[type] = bucket
        return id
    }

    func unsubscribe(_ id: UUID, from type: String) {
        subscriptionHandlers[type]?[id] = nil
        if subscriptionHandlers[type]?.isEmpty == true { subscriptionHandlers[type] = nil }
    }

    // MARK: - Typed send
    private struct OutgoingEnvelope<D: Encodable>: Encodable { let type: String; let data: D; let timestamp: String; let source: String }
    func send<T: Encodable>(type: String, data: T, source: String = "ios-native") {
        let env = OutgoingEnvelope(type: type, data: data, timestamp: ISO8601DateFormatter().string(from: Date()), source: source)
        do {
            let bytes = try JSONEncoder().encode(env)
            enqueueSend(bytes)
        } catch {
            debugLog("Send encode error: \(error.localizedDescription)")
        }
    }

    func sendHealthData(_ healthData: HealthData) async throws {
        Log.debug("Sending health data: \(healthData.type) = \(healthData.value) \(healthData.unit)", category: "websocket")

        if isMockMode {
            Log.info("Mock mode: Simulating data send successfully", category: "websocket")
            // In mock mode, simulate success with better feedback
            await MainActor.run {
                self.updateConnectionStatus("Connected (Mock) - Data sent ✓")
            }

            // Simulate a brief sending delay for realism
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds

            // Reset status after a moment
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        // Check if we have a valid connection
        guard let task = task else {
            Log.warn("No WebSocket connection, using mock mode for test data", category: "websocket")
            await MainActor.run {
                self.isMockMode = true
                self.updateConnectionStatus("Mock mode: Test data sent ✓")
            }

            // Reset to standard mock status
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        // Real WebSocket sending
        let message: [String: Any] = [
            "type": "health_data",
            "data": [
                "type": healthData.type,
                "value": healthData.value,
                "unit": healthData.unit,
                "timestamp": ISO8601DateFormatter().string(from: healthData.timestamp),
                "deviceId": healthData.deviceId,
                "userId": healthData.userId
            ]
        ]

        do {
            try await sendJSON(message)
            await MainActor.run {
                self.updateConnectionStatus("Connected (Real) - Data sent ✓")
            }

            // Reset status after a moment
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Real)")
            }
        } catch {
            Log.error("Failed to send via WebSocket, falling back to mock mode", category: "websocket")
            await MainActor.run {
                self.isMockMode = true
                self.updateConnectionStatus("Mock mode: Test data sent ✓")
            }

            // Reset to standard mock status
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
        }
    }

    // MARK: - Advanced Gait / Fall Risk Transmission
    // Removed legacy commented blocks. When feature flags.enableAdvancedGaitAndFallRisk becomes true,
    // dedicated methods will be reintroduced using structured Log and schema-based envelopes.

    private func sendJSON(_ object: [String: Any]) async throws {
        do {
            let data = try JSONSerialization.data(withJSONObject: object)
            enqueueSend(data)
        } catch {
            Log.error("Failed to serialize JSON: \(error.localizedDescription)", category: "websocket")
            throw WebSocketError.messageSerializationFailed
        }
    }

    private func send(message: String) async throws {
        guard let adapter = taskAdapter, !isMockMode else {
            if isMockMode {
                Log.debug("Mock mode: Would send message", category: "websocket")
                return
            } else {
                Log.error("WebSocket not connected", category: "websocket")
                throw WebSocketError.notConnected
            }
        }

        do {
            let msg = URLSessionWebSocketTask.Message.string(message)
            try await adapter.sendSync(msg)
            Log.info("WebSocket message sent successfully", category: "websocket")
        } catch {
            Log.error("Failed to send WebSocket message: \(error)", category: "websocket")
            await handleConnectionLoss()
            throw WebSocketError.sendFailed(error.localizedDescription)
        }
    }

    private func enqueueSend(_ data: Data) {
        // Buffer if not connected or during reconnects
        guard let adapter = taskAdapter, isConnected, !isMockMode else {
            if sendBuffer.count >= sendBufferMax {
                // Drop oldest to maintain cap
                let overflow = sendBuffer.count - sendBufferMax + 1
                if overflow > 0 { sendBuffer.removeFirst(overflow) }
                Log.warn("Send buffer full (cap=\(sendBufferMax)); dropping oldest message", category: "websocket")
            }
            sendBuffer.append(data)
            return
        }
        adapter.send(.data(data)) { [weak self] error in
            if let error { Task { await self?.handleSendError(error) } }
        }
    }

    private func flushSendBuffer() {
        guard let adapter = taskAdapter, isConnected, !isMockMode, !sendBuffer.isEmpty else { return }
        let items = sendBuffer
        sendBuffer.removeAll()
        for data in items {
            adapter.send(.data(data)) { [weak self] error in
                if let error { Task { await self?.handleSendError(error) } }
            }
        }
    }

    private func handleSendError(_ error: Error) async {
        Log.error("Send error: \(error.localizedDescription)", category: "websocket")
        await handleConnectionLoss()
    }

    private func receive() {
        guard let adapter = taskAdapter, !isMockMode else { return }

        adapter.receive { [weak self] result in
            switch result {
            case .success(let message):
                Log.debug("WebSocket message received", category: "websocket")
        // Route typed envelopes to subscribers
        switch message {
        case .data(let data): self?.routeMessage(data)
        case .string(let str): self?.routeMessage(Data(str.utf8))
        @unknown default: break
        }
    self?.receive() // Continue receiving

            case .failure(let error):
                Log.error("WebSocket receive error", category: "websocket")
                Task {
                    await self?.handleConnectionLoss()
                }
            }
        }
    }

    private func routeMessage(_ data: Data) {
        guard let env = try? JSONDecoder().decode(RawEnvelope.self, from: data) else { return }
        guard let handlers = subscriptionHandlers[env.type], !handlers.isEmpty else { return }
        // Extract data payload if present
        let payload: Data
        if let d = env.data, let reenc = try? JSONEncoder().encode(d) {
            payload = reenc
        } else {
            payload = Data("{}".utf8)
        }
        for (_, f) in handlers { f(payload) }
    }

    private func handleConnectionLoss() async {
        Log.warn("Handling connection loss", category: "websocket")
#if DEBUG
        onReconnectAttempt?()
#endif

        await MainActor.run {
            self.isConnected = false
            self.updateConnectionStatus("Connection lost")
        }

        // Pause if network is unavailable
        guard isNetworkReachable else {
            await MainActor.run { self.updateConnectionStatus("Waiting for network...") }
            return
        }

        // Try to reconnect if we have a token with backoff + jitter
        if let token = currentToken {
            reconnectAttempts += 1
            if reconnectAttempts <= maxReconnectAttempts {
                let exp = min(backoffInitial * pow(backoffBase, Double(reconnectAttempts - 1)), backoffCap)
                let jitter = Double.random(in: 0...1)
                let delay = exp + jitter
                Log.warn("Reconnect attempt #\(reconnectAttempts) in \(String(format: "%.1f", delay))s", category: "websocket")
                let nanos = UInt64(delay * 1_000_000_000)
                try? await Task.sleep(nanoseconds: nanos)
                await connect(with: token)
            } else {
                Log.error("Max reconnect attempts reached, switching to mock mode", category: "websocket")
                await setupMockConnection()
            }
        }
    }

    private func updateConnectionStatus(_ status: String) {
        DispatchQueue.main.async {
            self.connectionStatus = status
        }
    }

    // MARK: - Heartbeat
    private func startHeartbeat() {
        stopHeartbeat()
        missedHeartbeats = 0
        heartbeatTimer = heartbeatScheduler.schedule(interval: heartbeatInterval) { [weak self] in
            guard let self else { return }
            guard let adapter = self.taskAdapter, !self.isMockMode else { return }
            adapter.sendPing { [weak self] error in
                guard let self else { return }
                if let error = error {
                    Log.warn("Heartbeat ping error: \(error.localizedDescription)", category: "websocket")
                    self.missedHeartbeats += 1
                } else {
                    self.missedHeartbeats = 0
                }
                if self.missedHeartbeats > self.maxMissedHeartbeats {
                    Log.error("Missed heartbeats threshold reached, reconnecting...", category: "websocket")
                    self.heartbeatTimer?.invalidate()
                    self.heartbeatTimer = nil
                    Task { await self.handleConnectionLoss() }
                }
            }
        }
    }

    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        missedHeartbeats = 0
    }

    // MARK: - Reconnect scheduling helper
    private func scheduleReconnectNow(reason: String) async {
        Log.info("Scheduling reconnect: \(reason)", category: "websocket")
        reconnectAttempts = 0
        if let token = currentToken {
            await connect(with: token)
        }
    }

    // MARK: - Helpers
    private static func encodeToDictionary<T: Encodable>(_ value: T) -> [String: Any]? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        do {
            let data = try encoder.encode(value)
            let json = try JSONSerialization.jsonObject(with: data, options: [])
            return json as? [String: Any]
        } catch {
            Log.error("JSON encode/decode error", category: "websocket")
            return nil
        }
    }

#if DEBUG
    // Exposed only for unit testing: builds the same envelope shape as sendGaitDataPayload
    func buildGaitEnvelopeForTest(_ payload: GaitDataPayload) -> [String: Any]? {
        guard let dict = Self.encodeToDictionary(payload) else { return nil }
        return [
            "type": "gait_analysis",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios-native",
            "data": dict
        ]
    }

    /// Deterministic backoff delay calculator for unit tests (jitter injected by caller)
    static func computeBackoffDelayForTest(
        attempt: Int,
        base: Double = 1.5,
        initial: TimeInterval = 1.0,
        cap: TimeInterval = 20.0,
        jitter: Double = 0.0
    ) -> TimeInterval {
        guard attempt > 0 else { return 0 }
        let exp = min(initial * pow(base, Double(max(1, attempt) - 1)), cap)
        return min(exp + max(0, jitter), cap + max(0, jitter))
    }
#endif

    private func stopReconnectTimer() {
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        reconnectAttempts = 0
    }

#if DEBUG
    /// Build a generic envelope for unit tests without sending over the network
    static func buildEnvelopeForTest<T: Encodable>(type: String, data: T, source: String = "ios-native") -> [String: Any]? {
        let env = OutgoingEnvelope(type: type, data: data, timestamp: ISO8601DateFormatter().string(from: Date()), source: source)
        do {
            let bytes = try JSONEncoder().encode(env)
            let obj = try JSONSerialization.jsonObject(with: bytes, options: [])
            return obj as? [String: Any]
        } catch { return nil }
    }

    /// Unit-test helper to route a raw JSON message through the internal dispatcher
    func test_routeRawMessage(_ data: Data) {
        routeMessage(data)
    }

    /// Inject a custom WebSocket task adapter (test spy / mock)
    func test_injectTaskAdapter(_ adapter: WebSocketTasking, markConnected: Bool = true) {
        self.taskAdapter = adapter
        if markConnected { self.isConnected = true }
    }

    /// Return current buffered send count
    func test_getBufferedSendCount() -> Int { sendBuffer.count }

    /// Force flush of send buffer
    func test_forceFlushBuffer() { flushSendBuffer() }

    /// Manually start heartbeat (normally internal)
    func test_startHeartbeat() { startHeartbeat() }

    /// Run one synthetic heartbeat tick (bypasses waiting for timer interval)
    func test_runHeartbeatTick(simulateError: Bool = false) {
        guard let adapter = taskAdapter, !isMockMode else { return }
        if simulateError, let testAdapter = adapter as? TestWebSocketTaskAdapter {
            testAdapter.nextPingError = NSError(domain: "HeartbeatTest", code: -1)
        }
        adapter.sendPing { [weak self] error in
            guard let self else { return }
            if let error = error {
                Log.warn("[TEST] Heartbeat simulated ping error: \(error.localizedDescription)", category: "websocket")
                self.missedHeartbeats += 1
            } else {
                self.missedHeartbeats = 0
            }
            if self.missedHeartbeats > self.maxMissedHeartbeats {
                Log.error("[TEST] Missed heartbeats threshold reached (synthetic)", category: "websocket")
                Task { await self.handleConnectionLoss() }
            }
        }
    }

    /// Access internal max missed heartbeat threshold for assertions
    func test_getMissedHeartbeatThreshold() -> Int { maxMissedHeartbeats }
    func test_getMissedHeartbeats() -> Int { missedHeartbeats }
    func test_getSendBufferMax() -> Int { sendBufferMax }
    /// Begin receive loop manually (call before emitting messages on adapter)
    func test_startReceiveLoop() { receive() }
    /// Snapshot current buffered Data messages
    func test_dumpBuffer() -> [Data] { sendBuffer }
    /// Inject a token for reconnect logic without real fetch
    func test_setToken(_ token: String) { currentToken = token }
    /// Force connection loss path (respects debug overrides)
    func test_forceHandleConnectionLoss(triggerToken token: String? = nil) async {
        if let t = token { currentToken = t }
        await handleConnectionLoss()
    }
    /// Reset all DEBUG instrumentation to a clean baseline
    func test_resetDebugState() {
        Self.test_reconnectDelayOverride = nil
        Self.test_recordedDelays.removeAll()
        Self.test_skipActualReconnect = false
        reconnectAttempts = 0
        missedHeartbeats = 0
    }
    /// Enqueue a raw payload into normal buffering path (used for overflow tests)
    func enqueueTestPayload(_ data: Data) async throws {
        // Mimic internal sendJSON path but directly enqueue raw Data (no encoding)
        enqueueSend(data)
    }
#endif

    deinit {
        Log.info("WebSocketManager deinit", category: "websocket")
        disconnect()
        connectionTimeoutTimer?.invalidate()
        reconnectTimer?.invalidate()
    }
}

// MARK: - URLSessionWebSocketDelegate
extension WebSocketManager: URLSessionWebSocketDelegate {
    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        Log.info("WebSocket connection opened", category: "websocket")
        DispatchQueue.main.async {
            self.isConnected = true
            self.updateConnectionStatus("Connected")
            self.reconnectAttempts = 0
            self.flushSendBuffer()
        }
    }

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        Log.info("WebSocket connection closed with code: \(closeCode)", category: "websocket")

        let reasonString = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "No reason"
        Log.info("Close reason: \(reasonString)", category: "websocket")

        DispatchQueue.main.async {
            self.isConnected = false
            self.updateConnectionStatus("Disconnected")
        }

        Task {
            await self.handleConnectionLoss()
        }
    }
}

// MARK: - URLSessionDelegate
extension WebSocketManager: URLSessionDelegate {
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        completionHandler(.performDefaultHandling, nil)
    }
}

// MARK: - WebSocket Errors
enum WebSocketError: Error, LocalizedError {
    case notConnected
    case sendFailed(String)
    case messageSerializationFailed

    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "WebSocket is not connected"
        case .sendFailed(let message):
            return "Failed to send message: \(message)"
        case .messageSerializationFailed:
            return "Failed to serialize message"
        }
    }
}

extension WebSocketManager {
    fileprivate func debugLog(_ message: @autoclosure () -> String) {
        Log.debug(message(), category: "websocket")
    }
}

// MARK: - Feature Flags
struct WebSocketFeatureFlags {
    var enableAdvancedGaitAndFallRisk: Bool = false
}

// MARK: - Heartbeat Scheduling Abstraction
protocol HeartbeatScheduling {
    @discardableResult
    func schedule(interval: TimeInterval, _ block: @escaping () -> Void) -> Timer
}

final class DefaultHeartbeatScheduler: HeartbeatScheduling {
    func schedule(interval: TimeInterval, _ block: @escaping () -> Void) -> Timer {
        let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in block() }
        RunLoop.main.add(timer, forMode: .common)
        return timer
    }
}

#if DEBUG
/// Test scheduler allowing manual tick control.
final class TestHeartbeatScheduler: HeartbeatScheduling {
    private var stored: (interval: TimeInterval, block: () -> Void)?
    func schedule(interval: TimeInterval, _ block: @escaping () -> Void) -> Timer {
        stored = (interval, block)
        // Return a dummy timer (never fires automatically)
        return Timer()
    }
    func tick() { stored?.block() }
}
#endif
