//
//  ClinicalNormsTests.swift
//  Andernet PostureTests
//
//  Comprehensive tests for ClinicalPostureNorms severity classifiers,
//  composite score helpers, and NormativeData age/sex classification.
//

import Testing
@testable import Andernet_Posture
import HealthKit

// MARK: - ClinicalSeverity Tests

struct ClinicalSeverityTests {

    @Test func colorNames() {
        #expect(ClinicalSeverity.normal.colorName == "green")
        #expect(ClinicalSeverity.mild.colorName == "yellow")
        #expect(ClinicalSeverity.moderate.colorName == "orange")
        #expect(ClinicalSeverity.severe.colorName == "red")
    }

    @Test func ordinalValues() {
        #expect(ClinicalSeverity.normal.ordinal == 0)
        #expect(ClinicalSeverity.mild.ordinal == 1)
        #expect(ClinicalSeverity.moderate.ordinal == 2)
        #expect(ClinicalSeverity.severe.ordinal == 3)
    }

    @Test func fromOrdinalRoundTrips() {
        for sev in ClinicalSeverity.allCases {
            #expect(ClinicalSeverity.from(ordinal: sev.ordinal) == sev)
        }
    }

    @Test func fromOrdinalClampsHigh() {
        // Any ordinal >= 3 should map to severe
        #expect(ClinicalSeverity.from(ordinal: 5) == .severe)
        #expect(ClinicalSeverity.from(ordinal: 99) == .severe)
    }
}

// MARK: - CVA Severity Tests

struct CVASeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.cvaSeverity(56) == .normal)
        #expect(PostureThresholds.cvaSeverity(49) == .normal)
        #expect(PostureThresholds.cvaSeverity(52) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.cvaSeverity(48) == .mild)
        #expect(PostureThresholds.cvaSeverity(40) == .mild)
        #expect(PostureThresholds.cvaSeverity(44) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.cvaSeverity(39) == .moderate)
        #expect(PostureThresholds.cvaSeverity(30) == .moderate)
        #expect(PostureThresholds.cvaSeverity(35) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.cvaSeverity(29) == .severe)
        #expect(PostureThresholds.cvaSeverity(10) == .severe)
        #expect(PostureThresholds.cvaSeverity(0) == .severe)
    }

    @Test func boundaryValues() {
        // Exact boundaries
        #expect(PostureThresholds.cvaSeverity(49) == .normal)  // >= 49 is normal
        #expect(PostureThresholds.cvaSeverity(48.999) == .mild)
        #expect(PostureThresholds.cvaSeverity(40) == .mild)    // >= 40 is mild
        #expect(PostureThresholds.cvaSeverity(39.999) == .moderate)
        #expect(PostureThresholds.cvaSeverity(30) == .moderate) // >= 30 is moderate
        #expect(PostureThresholds.cvaSeverity(29.999) == .severe)
    }
}

// MARK: - SVA Severity Tests

struct SVASeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.svaSeverity(0) == .normal)
        #expect(PostureThresholds.svaSeverity(4.9) == .normal)
        #expect(PostureThresholds.svaSeverity(2.5) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.svaSeverity(5.0) == .mild)
        #expect(PostureThresholds.svaSeverity(6.9) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.svaSeverity(7.0) == .moderate)
        #expect(PostureThresholds.svaSeverity(9.4) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.svaSeverity(9.5) == .severe)
        #expect(PostureThresholds.svaSeverity(15.0) == .severe)
    }

    @Test func negativeValuesUseAbsoluteValue() {
        // SVA uses abs()
        #expect(PostureThresholds.svaSeverity(-4.9) == .normal)
        #expect(PostureThresholds.svaSeverity(-5.0) == .mild)
        #expect(PostureThresholds.svaSeverity(-9.5) == .severe)
    }
}

// MARK: - Trunk Forward Severity Tests

struct TrunkForwardSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.trunkForwardSeverity(0) == .normal)
        #expect(PostureThresholds.trunkForwardSeverity(5) == .normal)
        #expect(PostureThresholds.trunkForwardSeverity(-5) == .normal) // abs
    }

    @Test func mildRange() {
        #expect(PostureThresholds.trunkForwardSeverity(5.1) == .mild)
        #expect(PostureThresholds.trunkForwardSeverity(10) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.trunkForwardSeverity(10.1) == .moderate)
        #expect(PostureThresholds.trunkForwardSeverity(20) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.trunkForwardSeverity(20.1) == .severe)
        #expect(PostureThresholds.trunkForwardSeverity(30) == .severe)
    }
}

