import Foundation
import Combine
import CryptoKit

// MARK: - Live Ingestion Client
// Posts live gait snapshots and balance test progress/results to backend Worker endpoints.
// Uses simple delta + interval throttling to avoid network noise.

final class LiveIngestionClient {
    static let shared = LiveIngestionClient()

    private let session = URLSession(configuration: .ephemeral)
    private var cancellables = Set<AnyCancellable>()
    // Last snapshot used for delta comparison
    private var lastGaitSent: GaitMetricsSnapshot?
    private var lastGaitSentAt: Date = .distantPast
    // Single snapshot throttling (still used to decide when to insert into batch)
    private let minInterval: TimeInterval = 10
    private let speedDeltaThreshold: Double = 0.05
    private let freqDeltaThreshold: Double = 3
    // Batching configuration
    private let maxBatchSize = 5
    private let maxBatchInterval: TimeInterval = 20
    private let significantSpeedDelta: Double = 0.18
    private let significantFreqDelta: Double = 10
    // Buffers / queues
    private var batchBuffer: [GaitMetricsSnapshot] = []
    private var lastFlushAt: Date = .distantPast
    // Pending retry payloads (persisted). Each element holds encoded JSON payload and attempt number.
    private var pendingRetries: [(payload: Data, attempt: Int)] = [] {
        didSet { persistRetryQueue() }
    }
    // Telemetry
    enum TelemetryEvent: Equatable {
        case gaitBuffered(count: Int)
        case batchFlush(reason: String, snapshots: Int)
        case batchSuccess(latencyMs: Int, size: Int)
        case batchFailure(status: Int?, attempt: Int)
        case retryScheduled(afterSeconds: Int, attempt: Int)
        case retryDropped(maxAttemptsReached: Int)
        case retryRestored(count: Int)
        case retryQueuePersisted(count: Int)
        case retryDeduped(originalAttempt: Int, newAttempt: Int)
        // Extended correlation / simulation / energy gating
        case batchIdentified(id: String, reason: String, snapshots: Int)
        case batchSuccessCorrelated(id: String, latencyMs: Int, size: Int)
        case batchFailureCorrelated(id: String, status: Int?, attempt: Int)
        case simulationEnabled(probability: Double)
        case energyGateActive(idleSeconds: Int)
        case logTrimmed(newSizeBytes: Int)
        case logWriteError
    }
    private let telemetrySubject = PassthroughSubject<TelemetryEvent, Never>()
    var telemetryPublisher: AnyPublisher<TelemetryEvent, Never> { telemetrySubject.eraseToAnyPublisher() }
    // Queues / timers
    private let batchQueue = DispatchQueue(label: "liveIngestion.batch")
    private let retryQueue = DispatchQueue(label: "liveIngestion.retry")
    private var flushTimer: DispatchSourceTimer?
    private let logQueue = DispatchQueue(label: "liveIngestion.log")
    // Date formatter
    private lazy var isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private var baseURL: URL { URL(string: AppConfig.shared.baseAPIUrl ?? "http://127.0.0.1:8789")! }

    private let retryStoreKey = "liveIngestion.retryQueue.v1"
    private var simulationFailureProbability: Double = 0.0
    private var energyGatingEnabled: Bool = false
    private let energyIdleThreshold: TimeInterval = 60 // seconds idle before gating flush
    private var logWriter: RollingLogWriter?
    private var batchCorrelation: [String: String] = [:] // payloadID -> batchID

    private init() {
        restoreRetryQueue()
        setupLogWriter()
    }

