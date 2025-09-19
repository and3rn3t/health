import Foundation
import HealthKit
import SwiftUI
// Haptics lives in UI layer; lightweight import is acceptable for feedback coupling.
import UIKit

/// Staged permission request coordinator to improve user comprehension and acceptance rate.
/// Strategy:
/// 1. Request minimal, low-friction types (steps) with clear rationale.
/// 2. After success, present grouped rationale screens for (movement + fall risk) then (cardio + recovery) sets.
/// 3. Persist accepted groups to avoid re-prompting; surface a diagnostics view for missing permissions.
@MainActor
final class HealthKitPermissionCoordinator: ObservableObject {
    static let shared = HealthKitPermissionCoordinator()

    @Published private(set) var stage: Stage = .initial
    @Published private(set) var lastError: String?
    @Published var completed: Bool = false
    @Published var grantedTypes: Set<HKObjectType> = []

    // Dependency-injected health store wrapper to enable deterministic testing.
    private let healthStore: HealthStoreProviding
    private let manager = HealthKitManager.shared
    private let progressStore: PermissionProgressStoring

    private struct Persisted: Codable { let completedStages: [Stage] }

    enum Stage: String, CaseIterable, Codable { case rationale, initial, movementCore, fallRisk, cardioRecovery, finished }

    // MARK: - Initializers
    private init() {
        self.healthStore = RealHealthStore()
        self.progressStore = RealPermissionProgressStore()
        loadProgress()
    }

    /// Test / custom initializer allowing injection of a mock health store.
    /// - Parameters:
    ///   - healthStore: A provider conforming to `HealthStoreProviding`.
    ///   - initialStage: Optional override for starting stage (default preserves persisted progress logic when nil).
    init(healthStore: HealthStoreProviding, progressStore: PermissionProgressStoring = InMemoryPermissionProgressStore(), initialStage: Stage? = nil) {
        self.healthStore = healthStore
        self.progressStore = progressStore
        loadProgress()
        if let initialStage { self.stage = initialStage }
    }

    private func loadProgress() {
    let completedStages = progressStore.loadCompletedStages()
    guard !completedStages.isEmpty else { stage = .rationale; return }
        if completedStages.contains(.finished) {
            stage = .finished; completed = true
            Log.info("Loaded persisted progress: finished", category: .permissions)
        } else if let last = completedStages.last {
            stage = last
            Log.info("Loaded persisted progress: last=\(last)", category: .permissions)
        }
    }

    private func persist(stage: Stage) {
        let completed = Stage.allCases.filter { $0.rawValue <= stage.rawValue }
        progressStore.saveCompletedStages(completed)
        Log.debug("Persisted stages: \(completed.map { $0.rawValue })", category: .permissions)
    }

    /// Returns the requested set for the current stage (idempotent grouping logic).
    private func typesForStage(_ stage: Stage) -> Set<HKObjectType> {
        switch stage {
        case .rationale:
            // Rationale screen does not request authorization; returns empty set.
            return []
        case .initial:
            return Set([HKQuantityType.quantityType(forIdentifier: .stepCount)].compactMap { $0 })
        case .movementCore:
            return Set([
                HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning),
                HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
                HKQuantityType.quantityType(forIdentifier: .heartRate)
            ].compactMap { $0 })
        case .fallRisk:
            return Set([
                HKQuantityType.quantityType(forIdentifier: .walkingSpeed),
                HKQuantityType.quantityType(forIdentifier: .walkingStepLength),
                HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage),
                HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage),
                HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness),
                HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)
            ].compactMap { $0 })
        case .cardioRecovery:
            return Set([
                HKQuantityType.quantityType(forIdentifier: .restingHeartRate),
                HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN),
                HKQuantityType.quantityType(forIdentifier: .vo2Max)
            ].compactMap { $0 })
        case .finished:
            return []
        }
    }

    /// Progresses to the next stage if authorization for the current group succeeds.
    func advance() async {
        guard stage != .finished else { completed = true; return }
        // If we are on rationale stage just move forward – no HK dialog.
        if stage == .rationale {
            if let idx = Stage.allCases.firstIndex(of: stage), idx + 1 < Stage.allCases.count {
                stage = Stage.allCases[idx + 1]
                persist(stage: stage)
                NotificationCenter.default.post(name: .permissionsStageAdvanced, object: stage)
            }
            return
        }
        let targetTypes = typesForStage(stage)
        do {
            try await healthStore.requestAuthorization(toShare: [], read: targetTypes)
            grantedTypes.formUnion(targetTypes)
            // Update HealthKitManager baseline if first stage
            if stage == .initial { manager.authorizationStatus = .sharingAuthorized }
            // Move to next stage
            if let idx = Stage.allCases.firstIndex(of: stage), idx + 1 < Stage.allCases.count {
                stage = Stage.allCases[idx + 1]
                if stage == .finished { completed = true }
                persist(stage: stage)
                Log.info("Advanced to stage: \(stage)", category: .permissions)
                Haptics.shared.trigger(.success)
            } else {
                stage = .finished
                completed = true
                persist(stage: .finished)
                Log.info("Advanced to finished stage", category: .permissions)
                Haptics.shared.trigger(.success)
            }
            NotificationCenter.default.post(name: .permissionsStageAdvanced, object: stage)
        } catch {
            lastError = error.localizedDescription
            Log.error("Authorization error: \(error.localizedDescription)", category: .permissions)
            Haptics.shared.trigger(.error)
        }
    }

    /// Diagnostics for UI: which requested types are missing.
    func missingTypesSummary() -> [String] {
        var missing: [String] = []
        for s in Stage.allCases where s != .finished {
            for type in typesForStage(s) {
                let status = healthStore.authorizationStatus(for: type)
                if status != .sharingAuthorized { missing.append(type.identifier) }
            }
        }
        return missing.sorted()
    }
}

