//
//  ClinicalTestProtocol.swift
//  Andernet Posture
//
//  Guided clinical test protocols for TUG, Romberg, and 6MWT.
//  Provides step-by-step instructions, timing, and automated analysis.
//

import Foundation
import Observation
import os.log

// MARK: - Test Protocol State

/// State of a clinical test protocol.
enum ClinicalTestState: Sendable, Equatable {
    case notStarted
    case instructing(step: Int, totalSteps: Int, instruction: String)
    case countdown(seconds: Int)
    case running(phaseLabel: String)
    case transitioning(instruction: String)
    case completed
    case cancelled
}

// MARK: - Protocol ViewModel

/// Drives guided clinical test execution.
@Observable
@MainActor
final class ClinicalTestViewModel {

    // MARK: - State

    var testType: ClinicalTestType?
    var testState: ClinicalTestState = .notStarted
    var elapsedTime: TimeInterval = 0
    var phaseElapsedTime: TimeInterval = 0

    // TUG results
    var tugResult: TUGResult?

    // Romberg results
    var rombergResult: RombergResult?

    // 6MWT results
    var sixMWTResult: SixMinuteWalkResult?
    var sixMWTDistance: Double = 0
    var sixMWTCompleteResult: SixMWTCompleteResult?
    var sixMWTLiveMetrics: SixMWTLiveMetrics?
    var sixMWTEncouragementMessage: String?
    var sixMWTIsResting: Bool = false

    // Borg scale (user-reported)
    var borgDyspneaScale: Int?
    var borgFatigueScale: Int?

    // MARK: - Dependencies

    private let balanceAnalyzer: any BalanceAnalyzer
    private let cardioEstimator: any CardioEstimator
    private let healthKitService: any HealthKitService
    private let sixMWTProtocol: any SixMWTProtocol

    // MARK: - Private

    private var timer: Timer?
    private var sixMWTAutoCompleteTimer: Timer?
    private var testStartTime: Date?
    private var phaseStartTime: Date?
    private var currentStep = 0

    init(
        balanceAnalyzer: any BalanceAnalyzer = DefaultBalanceAnalyzer(),
        cardioEstimator: any CardioEstimator = DefaultCardioEstimator(),
        healthKitService: any HealthKitService = DefaultHealthKitService(),
        sixMWTProtocol: any SixMWTProtocol = DefaultSixMWTProtocol()
    ) {
        self.balanceAnalyzer = balanceAnalyzer
        self.cardioEstimator = cardioEstimator
        self.healthKitService = healthKitService
        self.sixMWTProtocol = sixMWTProtocol

        setup6MWTCallbacks()
    }

    deinit {
        MainActor.assumeIsolated {
            timer?.invalidate()
            sixMWTAutoCompleteTimer?.invalidate()
        }
    }

    // MARK: - TUG Protocol

    /// Start Timed Up and Go test.
    /// Protocol: Sit → Stand → Walk 3m → Turn → Walk back → Sit
    func startTUG() {
        testType = .timedUpAndGo
        currentStep = 0
        let instructions = tugInstructions()
        testState = .instructing(step: 1, totalSteps: instructions.count, instruction: instructions[0])
    }

    /// Advance TUG to next step. Called by user tapping "Next" or automatically.
    func advanceTUG() {
        currentStep += 1
        let instructions = tugInstructions()

        if currentStep < instructions.count {
            testState = .instructing(step: currentStep + 1, totalSteps: instructions.count, instruction: instructions[currentStep])
        } else if currentStep == instructions.count {
            // Start countdown
            startCountdown {
                self.testStartTime = Date()
                self.testState = .running(phaseLabel: "Stand, walk 3m, turn, return, sit")
                self.startTimer()
            }
        }
    }

    /// Complete TUG test. Called when user indicates they've sat back down.
    func completeTUG(age: Int? = nil) {
        stopTimer()
        let timeSec = elapsedTime
        tugResult = cardioEstimator.evaluateTUG(timeSec: timeSec, age: age)
        testState = .completed
    }

    // MARK: - Romberg Protocol

