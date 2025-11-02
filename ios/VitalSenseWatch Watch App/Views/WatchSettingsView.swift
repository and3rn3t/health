//
//  WatchSettingsView.swift
//  VitalSenseWatch Watch App
//
//  Comprehensive settings and configuration for Apple Watch
//  Created: 2024-12-19
//

import SwiftUI
import HealthKit
import WatchConnectivity
import OSLog
import Combine

struct WatchSettingsView: View {
    @StateObject private var settingsManager = WatchSettingsManager()
    @StateObject private var healthManager = WatchHealthManager.shared
    @StateObject private var connectivityManager = WatchAppConnectivityManager.shared

    @State private var showingHealthPermissions = false
    @State private var showingAbout = false
    @State private var showingEmergencyContacts = false

    var body: some View {
        NavigationView {
            List {
                // Connection Status Section
                connectionStatusSection

                // Health Monitoring Section
                healthMonitoringSection

                // Notifications Section
                notificationsSection

                // Emergency & Safety Section
                emergencySection

                // About Section
                aboutSection
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingHealthPermissions) {
            WatchHealthPermissionsView()
        }
        .sheet(isPresented: $showingAbout) {
            WatchAboutView()
        }
        .sheet(isPresented: $showingEmergencyContacts) {
            EmergencyContactsView()
        }
    }

    // MARK: - Connection Status Section

    private var connectionStatusSection: some View {
        Section {
            HStack {
                Image(systemName: "iphone")
                    .foregroundStyle(connectivityManager.isConnectedToPhone ? .green : .red)

                VStack(alignment: .leading, spacing: 2) {
                    Text("iPhone Connection")
                        .font(.headline)

                    Text(connectivityManager.isConnectedToPhone ? "Connected" : "Not Connected")
                        .font(.caption)
                        .foregroundStyle(connectivityManager.isConnectedToPhone ? .green : .red)
                }

                Spacer()

                if !connectivityManager.isReachable {
                    Button("Retry") {
                        // Reconnection happens automatically when reachability changes
                        print("Waiting for iPhone connection...")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.mini)
                }
            }

            // Data Sync Status
            HStack {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .foregroundStyle(.blue)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Data Sync")
                        .font(.headline)

                    Text("Last sync: \(settingsManager.lastSyncTime, formatter: timeFormatter)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button("Sync Now") {
                    performDataSync()
                }
                .buttonStyle(.bordered)
                .controlSize(.mini)
            }

        } header: {
            Text("Connection")
        }
    }

    // MARK: - Health Monitoring Section

    private var healthMonitoringSection: some View {
        Section {
            // Real-time Heart Rate Monitoring
            Toggle(isOn: $settingsManager.realTimeHeartRateEnabled) {
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(.red)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Real-time Heart Rate")
                        Text("Continuous monitoring")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Gait Monitoring
            Toggle(isOn: $settingsManager.gaitMonitoringEnabled) {
                HStack {
                    Image(systemName: "figure.walk")
                        .foregroundStyle(.blue)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Gait Analysis")
                        Text("Walking pattern monitoring")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Fall Detection
            Toggle(isOn: $settingsManager.fallDetectionEnabled) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Fall Detection")
                        Text("Automatic fall detection")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Background Monitoring
            Toggle(isOn: $settingsManager.backgroundMonitoringEnabled) {
                HStack {
                    Image(systemName: "moon.fill")
                        .foregroundStyle(.indigo)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Background Monitoring")
                        Text("Monitor health while not active")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Health Permissions
            NavigationLink(destination: WatchHealthPermissionsView()) {
                HStack {
                    Image(systemName: "heart.text.square")
                        .foregroundStyle(.pink)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Health Permissions")
                        Text(healthPermissionStatus)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

        } header: {
            Text("Health Monitoring")
        }
    }

    // MARK: - Notifications Section

    private var notificationsSection: some View {
        Section {
            // High Heart Rate Alerts
            Toggle(isOn: $settingsManager.highHeartRateAlertsEnabled) {
                HStack {
                    Image(systemName: "heart.text.square.fill")
                        .foregroundStyle(.red)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("High Heart Rate Alerts")
                        Text("Alert when HR > \(Int(settingsManager.highHeartRateThreshold)) BPM")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if settingsManager.highHeartRateAlertsEnabled {
                HStack {
                    Text("Threshold")
                        .font(.caption)

                    Spacer()

                    Stepper(value: $settingsManager.highHeartRateThreshold, in: 100...200, step: 5) {
                        Text("\(Int(settingsManager.highHeartRateThreshold)) BPM")
                            .font(.caption)
                    }
                }
            }

            // Gait Irregularity Alerts
            Toggle(isOn: $settingsManager.gaitIrregularityAlertsEnabled) {
                HStack {
                    Image(systemName: "figure.walk.motion")
                        .foregroundStyle(.orange)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Gait Irregularity Alerts")
                        Text("Alert for walking pattern changes")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Haptic Feedback
            Toggle(isOn: $settingsManager.hapticFeedbackEnabled) {
                HStack {
                    Image(systemName: "iphone.radiowaves.left.and.right")
                        .foregroundStyle(.purple)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Haptic Feedback")
                        Text("Vibration for alerts and feedback")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

        } header: {
            Text("Notifications")
        }
    }

    // MARK: - Emergency Section

    private var emergencySection: some View {
        Section {
            // Emergency SOS
            Toggle(isOn: $settingsManager.emergencySOSEnabled) {
                HStack {
                    Image(systemName: "sos")
                        .foregroundStyle(.red)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Emergency SOS")
                        Text("Fall detection emergency calls")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Emergency Contacts
            NavigationLink(destination: EmergencyContactsView()) {
                HStack {
                    Image(systemName: "person.2.fill")
                        .foregroundStyle(.blue)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Emergency Contacts")
                        Text("\(settingsManager.emergencyContacts.count) contacts")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Medical ID Integration
            Button(action: {
                // Open Medical ID
            }) {
                HStack {
                    Image(systemName: "medical.thermometer")
                        .foregroundStyle(.green)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Medical ID")
                        Text("Health information for emergencies")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "arrow.up.right.square")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)

        } header: {
            Text("Emergency & Safety")
        }
    }

    // MARK: - About Section

    private var aboutSection: some View {
        Section {
            NavigationLink(destination: WatchAboutView()) {
                HStack {
                    Image(systemName: "info.circle")
                        .foregroundStyle(.blue)

                    Text("About VitalSense")
                }
            }

            HStack {
                Image(systemName: "applewatch")
                    .foregroundStyle(.gray)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Watch App Version")
                    Text("1.0.0 (Build 1)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Button("Reset All Settings") {
                settingsManager.resetToDefaults()
            }
            .foregroundStyle(.red)

        } header: {
            Text("About")
        }
    }

    // MARK: - Computed Properties

    private var healthPermissionStatus: String {
        // This would check actual HealthKit authorization status
        return "Configured"
    }

    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }

    // MARK: - Actions

    private func performDataSync() {
        connectivityManager.syncAllData()
        settingsManager.lastSyncTime = Date()
    }
}

// MARK: - Watch Settings Manager

class WatchSettingsManager: ObservableObject {
    @Published var realTimeHeartRateEnabled = true
    @Published var gaitMonitoringEnabled = true
    @Published var fallDetectionEnabled = true
    @Published var backgroundMonitoringEnabled = false
    @Published var highHeartRateAlertsEnabled = true
    @Published var highHeartRateThreshold: Double = 160
    @Published var gaitIrregularityAlertsEnabled = true
    @Published var hapticFeedbackEnabled = true
    @Published var emergencySOSEnabled = false
    @Published var emergencyContacts: [EmergencyContact] = []
    @Published var lastSyncTime = Date()

    private let userDefaults = UserDefaults.standard
    private let logger = Logger(subsystem: "com.vitalsense.watch", category: "SettingsManager")

    init() {
        loadSettings()
    }

    func loadSettings() {
        realTimeHeartRateEnabled = userDefaults.bool(forKey: "realTimeHeartRateEnabled")
        gaitMonitoringEnabled = userDefaults.bool(forKey: "gaitMonitoringEnabled")
        fallDetectionEnabled = userDefaults.bool(forKey: "fallDetectionEnabled")
        backgroundMonitoringEnabled = userDefaults.bool(forKey: "backgroundMonitoringEnabled")
        highHeartRateAlertsEnabled = userDefaults.bool(forKey: "highHeartRateAlertsEnabled")
        highHeartRateThreshold = userDefaults.double(forKey: "highHeartRateThreshold")
        gaitIrregularityAlertsEnabled = userDefaults.bool(forKey: "gaitIrregularityAlertsEnabled")
        hapticFeedbackEnabled = userDefaults.bool(forKey: "hapticFeedbackEnabled")
        emergencySOSEnabled = userDefaults.bool(forKey: "emergencySOSEnabled")

        if highHeartRateThreshold == 0 {
            highHeartRateThreshold = 160 // Default value
        }

        lastSyncTime = userDefaults.object(forKey: "lastSyncTime") as? Date ?? Date().addingTimeInterval(-3600)
    }

    func saveSettings() {
        userDefaults.set(realTimeHeartRateEnabled, forKey: "realTimeHeartRateEnabled")
        userDefaults.set(gaitMonitoringEnabled, forKey: "gaitMonitoringEnabled")
        userDefaults.set(fallDetectionEnabled, forKey: "fallDetectionEnabled")
        userDefaults.set(backgroundMonitoringEnabled, forKey: "backgroundMonitoringEnabled")
        userDefaults.set(highHeartRateAlertsEnabled, forKey: "highHeartRateAlertsEnabled")
        userDefaults.set(highHeartRateThreshold, forKey: "highHeartRateThreshold")
        userDefaults.set(gaitIrregularityAlertsEnabled, forKey: "gaitIrregularityAlertsEnabled")
        userDefaults.set(hapticFeedbackEnabled, forKey: "hapticFeedbackEnabled")
        userDefaults.set(emergencySOSEnabled, forKey: "emergencySOSEnabled")
        userDefaults.set(lastSyncTime, forKey: "lastSyncTime")
    }

    func resetToDefaults() {
        realTimeHeartRateEnabled = true
        gaitMonitoringEnabled = true
        fallDetectionEnabled = true
        backgroundMonitoringEnabled = false
        highHeartRateAlertsEnabled = true
        highHeartRateThreshold = 160
        gaitIrregularityAlertsEnabled = true
        hapticFeedbackEnabled = true
        emergencySOSEnabled = false
        emergencyContacts = []

        saveSettings()
        logger.info("Settings reset to defaults")
    }
}

// MARK: - Supporting Views

struct WatchHealthPermissionsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                Image(systemName: "heart.text.square.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.red)

                Text("Health Permissions")
                    .font(.title2.bold())

                Text("VitalSense needs access to your health data to provide personalized insights and monitoring.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: 8) {
                    PermissionRow(title: "Heart Rate", icon: "heart.fill", granted: true)
                    PermissionRow(title: "Steps", icon: "figure.walk", granted: true)
                    PermissionRow(title: "Active Energy", icon: "flame.fill", granted: true)
                    PermissionRow(title: "Walking Steadiness", icon: "figure.walk.motion", granted: false)
                }
                .padding()

                Button("Open Health App") {
                    // This would open the Health app on watchOS
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .navigationTitle("Permissions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct PermissionRow: View {
    let title: String
    let icon: String
    let granted: Bool

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(granted ? .green : .red)
                .frame(width: 20)

            Text(title)
                .font(.caption)

            Spacer()

            Image(systemName: granted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundStyle(granted ? .green : .red)
                .font(.caption)
        }
    }
}

struct EmergencyContactsView: View {
    @StateObject private var settingsManager = WatchSettingsManager()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                if settingsManager.emergencyContacts.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "person.2")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)

                        Text("No Emergency Contacts")
                            .font(.headline)

                        Text("Add emergency contacts on your iPhone in the Health app.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                } else {
                    ForEach(settingsManager.emergencyContacts, id: \.id) { contact in
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundStyle(.blue)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(contact.name)
                                    .font(.caption.bold())

                                Text(contact.relationship)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Emergency Contacts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct WatchAboutView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    Image("VitalSenseLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 80, height: 80)
                        .clipShape(RoundedRectangle(cornerRadius: 16))

                    Text("VitalSense")
                        .font(.title2.bold())

                    Text("Advanced Health Monitoring")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 8) {
                        InfoRow(title: "Version", value: "1.0.0")
                        InfoRow(title: "Build", value: "1")
                        InfoRow(title: "watchOS", value: "10.0+")
                        InfoRow(title: "Compatibility", value: "Apple Watch Series 4+")
                    }
                    .padding()

                    Text("VitalSense provides comprehensive health monitoring with real-time gait analysis, fall risk assessment, and seamless iPhone integration.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    Text("© 2024 VitalSense. All rights reserved.")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                .padding()
            }
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct InfoRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            Text(value)
                .font(.caption.bold())
        }
    }
}

// MARK: - Supporting Types

struct EmergencyContact: Identifiable {
    let id = UUID()
    let name: String
    let phoneNumber: String
    let relationship: String
}

// MARK: - WatchConnectivityManager Extensions

extension WatchAppConnectivityManager {
    func attemptReconnection() {
        // Attempt to reestablish connection with iPhone
        WCSession.default.activate()
    }

    func syncAllData() {
        // Sync all health data to iPhone
        guard WCSession.default.isReachable else { return }

        let syncMessage = [
            "type": "fullSync",
            "timestamp": Date().timeIntervalSince1970
        ] as [String: Any]

        WCSession.default.sendMessage(syncMessage, replyHandler: nil) { error in
            print("Sync failed: \(error.localizedDescription)")
        }
    }
}
