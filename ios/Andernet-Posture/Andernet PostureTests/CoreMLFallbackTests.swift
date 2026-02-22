//
//  CoreMLFallbackTests.swift
//  Andernet PostureTests
//
//  Tests that CoreML wrappers correctly fall back to rule-based analyzers
//  when useMLModels is false or models are unavailable (the normal state
//  in development — .mlmodelc bundles are not shipped yet).
//

import Testing
import simd
@testable import Andernet_Posture

// MARK: - Shared Setup

/// A dedicated MLModelService with ML disabled for fallback testing.
@MainActor
private func disabledMLService() -> MLModelService {
    let svc = MLModelService()
    svc.useMLModels = false
    return svc
}

/// A dedicated MLModelService with ML enabled but no models in bundle.
@MainActor
private func enabledMLServiceNoModels() -> MLModelService {
    let svc = MLModelService()
    svc.useMLModels = true
    return svc
}

// MARK: - CoreMLPostureAnalyzer Fallback Tests

struct CoreMLPostureAnalyzerFallbackTests {

    @MainActor
    @Test func fallbackWhenMLDisabledReturnsGeometric() async throws {
        let analyzer = CoreMLPostureAnalyzer(modelService: disabledMLService())
        let fallback = DefaultPostureAnalyzer()

        // Build a minimal joint set
        let joints = makeIdealJoints()

        let mlResult = analyzer.analyze(joints: joints)
        let ruleResult = fallback.analyze(joints: joints)

        // Both should produce the same result when ML is off
        #expect(mlResult != nil)
        #expect(ruleResult != nil)
        if let ml = mlResult, let rule = ruleResult {
            #expect(abs(ml.postureScore - rule.postureScore) < 0.01,
                    "Fallback should match rule-based scorer exactly")
            #expect(ml.posturalType == rule.posturalType)
        }
    }

    @MainActor
    @Test func fallbackWhenMLEnabledButNoModel() async throws {
        let analyzer = CoreMLPostureAnalyzer(modelService: enabledMLServiceNoModels())
        let fallback = DefaultPostureAnalyzer()
        let joints = makeIdealJoints()

        let mlResult = analyzer.analyze(joints: joints)
        let ruleResult = fallback.analyze(joints: joints)

        #expect(mlResult != nil)
        #expect(ruleResult != nil)
        if let ml = mlResult, let rule = ruleResult {
            #expect(abs(ml.postureScore - rule.postureScore) < 0.01)
        }
    }
}

// MARK: - CoreMLGaitPatternClassifier Fallback Tests

struct CoreMLGaitPatternFallbackTests {

    @MainActor
    @Test func fallbackWhenMLDisabled() async throws {
        let classifier = CoreMLGaitPatternClassifier(modelService: disabledMLService())
        let fallback = DefaultGaitPatternClassifier()

        let mlResult = classifier.classify(
            stanceTimeLeftPercent: 60,
            stanceTimeRightPercent: 60,
            stepLengthLeftM: 0.65,
            stepLengthRightM: 0.65,
            cadenceSPM: 110,
            avgStepWidthCm: 10,
            stepWidthVariabilityCm: 1.5,
            pelvicObliquityDeg: 1.0,
            strideTimeCVPercent: 2.0,
            walkingSpeedMPS: 1.2,
            strideLengthM: 1.30,
            hipFlexionROMDeg: 35,
            armSwingAsymmetryPercent: 5,
            kneeFlexionROMDeg: 65
        )

        let ruleResult = fallback.classify(
            stanceTimeLeftPercent: 60,
            stanceTimeRightPercent: 60,
            stepLengthLeftM: 0.65,
            stepLengthRightM: 0.65,
            cadenceSPM: 110,
            avgStepWidthCm: 10,
            stepWidthVariabilityCm: 1.5,
            pelvicObliquityDeg: 1.0,
            strideTimeCVPercent: 2.0,
            walkingSpeedMPS: 1.2,
            strideLengthM: 1.30,
            hipFlexionROMDeg: 35,
            armSwingAsymmetryPercent: 5,
            kneeFlexionROMDeg: 65
        )

        #expect(mlResult.primaryPattern == ruleResult.primaryPattern,
                "Disabled ML should match rule-based classification")
        #expect(abs(mlResult.confidence - ruleResult.confidence) < 0.01)
    }

    @MainActor
    @Test func fallbackWhenMLEnabledNoModel() async throws {
        let classifier = CoreMLGaitPatternClassifier(modelService: enabledMLServiceNoModels())

        let result = classifier.classify(
            stanceTimeLeftPercent: 60,
            stanceTimeRightPercent: 60,
            stepLengthLeftM: 0.65,
            stepLengthRightM: 0.65,
            cadenceSPM: 110,
            avgStepWidthCm: 10,
            stepWidthVariabilityCm: 1.5,
            pelvicObliquityDeg: 1.0,
            strideTimeCVPercent: 2.0,
            walkingSpeedMPS: 1.2,
            strideLengthM: 1.30,
            hipFlexionROMDeg: 35,
            armSwingAsymmetryPercent: 5,
            kneeFlexionROMDeg: 65
        )

        #expect(result.primaryPattern == .normal,
                "Normal gait params should classify as normal via fallback")
    }
}

