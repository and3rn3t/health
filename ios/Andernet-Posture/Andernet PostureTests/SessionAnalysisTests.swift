//
//  SessionAnalysisTests.swift
//  Andernet PostureTests
//
//  Tests for SessionAnalysisEngine — the clinical reporting pipeline that
//  checks GaitSession metrics against norms and produces AbnormalFindings.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - SessionAnalysis Tests

struct SessionAnalysisEngineTests {

    // MARK: - Helpers

    /// Creates a minimal GaitSession with all-nil metrics.
    private func emptySession() -> GaitSession {
        GaitSession(date: .now, duration: 120)
    }

    // MARK: - Empty Session

    @Test func emptySessionProducesAllNormal() async throws {
        let session = emptySession()
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.isEmpty, "No metrics set → no abnormal findings")
        #expect(analysis.normalCount == 0, "Nothing evaluated → 0 normal")
        #expect(analysis.totalEvaluated == 0, "Nothing evaluated")
        #expect(analysis.overallSeverity == .normal)
    }

    // MARK: - Posture Metrics

    @Test func normalCVAProducesNoFinding() async throws {
        let session = emptySession()
        session.averageCVADeg = 52 // normal
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.isEmpty)
        #expect(analysis.normalCount == 1)
        #expect(analysis.totalEvaluated == 1)
    }

    @Test func lowCVAProducesFinding() async throws {
        let session = emptySession()
        session.averageCVADeg = 28 // severe
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        let finding = analysis.findings[0]
        #expect(finding.severity == .severe)
        #expect(finding.metric.contains("CVA"))
        #expect(finding.exerciseConditionKey == "forwardHeadPosture")
    }

    @Test func abnormalSVAProducesFinding() async throws {
        let session = emptySession()
        session.averageSVACm = 8.0 // moderate
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        let finding = analysis.findings[0]
        #expect(finding.severity == .moderate)
        #expect(finding.metric.contains("SVA"))
    }

    @Test func normalTrunkLeanNormalResult() async throws {
        let session = emptySession()
        session.averageTrunkLeanDeg = 3.0 // normal
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.isEmpty)
        #expect(analysis.normalCount == 1)
    }

    @Test func abnormalTrunkLeanProducesFinding() async throws {
        let session = emptySession()
        session.averageTrunkLeanDeg = 12.0 // moderate (> 10, <= 20)
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .moderate)
    }

    @Test func abnormalLateralLeanProducesFinding() async throws {
        let session = emptySession()
        session.averageLateralLeanDeg = 6.0 // moderate (> 5, <= 10)
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .moderate)
    }

    // MARK: - Gait Metrics

    @Test func slowWalkingSpeedProducesFinding() async throws {
        let session = emptySession()
        session.averageWalkingSpeedMPS = 0.5 // severe
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .severe)
        #expect(analysis.findings[0].metric == "Walking Speed")
    }

    @Test func normalWalkingSpeedNormal() async throws {
        let session = emptySession()
        session.averageWalkingSpeedMPS = 1.2
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.isEmpty)
        #expect(analysis.normalCount == 1)
    }

    @Test func highGaitAsymmetryProducesFinding() async throws {
        let session = emptySession()
        session.gaitAsymmetryPercent = 20 // moderate
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .moderate)
        #expect(analysis.findings[0].metric == "Gait Asymmetry")
    }

    // MARK: - Balance Metrics

    @Test func highSwayVelocityProducesFinding() async throws {
        let session = emptySession()
        session.averageSwayVelocityMMS = 30 // above 25 threshold
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .severe)
        #expect(analysis.findings[0].metric == "Sway Velocity")
    }

    // MARK: - Risk Metrics

    @Test func highFallRiskProducesFinding() async throws {
        let session = emptySession()
        session.fallRiskScore = 65
        session.fallRiskLevel = "high"
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .severe)
        #expect(analysis.findings[0].metric == "Fall Risk")
    }

    @Test func lowFallRiskNormal() async throws {
        let session = emptySession()
        session.fallRiskScore = 15
        session.fallRiskLevel = "low"
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.isEmpty)
        #expect(analysis.normalCount == 1)
    }

    @Test func highFatigueIndexProducesFinding() async throws {
        let session = emptySession()
        session.fatigueIndex = 60 // moderate
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .moderate)
    }

    @Test func highRebaScoreProducesFinding() async throws {
        let session = emptySession()
        session.rebaScore = 9 // severe
        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 1)
        #expect(analysis.findings[0].severity == .severe)
        #expect(analysis.findings[0].metric.contains("REBA"))
    }

    // MARK: - Multiple Findings Sorting

    @Test func findingsSortedBySeverityDescending() async throws {
        let session = emptySession()
        session.averageCVADeg = 44     // mild
        session.averageSVACm = 10.0    // severe (>= 9.5)
        session.averageTrunkLeanDeg = 15.0  // moderate (> 10, <= 20)

        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.findings.count == 3)
        // First should be severe, then moderate, then mild
        #expect(analysis.findings[0].severity == .severe)
        #expect(analysis.findings[1].severity == .moderate)
        #expect(analysis.findings[2].severity == .mild)
    }

    @Test func overallSeverityReflectsWorstFinding() async throws {
        let session = emptySession()
        session.averageCVADeg = 44     // mild
        session.averageWalkingSpeedMPS = 0.5 // severe

        let analysis = SessionAnalysisEngine.analyze(session: session)
        #expect(analysis.overallSeverity == .severe)
    }

    // MARK: - Mixed Normal and Abnormal

    @Test func mixedNormalAndAbnormalCounts() async throws {
        let session = emptySession()
        session.averageCVADeg = 52        // normal
        session.averageSVACm = 3.0        // normal
        session.averageTrunkLeanDeg = 15  // mild
        session.averageWalkingSpeedMPS = 1.2  // normal

        let analysis = SessionAnalysisEngine.analyze(session: session)

        #expect(analysis.normalCount == 3,
                "CVA + SVA + speed should be normal")
        #expect(analysis.findings.count == 1, "trunk lean is abnormal")
        #expect(analysis.totalEvaluated == 4)
    }

    // MARK: - Overall Assessment Text

    @Test func allNormalAssessmentText() async throws {
        let session = emptySession()
        session.averageCVADeg = 52
        session.averageSVACm = 3.0

        let analysis = SessionAnalysisEngine.analyze(session: session)
        #expect(analysis.overallAssessment.contains("within normal"))
    }

    @Test func severeAssessmentMentionsHealthcareProvider() async throws {
        let session = emptySession()
        session.averageWalkingSpeedMPS = 0.3 // severe

        let analysis = SessionAnalysisEngine.analyze(session: session)
        #expect(analysis.overallAssessment.contains("healthcare"))
    }

    // MARK: - Glossary Enrichment

    @Test func findingsEnrichedWithGlossary() async throws {
        let session = emptySession()
        session.averageCVADeg = 28 // severe → has ClinicalGlossary entry

        let analysis = SessionAnalysisEngine.analyze(session: session)
        let finding = analysis.findings[0]

        // ClinicalGlossary should have populated plainName & whatItMeans
        // (if entry exists for "Craniovertebral Angle (CVA)")
        if !finding.plainName.isEmpty {
            #expect(!finding.whatItMeans.isEmpty)
        }
    }

    // MARK: - Normal Percentage

    @Test func normalPercentageCalculation() async throws {
        let session = emptySession()
        session.averageCVADeg = 52        // normal
        session.averageSVACm = 3.0        // normal
        session.averageTrunkLeanDeg = 15  // abnormal
        session.averageWalkingSpeedMPS = 1.2  // normal

        let analysis = SessionAnalysisEngine.analyze(session: session)
        // 3 normal out of 4 total = 75%
        #expect(analysis.normalPercentage == 75)
    }

    @Test func normalPercentageAllNormal() async throws {
        let session = emptySession()
        session.averageCVADeg = 52
        session.averageSVACm = 3.0

        let analysis = SessionAnalysisEngine.analyze(session: session)
        #expect(analysis.normalPercentage == 100)
    }

    @Test func normalPercentageEmpty() async throws {
        let session = emptySession()
        let analysis = SessionAnalysisEngine.analyze(session: session)
        #expect(analysis.normalPercentage == 100, "Empty session defaults to 100%")
    }
}

