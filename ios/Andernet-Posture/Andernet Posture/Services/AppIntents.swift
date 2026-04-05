//
//  AppIntents.swift
//  Andernet Posture
//
//  App Intents for Siri and Shortcuts integration.
//  Exposes key actions: start capture, show posture score,
//  show recent sessions, export last session.
//

import AppIntents
import SwiftData
import Foundation

// MARK: - Show Posture Score

struct ShowPostureScoreIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Posture Score"
    static var description = IntentDescription(
        "Shows your most recent posture score from Andernet Posture.",
        categoryName: "Health"
    )
    static var openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let container = try ModelContainer(for: GaitSession.self)
        let context = container.mainContext

        let descriptor = FetchDescriptor<GaitSession>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        let sessions = try context.fetch(descriptor)

        guard let latest = sessions.first, let score = latest.postureScore else {
            return .result(dialog: "No posture sessions recorded yet. Open the app to start a capture.")
        }

        let label = scoreLabel(score)
        let dateStr = latest.date.formatted(date: .abbreviated, time: .shortened)

        return .result(
            dialog: "Your latest posture score is \(Int(score)) (\(label)), recorded \(dateStr)."
        )
    }

    private func scoreLabel(_ score: Double) -> String {
        switch score {
        case 80...: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        default: return "Needs Improvement"
        }
    }
}

// MARK: - Show Fall Risk

struct ShowFallRiskIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Fall Risk"
    static var description = IntentDescription(
        "Shows your most recent fall risk assessment.",
        categoryName: "Health"
    )
    static var openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let container = try ModelContainer(for: GaitSession.self)
        let context = container.mainContext

        let descriptor = FetchDescriptor<GaitSession>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        let sessions = try context.fetch(descriptor)

        guard let latest = sessions.first else {
            return .result(dialog: "No sessions recorded yet. Open the app to start a capture.")
        }

        let level = latest.fallRiskLevel ?? "unknown"
        let score = latest.fallRiskScore.map { String(format: "%.0f", $0) } ?? "N/A"
        let dateStr = latest.date.formatted(date: .abbreviated, time: .shortened)

        return .result(
            dialog: "Your fall risk level is \(level) (score: \(score)), assessed \(dateStr)."
        )
    }
}

// MARK: - Start Capture Session

struct StartCaptureIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Posture Capture"
    static var description = IntentDescription(
        "Opens the app and starts a new posture and gait capture session.",
        categoryName: "Health"
    )
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Navigate to capture tab via deep link
        if let url = URL(string: "andernetposture://capture") {
            DeepLinkHandler().handle(url: url)
        }
        return .result()
    }
}

// MARK: - Show Sessions

struct ShowSessionsIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Recent Sessions"
    static var description = IntentDescription(
        "Shows a summary of your recent posture and gait sessions.",
        categoryName: "Health"
    )
    static var openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let container = try ModelContainer(for: GaitSession.self)
        let context = container.mainContext

        var descriptor = FetchDescriptor<GaitSession>(
            sortBy: [SortDescriptor(\.date, order: .reverse)]
        )
        descriptor.fetchLimit = 5
        let sessions = try context.fetch(descriptor)

        guard !sessions.isEmpty else {
            return .result(dialog: "No sessions recorded yet. Open the app to start a capture.")
        }

        let lines = sessions.map { session in
            let date = session.date.formatted(date: .abbreviated, time: .shortened)
            let score = session.postureScore.map { String(format: "%.0f", $0) } ?? "—"
            let duration = Duration.seconds(session.duration).formatted(.units(allowed: [.minutes, .seconds]))
            return "• \(date): Score \(score), \(duration)"
        }

        let summary = "Your last \(sessions.count) session(s):\n" + lines.joined(separator: "\n")
        return .result(dialog: IntentDialog(stringLiteral: summary))
    }
}

// MARK: - Open Dashboard

struct OpenDashboardIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Dashboard"
    static var description = IntentDescription(
        "Opens the Andernet Posture dashboard.",
        categoryName: "Health"
    )
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        if let url = URL(string: "andernetposture://dashboard") {
            DeepLinkHandler().handle(url: url)
        }
        return .result()
    }
}

// MARK: - App Shortcuts Provider

struct PostureAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ShowPostureScoreIntent(),
            phrases: [
                "Show my posture score in \(.applicationName)",
                "What's my posture score in \(.applicationName)",
                "How's my posture in \(.applicationName)"
            ],
            shortTitle: "Posture Score",
            systemImageName: "figure.stand"
        )

        AppShortcut(
            intent: ShowFallRiskIntent(),
            phrases: [
                "Show my fall risk in \(.applicationName)",
                "What's my fall risk in \(.applicationName)",
                "Am I at risk of falling in \(.applicationName)"
            ],
            shortTitle: "Fall Risk",
            systemImageName: "exclamationmark.triangle"
        )

        AppShortcut(
            intent: StartCaptureIntent(),
            phrases: [
                "Start a posture capture in \(.applicationName)",
                "Capture my posture with \(.applicationName)",
                "Start walking analysis in \(.applicationName)"
            ],
            shortTitle: "Start Capture",
            systemImageName: "figure.walk"
        )

        AppShortcut(
            intent: ShowSessionsIntent(),
            phrases: [
                "Show my recent sessions in \(.applicationName)",
                "Show my posture history in \(.applicationName)"
            ],
            shortTitle: "Recent Sessions",
            systemImageName: "list.bullet"
        )

        AppShortcut(
            intent: OpenDashboardIntent(),
            phrases: [
                "Open \(.applicationName) dashboard",
                "Show my health dashboard in \(.applicationName)"
            ],
            shortTitle: "Dashboard",
            systemImageName: "chart.bar.fill"
        )
    }
}
