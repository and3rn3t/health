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
            // Placeholder legacy tabs – can be populated with dedicated gait / risk views later.
            LegacyPlaceholderView(title: "Gait Dashboard Coming Soon", systemImage: "figure.walk")
                .tabItem { Label("Gait", systemImage: "figure.walk") }
                .tag(1)
            LegacyPlaceholderView(title: "Settings", systemImage: "gear")
                .tabItem { Label("Settings", systemImage: "gear") }
                .tag(2)
        }
    }
}

private struct LegacyPlaceholderView: View {
    let title: String
    let systemImage: String
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: systemImage)
                .font(.largeTitle)
            Text(title).multilineTextAlignment(.center)
                .font(.caption2)
                .foregroundColor(.secondary)
        }.padding(.top, 12)
    }
}

// Removed legacy WatchSettingsView pending dedicated settings integration.

#Preview {
    WatchContentView()
}
