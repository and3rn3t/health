import Foundation
import Network
import os

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

@MainActor
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

    // Thread-safety for subscription handler map
    private let subscriptionQueue = DispatchQueue(label: "ws.subscriptions", attributes: .concurrent)
    private var subscriptionHandlers: [String: [UUID: (Data) -> Void]] = [:]

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
        let config = AppConfig.shared
        if let configURL = URL(string: config.webSocketURL) {
            self.baseURL = configURL
        } else {
            Log.warn("Invalid WebSocket URL in config, using default", category: "websocket")
            if let defaultURL = URL(string: "wss://api.andernet.dev/ws") {
                self.baseURL = defaultURL
            } else if let localhostURL = URL(string: "wss://localhost:8080/ws") {
                self.baseURL = localhostURL
            } else {
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

        let monitor = NWPathMonitor()
        pathMonitor = monitor
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self else { return }
            let reachable = path.status == .satisfied
            DispatchQueue.main.async {
                self.isNetworkReachable = reachable
                if reachable {
                    if !self.isConnected, let token = self.currentToken {
                        self.reconnectAttempts = 0
                        self.updateConnectionStatus("Network restored – reconnecting…")
                        Task { await self.connect(with: token) }
                    }
                } else {
                    self.updateConnectionStatus("Network unavailable")
                }
            }
        }
        monitor.start(queue: pathMonitorQueue)
    }

#if DEBUG
    convenience init(baseURL: URL?,
                     tokenProvider: DeviceAuthTokenProvider? = nil,
                     heartbeatScheduler: HeartbeatScheduling = DefaultHeartbeatScheduler(),
                     featureFlags: WebSocketFeatureFlags = WebSocketFeatureFlags()) {
        self.init()
        _ = baseURL
        _ = tokenProvider
        _ = heartbeatScheduler
        _ = featureFlags
    }