    func start(gaitProvider: GaitLiveMetricsProvider, fallRiskManager: FallRiskAssessmentManager) {
        setupFlushTimer()
        // Kick off any restored retries
        retryQueue.async { [weak self] in
            self?.pendingRetries.forEach { item in
                self?.attemptRetry(payload: item.payload, attempt: item.attempt)
            }
            if !(self?.pendingRetries.isEmpty ?? true) {
                self?.telemetrySubject.send(.retryRestored(count: self?.pendingRetries.count ?? 0))
            }
        }
        // Gait snapshots
        gaitProvider.publisher
            .receive(on: DispatchQueue.global(qos: .utility))
            .sink { [weak self] snap in self?.maybeBufferGait(snapshot: snap) }
            .store(in: &cancellables)

        // Balance progress
        fallRiskManager.balanceTestProgressPublisher
            .receive(on: DispatchQueue.global(qos: .utility))
            .sink { [weak self] progress in self?.sendBalanceProgress(progress) }
            .store(in: &cancellables)

        // Balance result
        fallRiskManager.balanceTestResultPublisher
            .receive(on: DispatchQueue.global(qos: .utility))
            .sink { [weak self] result in self?.sendBalanceResult(result) }
            .store(in: &cancellables)
    }

    // MARK: - Gait Batching
    private func maybeBufferGait(snapshot: GaitMetricsSnapshot) {
        batchQueue.async { [weak self] in
            guard let self else { return }
            let now = Date()
            let shouldConsider = now.timeIntervalSince(self.lastGaitSentAt) >= self.minInterval
            let speedDelta = abs(snapshot.speed - (self.lastGaitSent?.speed ?? snapshot.speed))
            let freqDelta = abs(snapshot.stepFrequency - (self.lastGaitSent?.stepFrequency ?? snapshot.stepFrequency))
            let changed = speedDelta >= self.speedDeltaThreshold || freqDelta >= self.freqDeltaThreshold
            // If neither time nor change threshold met, skip buffering to reduce noise
            guard shouldConsider || changed else { return }
            self.lastGaitSent = snapshot
            self.lastGaitSentAt = now
            self.batchBuffer.append(snapshot)
            telemetrySubject.send(.gaitBuffered(count: self.batchBuffer.count))
            let significant = speedDelta >= self.significantSpeedDelta || freqDelta >= self.significantFreqDelta
            if self.batchBuffer.count >= self.maxBatchSize || significant {
                self.flushBatch(reason: significant ? "significant_change" : "size")
            }
        }
    }

    private func setupFlushTimer() {
        flushTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(queue: batchQueue)
        timer.schedule(deadline: .now() + maxBatchInterval, repeating: maxBatchInterval / 2)
        timer.setEventHandler { [weak self] in
            guard let self else { return }
            let now = Date()
            if !self.batchBuffer.isEmpty && now.timeIntervalSince(self.lastFlushAt) >= self.maxBatchInterval {
                if self.energyGatingEnabled {
                    let idle = now.timeIntervalSince(self.lastGaitSentAt)
                    if idle >= self.energyIdleThreshold {
                        self.telemetrySubject.send(.energyGateActive(idleSeconds: Int(idle)))
                        return
                    }
                    if ProcessInfo.processInfo.isLowPowerModeEnabled {
                        self.telemetrySubject.send(.energyGateActive(idleSeconds: Int(now.timeIntervalSince(self.lastGaitSentAt))))
                        return
                    }
                }
                self.flushBatch(reason: "interval")
            }
        }
        flushTimer = timer
        timer.resume()
    }

    private func flushBatch(reason: String) {
        let snapshots = batchBuffer
        guard !snapshots.isEmpty else { return }
        batchBuffer.removeAll(keepingCapacity: true)
        lastFlushAt = Date()
        let batchID = UUID().uuidString
        let payloadSnapshots: [[String: Any]] = snapshots.map { s in
            [
                "speed": s.speed,
                "stepFrequency": s.stepFrequency,
                "asymmetry": s.asymmetry as Any,
                "variability": s.variability as Any,
                "capturedAt": isoFormatter.string(from: s.timestamp)
            ]
        }
        let json: [String: Any] = [
            "snapshots": payloadSnapshots,
            "capturedAt": isoFormatter.string(from: Date()),
            "reason": reason,
            "batchId": batchID
        ]
        telemetrySubject.send(.batchFlush(reason: reason, snapshots: snapshots.count))
        telemetrySubject.send(.batchIdentified(id: batchID, reason: reason, snapshots: snapshots.count))
        postBatch(jsonBody: json)
    }

