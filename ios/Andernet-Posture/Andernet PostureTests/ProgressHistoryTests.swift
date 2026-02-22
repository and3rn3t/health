//
//  ProgressHistoryTests.swift
//  Andernet PostureTests
//
//  Tests for ProgressMetric catalogue and ProgressHistoryViewModel logic.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - ProgressMetric Catalogue Tests

struct ProgressMetricTests {

    @Test func allMetricsHaveUniqueIDs() {
        let ids = ProgressMetric.all.map(\.id)
        let unique = Set(ids)
        #expect(ids.count == unique.count, "All metric IDs should be unique")
    }

    @Test func allMetricsHaveDisplayNames() {
        for metric in ProgressMetric.all {
            #expect(!metric.displayName.isEmpty, "Metric \(metric.id) should have a display name")
        }
    }

    @Test func allCategoriesRepresented() {
        let categories = Set(ProgressMetric.all.map(\.category))
        for cat in MetricCategory.allCases {
            #expect(categories.contains(cat), "Category \(cat.rawValue) should have at least one metric")
        }
    }

    @Test func extractorsReturnNilForEmptySession() {
        let session = GaitSession(date: .now, duration: 60)
        // Most metrics should be nil on a fresh session
        let nilCount = ProgressMetric.all.filter { $0.extractor(session) == nil }.count
        #expect(nilCount > 0, "Fresh session should have nil values for most metrics")
    }

    @Test func postureScoreExtraction() {
        let session = GaitSession(date: .now, duration: 60, postureScore: 85)
        let metric = ProgressMetric.all.first { $0.id == "postureScore" }!
        let value = metric.extractor(session)
        #expect(value == 85, "Should extract posture score correctly")
    }

    @Test func cadenceExtraction() {
        let session = GaitSession(date: .now, duration: 60, averageCadenceSPM: 112)
        let metric = ProgressMetric.all.first { $0.id == "cadence" }!
        let value = metric.extractor(session)
        #expect(value == 112, "Should extract cadence correctly")
    }
}

// MARK: - ProgressHistoryViewModel Tests

@MainActor
struct ProgressHistoryViewModelTests {

