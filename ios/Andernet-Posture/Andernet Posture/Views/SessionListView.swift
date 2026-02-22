//
//  SessionListView.swift
//  Andernet Posture
//
//  iOS 26 HIG: Large title, scroll edge effects, swipe actions.
//

import SwiftUI
import SwiftData
import os

struct SessionListView: View {
    @Query(sort: \GaitSession.date, order: .reverse) private var sessions: [GaitSession]
    @Environment(\.modelContext) private var modelContext
    @State private var compareMode = false
    @State private var selectedForCompare: Set<PersistentIdentifier> = []
    @State private var navigateToComparison = false
    @State private var navigateToProgress = false
    @State private var searchText = ""
    @Namespace private var sessionNamespace

    /// The two sessions chosen for comparison (baseline = earlier date).
    private var comparisonPair: (GaitSession, GaitSession)? {
        guard selectedForCompare.count == 2 else { return nil }
        let picked = sessions.filter { selectedForCompare.contains($0.persistentModelID) }
        guard picked.count == 2 else { return nil }
        let sorted = picked.sorted { $0.date < $1.date }
        return (sorted[0], sorted[1])
    }

    // MARK: - Filtering & Grouping

    private static let searchFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    private static let monthGroupFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM"
        return f
    }()

    private static let monthDisplayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f
    }()

    /// Sessions filtered by the current search text.
    private var filteredSessions: [GaitSession] {
        guard !searchText.isEmpty else { return sessions }
        return sessions.filter { session in
            Self.searchFormatter.string(from: session.date)
                .localizedCaseInsensitiveContains(searchText)
        }
    }

    /// Filtered sessions grouped by year-month, sorted in reverse chronological order.
    private var groupedSections: [(key: String, display: String, sessions: [GaitSession])] {
        let grouped = Dictionary(grouping: filteredSessions) { session in
            Self.monthGroupFormatter.string(from: session.date)
        }
        return grouped
            .sorted { $0.key > $1.key }
            .map { key, value in
                let displayDate = Self.monthGroupFormatter.date(from: key) ?? Date()
                let display = Self.monthDisplayFormatter.string(from: displayDate)
                return (key: key, display: display, sessions: value)
            }
    }

    var body: some View {
        NavigationStack {
            List {
                if sessions.isEmpty {
                    ContentUnavailableView(
                        "No Sessions",
                        systemImage: "figure.walk.circle",
                        description: Text("Complete a capture session to see it here.")
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(groupedSections, id: \.key) { section in
                        Section(section.display) {
                            ForEach(section.sessions) { session in
                                if compareMode {
                                    compareRow(session: session)
                                } else {
                                    NavigationLink(value: session) {
                                        SessionRow(session: session)
                                    }
                                }
                            }
                            .onDelete { offsets in
                                if !compareMode {
                                    deleteSessions(
                                        sessions: section.sessions,
                                        at: offsets
                                    )
                                }
                            }
                        }
                    }
                }
            }
            .searchable(text: $searchText, prompt: "Search sessions")
            .navigationTitle("Sessions")
            .navigationDestination(for: GaitSession.self) { session in
                SessionDetailView(session: session)
            }
            .navigationTransition(.zoom(sourceID: "session", in: sessionNamespace))
            .navigationDestination(isPresented: $navigateToComparison) {
                if let pair = comparisonPair {
                    ComparisonView(baseline: pair.0, current: pair.1)
                } else {
                    EmptyView()
                }
            }
            .navigationDestination(isPresented: $navigateToProgress) {
                ProgressHistoryView(sessions: Array(sessions))
            }
            .toolbar(content: sessionToolbar)
            .sensoryFeedback(.selection, trigger: compareMode)
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private func sessionToolbar() -> some ToolbarContent {
        if !sessions.isEmpty {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    withAnimation {
                        compareMode.toggle()
                        if !compareMode {
                            selectedForCompare.removeAll()
                        }
                    }
                } label: {
                    Image(systemName: "arrow.left.arrow.right")
                        .symbolVariant(compareMode ? .fill : .none)
                }
                .accessibilityLabel(
                    compareMode ? "Exit compare mode" : "Compare sessions"
                )
            }
            ToolbarItem(placement: .topBarTrailing) {
                if compareMode {
                    compareButton
                } else {
                    HStack(spacing: AppSpacing.md) {
                        Button {
                            navigateToProgress = true
                        } label: {
                            Image(systemName: "chart.line.uptrend.xyaxis")
                        }
                        .accessibilityLabel("View progress history")

                        EditButton()
                    }
                }
            }
        }
    }

    // MARK: - Compare Mode Helpers

    @ViewBuilder
    private func compareRow(session: GaitSession) -> some View {
        let isSelected = selectedForCompare.contains(session.persistentModelID)
        Button {
            toggleSelection(session)
        } label: {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? .blue : .secondary)
                    .imageScale(.large)
                SessionRow(session: session)
            }
        }
        .tint(.primary)
    }

    private func toggleSelection(_ session: GaitSession) {
        let id = session.persistentModelID
        if selectedForCompare.contains(id) {
            selectedForCompare.remove(id)
        } else if selectedForCompare.count < 2 {
            selectedForCompare.insert(id)
        }
    }

    @ViewBuilder
    private var compareButton: some View {
        Button("Compare") {
            navigateToComparison = true
        }
        .disabled(selectedForCompare.count != 2)
    }

    private func deleteSessions(sessions sectionSessions: [GaitSession], at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(sectionSessions[index])
        }
        do {
            try modelContext.save()
        } catch {
            AppLogger.persistence.error("Failed to save after deleting sessions: \(error.localizedDescription)")
        }
    }
}

// MARK: - Session Row

private struct SessionRow: View {
    let session: GaitSession

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.sm) {
            HStack {
                Text(session.date, style: .date)
                    .font(.headline)
                Spacer()
                if let score = session.postureScore {
                    ScoreRingView(score: score, size: 40, lineWidth: 5)
                }
            }

            HStack(spacing: AppSpacing.lg) {
                Label(session.formattedDuration, systemImage: "clock")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let cadence = session.averageCadenceSPM {
                    Label(String(format: "%.0f SPM", cadence), systemImage: "metronome")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let steps = session.totalSteps, steps > 0 {
                    Label("\(steps) steps", systemImage: "shoeprints.fill")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, AppSpacing.xs)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(session.accessibilitySummary)
    }
}

#Preview {
    SessionListView()
        .modelContainer(for: GaitSession.self, inMemory: true)
}