    private func postBatch(jsonBody: [String: Any]) {
        let start = Date()
        guard let data = try? JSONSerialization.data(withJSONObject: jsonBody, options: []) else { return }
        // correlate payload->batchId
        if let batchID = jsonBody["batchId"] as? String {
            batchCorrelation[stablePayloadID(data)] = batchID
        }
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/live/gait/batch"))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = DeviceAuthTokenCache.shared.currentToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = data
        // Simulated failure path
        if simulationFailureProbability > 0, Double.random(in: 0..<1) < simulationFailureProbability {
            scheduleRetry(payload: data, attempt: 1, error: NSError(domain: "Simulated", code: -1))
            logLine("SIM_FAIL batch simulated -> retry scheduled")
            return
        }
        session.dataTask(with: request) { [weak self] _, response, error in
            guard let self else { return }
            if let error = error {
                self.scheduleRetry(payload: data, attempt: 1, error: error)
                return
            }
            if let http = response as? HTTPURLResponse, http.statusCode >= 300 {
                self.scheduleRetry(payload: data, attempt: 1, error: nil)
            } else {
                let latency = Int(Date().timeIntervalSince(start) * 1000)
                self.telemetrySubject.send(.batchSuccess(latencyMs: latency, size: data.count))
                if let bid = self.batchCorrelation[self.stablePayloadID(data)] {
                    self.telemetrySubject.send(.batchSuccessCorrelated(id: bid, latencyMs: latency, size: data.count))
                }
            }
        }.resume()
    }

    private func scheduleRetry(payload: Data, attempt: Int, error: Error?) {
        // Add / update pending retries list (dedupe by stable SHA256 id)
        let id = stablePayloadID(payload)
        if let idx = pendingRetries.firstIndex(where: { stablePayloadID($0.payload) == id }) {
            let previous = pendingRetries[idx].attempt
            pendingRetries[idx] = (payload, attempt)
            telemetrySubject.send(.retryDeduped(originalAttempt: previous, newAttempt: attempt))
        } else {
            pendingRetries.append((payload, attempt))
        }
        guard attempt <= 5 else {
            telemetrySubject.send(.retryDropped(maxAttemptsReached: attempt))
            return
        }
        let delaySeconds = Int(min(pow(2.0, Double(attempt)) * 2.0, 60.0))
        telemetrySubject.send(.batchFailure(status: nil, attempt: attempt))
        telemetrySubject.send(.retryScheduled(afterSeconds: delaySeconds, attempt: attempt))
        retryQueue.asyncAfter(deadline: .now() + .seconds(delaySeconds)) { [weak self] in
            self?.attemptRetry(payload: payload, attempt: attempt)
        }
    }

    private func attemptRetry(payload: Data, attempt: Int) {
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/live/gait/batch"))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = DeviceAuthTokenCache.shared.currentToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = payload
        session.dataTask(with: request) { [weak self] _, response, error in
            guard let self else { return }
            if let error = error {
                self.scheduleRetry(payload: payload, attempt: attempt + 1, error: error)
                return
            }
            if let http = response as? HTTPURLResponse, http.statusCode >= 300 {
                telemetrySubject.send(.batchFailure(status: http.statusCode, attempt: attempt))
                self.scheduleRetry(payload: payload, attempt: attempt + 1, error: nil)
            } else {
                // Success: remove from pending
                if let idx = self.pendingRetries.firstIndex(where: { stablePayloadID($0.payload) == stablePayloadID(payload) }) {
                    self.pendingRetries.remove(at: idx)
                }
                let latency = 0 // latency not tracked on retry to keep simple
                telemetrySubject.send(.batchSuccess(latencyMs: latency, size: payload.count))
                if let bid = self.batchCorrelation[self.stablePayloadID(payload)] {
                    telemetrySubject.send(.batchSuccessCorrelated(id: bid, latencyMs: latency, size: payload.count))
                }
            }
        }.resume()
    }

