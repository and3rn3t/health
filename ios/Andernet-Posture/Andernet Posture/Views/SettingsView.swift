//
//  SettingsView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Grouped Form style, SF Symbols without borders.
//

import SwiftUI
import SwiftData
import os

struct SettingsView: View {
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @AppStorage("skeletonOverlay") private var skeletonOverlay = true
    @AppStorage("healthKitSync") private var healthKitSync = false
    @AppStorage("samplingRate") private var samplingRate = 60.0
    @AppStorage("userAge") private var userAge = 0
    @AppStorage("userSex") private var userSex = "notSet"  // "male", "female", "notSet"
    @AppStorage("clinicalDisclaimerAccepted") private var disclaimerAccepted = false
    @AppStorage("showNormativeRanges") private var showNormativeRanges = true
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    @Environment(CloudSyncService.self) private var syncService
    @Environment(MLModelService.self) private var mlModelService
    @Query private var sessions: [GaitSession]

    @State private var healthKitService: DefaultHealthKitService? = DefaultHealthKitService()
    @State private var healthKitAuthorized = false
    @State private var showingHealthKitError = false
    @State private var showingDisclaimer = false
    @State private var iCloudAvailable = true

    var body: some View {
        NavigationStack {
            Form {
                // MARK: - Clinical Disclaimer
                if !disclaimerAccepted {
                    Section {
                        Button {
                            showingDisclaimer = true
                        } label: {
                            Label {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Clinical Disclaimer Required")
                                        .font(.subheadline.bold())
                                    Text("Please review before using clinical features")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            } icon: {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                }

                // MARK: - Demographics (Normative Ranges)
                Section {
                    Picker("Age Range", selection: $userAge) {
                        Text("Not Set").tag(0)
                        Text("20–29").tag(25)
                        Text("30–39").tag(35)
                        Text("40–49").tag(45)
                        Text("50–59").tag(55)
                        Text("60–69").tag(65)
                        Text("70–79").tag(75)
                        Text("80+").tag(85)
                    }
                    .onChange(of: userAge) { _, _ in
                        KeyValueStoreSync.shared.push(.userAge)
                    }

                    Picker("Biological Sex", selection: $userSex) {
                        Text("Not Set").tag("notSet")
                        Text("Male").tag("male")
                        Text("Female").tag("female")
                    }
                    .onChange(of: userSex) { _, _ in
                        KeyValueStoreSync.shared.push(.userSex)
                    }

                    Toggle("Show Normative Ranges", systemImage: "chart.bar.doc.horizontal", isOn: $showNormativeRanges)
                } header: {
                    Text("Demographics")
                } footer: {
                    Text("Age and sex are used to display age-stratified normative ranges for clinical measurements. Demographics sync across your devices via iCloud.")
                }

                // MARK: - Capture Settings
                Section("Capture") {
                    Toggle("Skeleton Overlay", systemImage: "figure.stand", isOn: $skeletonOverlay)

                    Toggle("Haptic Feedback", systemImage: "iphone.radiowaves.left.and.right", isOn: $hapticFeedback)

                    HStack {
                        Label("Sampling Rate", systemImage: "waveform")
                        Spacer()
                        Picker("", selection: $samplingRate) {
                            Text("30 Hz").tag(30.0)
                            Text("60 Hz").tag(60.0)
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 150)
                    }
                }

                // MARK: - AR Overlay
                AROverlaySettingsSection()

                // MARK: - HealthKit
                Section("Health") {
                    Toggle("Sync to HealthKit", systemImage: "heart.fill", isOn: $healthKitSync)
                        .onChange(of: healthKitSync) { _, enabled in
                            if enabled {
                                requestHealthKit()
                            }
                        }

                    if healthKitSync && healthKitAuthorized {
                        Label("Connected", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }

                // MARK: - iCloud Sync
                Section {
                    HStack {
                        Label("iCloud Sync", systemImage: syncService.status.systemImage)
                            .foregroundStyle(iCloudAvailable ? .primary : .secondary)
                        Spacer()
                        Text(syncService.status.label)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    if let lastSync = syncService.lastSyncDate {
                        LabeledContent("Last Synced") {
                            Text(lastSync, style: .relative)
                                .foregroundStyle(.secondary)
                        }
                        .font(.caption)
                    }

                    // Show retry button when in failed state
                    if case .failed = syncService.status {
                        Button {
                            syncService.resetSyncState()
                        } label: {
                            Label("Retry Sync", systemImage: "arrow.clockwise")
                        }
                    }

                    if !iCloudAvailable {
                        Label {
                            Text("Sign in to iCloud in Settings to enable sync.")
                                .font(.caption)
                        } icon: {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                        }
                    }

                    let estimatedMB = estimatedDataSizeMB
                    if estimatedMB > 50 {
                        Label {
                            Text("Your session data is approximately \(String(format: "%.0f", estimatedMB)) MB. Large datasets may use significant iCloud storage.")
                                .font(.caption)
                        } icon: {
                            Image(systemName: "externaldrive.badge.icloud")
                                .foregroundStyle(.orange)
                        }
                    }
                } header: {
                    Text("iCloud")
                } footer: {
                    Text("Sessions, goals, and demographics sync automatically across your devices via iCloud.")
                }

                // MARK: - Clinical Tools
                Section {
                    NavigationLink {
                        ClinicalTestView()
                    } label: {
                        Label("Clinical Test Protocols", systemImage: "stethoscope")
                    }
                } header: {
                    Text("Clinical Tools")
                } footer: {
                    Text("Run guided TUG, Romberg, and 6-Minute Walk protocols.")
                }

                // MARK: - Machine Learning
                Section {
                    @Bindable var ml = mlModelService
                    Toggle(isOn: $ml.useMLModels) {
                        Label("Use ML Models", systemImage: "brain")
                    }

                    if mlModelService.useMLModels {
                        ForEach(mlModelService.modelStatuses, id: \.identifier.rawValue) { status in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(status.identifier.displayName)
                                        .font(.subheadline)
                                    Text(status.identifier.summary)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if status.isAvailable {
                                    Text("v\(status.version)")
                                        .font(.caption.monospaced())
                                        .foregroundStyle(.secondary)
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.green)
                                } else {
                                    Text("Not bundled")
                                        .font(.caption)
                                        .foregroundStyle(.orange)
                                }
                            }
                        }
                    }
                } header: {
                    Text("Machine Learning")
                } footer: {
                    Text("When enabled, CoreML models augment rule-based analysis. If a model is unavailable, the app falls back to geometric algorithms automatically.")
                }

                // MARK: - Disclaimer
                Section {
                    Button {
                        showingDisclaimer = true
                    } label: {
                        Label("View Clinical Disclaimer", systemImage: "doc.text.fill")
                    }

                    if disclaimerAccepted {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                            Text("Disclaimer accepted")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } header: {
                    Text("Legal")
                }

                // MARK: - Support
                Section("Support") {
                    NavigationLink {
                        HelpView()
                    } label: {
                        Label("Help & FAQ", systemImage: "questionmark.circle")
                    }

                    Button {
                        hasCompletedOnboarding = false
                    } label: {
                        Label("Reset Onboarding", systemImage: "arrow.counterclockwise")
                    }
                }

                // MARK: - About
                Section {
                    LabeledContent("Version") {
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                    }
                    
                    LabeledContent("Build") {
                        Text(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")
                    }

                    Link(destination: URL(string: "https://andernet.dev")!) {
                        Label("Andernet.dev", systemImage: "globe")
                    }
                } header: {
                    Label("About", systemImage: "info.circle")
                } footer: {
                    Text("Made with \u{2764}\u{FE0F} by Andernet")
                }

                // MARK: - Data
                Section("Data") {
                    NavigationLink {
                        DataManagementView()
                    } label: {
                        Label("Manage Data", systemImage: "externaldrive.fill")
                    }
                }

                // MARK: - Developer / Performance
                #if DEBUG
                Section {
                    NavigationLink {
                        PerformanceReportView()
                    } label: {
                        Label("Performance Monitor", systemImage: "gauge.with.dots.needle.33percent")
                    }
                } header: {
                    Label("Developer", systemImage: "hammer")
                }
                #endif
            }
            .navigationTitle("Settings")
        }
        .alert("HealthKit Error", isPresented: $showingHealthKitError) {
            Button("OK") { healthKitSync = false }
        } message: {
            Text("Unable to connect to HealthKit. Please enable access in Settings > Privacy > Health.")
        }
        .sheet(isPresented: $showingDisclaimer) {
            ClinicalDisclaimerSheet(isAccepted: $disclaimerAccepted)
        }
        .onAppear {
            if !disclaimerAccepted {
                showingDisclaimer = true
            }

            Task {
                iCloudAvailable = await syncService.checkAccountStatus()
            }
        }
    }

    // MARK: - Helpers

    /// Rough estimate of total session data size for the iCloud storage warning.
    private var estimatedDataSizeMB: Double {
        let totalBytes = sessions.reduce(0) { sum, session in
            let frameBytes = session.framesData?.count ?? 0
            let stepBytes  = session.stepEventsData?.count ?? 0
            let motionBytes = session.motionFramesData?.count ?? 0
            let painBytes  = session.painRiskAlertsData?.count ?? 0
            // ~500 bytes overhead for scalar properties
            return sum + frameBytes + stepBytes + motionBytes + painBytes + 500
        }
        return Double(totalBytes) / 1_048_576.0
    }

    private func requestHealthKit() {
        Task {
            do {
                try await healthKitService?.requestAuthorization()
                healthKitAuthorized = true
            } catch {
                AppLogger.healthKit.error("HealthKit authorization failed: \(error.localizedDescription)")
                showingHealthKitError = true
            }
        }
    }
}

// MARK: - Clinical Disclaimer Sheet

struct ClinicalDisclaimerSheet: View {
    @Binding var isAccepted: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: AppSpacing.xl) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.orange)
                        .frame(maxWidth: .infinity)

                    Text("Clinical Disclaimer")
                        .font(.title.bold())
                        .frame(maxWidth: .infinity)

                    disclaimerText

                    Divider()

                    Button {
                        isAccepted = true
                        dismiss()
                    } label: {
                        Text("I Understand and Accept")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())

                    Button {
                        dismiss()
                    } label: {
                        Text("Cancel")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(SecondaryButtonStyle())
                }
                .padding(AppSpacing.lg)
            }
            .navigationTitle("Disclaimer")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    @ViewBuilder
    private var disclaimerText: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Group {
                Text("This application provides posture and gait screening information only.")
                    .bold()

                Text("It is NOT a medical device and should NOT be used for diagnosis, treatment, or medical decision-making.")

                Text("Key limitations:")
                    .font(.subheadline.bold())
                    .padding(.top, 4)

                bulletPoint(
                    "Clinical measurements are proxy estimates derived from camera-based" +
                    " body tracking and may differ from gold-standard laboratory instruments."
                )
                bulletPoint(
                    "ARKit body tracking has inherent accuracy limitations (~5-10° for joint" +
                    " angles) compared to marker-based motion capture systems."
                )
                bulletPoint(
                    "Postural classification, gait pattern detection, and risk assessments" +
                    " are screening tools only and cannot replace clinical evaluation."
                )
                bulletPoint(
                    "Fall risk, frailty, and pain risk scores are composite estimates" +
                    " and should not be used as standalone clinical indicators."
                )
                bulletPoint(
                    "The Fried phenotype frailty screen can assess only 3 of 5 criteria" +
                    " from motion data; a complete assessment requires clinical evaluation."
                )
            }

            Group {
                Text("Always consult a qualified healthcare professional for:")
                    .font(.subheadline.bold())
                    .padding(.top, 4)

                bulletPoint("Any concerns about posture, gait, balance, or fall risk")
                bulletPoint("Interpretation of clinical measurements and risk scores")
                bulletPoint("Development of exercise or treatment programs")
                bulletPoint("Musculoskeletal pain or movement disorders")
            }

            Text("By using this application, you acknowledge that the developers assume no liability for health decisions made based on the app's output.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 8)
        }
    }

    @ViewBuilder
    private func bulletPoint(_ text: String) -> some View {
        HStack(alignment: .top, spacing: AppSpacing.sm) {
            Text("•")
                .font(.body)
            Text(text)
                .font(.subheadline)
        }
        .padding(.leading, AppSpacing.sm)
    }
}

// MARK: - Data Management

struct DataManagementView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var sessions: [GaitSession]
    @State private var showDeleteConfirmation = false

    var body: some View {
        List {
            Section {
                LabeledContent("Total Sessions") {
                    Text("\(sessions.count)")
                }
                LabeledContent("Total Duration") {
                    let total = sessions.reduce(0) { $0 + $1.duration }
                    let minutes = Int(total) / 60
                    Text("\(minutes) min")
                }
            }

            Section {
                Button("Delete All Sessions", role: .destructive) {
                    showDeleteConfirmation = true
                }
            }
        }
        .navigationTitle("Manage Data")
        .confirmationDialog(
            "Delete All Sessions",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete All", role: .destructive) {
                for session in sessions {
                    modelContext.delete(session)
                }
                do {
                    try modelContext.save()
                } catch {
                    AppLogger.persistence.error("Failed to save after deleting all sessions: \(error.localizedDescription)")
                }
            }
        } message: {
            Text("This will permanently delete all \(sessions.count) sessions. This action cannot be undone.")
        }
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: [GaitSession.self, UserGoals.self], inMemory: true)
        .environment(CloudSyncService())
        .environment(MLModelService.shared)
}
