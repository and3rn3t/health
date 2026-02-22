//
//  MockServices.swift
//  Andernet PostureTests
//
//  Shared reusable mock implementations of all service protocols.
//  Each mock records invocations and returns configurable stub values,
//  enabling white-box ViewModel testing.
//

import Foundation
import simd
import HealthKit
import CoreML
@testable import Andernet_Posture

// MARK: - MockGaitAnalyzer

final class MockGaitAnalyzer: GaitAnalyzer {
    var processFrameCallCount = 0
    var resetCallCount = 0
    var stubbedGaitMetrics = GaitMetrics(
        cadenceSPM: 110, avgStrideLengthM: 1.3, stepDetected: nil,
        walkingSpeedMPS: 1.2, avgStepWidthCm: 8.0, symmetryPercent: 95,
        stanceTimePercent: 60, swingTimePercent: 40,
        doubleSupportPercent: 10, strideTimeCVPercent: 3.0
    )

    func processFrame(joints: [JointName: SIMD3<Float>], timestamp: TimeInterval) -> GaitMetrics {
        processFrameCallCount += 1
        return stubbedGaitMetrics
    }

    func reset() { resetCallCount += 1 }
}

// MARK: - MockPostureAnalyzer

final class MockPostureAnalyzer: PostureAnalyzer {
    var analyzeCallCount = 0
    var computeSessionScoreCallCount = 0
    var stubbedPostureMetrics: PostureMetrics?
    var stubbedSessionScore: Double = 75.0

    func analyze(joints: [JointName: SIMD3<Float>]) -> PostureMetrics? {
        analyzeCallCount += 1
        return stubbedPostureMetrics
    }

    func computeSessionScore(trunkLeans: [Double], lateralLeans: [Double]) -> Double {
        computeSessionScoreCallCount += 1
        return stubbedSessionScore
    }
}

// MARK: - MockSessionRecorder

final class MockSessionRecorder: SessionRecorder {
    var state: RecordingState = .idle
    var elapsedTime: TimeInterval = 0
    var frameCount: Int = 0
    var stepCount: Int = 0

    var startCalibrationCallCount = 0
    var startRecordingCallCount = 0
    var pauseCallCount = 0
    var resumeCallCount = 0
    var stopCallCount = 0
    var resetCallCount = 0
    var recordedFrames: [BodyFrame] = []
    var recordedSteps: [StepEvent] = []
    var recordedMotionFrames: [MotionFrame] = []

    func startCalibration() { startCalibrationCallCount += 1; state = .calibrating }
    func startRecording() { startRecordingCallCount += 1; state = .recording }
    func pause() { pauseCallCount += 1; state = .paused }
    func resume() { resumeCallCount += 1; state = .recording }
    func stop() { stopCallCount += 1; state = .finished }
    func reset() { resetCallCount += 1; state = .idle; recordedFrames.removeAll(); recordedSteps.removeAll(); recordedMotionFrames.removeAll() }
    func recordFrame(_ frame: BodyFrame) { recordedFrames.append(frame); frameCount = recordedFrames.count }
    func recordStep(_ step: StepEvent) { recordedSteps.append(step); stepCount = recordedSteps.count }
    func recordMotionFrame(_ frame: MotionFrame) { recordedMotionFrames.append(frame) }
    func collectedFrames() -> [BodyFrame] { recordedFrames }
    func collectedSteps() -> [StepEvent] { recordedSteps }
    func collectedMotionFrames() -> [MotionFrame] { recordedMotionFrames }
}

// MARK: - MockMotionService

final class MockMotionService: MotionService {
    var isAvailable: Bool = true
    var onMotionUpdate: ((MotionFrame) -> Void)?
    var startCallCount = 0
    var stopCallCount = 0

    func start() { startCallCount += 1 }
    func stop() { stopCallCount += 1 }
}

// MARK: - MockBalanceAnalyzer

final class MockBalanceAnalyzer: BalanceAnalyzer {
    var isStanding: Bool = false
    var imuSwayMetrics: IMUSwayMetrics?
    var processFrameCallCount = 0
    var resetCallCount = 0
    var stubbedBalanceMetrics = BalanceMetrics(
        swayVelocityMMS: 12, swayAreaCm2: 3, apRangeMM: 5,
        mlRangeMM: 4, apMlRatio: 1.25, meanSwayDistanceMM: 3.5
    )