    // Stable SHA256 hex digest for payload identity
    private func stablePayloadID(_ data: Data) -> String {
        let digest = SHA256.hash(data: data)
        return digest.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Persistence
    private func persistRetryQueue() {
        let items = pendingRetries.map { ["payload": $0.payload.base64EncodedString(), "attempt": String($0.attempt)] }
        if let data = try? JSONSerialization.data(withJSONObject: items, options: []) {
            UserDefaults.standard.set(data, forKey: retryStoreKey)
            telemetrySubject.send(.retryQueuePersisted(count: pendingRetries.count))
        }
    }

    private func restoreRetryQueue() {
        guard let data = UserDefaults.standard.data(forKey: retryStoreKey) else { return }
        guard let raw = try? JSONSerialization.jsonObject(with: data, options: []) as? [[String: String]] else { return }
        let restored: [(Data, Int)] = raw.compactMap { dict in
            guard let payloadB64 = dict["payload"], let attemptStr = dict["attempt"], let payload = Data(base64Encoded: payloadB64), let attempt = Int(attemptStr) else { return nil }
            return (payload, attempt)
        }
        pendingRetries = restored
    }

#if DEBUG
    // MARK: - Test Hooks (DEBUG only)
    func _testClearAllRetries() { pendingRetries.removeAll() }
    func _testInjectRetry(json: [String: Any], attempt: Int) {
        if let data = try? JSONSerialization.data(withJSONObject: json, options: []) {
            scheduleRetry(payload: data, attempt: attempt, error: nil)
        }
    }
    func _testPendingRetries() -> [(Data, Int)] { pendingRetries }
    func _testForceRestore() { restoreRetryQueue() }
    func _setSimulationProbability(_ p: Double) { simulationFailureProbability = max(0, min(1, p)); telemetrySubject.send(.simulationEnabled(probability: simulationFailureProbability)) }
    func _setEnergyGatingEnabled(_ enabled: Bool) { energyGatingEnabled = enabled }
    func _currentConfig() -> (simulationProbability: Double, energyGating: Bool) { (simulationFailureProbability, energyGatingEnabled) }
#endif

    // MARK: - Logging
    private func setupLogWriter() {
        logWriter = try? RollingLogWriter(filename: "live_ingestion_diagnostics.log", maxBytes: 65_536)
    }
    private func logLine(_ line: String) {
        logQueue.async { [weak self] in
            do {
                try self?.logWriter?.append(line: line)
            } catch RollingLogWriter.TrimmedError.trimmed(let size) {
                self?.telemetrySubject.send(.logTrimmed(newSizeBytes: size))
            } catch {
                self?.telemetrySubject.send(.logWriteError)
            }
        }
    }

    private func sendBalanceProgress(_ p: BalanceTestProgress) {
        let payload: [String: Any] = [
            "percent": p.percent,
            "instantaneousStability": p.instantaneousStability as Any,
            "elapsedSeconds": p.elapsed,
            "testKind": p.testKind as Any,
            "capturedAt": ISO8601DateFormatter().string(from: Date())
        ]
        post(path: "/api/live/balance/progress", json: payload)
    }

    private func sendBalanceResult(_ r: BalanceTestResultEvent) {
        let payload: [String: Any] = [
            "overallScore": r.overallScore,
            "componentScores": r.componentScores,
            "testKind": r.testKind as Any,
            "capturedAt": ISO8601DateFormatter().string(from: Date())
        ]
        post(path: "/api/live/balance/result", json: payload)
    }

    private func post(path: String, json: [String: Any]) {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = DeviceAuthTokenCache.shared.currentToken { request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        request.httpBody = try? JSONSerialization.data(withJSONObject: json, options: [])
        session.dataTask(with: request) { _, _, _ in }.resume()
    }
}

// Lightweight token cache (assuming existing device token flow)
final class DeviceAuthTokenCache {
    static let shared = DeviceAuthTokenCache()
    private init() {}
    var currentToken: String?
}
