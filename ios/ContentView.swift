//
//  ContentView.swift
//  HealthKit Bridge
//
//  Created by Health Monitoring App
//

import SwiftUI
import HealthKit

struct ContentView: View {
    @EnvironmentObject var healthManager: HealthKitManager
    @EnvironmentObject var webSocketManager: WebSocketManager
    @EnvironmentObject var appConfig: AppConfig

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.red)

                    Text("HealthKit Bridge")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Streaming to Health Dashboard")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()

                // Status Cards
                VStack(spacing: 16) {
                    StatusCard(
                        title: "HealthKit",
                        status: healthManager.isAuthorized ? .connected : .disconnected,
                        detail: healthManager.isAuthorized ? "Authorized" : "Tap to authorize"
                    ) {
                        if !healthManager.isAuthorized {
                            Task {
                                await healthManager.requestAuthorization()
                            }
                        }
                    }

                    StatusCard(
                        title: "WebSocket",
                        status: webSocketManager.isConnected ? .connected : .disconnected,
                        detail: webSocketManager.isConnected ? "Streaming live data" : "Disconnected"
                    ) {
                        if !webSocketManager.isConnected {
                            Task {
                                if let token = await ApiClient.shared.getDeviceToken(
                                    userId: appConfig.userId,
                                    deviceType: "ios_app"
                                ) {
                                    await webSocketManager.connect(with: token)
                                }
                            }
                        }
                    }

                    StatusCard(
                        title: "Data Streaming",
                        status: (healthManager.isAuthorized && webSocketManager.isConnected) ? .connected : .disconnected,
                        detail: "Heart rate, steps, walking steadiness"
                    ) {}
                }
                .padding(.horizontal)

                // Recent Data
                if healthManager.isAuthorized && webSocketManager.isConnected {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Recent Health Data")
                            .font(.headline)
                            .padding(.horizontal)

                        LazyVStack(spacing: 8) {
                            if let heartRate = healthManager.lastHeartRate {
                                DataRow(
                                    icon: "heart.fill",
                                    title: "Heart Rate",
                                    value: "\(Int(heartRate)) BPM",
                                    color: .red
                                )
                            }

                            if let steps = healthManager.lastStepCount {
                                DataRow(
                                    icon: "figure.walk",
                                    title: "Steps",
                                    value: "\(Int(steps))",
                                    color: .blue
                                )
                            }

                            if let steadiness = healthManager.lastWalkingSteadiness {
                                DataRow(
                                    icon: "figure.walk.motion",
                                    title: "Walking Steadiness",
                                    value: String(format: "%.1f%%", steadiness * 100),
                                    color: .green
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                Spacer()

                // Footer
                Text("Web Dashboard: \(appConfig.apiBaseURL)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding()
            }
        }
        .navigationTitle("Health Bridge")
    }
}

struct StatusCard: View {
    let title: String
    let status: ConnectionStatus
    let detail: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(detail)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Circle()
                    .fill(status.color)
                    .frame(width: 12, height: 12)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct DataRow: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)

            Text(title)
                .font(.subheadline)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }
}

enum ConnectionStatus {
    case connected
    case disconnected

    var color: Color {
        switch self {
        case .connected:
            return .green
        case .disconnected:
            return .red
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(HealthKitManager())
        .environmentObject(WebSocketManager())
        .environmentObject(AppConfig())
}
