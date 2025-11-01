import SwiftUI
import HealthKit
import WatchConnectivity

// MARK: - VitalSense Apple Watch App
@main
struct VitalSenseWatchApp: App {
    var body: some Scene {
        WindowGroup {
            WatchContentView()
        }
    }
}

struct WatchContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            RemoteControlDashboard()
                .tabItem { Label("Remote", systemImage: "dot.radiowaves.left.and.right") }
                .tag(0)

            ComprehensiveWatchGaitView()
                .tabItem { Label("Gait", systemImage: "figure.walk") }
                .tag(1)

            WatchSettingsView()
                .tabItem { Label("Settings", systemImage: "gear") }
                .tag(2)
        }
    }
}



#Preview {
    WatchContentView()
}