    func processFrame(rootPosition: SIMD3<Float>, timestamp: TimeInterval) -> BalanceMetrics {
        processFrameCallCount += 1
        return stubbedBalanceMetrics
    }

    func processIMUFrame(timestamp: TimeInterval, userAccelerationX: Double, userAccelerationY: Double, userAccelerationZ: Double) {}
    func startRombergEyesOpen() {}
    func startRombergEyesClosed() {}
    func completeRomberg() -> RombergResult? { nil }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockROMAnalyzer

final class MockROMAnalyzer: ROMAnalyzer {
    var analyzeCallCount = 0
    var resetCallCount = 0
    var stubbedROMMetrics = ROMMetrics(
        hipFlexionLeftDeg: 30, hipFlexionRightDeg: 28,
        kneeFlexionLeftDeg: 55, kneeFlexionRightDeg: 53,
        pelvicTiltDeg: 5, trunkRotationDeg: 10,
        armSwingLeftDeg: 20, armSwingRightDeg: 18
    )
    var stubbedSessionSummary = ROMSessionSummary(
        hipROMLeftDeg: 35, hipROMRightDeg: 33,
        kneeROMLeftDeg: 60, kneeROMRightDeg: 58,
        trunkRotationRangeDeg: 15, pelvicTiltRangeDeg: 8,
        armSwingLeftRangeDeg: 25, armSwingRightRangeDeg: 23,
        armSwingAsymmetryPercent: 8
    )

    func analyze(joints: [JointName: SIMD3<Float>]) -> ROMMetrics {
        analyzeCallCount += 1
        return stubbedROMMetrics
    }

    func recordFrame(_ metrics: ROMMetrics) {}
    func sessionSummary() -> ROMSessionSummary { stubbedSessionSummary }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockErgonomicScorer

final class MockErgonomicScorer: ErgonomicScorer {
    var stubbedResult = REBAResult(
        score: 3, riskLevel: .low, action: "Monitor", trunkScore: 1,
        neckScore: 1, legScore: 1, upperArmScore: 1, lowerArmScore: 1, wristScore: 1
    )

    func computeREBA(joints: [JointName: SIMD3<Float>]) -> REBAResult { stubbedResult }
}

// MARK: - MockFatigueAnalyzer

final class MockFatigueAnalyzer: FatigueAnalyzer {
    var recordCallCount = 0
    var resetCallCount = 0
    var stubbedAssessment = FatigueAssessment(
        fatigueIndex: 0.2, postureVariabilitySD: 2.0,
        postureTrendSlope: -0.01, postureTrendR2: 0.3,
        cadenceTrendSlope: 0.0, speedTrendSlope: 0.0,
        forwardLeanTrendSlope: 0.0, lateralSwayTrendSlope: 0.0,
        isFatigued: false
    )

    func recordTimePoint(timestamp: TimeInterval, postureScore: Double, trunkLeanDeg: Double,
                          lateralLeanDeg: Double, cadenceSPM: Double, walkingSpeedMPS: Double) {
        recordCallCount += 1
    }

    func assess() -> FatigueAssessment { stubbedAssessment }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockSmoothnessAnalyzer

final class MockSmoothnessAnalyzer: SmoothnessAnalyzer {
    var resetCallCount = 0
    var stubbedMetrics = SmoothnessMetrics(
        sparcScore: -1.5, harmonicRatioAP: 2.5,
        harmonicRatioML: 2.0, normalizedJerk: 50
    )

    func recordSample(timestamp: TimeInterval, accelerationAP: Double,
                       accelerationML: Double, accelerationV: Double) {}
    func analyze() -> SmoothnessMetrics { stubbedMetrics }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockFallRiskAnalyzer

final class MockFallRiskAnalyzer: FallRiskAnalyzer {
    var stubbedAssessment = FallRiskAssessment(
        compositeScore: 25, riskLevel: .low,
        factorBreakdown: [], riskFactorCount: 0
    )

