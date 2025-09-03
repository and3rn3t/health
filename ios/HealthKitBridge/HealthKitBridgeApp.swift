import SwiftUI

@main
struct HealthKitBridgeApp: App {
    @StateObject private var backgroundTaskManager = BackgroundTaskManager.shared
    @StateObject private var securityManager = SecurityManager.shared
    @StateObject private var advancedMetrics = AdvancedHealthMetrics.shared
    @StateObject private var fallRiskGaitManager = FallRiskGaitManager.shared
    @StateObject private var appleWatchGaitMonitor = AppleWatchGaitMonitor.shared
    @StateObject private var iPhoneWatchBridge = iPhoneWatchBridge.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(backgroundTaskManager)
                .environmentObject(securityManager)
                .environmentObject(advancedMetrics)
                .environmentObject(fallRiskGaitManager)
                .environmentObject(appleWatchGaitMonitor)
                .environmentObject(iPhoneWatchBridge)
                .onAppear {
                    setupApp()
                }
        }
    }
    
    private func setupApp() {
        // Schedule background tasks
        backgroundTaskManager.scheduleBackgroundTasks()
        
        // Request advanced health permissions
        Task {
            await advancedMetrics.requestAdvancedAuthorization()
            // Request gait analysis permissions
            await fallRiskGaitManager.requestGaitAuthorization()
        }
        
        // Setup App Shortcuts
        HealthKitBridgeShortcuts.updateAppShortcutParameters()
    }
}
