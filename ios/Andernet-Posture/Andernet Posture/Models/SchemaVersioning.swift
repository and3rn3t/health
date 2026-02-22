//
//  SchemaVersioning.swift
//  Andernet Posture
//
//  SwiftData versioned schema definitions for safe model migration.
//  Each schema version captures the full model shape at that point in time.
//  When you add/remove/rename a stored property, create a new version
//  and add a corresponding migration plan stage.
//

import Foundation
import SwiftData

// MARK: - Schema Versions

/// V1: Initial schema — the model shape at first App Store release.
enum SchemaV1: VersionedSchema {
    static var versionIdentifier: Schema.Version { Schema.Version(1, 0, 0) }

    static var models: [any PersistentModel.Type] {
        [GaitSessionV1.self, UserGoalsV1.self]
    }

    @Model
    final class GaitSessionV1 {
        var date: Date = Date.now
        var duration: TimeInterval = 0
        var averageCadenceSPM: Double?
        var averageStrideLengthM: Double?
        var averageTrunkLeanDeg: Double?
        var postureScore: Double?
        var peakTrunkLeanDeg: Double?
        var averageLateralLeanDeg: Double?
        var totalSteps: Int?
        var averageCVADeg: Double?
        var averageSVACm: Double?
        var averageThoracicKyphosisDeg: Double?
        var averageLumbarLordosisDeg: Double?
        var averageShoulderAsymmetryCm: Double?
        var averagePelvicObliquityDeg: Double?
        var averageCoronalDeviationCm: Double?
        var kendallPosturalType: String?
        var nyprScore: Int?
        var averageWalkingSpeedMPS: Double?
        var averageStepWidthCm: Double?
        var gaitAsymmetryPercent: Double?
        var averageStanceTimePercent: Double?
        var averageSwingTimePercent: Double?
        var averageDoubleSupportPercent: Double?
        var strideTimeVariabilityCV: Double?
        var averageHipROMDeg: Double?
        var averageKneeROMDeg: Double?
        var trunkRotationRangeDeg: Double?
        var armSwingAsymmetryPercent: Double?
        var averageSwayVelocityMMS: Double?
        var swayAreaCm2: Double?
        var fallRiskScore: Double?
        var fallRiskLevel: String?
        var upperCrossedScore: Double?
        var lowerCrossedScore: Double?
        var gaitPatternClassification: String?
        var fatigueIndex: Double?
        var postureVariabilitySD: Double?
        var postureFatigueTrend: Double?
        var rebaScore: Int?
        var sparcScore: Double?
        var harmonicRatio: Double?
        var frailtyScore: Int?
        var sixMinuteWalkDistanceM: Double?
        var tugTimeSec: Double?
        var rombergRatio: Double?
        var walkRatio: Double?
        var estimatedMET: Double?
        var totalDistanceM: Double?
        var pedometerDistanceM: Double?
        var pedometerStepCount: Int?
        var floorsAscended: Int?
        var floorsDescended: Int?
        var imuCadenceSPM: Double?
        var imuStepCount: Int?
        var imuSwayRmsML: Double?
        var imuSwayRmsAP: Double?
        var imuSwayJerkRMS: Double?
        var dominantSwayFrequencyHz: Double?
        var trunkPeakRotationVelocityDPS: Double?
        var trunkAvgRotationRangeDeg: Double?
        var turnCount: Int?
        var trunkRotationAsymmetryPercent: Double?
        var trunkLateralFlexionAvgDeg: Double?
        var movementRegularityIndex: Double?
        @Attribute(.externalStorage) var sixMWTResultData: Data?
        @Attribute(.externalStorage) var painRiskAlertsData: Data?
        @Attribute(.externalStorage) var framesData: Data?
        @Attribute(.externalStorage) var stepEventsData: Data?
        @Attribute(.externalStorage) var motionFramesData: Data?

        init() {}
    }

    @Model
    final class UserGoalsV1 {
        var sessionsPerWeek: Int = 5
        var targetPostureScore: Double = 80
        var targetWalkingSpeed: Double = 1.2
        var targetCadence: Double = 110
        var lastModified: Date = Date.now

        init() {}
    }
}

// MARK: - Migration Plan

/// Defines the migration path across schema versions.
/// Add new `MigrationStage` entries here as you create new schema versions.
///
/// Example for future V2:
/// ```swift
/// enum SchemaV2: VersionedSchema { ... }
///
/// // Then add to the stages array:
/// .lightweight(fromVersion: SchemaV1.self, toVersion: SchemaV2.self)
/// // — or —
/// .custom(fromVersion: SchemaV1.self, toVersion: SchemaV2.self) { context in
///     // Manual migration logic
/// }
/// ```
enum GaitSessionMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] {
        [SchemaV1.self]
    }

    static var stages: [MigrationStage] {
        // No migrations yet — V1 is the initial release.
        // Future migrations go here in order.
        []
    }
}
