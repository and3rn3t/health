import SwiftUI

@main
struct HealthKitBridgeApp: App {
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthKitManager)
                .environmentObject(webSocketManager)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Request HealthKit permissions on startup
        healthKitManager.requestHealthKitAuthorization { success, error in
            if let error = error {
                print("Failed to authorize HealthKit: \(error)")
            } else if success {
                print("HealthKit authorization successful")
                // Start monitoring health data after authorization
                healthKitManager.startMonitoring()
            }
        }
        
        // Connect to WebSocket server
        webSocketManager.connect()
    }
}