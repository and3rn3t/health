//
//  HealthKitService.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import HealthKit
import os.log

/// Errors specific to HealthKit operations.
enum HealthKitError: LocalizedError {
    case timeout
    case notAvailable
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .timeout:
            return "HealthKit operation timed out"
        case .notAvailable:
            return "HealthKit is not available on this device"
        case .unauthorized:
            return "HealthKit access not authorized"
        }
    }
}

/// User demographics read from HealthKit for normative comparison.
struct UserDemographics: Sendable {
    let age: Int?
    let biologicalSex: HKBiologicalSex?
    let heightM: Double?
    let bodyMassKg: Double?

    var isMale: Bool? {
        switch biologicalSex {
        case .male: return true
        case .female: return false
        default: return nil
        }
    }
}

/// Protocol for HealthKit integration.
protocol HealthKitService {
    var isAvailable: Bool { get }

    /// Request authorization to read/write relevant HealthKit data types.
    func requestAuthorization() async throws

    /// Write session metrics to HealthKit.
    func saveSession(
        steps: Int,
        walkingSpeed: Double?,    // m/s
        strideLength: Double?,    // m
        asymmetry: Double?,       // 0–1 (percentage / 100)
        distance: Double?,        // meters
        start: Date,
        end: Date
    ) async throws

    /// Read step count for a date range.
    func fetchSteps(from start: Date, to end: Date) async throws -> Double

    /// Read walking speed samples for a date range.
    func fetchWalkingSpeed(from start: Date, to end: Date) async throws -> [HKQuantitySample]

    /// Read user demographics (age, sex, height, weight) for normative comparison.
    func fetchDemographics() async throws -> UserDemographics

    /// Read daily step count average over the last N days.
    func fetchAverageDailySteps(days: Int) async throws -> Double

    /// Save a 6-Minute Walk Test distance to HealthKit.
    func saveSixMWTDistance(_ distanceM: Double, date: Date) async throws

    /// Read recent walking asymmetry samples over the last N days.
    func fetchRecentWalkingAsymmetry(days: Int) async throws -> [HKQuantitySample]

    /// Read recent double-support time samples over the last N days.
    func fetchRecentDoubleSupportTime(days: Int) async throws -> [HKQuantitySample]
}

// MARK: - Default Implementation

final class DefaultHealthKitService: HealthKitService {

    private let store = HKHealthStore()

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    // MARK: Shared types

    private var readTypes: Set<HKObjectType> {
        let types: [HKObjectType] = [
            HKQuantityType(.stepCount),
            HKQuantityType(.walkingSpeed),
            HKQuantityType(.walkingStepLength),
            HKQuantityType(.walkingAsymmetryPercentage),
            HKQuantityType(.walkingDoubleSupportPercentage),
            HKQuantityType(.height),
            HKQuantityType(.bodyMass),
            HKQuantityType(.distanceWalkingRunning),
            HKQuantityType(.sixMinuteWalkTestDistance),
            HKCharacteristicType(.biologicalSex),
            HKCharacteristicType(.dateOfBirth)
        ]
        return Set(types)
    }

    private var writeTypes: Set<HKSampleType> {
        let types: [HKQuantityType] = [
            .init(.stepCount),
            .init(.walkingSpeed),
            .init(.walkingStepLength),
            .init(.distanceWalkingRunning),
            .init(.sixMinuteWalkTestDistance),
            .init(.walkingAsymmetryPercentage),
            .init(.walkingDoubleSupportPercentage)
        ]
        return Set(types)
    }

    // MARK: Authorization

    func requestAuthorization() async throws {
        guard isAvailable else {
            AppLogger.healthKit.warning("HealthKit not available on this device")
            return
        }
        try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
        AppLogger.healthKit.info("HealthKit authorization requested")
    }

    // MARK: Write

