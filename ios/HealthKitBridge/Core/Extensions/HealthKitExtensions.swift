import Foundation
import HealthKit

// MARK: - Health Data Extensions
extension HealthKitManager {
    
    // MARK: - Heart Rate Monitoring
    func startHeartRateMonitoring() async {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            await MainActor.run {
                self.lastError = "Heart rate type not available"
            }
            print("❌ Heart rate type not available")
            return
        }
        
        print("❤️ Starting heart rate monitoring...")
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Heart rate monitoring error: \(error)")
                Task { @MainActor in
                    self?.lastError = "Heart rate monitoring failed: \(error.localizedDescription)"
                }
                completionHandler()
                return
            }
            
            Task {
                do {
                    try await self?.fetchLatestHeartRate()
                } catch {
                    print("❌ Error fetching heart rate: \(error)")
                }
            }
            
            completionHandler()
        }
        
        healthStore.execute(query)
        activeQueries.append(query)
        
        // Also fetch initial data with error handling
        do {
            try await fetchLatestHeartRate()
        } catch {
            await MainActor.run {
                self.lastError = "Failed to fetch initial heart rate: \(error.localizedDescription)"
            }
        }
    }
    
    private func fetchLatestHeartRate() async throws {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            throw HealthKitError.invalidDataType("Heart rate type not available")
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { [weak self] _, samples, error in
                
                if let error = error {
                    print("❌ Heart rate fetch error: \(error)")
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    // Not an error - just no data available
                    print("ℹ️ No heart rate data available")
                    continuation.resume()
                    return
                }
                
                let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
                let heartRateValue = sample.quantity.doubleValue(for: heartRateUnit)
                
                Task { @MainActor in
                    self?.lastHeartRate = heartRateValue
                    self?.healthDataFreshness["heart_rate"] = sample.endDate
                }
                
                Task {
                    await self?.sendHealthData(
                        type: "heart_rate",
                        value: heartRateValue,
                        unit: "count/min",
                        timestamp: sample.endDate
                    )
                }
                
                continuation.resume()
            }
            
            self.healthStore.execute(query)
        }
    }
    
    // MARK: - Step Count Monitoring
    func startStepCountMonitoring() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            await MainActor.run {
                self.lastError = "Step count type not available"
            }
            print("❌ Step count type not available")
            return
        }
        
        print("👣 Starting step count monitoring...")
        
        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Step count monitoring error: \(error)")
                Task { @MainActor in
                    self?.lastError = "Step count monitoring failed: \(error.localizedDescription)"
                }
                completionHandler()
                return
            }
            
            Task {
                do {
                    try await self?.fetchLatestStepCount()
                } catch {
                    print("❌ Error fetching step count: \(error)")
                }
            }
            
            completionHandler()
        }
        
        healthStore.execute(query)
        activeQueries.append(query)
        
        // Also fetch initial data with error handling
        do {
            try await fetchLatestStepCount()
        } catch {
            await MainActor.run {
                self.lastError = "Failed to fetch initial step count: \(error.localizedDescription)"
            }
        }
    }
    
    private func fetchLatestStepCount() async throws {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            throw HealthKitError.invalidDataType("Step count type not available")
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, result, error in
                
                if let error = error {
                    print("❌ Step count fetch error: \(error)")
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }
                
                guard let result = result else {
                    print("ℹ️ No step count data available")
                    continuation.resume()
                    return
                }
                
                let stepCount = result.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0.0
                
                Task { @MainActor in
                    self?.lastStepCount = stepCount
                    self?.healthDataFreshness["step_count"] = now
                }
                
                Task {
                    do {
                        await self?.sendHealthData(
                            type: "step_count",
                            value: stepCount,
                            unit: "count",
                            timestamp: now
                        )
                    } catch {
                        print("❌ Failed to send step count data: \(error)")
                    }
                }
                
                continuation.resume()
            }
            
            self.healthStore.execute(query)
        }
    }
    
    // MARK: - Distance Monitoring
    func startDistanceMonitoring() async {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            await MainActor.run {
                self.lastError = "Distance type not available"
            }
            print("❌ Distance type not available")
            return
        }
        
        print("🚶 Starting distance monitoring...")
        
        let query = HKObserverQuery(sampleType: distanceType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Distance monitoring error: \(error)")
                Task { @MainActor in
                    self?.lastError = "Distance monitoring failed: \(error.localizedDescription)"
                }
                completionHandler()
                return
            }
            
            Task {
                do {
                    try await self?.fetchLatestDistance()
                } catch {
                    print("❌ Error fetching distance: \(error)")
                }
            }
            
            completionHandler()
        }
        
        healthStore.execute(query)
        activeQueries.append(query)
        
        // Also fetch initial data with error handling
        do {
            try await fetchLatestDistance()
        } catch {
            await MainActor.run {
                self.lastError = "Failed to fetch initial distance: \(error.localizedDescription)"
            }
        }
    }
    
    private func fetchLatestDistance() async throws {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            throw HealthKitError.invalidDataType("Distance type not available")
        }
        
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: distanceType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, result, error in
                
                if let error = error {
                    print("❌ Distance fetch error: \(error)")
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }
                
                guard let result = result else {
                    print("ℹ️ No distance data available")
                    continuation.resume()
                    return
                }
                
                let distance = result.sumQuantity()?.doubleValue(for: HKUnit.meter()) ?? 0.0
                
                Task { @MainActor in
                    self?.lastDistance = distance
                    self?.healthDataFreshness["distance"] = now
                }
                
                Task {
                    do {
                        await self?.sendHealthData(
                            type: "distance_walking_running",
                            value: distance,
                            unit: "m",
                            timestamp: now
                        )
                    } catch {
                        print("❌ Failed to send distance data: \(error)")
                    }
                }
                
                continuation.resume()
            }
            
            self.healthStore.execute(query)
        }
    }
}

