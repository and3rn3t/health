//
//  EnhancedSettingsView.swift
//  VitalSense
//
//  Enhanced settings with iOS 26 features and comprehensive configuration
//  Created: 2024-12-19
//

import SwiftUI
import HealthKit
import UserNotifications
import OSLog

struct EnhancedSettingsView: View {
    @EnvironmentObject var appConfig: AppConfig
    @EnvironmentObject var healthKitManager: HealthKitManager
    @StateObject private var settingsManager = SettingsManager()

    @State private var showingHealthPermissions = false
    @State private var showingNotificationSettings = false
    @State private var showingAdvancedSettings = false
    @State private var showingAbout = false
    @State private var showingPrivacyPolicy = false

    var body: some View {
        NavigationView {
            List {
                // Profile Section
                profileSection

                // Health & Monitoring
                healthMonitoringSection

                // iOS 26 Features
                if #available(iOS 26.0, *) {
                    ios26FeaturesSection
                }

                // Notifications
                notificationsSection

                // Data & Privacy
                dataPrivacySection

                // Advanced Settings
                advancedSection

                // About & Support
                aboutSection
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingHealthPermissions) {
            HealthPermissionsView()
        }
        .sheet(isPresented: $showingNotificationSettings) {
            NotificationSettingsView()
        }
        .sheet(isPresented: $showingAdvancedSettings) {
            AdvancedSettingsView()
        }
        .sheet(isPresented: $showingAbout) {
            AboutView()
        }
        .sheet(isPresented: $showingPrivacyPolicy) {
            PrivacyPolicyView()
        }
    }

    // MARK: - Profile Section