// MARK: - Protocol Abstraction

protocol HealthStoreProviding: AnyObject {
    func requestAuthorization(toShare typesToShare: Set<HKSampleType>, read typesToRead: Set<HKObjectType>) async throws
    func authorizationStatus(for type: HKObjectType) -> HKAuthorizationStatus
}

extension HealthKitPermissionCoordinator.Stage: Comparable {
    public static func < (lhs: Self, rhs: Self) -> Bool { lhs.rawValue < rhs.rawValue }
}

// Real implementation bridging to HKHealthStore (kept small for testability).
final class RealHealthStore: HealthStoreProviding {
    private let store = HKHealthStore()
    func requestAuthorization(toShare typesToShare: Set<HKSampleType>, read typesToRead: Set<HKObjectType>) async throws {
        try await store.requestAuthorization(toShare: typesToShare, read: typesToRead)
    }
    func authorizationStatus(for type: HKObjectType) -> HKAuthorizationStatus { store.authorizationStatus(for: type) }
}

// Deterministic mock for unit tests.
final class MockHealthStore: HealthStoreProviding {
    var authorized: Set<HKObjectType> = []
    var requested: [Set<HKObjectType>] = []
    var nextError: Error?

    struct MockError: LocalizedError { let message: String; var errorDescription: String? { message } }

    func requestAuthorization(toShare typesToShare: Set<HKSampleType>, read typesToRead: Set<HKObjectType>) async throws {
        if let err = nextError { defer { nextError = nil }; throw err }
        requested.append(typesToRead)
        authorized.formUnion(typesToRead)
    }

    func authorizationStatus(for type: HKObjectType) -> HKAuthorizationStatus {
        authorized.contains(type) ? .sharingAuthorized : .notDetermined
    }
}

// MARK: - Progress Persistence Abstractions

protocol PermissionProgressStoring {
    func loadCompletedStages() -> [HealthKitPermissionCoordinator.Stage]
    func saveCompletedStages(_ stages: [HealthKitPermissionCoordinator.Stage])
}

final class RealPermissionProgressStore: PermissionProgressStoring {
    private let key = "vitalsense.health.permissions.stages"
    private struct Persisted: Codable { let completedStages: [HealthKitPermissionCoordinator.Stage] }
    func loadCompletedStages() -> [HealthKitPermissionCoordinator.Stage] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode(Persisted.self, from: data) else { return [] }
        return decoded.completedStages
    }
    func saveCompletedStages(_ stages: [HealthKitPermissionCoordinator.Stage]) {
        let payload = Persisted(completedStages: stages)
        if let data = try? JSONEncoder().encode(payload) { UserDefaults.standard.set(data, forKey: key) }
    }
}

final class InMemoryPermissionProgressStore: PermissionProgressStoring {
    private var stages: [HealthKitPermissionCoordinator.Stage] = []
    func loadCompletedStages() -> [HealthKitPermissionCoordinator.Stage] { stages }
    func saveCompletedStages(_ stages: [HealthKitPermissionCoordinator.Stage]) { self.stages = stages }
}
