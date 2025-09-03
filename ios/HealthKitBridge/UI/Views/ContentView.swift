//
//  ContentView.swift
//  VitalSense Monitor
//

import SwiftUI
import HealthKit

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var fallRiskGaitManager = FallRiskGaitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var backgroundTaskManager = BackgroundTaskManager.shared
    @StateObject private var iPhoneWatchBridge = iPhoneWatchBridge.shared
    
    @State private var selectedTab = 0
    @State private var showingHealthKitAuth = false
    @State private var showingSettings = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Main Dashboard
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Dashboard")
                }
                .tag(0)
            
            // Fall Risk Assessment
            FallRiskGaitDashboardView()
                .tabItem {
                    Image(systemName: "figure.walk")
                    Text("Gait Analysis")
                }
                .tag(1)
            
            // Health Data
            HealthDataView()
                .tabItem {
                    Image(systemName: "heart.text.square")
                    Text("Health Data")
                }
                .tag(2)
            
            // Settings
            SettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(3)
        }
        .onAppear {
            setupHealthKit()
        }
        .environmentObject(healthKitManager)
        .environmentObject(fallRiskGaitManager)
        .environmentObject(webSocketManager)
        .environmentObject(backgroundTaskManager)
        .environmentObject(iPhoneWatchBridge)
    }
    
    private func setupHealthKit() {
        Task {
            await healthKitManager.requestAuthorization()
            if healthKitManager.isAuthorized {
                await fallRiskGaitManager.initializeGaitMonitoring()
            }
        }
    }
}

struct DashboardView: View {
    @EnvironmentObject var fallRiskGaitManager: FallRiskGaitManager
    @EnvironmentObject var webSocketManager: WebSocketManager
    @EnvironmentObject var iPhoneWatchBridge: iPhoneWatchBridge
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack {
                        Text("VitalSense Monitor")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text("Advanced Fall Risk & Gait Analysis")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top)
                    
                    // Status Cards
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        StatusCard(
                            title: "Monitoring",
                            value: fallRiskGaitManager.isMonitoring ? "Active" : "Inactive",
                            color: fallRiskGaitManager.isMonitoring ? .green : .red,
                            icon: "figure.walk.circle"
                        )
                        
                        StatusCard(
                            title: "Connection",
                            value: webSocketManager.isConnected ? "Connected" : "Disconnected",
                            color: webSocketManager.isConnected ? .green : .red,
                            icon: "network"
                        )
                        
                        StatusCard(
                            title: "Apple Watch",
                            value: iPhoneWatchBridge.isWatchConnected ? "Connected" : "Not Connected",
                            color: iPhoneWatchBridge.isWatchConnected ? .green : .orange,
                            icon: "applewatch"
                        )
                        
                        StatusCard(
                            title: "Fall Risk",
                            value: fallRiskGaitManager.currentFallRiskScore?.riskLevel.displayName ?? "Unknown",
                            color: fallRiskColorForLevel(fallRiskGaitManager.currentFallRiskScore?.riskLevel),
                            icon: "heart.text.square"
                        )
                    }
                    
                    // Recent Metrics
                    if let metrics = fallRiskGaitManager.currentGaitMetrics {
                        MetricsCard(metrics: metrics)
                    }
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        HStack(spacing: 12) {
                            ActionButton(
                                title: fallRiskGaitManager.isMonitoring ? "Stop Monitoring" : "Start Monitoring",
                                icon: fallRiskGaitManager.isMonitoring ? "stop.circle" : "play.circle",
                                color: fallRiskGaitManager.isMonitoring ? .red : .green
                            ) {
                                Task {
                                    if fallRiskGaitManager.isMonitoring {
                                        await fallRiskGaitManager.stopGaitMonitoring()
                                    } else {
                                        await fallRiskGaitManager.startGaitMonitoring()
                                    }
                                }
                            }
                            
                            ActionButton(
                                title: "Assess Risk",
                                icon: "chart.line.uptrend.xyaxis",
                                color: .blue
                            ) {
                                Task {
                                    await fallRiskGaitManager.assessFallRisk()
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }
    
    private func fallRiskColorForLevel(_ level: FallRiskLevel?) -> Color {
        guard let level = level else { return .gray }
        switch level {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        }
    }
}

struct StatusCard: View {
    let title: String
    let value: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            Text(value)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct MetricsCard: View {
    let metrics: GaitMetrics
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Current Gait Metrics")
                .font(.headline)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                MetricItem(title: "Walking Speed", value: String(format: "%.2f m/s", metrics.averageWalkingSpeed))
                MetricItem(title: "Asymmetry", value: String(format: "%.1f%%", metrics.walkingAsymmetry))
                MetricItem(title: "Support Time", value: String(format: "%.1f%%", metrics.doubleSupportTime))
                MetricItem(title: "Status", value: metrics.mobilityStatus.rawValue.capitalized)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct MetricItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .padding()
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(10)
        }
    }
}

struct HealthDataView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    
    var body: some View {
        NavigationView {
            List {
                Section("Health Data Access") {
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("HealthKit Authorization")
                        Spacer()
                        Text(healthKitManager.isAuthorized ? "Authorized" : "Not Authorized")
                            .foregroundColor(healthKitManager.isAuthorized ? .green : .red)
                    }
                }
                
                if healthKitManager.isAuthorized {
                    Section("Available Data Types") {
                        ForEach(healthKitManager.availableDataTypes, id: \.self) { dataType in
                            Text(dataType)
                        }
                    }
                }
            }
            .navigationTitle("Health Data")
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var webSocketManager: WebSocketManager
    @EnvironmentObject var backgroundTaskManager: BackgroundTaskManager
    
    var body: some View {
        NavigationView {
            List {
                Section("Connection") {
                    HStack {
                        Text("WebSocket URL")
                        Spacer()
                        Text(webSocketManager.currentURL ?? "Not Set")
                            .foregroundColor(.secondary)
                    }
                    
                    Button(webSocketManager.isConnected ? "Disconnect" : "Connect") {
                        Task {
                            if webSocketManager.isConnected {
                                await webSocketManager.disconnect()
                            } else {
                                await webSocketManager.connect()
                            }
                        }
                    }
                    .foregroundColor(webSocketManager.isConnected ? .red : .green)
                }
                
                Section("Background Processing") {
                    HStack {
                        Text("Background Tasks")
                        Spacer()
                        Text(backgroundTaskManager.isBackgroundProcessingEnabled ? "Enabled" : "Disabled")
                            .foregroundColor(backgroundTaskManager.isBackgroundProcessingEnabled ? .green : .red)
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Build")
                        Spacer()
                        Text("2025.09.02")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    ContentView()
}