// MARK: - Lateral Lean Severity Tests

struct LateralLeanSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.lateralLeanSeverity(0) == .normal)
        #expect(PostureThresholds.lateralLeanSeverity(2) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.lateralLeanSeverity(2.1) == .mild)
        #expect(PostureThresholds.lateralLeanSeverity(5) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.lateralLeanSeverity(5.1) == .moderate)
        #expect(PostureThresholds.lateralLeanSeverity(10) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.lateralLeanSeverity(10.1) == .severe)
    }

    @Test func negativeUsesAbsoluteValue() {
        #expect(PostureThresholds.lateralLeanSeverity(-2) == .normal)
        #expect(PostureThresholds.lateralLeanSeverity(-10.1) == .severe)
    }
}

// MARK: - Shoulder Severity Tests

struct ShoulderSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.shoulderSeverity(cm: 0) == .normal)
        #expect(PostureThresholds.shoulderSeverity(cm: 1.5) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.shoulderSeverity(cm: 1.6) == .mild)
        #expect(PostureThresholds.shoulderSeverity(cm: 3.0) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.shoulderSeverity(cm: 3.1) == .moderate)
        #expect(PostureThresholds.shoulderSeverity(cm: 5.0) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.shoulderSeverity(cm: 5.1) == .severe)
    }

    @Test func negativeUsesAbs() {
        #expect(PostureThresholds.shoulderSeverity(cm: -1.5) == .normal)
        #expect(PostureThresholds.shoulderSeverity(cm: -5.1) == .severe)
    }
}

// MARK: - Pelvic Severity Tests

struct PelvicSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.pelvicSeverity(0) == .normal)
        #expect(PostureThresholds.pelvicSeverity(1) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.pelvicSeverity(1.1) == .mild)
        #expect(PostureThresholds.pelvicSeverity(3) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.pelvicSeverity(3.1) == .moderate)
        #expect(PostureThresholds.pelvicSeverity(5) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.pelvicSeverity(5.1) == .severe)
    }
}

// MARK: - Kyphosis Severity Tests

struct KyphosisSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.kyphosisSeverity(20) == .normal)
        #expect(PostureThresholds.kyphosisSeverity(35) == .normal)
        #expect(PostureThresholds.kyphosisSeverity(45) == .normal)
    }

    @Test func mildHyperkyphosis() {
        // Above 45 but ≤ 55
        #expect(PostureThresholds.kyphosisSeverity(50) == .mild)
        #expect(PostureThresholds.kyphosisSeverity(55) == .mild)
    }

    @Test func moderateHyperkyphosis() {
        // Above 55 but ≤ 70
        #expect(PostureThresholds.kyphosisSeverity(60) == .moderate)
        #expect(PostureThresholds.kyphosisSeverity(70) == .moderate)
    }

    @Test func severeHyperkyphosis() {
        #expect(PostureThresholds.kyphosisSeverity(71) == .severe)
        #expect(PostureThresholds.kyphosisSeverity(90) == .severe)
    }

    @Test func mildHypokyphosis() {
        // Below 20 but ≥ 10
        #expect(PostureThresholds.kyphosisSeverity(15) == .mild)
        #expect(PostureThresholds.kyphosisSeverity(10) == .mild)
    }

    @Test func moderateHypokyphosis() {
        // Below 10
        #expect(PostureThresholds.kyphosisSeverity(9) == .moderate)
        #expect(PostureThresholds.kyphosisSeverity(5) == .moderate)
    }
}

// MARK: - Lordosis Severity Tests

struct LordosisSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.lordosisSeverity(40) == .normal)
        #expect(PostureThresholds.lordosisSeverity(50) == .normal)
        #expect(PostureThresholds.lordosisSeverity(60) == .normal)
    }

    @Test func mildDeviation() {
        // 25-40 or 60-70
        #expect(PostureThresholds.lordosisSeverity(35) == .mild)
        #expect(PostureThresholds.lordosisSeverity(25) == .mild)
        #expect(PostureThresholds.lordosisSeverity(65) == .mild)
        #expect(PostureThresholds.lordosisSeverity(70) == .mild)
    }

    @Test func moderateDeviation() {
        // 20-25 or 70-80
        #expect(PostureThresholds.lordosisSeverity(22) == .moderate)
        #expect(PostureThresholds.lordosisSeverity(75) == .moderate)
        #expect(PostureThresholds.lordosisSeverity(80) == .moderate)
    }

    @Test func severeDeviation() {
        #expect(PostureThresholds.lordosisSeverity(15) == .severe)
        #expect(PostureThresholds.lordosisSeverity(85) == .severe)
    }
}

