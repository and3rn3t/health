//
//  CaptureViewModelTests.swift
//  Andernet PostureTests
//
//  Tests for CaptureViewModel — the app's most complex component,
//  orchestrating 19 injected analyzers at 60fps.
//

import Testing
import Foundation
import simd
import SwiftData
@testable import Andernet_Posture

// MARK: - CaptureViewModel Tests

@Suite("CaptureViewModel")
struct CaptureViewModelTests {

    // MARK: - Helpers

    /// Create a CaptureViewModel with all mocks injected through pipelines.
    @MainActor
    private func makeSUT(
        gaitAnalyzer: MockGaitAnalyzer = MockGaitAnalyzer(),
        postureAnalyzer: MockPostureAnalyzer = MockPostureAnalyzer(),
        motionService: MockMotionService = MockMotionService(),
        recorder: MockSessionRecorder = MockSessionRecorder(),
        balanceAnalyzer: MockBalanceAnalyzer = MockBalanceAnalyzer(),
        romAnalyzer: MockROMAnalyzer = MockROMAnalyzer(),
        ergonomicScorer: MockErgonomicScorer = MockErgonomicScorer(),
        fatigueAnalyzer: MockFatigueAnalyzer = MockFatigueAnalyzer(),
        smoothnessAnalyzer: MockSmoothnessAnalyzer = MockSmoothnessAnalyzer(),
        fallRiskAnalyzer: MockFallRiskAnalyzer = MockFallRiskAnalyzer(),
        gaitPatternClassifier: MockGaitPatternClassifier = MockGaitPatternClassifier(),
        crossedSyndromeDetector: MockCrossedSyndromeDetector = MockCrossedSyndromeDetector(),
        painRiskEngine: MockPainRiskEngine = MockPainRiskEngine(),
        cardioEstimator: MockCardioEstimator = MockCardioEstimator(),
        healthKitService: MockHealthKitService = MockHealthKitService(),
        pedometerService: MockPedometerService = MockPedometerService(),
        imuStepDetector: MockIMUStepDetector = MockIMUStepDetector(),
        trunkMotionAnalyzer: MockTrunkMotionAnalyzer = MockTrunkMotionAnalyzer()
    ) -> CaptureViewModel {
        let posturePipeline = PosturePipeline(
            postureAnalyzer: postureAnalyzer,
            ergonomicScorer: ergonomicScorer,
            crossedSyndromeDetector: crossedSyndromeDetector,
            painRiskEngine: painRiskEngine
        )
        let gaitPipeline = GaitPipeline(
            gaitAnalyzer: gaitAnalyzer,
            romAnalyzer: romAnalyzer,
            fallRiskAnalyzer: fallRiskAnalyzer,
            gaitPatternClassifier: gaitPatternClassifier,
            smoothnessAnalyzer: smoothnessAnalyzer
        )
        let sensorPipeline = SensorPipeline(
            motionService: motionService,
            pedometerService: pedometerService,
            imuStepDetector: imuStepDetector,
            trunkMotionAnalyzer: trunkMotionAnalyzer,
            balanceAnalyzer: balanceAnalyzer,
            fatigueAnalyzer: fatigueAnalyzer,
            cardioEstimator: cardioEstimator
        )
        return CaptureViewModel(
            posturePipeline: posturePipeline,
            gaitPipeline: gaitPipeline,
            sensorPipeline: sensorPipeline,
            recorder: recorder,
            healthKitService: healthKitService
        )
    }

