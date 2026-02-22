//
//  ClinicalTests.swift
//  Andernet PostureTests
//
//  Phase 11: Comprehensive unit tests for clinical analyzers.
//

import Testing
import simd
@testable import Andernet_Posture

// MARK: - FallRiskAnalyzer Tests

struct FallRiskAnalyzerTests {

    let analyzer = DefaultFallRiskAnalyzer()

    @Test func optimalGaitLowRisk() async throws {
        let result = analyzer.assess(
            walkingSpeedMPS: 1.3,
            strideTimeCVPercent: 2.0,
            doubleSupportPercent: 25.0,
            stepWidthVariabilityCm: 1.5,
            swayVelocityMMS: 8.0,
            stepAsymmetryPercent: 3.0,
            tugTimeSec: 8.0,
            footClearanceM: 0.025
        )

        #expect(
            result.riskLevel == .low,
            "Normal gait parameters should yield low fall risk"
        )
        #expect(
            result.compositeScore < 30,
            "Composite score should be low for optimal gait"
        )
    }

    @Test func slowGaitElevatedRisk() async throws {
        let result = analyzer.assess(
            walkingSpeedMPS: 0.4,
            strideTimeCVPercent: 6.0,
            doubleSupportPercent: 35.0,
            stepWidthVariabilityCm: 4.0,
            swayVelocityMMS: 20.0,
            stepAsymmetryPercent: 12.0,
            tugTimeSec: 14.0,
            footClearanceM: 0.01
        )

        #expect(
            result.riskLevel != .low,
            "Multiple degraded gait parameters should elevate fall risk above low"
        )
    }

    @Test func multipleRiskFactors() async throws {
        let result = analyzer.assess(
            walkingSpeedMPS: 0.5,
            strideTimeCVPercent: 8.0,
            doubleSupportPercent: 40.0,
            stepWidthVariabilityCm: 5.0,
            swayVelocityMMS: 30.0,
            stepAsymmetryPercent: 20.0,
            tugTimeSec: 18.0,
            footClearanceM: 0.008
        )

        #expect(
            result.compositeScore > 40,
            "Multiple risk factors should yield high composite score"
        )
        #expect(
            result.riskFactorCount >= 3,
            "Should flag multiple risk factors"
        )
    }

    @Test func riskFactorBreakdown() async throws {
        let result = analyzer.assess(
            walkingSpeedMPS: 0.5,
            strideTimeCVPercent: 6.0,
            doubleSupportPercent: nil,
            stepWidthVariabilityCm: nil,
            swayVelocityMMS: 25.0,
            stepAsymmetryPercent: nil,
            tugTimeSec: nil,
            footClearanceM: nil
        )

        #expect(
            !result.factorBreakdown.isEmpty,
            "Should have at least one factor in breakdown"
        )
        let names = result.factorBreakdown.map(\.name)
        #expect(
            names.contains(where: { $0.contains("Speed") || $0.contains("speed") }),
            "Should include gait speed factor"
        )
    }
}

// MARK: - GaitPatternClassifier Tests

struct GaitPatternClassifierTests {

    let classifier = DefaultGaitPatternClassifier()

    @Test func normalGaitClassifiesNormal() async throws {
        let result = classifier.classify(
            stanceTimeLeftPercent: 60,
            stanceTimeRightPercent: 60,
            stepLengthLeftM: 0.35,
            stepLengthRightM: 0.35,
            cadenceSPM: 110,
            avgStepWidthCm: 8.0,
            stepWidthVariabilityCm: 1.5,
            pelvicObliquityDeg: 2.0,
            strideTimeCVPercent: 2.5,
            walkingSpeedMPS: 1.2,
            strideLengthM: 0.70,
            hipFlexionROMDeg: 40,
            armSwingAsymmetryPercent: 5
        )

        #expect(
            result.primaryPattern == .normal,
            "Typical gait metrics should classify as normal"
        )
        #expect(
            result.confidence > 0.3,
            "Normal gait should have reasonable confidence"
        )
    }

    @Test func highStepWidthVariabilityAtaxic() async throws {
        let result = classifier.classify(
            stanceTimeLeftPercent: 58,
            stanceTimeRightPercent: 62,
            stepLengthLeftM: 0.30,
            stepLengthRightM: 0.28,
            cadenceSPM: 95,
            avgStepWidthCm: 15.0,
            stepWidthVariabilityCm: 6.0,
            pelvicObliquityDeg: 3.0,
            strideTimeCVPercent: 7.0,
            walkingSpeedMPS: 0.8,
            strideLengthM: 0.58,
            hipFlexionROMDeg: 35,
            armSwingAsymmetryPercent: 15
        )

        let ataxicScore = result.patternScores[.ataxic] ?? 0
        #expect(
            ataxicScore > 0,
            "High step width variability should produce non-zero ataxic score"
        )
    }

    @Test func lowCadenceFestinating() async throws {
        let result = classifier.classify(
            stanceTimeLeftPercent: 55,
            stanceTimeRightPercent: 55,
            stepLengthLeftM: 0.15,
            stepLengthRightM: 0.14,
            cadenceSPM: 140,
            avgStepWidthCm: 6.0,
            stepWidthVariabilityCm: 1.0,
            pelvicObliquityDeg: 1.0,
            strideTimeCVPercent: 3.0,
            walkingSpeedMPS: 0.5,
            strideLengthM: 0.29,
            hipFlexionROMDeg: 20,
            armSwingAsymmetryPercent: 10
        )

        let festScore = result.patternScores[.festinating] ?? 0
        #expect(
            festScore > 0,
            "High cadence + short stride should produce non-zero festinating score"
        )
    }
}

