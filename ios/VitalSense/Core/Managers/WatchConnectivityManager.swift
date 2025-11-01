import Foundation
import WatchConnectivity
import Combine

#if os(iOS)
// MARK: - iPhone Side Connectivity Manager
// Bridges live gait / fall risk metrics to the Watch and receives remote control commands.
final class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    @Published private(set) var isPaired: Bool = false
    @Published private(set) var isWatchAppInstalled: Bool = false
    @Published private(set) var lastSentStatus: LiveStatusPayload?
    @Published private(set) var lastCommandAt: Date?

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil
    private var cancellables = Set<AnyCancellable>()
    private var statusTimer: Timer?
    private var adaptiveInterval: TimeInterval = 15
    private var lastStatusSentAt: Date = .distantPast
    private var bufferedCommands: [Data] = []
    private var quickEventBuffer: [QuickEventPayload] = [] // ring buffer semantics
    private let quickEventBufferMax = 25
    private var balanceTestProgressCancellable: AnyCancellable?

    // Dependencies (lightweight abstractions to avoid direct tight coupling)
    private weak var fallRiskManager: FallRiskAssessmentManager?
    private weak var webSocketManager: WebSocketManager? = WebSocketManager.shared
    private let gaitProvider = GaitLiveMetricsProvider.shared

    // Provide an external way to inject managers after their initialization.
    func configure(fallRiskManager: FallRiskAssessmentManager?) {
        self.fallRiskManager = fallRiskManager
        subscribeToGait()
        subscribeToBalanceProgress()
    }

    override private init() {
        super.init()
        session?.delegate = self
        session?.activate()
        startStatusTimer()
    }

    deinit { statusTimer?.invalidate() }

    // MARK: - Periodic status
    private func startStatusTimer() {
        statusTimer?.invalidate()
        statusTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.adaptiveTick()
        }
        if let timer = statusTimer { RunLoop.main.add(timer, forMode: .common) }
    }

    private func adaptiveTick() {
        // Adjust interval heuristics: active assessment → 10s, idle → 30-60s.
        let assessing = fallRiskManager?.isAssessing == true
        adaptiveInterval = assessing ? 10 : 30
        // If more than interval since last send, push update (even if not reachable we'll update context)
        if Date().timeIntervalSince(lastStatusSentAt) >= adaptiveInterval {
            sendLiveStatusUpdate(reason: "adaptive")
        }
    }

    func sendLiveStatusUpdate(reason: String) {
        guard let session else { return }
        let payload = buildLiveStatusPayload()
        lastSentStatus = payload
        lastStatusSentAt = Date()
        let env = WatchMessageEnvelope(type: .liveStatusUpdate, payload: payload)
        if let data = try? WatchMessageCodec.encode(env) {
            // Always update application context with the latest snapshot for fallback
            try? session.updateApplicationContext(["liveStatus": data])
            if session.isReachable {
                session.sendMessageData(data, replyHandler: nil, errorHandler: { err in
                    print("[WatchConnectivity] sendMessageData error: \(err.localizedDescription)")
                })
            }
        }
    }

    private func buildLiveStatusPayload() -> LiveStatusPayload {
        // We only have fall risk manager for some details; gait metrics are placeholders until integrated.
        let fr = fallRiskManager
        let riskLevel = fr?.currentRiskLevel.rawValue
        let minutesAgo: Int? = fr?.assessmentHistory.first.flatMap { Int(Date().timeIntervalSince($0.timestamp) / 60) }
        let gait = gaitProvider.currentSnapshot
        return LiveStatusPayload(
            isMonitoring: fr?.isAssessing ?? false,
            walkingSpeed: gait?.speed,
            stepFrequency: gait?.stepFrequency,
            asymmetry: gait?.asymmetry,
            variability: gait?.variability,
            fallRiskLevel: riskLevel,
            connectionStatus: webSocketManager?.connectionStatus ?? "n/a",
            lastAssessmentMinutesAgo: minutesAgo
        )
    }

    // MARK: - Incoming command handling
    private func handleCommand(_ data: Data) {
        guard let type = WatchMessageCodec.decodeType(from: data) else { return }
        lastCommandAt = Date()
        switch type {
        case .requestLiveStatus:
            sendLiveStatusUpdate(reason: "on-demand")
        case .startMonitoring:
            Task { await fallRiskManager?.performComprehensiveAssessment(); sendLiveStatusUpdate(reason: "after start") }
        case .stopMonitoring:
            // No explicit stop in current manager – future hook.
            break
        case .triggerFallRiskAssessment:
            Task { try? await fallRiskManager?.performComprehensiveAssessment(); sendLatestFallRiskSummary() }
        case .performBalanceTest:
            // Trigger a standalone dynamic balance test simulation for now.
            fallRiskManager?.performBalanceTestStandalone(kind: .dynamic)
        case .acknowledgeAlert:
            // Mark alert as acknowledged in local storage
            AlertStorage.shared.acknowledgeAlert(userInfo["alertId"] as? String ?? "")
            sendMessage(.alertAcknowledged, userInfo: ["status": "success"])
        case .sendQuickEvent:
            // Decode the quick event and buffer it.
            if let env = WatchMessageCodec.decodePayload(data, as: QuickEventPayload.self) {
                quickEventBuffer.append(env.payload)
                if quickEventBuffer.count > quickEventBufferMax { quickEventBuffer.removeFirst(quickEventBuffer.count - quickEventBufferMax) }
            }
        default:
            break
        }
    }

    private func sendLatestFallRiskSummary() {
        guard let session, session.isReachable, let fr = fallRiskManager else { return }
        guard let latest = fr.assessmentHistory.first else { return }
        let high = fr.riskFactors.filter { $0.severity == .high }.map { $0.type.rawValue }
        let medium = fr.riskFactors.filter { $0.severity == .medium }.map { $0.type.rawValue }
        let summary = FallRiskSummaryPayload(
            riskLevel: fr.currentRiskLevel.rawValue,
            score: latest.balanceScore,
            highSeverityFactors: high,
            mediumSeverityFactors: medium,
            recommendations: fr.recommendations.map { $0.title }
        )
        let env = WatchMessageEnvelope(type: .fallRiskSummary, payload: summary)
        if let data = try? WatchMessageCodec.encode(env) { session.sendMessageData(data, replyHandler: nil, errorHandler: nil) }
    }

    // MARK: - Subscriptions
    private func subscribeToGait() {
        gaitProvider.publisher
            .throttle(for: .seconds(5), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] _ in self?.sendLiveStatusUpdate(reason: "gait") }
            .store(in: &cancellables)
    }

    private func subscribeToBalanceProgress() {
        fallRiskManager?.balanceTestProgressPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] progress in
                guard let self, let session = self.session, session.isReachable else { return }
                let payload = BalanceTestProgressPayload(
                    percent: progress.percent,
                    instantaneousStability: progress.instantaneousStability,
                    elapsedSeconds: progress.elapsed,
                    testKind: progress.testKind
                )
                let env = WatchMessageEnvelope(type: .balanceTestProgress, payload: payload)
                if let data = try? WatchMessageCodec.encode(env) { session.sendMessageData(data, replyHandler: nil, errorHandler: nil) }
            }
            .store(in: &cancellables)

        fallRiskManager?.balanceTestResultPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] result in
                guard let self, let session = self.session, session.isReachable else { return }
                let payload = BalanceTestResultPayload(
                    overallScore: result.overallScore,
                    componentScores: result.componentScores,
                    testKind: result.testKind
                )
                let env = WatchMessageEnvelope(type: .balanceTestResult, payload: payload)
                if let data = try? WatchMessageCodec.encode(env) { session.sendMessageData(data, replyHandler: nil, errorHandler: nil) }
            }
            .store(in: &cancellables)
    }
}

// MARK: - WCSessionDelegate (iPhone)
extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        isPaired = session.isPaired
        isWatchAppInstalled = session.isWatchAppInstalled
        if error != nil { print("[WatchConnectivity] Activation error: \(error!.localizedDescription)") }
        // Flush any buffered commands if we stored some (currently we buffer only if not reachable; this hook ensures context push).
        if session.isReachable {
            for cmd in bufferedCommands { session.sendMessageData(cmd, replyHandler: nil, errorHandler: nil) }
            bufferedCommands.removeAll()
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    func session(_ session: WCSession, didReceiveMessageData messageData: Data) { handleCommand(messageData) }
}
#endif