    /// Minimal joint map for testing.
    private func stubJoints() -> [JointName: SIMD3<Float>] {
        [
            .root: SIMD3(0, 1.0, 0),
            .head: SIMD3(0, 1.7, 0),
            .neck1: SIMD3(0, 1.5, 0),
            .spine7: SIMD3(0, 1.4, 0),
            .spine5: SIMD3(0, 1.2, 0),
            .hips: SIMD3(0, 1.0, 0),
            .leftShoulder: SIMD3(-0.2, 1.4, 0),
            .rightShoulder: SIMD3(0.2, 1.4, 0),
            .leftUpLeg: SIMD3(-0.1, 0.9, 0),
            .rightUpLeg: SIMD3(0.1, 0.9, 0),
            .leftLeg: SIMD3(-0.1, 0.5, 0),
            .rightLeg: SIMD3(0.1, 0.5, 0),
            .leftFoot: SIMD3(-0.1, 0.05, 0),
            .rightFoot: SIMD3(0.1, 0.05, 0),
            .leftHand: SIMD3(-0.3, 0.8, 0),
            .rightHand: SIMD3(0.3, 0.8, 0),
            .leftForearm: SIMD3(-0.25, 1.0, 0),
            .rightForearm: SIMD3(0.25, 1.0, 0),
        ]
    }

    // MARK: - Lifecycle Tests

    @Test("Initial state is idle")
    @MainActor
    func initialState() {
        let vm = makeSUT()
        #expect(vm.recordingState == .idle)
        #expect(vm.elapsedTime == 0)
        #expect(vm.stepCount == 0)
        #expect(vm.postureScore == 0)
        #expect(vm.errorMessage == nil)
    }

    @Test("startCapture transitions to calibrating")
    @MainActor
    func startCaptureTransition() {
        let recorder = MockSessionRecorder()
        let vm = makeSUT(recorder: recorder)

        vm.startCapture()

        #expect(vm.recordingState == .calibrating)
        #expect(recorder.startCalibrationCallCount == 1)
        #expect(vm.calibrationCountdown == 3)
    }

    @Test("togglePause pauses and resumes recording")
    @MainActor
    func togglePause() {
        let recorder = MockSessionRecorder()
        let motionService = MockMotionService()
        let pedometerService = MockPedometerService()
        let vm = makeSUT(motionService: motionService, recorder: recorder, pedometerService: pedometerService)

        // Must be in recording state to pause
        vm.recordingState = .recording

        vm.togglePause()
        #expect(vm.recordingState == .paused)
        #expect(recorder.pauseCallCount == 1)
        #expect(motionService.stopCallCount == 1)
        #expect(pedometerService.stopCallCount == 1)

        vm.togglePause()
        #expect(vm.recordingState == .recording)
        #expect(recorder.resumeCallCount == 1)
        #expect(motionService.startCallCount == 1)
        #expect(pedometerService.startCallCount == 1)
    }

    @Test("stopCapture transitions to finished")
    @MainActor
    func stopCapture() {
        let recorder = MockSessionRecorder()
        let motionService = MockMotionService()
        let pedometerService = MockPedometerService()
        let vm = makeSUT(motionService: motionService, recorder: recorder, pedometerService: pedometerService)

        vm.recordingState = .recording
        vm.stopCapture()

        #expect(vm.recordingState == .finished)
        #expect(recorder.stopCallCount == 1)
        #expect(motionService.stopCallCount == 1)
        #expect(pedometerService.stopCallCount == 1)
    }

    // MARK: - Frame Processing Tests

    @Test("handleBodyFrame during calibrating transitions after 3 seconds")
    @MainActor
    func calibrationTransition() {
        let recorder = MockSessionRecorder()
        let motionService = MockMotionService()
        let pedometerService = MockPedometerService()
        let vm = makeSUT(motionService: motionService, recorder: recorder, pedometerService: pedometerService)

        vm.recordingState = .calibrating

        // First frame at t=0 — starts timer
        vm.handleBodyFrame(joints: stubJoints(), timestamp: 0)
        #expect(vm.recordingState == .calibrating)
        #expect(vm.calibrationCountdown == 3)

        // Frame at t=1.5 — still calibrating
        vm.handleBodyFrame(joints: stubJoints(), timestamp: 1.5)
        #expect(vm.recordingState == .calibrating)
        #expect(vm.calibrationCountdown == 1)

        // Frame at t=3.1 — should transition to recording
        vm.handleBodyFrame(joints: stubJoints(), timestamp: 3.1)
        #expect(vm.recordingState == .recording)
        #expect(recorder.startRecordingCallCount == 1)
        #expect(motionService.startCallCount == 1)
        #expect(pedometerService.startCallCount == 1)
    }