    func assess(walkingSpeedMPS: Double?, strideTimeCVPercent: Double?,
                doubleSupportPercent: Double?, stepWidthVariabilityCm: Double?,
                swayVelocityMMS: Double?, stepAsymmetryPercent: Double?,
                tugTimeSec: Double?, footClearanceM: Double?) -> FallRiskAssessment {
        stubbedAssessment
    }
}

// MARK: - MockGaitPatternClassifier

final class MockGaitPatternClassifier: GaitPatternClassifying {
    var stubbedResult = GaitPatternResult(
        primaryPattern: .normal, confidence: 0.9,
        patternScores: [.normal: 0.9], flags: []
    )

    func classify(stanceTimeLeftPercent: Double?, stanceTimeRightPercent: Double?,
                  stepLengthLeftM: Double?, stepLengthRightM: Double?,
                  cadenceSPM: Double?, avgStepWidthCm: Double?,
                  stepWidthVariabilityCm: Double?, pelvicObliquityDeg: Double?,
                  strideTimeCVPercent: Double?, walkingSpeedMPS: Double?,
                  strideLengthM: Double?, hipFlexionROMDeg: Double?,
                  armSwingAsymmetryPercent: Double?, kneeFlexionROMDeg: Double?) -> GaitPatternResult {
        stubbedResult
    }
}

// MARK: - MockCrossedSyndromeDetector

final class MockCrossedSyndromeDetector: CrossedSyndromeDetecting {
    var stubbedResult = CrossedSyndromeResult(
        upperCrossedScore: 0.2, lowerCrossedScore: 0.1,
        detectedSyndromes: [], upperFactors: [], lowerFactors: []
    )

    func detect(craniovertebralAngleDeg: Double, shoulderProtractionCm: Double,
                thoracicKyphosisDeg: Double, cervicalLordosisDeg: Double?,
                pelvicTiltDeg: Double, lumbarLordosisDeg: Double,
                hipFlexionRestDeg: Double?) -> CrossedSyndromeResult {
        stubbedResult
    }
}

// MARK: - MockPainRiskEngine

final class MockPainRiskEngine: PainRiskEngine {
    var stubbedAssessment = PainRiskAssessment(alerts: [], overallRiskScore: 10)

    func assess(craniovertebralAngleDeg: Double, sagittalVerticalAxisCm: Double,
                thoracicKyphosisDeg: Double, lumbarLordosisDeg: Double,
                shoulderAsymmetryCm: Double, pelvicObliquityDeg: Double,
                pelvicTiltDeg: Double, coronalSpineDeviationCm: Double,
                kneeFlexionStandingDeg: Double?, gaitAsymmetryPercent: Double?) -> PainRiskAssessment {
        stubbedAssessment
    }
}

// MARK: - MockFrailtyScreener

final class MockFrailtyScreener: FrailtyScreener {
    var stubbedResult = FrailtyScreeningResult(
        friedScore: 0, classification: .robust,
        criteria: [], interpretation: "Robust"
    )

    func screen(walkingSpeedMPS: Double?, heightM: Double?, sexIsMale: Bool?,
                age: Int?, sixMinuteWalkDistanceM: Double?, dailyStepCount: Double?,
                postureVariabilitySD: Double?, strideTimeCVPercent: Double?) -> FrailtyScreeningResult {
        stubbedResult
    }
}

// MARK: - MockCardioEstimator

final class MockCardioEstimator: CardioEstimator {
    var stubbedEstimate = CardioEstimate(
        estimatedMET: 3.5, intensity: .moderate,
        walkRatio: 0.5, costOfTransportProxy: 0.3
    )
    var stubbedSixMWT = SixMinuteWalkResult(
        distanceM: 400, predictedDistanceM: 500,
        percentPredicted: 80, classification: "Below average"
    )
    var stubbedTUG = TUGResult(
        timeSec: 10, fallRisk: .low, mobilityLevel: "Normal"
    )

    func estimate(walkingSpeedMPS: Double, cadenceSPM: Double, strideLengthM: Double) -> CardioEstimate {
        stubbedEstimate
    }

    func evaluate6MWT(distanceM: Double, age: Int?, heightM: Double?,
                       weightKg: Double?, sexIsMale: Bool?) -> SixMinuteWalkResult {
        stubbedSixMWT
    }

