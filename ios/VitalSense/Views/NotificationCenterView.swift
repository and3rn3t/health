//
//  NotificationCenterView.swift
//  VitalSense
//
//  Dedicated notification center for managing health alerts and system notifications
//  Ported from web app NotificationCenter component
//

import SwiftUI
import UserNotifications

struct NotificationCenterView: View {
    @StateObject private var notificationManager = SmartNotificationManager.shared
    @State private var selectedFilter: NotificationFilter = .all
    @State private var selectedNotifications: Set<UUID> = []

    enum NotificationFilter: String, CaseIterable {
        case all = "All"
        case unread = "Unread"
        case alerts = "Alerts"
        case reminders = "Reminders"
        case achievements = "Achievements"
    }

    private var filteredNotifications: [NotificationItem] {
        let all = notificationManager.notificationHistory

        switch selectedFilter {
        case .all:
            return all
        case .unread:
            return all.filter { !$0.isRead }
        case .alerts:
            return all.filter { $0.type == .alert }
        case .reminders:
            return all.filter { $0.type == .reminder }
        case .achievements:
            return all.filter { $0.type == .achievement }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Filter Tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(NotificationFilter.allCases, id: \.self) { filter in
                            FilterChip(
                                title: filter.rawValue,
                                count: countForFilter(filter),
                                isSelected: selectedFilter == filter
                            ) {
                                selectedFilter = filter
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                .background(Color(.systemGroupedBackground))

                // Notifications List
                if filteredNotifications.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(filteredNotifications) { notification in
                            NotificationRow(
                                notificationManager: notificationManager,
                                notification: notification
                            )
                        }
                        .onDelete { indexSet in
                            deleteNotifications(at: indexSet)
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    if !filteredNotifications.isEmpty {
                        Menu {
                            Button(action: markAllAsRead) {
                                Label("Mark All as Read", systemImage: "checkmark.circle")
                            }

                            Button(role: .destructive, action: clearAllNotifications) {
                                Label("Clear All", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
            .onAppear {
                notificationManager.loadNotificationHistory()
            }
        }
    }

    private func deleteNotifications(at indexSet: IndexSet) {
        let toDelete = indexSet.map { filteredNotifications[$0].id }
        notificationManager.deleteNotifications(ids: toDelete)
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.slash")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Notifications")
                .font(.title2)
                .fontWeight(.semibold)

            Text("You're all caught up! Check back later for health alerts and updates.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private func countForFilter(_ filter: NotificationFilter) -> Int {
        let all = notificationManager.notificationHistory

        switch filter {
        case .all:
            return all.count
        case .unread:
            return all.filter { !$0.isRead }.count
        case .alerts:
            return all.filter { $0.type == .alert }.count
        case .reminders:
            return all.filter { $0.type == .reminder }.count
        case .achievements:
            return all.filter { $0.type == .achievement }.count
        }
    }

    private func markAllAsRead() {
        notificationManager.markAllAsRead()
    }

    private func clearAllNotifications() {
        notificationManager.clearAllNotifications()
    }

    private func deleteNotifications(at indexSet: IndexSet) {
        let toDelete = indexSet.map { filteredNotifications[$0].id }
        notificationManager.deleteNotifications(ids: toDelete)
    }
}

// MARK: - Notification Row

struct NotificationRow: View {
    @ObservedObject var notificationManager: SmartNotificationManager
    let notification: NotificationItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Icon
            iconView
                .frame(width: 40, height: 40)
                .background(iconBackgroundColor.opacity(0.2))
                .clipShape(Circle())

            // Content
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(notification.title)
                        .font(.headline)
                        .foregroundColor(notification.isRead ? .secondary : .primary)

                    Spacer()

                    if !notification.isRead {
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 8, height: 8)
                    }
                }

                Text(notification.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)

                Text(notification.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture {
            notificationManager.markAsRead(notification.id)
        }
    }

    private var iconView: some View {
        Image(systemName: notification.iconName)
            .foregroundColor(iconColor)
    }

    private var iconColor: Color {
        switch notification.type {
        case .alert:
            return .red
        case .reminder:
            return .orange
        case .achievement:
            return .green
        case .info:
            return .blue
        }
    }

    private var iconBackgroundColor: Color {
        iconColor
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(isSelected ? .semibold : .regular)

                if count > 0 {
                    Text("\(count)")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isSelected ? Color.white.opacity(0.3) : Color.secondary.opacity(0.2))
                        .clipShape(Capsule())
                }
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor : Color(.systemGray5))
            .clipShape(Capsule())
        }
    }
}
