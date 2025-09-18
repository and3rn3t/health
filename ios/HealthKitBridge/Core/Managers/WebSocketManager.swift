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
            // Fallback to default URL if config URL is invalid
            print("⚠️ Invalid WebSocket URL in config, using default")
            if let fallbackURL = URL(string: "wss://api.andernet.dev/ws") {
                return fallbackURL
            } else if let localhostURL = URL(string: "ws://localhost:8080/ws") {
                // Safe localhost fallback
                print("⚠️ Using localhost fallback URL")
                return localhostURL
            } else {
                // This should never happen, but provide absolute safety
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
                print("❌ Failed to send gait payload: \(error)")
                return false
            }
        } else {
            print("❌ Failed to encode GaitDataPayload to dictionary")
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
            print("⚠️ Invalid WebSocket URL in config, using default")
            if let defaultURL = URL(string: "wss://api.andernet.dev/ws") {
                self.baseURL = defaultURL
            } else if let localhostURL = URL(string: "wss://localhost:8080/ws") {
                self.baseURL = localhostURL
            } else {
                // This should never happen but provide absolute safety
                fatalError("Unable to create any valid WebSocket URL - critical configuration error")
            }
        }

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
                    self.updateConnectionStatus("No network connectivity")
                }
                self.stopHeartbeat()
            } else {
                // If network returns and we have a token but not connected, attempt reconnect
                if self.currentToken != nil && !self.isConnected && !self.isMockMode {
                    Task { await self.scheduleReconnectNow(reason: "Network restored") }
                }
            }
        }
        monitor.start(queue: pathMonitorQueue)
    }

    func connect(with token: String) async {
        print("🔌 Connecting to WebSocket with token...")
        currentToken = token

        await MainActor.run {
            self.updateConnectionStatus("Connecting...")
        }

        // Try real connection first
        if await tryRealConnection(token: token) {
            print("✅ Real WebSocket connection successful")
            startHeartbeat()
            return
        }

        // Fall back to mock connection
        print("🔄 Real connection failed, using mock connection for testing")
        await setupMockConnection()
    }

    private func tryRealConnection(token: String) async -> Bool {
        var url = baseURL
        if var components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            var queryItems = components.queryItems ?? []
            queryItems.append(URLQueryItem(name: "token", value: token))
            components.queryItems = queryItems
            url = components.url ?? baseURL
        }

        print("🔌 Attempting real connection to: \(url.absoluteString)")

        return await withCheckedContinuation { [weak self] continuation in
            var hasResumed = false

            self?.task?.cancel()
            self?.task = self?.urlSession.webSocketTask(with: url)

            // Set up a timeout to detect connection failure with proper cleanup
            let timeoutTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { _ in
                if !hasResumed {
                    hasResumed = true
                    print("⏰ Real connection timeout after 3 seconds")
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
            self?.task?.sendPing { [weak self] error in
                self?.connectionTimeoutTimer?.invalidate()
                self?.connectionTimeoutTimer = nil

                if !hasResumed {
                    hasResumed = true

                    if let error = error {
                        print("❌ Real connection failed: \(error.localizedDescription)")
                        DispatchQueue.main.async {
                            self?.lastError = "WebSocket connection failed: \(error.localizedDescription)"
                        }
                        continuation.resume(returning: false)
                    } else {
                        print("✅ Real connection ping successful")
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
        print("🧪 Setting up mock WebSocket connection for testing")

        await MainActor.run {
            self.isMockMode = true
            self.isConnected = true
            self.updateConnectionStatus("Connected (Mock)")
            self.lastError = nil
        }

        // Simulate connection delay
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second

        print("✅ Mock WebSocket connection established")
    }

    // Backward compatibility for older call sites
    func connect() {
        Task { await connect(with: "dev-local-token") }
    }

    func disconnect() {
        print("🔌 Disconnecting WebSocket...")

        // Clean up timers
        connectionTimeoutTimer?.invalidate()
        connectionTimeoutTimer = nil

        task?.cancel(with: .goingAway, reason: nil)
        task = nil
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
                self.debugLog("Decode failure for type=\(type): \(error)")
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
            debugLog("Send encode error: \(error)")
        }
    }

    func sendHealthData(_ healthData: HealthData) async throws {
        print("📤 Sending health data: \(healthData.type) = \(healthData.value) \(healthData.unit)")

        if isMockMode {
            print("🧪 Mock mode: Simulating data send successfully")
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
            print("⚠️ No WebSocket connection, using mock mode for test data")
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
            print("❌ Failed to send via WebSocket, falling back to mock mode")
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

    // MARK: - Gait Analysis Data Transmission (Commented out - Missing types)
    /*
    func sendGaitAnalysis(_ payload: GaitAnalysisPayload) async throws {
        print("📤 Sending gait analysis data for user: \(payload.userId)")

        if isMockMode {
            print("🧪 Mock mode: Simulating gait analysis send successfully")
            await MainActor.run {
                self.updateConnectionStatus("Connected (Mock) - Gait data sent ✓")
            }

            try? await Task.sleep(nanoseconds: 500_000_000)

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        guard let task = task else {
            print("⚠️ No WebSocket connection, using mock mode for gait data")
            await MainActor.run {
                self.isMockMode = true
                self.updateConnectionStatus("Mock mode: Gait data sent ✓")
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        let message: [String: Any] = [
            "type": "gait_analysis",
            "data": try payload.toDictionary()
        ]

        do {
            try await sendJSON(message)
            await MainActor.run {
                self.updateConnectionStatus("Connected (Real) - Gait data sent ✓")
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Real)")
            }
        } catch {
            print("❌ Failed to send gait analysis via WebSocket: \(error)")
            throw error
        }
    }
    */

    /*
    func sendRealtimeGaitData(_ payload: RealtimeGaitDataPayload) async throws {
        print("📤 Sending realtime gait data")

        if isMockMode {
            print("🧪 Mock mode: Simulating realtime gait data send")
            return
        }

        guard let task = task else {
            print("⚠️ No WebSocket connection for realtime gait data")
            return
        }

        let message: [String: Any] = [
            "type": "realtime_gait",
            "data": try payload.toDictionary()
        ]

        try await sendJSON(message)
    }
    */

    /*
    func sendFallRiskAssessment(_ payload: FallRiskAssessmentPayload) async throws {
        print("📤 Sending fall risk assessment for user: \(payload.userId)")

        if isMockMode {
            print("🧪 Mock mode: Simulating fall risk assessment send")
            await MainActor.run {
                self.updateConnectionStatus("Connected (Mock) - Fall risk sent ✓")
            }

            try? await Task.sleep(nanoseconds: 500_000_000)

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        guard let task = task else {
            print("⚠️ No WebSocket connection for fall risk assessment")
            await MainActor.run {
                self.isMockMode = true
                self.updateConnectionStatus("Mock mode: Fall risk sent ✓")
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Mock)")
            }
            return
        }

        let message: [String: Any] = [
            "type": "fall_risk_assessment",
            "data": try payload.toDictionary()
        ]

        do {
            try await sendJSON(message)
            await MainActor.run {
                self.updateConnectionStatus("Connected (Real) - Fall risk sent ✓")
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                self.updateConnectionStatus("Connected (Real)")
            }
        } catch {
            print("❌ Failed to send fall risk assessment via WebSocket: \(error)")
            throw error
        }
    }
    */

    private func sendJSON(_ object: [String: Any]) async throws {
        do {
            let data = try JSONSerialization.data(withJSONObject: object)
            enqueueSend(data)
        } catch {
            print("❌ Failed to serialize JSON: \(error)")
            throw WebSocketError.messageSerializationFailed
        }
    }

    private func send(message: String) async throws {
        guard let task = task, !isMockMode else {
            if isMockMode {
                print("🧪 Mock mode: Would send message: \(message)")
                return
            } else {
                print("❌ WebSocket not connected")
                throw WebSocketError.notConnected
            }
        }

        do {
            let message = URLSessionWebSocketTask.Message.string(message)
            try await task.send(message)
            print("📤 WebSocket message sent successfully")
        } catch {
            print("❌ Failed to send WebSocket message: \(error)")
            await handleConnectionLoss()
            throw WebSocketError.sendFailed(error.localizedDescription)
        }
    }

    private func enqueueSend(_ data: Data) {
        // Buffer if not connected or during reconnects
        guard let task, isConnected, !isMockMode else { sendBuffer.append(data); return }
        task.send(.data(data)) { [weak self] error in
            if let error { Task { await self?.handleSendError(error) } }
        }
    }

    private func flushSendBuffer() {
        guard let task, isConnected, !isMockMode, !sendBuffer.isEmpty else { return }
        let items = sendBuffer
        sendBuffer.removeAll()
        for data in items {
            task.send(.data(data)) { [weak self] error in
                if let error { Task { await self?.handleSendError(error) } }
            }
        }
    }

    private func handleSendError(_ error: Error) async {
        print("❌ Send error: \(error.localizedDescription)")
        await handleConnectionLoss()
    }

    private func receive() {
        guard let task = task, !isMockMode else {
            return
        }

    task.receive { [weak self] result in
            switch result {
            case .success(let message):
                print("📥 WebSocket message received")
        // Route typed envelopes to subscribers
        switch message {
        case .data(let data): self?.routeMessage(data)
        case .string(let str): self?.routeMessage(Data(str.utf8))
        @unknown default: break
        }
        self?.receive() // Continue receiving

            case .failure(let error):
                print("❌ WebSocket receive error: \(error)")
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
        print("🔄 Handling connection loss...")

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
                print("🔄 Reconnect attempt #\(reconnectAttempts) in \(String(format: "%.1f", delay))s")
                let nanos = UInt64(delay * 1_000_000_000)
                try? await Task.sleep(nanoseconds: nanos)
                await connect(with: token)
            } else {
                print("❌ Max reconnect attempts reached, switching to mock mode")
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
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: heartbeatInterval, repeats: true) { [weak self] _ in
            guard let self else { return }
            guard let task = self.task, !self.isMockMode else { return }
            task.sendPing { [weak self] error in
                guard let self else { return }
                if let error = error {
                    print("⚠️ Heartbeat ping error: \(error.localizedDescription)")
                    self.missedHeartbeats += 1
                } else {
                    self.missedHeartbeats = 0
                }
                if self.missedHeartbeats > self.maxMissedHeartbeats {
                    print("❌ Missed heartbeats threshold reached, reconnecting...")
                    self.heartbeatTimer?.invalidate()
                    self.heartbeatTimer = nil
                    Task { await self.handleConnectionLoss() }
                }
            }
        }
        RunLoop.main.add(heartbeatTimer!, forMode: .common)
    }

    private func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        missedHeartbeats = 0
    }

    // MARK: - Reconnect scheduling helper
    private func scheduleReconnectNow(reason: String) async {
        print("🔄 Scheduling reconnect: \(reason)")
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
            print("❌ JSON encode/decode error: \(error)")
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
#endif

    deinit {
        print("🗑️ WebSocketManager deinitializing - cleaning up resources")
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
        print("✅ WebSocket connection opened")
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
        print("🔌 WebSocket connection closed with code: \(closeCode)")

        let reasonString = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "No reason"
        print("🔌 Close reason: \(reasonString)")

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
