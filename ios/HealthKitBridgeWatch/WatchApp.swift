import SwiftUI
import HealthKit
import WatchConnectivity

// MARK: - VitalSense Monitor Apple Watch App
@main
struct VitalSenseMonitorWatchApp: App {
    var body: some Scene {
        WindowGroup {
            WatchContentView()
        }
    }
}

struct WatchContentView: View {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            WatchGaitDashboardView()
                .tabItem {
                    Image(systemName: "figure.walk")
                    Text("Gait")
                }
                .tag(0)
            
            WatchFallRiskView()
                .tabItem {
                    Image(systemName: "heart.text.square")
                    Text("Risk")
                }
                .tag(1)
            
            WatchSettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(2)
        }
        .onAppear {
            // Initialize watch monitoring
            Task {
                await gaitMonitor.startMonitoring()
            }
        }
    }
}

struct WatchSettingsView: View {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    
    var body: some View {
        NavigationView {
            List {
                Section("Monitoring") {
                    HStack {
                        Image(systemName: "figure.walk.circle")
                            .foregroundColor(.blue)
                        Text("Gait Monitoring")
                        Spacer()
                        Text(gaitMonitor.isMonitoring ? "Active" : "Inactive")
                            .foregroundColor(gaitMonitor.isMonitoring ? .green : .red)
                    }
                    
                    Button(gaitMonitor.isMonitoring ? "Stop Monitoring" : "Start Monitoring") {
                        Task {
                            if gaitMonitor.isMonitoring {
                                await gaitMonitor.stopMonitoring()
                            } else {
                                await gaitMonitor.startMonitoring()
                            }
                        }
                    }
                    .foregroundColor(gaitMonitor.isMonitoring ? .red : .green)
                }
                
                Section("Connection") {
                    HStack {
                        Image(systemName: "iphone")
                            .foregroundColor(.blue)
                        Text("iPhone")
                        Spacer()
                        Text("Connected")
                            .foregroundColor(.green)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    WatchContentView()
}