// MARK: - HealthKit Error Types
enum HealthKitError: Error, LocalizedError {
    case invalidDataType(String)
    case queryFailed(String)
    case noDataAvailable(String)
    case authorizationDenied
    
    var errorDescription: String? {
        switch self {
        case .invalidDataType(let message):
            return "Invalid data type: \(message)"
        case .queryFailed(let message):
            return "Query failed: \(message)"
        case .noDataAvailable(let message):
            return "No data available: \(message)"
        case .authorizationDenied:
            return "HealthKit authorization denied"
        }
    }
}

// MARK: - Gait Analysis Extensions
extension HKQuantityType {
    static var gaitAnalysisTypes: Set<HKQuantityType> {
        let gaitTypes: [HKQuantityTypeIdentifier] = [
            .walkingSpeed,
            .walkingStepLength,
            .walkingAsymmetryPercentage,
            .walkingDoubleSupportPercentage,
            .stairAscentSpeed,
            .stairDescentSpeed,
            .sixMinuteWalkTestDistance
        ]
        
        return Set(gaitTypes.compactMap { HKQuantityType.quantityType(forIdentifier: $0) })
    }
    
    static var mobilityTypes: Set<HKQuantityType> {
        let mobilityTypes: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .distanceWalkingRunning,
            .flightsClimbed,
            .appleMoveTime,
            .appleStandTime,
            .appleExerciseTime
        ]
        
        return Set(mobilityTypes.compactMap { HKQuantityType.quantityType(forIdentifier: $0) })
    }
}

extension HKUnit {
    static var gaitAnalysisUnits: [HKQuantityTypeIdentifier: HKUnit] {
        return [
            .walkingSpeed: HKUnit.meter().unitDivided(by: .second()),
            .walkingStepLength: HKUnit.meter(),
            .walkingAsymmetryPercentage: HKUnit.percent(),
            .walkingDoubleSupportPercentage: HKUnit.percent(),
            .stairAscentSpeed: HKUnit.meter().unitDivided(by: .second()),
            .stairDescentSpeed: HKUnit.meter().unitDivided(by: .second()),
            .sixMinuteWalkTestDistance: HKUnit.meter()
        ]
    }
}
