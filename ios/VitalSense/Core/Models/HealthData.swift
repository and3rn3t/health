import Foundation

// MARK: - Health Data Model
struct HealthData: Codable {
    let type: String
    let value: Double
    let unit: String
    let timestamp: Date
    let deviceId: String
    let userId: String
}

// MARK: - Connection Quality Monitor
class ConnectionQualityMonitor: ObservableObject {
    @Published var signalStrength: Double = 1.0
    @Published var latency: TimeInterval = 0.0
    @Published var packetLoss: Double = 0.0
    @Published var reconnectCount: Int = 0

    private var lastPingTime: Date?

    func recordPing() {
        lastPingTime = Date()
    }

    func recordPong() {
        guard let pingTime = lastPingTime else { return }
        latency = Date().timeIntervalSince(pingTime)
    }

    func recordReconnect() {
        reconnectCount += 1
    }
}