    /// Start Romberg balance test.
    /// Protocol: 30s eyes open → 30s eyes closed → compare sway
    func startRomberg() {
        testType = .romberg
        currentStep = 0
        let instructions = rombergInstructions()
        testState = .instructing(step: 1, totalSteps: instructions.count, instruction: instructions[0])
    }

    func advanceRomberg() {
        currentStep += 1
        let instructions = rombergInstructions()

        if currentStep < instructions.count {
            testState = .instructing(step: currentStep + 1, totalSteps: instructions.count, instruction: instructions[currentStep])
        } else if currentStep == instructions.count {
            // Eyes open phase
            balanceAnalyzer.startRombergEyesOpen()
            startCountdown {
                self.testState = .running(phaseLabel: "Eyes Open — Stand Still (30s)")
                self.phaseStartTime = Date()
                self.startPhaseTimer(duration: 30) {
                    // Transition to eyes closed
                    self.balanceAnalyzer.startRombergEyesClosed()
                    self.testState = .transitioning(instruction: "Now close your eyes. Keep standing still.")
                    Task { @MainActor [weak self] in
                        try? await Task.sleep(for: .seconds(3))
                        guard let self else { return }
                        self.testState = .running(phaseLabel: "Eyes Closed — Stand Still (30s)")
                        self.phaseStartTime = Date()
                        self.startPhaseTimer(duration: 30) {
                            // Complete
                            self.rombergResult = self.balanceAnalyzer.completeRomberg()
                            self.testState = .completed
                        }
                    }
                }
            }
        }
    }

    // MARK: - 6MWT Protocol (Sensor-Based)

    /// Start 6-Minute Walk Test using dedicated sensor protocol.
    func start6MWT() {
        testType = .sixMinuteWalk
        currentStep = 0
        sixMWTDistance = 0
        sixMWTCompleteResult = nil
        sixMWTLiveMetrics = nil
        sixMWTEncouragementMessage = nil
        sixMWTIsResting = false
        borgDyspneaScale = nil
        borgFatigueScale = nil
        let instructions = sixMWTInstructions()
        testState = .instructing(step: 1, totalSteps: instructions.count, instruction: instructions[0])
    }

    func advance6MWT() {
        currentStep += 1
        let instructions = sixMWTInstructions()

        if currentStep < instructions.count {
            testState = .instructing(step: currentStep + 1, totalSteps: instructions.count, instruction: instructions[currentStep])
        } else if currentStep == instructions.count {
            // Start the sensor-based 6MWT protocol
            sixMWTProtocol.start(config: .standard)
        }
    }

    /// Update walking distance during 6MWT (from gait analyzer displacement tracking).
    func update6MWTDistance(_ distanceM: Double) {
        sixMWTDistance = distanceM
    }

    /// Provide ARKit root position to 6MWT protocol for distance fusion.
    func update6MWTARKitPosition(x: Float, z: Float) {
        (sixMWTProtocol as? DefaultSixMWTProtocol)?.updateARKitPosition(x: x, z: z)
    }

    /// Mark a rest stop start.
    func mark6MWTRestStart() {
        sixMWTProtocol.markRestStart()
        sixMWTIsResting = true
    }

    /// Mark a rest stop end.
    func mark6MWTRestEnd() {
        sixMWTProtocol.markRestEnd()
        sixMWTIsResting = false
    }

    /// Complete 6MWT (auto or manual) with user demographics and Borg scales.
    func complete6MWT(age: Int? = nil, heightM: Double? = nil, weightKg: Double? = nil, sexIsMale: Bool? = nil) {
        stopTimer()
        sixMWTAutoCompleteTimer?.invalidate()
        sixMWTAutoCompleteTimer = nil

        // Complete the protocol and get full results
        let result = sixMWTProtocol.complete(
            borgDyspnea: borgDyspneaScale,
            borgFatigue: borgFatigueScale,
            age: age,
            heightM: heightM,
            weightKg: weightKg,
            sexIsMale: sexIsMale
        )
        sixMWTCompleteResult = result
        sixMWTDistance = result.distanceM

        // Also produce the legacy SixMinuteWalkResult for backward compatibility
        sixMWTResult = cardioEstimator.evaluate6MWT(
            distanceM: result.distanceM,
            age: age,
            heightM: heightM,
            weightKg: weightKg,
            sexIsMale: sexIsMale
        )
        testState = .completed

        // Save 6MWT distance to HealthKit
        if UserDefaults.standard.bool(forKey: "healthKitSync"), result.distanceM > 0 {
            let hkService = healthKitService
            let distance = result.distanceM
            Task {
                do {
                    try await hkService.saveSixMWTDistance(distance, date: Date())
                } catch {
                    AppLogger.healthKit.error("Failed to save 6MWT to HealthKit: \(error.localizedDescription)")
                }
            }
        }
    }

