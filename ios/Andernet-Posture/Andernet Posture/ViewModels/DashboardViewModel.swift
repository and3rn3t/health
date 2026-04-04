//
//  DashboardViewModel.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import SwiftData
import Observation

/// Data point for trend charts on the dashboard.
struct TrendPoint: Identifiable {
    let id: Int
    let date: Date
    let value: Double
}

/// Drives the DashboardView — aggregates session history into displayable summaries.
@Observable
@MainActor
final class DashboardViewModel {

    // MARK: - Aggregated metrics

    var recentPostureScore: Double?
    var recentCadence: Double?
    var recentStrideLength: Double?
    var totalSessions: Int = 0
    var totalWalkingTime: TimeInterval = 0

    // Clinical metrics (most recent)
    var recentWalkingSpeed: Double?
    var recentCVA: Double?
    var recentFallRiskScore: Double?
    var recentFallRiskLevel: String?
    var recentGaitSymmetry: Double?
    var recentRebaScore: Int?
    var recentFatigueIndex: Double?
    var recentKendallType: String?
    var recentGaitPattern: String?
    var recentSPARC: Double?

    // Trend data for Swift Charts
    var postureScoreTrend: [TrendPoint] = []
    var cadenceTrend: [TrendPoint] = []
    var strideLengthTrend: [TrendPoint] = []
    var walkingSpeedTrend: [TrendPoint] = []
    var cvaTrend: [TrendPoint] = []
    var fallRiskTrend: [TrendPoint] = []
    var fatigueTrend: [TrendPoint] = []

    // Insights
    var insights: [Insight] = []
    private let insightsEngine: any InsightsEngine = DefaultInsightsEngine()

    // Quick posture summary
    var postureLabel: String {
        guard let score = recentPostureScore else { return String(localized: "No data") }
        switch score {
        case 80...100: return String(localized: "Excellent")
        case 60..<80:  return String(localized: "Good")
        case 40..<60:  return String(localized: "Fair")
        default:       return String(localized: "Needs Improvement")
        }
    }

    var fallRiskLabel: String {
        guard let level = recentFallRiskLevel else { return "—" }
        // Map stored raw values to localized display strings.
        // Using .capitalized would produce English-only output.
        switch level {
        case "low":      return String(localized: "Low")
        case "moderate": return String(localized: "Moderate")
        case "high":     return String(localized: "High")
        default:         return level.capitalized
        }
    }

    var walkingSpeedLabel: String {
        guard let speed = recentWalkingSpeed else { return "—" }
        return String(format: "%.2f m/s", speed)
    }

    var formattedTotalTime: String {
        totalWalkingTime.longForm
    }

    // MARK: - Refresh

    /// Recompute dashboard from the given sessions (call on appear or after capture).
    func refresh(sessions: [GaitSession]) {
        let dashToken = PerformanceMonitor.begin(.dashboardRefresh)
        defer { PerformanceMonitor.end(dashToken) }

        totalSessions = sessions.count

        guard !sessions.isEmpty else {
            recentPostureScore = nil
            recentCadence = nil
            recentStrideLength = nil
            recentWalkingSpeed = nil
            recentCVA = nil
            recentFallRiskScore = nil
            recentFallRiskLevel = nil
            recentGaitSymmetry = nil
            recentRebaScore = nil
            recentFatigueIndex = nil
            recentKendallType = nil
            recentGaitPattern = nil
            recentSPARC = nil
            totalWalkingTime = 0
            postureScoreTrend = []
            cadenceTrend = []
            strideLengthTrend = []
            walkingSpeedTrend = []
            cvaTrend = []
            fallRiskTrend = []
            fatigueTrend = []
            return
        }

        // Most recent values
        let sorted = sessions.sorted { $0.date > $1.date }
        let latest = sorted.first
        recentPostureScore = latest?.postureScore
        recentCadence = latest?.averageCadenceSPM
        recentStrideLength = latest?.averageStrideLengthM
        recentWalkingSpeed = latest?.averageWalkingSpeedMPS
        recentCVA = latest?.averageCVADeg
        recentFallRiskScore = latest?.fallRiskScore
        recentFallRiskLevel = latest?.fallRiskLevel
        recentGaitSymmetry = latest?.gaitAsymmetryPercent
        recentRebaScore = latest?.rebaScore
        recentFatigueIndex = latest?.fatigueIndex
        recentKendallType = latest?.kendallPosturalType
        recentGaitPattern = latest?.gaitPatternClassification
        recentSPARC = latest?.sparcScore

        totalWalkingTime = sessions.reduce(0) { $0 + $1.duration }

        // Trends (last 30 sessions, oldest first) — single-pass build
        let trendSessions = Array(sorted.prefix(30).reversed())

        var posture: [TrendPoint] = []
        var cadence: [TrendPoint] = []
        var stride: [TrendPoint] = []
        var speed: [TrendPoint] = []
        var cva: [TrendPoint] = []
        var risk: [TrendPoint] = []
        var fatigue: [TrendPoint] = []

        for (i, s) in trendSessions.enumerated() {
            let date = s.date
            if let v = s.postureScore { posture.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.averageCadenceSPM { cadence.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.averageStrideLengthM { stride.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.averageWalkingSpeedMPS { speed.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.averageCVADeg { cva.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.fallRiskScore { risk.append(TrendPoint(id: i, date: date, value: v)) }
            if let v = s.fatigueIndex { fatigue.append(TrendPoint(id: i, date: date, value: v)) }
        }

        postureScoreTrend = posture
        cadenceTrend = cadence
        strideLengthTrend = stride
        walkingSpeedTrend = speed
        cvaTrend = cva
        fallRiskTrend = risk
        fatigueTrend = fatigue

        // Generate clinical insights
        insights = insightsEngine.generateInsights(from: sessions)
    }
}
