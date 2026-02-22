//
//  SchemaVersioningTests.swift
//  Andernet PostureTests
//
//  Tests for SwiftData versioned schema and migration planning.
//

import Testing
import Foundation
import SwiftData
@testable import Andernet_Posture

// MARK: - SchemaVersioningTests

@Suite("SchemaVersioning")
struct SchemaVersioningTests {

    @Test func v1VersionIdentifierIsCorrect() {
        let version = SchemaV1.versionIdentifier
        #expect(version == Schema.Version(1, 0, 0))
    }

    @Test func v1ModelsContainGaitSessionAndUserGoals() {
        let models = SchemaV1.models
        #expect(models.count == 2)

        let names = models.map { String(describing: $0) }
        #expect(names.contains(where: { $0.contains("GaitSession") }))
        #expect(names.contains(where: { $0.contains("UserGoals") }))
    }

    @Test func migrationPlanHasV1Schema() {
        let schemas = GaitSessionMigrationPlan.schemas
        #expect(schemas.count >= 1)
    }

    @Test func migrationStagesAreValid() {
        // V1 is initial release — no migration stages expected yet.
        let stages = GaitSessionMigrationPlan.stages
        #expect(stages.isEmpty)
    }

    @Test func v1GaitSessionDefaultsArePopulated() {
        let session = SchemaV1.GaitSessionV1()
        #expect(session.duration == 0)
        #expect(session.averageCadenceSPM == nil)
        #expect(session.postureScore == nil)
        #expect(session.fallRiskScore == nil)
    }

    @Test func v1UserGoalsDefaultsAreReasonable() {
        let goals = SchemaV1.UserGoalsV1()
        #expect(goals.sessionsPerWeek == 5)
        #expect(goals.targetPostureScore == 80)
        #expect(goals.targetWalkingSpeed == 1.2)
        #expect(goals.targetCadence == 110)
    }
}
