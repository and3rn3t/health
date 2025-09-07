import SwiftUI
import HealthKit
import CoreMotion

struct WatchGaitDashboardView: View {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    @State private var selectedMetric: GaitMetricType = .walkingSpeed
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 12) {
                    statusHeader
                    primaryMetricCard
                    controlButtons
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Gait Monitor")
        }
    }
    
    private var statusHeader: some View {
        HStack {
            Circle()
                .fill(gaitMonitor.isMonitoring ? .green : .gray)
                .frame(width: 12, height: 12)
            Text(gaitMonitor.isMonitoring ? "Active" : "Paused")
                .font(.caption)
            Spacer()
        }
    }
    
    private var primaryMetricCard: some View {
        VStack {
            Text("1.25")
                .font(.title)
                .foregroundColor(.green)
            Text("Walking Speed (m/s)")
                .font(.caption)
        }
        .padding()
        .background(Color.gray.opacity(0.2))
        .cornerRadius(12)
    }
    
    private var controlButtons: some View {
        Button("Toggle Monitoring") {
            // Action here
        }
        .buttonStyle(.borderedProminent)
    }
}

enum GaitMetricType: CaseIterable {
    case walkingSpeed, stepLength, asymmetry, doubleSupportTime, cadence
}
