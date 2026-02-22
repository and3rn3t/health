//
//  ClinicalTestViewModelTests.swift
//  Andernet PostureTests
//
//  Expanded tests for ClinicalTestViewModel covering TUG, Romberg,
//  and 6MWT protocol flows beyond the basic timer tests in AuditFixTests.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - ClinicalTestViewModelTests

@Suite("ClinicalTestViewModel")
struct ClinicalTestViewModelTests {

    // MARK: - Helpers

    @MainActor
    private func makeSUT(
        balanceAnalyzer: any BalanceAnalyzer = MockBalanceAnalyzer(),
        cardioEstimator: any CardioEstimator = MockCardioEstimator(),
        healthKitService: any HealthKitService = MockHealthKitService(),
        sixMWTProtocol: any SixMWTProtocol = MockSixMWTProtocol()
    ) -> ClinicalTestViewModel {
        ClinicalTestViewModel(
            balanceAnalyzer: balanceAnalyzer,
            cardioEstimator: cardioEstimator,
            healthKitService: healthKitService,
            sixMWTProtocol: sixMWTProtocol
        )
    }

    // MARK: - Initial State

    @Test @MainActor func initialStateIsNotStarted() {
        let vm = makeSUT()
        #expect(vm.testType == nil)
        #expect(vm.testState == .notStarted)
        #expect(vm.elapsedTime == 0)
        #expect(vm.tugResult == nil)
        #expect(vm.rombergResult == nil)
        #expect(vm.sixMWTResult == nil)
    }

    // MARK: - TUG Protocol

    @Test @MainActor func startTUGSetsTypeAndInstructs() {
        let vm = makeSUT()
        vm.startTUG()

        #expect(vm.testType == .timedUpAndGo)
        if case .instructing(let step, let total, let instruction) = vm.testState {
            #expect(step == 1)
            #expect(total == 4)
            #expect(!instruction.isEmpty)
        } else {
            Issue.record("Expected .instructing state, got \(vm.testState)")
        }
    }

