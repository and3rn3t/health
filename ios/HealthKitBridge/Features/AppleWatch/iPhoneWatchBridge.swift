import Foundation
import WatchConnectivity
import HealthKit

// MARK: - iPhone-Watch Communication Bridge
class iPhoneWatchBridge: NSObject, ObservableObject {
    static let shared = iPhoneWatchBridge()
    
    @Published var isWatchAppInstalled = false
    @Published var isWatchConnected = false
    @Published var watchGaitMonitoringActive = false
    @Published var realtimeWatchData: RealtimeGaitDataPayload?
    
    private var session: WCSession?
    
    override init() {
        super.init()
        setupWatchConnectivity()
    }
    
    // MARK: - Watch Connectivity Setup
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    // MARK: - Watch Communication
    func startWatchGaitMonitoring() {
        guard let session = session, session.isReachable else {
            print("⚠️ Apple Watch not reachable")
            return
        }
        
        let message = ["type": "start_gait_monitoring"]
        
        session.sendMessage(message, replyHandler: { response in
            print("✅ Watch gait monitoring started: \(response)")
        }) { error in
            print("❌ Failed to start watch gait monitoring: \(error)")
        }
    }
    
    func stopWatchGaitMonitoring() {
        guard let session = session, session.isReachable else {
            print("⚠️ Apple Watch not reachable")
            return
        }
        
        let message = ["type": "stop_gait_monitoring"]
        
        session.sendMessage(message, replyHandler: { response in
            print("✅ Watch gait monitoring stopped: \(response)")
        }) { error in
            print("❌ Failed to stop watch gait monitoring: \(error)")
        }
    }
    
    func sendGaitConfigurationToWatch(_ config: WatchGaitConfig) {
        guard let session = session, session.isReachable else {
            print("⚠️ Apple Watch not reachable for config update")
            return
        }
        
        let configData: [String: Any] = [
            "type": "gait_config_update",
            "monitoringInterval": config.monitoringInterval,
            "sensitivityLevel": config.sensitivityLevel.rawValue,
            "backgroundMonitoring": config.backgroundMonitoring
        ]
        
        session.sendMessage(configData, replyHandler: nil) { error in
            print("❌ Failed to send gait config to watch: \(error)")
        }
    }
}

// MARK: - Watch Connectivity Delegate
extension iPhoneWatchBridge: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isWatchConnected = activationState == .activated
        }
        
        if let error = error {
            print("❌ Watch session activation failed: \(error)")
        } else {
            print("✅ Watch session activated with state: \(activationState.rawValue)")
            
            // Check if watch app is installed
            if activationState == .activated {
                checkWatchAppInstallation()
            }
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        print("📱 Received message from Apple Watch: \(message)")
        
        guard let messageType = message["type"] as? String else { return }
        
        switch messageType {
        case "realtime_gait":
            handleRealtimeGaitData(message)
        case "gait_session_complete":
            handleGaitSessionComplete(message)
        case "watch_status_update":
            handleWatchStatusUpdate(message)
        default:
            print("⚠️ Unknown message type from watch: \(messageType)")
        }
    }
    
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("📱 Watch session became inactive")
        DispatchQueue.main.async {
            self.isWatchConnected = false
        }
    }
    
    func sessionDidDeactivate(_ session: WCSession) {
        print("📱 Watch session deactivated")
        DispatchQueue.main.async {
            self.isWatchConnected = false
        }
    }
    
    // MARK: - Message Handlers
    private func handleRealtimeGaitData(_ message: [String: Any]) {
        guard let userId = message["userId"] as? String,
              let stepCount = message["stepCount"] as? Int,
              let stepCadence = message["stepCadence"] as? Double,
              let stabilityScore = message["stabilityScore"] as? Double,
              let walkingPattern = message["walkingPattern"] as? String,
              let sessionDuration = message["sessionDuration"] as? TimeInterval else {
            print("❌ Invalid realtime gait data from watch")
            return
        }
        
        let realtimeData = RealtimeGaitDataPayload(
            userId: userId,
            deviceId: "apple_watch",
            stepCount: stepCount,
            stepCadence: stepCadence,
            stabilityScore: stabilityScore,
            walkingPattern: walkingPattern,
            sessionDuration: sessionDuration
        )
        
        DispatchQueue.main.async {
            self.realtimeWatchData = realtimeData
        }
        
        // Forward to WebSocket if needed
        Task {
            do {
                try await WebSocketManager.shared.sendRealtimeGaitData(realtimeData)
            } catch {
                print("❌ Failed to forward watch gait data: \(error)")
            }
        }
    }
    
    private func handleGaitSessionComplete(_ message: [String: Any]) {
        print("✅ Watch gait session completed: \(message)")
        
        DispatchQueue.main.async {
            self.watchGaitMonitoringActive = false
        }
        
        // Update iPhone gait manager with watch session data
        Task {
            await FallRiskGaitManager.shared.processWatchSessionData(message)
        }
    }
    
    private func handleWatchStatusUpdate(_ message: [String: Any]) {
        if let isMonitoring = message["isMonitoring"] as? Bool {
            DispatchQueue.main.async {
                self.watchGaitMonitoringActive = isMonitoring
            }
        }
    }
    
    private func checkWatchAppInstallation() {
        // Check if the watch app is installed
        session?.sendMessage(["type": "ping"], replyHandler: { response in
            DispatchQueue.main.async {
                self.isWatchAppInstalled = true
            }
        }) { error in
            DispatchQueue.main.async {
                self.isWatchAppInstalled = false
            }
        }
    }
}