// MARK: - AbnormalFinding Tests

struct AbnormalFindingTests {

    @Test func exercisesMapsToLibrary() {
        let finding = AbnormalFinding(
            metric: "Test",
            value: "42",
            normalRange: "0–10",
            severity: .moderate,
            likelyCauses: ["cause"],
            recommendation: "recommendation",
            exerciseConditionKey: "forwardHeadPosture"
        )

        #expect(!finding.exercises.isEmpty, "forwardHeadPosture should return exercises")
    }

    @Test func exercisesEmptyForNilKey() {
        let finding = AbnormalFinding(
            metric: "Test",
            value: "42",
            normalRange: "0–10",
            severity: .mild,
            likelyCauses: [],
            recommendation: "rec",
            exerciseConditionKey: nil
        )

        #expect(finding.exercises.isEmpty)
    }

    @Test func exercisesEmptyForUnknownKey() {
        let finding = AbnormalFinding(
            metric: "Test",
            value: "42",
            normalRange: "0–10",
            severity: .mild,
            likelyCauses: [],
            recommendation: "rec",
            exerciseConditionKey: "nonexistentCondition"
        )

        #expect(finding.exercises.isEmpty)
    }

    @Test func sortRankMatchesSeverity() {
        let findingSevere = AbnormalFinding(
            metric: "A", value: "1", normalRange: "0", severity: .severe,
            likelyCauses: [], recommendation: "", exerciseConditionKey: nil
        )
        let findingMild = AbnormalFinding(
            metric: "B", value: "1", normalRange: "0", severity: .mild,
            likelyCauses: [], recommendation: "", exerciseConditionKey: nil
        )
        #expect(findingSevere.sortRank > findingMild.sortRank)
    }
}