    // Helper to create a session at a given date with a posture score
    private func makeSession(daysAgo: Int, postureScore: Double? = nil, cadence: Double? = nil) -> GaitSession {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: .now)!
        let session = GaitSession(date: date, duration: 60, averageCadenceSPM: cadence, postureScore: postureScore)
        return session
    }

    @Test func filterByOneWeek() {
        let vm = ProgressHistoryViewModel()
        let sessions = [
            makeSession(daysAgo: 1, postureScore: 80),
            makeSession(daysAgo: 5, postureScore: 70),
            makeSession(daysAgo: 14, postureScore: 60),
            makeSession(daysAgo: 60, postureScore: 50),
        ]
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .oneWeek
        #expect(vm.filteredSessions.count == 2, "Should include only sessions within 1 week")
    }

    @Test func filterByOneMonth() {
        let vm = ProgressHistoryViewModel()
        let sessions = [
            makeSession(daysAgo: 1, postureScore: 80),
            makeSession(daysAgo: 20, postureScore: 70),
            makeSession(daysAgo: 60, postureScore: 50),
        ]
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .oneMonth
        #expect(vm.filteredSessions.count == 2, "Should include sessions within 1 month")
    }

    @Test func filterByAll() {
        let vm = ProgressHistoryViewModel()
        let sessions = [
            makeSession(daysAgo: 1, postureScore: 80),
            makeSession(daysAgo: 400, postureScore: 50),
        ]
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .all
        #expect(vm.filteredSessions.count == 2, "All should include every session")
    }

    @Test func trendPointsExtractCorrectly() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }!
        vm.refresh(sessions: [
            makeSession(daysAgo: 10, postureScore: 60),
            makeSession(daysAgo: 5, postureScore: 80),
            makeSession(daysAgo: 1, postureScore: nil), // no data
        ])
        vm.selectedTimeRange = .all
        #expect(vm.trendPoints.count == 2, "Should skip sessions without data")
    }

    @Test func improvementPercentPositive() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }! // higherIsBetter
        vm.refresh(sessions: [
            makeSession(daysAgo: 10, postureScore: 50),
            makeSession(daysAgo: 1, postureScore: 75),
        ])
        vm.selectedTimeRange = .all
        let improvement = vm.improvementPercent!
        #expect(improvement == 50, "75 from 50 = +50% improvement")
    }

    @Test func improvementPercentNegative() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }! // higherIsBetter
        vm.refresh(sessions: [
            makeSession(daysAgo: 10, postureScore: 80),
            makeSession(daysAgo: 1, postureScore: 60),
        ])
        vm.selectedTimeRange = .all
        let improvement = vm.improvementPercent!
        #expect(improvement == -25, "60 from 80 = -25% (worsened)")
    }

    @Test func improvementPercentLowerIsBetter() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "fallRisk" }! // higherIsBetter = false
        let sessions = [
            makeSession(daysAgo: 10, postureScore: nil),
            makeSession(daysAgo: 1, postureScore: nil),
        ]
        // Manually set fallRiskScore
        sessions[0].fallRiskScore = 80
        sessions[1].fallRiskScore = 60
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .all
        let improvement = vm.improvementPercent!
        // value went from 80 to 60, raw delta = -25%, but since lowerIsBetter → negate → +25%
        #expect(improvement == 25, "Fall risk decreasing from 80→60 should show +25% improvement")
    }

    @Test func improvementPercentNilForSingleSession() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }!
        vm.refresh(sessions: [makeSession(daysAgo: 1, postureScore: 80)])
        vm.selectedTimeRange = .all
        #expect(vm.improvementPercent == nil, "Should be nil with < 2 data points")
    }

    @Test func bestAndWorstSessionsHigherIsBetter() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }!
        let sessions = [
            makeSession(daysAgo: 10, postureScore: 50),
            makeSession(daysAgo: 5, postureScore: 90),
            makeSession(daysAgo: 1, postureScore: 70),
        ]
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .all
        #expect(vm.bestValue == 90, "Best should be highest for higherIsBetter")
        #expect(vm.worstValue == 50, "Worst should be lowest for higherIsBetter")
    }

    @Test func bestAndWorstSessionsLowerIsBetter() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "fallRisk" }! // lower is better
        let sessions = [
            makeSession(daysAgo: 10, postureScore: nil),
            makeSession(daysAgo: 5, postureScore: nil),
            makeSession(daysAgo: 1, postureScore: nil),
        ]
        sessions[0].fallRiskScore = 80
        sessions[1].fallRiskScore = 30
        sessions[2].fallRiskScore = 60
        vm.refresh(sessions: sessions)
        vm.selectedTimeRange = .all
        #expect(vm.bestValue == 30, "Best should be lowest for lowerIsBetter")
        #expect(vm.worstValue == 80, "Worst should be highest for lowerIsBetter")
    }

    @Test func selectCategoryAutoSelectsFirstMetric() {
        let vm = ProgressHistoryViewModel()
        vm.selectCategory(.balance)
        #expect(vm.selectedCategory == .balance)
        #expect(vm.selectedMetric.category == .balance)
        #expect(vm.selectedMetric.id == ProgressMetric.balance.first?.id)
    }

    @Test func dataPointCountMatchesTrendPoints() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "cadence" }!
        vm.refresh(sessions: [
            makeSession(daysAgo: 5, cadence: 110),
            makeSession(daysAgo: 3, cadence: nil),
            makeSession(daysAgo: 1, cadence: 120),
        ])
        vm.selectedTimeRange = .all
        #expect(vm.dataPointCount == 2)
        #expect(vm.sessionCount == 3)
    }

    @Test func averageValueComputed() {
        let vm = ProgressHistoryViewModel()
        vm.selectedMetric = ProgressMetric.all.first { $0.id == "postureScore" }!
        vm.refresh(sessions: [
            makeSession(daysAgo: 3, postureScore: 60),
            makeSession(daysAgo: 1, postureScore: 80),
        ])
        vm.selectedTimeRange = .all
        #expect(vm.averageValue == 70, "Average of 60 and 80 should be 70")
    }

    @Test func filteredSessionsSortedOldestFirst() {
        let vm = ProgressHistoryViewModel()
        vm.refresh(sessions: [
            makeSession(daysAgo: 1, postureScore: 80),
            makeSession(daysAgo: 10, postureScore: 60),
            makeSession(daysAgo: 5, postureScore: 70),
        ])
        vm.selectedTimeRange = .all
        let dates = vm.filteredSessions.map(\.date)
        #expect(dates == dates.sorted(), "Should be sorted oldest → newest")
    }
}