// MARK: - CoreMLFallRiskAnalyzer Fallback Tests

struct CoreMLFallRiskFallbackTests {

    @MainActor
    @Test func fallbackMatchesDefaultAnalyzer() async throws {
        let coreml = CoreMLFallRiskAnalyzer(modelService: disabledMLService())
        let fallback = DefaultFallRiskAnalyzer()

        let mlResult = coreml.assess(
            walkingSpeedMPS: 1.3,
            strideTimeCVPercent: 2.0,
            doubleSupportPercent: 25.0,
            stepWidthVariabilityCm: 1.5,
            swayVelocityMMS: 8.0,
            stepAsymmetryPercent: 3.0,
            tugTimeSec: 8.0,
            footClearanceM: 0.025
        )

        let ruleResult = fallback.assess(
            walkingSpeedMPS: 1.3,
            strideTimeCVPercent: 2.0,
            doubleSupportPercent: 25.0,
            stepWidthVariabilityCm: 1.5,
            swayVelocityMMS: 8.0,
            stepAsymmetryPercent: 3.0,
            tugTimeSec: 8.0,
            footClearanceM: 0.025
        )

        #expect(mlResult.riskLevel == ruleResult.riskLevel)
        #expect(abs(mlResult.compositeScore - ruleResult.compositeScore) < 0.01)
    }

    @MainActor
    @Test func fallbackHighRiskDetection() async throws {
        let coreml = CoreMLFallRiskAnalyzer(modelService: disabledMLService())

        let result = coreml.assess(
            walkingSpeedMPS: 0.4,
            strideTimeCVPercent: 8.0,
            doubleSupportPercent: 40.0,
            stepWidthVariabilityCm: 4.0,
            swayVelocityMMS: 30.0,
            stepAsymmetryPercent: 20.0,
            tugTimeSec: 16.0,
            footClearanceM: 0.005
        )

        #expect(result.riskLevel == .high,
                "Extremely poor gait params should yield high risk")
    }
}

// MARK: - CoreMLCrossedSyndromeDetector Fallback Tests

struct CoreMLCrossedSyndromeFallbackTests {

    @MainActor
    @Test func fallbackMatchesDefaultDetector() async throws {
        let coreml = CoreMLCrossedSyndromeDetector(modelService: disabledMLService())
        let fallback = DefaultCrossedSyndromeDetector()

        let mlResult = coreml.detect(
            craniovertebralAngleDeg: 35,
            shoulderProtractionCm: 4.0,
            thoracicKyphosisDeg: 55,
            cervicalLordosisDeg: nil,
            pelvicTiltDeg: 20,
            lumbarLordosisDeg: 70,
            hipFlexionRestDeg: nil
        )

        let ruleResult = fallback.detect(
            craniovertebralAngleDeg: 35,
            shoulderProtractionCm: 4.0,
            thoracicKyphosisDeg: 55,
            cervicalLordosisDeg: nil,
            pelvicTiltDeg: 20,
            lumbarLordosisDeg: 70,
            hipFlexionRestDeg: nil
        )

        #expect(abs(mlResult.upperCrossedScore - ruleResult.upperCrossedScore) < 0.01)
        #expect(abs(mlResult.lowerCrossedScore - ruleResult.lowerCrossedScore) < 0.01)
    }

