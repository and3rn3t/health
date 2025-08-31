//
//  ContentView.swift
//  HealthKit Bridge
//
//  Created by Health Monitoring App
//

import SwiftUI
import HealthKit
import Foundation

struct ContentView: View {
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var healthManager = HealthKitManager.shared
    @StateObject private var apiClient = ApiClient.shared
    
    @State private var isInitialized = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var lastSentData: String = "None"
    @State private var sendStatus: String = "Ready"
    @State private var showingDetailView = false
    @State private var showingDebugInfo = false
    @State private var testDataSendStatus: String = "" // New state for test data feedback
    @State private var refreshDataStatus: String = "" // New state for refresh data feedback
    @State private var forceRefresh = false // Force UI refresh trigger
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header with live stats
                    headerSection
                    
                    // Connection Status Card (Enhanced)
                    connectionStatusCard
                    
                    // Health Data Summary Card (New)
                    healthDataSummaryCard
                    
                    // Performance Stats Card (New)
                    performanceStatsCard
                    
                    // Manual Controls
                    controlButtonsSection
                    
                    // Debug Information (Expandable)
                    debugSection
                }
                .padding()
            }
            .navigationBarHidden(true)
            .onAppear {
                Task {
                    await initializeApp()
                }
            }
            .alert("Notice", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
        }
        .id(forceRefresh) // Force refresh when needed
    }
    
    private var headerSection: some View {
        VStack {
            Text("HealthKit Bridge")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            if healthManager.isMonitoringActive {
                Text("📊 \(String(format: "%.1f", healthManager.dataPointsPerMinute)) data points/min")
                    .font(.caption)
                    .foregroundColor(.blue)
                    .animation(.easeInOut, value: healthManager.dataPointsPerMinute)
            }
        }
    }
    
    private var connectionStatusCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Circle()
                    .fill(webSocketManager.isConnected ? Color.green : Color.red)
                    .frame(width: 12, height: 12)
                    .animation(.easeInOut, value: webSocketManager.isConnected)
                
                Text("WebSocket Status")
                    .font(.headline)
                
                Spacer()
                
                if healthManager.connectionQuality.latency > 0 {
                    Text("\(Int(healthManager.connectionQuality.latency * 1000))ms")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(webSocketManager.connectionStatus)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            if let error = webSocketManager.lastError {
                Text("Error: \(error)")
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.top, 5)
            }
            
            // Connection quality indicator
            if webSocketManager.isConnected {
                HStack {
                    Text("Quality:")
                        .font(.caption)
                    ProgressView(value: healthManager.connectionQuality.signalStrength)
                        .progressViewStyle(LinearProgressViewStyle(tint: qualityColor))
                        .frame(height: 4)
                    Text(qualityDescription)
                        .font(.caption)
                        .foregroundColor(qualityColor)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var healthDataSummaryCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Health Data")
                    .font(.headline)
                
                Spacer()
                
                if healthManager.isMonitoringActive {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 8, height: 8)
                        .opacity(0.8)
                }
            }
            
            let summary = healthManager.getHealthDataSummary()
            if !summary.isEmpty {
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(.primary)
            } else {
                Text("No health data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Individual health metrics
            if let heartRate = healthManager.lastHeartRate {
                healthMetricRow(icon: "heart.fill", title: "Heart Rate", value: "\(Int(heartRate)) BPM", color: .red)
            }
            
            if let steps = healthManager.lastStepCount {
                healthMetricRow(icon: "figure.walk", title: "Steps", value: "\(Int(steps))", color: .blue)
            }
            
            if let energy = healthManager.lastActiveEnergy {
                healthMetricRow(icon: "flame.fill", title: "Active Energy", value: "\(Int(energy)) kcal", color: .orange)
            }
            
            if let distance = healthManager.lastDistance {
                healthMetricRow(icon: "location.fill", title: "Distance", value: String(format: "%.1f km", distance/1000), color: .green)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var performanceStatsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Performance")
                .font(.headline)
            
            HStack {
                statItem(title: "Total Sent", value: "\(healthManager.totalDataPointsSent)")
                Spacer()
                statItem(title: "Rate", value: String(format: "%.1f/min", healthManager.dataPointsPerMinute))
                Spacer()
                statItem(title: "Reconnects", value: "\(healthManager.connectionQuality.reconnectCount)")
            }
            
            if !healthManager.healthDataFreshness.isEmpty {
                Text("Last Updates:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ForEach(Array(healthManager.healthDataFreshness.keys.sorted()), id: \.self) { key in
                    if let date = healthManager.healthDataFreshness[key] {
                        HStack {
                            Text(key.capitalized)
                                .font(.caption2)
                            Spacer()
                            Text(timeAgo(from: date))
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
    
    private var controlButtonsSection: some View {
        VStack(spacing: 15) {
            // Step 1: Connect to WebSocket first
            Button("Connect WebSocket") {
                Task {
                    await connectWebSocket()
                }
            }
            .disabled(webSocketManager.isConnected)
            .buttonStyle(.borderedProminent)
            
            // Step 2: Start/Stop Health Monitoring (most important action)
            Button(action: {
                Task {
                    if healthManager.isMonitoringActive {
                        await stopHealthMonitoring()
                    } else {
                        await startHealthMonitoring()
                    }
                }
            }) {
                Text(healthManager.isMonitoringActive ? "Stop Monitoring" : "Start Health Monitoring")
                    .foregroundColor(.white) // Force white text for visibility
                    .frame(maxWidth: .infinity)
            }
            .disabled(!webSocketManager.isConnected)
            .buttonStyle(.borderedProminent)
            .tint(healthManager.isMonitoringActive ? .red : .blue) // Use tint instead of foregroundColor
            .animation(.easeInOut(duration: 0.2), value: healthManager.isMonitoringActive)
            .onAppear {
                print("🔘 Monitoring button appeared - isMonitoringActive: \(healthManager.isMonitoringActive)")
            }
            .onChange(of: healthManager.isMonitoringActive) { oldValue, newValue in
                print("🔘 isMonitoringActive changed from \(oldValue) to \(newValue)")
            }
            
            // Step 3: Manual actions section
            VStack(spacing: 8) {
                Text("Manual Actions")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 15) {
                    Button("Send Test Data") {
                        Task {
                            await sendTestData()
                        }
                    }
                    .disabled(!webSocketManager.isConnected)
                    .buttonStyle(.bordered)
                    
                    Button("Refresh Health Data") {
                        Task {
                            await refreshHealthData()
                        }
                    }
                    .disabled(!webSocketManager.isConnected) // Change condition to only require WebSocket connection
                    .buttonStyle(.bordered)
                }
                
                // Visual feedback for test data sending
                if !testDataSendStatus.isEmpty {
                    HStack {
                        if testDataSendStatus.contains("successfully") {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        } else if testDataSendStatus.contains("Failed") {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                        } else {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        
                        Text(testDataSendStatus)
                            .font(.caption)
                            .foregroundColor(testDataSendStatus.contains("successfully") ? .green : 
                                           testDataSendStatus.contains("Failed") ? .red : .blue)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 4)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .transition(.opacity.combined(with: .scale))
                }
                
                // Visual feedback for refresh status
                if !refreshDataStatus.isEmpty {
                    HStack {
                        if refreshDataStatus.contains("successfully") {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                        } else if refreshDataStatus.contains("Failed") {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                        } else {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        
                        Text(refreshDataStatus)
                            .font(.caption)
                            .foregroundColor(refreshDataStatus.contains("successfully") ? .green : 
                                             refreshDataStatus.contains("Failed") ? .red : .blue)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 4)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .transition(.opacity.combined(with: .scale))
                }
            }
        }
    }
    
    private var debugSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: {
                print("🐛 Debug section tapped - current state: \(showingDebugInfo)")
                withAnimation(.easeInOut(duration: 0.3)) {
                    showingDebugInfo.toggle()
                }
                print("🐛 Debug section new state: \(showingDebugInfo)")
            }) {
                HStack {
                    Text("Debug Information")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    Spacer()
                    Image(systemName: showingDebugInfo ? "chevron.down" : "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .rotationEffect(.degrees(showingDebugInfo ? 0 : -90))
                        .animation(.easeInOut(duration: 0.3), value: showingDebugInfo)
                }
                .padding()
                .background(Color(.systemGray6))
                .contentShape(Rectangle())
            }
            .buttonStyle(PlainButtonStyle())
            .background(Color(.systemGray6))
            
            if showingDebugInfo {
                VStack(alignment: .leading, spacing: 8) {
                    debugRow(label: "User ID", value: AppConfig.shared.userId)
                    debugRow(label: "Device ID", value: UIDevice.current.identifierForVendor?.uuidString ?? "Unknown")
                    debugRow(label: "API Base URL", value: AppConfig.shared.apiBaseURL)
                    debugRow(label: "WebSocket URL", value: AppConfig.shared.webSocketURL)
                    debugRow(label: "HealthKit Status", value: healthManager.isAuthorized ? "Authorized" : "Not Authorized")
                    debugRow(label: "Monitoring", value: healthManager.isMonitoringActive ? "Active" : "Inactive")
                    debugRow(label: "WebSocket Mode", value: webSocketManager.isConnected ? "Connected" : "Disconnected")
                    
                    if let error = healthManager.lastError {
                        debugRow(label: "Last Error", value: error)
                    }
                    
                    if let wsError = webSocketManager.lastError {
                        debugRow(label: "WebSocket Error", value: wsError)
                    }
                }
                .padding()
                .background(Color(.systemGray5))
                .transition(.opacity.combined(with: .slide))
            }
        }
        .cornerRadius(10)
        .clipped()
    }
    
    // Helper Views
    private func healthMetricRow(icon: String, title: String, value: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
    
    private func statItem(title: String, value: String) -> some View {
        VStack {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
    
    private func debugRow(label: String, value: String) -> some View {
        HStack {
            Text("\(label):")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .multilineTextAlignment(.trailing)
        }
    }
    
    // Computed Properties
    private var qualityColor: Color {
        let strength = healthManager.connectionQuality.signalStrength
        if strength > 0.8 { return .green }
        if strength > 0.6 { return .yellow }
        if strength > 0.4 { return .orange }
        return .red
    }
    
    private var qualityDescription: String {
        let strength = healthManager.connectionQuality.signalStrength
        if strength > 0.8 { return "Excellent" }
        if strength > 0.6 { return "Good" }
        if strength > 0.4 { return "Fair" }
        return "Poor"
    }
    
    // Helper Functions
    private func timeAgo(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 {
            return "\(Int(interval))s ago"
        } else if interval < 3600 {
            return "\(Int(interval/60))m ago"
        } else {
            return "\(Int(interval/3600))h ago"
        }
    }
    
    private func initializeApp() async {
        print("🚀 Initializing app...")
        
        // Request HealthKit authorization first
        await healthManager.requestAuthorization()
        
        // Auto-connect WebSocket
        await connectWebSocket()
    }
    
    private func connectWebSocket() async {
        print("🔌 Connecting WebSocket...")
        sendStatus = "Connecting..."
        
        let appConfig = AppConfig.shared
        
        if let token = await apiClient.getDeviceToken(
            userId: appConfig.userId,
            deviceType: "ios_app"
        ) {
            await webSocketManager.connect(with: token)
            sendStatus = "Connected"
        } else {
            sendStatus = "Connection failed"
            showAlert("Failed to get device token")
        }
    }
    
    private func sendTestData() async {
        print("📤 Sending test data...")
        await MainActor.run {
            sendStatus = "Sending..."
            testDataSendStatus = "Sending test data..." // Show immediate feedback
        }
        
        let testData = HealthData(
            type: "heart_rate",
            value: 75.0,
            unit: "bpm",
            timestamp: Date(),
            deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
            userId: AppConfig.shared.userId
        )
        
        do {
            try await webSocketManager.sendHealthData(testData)
            await MainActor.run {
                sendStatus = "Sent successfully"
                lastSentData = "Heart Rate: 75 bpm"
                testDataSendStatus = "✓ Test data sent successfully (Mock mode)" // Show mock mode clearly
            }
            
            // Show success alert for better feedback
            let mode = webSocketManager.connectionStatus.contains("Mock") ? " (Mock mode)" : ""
            showAlert("Test data sent successfully: Heart Rate 75 BPM\(mode)")
            
            // Clear status after 4 seconds (longer to see the feedback)
            await MainActor.run {
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    self.sendStatus = "Ready"
                    self.testDataSendStatus = "" // Clear test data status
                }
            }
        } catch {
            await MainActor.run {
                sendStatus = "Send failed"
                testDataSendStatus = "✗ Failed to send test data" // Update test data status
            }
            showAlert("Failed to send test data: \(error.localizedDescription)")
            
            // Clear error status after 4 seconds
            await MainActor.run {
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                    self.testDataSendStatus = ""
                }
            }
        }
    }
    
    private func startHealthMonitoring() async {
        print("📊 Starting health monitoring...")
        await MainActor.run {
            isInitialized = true
            sendStatus = "Monitoring active"
        }
        
        await healthManager.startLiveDataStreaming(webSocketManager: webSocketManager)
        showAlert("Health monitoring started successfully")
    }
    
    private func refreshHealthData() async {
        print("🔄 Manually refreshing health data...")
        await MainActor.run {
            refreshDataStatus = "Refreshing health data..."
        }
        
        do {
            try await healthManager.sendCurrentHealthData()
            await MainActor.run {
                refreshDataStatus = "✓ Health data refreshed successfully"
            }
            
            // Provide detailed feedback about what was refreshed
            let summary = healthManager.getHealthDataSummary()
            let message = summary.isEmpty ? 
                "Health data refresh completed" : 
                "Health data refreshed: \(summary)"
            showAlert(message)
            
        } catch {
            await MainActor.run {
                refreshDataStatus = "✗ Failed to refresh health data"
            }
            showAlert("Failed to refresh health data: \(error.localizedDescription)")
        }
        
        // Clear refresh status after 4 seconds
        await MainActor.run {
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                self.refreshDataStatus = ""
            }
        }
    }
    
    private func stopHealthMonitoring() async {
        print("⏹️ Stopping health monitoring...")
        healthManager.stopMonitoring()
        showAlert("Health monitoring stopped")
    }
    
    private func showAlert(_ message: String) {
        Task { @MainActor in
            alertMessage = message
            showingAlert = true
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(HealthKitManager.shared)
        .environmentObject(WebSocketManager.shared)
}