// MARK: - Scoliosis Severity Tests

struct ScoliosisSeverityTests {

    @Test func normalRange() {
        #expect(PostureThresholds.scoliosisSeverity(cm: 0) == .normal)
        #expect(PostureThresholds.scoliosisSeverity(cm: 1.0) == .normal)
    }

    @Test func mildRange() {
        #expect(PostureThresholds.scoliosisSeverity(cm: 1.1) == .mild)
        #expect(PostureThresholds.scoliosisSeverity(cm: 2.0) == .mild)
    }

    @Test func moderateRange() {
        #expect(PostureThresholds.scoliosisSeverity(cm: 2.1) == .moderate)
        #expect(PostureThresholds.scoliosisSeverity(cm: 3.5) == .moderate)
    }

    @Test func severeRange() {
        #expect(PostureThresholds.scoliosisSeverity(cm: 3.6) == .severe)
    }

    @Test func negativeUsesAbs() {
        #expect(PostureThresholds.scoliosisSeverity(cm: -1.0) == .normal)
        #expect(PostureThresholds.scoliosisSeverity(cm: -3.6) == .severe)
    }
}

// MARK: - Gait Speed Severity Tests

struct GaitSpeedSeverityTests {

    @Test func normalRange() {
        #expect(GaitThresholds.speedSeverity(1.0) == .normal)
        #expect(GaitThresholds.speedSeverity(1.4) == .normal)
        #expect(GaitThresholds.speedSeverity(2.0) == .normal)
    }

    @Test func mildRange() {
        #expect(GaitThresholds.speedSeverity(0.99) == .mild)
        #expect(GaitThresholds.speedSeverity(0.8) == .mild)
    }

    @Test func moderateRange() {
        #expect(GaitThresholds.speedSeverity(0.79) == .moderate)
        #expect(GaitThresholds.speedSeverity(0.6) == .moderate)
    }

    @Test func severeRange() {
        #expect(GaitThresholds.speedSeverity(0.59) == .severe)
        #expect(GaitThresholds.speedSeverity(0.2) == .severe)
    }
}

// MARK: - Gait Symmetry Severity Tests

struct GaitSymmetrySeverityTests {

    @Test func normalRange() {
        #expect(GaitThresholds.symmetrySeverity(0) == .normal)
        #expect(GaitThresholds.symmetrySeverity(10) == .normal)
    }

    @Test func mildRange() {
        #expect(GaitThresholds.symmetrySeverity(10.1) == .mild)
        #expect(GaitThresholds.symmetrySeverity(15) == .mild)
    }

    @Test func moderateRange() {
        #expect(GaitThresholds.symmetrySeverity(15.1) == .moderate)
        #expect(GaitThresholds.symmetrySeverity(25) == .moderate)
    }

    @Test func severeRange() {
        #expect(GaitThresholds.symmetrySeverity(25.1) == .severe)
    }
}

// MARK: - SubScore Tests

struct PostureSubScoreTests {

    @Test func perfectScoreAtIdeal() {
        let score = PostureThresholds.subScore(measured: 52.5, idealTarget: 52.5, maxDeviation: 20)
        #expect(score == 100.0)
    }

    @Test func zeroScoreAtMaxDeviation() {
        let score = PostureThresholds.subScore(measured: 72.5, idealTarget: 52.5, maxDeviation: 20)
        #expect(score == 0.0)
    }

    @Test func zeroScoreBeyondMaxDeviation() {
        let score = PostureThresholds.subScore(measured: 80, idealTarget: 52.5, maxDeviation: 20)
        #expect(score == 0.0, "Score should clamp to 0 beyond max deviation")
    }

    @Test func halfScoreAtHalfDeviation() {
        let score = PostureThresholds.subScore(measured: 62.5, idealTarget: 52.5, maxDeviation: 20)
        #expect(abs(score - 50.0) < 0.01)
    }