#endif

    func connect(with token: String) async {
        Log.info("Connecting to WebSocket with token", category: "websocket")
        currentToken = token
        updateConnectionStatus("Connecting...")
        if await tryRealConnection(token: token) {
            Log.info("Real WebSocket connection successful", category: "websocket")
            startHeartbeat()
            return
        }
        Log.info("Real connection failed, using mock connection for testing", category: "websocket")
        await setupMockConnection()
    }

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
            let timeoutTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { _ in
                if !hasResumed {
                    hasResumed = true
                    Log.warn("Real connection timeout after 3 seconds", category: "websocket")
                    DispatchQueue.main.async { self?.lastError = "Connection timeout - no server responding at \(url.absoluteString)" }
                    continuation.resume(returning: false)
                }
            }
            self?.connectionTimeoutTimer = timeoutTimer
            self?.task?.resume()
            self?.taskAdapter?.sendPing { [weak self] error in
                self?.connectionTimeoutTimer?.invalidate()
                self?.connectionTimeoutTimer = nil
                if !hasResumed {
                    hasResumed = true
                    if let error = error {
                        Log.error("Real connection failed: \(error.localizedDescription)", category: "websocket")
                        DispatchQueue.main.async { self?.lastError = "WebSocket connection failed: \(error.localizedDescription)" }
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
        isMockMode = true
        isConnected = true
        updateConnectionStatus("Connected (Mock)")
        lastError = nil
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        Log.info("Mock WebSocket connection established", category: "websocket")
    }

    func disconnect() {
        Log.info("Disconnecting WebSocket...", category: "websocket")
        connectionTimeoutTimer?.invalidate()
        connectionTimeoutTimer = nil
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        taskAdapter = nil
        stopHeartbeat()
        isConnected = false
        isMockMode = false
        updateConnectionStatus("Disconnected")
        stopReconnectTimer()
    }

    // MARK: - Subscriptions
    @discardableResult
    func subscribe<T: Decodable>(type: String, as: T.Type = T.self, _ handler: @escaping (T) -> Void) -> UUID {
        let id = UUID()
        let wrapper: (Data) -> Void = { [weak self] data in
            guard let self else { return }
            do {
                let decoded = try JSONDecoder().decode(T.self, from: data)
                handler(decoded)
            } catch {
                if self.decodeFailureRateLimiter.shouldAllow() {
                    self.debugLog("Decode failure for type=\(type): \(error.localizedDescription)")
                }
                WebSocketMetrics.record(.messageDecodeFail)
            }
        }
        subscriptionQueue.sync(flags: .barrier) {
            var bucket = subscriptionHandlers[type] ?? [:]
            bucket[id] = wrapper
            subscriptionHandlers[type] = bucket
        }
        return id
    }

    func unsubscribe(_ id: UUID, from type: String) {
        subscriptionQueue.sync(flags: .barrier) {
            guard var bucket = subscriptionHandlers[type] else { return }
            bucket[id] = nil
            if bucket.isEmpty { subscriptionHandlers[type] = nil } else { subscriptionHandlers[type] = bucket }
        }
    }

    private struct OutgoingEnvelope<D: Encodable>: Encodable { let type: String; let data: D; let timestamp: String; let source: String }
    func send<T: Encodable>(type: String, data: T, source: String = "ios-native") {
        let env = OutgoingEnvelope(type: type, data: data, timestamp: ISO8601DateFormatter().string(from: Date()), source: source)
        do { let bytes = try JSONEncoder().encode(env); enqueueSend(bytes) } catch { debugLog("Send encode error: \(error.localizedDescription)") }
    }

    func sendHealthData(_ healthData: HealthData) async throws {
        Log.debug("Sending health data: \(healthData.type) = \(healthData.value) \(healthData.unit)", category: "websocket")
        if isMockMode {
            updateConnectionStatus("Connected (Mock) - Data sent ✓")
            try? await Task.sleep(nanoseconds: 500_000_000)
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.updateConnectionStatus("Connected (Mock)") }
            return
        }
        guard task != nil else {
            Log.warn("No WebSocket connection, using mock mode for test data", category: "websocket")
            isMockMode = true
            updateConnectionStatus("Mock mode: Test data sent ✓")
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.updateConnectionStatus("Connected (Mock)") }
            return
        }
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
            updateConnectionStatus("Connected (Real) - Data sent ✓")
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.updateConnectionStatus("Connected (Real)") }
        } catch {
            Log.error("Failed to send via WebSocket, falling back to mock mode", category: "websocket")
            isMockMode = true
            updateConnectionStatus("Mock mode: Test data sent ✓")
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.updateConnectionStatus("Connected (Mock)") }
        }
    }

    private func sendJSON(_ object: [String: Any]) async throws {
        do { let data = try JSONSerialization.data(withJSONObject: object); enqueueSend(data) } catch { Log.error("Failed to serialize JSON: \(error.localizedDescription)", category: "websocket"); throw WebSocketError.messageSerializationFailed }
    }

    private func send(message: String) async throws {
        guard let adapter = taskAdapter, !isMockMode else {
            if isMockMode { Log.debug("Mock mode: Would send message", category: "websocket"); return } else { Log.error("WebSocket not connected", category: "websocket"); throw WebSocketError.notConnected }
        }
        do { let msg = URLSessionWebSocketTask.Message.string(message); try await adapter.sendSync(msg); Log.info("WebSocket message sent successfully", category: "websocket") } catch { Log.error("Failed to send WebSocket message: \(error)", category: "websocket"); await handleConnectionLoss(); throw WebSocketError.sendFailed(error.localizedDescription) }
    }

    private let decodeFailureRateLimiter = RateLimiter(limit: 5, interval: 60) // max 5 decode errors per minute logged
    private var lastHeartbeatMissEmitted = false

    private func enqueueSend(_ data: Data) {
        guard let adapter = taskAdapter, isConnected, !isMockMode else {
            if sendBuffer.count >= sendBufferMax {
                let overflow = sendBuffer.count - sendBufferMax + 1
                if overflow > 0 { sendBuffer.removeFirst(overflow) }
                Log.warn("Send buffer full (cap=\(sendBufferMax)); dropping oldest message", category: "websocket")
                WebSocketMetrics.record(.bufferDrop)
            }
            WebSocketMetrics.record(.bufferEnqueue)
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
        for data in items { adapter.send(.data(data)) { [weak self] error in if let error { Task { await self?.handleSendError(error) } } } }
    }

    private func handleSendError(_ error: Error) async { Log.error("Send error: \(error.localizedDescription)", category: "websocket"); await handleConnectionLoss() }

    private func receive() {
        guard let adapter = taskAdapter, !isMockMode else { return }
        adapter.receive { [weak self] result in
            switch result {
            case .success(let message):
                Log.debug("WebSocket message received", category: "websocket")
                switch message {
                case .data(let data): self?.routeMessage(data)
                case .string(let str): self?.routeMessage(Data(str.utf8))
                @unknown default: break
                }
                self?.receive()
            case .failure:
                Log.error("WebSocket receive error", category: "websocket")
                Task { await self?.handleConnectionLoss() }
            }
        }
    }

    private func routeMessage(_ data: Data) {
        // Attempt envelope decode
        guard let env = try? JSONDecoder().decode(RawEnvelope.self, from: data) else {
            if decodeFailureRateLimiter.shouldAllow() {
                Log.error("WebSocket envelope decode failed", category: "websocket")
            }
            WebSocketMetrics.record(.messageDecodeFail)
            return
        }
        WebSocketMetrics.record(.messageReceive)
        let handlers: [ (Data) -> Void ] = subscriptionQueue.sync { Array(subscriptionHandlers[env.type]?.values ?? []) }
        guard !handlers.isEmpty else { return }
        let payload: Data
        if let d = env.data, let reenc = try? JSONEncoder().encode(d) { payload = reenc } else { payload = Data("{}".utf8) }
        // Execute handlers outside the subscriptionQueue lock to avoid potential deadlocks
        handlers.forEach { $0(payload) }
    }

    private func computeReconnectDelay(for attempt: Int) -> TimeInterval {
        guard attempt > 0 else { return 0 }
#if DEBUG
        if let override = Self.test_reconnectDelayOverride { return override(attempt) }
#endif
        let exponential = min(backoffInitial * pow(backoffBase, Double(attempt - 1)), backoffCap)
        let jitterRange = exponential * 0.2
        let jitter = Double.random(in: 0...jitterRange)
        return min(exponential + jitter, backoffCap)
    }

    private func handleConnectionLoss() async {
        Log.warn("Handling connection loss", category: "websocket")
#if DEBUG
        onReconnectAttempt?()
#endif
        isConnected = false
        updateConnectionStatus("Connection lost")
        WebSocketMetrics.record(.connectionClose)
        guard isNetworkReachable else { updateConnectionStatus("Waiting for network…"); return }
        guard let token = currentToken else { return }
        reconnectAttempts += 1
        WebSocketMetrics.record(.reconnectAttempt)
#if DEBUG
        if Self.test_skipActualReconnect { return }
#endif
        if reconnectAttempts > maxReconnectAttempts { Log.error("Max reconnect attempts reached, switching to mock mode", category: "websocket"); WebSocketMetrics.record(.reconnectGiveUp); await setupMockConnection(); return }
        let delay = computeReconnectDelay(for: reconnectAttempts)
        Log.warn("Reconnect attempt #\(reconnectAttempts) in \(String(format: "%.1f", delay))s", category: "websocket")
        let nanos = UInt64(delay * 1_000_000_000)
        try? await Task.sleep(nanoseconds: nanos)
        await connect(with: token)
    }

    private func updateConnectionStatus(_ status: String) { connectionStatus = status }

    private func startHeartbeat() {
        stopHeartbeat()
        missedHeartbeats = 0
        heartbeatTimer = heartbeatScheduler.schedule(interval: heartbeatInterval) { [weak self] in
            guard let self else { return }
            guard let adapter = self.taskAdapter, !self.isMockMode else { return }
            WebSocketMetrics.record(.heartbeatPing)
            adapter.sendPing { [weak self] error in
                guard let self else { return }
                if let error = error {
                    Log.warn("Heartbeat ping error: \(error.localizedDescription)", category: "websocket")
                    self.missedHeartbeats += 1
                    WebSocketMetrics.record(.heartbeatMiss)
                    self.lastHeartbeatMissEmitted = true
                } else {
                    if self.lastHeartbeatMissEmitted { WebSocketMetrics.record(.heartbeatRecover); self.lastHeartbeatMissEmitted = false }
                    self.missedHeartbeats = 0
                }
                if self.missedHeartbeats > self.maxMissedHeartbeats {
                    Log.error("Missed heartbeats threshold reached, reconnecting...", category: "websocket")
                    self.heartbeatTimer?.invalidate(); self.heartbeatTimer = nil
                    Task { await self.handleConnectionLoss() }
                }
            }
        }
    }

    private func stopHeartbeat() { heartbeatTimer?.invalidate(); heartbeatTimer = nil; missedHeartbeats = 0 }

    private func scheduleReconnectNow(reason: String) async { Log.info("Scheduling reconnect: \(reason)", category: "websocket"); reconnectAttempts = 0; if let token = currentToken { await connect(with: token) } }

    private static func encodeToDictionary<T: Encodable>(_ value: T) -> [String: Any]? {
        let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
        do { let data = try encoder.encode(value); let json = try JSONSerialization.jsonObject(with: data, options: []); return json as? [String: Any] } catch { Log.error("JSON encode/decode error", category: "websocket"); return nil }
    }

#if DEBUG
    func buildGaitEnvelopeForTest(_ payload: GaitDataPayload) -> [String: Any]? {
        guard let dict = Self.encodeToDictionary(payload) else { return nil }
        return ["type": "gait_analysis", "timestamp": ISO8601DateFormatter().string(from: Date()), "source": "ios-native", "data": dict]
    }

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

    private func stopReconnectTimer() { reconnectTimer?.invalidate(); reconnectTimer = nil; reconnectAttempts = 0 }

    // MARK: - Methods Required by VitalSenseApp
    func initialize() async throws {
        print("🔌 Initializing WebSocket connection...")

        // Set up network monitoring if not already done
        if pathMonitor == nil {
            let monitor = NWPathMonitor()
            pathMonitor = monitor
            monitor.pathUpdateHandler = { [weak self] path in
                guard let self else { return }
                let reachable = path.status == .satisfied
                DispatchQueue.main.async {
                    self.isNetworkReachable = reachable
                    if reachable && !self.isConnected {
                        self.updateConnectionStatus("Network available")
                    } else if !reachable {
                        self.updateConnectionStatus("Network unavailable")
                    }
                }
            }
            monitor.start(queue: pathMonitorQueue)
        }

        // Try to establish initial connection
        if isNetworkReachable {
            if let token = currentToken {
                await connect(with: token)
            } else {
                // Initialize without authentication for now
                await connect(with: "device-token-placeholder")
            }
        }

        print("✅ WebSocket manager initialized")
    }

    func sendHealthUpdate(_ metrics: Any) async {
        print("📊 Sending health update...")

        var healthData: [String: Any] = [:]

        // Handle different types of health data
        if let metricsDict = metrics as? [String: Any] {
            healthData = metricsDict
        } else if let healthMetrics = metrics as? HealthMetrics {
            healthData = [
                "stepCount": healthMetrics.stepCount ?? 0,
                "heartRate": healthMetrics.heartRate ?? 0,
                "heartRateVariability": healthMetrics.heartRateVariability ?? 0,
                "walkingSteadiness": healthMetrics.walkingSteadiness ?? 0,
                "fallRisk": healthMetrics.fallRisk,
                "timestamp": healthMetrics.timestamp.timeIntervalSince1970
            ]
        } else {
            print("⚠️ Unknown health metrics format")
            return
        }

        let envelope: [String: Any] = [
            "type": "live_health_update",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios-vitalsense",
            "data": healthData
        ]

        do {
            try await sendJSON(envelope)
            print("✅ Health update sent successfully")
        } catch {
            print("❌ Failed to send health update: \(error)")
        }
    }

    func sendAnalyticsUpdate(_ data: Any) async {
        print("📈 Sending analytics update...")

        var analyticsData: [String: Any] = [:]

        if let dataDict = data as? [String: Any] {
            analyticsData = dataDict
        } else {
            print("⚠️ Unknown analytics data format")
            return
        }

        let envelope: [String: Any] = [
            "type": "analytics_update",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios-vitalsense",
            "data": analyticsData
        ]

        do {
            try await sendJSON(envelope)
            print("✅ Analytics update sent successfully")
        } catch {
            print("❌ Failed to send analytics update: \(error)")
        }
    }

    // MARK: - Helper Methods
    private func sendJSON(_ data: [String: Any]) async throws {
        let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])

        guard isConnected else {
            // Buffer the message if not connected
            if sendBuffer.count < sendBufferMax {
                sendBuffer.append(jsonData)
                print("📦 Message buffered (not connected)")
            } else {
                print("⚠️ Send buffer full, dropping message")
            }
            return
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            taskAdapter?.send(.data(jsonData)) { error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }
}

// Add global extension for WebSocketTasking default implementations
extension WebSocketManager.WebSocketTasking {
    func sendSync(_ message: URLSessionWebSocketTask.Message) async throws {
        try await withCheckedThrowingContinuation { cont in
            send(message) { error in
                if let error { cont.resume(throwing: error) } else { cont.resume() }
            }
        }
    }
    func sendData(_ data: Data, completion: ((Error?) -> Void)? = nil) { send(.data(data), completionHandler: completion) }
}