    @MainActor
    @Test func fallbackIdealValuesMeansLowScores() async throws {
        let coreml = CoreMLCrossedSyndromeDetector(modelService: disabledMLService())

        let result = coreml.detect(
            craniovertebralAngleDeg: 52,
            shoulderProtractionCm: 0,
            thoracicKyphosisDeg: 35,
            cervicalLordosisDeg: 20,
            pelvicTiltDeg: 5,
            lumbarLordosisDeg: 45,
            hipFlexionRestDeg: 0
        )

        #expect(result.upperCrossedScore < 30, "Ideal values → low upper crossed")
        #expect(result.lowerCrossedScore < 30, "Ideal values → low lower crossed")
    }
}

// MARK: - CoreMLFatigueAnalyzer Fallback Tests

struct CoreMLFatigueFallbackTests {

    @MainActor
    @Test func fallbackMatchesDefaultAnalyzer() async throws {
        let coreml = CoreMLFatigueAnalyzer(modelService: disabledMLService())
        let fallback = DefaultFatigueAnalyzer()

        // Record identical time points in both
        for i in 0..<30 {
            let t = Double(i) * 3.0
            let score = 80.0 - Double(i) * 0.5  // gradual decline
            coreml.recordTimePoint(
                timestamp: t,
                postureScore: score,
                trunkLeanDeg: 5.0 + Double(i) * 0.1,
                lateralLeanDeg: 1.0,
                cadenceSPM: 110.0 - Double(i) * 0.2,
                walkingSpeedMPS: 1.2 - Double(i) * 0.005
            )
            fallback.recordTimePoint(
                timestamp: t,
                postureScore: score,
                trunkLeanDeg: 5.0 + Double(i) * 0.1,
                lateralLeanDeg: 1.0,
                cadenceSPM: 110.0 - Double(i) * 0.2,
                walkingSpeedMPS: 1.2 - Double(i) * 0.005
            )
        }

        let mlResult = coreml.assess()
        let ruleResult = fallback.assess()

        #expect(abs(mlResult.fatigueIndex - ruleResult.fatigueIndex) < 0.01,
                "Fatigue indices should match when ML is disabled")
        #expect(mlResult.isFatigued == ruleResult.isFatigued)
    }

    @MainActor
    @Test func noTimePointsYieldsLowFatigue() async throws {
        let coreml = CoreMLFatigueAnalyzer(modelService: disabledMLService())
        let result = coreml.assess()

        #expect(result.fatigueIndex < 25, "No data should not flag fatigue")
        #expect(!result.isFatigued)
    }
}

// MARK: - Joint Helper

/// Creates a minimal set of joints representing approximately ideal posture.
private func makeIdealJoints() -> [JointName: SIMD3<Float>] {
    [
        .root:                  SIMD3<Float>(0, 0, 0),
        .hips:                  SIMD3<Float>(0, 0.90, 0),
        .spine7:                SIMD3<Float>(0, 1.35, -0.01),
        .neck1:                 SIMD3<Float>(0, 1.45, -0.01),
        .head:                  SIMD3<Float>(0, 1.55, -0.01),
        .leftShoulder:          SIMD3<Float>(-0.20, 1.40, 0),
        .rightShoulder:         SIMD3<Float>(0.20, 1.40, 0),
        .leftUpLeg:             SIMD3<Float>(-0.10, 0.88, 0),
        .rightUpLeg:            SIMD3<Float>(0.10, 0.88, 0),
        .leftLeg:               SIMD3<Float>(-0.10, 0.50, 0),
        .rightLeg:              SIMD3<Float>(0.10, 0.50, 0),
        .leftFoot:              SIMD3<Float>(-0.10, 0.05, 0),
        .rightFoot:             SIMD3<Float>(0.10, 0.05, 0),
        .leftToeEnd:            SIMD3<Float>(-0.10, 0.02, 0.10),
        .rightToeEnd:           SIMD3<Float>(0.10, 0.02, 0.10),
        .leftForearm:           SIMD3<Float>(-0.25, 1.10, 0),
        .rightForearm:          SIMD3<Float>(0.25, 1.10, 0),
        .leftHand:              SIMD3<Float>(-0.25, 0.85, 0),
        .rightHand:             SIMD3<Float>(0.25, 0.85, 0)
    ]
}