    private var profileSection: some View {
        Section {
            HStack(spacing: 16) {
                AsyncImage(url: URL(string: "https://via.placeholder.com/80x80")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(Color.secondary.opacity(0.3))
                        .overlay {
                            Image(systemName: "person.fill")
                                .foregroundStyle(.secondary)
                        }
                }
                .frame(width: 80, height: 80)
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(settingsManager.userProfile.name.isEmpty ? "Your Name" : settingsManager.userProfile.name)
                        .font(.title2.bold())

                    Text(settingsManager.userProfile.email.isEmpty ? "your.email@example.com" : settingsManager.userProfile.email)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundStyle(.red)
                        Text("VitalSense Member")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 2)
                }

                Spacer()

                Button("Edit") {
                    // Handle edit profile
                }
                .buttonStyle(.bordered)
            }
            .padding(.vertical, 8)
        } header: {
            Text("Profile")
        }
    }

    // MARK: - Health Monitoring Section

    private var healthMonitoringSection: some View {
        Section {
            NavigationLink(destination: HealthPermissionsView()) {
                HStack {
                    Image(systemName: "heart.text.square.fill")
                        .foregroundStyle(.red)
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Health Permissions")
                        Text(healthKitManager.authorizationStatus.description)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if healthKitManager.authorizationStatus == .sharingAuthorized {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    } else {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                }
            }

            HStack {
                Image(systemName: "figure.walk")
                    .foregroundStyle(.blue)
                    .frame(width: 24)

                Text("Gait Analysis")

                Spacer()

                Toggle("", isOn: $settingsManager.gaitAnalysisEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "waveform.path.ecg")
                    .foregroundStyle(.red)
                    .frame(width: 24)

                Text("Fall Risk Monitoring")

                Spacer()

                Toggle("", isOn: $settingsManager.fallRiskMonitoringEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "moon.fill")
                    .foregroundStyle(.indigo)
                    .frame(width: 24)

                Text("Sleep Analysis")

                Spacer()

                Toggle("", isOn: $settingsManager.sleepAnalysisEnabled)
                    .labelsHidden()
            }

        } header: {
            Text("Health & Monitoring")
        } footer: {
            Text("Configure which health metrics VitalSense monitors and analyzes for you.")
        }
    }

    // MARK: - iOS 26 Features Section

    @available(iOS 26.0, *)
    private var ios26FeaturesSection: some View {
        Section {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(.purple)
                    .frame(width: 24)

                Text("Variable Draw Animations")

                Spacer()

                Toggle("", isOn: $settingsManager.variableDrawEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "drop.fill")
                    .foregroundStyle(.cyan)
                    .frame(width: 24)

                Text("Liquid Glass Effects")

                Spacer()

                Toggle("", isOn: $settingsManager.liquidGlassEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "wand.and.stars")
                    .foregroundStyle(.yellow)
                    .frame(width: 24)

                Text("Magic Replace Transitions")

                Spacer()

                Toggle("", isOn: $settingsManager.magicReplaceEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(.pink)
                    .frame(width: 24)

                Text("Enhanced AI Insights")

                Spacer()

                Toggle("", isOn: $settingsManager.enhancedAIEnabled)
                    .labelsHidden()
            }

        } header: {
            Text("iOS 26 Features")
        } footer: {
            Text("Enable advanced iOS 26 features for enhanced visual effects and AI-powered insights.")
        }
    }

    // MARK: - Notifications Section

    private var notificationsSection: some View {
        Section {
            NavigationLink(destination: NotificationSettingsView()) {
                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundStyle(.orange)
                        .frame(width: 24)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Notification Settings")
                        Text(settingsManager.notificationsEnabled ? "Enabled" : "Disabled")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if settingsManager.notificationsEnabled {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                        .frame(width: 24)

                    Text("Emergency Alerts")

                    Spacer()

                    Toggle("", isOn: $settingsManager.emergencyAlertsEnabled)
                        .labelsHidden()
                }

                HStack {
                    Image(systemName: "heart.circle.fill")
                        .foregroundStyle(.red)
                        .frame(width: 24)

                    Text("Health Reminders")

                    Spacer()

                    Toggle("", isOn: $settingsManager.healthRemindersEnabled)
                        .labelsHidden()
                }

                HStack {
                    Image(systemName: "trophy.fill")
                        .foregroundStyle(.yellow)
                        .frame(width: 24)

                    Text("Achievement Notifications")

                    Spacer()

                    Toggle("", isOn: $settingsManager.achievementNotificationsEnabled)
                        .labelsHidden()
                }
            }

        } header: {
            Text("Notifications")
        } footer: {
            if !settingsManager.notificationsEnabled {
                Text("Enable notifications to receive important health alerts and reminders.")
            }
        }
    }

    // MARK: - Data & Privacy Section

    private var dataPrivacySection: some View {
        Section {
            NavigationLink(destination: DataExportView()) {
                HStack {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundStyle(.blue)
                        .frame(width: 24)

                    Text("Export Health Data")
                }
            }

            NavigationLink(destination: PrivacyPolicyView()) {
                HStack {
                    Image(systemName: "hand.raised.fill")
                        .foregroundStyle(.purple)
                        .frame(width: 24)

                    Text("Privacy Policy")
                }
            }

            Button(action: {
                // Handle data deletion
            }) {
                HStack {
                    Image(systemName: "trash.fill")
                        .foregroundStyle(.red)
                        .frame(width: 24)

                    Text("Delete All Data")
                        .foregroundStyle(.red)
                }
            }

        } header: {
            Text("Data & Privacy")
        } footer: {
            Text("Your health data is encrypted and stored securely on your device. Learn more in our privacy policy.")
        }
    }

    // MARK: - Advanced Section

    private var advancedSection: some View {
        Section {
            NavigationLink(destination: AdvancedSettingsView()) {
                HStack {
                    Image(systemName: "gear.circle.fill")
                        .foregroundStyle(.gray)
                        .frame(width: 24)

                    Text("Advanced Settings")
                }
            }

            HStack {
                Image(systemName: "icloud.fill")
                    .foregroundStyle(.blue)
                    .frame(width: 24)

                Text("iCloud Sync")

                Spacer()

                Toggle("", isOn: $settingsManager.iCloudSyncEnabled)
                    .labelsHidden()
            }

            HStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .foregroundStyle(.green)
                    .frame(width: 24)

                Text("Background Sync")

                Spacer()

                Toggle("", isOn: $settingsManager.backgroundSyncEnabled)
                    .labelsHidden()
            }

        } header: {
            Text("Advanced")
        }
    }

    // MARK: - About Section

    private var aboutSection: some View {
        Section {
            NavigationLink(destination: AboutView()) {
                HStack {
                    Image(systemName: "info.circle.fill")
                        .foregroundStyle(.blue)
                        .frame(width: 24)

                    Text("About VitalSense")
                }
            }

            NavigationLink(destination: SupportView()) {
                HStack {
                    Image(systemName: "questionmark.circle.fill")
                        .foregroundStyle(.orange)
                        .frame(width: 24)

                    Text("Help & Support")
                }
            }

            HStack {
                Image(systemName: "star.fill")
                    .foregroundStyle(.yellow)
                    .frame(width: 24)

                Text("Rate VitalSense")

                Spacer()

                Image(systemName: "arrow.up.right.square")
                    .foregroundStyle(.secondary)
                    .font(.caption)
            }
            .contentShape(Rectangle())
            .onTapGesture {
                // Handle rate app
            }

        } header: {
            Text("About & Support")
        } footer: {
            VStack(alignment: .leading, spacing: 4) {
                Text("VitalSense v\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")")
                Text("Build \(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")")
                Text("© 2024 VitalSense. All rights reserved.")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Settings Manager

class SettingsManager: ObservableObject {
    @Published var userProfile = UserProfile()
    @Published var gaitAnalysisEnabled = true
    @Published var fallRiskMonitoringEnabled = true
    @Published var sleepAnalysisEnabled = true
    @Published var notificationsEnabled = true
    @Published var emergencyAlertsEnabled = true
    @Published var healthRemindersEnabled = true
    @Published var achievementNotificationsEnabled = false
    @Published var iCloudSyncEnabled = true
    @Published var backgroundSyncEnabled = true

    // iOS 26 Features
    @Published var variableDrawEnabled = true
    @Published var liquidGlassEnabled = true
    @Published var magicReplaceEnabled = true
    @Published var enhancedAIEnabled = true

    private let userDefaults = UserDefaults.standard
    private let logger = Logger(subsystem: "com.vitalsense.settings", category: "SettingsManager")

    init() {
        loadSettings()
    }

    private func loadSettings() {
        gaitAnalysisEnabled = userDefaults.bool(forKey: "gaitAnalysisEnabled")
        fallRiskMonitoringEnabled = userDefaults.bool(forKey: "fallRiskMonitoringEnabled")
        sleepAnalysisEnabled = userDefaults.bool(forKey: "sleepAnalysisEnabled")
        notificationsEnabled = userDefaults.bool(forKey: "notificationsEnabled")
        emergencyAlertsEnabled = userDefaults.bool(forKey: "emergencyAlertsEnabled")
        healthRemindersEnabled = userDefaults.bool(forKey: "healthRemindersEnabled")
        achievementNotificationsEnabled = userDefaults.bool(forKey: "achievementNotificationsEnabled")
        iCloudSyncEnabled = userDefaults.bool(forKey: "iCloudSyncEnabled")
        backgroundSyncEnabled = userDefaults.bool(forKey: "backgroundSyncEnabled")

        // iOS 26 Features
        if #available(iOS 26.0, *) {
            variableDrawEnabled = userDefaults.bool(forKey: "variableDrawEnabled")
            liquidGlassEnabled = userDefaults.bool(forKey: "liquidGlassEnabled")
            magicReplaceEnabled = userDefaults.bool(forKey: "magicReplaceEnabled")
            enhancedAIEnabled = userDefaults.bool(forKey: "enhancedAIEnabled")
        }

        // Load user profile
        if let name = userDefaults.string(forKey: "userName") {
            userProfile.name = name
        }
        if let email = userDefaults.string(forKey: "userEmail") {
            userProfile.email = email
        }
    }

    func saveSettings() {
        userDefaults.set(gaitAnalysisEnabled, forKey: "gaitAnalysisEnabled")
        userDefaults.set(fallRiskMonitoringEnabled, forKey: "fallRiskMonitoringEnabled")
        userDefaults.set(sleepAnalysisEnabled, forKey: "sleepAnalysisEnabled")
        userDefaults.set(notificationsEnabled, forKey: "notificationsEnabled")
        userDefaults.set(emergencyAlertsEnabled, forKey: "emergencyAlertsEnabled")
        userDefaults.set(healthRemindersEnabled, forKey: "healthRemindersEnabled")
        userDefaults.set(achievementNotificationsEnabled, forKey: "achievementNotificationsEnabled")
        userDefaults.set(iCloudSyncEnabled, forKey: "iCloudSyncEnabled")
        userDefaults.set(backgroundSyncEnabled, forKey: "backgroundSyncEnabled")

        // iOS 26 Features
        if #available(iOS 26.0, *) {
            userDefaults.set(variableDrawEnabled, forKey: "variableDrawEnabled")
            userDefaults.set(liquidGlassEnabled, forKey: "liquidGlassEnabled")
            userDefaults.set(magicReplaceEnabled, forKey: "magicReplaceEnabled")
            userDefaults.set(enhancedAIEnabled, forKey: "enhancedAIEnabled")
        }

        // Save user profile
        userDefaults.set(userProfile.name, forKey: "userName")
        userDefaults.set(userProfile.email, forKey: "userEmail")

        logger.info("Settings saved successfully")
    }
}

// MARK: - Supporting Views

struct HealthPermissionsView: View {
    var body: some View {
        Text("Health Permissions Configuration")
            .navigationTitle("Health Permissions")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct NotificationSettingsView: View {
    var body: some View {
        Text("Notification Settings Configuration")
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct AdvancedSettingsView: View {
    var body: some View {
        Text("Advanced Settings Configuration")
            .navigationTitle("Advanced Settings")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct DataExportView: View {
    var body: some View {
        Text("Data Export Options")
            .navigationTitle("Export Data")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct PrivacyPolicyView: View {
    var body: some View {
        Text("Privacy Policy Content")
            .navigationTitle("Privacy Policy")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct AboutView: View {
    var body: some View {
        Text("About VitalSense")
            .navigationTitle("About")
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct SupportView: View {
    var body: some View {
        Text("Help & Support")
            .navigationTitle("Support")
            .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Supporting Types

struct UserProfile {
    var name: String = ""
    var email: String = ""
    var dateOfBirth: Date?
    var gender: Gender?
    var height: Double?
    var weight: Double?

    enum Gender: String, CaseIterable {
        case male = "Male"
        case female = "Female"
        case other = "Other"
        case preferNotToSay = "Prefer not to say"
    }
}

extension HKAuthorizationStatus {
    var description: String {
        switch self {
        case .notDetermined:
            return "Not configured"
        case .sharingDenied:
            return "Access denied"
        case .sharingAuthorized:
            return "Full access granted"
        @unknown default:
            return "Unknown status"
        }
    }
}
