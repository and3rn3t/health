//
//  SensorOnlyCaptureViewModelTests.swift
//  Andernet PostureTests
//
//  Tests for SensorOnlyCaptureViewModel — sensor-only capture without ARKit.
//

import Testing
import Foundation
import SwiftData
@testable import Andernet_Posture

@Suite("SensorOnlyCaptureViewModel")
struct SensorOnlyCaptureViewModelTests {

    @MainActor
    private func makeSUT(
        motionService: MockMotionService = MockMotionService(),
        pedometerService: MockPedometerService = MockPedometerService(),
        imuStepDetector: MockIMUStepDetector = MockIMUStepDetector(),
        smoothnessAnalyzer: MockSmoothnessAnalyzer = MockSmoothnessAnalyzer(),
        trunkMotionAnalyzer: MockTrunkMotionAnalyzer = MockTrunkMotionAnalyzer(),
        balanceAnalyzer: MockBalanceAnalyzer = MockBalanceAnalyzer(),
        cardioEstimator: MockCardioEstimator = MockCardioEstimator(),
        healthKitService: MockHealthKitService = MockHealthKitService()
    ) -> SensorOnlyCaptureViewModel {
        SensorOnlyCaptureViewModel(
            motionService: motionService,
            pedometerService: pedometerService,
            imuStepDetector: imuStepDetector,
            smoothnessAnalyzer: smoothnessAnalyzer,
            trunkMotionAnalyzer: trunkMotionAnalyzer,
            balanceAnalyzer: balanceAnalyzer,
            cardioEstimator: cardioEstimator,
            healthKitService: healthKitService
        )
    }

    @Test("Initial state is idle")
    @MainActor
    func initialState() {
        let vm = makeSUT()
        #expect(vm.recordingState == .idle)
        #expect(vm.elapsedTime == 0)
        #expect(vm.stepCount == 0)
        #expect(vm.distanceM == 0)
        #expect(vm.errorMessage == nil)
    }

    @Test("startCapture activates sensors")
    @MainActor
    func startCapture() {
        let motion = MockMotionService()
        let pedometer = MockPedometerService()
        let vm = makeSUT(motionService: motion, pedometerService: pedometer)

        vm.startCapture()

        #expect(vm.recordingState == .recording)
        #expect(motion.startCallCount == 1)
        #expect(pedometer.startCallCount == 1)
    }

    @Test("stopCapture stops all sensors")
    @MainActor
    func stopCapture() {
        let motion = MockMotionService()
        let pedometer = MockPedometerService()
        let vm = makeSUT(motionService: motion, pedometerService: pedometer)

        vm.startCapture()
        vm.stopCapture()

        #expect(vm.recordingState == .finished)
        #expect(motion.stopCallCount == 1)
        #expect(pedometer.stopCallCount == 1)
    }
}
