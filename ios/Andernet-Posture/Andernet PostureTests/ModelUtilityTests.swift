//
//  ModelUtilityTests.swift
//  Andernet PostureTests
//
//  Tests for data models (UserGoals, DisplayNames, ExerciseLibrary,
//  MotionFrame) and utilities (PerformanceMonitor).
//

import Testing
@testable import Andernet_Posture

// MARK: - UserGoals Tests

struct UserGoalsTests {

    @Test func defaultValues() {
        let goals = UserGoals()
        #expect(goals.sessionsPerWeek == 5)
        #expect(goals.targetPostureScore == 80)
        #expect(goals.targetWalkingSpeed == 1.2)
        #expect(goals.targetCadence == 110)
    }

    @Test func customInit() {
        let goals = UserGoals(
            sessionsPerWeek: 3,
            targetPostureScore: 90,
            targetWalkingSpeed: 1.4,
            targetCadence: 120
        )
        #expect(goals.sessionsPerWeek == 3)
        #expect(goals.targetPostureScore == 90)
        #expect(goals.targetWalkingSpeed == 1.4)
        #expect(goals.targetCadence == 120)
    }

    @Test func fromLegacyJSONValid() {
        let json = """
        {"sessionsPerWeek":7,"targetPostureScore":85,"targetWalkingSpeed":1.3,"targetCadence":115}
        """
        let goals = UserGoals.fromLegacyJSON(json)
        #expect(goals != nil)
        #expect(goals!.sessionsPerWeek == 7)
        #expect(goals!.targetPostureScore == 85)
        #expect(goals!.targetWalkingSpeed == 1.3)
        #expect(goals!.targetCadence == 115)
    }

    @Test func fromLegacyJSONEmpty() {
        #expect(UserGoals.fromLegacyJSON("") == nil)
    }

    @Test func fromLegacyJSONMalformed() {
        #expect(UserGoals.fromLegacyJSON("{not valid json}") == nil)
    }

    @Test func fromLegacyJSONMissingFields() {
        let json = """
        {"sessionsPerWeek":4}
        """
        // Missing required fields → should fail decoding
        #expect(UserGoals.fromLegacyJSON(json) == nil)
    }
}

// MARK: - DisplayNames Tests

struct DisplayNamesTests {

    @Test func kendallDisplayNames() {
        #expect("ideal".kendallDisplayName == "Ideal")
        #expect("kyphosisLordosis".kendallDisplayName == "Kyphosis-Lordosis")
        #expect("flatBack".kendallDisplayName == "Flat Back")
        #expect("swayBack".kendallDisplayName == "Sway Back")
    }

    @Test func kendallDisplayNameUnknownCapitalizes() {
        #expect("someNewType".kendallDisplayName == "Somenewtype")
    }

    @Test func kendallShortNames() {
        #expect("ideal".kendallShortName == "Ideal")
        #expect("kyphosisLordosis".kendallShortName == "Kypho-Lord")
        #expect("flatBack".kendallShortName == "Flat Back")
        #expect("swayBack".kendallShortName == "Sway Back")
    }

    @Test func patternDisplayNames() {
        #expect("normal".patternDisplayName == "Normal")
        #expect("antalgic".patternDisplayName == "Antalgic")
        #expect("trendelenburg".patternDisplayName == "Trendelenburg")
        #expect("festinating".patternDisplayName == "Festinating")
        #expect("circumduction".patternDisplayName == "Circumduction")
        #expect("ataxic".patternDisplayName == "Ataxic")
        #expect("waddling".patternDisplayName == "Waddling")
        #expect("steppage".patternDisplayName == "Steppage")
    }

    @Test func patternDisplayNameUnknownCapitalizes() {
        #expect("unknownGait".patternDisplayName == "Unknowngait")
    }
}

// MARK: - ExerciseLibrary Tests

struct ExerciseLibraryTests {

    @Test func knownConditionsReturnExercises() {
        let conditions = [
            "forwardHeadPosture", "lowCVA",
            "sagittalImbalance", "highSVA", "trunkForwardLean",
            "lowWalkingSpeed", "sarcopenia",
            "gaitAsymmetry", "strideAsymmetry",
            "fallRisk", "balanceDeficit",
            "thoracicKyphosis", "roundedBack",
            "shoulderAsymmetry", "pelvicObliquity",
            "fatigue", "earlyFatigue",
            "postureDecline",
            "ergonomicRisk", "highREBA"
        ]

        for condition in conditions {
            let exercises = ExerciseLibrary.exercises(for: condition)
            #expect(!exercises.isEmpty,
                    "\(condition) should return at least one exercise")
        }
    }

    @Test func unknownConditionReturnsEmpty() {
        let exercises = ExerciseLibrary.exercises(for: "totallyFakeCondition")
        #expect(exercises.isEmpty)
    }

    @Test func exercisesHaveRequiredFields() {
        let exercises = ExerciseLibrary.exercises(for: "forwardHeadPosture")
        for ex in exercises {
            #expect(!ex.name.isEmpty)
            #expect(!ex.description.isEmpty)
            #expect(!ex.instructions.isEmpty)
            #expect(!ex.icon.isEmpty)
            #expect(!ex.duration.isEmpty)
            #expect(!ex.frequency.isEmpty)
            #expect(!ex.targetArea.isEmpty)
            #expect(!ex.evidenceBasis.isEmpty)
        }
    }

    @Test func exerciseDifficultyLabels() {
        #expect(ExerciseRecommendation.Difficulty.beginner.label == "Beginner")
        #expect(ExerciseRecommendation.Difficulty.intermediate.label == "Intermediate")
        #expect(ExerciseRecommendation.Difficulty.advanced.label == "Advanced")
    }

    @Test func exerciseDifficultyIcons() {
        for difficulty in ExerciseRecommendation.Difficulty.allCases {
            #expect(!difficulty.icon.isEmpty)
        }
    }
}