    @Test func negativeDeviationSymmetric() {
        let left = PostureThresholds.subScore(measured: 42.5, idealTarget: 52.5, maxDeviation: 20)
        let right = PostureThresholds.subScore(measured: 62.5, idealTarget: 52.5, maxDeviation: 20)
        #expect(abs(left - right) < 0.01, "Symmetric deviations should produce equal scores")
    }

    @Test func zeroMaxDeviationReturns100() {
        let score = PostureThresholds.subScore(measured: 50, idealTarget: 52.5, maxDeviation: 0)
        #expect(score == 100.0, "Guard clause for maxDeviation == 0")
    }
}

// MARK: - NormativeData Tests

struct NormativeDataTests {

    @Test func gaitSpeedRangeForYoungMale() {
        let range = NormativeData.normalRange(for: .gaitSpeed, age: 25, sex: .male)
        #expect(range != nil)
        #expect(range!.lowerBound == 1.10)
        #expect(range!.upperBound == 1.36)
    }

    @Test func gaitSpeedRangeForElderlyFemale() {
        let range = NormativeData.normalRange(for: .gaitSpeed, age: 75, sex: .female)
        #expect(range != nil)
        #expect(range!.lowerBound == 0.90)
        #expect(range!.upperBound == 1.13)
    }

    @Test func cadenceReturnsRangeForMiddleAge() {
        let range = NormativeData.normalRange(for: .cadence, age: 50, sex: .male)
        #expect(range != nil)
        #expect(range!.lowerBound == 105)
        #expect(range!.upperBound == 115)
    }

    @Test func cvaUsesNotSetSex() {
        // CVA bands use .notSet — should still match with any sex
        let range = NormativeData.normalRange(for: .craniovertebralAngle, age: 30, sex: .male)
        #expect(range != nil)
        #expect(range!.lowerBound == 48)
    }

    @Test func nilAgeReturnsSomething() {
        // Should return first band when age is nil
        let range = NormativeData.normalRange(for: .gaitSpeed, age: nil)
        #expect(range != nil)
    }

    @Test func classifyWithinNormalRange() {
        let severity = NormativeData.classify(value: 1.2, metric: .gaitSpeed, age: 25, sex: .male)
        #expect(severity == .normal)
    }

    @Test func classifySlightlyBelowNormal() {
        // Range for male 20-29 is 1.10–1.36. Span = 0.26
        // Value 1.05 → deviation = 0.05, relativeDeviation = 0.05/0.26 ≈ 0.19 → mild
        let severity = NormativeData.classify(value: 1.05, metric: .gaitSpeed, age: 25, sex: .male)
        #expect(severity == .mild)
    }

    @Test func classifyModerateDeviation() {
        // Range for male 20-29 is 1.10–1.36. Span = 0.26
        // Value 0.90 → deviation = 0.20, relativeDeviation = 0.20/0.26 ≈ 0.77 → severe
        let severity = NormativeData.classify(value: 0.90, metric: .gaitSpeed, age: 25, sex: .male)
        #expect(severity == .severe)
    }

    @Test func classifyAboveNormal() {
        // Being very fast is fine in practice but classify flags deviation
        // Range for male 20-29 is 1.10–1.36. Span = 0.26
        // Value 1.40 → deviation = 0.04, relativeDeviation ≈ 0.15 → mild
        let severity = NormativeData.classify(value: 1.40, metric: .gaitSpeed, age: 25, sex: .male)
        #expect(severity == .mild)
    }

    @Test func classifyFallsBackNearest() {
        // Age 90 → falls to 80-99 band for gait speed
        let range = NormativeData.normalRange(for: .gaitSpeed, age: 90, sex: .male)
        #expect(range != nil)
        #expect(range!.lowerBound == 0.70)
    }

    @Test func kyphosisAgeStratified() {
        let young = NormativeData.normalRange(for: .thoracicKyphosis, age: 25)
        let old = NormativeData.normalRange(for: .thoracicKyphosis, age: 75)
        #expect(young != nil)
        #expect(old != nil)
        // Older adults tolerate more kyphosis
        #expect(old!.upperBound > young!.upperBound)
    }

    @Test func strideLengthSexDifference() {
        let male = NormativeData.normalRange(for: .strideLength, age: 25, sex: .male)
        let female = NormativeData.normalRange(for: .strideLength, age: 25, sex: .female)
        #expect(male != nil)
        #expect(female != nil)
        // Males typically have longer stride
        #expect(male!.upperBound > female!.upperBound)
    }
}
