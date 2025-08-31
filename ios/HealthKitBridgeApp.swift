import SwiftUI
import HealthKit

@main
struct HealthKitBridgeApp: App {
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthManager)
                .environmentObject(webSocketManager)
                .onAppear {
                    setupHealthMonitoring()
                }
        }
    }

    private func setupHealthMonitoring() {
        print("🚀 Starting Health Monitoring Setup...")

        Task {
            // Request HealthKit authorization
            print("📋 Requesting HealthKit authorization...")
            await healthManager.requestAuthorization()

            // Get device token and connect to WebSocket
            print("🔐 Getting device token...")
            let appConfig = AppConfig.shared

            if let token = await ApiClient.shared.getDeviceToken(
                userId: appConfig.userId,
                deviceType: "ios_app"
            ) {
                print("✅ Got device token, connecting to WebSocket...")
                await webSocketManager.connect(with: token)

                // Start health data streaming
                print("📊 Starting health data streaming...")
                await healthManager.startLiveDataStreaming(webSocketManager: webSocketManager)
            } else {
                print("❌ Failed to get device token")
            }
        }
    }
}
