import Foundation
import WatchConnectivity

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    @Published var isConnectedToPhone = false
    @Published var lastMessage: [String: Any] = [:]

    private override init() {
        super.init()

        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }

    func startSession() {
        if WCSession.isSupported() {
            WCSession.default.activate()
        }
    }

    // MARK: - Send Data to iPhone
    func sendHealthDataToPhone(_ data: [String: Any]) {
        guard WCSession.default.isReachable else {
            print("iPhone not reachable")
            return
        }

        var message = data
        message["source"] = "watch"
        message["type"] = "health_data"
        message["timestamp"] = Date().timeIntervalSince1970

        WCSession.default.sendMessage(message, replyHandler: { reply in
            print("Health data sent successfully: \(reply)")
        }) { error in
            print("Failed to send health data: \(error.localizedDescription)")
        }
    }

    func sendHeartRateToPhone(_ heartRate: Double) {
        guard WCSession.default.isReachable else {
            print("iPhone not reachable")
            return
        }

        let message: [String: Any] = [
            "type": "heart_rate",
            "value": heartRate,
            "timestamp": Date().timeIntervalSince1970,
            "source": "watch",
            "unit": "bpm"
        ]

        WCSession.default.sendMessage(message, replyHandler: { reply in
            print("Heart rate sent successfully: \(reply)")
        }) { error in
            print("Failed to send heart rate: \(error.localizedDescription)")
        }
    }

    func sendWorkoutDataToPhone(_ workoutData: [String: Any]) {
        guard WCSession.default.isReachable else {
            print("iPhone not reachable")
            return
        }

        var message = workoutData
        message["type"] = "workout_data"
        message["source"] = "watch"
        message["timestamp"] = Date().timeIntervalSince1970

        WCSession.default.sendMessage(message, replyHandler: { reply in
            print("Workout data sent successfully: \(reply)")
        }) { error in
            print("Failed to send workout data: \(error.localizedDescription)")
        }
    }

    // MARK: - Background Transfer
    func transferHealthDataInBackground(_ data: [String: Any]) {
        var userInfo = data
        userInfo["transfer_type"] = "health_background"
        userInfo["timestamp"] = Date().timeIntervalSince1970

        WCSession.default.transferUserInfo(userInfo)
        print("Background health data transfer initiated")
    }

    // MARK: - Send Emergency Alert
    func sendEmergencyAlert(_ alertData: [String: Any]) {
        guard WCSession.default.isReachable else {
            // If not reachable, try background transfer
            var userInfo = alertData
            userInfo["emergency"] = true
            userInfo["timestamp"] = Date().timeIntervalSince1970
            WCSession.default.transferUserInfo(userInfo)
            return
        }

        var message = alertData
        message["type"] = "emergency_alert"
        message["priority"] = "high"
        message["source"] = "watch"
        message["timestamp"] = Date().timeIntervalSince1970

        WCSession.default.sendMessage(message, replyHandler: { reply in
            print("Emergency alert sent successfully: \(reply)")
        }) { error in
            print("Failed to send emergency alert: \(error.localizedDescription)")

            // Fallback to background transfer
            var userInfo = alertData
            userInfo["emergency"] = true
            userInfo["timestamp"] = Date().timeIntervalSince1970
            WCSession.default.transferUserInfo(userInfo)
        }
    }
}

// MARK: - WCSessionDelegate
extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            switch activationState {
            case .activated:
                self.isConnectedToPhone = session.isReachable
                print("Watch Connectivity activated successfully")
            case .inactive:
                self.isConnectedToPhone = false
                print("Watch Connectivity inactive")
            case .notActivated:
                self.isConnectedToPhone = false
                print("Watch Connectivity not activated")
            @unknown default:
                self.isConnectedToPhone = false
                print("Watch Connectivity unknown state")
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isConnectedToPhone = session.isReachable
            print("Watch connectivity reachability changed: \(session.isReachable)")
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            self.lastMessage = message
            print("Watch received message: \(message)")

            // Handle different message types
            if let type = message["type"] as? String {
                switch type {
                case "config_update":
                    handleConfigUpdate(message)
                case "start_monitoring":
                    handleStartMonitoring(message)
                case "stop_monitoring":
                    handleStopMonitoring(message)
                default:
                    print("Unknown message type: \(type)")
                }
            }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
        DispatchQueue.main.async {
            self.lastMessage = message
            print("Watch received message with reply handler: \(message)")

            // Process message and send reply
            let reply: [String: Any] = [
                "status": "received",
                "timestamp": Date().timeIntervalSince1970,
                "watch_response": true
            ]

            replyHandler(reply)
        }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any]) {
        DispatchQueue.main.async {
            print("Watch received user info: \(userInfo)")

            // Handle background data transfers
            if let type = userInfo["type"] as? String {
                switch type {
                case "config_sync":
                    handleConfigSync(userInfo)
                case "health_goals":
                    handleHealthGoals(userInfo)
                default:
                    print("Unknown user info type: \(type)")
                }
            }
        }
    }

    // MARK: - Message Handlers
    private func handleConfigUpdate(_ message: [String: Any]) {
        // Update watch app configuration based on iPhone settings
        print("Handling config update: \(message)")
    }

    private func handleStartMonitoring(_ message: [String: Any]) {
        // Start health monitoring from iPhone request
        WatchHealthManager.shared.startRealTimeHeartRateMonitoring { heartRate in
            self.sendHeartRateToPhone(heartRate)
        }
    }

    private func handleStopMonitoring(_ message: [String: Any]) {
        // Stop health monitoring from iPhone request
        WatchHealthManager.shared.stopRealTimeHeartRateMonitoring()
    }

    private func handleConfigSync(_ userInfo: [String: Any]) {
        // Sync configuration data in background
        print("Syncing config: \(userInfo)")
    }

    private func handleHealthGoals(_ userInfo: [String: Any]) {
        // Update health goals from iPhone
        print("Updating health goals: \(userInfo)")
    }
}
