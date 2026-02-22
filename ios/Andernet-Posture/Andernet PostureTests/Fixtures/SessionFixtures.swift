//
//  SessionFixtures.swift
//  Andernet PostureTests
//
//  Shared GaitSession factories for unit tests.
//  Consolidates makeSession() helpers that were duplicated
//  across DashboardViewModelTests, ServiceTests, and others.
//

import Foundation
@testable import Andernet_Posture

// MARK: - SessionFixtures

/// Centralized GaitSession factories for testing.
enum SessionFixtures {

    // MARK: - Minimal

    /// An empty session with only date and duration set.
    static func empty(
        date: Date = .now,
        duration: TimeInterval = 120
    ) -> GaitSession {
        GaitSession(date: date, duration: duration)
    }

    // MARK: - Standard

    /// A session with common posture and gait metrics populated.
    static func standard(
        date: Date = .now,
        duration: TimeInterval = 300,
        postureScore: Double? = 75,
        cadence: Double? = 110,
        stride: Double? = 0.7,
        speed: Double? = 1.2,
        cva: Double? = 48,
        fallRisk: Double? = nil,
        fallRiskLevel: String? = nil,
        fatigue: Double? = nil
    ) -> GaitSession {
        let session = GaitSession(date: date, duration: duration)
        session.postureScore = postureScore
        session.averageCadenceSPM = cadence
        session.averageStrideLengthM = stride
        session.averageWalkingSpeedMPS = speed
        session.averageCVADeg = cva
        session.fallRiskScore = fallRisk
        session.fallRiskLevel = fallRiskLevel
        session.fatigueIndex = fatigue
        return session
    }

    // MARK: - Date-Relative

    /// A session with date offset by `daysAgo` days from now.
    static func daysAgo(
        _ days: Int,
        postureScore: Double? = nil,
        cadence: Double? = nil,
        speed: Double? = nil
    ) -> GaitSession {
        let date = Calendar.current.date(byAdding: .day, value: -days, to: .now)!
        let session = GaitSession(date: date, duration: 300)
        session.postureScore = postureScore
        session.averageCadenceSPM = cadence
        session.averageWalkingSpeedMPS = speed
        return session
    }

    // MARK: - Series

    /// Generate `count` sessions spread across recent days.
    static func series(count: Int, startDaysAgo: Int = 0) -> [GaitSession] {
        (0..<count).map { index in
            let date = Calendar.current.date(byAdding: .day, value: -(startDaysAgo + index), to: .now)!
            let session = GaitSession(date: date, duration: TimeInterval(180 + index * 30))
            session.postureScore = Double(60 + index * 2)
            session.averageCadenceSPM = Double(100 + index * 3)
            session.averageWalkingSpeedMPS = 1.0 + Double(index) * 0.05
            return session
        }
    }

    // MARK: - Clinical

    /// Session with clinical analysis metrics populated for SessionAnalysisEngine tests.
    static func clinical(
        cva: Double? = 48,
        sva: Double? = 3.0,
        trunkLean: Double? = 2.0,
        speed: Double? = 1.2,
        gaitAsymmetry: Double? = 5.0,
        sway: Double? = 8.0,
        fallRisk: Double? = 0.3,
        fatigue: Double? = 0.2,
        rebaScore: Int? = 3
    ) -> GaitSession {
        let session = GaitSession(date: .now, duration: 300)
        session.averageCVADeg = cva
        session.averageSVACm = sva
        session.averageTrunkLeanDeg = trunkLean
        session.averageWalkingSpeedMPS = speed
        session.gaitAsymmetryPercent = gaitAsymmetry
        session.averageSwayVelocityMMS = sway
        session.fallRiskScore = fallRisk
        session.fatigueIndex = fatigue
        session.rebaScore = rebaScore
        return session
    }
}