// MARK: - Watch Gait Configuration
struct WatchGaitConfig {
    var monitoringInterval: TimeInterval = 10.0 // seconds
    var sensitivityLevel: SensitivityLevel = .medium
    var backgroundMonitoring: Bool = true
    
    enum SensitivityLevel: String, CaseIterable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        
        var description: String {
            switch self {
            case .low: return "Low Sensitivity"
            case .medium: return "Medium Sensitivity" 
            case .high: return "High Sensitivity"
            }
        }
    }
}

// MARK: - Watch Gait Integration Extensions
extension FallRiskGaitManager {
    func processWatchSessionData(_ sessionData: [String: Any]) async {
        print("📊 Processing Apple Watch session data")
        
        // Extract session data and integrate with iPhone analysis
        if let sessionId = sessionData["sessionId"] as? String,
           let startTime = sessionData["startTime"] as? TimeInterval,
           let endTime = sessionData["endTime"] as? TimeInterval,
           let stepCount = sessionData["stepCount"] as? Int,
           let avgCadence = sessionData["avgCadence"] as? Double,
           let avgStability = sessionData["avgStability"] as? Double {
            
            // Create combined gait metrics from watch data
            let watchGaitMetrics = GaitMetrics(
                timestamp: Date(timeIntervalSince1970: endTime),
                averageWalkingSpeed: nil, // Will be calculated from iPhone HealthKit if available
                averageStepLength: nil,
                stepCount: stepCount,
                walkingAsymmetry: nil,
                doubleSupportTime: nil,
                stairAscentSpeed: nil,
                stairDescentSpeed: nil,
                averageCadence: avgCadence,
                averageStability: avgStability,
                mobilityStatus: avgStability > 7 ? .excellent : avgStability > 5 ? .good : .needsAttention,
                sessionDuration: endTime - startTime,
                walkingPattern: nil
            )
            
            // Update current metrics with watch data
            await MainActor.run {
                self.currentGaitMetrics = watchGaitMetrics
            }
            
            // Trigger fall risk assessment with new data
            await assessFallRisk()
            
            // Send combined analysis to external systems
            if let fallRisk = fallRiskScore {
                let payload = GaitAnalysisPayload(
                    userId: AppConfig.shared.userId,
                    deviceId: "combined_iphone_watch",
                    gait: watchGaitMetrics,
                    fallRisk: fallRisk,
                    balance: balanceAssessment,
                    mobility: dailyMobilityTrends
                )
                
                do {
                    try await WebSocketManager.shared.sendGaitAnalysis(payload)
                    print("✅ Combined iPhone/Watch gait analysis sent")
                } catch {
                    print("❌ Failed to send combined gait analysis: \(error)")
                }
            }
        }
    }
}