// MARK: - CrossedSyndromeDetector Tests

struct CrossedSyndromeDetectorTests {

    let detector = DefaultCrossedSyndromeDetector()

    @Test func idealPostureNoSyndrome() async throws {
        let result = detector.detect(
            craniovertebralAngleDeg: 50,
            shoulderProtractionCm: 1.0,
            thoracicKyphosisDeg: 35,
            cervicalLordosisDeg: 15,
            pelvicTiltDeg: 5,
            lumbarLordosisDeg: 35,
            hipFlexionRestDeg: nil
        )

        #expect(
            result.upperCrossedScore < 20,
            "Ideal posture should have low upper crossed score"
        )
        #expect(
            result.lowerCrossedScore < 20,
            "Ideal posture should have low lower crossed score"
        )
        #expect(
            result.detectedSyndromes.isEmpty,
            "No syndromes should be detected for ideal posture"
        )
    }

    @Test func forwardHeadAndKyphosisUpperCrossed() async throws {
        let result = detector.detect(
            craniovertebralAngleDeg: 30,          // severe forward head
            shoulderProtractionCm: 5.0,            // protracted shoulders
            thoracicKyphosisDeg: 55,               // increased kyphosis
            cervicalLordosisDeg: 25,
            pelvicTiltDeg: 5,
            lumbarLordosisDeg: 35,
            hipFlexionRestDeg: nil
        )

        #expect(
            result.upperCrossedScore > 40,
            "Forward head + kyphosis should yield high upper crossed score"
        )
        #expect(
            !result.upperFactors.isEmpty,
            "Should list contributing upper factors"
        )
    }

    @Test func anteriorTiltLowerCrossed() async throws {
        let result = detector.detect(
            craniovertebralAngleDeg: 48,
            shoulderProtractionCm: 1.5,
            thoracicKyphosisDeg: 38,
            cervicalLordosisDeg: nil,
            pelvicTiltDeg: 20,                     // excessive anterior tilt
            lumbarLordosisDeg: 60,                 // hyperlordosis
            hipFlexionRestDeg: 15
        )

        #expect(
            result.lowerCrossedScore > 40,
            "Anterior tilt + lordosis should yield high lower crossed score"
        )
        #expect(
            !result.lowerFactors.isEmpty,
            "Should list contributing lower factors"
        )
    }
}

// MARK: - PainRiskEngine Tests

struct PainRiskEngineTests {

    let engine = DefaultPainRiskEngine()

    @Test func normalPostureLowRisk() async throws {
        let result = engine.assess(
            craniovertebralAngleDeg: 50,
            sagittalVerticalAxisCm: 1.0,
            thoracicKyphosisDeg: 35,
            lumbarLordosisDeg: 40,
            shoulderAsymmetryCm: 0.5,
            pelvicObliquityDeg: 1.0,
            pelvicTiltDeg: 5.0,
            coronalSpineDeviationCm: 0.3,
            kneeFlexionStandingDeg: 5.0,
            gaitAsymmetryPercent: 3.0
        )

        #expect(
            result.overallRiskScore < 30,
            "Normal posture should have low overall risk score"
        )
    }

    @Test func forwardHeadNeckRisk() async throws {
        let result = engine.assess(
            craniovertebralAngleDeg: 30,           // severe forward head
            sagittalVerticalAxisCm: 4.0,
            thoracicKyphosisDeg: 50,
            lumbarLordosisDeg: 40,
            shoulderAsymmetryCm: 1.0,
            pelvicObliquityDeg: 2.0,
            pelvicTiltDeg: 5.0,
            coronalSpineDeviationCm: 0.5,
            kneeFlexionStandingDeg: nil,
            gaitAsymmetryPercent: nil
        )

        let neckAlerts = result.alerts.filter { $0.region == .neck }
        #expect(
            !neckAlerts.isEmpty,
            "Forward head should generate neck-region alert"
        )
        #expect(
            neckAlerts.first!.riskScore > 20,
            "Neck risk score should be elevated with low CVA"
        )
    }

    @Test func multiRegionRiskAssessment() async throws {
        let result = engine.assess(
            craniovertebralAngleDeg: 28,
            sagittalVerticalAxisCm: 6.0,
            thoracicKyphosisDeg: 60,
            lumbarLordosisDeg: 60,
            shoulderAsymmetryCm: 3.0,
            pelvicObliquityDeg: 5.0,
            pelvicTiltDeg: 18.0,
            coronalSpineDeviationCm: 2.5,
            kneeFlexionStandingDeg: 20.0,
            gaitAsymmetryPercent: 15.0
        )

        let elevatedAlerts = result.alerts.filter { $0.riskScore > 20 }
        #expect(
            elevatedAlerts.count >= 2,
            "Multiple poor values should flag multiple regions"
        )
        #expect(
            result.overallRiskScore > 30,
            "Overall risk should be elevated with multiple deviations"
        )
    }
}

