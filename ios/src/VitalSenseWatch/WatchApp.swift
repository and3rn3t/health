import Foundation
import SwiftUI
import Combine
#if canImport(WatchKit)
import WatchKit
#endif

// MARK: - Watch App (for VitalSenseCore module - no @main)
struct VitalSenseWatchApp: App {
    var body: some Scene {
        WindowGroup {
            WatchContentView()
        }
    }
}

// MARK: - Watch Content View
struct WatchContentView: View {
    @StateObject private var connectivityManager = WatchAppConnectivityManager.shared
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("VitalSense")
                    .font(.headline)
                
                if connectivityManager.isConnectedToPhone {
                    GaitMetricsWatchView()
                } else {
                    Text("Connect to iPhone")
                        .foregroundColor(.gray)
                }
            }
            .navigationTitle("VitalSense")
        }
    }
}

// MARK: - Gait Metrics Watch View
struct GaitMetricsWatchView: View {
    var body: some View {
        VStack {
            Text("Gait Monitoring")
                .font(.title3)
            
            // Placeholder for gait metrics
            Text("Real-time gait data will appear here")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
