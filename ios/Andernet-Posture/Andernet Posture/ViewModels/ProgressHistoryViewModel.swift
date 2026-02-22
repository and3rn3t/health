//
//  ProgressHistoryViewModel.swift
//  Andernet Posture
//
//  Drives the ProgressHistoryView — filters sessions by time range,
//  extracts trend points for the selected metric, and computes
//  improvement statistics (first → latest, best, worst).
//

import Foundation
import Observation

// MARK: - Time Range

/// Pre-set time ranges for filtering session history.
enum ProgressTimeRange: String, CaseIterable, Identifiable {
    case oneWeek     = "1W"
    case oneMonth    = "1M"
    case threeMonths = "3M"
    case sixMonths   = "6M"
    case oneYear     = "1Y"
    case all         = "All"

    var id: String { rawValue }

    /// Earliest date included in this range (nil = no lower bound).
    var startDate: Date? {
        let cal = Calendar.current
        switch self {
        case .oneWeek:     return cal.date(byAdding: .weekOfYear, value: -1, to: .now)
        case .oneMonth:    return cal.date(byAdding: .month, value: -1, to: .now)
        case .threeMonths: return cal.date(byAdding: .month, value: -3, to: .now)
        case .sixMonths:   return cal.date(byAdding: .month, value: -6, to: .now)
        case .oneYear:     return cal.date(byAdding: .year, value: -1, to: .now)
        case .all:         return nil
        }
    }
}

// MARK: - View Model

@Observable
@MainActor
final class ProgressHistoryViewModel {

    // MARK: User Selections

    var selectedTimeRange: ProgressTimeRange = .threeMonths
    var selectedCategory: MetricCategory = .posture
    var selectedMetric: ProgressMetric = ProgressMetric.posture[0] // default: Posture Score

    // MARK: Source Data

    private(set) var allSessions: [GaitSession] = []

    // MARK: Refresh

    /// Accepts sessions (typically from SwiftData @Query) — call on appear and on change.
    func refresh(sessions: [GaitSession]) {
        allSessions = sessions
    }

    // MARK: Computed — Filtered Sessions

    /// Sessions inside the selected time range, sorted oldest → newest.
    var filteredSessions: [GaitSession] {
        let sorted = allSessions.sorted { $0.date < $1.date }
        guard let start = selectedTimeRange.startDate else { return sorted }
        return sorted.filter { $0.date >= start }
    }

    // MARK: Computed — Trend Points

    /// (date, value) pairs for the selected metric within the time range.
    var trendPoints: [TrendPoint] {
        filteredSessions.compactMap { session in
            guard let value = selectedMetric.extractor(session) else { return nil }
            return TrendPoint(date: session.date, value: value)
        }
    }

    /// Average value across all trend points (used for RuleMark).
    var averageValue: Double? {
        let values = trendPoints.map(\.value)
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    // MARK: Computed — Statistics

    /// Percentage improvement from the first to the latest data point.
    /// Positive = improvement (respects `higherIsBetter`).
    var improvementPercent: Double? {
        guard trendPoints.count >= 2,
              let first = trendPoints.first?.value,
              let latest = trendPoints.last?.value,
              abs(first) > 0.001 else { return nil }

        let rawDelta = ((latest - first) / abs(first)) * 100
        return selectedMetric.higherIsBetter ? rawDelta : -rawDelta
    }

    /// Earliest value in the filtered range.
    var firstValue: Double? { trendPoints.first?.value }

    /// Latest (most recent) value in the filtered range.
    var latestValue: Double? { trendPoints.last?.value }

    /// Session with the best value for the selected metric.
    var bestSession: GaitSession? {
        let withValues = filteredSessions.compactMap { s -> (GaitSession, Double)? in
            guard let v = selectedMetric.extractor(s) else { return nil }
            return (s, v)
        }
        guard !withValues.isEmpty else { return nil }
        return selectedMetric.higherIsBetter
            ? withValues.max(by: { $0.1 < $1.1 })?.0
            : withValues.min(by: { $0.1 < $1.1 })?.0
    }

    /// Value of the best session.
    var bestValue: Double? {
        guard let best = bestSession else { return nil }
        return selectedMetric.extractor(best)
    }

    /// Session with the worst value for the selected metric.
    var worstSession: GaitSession? {
        let withValues = filteredSessions.compactMap { s -> (GaitSession, Double)? in
            guard let v = selectedMetric.extractor(s) else { return nil }
            return (s, v)
        }
        guard !withValues.isEmpty else { return nil }
        return selectedMetric.higherIsBetter
            ? withValues.min(by: { $0.1 < $1.1 })?.0
            : withValues.max(by: { $0.1 < $1.1 })?.0
    }

    /// Value of the worst session.
    var worstValue: Double? {
        guard let worst = worstSession else { return nil }
        return selectedMetric.extractor(worst)
    }

    /// Total number of sessions in the filtered range.
    var sessionCount: Int { filteredSessions.count }

    /// Number of sessions that have data for the selected metric.
    var dataPointCount: Int { trendPoints.count }

    // MARK: Category Helpers

    /// Metrics available within the currently selected category.
    var metricsForSelectedCategory: [ProgressMetric] {
        ProgressMetric.all.filter { $0.category == selectedCategory }
    }

    /// Updates category and auto-selects the first metric in that category.
    func selectCategory(_ category: MetricCategory) {
        selectedCategory = category
        if let first = ProgressMetric.all.first(where: { $0.category == category }) {
            selectedMetric = first
        }
    }
}
