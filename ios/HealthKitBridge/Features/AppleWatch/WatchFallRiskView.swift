import SwiftUI
import HealthKit

struct WatchFallRiskView: View {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    overallRiskCard
                    riskFactorsGrid
                    emergencyButton
                }
                .padding(.horizontal, 8)
            }
            .navigationTitle("Fall Risk")
        }
    }
    
    private var overallRiskCard: some View {
        VStack {
            ZStack {
                Circle()
                    .stroke(.green.opacity(0.3), lineWidth: 8)
                    .frame(width: 80, height: 80)
                
                VStack {
                    Text("1.2")
                        .font(.title2)
                        .foregroundColor(.green)
                    Text("RISK")
                        .font(.caption2)
                }
            }
            
            Text("Low Risk")
                .font(.headline)
                .foregroundColor(.green)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(16)
    }
    
    private var riskFactorsGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2)) {
            riskTile("Speed", .green)
            riskTile("Balance", .green)
            riskTile("Stability", .yellow)
            riskTile("Symmetry", .green)
        }
    }
    
    private func riskTile(_ title: String, _ color: Color) -> some View {
        VStack {
            Text(title)
                .font(.caption)
            Text("Normal")
                .font(.caption2)
                .foregroundColor(color)
        }
        .frame(height: 60)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
    
    private var emergencyButton: some View {
        Button("Emergency Contact") {
            // Emergency action
        }
        .foregroundColor(.white)
        .padding()
        .background(.red)
        .cornerRadius(12)
    }
}