    @Test("handleBodyFrame during recording processes all analyzers")
    @MainActor
    func frameProcessingDuringRecording() {
        let gait = MockGaitAnalyzer()
        let posture = MockPostureAnalyzer()
        let balance = MockBalanceAnalyzer()
        let rom = MockROMAnalyzer()
        let recorder = MockSessionRecorder()
        let vm = makeSUT(
            gaitAnalyzer: gait,
            postureAnalyzer: posture,
            recorder: recorder,
            balanceAnalyzer: balance,
            romAnalyzer: rom
        )

        vm.recordingState = .recording

        // Process one frame
        vm.handleBodyFrame(joints: stubJoints(), timestamp: 1.0)

        // Verify analyzers were called
        #expect(gait.processFrameCallCount == 1)
        #expect(posture.analyzeCallCount == 1)
        #expect(vm.isBodyDetected == true)

        // Verify gait metrics updated
        #expect(vm.cadenceSPM == 110)
        #expect(vm.avgStrideLengthM == 1.3)
        #expect(vm.walkingSpeedMPS == 1.2)

        // Verify frame was recorded
        #expect(recorder.frameCount == 1)
    }

    @Test("handleBodyFrame does nothing when idle")
    @MainActor
    func noProcessingWhenIdle() {
        let gait = MockGaitAnalyzer()
        let vm = makeSUT(gaitAnalyzer: gait)

        vm.handleBodyFrame(joints: stubJoints(), timestamp: 1.0)

        // Body detected should still update
        #expect(vm.isBodyDetected == true)
        // But no analyzer processing (guard returns early)
        #expect(gait.processFrameCallCount == 0)
    }

    @Test("handleBodyFrame throttles ROM analysis to every 3rd frame")
    @MainActor
    func romThrottling() {
        let rom = MockROMAnalyzer()
        let vm = makeSUT(romAnalyzer: rom)
        vm.recordingState = .recording

        // Process 6 frames
        for i in 0..<6 {
            vm.handleBodyFrame(joints: stubJoints(), timestamp: Double(i))
        }

        // ROM analyzer should be called on frames 0, 3 (every 3rd, 0-indexed via frameIndex % 3 == 0)
        // frameIndex starts at 0 and increments per frame, first frame makes it 1, so:
        // frame 1: idx=1, 1%3!=0 => no
        // frame 2: idx=2, 2%3!=0 => no
        // frame 3: idx=3, 3%3==0 => yes
        // frame 4: idx=4, 4%3!=0 => no
        // frame 5: idx=5, 5%3!=0 => no
        // frame 6: idx=6, 6%3==0 => yes
        #expect(rom.analyzeCallCount == 2)
    }

    // MARK: - Save Session Tests

    @Test("saveSession resets all analyzers")
    @MainActor
    func saveSessionResetsAnalyzers() throws {
        let gait = MockGaitAnalyzer()
        let balance = MockBalanceAnalyzer()
        let rom = MockROMAnalyzer()
        let fatigue = MockFatigueAnalyzer()
        let smoothness = MockSmoothnessAnalyzer()
        let imu = MockIMUStepDetector()
        let trunk = MockTrunkMotionAnalyzer()
        let recorder = MockSessionRecorder()
        let vm = makeSUT(
            gaitAnalyzer: gait,
            recorder: recorder,
            balanceAnalyzer: balance,
            romAnalyzer: rom,
            fatigueAnalyzer: fatigue,
            smoothnessAnalyzer: smoothness,
            imuStepDetector: imu,
            trunkMotionAnalyzer: trunk
        )

        let schema = Schema([GaitSession.self, UserGoals.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: schema, configurations: [config])
        let context = container.mainContext

        _ = vm.saveSession(context: context)

        #expect(gait.resetCallCount == 1)
        #expect(balance.resetCallCount == 1)
        #expect(rom.resetCallCount == 1)
        #expect(fatigue.resetCallCount == 1)
        #expect(smoothness.resetCallCount == 1)
        #expect(imu.resetCallCount == 1)
        #expect(trunk.resetCallCount == 1)
        #expect(recorder.resetCallCount == 1)
    }
}