    private func setup6MWTCallbacks() {
        sixMWTProtocol.onPhaseChange = { [weak self] phase in
            guard let self else { return }
            switch phase {
            case .countdown(let seconds):
                self.testState = .countdown(seconds: seconds)
            case .walking:
                self.testState = .running(phaseLabel: "Walk at your normal pace")
                self.startTimer()
            case .encouragement(let message, _):
                self.sixMWTEncouragementMessage = message
            case .completed:
                // Auto-complete calls complete6MWT
                if self.sixMWTCompleteResult == nil {
                    self.complete6MWT()
                }
            case .cancelled:
                self.testState = .cancelled
            default:
                break
            }
        }

        sixMWTProtocol.onMetricsUpdate = { [weak self] metrics in
            self?.sixMWTLiveMetrics = metrics
            self?.sixMWTDistance = metrics.distanceM
            self?.elapsedTime = metrics.elapsedTimeSec
        }

        sixMWTProtocol.onEncouragement = { [weak self] message in
            self?.sixMWTEncouragementMessage = message
        }
    }

    // MARK: - Cancel

    func cancelTest() {
        stopTimer()
        sixMWTAutoCompleteTimer?.invalidate()
        sixMWTAutoCompleteTimer = nil
        sixMWTProtocol.cancel()
        testState = .cancelled
        balanceAnalyzer.reset()
    }

    // MARK: - Private Instructions

    private func tugInstructions() -> [String] {
        [
            "Sit in a standard chair with your back against the chair, arms resting on the armrests.",
            "Place the device where the camera can see your full body. You'll need about 3 meters of clear walking space.",
            "When the timer starts:\n1. Stand up from the chair\n2. Walk 3 meters at your normal pace\n3. Turn around\n4. Walk back to the chair\n5. Sit down",
            "Tap 'Start' when ready. Tap 'Done' when you're seated again."
        ]
    }

    private func rombergInstructions() -> [String] {
        [
            "Stand with feet together, arms at your sides.",
            "Place the device where the camera can see your full body while standing.",
            "The test has two phases:\n• Phase 1: Stand still with eyes OPEN for 30 seconds\n• Phase 2: Stand still with eyes CLOSED for 30 seconds",
            "Tap 'Start' when ready. Follow the audio/visual prompts for each phase."
        ]
    }

    private func sixMWTInstructions() -> [String] {
        [
            "You will walk at your normal pace for 6 minutes.",
            "Walk back and forth along a flat, unobstructed hallway (at least 20 meters is ideal).",
            "Walk at your own pace. You may slow down or stop to rest if needed, but resume walking as soon as you can.",
            "Keep your phone with you (pocket, hand, or waistband). Sensors will automatically track your distance, steps, and pace. Tap 'Start' when ready."
        ]
    }

    // MARK: - Timer Helpers

    private func startCountdown(completion: @escaping () -> Void) {
        var remaining = 3
        testState = .countdown(seconds: remaining)
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] t in
            remaining -= 1
            if remaining <= 0 {
                t.invalidate()
                completion()
            } else {
                self?.testState = .countdown(seconds: remaining)
            }
        }
    }

    private func startTimer() {
        testStartTime = Date()
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let start = self?.testStartTime else { return }
            self?.elapsedTime = Date().timeIntervalSince(start)
        }
    }

    private func startPhaseTimer(duration: TimeInterval, completion: @escaping () -> Void) {
        var elapsed: TimeInterval = 0
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] t in
            elapsed += 0.5
            self?.phaseElapsedTime = elapsed
            if elapsed >= duration {
                t.invalidate()
                completion()
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }
}
