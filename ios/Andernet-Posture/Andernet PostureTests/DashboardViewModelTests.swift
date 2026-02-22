//
//  DashboardViewModelTests.swift
//  Andernet PostureTests
//
//  Tests for DashboardViewModel — aggregation, trends, and computed properties.
//

import Testing
import Foundation
import SwiftData
@testable import Andernet_Posture

@Suite("DashboardViewModel")
struct DashboardViewModelTests {

    // MARK: - Helpers

    private func makeSession(
        date: Date = .now,
        duration: TimeInterval = 120,
        postureScore: Double? = 75,
        cadence: Double? = 110,
        stride: Double? = 1.3,
        speed: Double? = 1.2,
        cva: Double? = 48,
        fallRisk: Double? = 25,
        fallRiskLevel: String? = "low",
        fatigue: Double? = 0.2
    ) -> GaitSession {
        let s = GaitSession(date: date, duration: duration)
        s.postureScore = postureScore
        s.averageCadenceSPM = cadence
        s.averageStrideLengthM = stride
        s.averageWalkingSpeedMPS = speed
        s.averageCVADeg = cva
        s.fallRiskScore = fallRisk
        s.fallRiskLevel = fallRiskLevel
        s.fatigueIndex = fatigue
        return s
    }

    // MARK: - Tests

    @Test("Refresh with empty sessions clears all metrics")
    @MainActor
    func refreshWithEmpty() {
        let vm = DashboardViewModel()
        // Pre-set some values
        vm.totalSessions = 5
        vm.refresh(sessions: [])

        #expect(vm.totalSessions == 0)
        #expect(vm.recentPostureScore == nil)
        #expect(vm.recentCadence == nil)
        #expect(vm.totalWalkingTime == 0)
        #expect(vm.postureScoreTrend.isEmpty)
    }

    @Test("Refresh with sessions populates latest metrics")
    @MainActor
    func refreshPopulatesLatest() {
        let vm = DashboardViewModel()
        let older = makeSession(date: Date.now.addingTimeInterval(-3600), postureScore: 60)
        let newer = makeSession(date: .now, postureScore: 85, speed: 1.3)

        vm.refresh(sessions: [older, newer])

        #expect(vm.totalSessions == 2)
        #expect(vm.recentPostureScore == 85)
        #expect(vm.recentWalkingSpeed == 1.3)
    }

    @Test("Total walking time sums all sessions")
    @MainActor
    func totalWalkingTime() {
        let vm = DashboardViewModel()
        let s1 = makeSession(duration: 120)
        let s2 = makeSession(duration: 180)

        vm.refresh(sessions: [s1, s2])

        #expect(vm.totalWalkingTime == 300)
    }

    @Test("Trends are capped at 30 sessions, oldest first")
    @MainActor
    func trendsCapped() {
        let vm = DashboardViewModel()
        var sessions: [GaitSession] = []
        for i in 0..<40 {
            sessions.append(makeSession(
                date: Date.now.addingTimeInterval(Double(-i) * 3600),
                postureScore: Double(50 + i)
            ))
        }

        vm.refresh(sessions: sessions)

        #expect(vm.postureScoreTrend.count == 30)
        // Oldest should be first
        #expect(vm.postureScoreTrend.first!.value < vm.postureScoreTrend.last!.value)
    }

    @Test("Posture label maps score ranges correctly")
    @MainActor
    func postureLabel() {
        let vm = DashboardViewModel()
        vm.recentPostureScore = nil
        #expect(vm.postureLabel == String(localized: "No data"))

        vm.recentPostureScore = 90
        #expect(vm.postureLabel == String(localized: "Excellent"))

        vm.recentPostureScore = 70
        #expect(vm.postureLabel == String(localized: "Good"))

        vm.recentPostureScore = 45
        #expect(vm.postureLabel == String(localized: "Fair"))

        vm.recentPostureScore = 30
        #expect(vm.postureLabel == String(localized: "Needs Improvement"))
    }

    @Test("Fall risk label maps raw values correctly")
    @MainActor
    func fallRiskLabel() {
        let vm = DashboardViewModel()
        vm.recentFallRiskLevel = nil
        #expect(vm.fallRiskLabel == "—")

        vm.recentFallRiskLevel = "low"
        #expect(vm.fallRiskLabel == String(localized: "Low"))

        vm.recentFallRiskLevel = "moderate"
        #expect(vm.fallRiskLabel == String(localized: "Moderate"))

        vm.recentFallRiskLevel = "high"
        #expect(vm.fallRiskLabel == String(localized: "High"))
    }

    @Test("Walking speed label formats correctly")
    @MainActor
    func walkingSpeedLabel() {
        let vm = DashboardViewModel()
        vm.recentWalkingSpeed = nil
        #expect(vm.walkingSpeedLabel == "—")

        vm.recentWalkingSpeed = 1.25
        #expect(vm.walkingSpeedLabel == "1.25 m/s")
    }

    @Test("Trends skip sessions with nil metrics")
    @MainActor
    func trendsSkipNils() {
        let vm = DashboardViewModel()
        let withScore = makeSession(postureScore: 80)
        let noScore = makeSession(postureScore: nil)

        vm.refresh(sessions: [withScore, noScore])

        #expect(vm.postureScoreTrend.count == 1)
    }
}
