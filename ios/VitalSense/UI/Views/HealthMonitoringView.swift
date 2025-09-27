import SwiftUI
import HealthKit

struct HealthMonitoringView: View {
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @State private var isStreaming = false
    @State private var showingPermissions = false

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Connection Status
                VStack {
                    Text("VitalSense Real-Time Monitoring")
                        .font(.title2)
                        .fontWeight(.bold)

                    HStack {
                        Circle()
                            .fill(webSocketManager.isConnected ? .green : .red)
                            .frame(width: 12, height: 12)
                        Text(webSocketManager.isConnected ? "Connected to Enhanced Server" : "Disconnected")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Health Metrics
                VStack(alignment: .leading, spacing: 12) {
                    Text("Live Health Metrics")
                        .font(.headline)

                    if let heartRate = healthManager.lastHeartRate {
                        HStack {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.red)
                            Text("Heart Rate: \(Int(heartRate)) bpm")
                        }
                    }

                    if let steps = healthManager.lastStepCount {
                        HStack {
                            Image(systemName: "figure.walk")
                                .foregroundColor(.blue)
                            Text("Steps: \(Int(steps))")
                        }
                    }

                    if let steadiness = healthManager.lastWalkingSteadiness {
                        HStack {
                            Image(systemName: "figure.walk")
                                .foregroundColor(.green)
                            Text("Walking Steadiness: \(Int(steadiness * 100))%")
                        }
                    }

                    if let energy = healthManager.lastActiveEnergy {
                        HStack {
                            Image(systemName: "flame.fill")
                                .foregroundColor(.orange)
                            Text("Active Energy: \(Int(energy)) kcal")
                        }
                    }

                    if let distance = healthManager.lastDistance {
                        HStack {
                            Image(systemName: "location.fill")
                                .foregroundColor(.purple)
                            Text("Distance: \(String(format: "%.1f", distance/1000)) km")
                        }
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Data Stream Status
                VStack {
                    Text("Data Points/Min: \(Int(healthManager.dataPointsPerMinute))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("Total Sent: \(healthManager.totalDataPointsSent)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Control Buttons
                VStack(spacing: 16) {
                    if !healthManager.isAuthorized {
                        Button("Request HealthKit Permissions") {
                            showingPermissions = true
                            Task {
                                await healthManager.requestAuthorization()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(showingPermissions)
                    }

                    if healthManager.isAuthorized {
                        Button(isStreaming ? "Stop Streaming" : "Start Real-Time Streaming") {
                            Task {
                                if isStreaming {
                                    healthManager.stopRealTimeHealthStreaming()
                                    isStreaming = false
                                } else {
                                    await healthManager.startRealTimeHealthStreaming()
                                    isStreaming = true
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .background(isStreaming ? Color.red : Color.green)
                    }

                    if !webSocketManager.isConnected {
                        Button("Connect to Server") {
                            webSocketManager.connect()
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
            .padding()
            .navigationTitle("VitalSense")
            .onAppear {
                // Check if already streaming
                isStreaming = healthManager.isMonitoringActive

                // Auto-connect to server
                if !webSocketManager.isConnected {
                    webSocketManager.connect()
                }
            }
        }
    }
}

#Preview {
    HealthMonitoringView()
}
