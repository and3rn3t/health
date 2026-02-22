//
//  UserGoals.swift
//  Andernet Posture
//
//  SwiftData model for user goal targets.
//  Replaces the fragile @AppStorage("goalsJSON") pattern so goals
//  sync automatically via CloudKit alongside GaitSession data.
//

import Foundation
import SwiftData

@Model
final class UserGoals {
    // CloudKit requires property-level defaults.
    var sessionsPerWeek: Int = 5
    var targetPostureScore: Double = 80
    var targetWalkingSpeed: Double = 1.2
    var targetCadence: Double = 110

    /// Timestamp of last modification — used for conflict resolution display.
    var lastModified: Date = Date.now

    init(
        sessionsPerWeek: Int = 5,
        targetPostureScore: Double = 80,
        targetWalkingSpeed: Double = 1.2,
        targetCadence: Double = 110
    ) {
        self.sessionsPerWeek = sessionsPerWeek
        self.targetPostureScore = targetPostureScore
        self.targetWalkingSpeed = targetWalkingSpeed
        self.targetCadence = targetCadence
        self.lastModified = .now
    }
}

// MARK: - Migration Helper

extension UserGoals {
    /// Migrate from the legacy @AppStorage("goalsJSON") format.
    /// Returns nil if the JSON is empty or malformed.
    static func fromLegacyJSON(_ json: String) -> UserGoals? {
        guard !json.isEmpty,
              let data = json.data(using: .utf8),
              let legacy = try? JSONDecoder().decode(LegacyGoalConfig.self, from: data) else {
            return nil
        }
        return UserGoals(
            sessionsPerWeek: legacy.sessionsPerWeek,
            targetPostureScore: legacy.targetPostureScore,
            targetWalkingSpeed: legacy.targetWalkingSpeed,
            targetCadence: legacy.targetCadence
        )
    }

    /// The old Codable struct used by @AppStorage("goalsJSON").
    private struct LegacyGoalConfig: Codable {
        var sessionsPerWeek: Int
        var targetPostureScore: Double
        var targetWalkingSpeed: Double
        var targetCadence: Double
    }
}