// MARK: - PerformanceMonitor Tests

struct PerformanceMonitorTests {

    @Test func operationCategoriesNotEmpty() {
        for op in PerformanceMonitor.Operation.allCases {
            #expect(!op.category.isEmpty, "\(op.rawValue) needs a category")
        }
    }

    @Test func allOperationsHaveRawValues() {
        for op in PerformanceMonitor.Operation.allCases {
            #expect(!op.rawValue.isEmpty)
        }
    }

    @Test func measureRecordsStats() {
        PerformanceMonitor.resetAll()
        PerformanceMonitor.isEnabled = true

        PerformanceMonitor.measure(.postureAnalysis) {
            // Simulate a tiny workload
            var sum = 0.0
            for i in 0..<1000 { sum += Double(i) }
            _ = sum
        }

        let stats = PerformanceMonitor.stats(for: .postureAnalysis)
        #expect(stats != nil)
        #expect(stats!.sampleCount >= 1)
        #expect(stats!.averageMs >= 0)
    }

    @Test func beginEndRecordsStats() {
        PerformanceMonitor.resetAll()
        PerformanceMonitor.isEnabled = true

        let token = PerformanceMonitor.begin(.gaitAnalysis)
        var sum = 0.0
        for i in 0..<1000 { sum += Double(i) }
        _ = sum
        PerformanceMonitor.end(token)

        let stats = PerformanceMonitor.stats(for: .gaitAnalysis)
        #expect(stats != nil)
        #expect(stats!.sampleCount >= 1)
    }

    @Test func resetClearsAllStats() {
        PerformanceMonitor.isEnabled = true
        PerformanceMonitor.measure(.romAnalysis) { _ = 1 + 1 }

        PerformanceMonitor.resetAll()

        let stats = PerformanceMonitor.stats(for: .romAnalysis)
        #expect(stats!.sampleCount == 0)
    }

    @Test func reportProducesNonEmptyString() {
        PerformanceMonitor.resetAll()
        PerformanceMonitor.isEnabled = true

        // Record directly via begin/end to ensure stats are populated
        let token = PerformanceMonitor.begin(.sessionSave)
        var sum = 0.0
        for i in 0..<100 { sum += Double(i) }
        _ = sum
        PerformanceMonitor.end(token)

        let report = PerformanceMonitor.report()
        #expect(report.contains("Performance Report"))
    }

    @Test func disabledMonitorStillRecords() {
        // Stats are always recorded; isEnabled controls signposts only
        PerformanceMonitor.resetAll()
        PerformanceMonitor.isEnabled = false

        PerformanceMonitor.measure(.balanceAnalysis) { _ = 1 + 1 }

        let stats = PerformanceMonitor.stats(for: .balanceAnalysis)
        #expect(stats!.sampleCount >= 1)
    }

    @Test func p95WithFewSamplesFallsToPeak() {
        PerformanceMonitor.resetAll()
        PerformanceMonitor.isEnabled = true

        // Record only 2 samples — fewer than the 5-sample minimum for P95
        PerformanceMonitor.measure(.insightsGeneration) { _ = 1 + 1 }
        PerformanceMonitor.measure(.insightsGeneration) { _ = 1 + 1 }

        let stats = PerformanceMonitor.stats(for: .insightsGeneration)!
        // With < 5 samples, p95 should return peakMs
        #expect(stats.p95Ms == stats.peakDurationMs)
    }
}

// MARK: - GaitPatternType / Enum Tests

struct ClinicalEnumTests {

    @Test func fallRiskLevelRawValues() {
        let levels: [FallRiskLevel] = [.low, .moderate, .high]
        #expect(levels.count == 3)
        #expect(FallRiskLevel(rawValue: "low") == .low)
        #expect(FallRiskLevel(rawValue: "high") == .high)
    }

    @Test func gaitPatternTypeAllCases() {
        let expected = ["normal", "antalgic", "trendelenburg", "festinating",
                        "circumduction", "ataxic", "waddling", "stiffKnee"]
        for raw in expected {
            #expect(GaitPatternType(rawValue: raw) != nil, "\(raw) should be a valid case")
        }
    }

    @Test func posturalTypeAllCases() {
        let expected = ["ideal", "kyphosisLordosis", "flatBack", "swayBack"]
        for raw in expected {
            #expect(PosturalType(rawValue: raw) != nil, "\(raw) should be a valid case")
        }
    }

    @Test func clinicalTestTypeAllCases() {
        let expected = ["timedUpAndGo", "romberg", "sixMinuteWalk"]
        for raw in expected {
            #expect(ClinicalTestType(rawValue: raw) != nil, "\(raw) should be valid")
        }
    }

    @Test func nyprMaxAutomatableScore() {
        #expect(NYPRItem.maxAutomatableScore == NYPRItem.allCases.count * 5)
    }

    @Test func rebaRiskLevels() {
        let levels: [REBARiskLevel] = [.negligible, .low, .medium, .high, .veryHigh]
        #expect(levels.count == 5)
    }

    @Test func painRiskRegions() {
        let regions: [PainRiskRegion] = [.neck, .shoulder, .upperBack, .lowerBack, .hip, .knee]
        #expect(regions.count == 6)
    }

    @Test func crossedSyndromeTypes() {
        #expect(CrossedSyndromeType(rawValue: "upperCrossed") != nil)
        #expect(CrossedSyndromeType(rawValue: "lowerCrossed") != nil)
    }
}