    func evaluateTUG(timeSec: Double, age: Int?) -> TUGResult { stubbedTUG }
}

// MARK: - MockHealthKitService

final class MockHealthKitService: HealthKitService {
    var isAvailable: Bool = true
    var saveSessionCallCount = 0
    var requestAuthCallCount = 0

    func requestAuthorization() async throws { requestAuthCallCount += 1 }

    func saveSession(steps: Int, walkingSpeed: Double?, strideLength: Double?,
                     asymmetry: Double?, distance: Double?,
                     start: Date, end: Date) async throws {
        saveSessionCallCount += 1
    }

    func fetchSteps(from start: Date, to end: Date) async throws -> Double { 5000 }
    func fetchWalkingSpeed(from start: Date, to end: Date) async throws -> [HKQuantitySample] { [] }
    func fetchDemographics() async throws -> UserDemographics {
        UserDemographics(age: 35, biologicalSex: nil, heightM: 1.75, bodyMassKg: 70)
    }
    func fetchAverageDailySteps(days: Int) async throws -> Double { 8000 }
    func saveSixMWTDistance(_ distanceM: Double, date: Date) async throws {}
    func fetchRecentWalkingAsymmetry(days: Int) async throws -> [HKQuantitySample] { [] }
    func fetchRecentDoubleSupportTime(days: Int) async throws -> [HKQuantitySample] { [] }
}

// MARK: - MockPedometerService

final class MockPedometerService: PedometerService {
    var isStepCountingAvailable: Bool = true
    var isDistanceAvailable: Bool = true
    var isFloorCountingAvailable: Bool = true
    var isCadenceAvailable: Bool = true
    var isPaceAvailable: Bool = true
    var onPedometerUpdate: ((PedometerSnapshot) -> Void)?
    var latestSnapshot: PedometerSnapshot?
    var startCallCount = 0
    var stopCallCount = 0

    func startLiveUpdates() { startCallCount += 1 }
    func stop() { stopCallCount += 1 }
    func querySteps(from start: Date, to end: Date) async throws -> PedometerSnapshot {
        PedometerSnapshot(timestamp: .now, stepCount: 1000, distanceM: 700,
                          currentPaceSPM: nil, currentCadenceSPM: 110,
                          floorsAscended: 2, floorsDescended: 1, averageActivePaceSPM: nil)
    }
}

// MARK: - MockIMUStepDetector

final class MockIMUStepDetector: IMUStepDetector {
    var currentCadenceSPM: Double = 110
    var stepCount: Int = 0
    var resetCallCount = 0
    var stubbedValidation: Double = 0.8

    func processSample(timestamp: TimeInterval, userAccelerationY: Double,
                        userAccelerationX: Double, userAccelerationZ: Double) -> IMUStepEvent? { nil }

    func validateARKitStep(at timestamp: TimeInterval) -> Double { stubbedValidation }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockTrunkMotionAnalyzer

final class MockTrunkMotionAnalyzer: TrunkMotionAnalyzer {
    var resetCallCount = 0
    var stubbedMetrics = TrunkMotionMetrics(
        peakRotationVelocityDPS: 45, averageRotationRangeDeg: 12,
        turnCount: 3, averageTurnDurationSec: 1.5,
        rotationAsymmetryPercent: 8, averageLateralFlexionDeg: 3,
        movementRegularityIndex: 0.85
    )

    func processFrame(_ frame: MotionFrame) {}
    func analyze() -> TrunkMotionMetrics { stubbedMetrics }
    func reset() { resetCallCount += 1 }
}

// MARK: - MockInsightsEngine

final class MockInsightsEngine: InsightsEngine {
    var stubbedInsights: [Insight] = []

    func generateInsights(from sessions: [GaitSession]) -> [Insight] { stubbedInsights }
}

// MARK: - MockExportService

final class MockExportService: ExportServiceProtocol {
    var generateCSVCallCount = 0
    var generatePDFCallCount = 0

