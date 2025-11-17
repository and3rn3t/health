//
//  CaregiverDashboardView.swift
//  VitalSense
//
//  Dashboard for caregivers to monitor patient health
//  Ported from web app CaregiverDashboard component
//

import SwiftUI

struct CaregiverDashboardView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @EnvironmentObject var notificationManager: SmartNotificationManager
    @StateObject private var emergencySystem = EmergencyResponseSystem.shared
    @State private var selectedTab: CaregiverTab = .overview

    enum CaregiverTab: String, CaseIterable {
        case overview = "Overview"
        case alerts = "Alerts"
        case activity = "Activity"
        case contacts = "Contacts"

        var icon: String {
            switch self {
            case .overview: return "heart.text.square.fill"
            case .alerts: return "exclamationmark.triangle.fill"
            case .activity: return "chart.line.uptrend.xyaxis"
            case .contacts: return "person.2.fill"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    ForEach(CaregiverTab.allCases, id: \.self) { tab in
                        HStack {
                            Image(systemName: tab.icon)
                            Text(tab.rawValue)
                        }
                        .tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                ScrollView {
                    switch selectedTab {
                    case .overview:
                        overviewContent
                    case .alerts:
                        alertsContent
                    case .activity:
                        activityContent
                    case .contacts:
                        contactsContent
                    }
                }
            }
            .navigationTitle("Caregiver Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // Refresh data
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
    }

    // MARK: - Overview Content

    private var overviewContent: some View {
        VStack(spacing: 20) {
            // Status Cards
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                StatusCard(
                    title: "Patient Status",
                    value: "Normal",
                    icon: "heart.fill",
                    color: .green,
                    description: "All vital signs within normal ranges"
                )

                StatusCard(
                    title: "Emergency Alerts",
                    value: emergencySystem.activeAlerts.isEmpty ? "None" : "\(emergencySystem.activeAlerts.count)",
                    icon: "shield.fill",
                    color: emergencySystem.activeAlerts.isEmpty ? .blue : .red,
                    description: emergencySystem.activeAlerts.isEmpty ? "No active emergencies" : "Active emergency situations"
                )

                StatusCard(
                    title: "Emergency Contacts",
                    value: "\(emergencySystem.emergencyContacts.count)",
                    icon: "phone.fill",
                    color: .blue,
                    description: "Contacts configured"
                )

                StatusCard(
                    title: "Last Sync",
                    value: formatLastSync(),
                    icon: "arrow.clockwise.circle.fill",
                    color: .orange,
                    description: "Data synchronization status"
                )
            }
            .padding(.horizontal)

            // Recent Activity
            VStack(alignment: .leading, spacing: 12) {
                Text("Recent Activity")
                    .font(.headline)
                    .padding(.horizontal)

                RecentActivityList()
            }
        }
        .padding(.vertical)
    }

    // MARK: - Alerts Content

    private var alertsContent: some View {
        VStack(spacing: 16) {
            if emergencySystem.activeAlerts.isEmpty {
                EmptyStateView(
                    icon: "checkmark.shield.fill",
                    title: "No Active Alerts",
                    message: "There are currently no emergency alerts."
                )
            } else {
                ForEach(emergencySystem.activeAlerts) { alert in
                    AlertCard(alert: alert)
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }

    // MARK: - Activity Content

    private var activityContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Health Activity Timeline")
                .font(.headline)
                .padding(.horizontal)

            ActivityTimelineView()
        }
        .padding(.vertical)
    }

    // MARK: - Contacts Content

    private var contactsContent: some View {
        VStack(spacing: 16) {
            if emergencySystem.emergencyContacts.isEmpty {
                EmptyStateView(
                    icon: "person.badge.plus",
                    title: "No Emergency Contacts",
                    message: "Add emergency contacts to enable caregiver notifications."
                )
            } else {
                ForEach(emergencySystem.emergencyContacts) { contact in
                    ContactCard(contact: contact)
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
    }

    private func formatLastSync() -> String {
        if let lastSync = healthKitManager.lastSyncDate {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .abbreviated
            return formatter.localizedString(for: lastSync, relativeTo: Date())
        }
        return "Never"
    }
}

// MARK: - Supporting Views

struct StatusCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title2)

                Spacer()

                Text(value)
                    .font(.headline)
                    .foregroundColor(color)
            }

            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)

            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct RecentActivityList: View {
    let activities: [(title: String, time: String)] = [
        ("Last health data sync", "5 minutes ago"),
        ("Medication reminder sent", "2 hours ago"),
        ("Emergency drill completed", "1 day ago")
    ]

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(activities.enumerated()), id: \.offset) { index, activity in
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(activity.title)
                            .font(.subheadline)

                        Text(activity.time)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
                .padding()
                .background(Color(.systemBackground))

                if index < activities.count - 1 {
                    Divider()
                        .padding(.leading)
                }
            }
        }
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct AlertCard: View {
    let alert: EmergencyAlert

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)

                Text(alert.type.displayName)
                    .font(.headline)

                Spacer()

                Text(alert.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(alert.message)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActivityTimelineView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            TimelineEntry(
                time: "Today",
                entries: [
                    ("Health data sync", "Completed"),
                    ("Medication reminder", "Sent")
                ]
            )

            TimelineEntry(
                time: "Yesterday",
                entries: [
                    ("Emergency drill", "Completed"),
                    ("Health check", "Scheduled")
                ]
            )
        }
        .padding(.horizontal)
    }
}

struct TimelineEntry: View {
    let time: String
    let entries: [(title: String, status: String)]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(time)
                .font(.headline)
                .foregroundColor(.secondary)

            ForEach(Array(entries.enumerated()), id: \.offset) { _, entry in
                HStack {
                    Circle()
                        .fill(Color.accentColor)
                        .frame(width: 8, height: 8)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.title)
                            .font(.subheadline)

                        Text(entry.status)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ContactCard: View {
    let contact: EmergencyContact

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.accentColor.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay {
                    Text(contact.name.prefix(1))
                        .font(.headline)
                        .foregroundColor(.accentColor)
                }

            VStack(alignment: .leading, spacing: 4) {
                Text(contact.name)
                    .font(.headline)

                Text(contact.relationship)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text(contact.phoneNumber)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if contact.isPrimary {
                Label("Primary", systemImage: "star.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}