    func saveSession(
        steps: Int,
        walkingSpeed: Double?,
        strideLength: Double?,
        asymmetry: Double?,
        distance: Double?,
        start: Date,
        end: Date
    ) async throws {
        let hkToken = PerformanceMonitor.begin(.healthKitSave)
        defer { PerformanceMonitor.end(hkToken) }

        var samples: [HKQuantitySample] = []

        if steps > 0 {
            let qty = HKQuantity(unit: .count(), doubleValue: Double(steps))
            samples.append(HKQuantitySample(type: .init(.stepCount), quantity: qty, start: start, end: end))
        }

        if let speed = walkingSpeed, speed > 0 {
            let qty = HKQuantity(unit: HKUnit.meter().unitDivided(by: .second()), doubleValue: speed)
            samples.append(HKQuantitySample(type: .init(.walkingSpeed), quantity: qty, start: start, end: end))
        }

        if let stride = strideLength, stride > 0 {
            let qty = HKQuantity(unit: .meter(), doubleValue: stride)
            samples.append(HKQuantitySample(type: .init(.walkingStepLength), quantity: qty, start: start, end: end))
        }

        if let dist = distance, dist > 0 {
            let qty = HKQuantity(unit: .meter(), doubleValue: dist)
            samples.append(HKQuantitySample(type: .init(.distanceWalkingRunning), quantity: qty, start: start, end: end))
        }

        if let asym = asymmetry, asym > 0 {
            let qty = HKQuantity(unit: .percent(), doubleValue: asym * 100)
            samples.append(HKQuantitySample(type: .init(.walkingAsymmetryPercentage), quantity: qty, start: start, end: end))
        }

        guard !samples.isEmpty else { return }

        // Add timeout to prevent hanging indefinitely
        try await withThrowingTaskGroup(of: Void.self) { group in
            group.addTask {
                try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
                    self.store.save(samples) { _, error in
                        if let error {
                            AppLogger.healthKit.error("Failed to save HealthKit samples: \(error.localizedDescription)")
                            cont.resume(throwing: error)
                        } else {
                            AppLogger.healthKit.info("Saved \(samples.count) HealthKit sample(s)")
                            cont.resume()
                        }
                    }
                }
            }
            
            // Timeout after 30 seconds
            group.addTask {
                try await Task.sleep(for: .seconds(30))
                throw HealthKitError.timeout
            }
            
            // Wait for the first task to complete (either success or timeout)
            try await group.next()
            group.cancelAll()
        }
    }

    // MARK: Read

    func fetchSteps(from start: Date, to end: Date) async throws -> Double {
        let fetchToken = PerformanceMonitor.begin(.healthKitFetch)
        defer { PerformanceMonitor.end(fetchToken) }

        let type = HKQuantityType(.stepCount)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)

        return try await withThrowingTaskGroup(of: Double.self) { group in
            group.addTask {
                try await withCheckedThrowingContinuation { cont in
                    let query = HKStatisticsQuery(
                        quantityType: type,
                        quantitySamplePredicate: predicate,
                        options: .cumulativeSum
                    ) { _, result, error in
                        if let error { cont.resume(throwing: error); return }
                        let sum = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                        cont.resume(returning: sum)
                    }
                    self.store.execute(query)
                }
            }
            
            // Timeout after 15 seconds
            group.addTask {
                try await Task.sleep(for: .seconds(15))
                throw HealthKitError.timeout
            }
            
            guard let result = try await group.next() else {
                throw HealthKitError.timeout
            }
            group.cancelAll()
            return result
        }
    }

    func fetchWalkingSpeed(from start: Date, to end: Date) async throws -> [HKQuantitySample] {
        let type = HKQuantityType(.walkingSpeed)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { cont in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error { cont.resume(throwing: error); return }
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }
    }

    // MARK: Demographics

    func fetchDemographics() async throws -> UserDemographics {
        guard isAvailable else {
            return UserDemographics(age: nil, biologicalSex: nil, heightM: nil, bodyMassKg: nil)
        }

        // Biological sex
        let sex: HKBiologicalSex?
        do {
            sex = try store.biologicalSex().biologicalSex
        } catch {
            sex = nil
        }

        // Age from date of birth
        let age: Int?
        do {
            let dob = try store.dateOfBirthComponents()
            if let year = dob.year {
                let calendar = Calendar.current
                let now = calendar.dateComponents([.year], from: Date())
                age = (now.year ?? 0) - year
            } else {
                age = nil
            }
        } catch {
            age = nil
        }

        // Height (most recent)
        let height = try await fetchMostRecentQuantity(type: .init(.height), unit: .meter())

        // Body mass (most recent)
        let mass = try await fetchMostRecentQuantity(type: .init(.bodyMass), unit: .gramUnit(with: .kilo))

        return UserDemographics(age: age, biologicalSex: sex, heightM: height, bodyMassKg: mass)
    }

    // MARK: Daily Steps Average

    func fetchAverageDailySteps(days: Int) async throws -> Double {
        let calendar = Calendar.current
        let end = Date()
        guard let start = calendar.date(byAdding: .day, value: -days, to: end) else { return 0 }
        let totalSteps = try await fetchSteps(from: start, to: end)
        return days > 0 ? totalSteps / Double(days) : 0
    }

    // MARK: 6MWT Save

    func saveSixMWTDistance(_ distanceM: Double, date: Date) async throws {
        guard distanceM > 0 else { return }
        let qty = HKQuantity(unit: .meter(), doubleValue: distanceM)
        let sample = HKQuantitySample(
            type: .init(.sixMinuteWalkTestDistance),
            quantity: qty,
            start: date.addingTimeInterval(-360),
            end: date
        )
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            store.save(sample) { _, error in
                if let error {
                    AppLogger.healthKit.error("Failed to save 6MWT distance: \(error.localizedDescription)")
                    cont.resume(throwing: error)
                } else {
                    AppLogger.healthKit.info("Saved 6MWT distance: \(distanceM, format: .fixed(precision: 1))m")
                    cont.resume()
                }
            }
        }
    }

    // MARK: Fetch Walking Asymmetry

    func fetchRecentWalkingAsymmetry(days: Int) async throws -> [HKQuantitySample] {
        let calendar = Calendar.current
        let end = Date()
        guard let start = calendar.date(byAdding: .day, value: -days, to: end) else { return [] }
        let type = HKQuantityType(.walkingAsymmetryPercentage)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { cont in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error { cont.resume(throwing: error); return }
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }
    }

    // MARK: Fetch Double Support Time

    func fetchRecentDoubleSupportTime(days: Int) async throws -> [HKQuantitySample] {
        let calendar = Calendar.current
        let end = Date()
        guard let start = calendar.date(byAdding: .day, value: -days, to: end) else { return [] }
        let type = HKQuantityType(.walkingDoubleSupportPercentage)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        return try await withCheckedThrowingContinuation { cont in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error { cont.resume(throwing: error); return }
                cont.resume(returning: (samples as? [HKQuantitySample]) ?? [])
            }
            store.execute(query)
        }
    }

    // MARK: Private Helpers

    private func fetchMostRecentQuantity(type: HKQuantityType, unit: HKUnit) async throws -> Double? {
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let predicate = HKQuery.predicateForSamples(withStart: .distantPast, end: .now)

        return try await withCheckedThrowingContinuation { cont in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: 1,
                sortDescriptors: [sort]
            ) { _, samples, error in
                if let error { cont.resume(throwing: error); return }
                let value = (samples?.first as? HKQuantitySample)?
                    .quantity.doubleValue(for: unit)
                cont.resume(returning: value)
            }
            store.execute(query)
        }
    }
}