    func generateCSV(for session: GaitSession) -> Data { generateCSVCallCount += 1; return Data() }
    func generateFramesCSV(for session: GaitSession) -> Data { Data() }
    func generateStepsCSV(for session: GaitSession) -> Data { Data() }
    func generatePDFReport(for session: GaitSession) -> Data { generatePDFCallCount += 1; return Data() }
    func generateMultiSessionCSV(sessions: [GaitSession]) -> Data { Data() }
    func shareURL(for data: Data, filename: String) -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent(filename)
    }
}

// MARK: - MockSixMWTProtocol

final class MockSixMWTProtocol: SixMWTProtocol {
    var phase: SixMWTPhase = .notStarted
    var liveMetrics: SixMWTLiveMetrics?
    var onPhaseChange: ((SixMWTPhase) -> Void)?
    var onMetricsUpdate: ((SixMWTLiveMetrics) -> Void)?
    var onEncouragement: ((String) -> Void)?

    func start(config: SixMWTConfiguration) { phase = .walking }
    func markRestStart() {}
    func markRestEnd() {}
    func cancel() { phase = .cancelled }
    func complete(borgDyspnea: Int?, borgFatigue: Int?,
                  age: Int?, heightM: Double?, weightKg: Double?,
                  sexIsMale: Bool?) -> SixMWTCompleteResult {
        SixMWTCompleteResult(
            distanceM: 400, durationSec: 360, lapsCompleted: 0,
            restStops: [], totalRestTimeSec: 0, totalSteps: 600,
            averageSpeedMPS: 1.1, averageCadenceSPM: 100,
            borgDyspneaScale: borgDyspnea, borgFatigueScale: borgFatigue,
            predictedDistanceM: 500, percentPredicted: 80,
            classification: "Below average", estimatedMET: 3.5,
            distanceByMinuteM: [67, 68, 70, 66, 65, 64],
            fatigueIndexPercent: 4.5, floorsAscended: nil, floorsDescended: nil
        )
    }
}

// MARK: - MockCloudSyncService

@MainActor
final class MockCloudSyncService: CloudSyncServiceProtocol {
    var status: SyncStatus = .idle
    var lastSyncDate: Date?
    var resetCallCount = 0
    var checkAccountCallCount = 0
    var stubbedAccountAvailable = true

    func resetSyncState() { resetCallCount += 1 }
    func checkAccountStatus() async -> Bool {
        checkAccountCallCount += 1
        return stubbedAccountAvailable
    }
}

// MARK: - MockKeyValueStoreSync

@MainActor
final class MockKeyValueStoreSync: KeyValueStoreSyncProtocol {
    var pushCallCount = 0
    var pushAllCallCount = 0
    var pushedKeys: [SyncedPreferenceKey] = []

    func push(_ key: SyncedPreferenceKey) {
        pushCallCount += 1
        pushedKeys.append(key)
    }

    func pushAll() { pushAllCallCount += 1 }
}

// MARK: - MockNotificationService

final class MockNotificationService: NotificationService {
    var requestPermissionCallCount = 0
    var scheduleReminderCallCount = 0
    var cancelAllCallCount = 0
    var sendDeclineAlertCallCount = 0
    var stubbedPermission = true
    var scheduledHour: Int?
    var scheduledMinute: Int?
    var lastAlertMetric: String?
    var lastAlertMessage: String?

    func requestPermission() async -> Bool {
        requestPermissionCallCount += 1
        return stubbedPermission
    }

    func scheduleSessionReminder(hour: Int, minute: Int) {
        scheduleReminderCallCount += 1
        scheduledHour = hour
        scheduledMinute = minute
    }

    func cancelAllReminders() { cancelAllCallCount += 1 }

    func sendDeclineAlert(metric: String, message: String) {
        sendDeclineAlertCallCount += 1
        lastAlertMetric = metric
        lastAlertMessage = message
    }
}

// MARK: - MockMLModelService

@MainActor
final class MockMLModelService: MLModelServiceProtocol {
    var useMLModels: Bool = false
    var modelStatuses: [MLModelStatus] = []
    var availableModelCount: Int = 0
    var loadModelCallCount = 0
    var warmUpCallCount = 0
    var stubbedModelAvailable = false

    func loadModel(_ identifier: MLModelIdentifier) -> MLModel? {
        loadModelCallCount += 1
        return nil
    }

    func isModelAvailable(_ identifier: MLModelIdentifier) -> Bool {
        stubbedModelAvailable
    }

    func warmUp() { warmUpCallCount += 1 }
}
