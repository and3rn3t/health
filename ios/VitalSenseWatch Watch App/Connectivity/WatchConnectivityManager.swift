import Foundation
import WatchConnectivity
import Combine
// Uses shared message models from iOS target; ensure file added to both targets in Xcode project.

#if os(watchOS)
// MARK: - Watch Side Connectivity Manager
final class WatchAppConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchAppConnectivityManager()

    @Published private(set) var latestStatus: LiveStatusPayload?
    @Published private(set) var latestRiskSummary: FallRiskSummaryPayload?
    @Published private(set) var lastAlert: AlertPayload?
    @Published private(set) var isReachable: Bool = false
    @Published private(set) var lastContextStatus: LiveStatusPayload?
    @Published private(set) var balanceProgress: BalanceTestProgressPayload?
    @Published private(set) var balanceResult: BalanceTestResultPayload?

    // Alias for isReachable for compatibility
    var isConnectedToPhone: Bool { isReachable }

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil
    private var bufferedOutbound: [Data] = []

    override private init() {
        super.init()
        session?.delegate = self
        session?.activate()
    }

    // MARK: - Commands
    func requestLiveStatus() { sendSimple(type: .requestLiveStatus) }
    func startMonitoring() { sendSimple(type: .startMonitoring) }
    func stopMonitoring() { sendSimple(type: .stopMonitoring) }
    func triggerAssessment() { sendSimple(type: .triggerFallRiskAssessment) }
    func sendQuickEvent(_ eventData: [String: String]) {
        let payload = QuickEventPayload(data: eventData)
        let env = WatchMessageEnvelope(type: .sendQuickEvent, payload: payload)
        if let data = try? WatchMessageCodec.encode(env) { send(data) }
    }

    func sendHealthDataToPhone(_ data: [String]) {
        let payload = HealthDataPayload(healthData: data)
        let env = WatchMessageEnvelope(type: .sendQuickEvent, payload: payload)
        if let encodedData = try? WatchMessageCodec.encode(env) { send(encodedData) }
    }

    func sendHeartRateToPhone(_ heartRate: Double) {
        let payload = HeartRatePayload(heartRate: heartRate)
        let env = WatchMessageEnvelope(type: .sendQuickEvent, payload: payload)
        if let data = try? WatchMessageCodec.encode(env) { send(data) }
    }

    private func sendSimple(type: WatchMessageType) {
        let payload = QuickEventPayload(data: [:])
        let env = WatchMessageEnvelope(type: type, payload: payload)
        if let data = try? WatchMessageCodec.encode(env) { send(data) }
    }

    private func send(_ data: Data) {
        guard let session else { return }
        if session.isReachable {
            session.sendMessageData(data, replyHandler: nil, errorHandler: { err in
                print("[WatchConnectivity][Watch] send error: \(err.localizedDescription)")
            })
        } else {
            bufferedOutbound.append(data)
            if bufferedOutbound.count > 20 { bufferedOutbound.removeFirst(bufferedOutbound.count - 20) }
        }
    }

    private func handleIncoming(_ data: Data) {
        guard let type = WatchMessageCodec.decodeType(from: data) else { return }
        switch type {
        case .liveStatusUpdate:
            if let env = WatchMessageCodec.decodePayload(data, as: LiveStatusPayload.self) { DispatchQueue.main.async { self.latestStatus = env.payload } }
        case .fallRiskSummary:
            if let env = WatchMessageCodec.decodePayload(data, as: FallRiskSummaryPayload.self) { DispatchQueue.main.async { self.latestRiskSummary = env.payload } }
        case .alert:
            if let env = WatchMessageCodec.decodePayload(data, as: AlertPayload.self) { DispatchQueue.main.async { self.lastAlert = env.payload } }
        case .balanceTestProgress:
            if let env = WatchMessageCodec.decodePayload(data, as: BalanceTestProgressPayload.self) { DispatchQueue.main.async { self.balanceProgress = env.payload } }
        case .balanceTestResult:
            if let env = WatchMessageCodec.decodePayload(data, as: BalanceTestResultPayload.self) { DispatchQueue.main.async { self.balanceResult = env.payload } }
        default: break
        }
    }
}

extension WatchAppConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        isReachable = session.isReachable
        // Read latest application context snapshot if present
        if let data = session.applicationContext["liveStatus"] as? Data, let env = WatchMessageCodec.decodePayload(data, as: LiveStatusPayload.self) {
            lastContextStatus = env.payload
            if latestStatus == nil { latestStatus = env.payload }
        }
        // Flush buffered commands
        if session.isReachable { bufferedOutbound.forEach { session.sendMessageData($0, replyHandler: nil, errorHandler: nil) }; bufferedOutbound.removeAll() }
    }
    func sessionReachabilityDidChange(_ session: WCSession) { DispatchQueue.main.async { self.isReachable = session.isReachable } }
    func session(_ session: WCSession, didReceiveMessageData messageData: Data) { handleIncoming(messageData) }
}
#endif
