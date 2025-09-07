//
//  ContentView.swift
//  VitalSense Monitor
//

import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var backgroundTaskManager = BackgroundTaskManager.shared

    @State private var showingHealthKitAuth = false
    @State private var showingSettings = false
    @State private var healthData: [String: Any] = [:]

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack {
                    Text("VitalSense Monitor")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    Text("Health Monitoring & Analysis")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)

                // Connection Status
                HStack {
                    Circle()
                        .fill(webSocketManager.isConnected ? Color.green : Color.red)
                        .frame(width: 12, height: 12)

                    Text(webSocketManager.isConnected ? "Connected" : "Disconnected")
                        .font(.caption)
                        .foregroundColor(webSocketManager.isConnected ? .green : .red)

                    Spacer()
                }
                .padding(.horizontal)

                // Health Data Summary
                VStack(alignment: .leading, spacing: 10) {
                    Text("Health Data Summary")
                        .font(.headline)
                        .padding(.horizontal)

                    if healthData.isEmpty {
                        Text("No health data available")
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                    } else {
                        ForEach(Array(healthData.keys.sorted()), id: \.self) { key in
                            HStack {
                                Text(key)
                                    .font(.caption)
                                    .foregroundColor(.primary)
                                Spacer()
                                Text("\(healthData[key] as? String ?? "N/A")")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)
                        }
                    }
                }

                Spacer()

                // Action Buttons
                VStack(spacing: 15) {
                    Button(action: {
                        showingHealthKitAuth = true
                        requestHealthKitPermission()
                    }) {
                        Text("Request HealthKit Permission")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    Button(action: {
                        Task {
                            await webSocketManager.connect(with: "demo-token")
                        }
                    }) {
                        Text("Connect to Server")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .padding(.horizontal)

                Spacer()
            }
            .navigationTitle("VitalSense Monitor")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Settings") {
                        showingSettings = true
                    }
                }
            }
        }
        .onAppear {
            requestHealthKitPermission()
        }
        .sheet(isPresented: $showingSettings) {
            Text("Settings View")
                .navigationTitle("Settings")
        }
    }

    private func requestHealthKitPermission() {
        Task {
            await healthKitManager.requestAuthorization()

            if healthKitManager.isAuthorized {
                print("HealthKit authorization successful")
                // Start monitoring
                await healthKitManager.startLiveDataStreaming(webSocketManager: webSocketManager)

                // Update health data display
                await MainActor.run {
                    updateHealthData()
                }
            } else {
                print("HealthKit authorization failed: \(healthKitManager.lastError ?? "Unknown error")")
            }
        }
    }

    private func updateHealthData() {
        // This would be populated with actual health data from HealthKitManager
        healthData = [
            "Status": "Monitoring Active",
            "Last Update": DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .short)
        ]
    }
}

#Preview {
    ContentView()
}
