import XCTest
import simd
@testable import VitalSense

final class GaitFusionTests: XCTestCase {

    // Helper to build base metrics
    private func baseMetrics() -> GaitMetrics {
        var m = GaitMetrics()
        m.averageWalkingSpeed = 1.05
        m.averageStepLength = 0.65
        m.strideLength = 1.30
        m.stepFrequency = 100
        m.stanceTime = 60
        m.swingTime = 40
        m.doubleSupportTime = 11
        m.walkingAsymmetry = 2.0
        m.stepLengthVariability = 0.03
        m.walkingSpeedVariability = 0.04
        m.averageToeClearance = 0.02
        return m
    }

    // Build a synthetic posture result with elevated sway for testing factor inclusion
    private func syntheticPosture(totalSway: Float = 45) -> PostureAnalysisResult {
        let sway = PosturalSwayMetrics(anteriorPosterior: 10, mediolateral: 8, totalSway: totalSway)
        let spinal = SpinalAlignmentMetrics(thoracicKyphosis: 35, lumbarLordosis: 30, headForwardPosture: 5)
        let balance = BalanceMetrics(stabilityIndex: 82, weightDistribution: WeightDistribution(left: 49, right: 51), reactionTime: 180)
        return PostureAnalysisResult(posturalSway: sway, spinalAlignment: spinal, balanceMetrics: balance, riskFactors: [], confidence: 0.9, timestamp: Date())
    }

    private func syntheticEnvironment(hazard: Float = 40) -> EnvironmentAnalysisResult {
        let obstacles = [EnvironmentalObstacle(type: "object", location: SIMD3<Float>(0,0,1.2), size: SIMD3<Float>(0.3,0.4,0.3), riskLevel: 0.3)]
        let surface = SurfaceAnalysis(type: "Carpet", roughness: 0.2, stability: 0.85)
        let lighting = LightingConditions(quality: "Dim", intensity: 40)
        return EnvironmentAnalysisResult(obstacles: obstacles, surfaceAnalysis: surface, lighting: lighting, hazardScore: hazard, timestamp: Date())
    }

    private func risk(score: Double = 40, confidence: Double = 0.5) -> GaitRiskAssessment {
        GaitRiskAssessment(score: score, level: score < 50 ? .moderate : .high, confidence: confidence)
    }

    func testPostureFusionEnrichesBalanceMetrics() {
        let metrics = baseMetrics()
        let posture = syntheticPosture(totalSway: 55)
        let assessment = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk(), posture: posture, environment: nil, sessionDuration: 30, qualityConfidence: 0.9, floorStd: 0.002)
        // Balance metrics should reflect non-zero sway
        XCTAssertGreaterThan(assessment.detailedAnalysis.balanceMetrics.mediolateralSway, 0)
        XCTAssertGreaterThan(assessment.detailedAnalysis.balanceMetrics.anteroposteriorSway, 0)
        // Risk factors should include Excessive Sway
        XCTAssertTrue(assessment.riskScore.factors.contains { $0.name == "Excessive Sway" })
        // Recommendations list should contain a sway related suggestion
        XCTAssertTrue(assessment.recommendations.contains { $0.lowercased().contains("balance") })
    }

    func testEnvironmentMappingAndHazardFactor() {
        let metrics = baseMetrics()
        let env = syntheticEnvironment(hazard: 60)
        let assessment = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk(), posture: nil, environment: env, sessionDuration: 25, qualityConfidence: 0.95, floorStd: 0.003)
        // Environmental factors should map surface & lighting
        XCTAssertEqual(assessment.environmentalFactors?.surface, .carpet)
        XCTAssertEqual(assessment.environmentalFactors?.lighting, .dim)
        XCTAssertEqual(assessment.environmentalFactors?.obstacles.count, 1)
        // Risk factors should include environmental hazard
        XCTAssertTrue(assessment.riskScore.factors.contains { $0.name == "Environmental Hazard" })
    }

    func testConfidenceEnrichmentScaling() {
        let metrics = baseMetrics()
        // Poor quality scenario
        let lowConfAssessment = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk(confidence: 0.5), posture: nil, environment: nil, sessionDuration: 5, qualityConfidence: 0.3, floorStd: 0.01)
        // Strong quality + posture
        let highConfAssessment = GaitPostSessionFusion.buildAssessment(metrics: metrics, risk: risk(confidence: 0.5), posture: syntheticPosture(), environment: nil, sessionDuration: 32, qualityConfidence: 0.95, floorStd: 0.002)
        XCTAssertLessThan(lowConfAssessment.riskScore.confidence, 0.5) // degraded
        XCTAssertGreaterThan(highConfAssessment.riskScore.confidence, 0.5) // boosted
        XCTAssertGreaterThan(highConfAssessment.riskScore.confidence, lowConfAssessment.riskScore.confidence)
    }
}