// MARK: - FrailtyScreener Tests

struct FrailtyScreenerTests {

    let screener = DefaultFrailtyScreener()

    @Test func healthyYoungAdultRobust() async throws {
        let result = screener.screen(
            walkingSpeedMPS: 1.4,
            heightM: 1.75,
            sexIsMale: true,
            age: 30,
            sixMinuteWalkDistanceM: 600,
            dailyStepCount: 10000,
            postureVariabilitySD: 2.0,
            strideTimeCVPercent: 2.0
        )

        #expect(
            result.classification == .robust,
            "Healthy young adult should be classified as robust"
        )
        #expect(
            result.friedScore == 0,
            "No Fried criteria should be met"
        )
    }

    @Test func slowWalkerPreFrail() async throws {
        let result = screener.screen(
            walkingSpeedMPS: 0.7,
            heightM: 1.65,
            sexIsMale: false,
            age: 72,
            sixMinuteWalkDistanceM: 350,
            dailyStepCount: 4000,
            postureVariabilitySD: 5.0,
            strideTimeCVPercent: 5.0
        )

        #expect(
            result.classification == .preFrail || result.classification == .frail,
            "Slow walker should be at least pre-frail"
        )
        #expect(
            result.friedScore >= 1,
            "At least one Fried criterion should be met"
        )
    }

    @Test func verySedentaryFrail() async throws {
        let result = screener.screen(
            walkingSpeedMPS: 0.4,
            heightM: 1.60,
            sexIsMale: false,
            age: 85,
            sixMinuteWalkDistanceM: 150,
            dailyStepCount: 1500,
            postureVariabilitySD: 8.0,
            strideTimeCVPercent: 9.0
        )

        #expect(
            result.classification == .preFrail || result.classification == .frail,
            "Very sedentary elderly should be pre-frail or frail"
        )
        #expect(
            result.friedScore >= 2,
            "Multiple Fried criteria should be met"
        )
    }
}

// MARK: - CardioEstimator Tests

struct CardioEstimatorTests {

    let estimator = DefaultCardioEstimator()

    @Test func walkingSpeedToMET() async throws {
        let result = estimator.estimate(
            walkingSpeedMPS: 1.0,
            cadenceSPM: 100,
            strideLengthM: 0.60
        )

        // 1.0 m/s ≈ 60 m/min → VO2 ≈ 9.5 → MET ≈ 2.7
        #expect(
            result.estimatedMET > 1.5 && result.estimatedMET < 5.0,
            "1.0 m/s should produce a reasonable MET (~2.7)"
        )
    }

    @Test func intensityClassification() async throws {
        // Sedentary — very slow
        let slow = estimator.estimate(
            walkingSpeedMPS: 0.3, cadenceSPM: 60, strideLengthM: 0.30
        )
        #expect(
            slow.intensity == .sedentary || slow.intensity == .light,
            "Very slow walking should be sedentary or light"
        )

        // Moderate — brisk walking
        let brisk = estimator.estimate(
            walkingSpeedMPS: 1.5, cadenceSPM: 120, strideLengthM: 0.75
        )
        #expect(
            brisk.intensity == .moderate || brisk.intensity == .light,
            "Brisk walking should be light or moderate intensity"
        )
    }

    @Test func sixMWTEvaluation() async throws {
        let result = estimator.evaluate6MWT(
            distanceM: 450,
            age: 65,
            heightM: 1.70,
            weightKg: 75,
            sexIsMale: true
        )

        #expect(
            result.distanceM == 450,
            "Distance should match input"
        )
        #expect(
            !result.classification.isEmpty,
            "Should provide a classification string"
        )
    }

    @Test func tugEvaluation() async throws {
        // Fast TUG → low risk
        let fast = estimator.evaluateTUG(timeSec: 8.0, age: 65)
        #expect(
            fast.fallRisk == .low,
            "Fast TUG (8s) should indicate low fall risk"
        )

        // Slow TUG → elevated risk
        let slow = estimator.evaluateTUG(timeSec: 16.0, age: 75)
        #expect(
            slow.fallRisk == .moderate || slow.fallRisk == .high,
            "Slow TUG (16s) should indicate elevated fall risk"
        )
    }
}