    @Test @MainActor func advanceTUGProgressesThroughInstructions() {
        let vm = makeSUT()
        vm.startTUG()

        // Advance through all instruction steps
        vm.advanceTUG() // step 2
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 2)
        } else {
            Issue.record("Expected step 2")
        }

        vm.advanceTUG() // step 3
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 3)
        } else {
            Issue.record("Expected step 3")
        }

        vm.advanceTUG() // step 4
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 4)
        } else {
            Issue.record("Expected step 4")
        }
    }

    @Test @MainActor func completeTUGProducesResult() {
        let mockCardio = MockCardioEstimator()
        let vm = makeSUT(cardioEstimator: mockCardio)

        vm.startTUG()
        // Simulate fast-forwarding past instructions → running → complete
        vm.completeTUG(age: 70)

        #expect(vm.testState == .completed)
        #expect(vm.tugResult != nil)
    }

    // MARK: - Romberg Protocol

    @Test @MainActor func startRombergSetsTypeAndInstructs() {
        let vm = makeSUT()
        vm.startRomberg()

        #expect(vm.testType == .romberg)
        if case .instructing(let step, let total, _) = vm.testState {
            #expect(step == 1)
            #expect(total == 4)
        } else {
            Issue.record("Expected .instructing state")
        }
    }

    @Test @MainActor func advanceRombergProgressesThroughInstructions() {
        let mockBalance = MockBalanceAnalyzer()
        let vm = makeSUT(balanceAnalyzer: mockBalance)
        vm.startRomberg()

        vm.advanceRomberg() // step 2
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 2)
        } else {
            Issue.record("Expected step 2")
        }

        vm.advanceRomberg() // step 3
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 3)
        } else {
            Issue.record("Expected step 3")
        }

        vm.advanceRomberg() // step 4
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 4)
        } else {
            Issue.record("Expected step 4")
        }
    }

    // MARK: - 6MWT Protocol

    @Test @MainActor func start6MWTSetsTypeAndInstructs() {
        let vm = makeSUT()
        vm.start6MWT()

        #expect(vm.testType == .sixMinuteWalk)
        #expect(vm.sixMWTDistance == 0)
        #expect(vm.sixMWTCompleteResult == nil)
        #expect(vm.borgDyspneaScale == nil)
        #expect(vm.borgFatigueScale == nil)
        #expect(vm.sixMWTIsResting == false)

        if case .instructing(let step, let total, _) = vm.testState {
            #expect(step == 1)
            #expect(total == 4)
        } else {
            Issue.record("Expected .instructing state")
        }
    }

    @Test @MainActor func advance6MWTProgressesThroughInstructions() {
        let vm = makeSUT()
        vm.start6MWT()

        vm.advance6MWT() // step 2
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 2)
        } else {
            Issue.record("Expected step 2")
        }

        vm.advance6MWT() // step 3
        vm.advance6MWT() // step 4
        if case .instructing(let step, _, _) = vm.testState {
            #expect(step == 4)
        } else {
            Issue.record("Expected step 4")
        }
    }

    @Test @MainActor func advance6MWTPastInstructionsStartsProtocol() {
        let mockProtocol = MockSixMWTProtocol()
        let vm = makeSUT(sixMWTProtocol: mockProtocol)
        vm.start6MWT()

        // Advance past all 4 instructions
        for _ in 0..<4 {
            vm.advance6MWT()
        }

        // The protocol should have been started
        #expect(mockProtocol.phase == .walking)
    }

    @Test @MainActor func update6MWTDistanceTracksDistance() {
        let vm = makeSUT()
        vm.start6MWT()

        vm.update6MWTDistance(150.5)
        #expect(vm.sixMWTDistance == 150.5)

        vm.update6MWTDistance(300.0)
        #expect(vm.sixMWTDistance == 300.0)
    }

    @Test @MainActor func complete6MWTProducesResult() {
        let mockProtocol = MockSixMWTProtocol()
        let mockCardio = MockCardioEstimator()
        let vm = makeSUT(cardioEstimator: mockCardio, sixMWTProtocol: mockProtocol)

        vm.start6MWT()
        vm.complete6MWT(age: 65, heightM: 1.70, weightKg: 75, sexIsMale: true)

        #expect(vm.testState == .completed)
        #expect(vm.sixMWTCompleteResult != nil)
        #expect(vm.sixMWTCompleteResult!.distanceM > 0)
        #expect(vm.sixMWTResult != nil)
    }

    @Test @MainActor func mark6MWTRestStartAndEnd() {
        let vm = makeSUT()
        vm.start6MWT()

        vm.mark6MWTRestStart()
        #expect(vm.sixMWTIsResting == true)

        vm.mark6MWTRestEnd()
        #expect(vm.sixMWTIsResting == false)
    }

    @Test @MainActor func borgScalesAreTracked() {
        let vm = makeSUT()
        vm.start6MWT()

        vm.borgDyspneaScale = 3
        vm.borgFatigueScale = 5

        #expect(vm.borgDyspneaScale == 3)
        #expect(vm.borgFatigueScale == 5)
    }

    // MARK: - Cancel

    @Test @MainActor func cancelTestReturnsToCanclled() {
        let mockBalance = MockBalanceAnalyzer()
        let vm = makeSUT(balanceAnalyzer: mockBalance)

        vm.startTUG()
        vm.cancelTest()

        #expect(vm.testState == .cancelled)
        #expect(mockBalance.resetCallCount >= 1)
    }

    @Test @MainActor func cancelDuring6MWTCancelsProtocol() {
        let mockProtocol = MockSixMWTProtocol()
        let vm = makeSUT(sixMWTProtocol: mockProtocol)

        vm.start6MWT()
        for _ in 0..<4 { vm.advance6MWT() }
        vm.cancelTest()

        #expect(vm.testState == .cancelled)
        #expect(mockProtocol.phase == .cancelled)
    }

    // MARK: - State Transitions

    @Test @MainActor func canStartNewTestAfterCancel() {
        let vm = makeSUT()

        vm.startTUG()
        vm.cancelTest()
        #expect(vm.testState == .cancelled)

        vm.startRomberg()
        #expect(vm.testType == .romberg)
        if case .instructing = vm.testState {
            // Good — transitioned to new test
        } else {
            Issue.record("Expected .instructing after starting new test")
        }
    }

    @Test @MainActor func canStartNewTestAfterCompletion() {
        let vm = makeSUT()

        vm.startTUG()
        vm.completeTUG()
        #expect(vm.testState == .completed)

        vm.start6MWT()
        #expect(vm.testType == .sixMinuteWalk)
    }
}
