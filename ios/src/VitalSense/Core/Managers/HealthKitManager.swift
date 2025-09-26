import Foundation
import HealthKit
import Combine
#if canImport(UIKit)
import UIKit
#endif

#if canImport(HealthKit)
// MARK: - HealthKit Manager
@MainActor
class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    let healthStore = HKHealthStore()
    private var webSocketManager: WebSocketManager?
    private var deviceToken: String?
    private let userId: String

    // Enhanced configuration using new config system
    private let config = EnhancedAppConfig.shared

    // Health data types we want to read - enhanced for comprehensive movement analysis
    private lazy var healthDataTypes: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []
        
        // Basic health metrics
        if let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate) {
            types.insert(heartRate)
        }
        if let stepCount = HKObjectType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepCount)
        }
        if let walkingSpeed = HKObjectType.quantityType(forIdentifier: .walkingSpeed) {
            types.insert(walkingSpeed)
        }
        if let walkingStepLength = HKObjectType.quantityType(forIdentifier: .walkingStepLength) {
            types.insert(walkingStepLength)
        }
        
        // Advanced gait metrics
        if let walkingAsymmetry = HKObjectType.quantityType(forIdentifier: .walkingAsymmetryPercentage) {
            types.insert(walkingAsymmetry)
        }
        if let walkingDoubleSupportPercentage = HKObjectType.quantityType(forIdentifier: .walkingDoubleSupportPercentage) {
            types.insert(walkingDoubleSupportPercentage)
        }
        
        return types
    }()

    override init() {
        #if canImport(UIKit)
        self.userId = UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        #else
        self.userId = "unknown"
        #endif
        super.init()
        Task { @MainActor in
            self.webSocketManager = WebSocketManager.shared
        }
    }

    // MARK: - HealthKit Authorization
    func requestHealthKitPermissions() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }

        try await healthStore.requestAuthorization(toShare: [], read: healthDataTypes)
    }

    // MARK: - Data Fetching
    func fetchLatestHealthData() async -> [HealthData] {
        var healthDataArray: [HealthData] = []
        
        for dataType in healthDataTypes {
            if let quantityType = dataType as? HKQuantityType {
                do {
                    let data = try await fetchLatestQuantityData(for: quantityType)
                    healthDataArray.append(contentsOf: data)
                } catch {
                    print("Error fetching \(quantityType.identifier): \(error)")
                }
            }
        }
        
        return healthDataArray
    }

    private func fetchLatestQuantityData(for quantityType: HKQuantityType) async throws -> [HealthData] {
        return try await withCheckedThrowingContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(
                withStart: Calendar.current.date(byAdding: .hour, value: -24, to: Date()),
                end: Date(),
                options: .strictEndDate
            )
            
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: 100,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                let healthData = samples?.compactMap { sample -> HealthData? in
                    guard let quantitySample = sample as? HKQuantitySample else { return nil }
                    
                    return HealthData(
                        type: quantityType.identifier,
                        value: quantitySample.quantity.doubleValue(for: self.getUnit(for: quantityType)),
                        unit: self.getUnit(for: quantityType).unitString,
                        timestamp: sample.startDate,
                        deviceId: sample.device?.name ?? "Unknown",
                        userId: self.userId
                    )
                } ?? []
                
                continuation.resume(returning: healthData)
            }
            
            healthStore.execute(query)
        }
    }

    @MainActor
    private func getUnit(for quantityType: HKQuantityType) -> HKUnit {
        switch quantityType.identifier {
        case HKQuantityTypeIdentifier.heartRate.rawValue:
            return HKUnit.count().unitDivided(by: .minute())
        case HKQuantityTypeIdentifier.stepCount.rawValue:
            return HKUnit.count()
        case HKQuantityTypeIdentifier.walkingSpeed.rawValue:
            return HKUnit.meter().unitDivided(by: .second())
        case HKQuantityTypeIdentifier.walkingStepLength.rawValue:
            return HKUnit.meter()
        case HKQuantityTypeIdentifier.walkingAsymmetryPercentage.rawValue:
            return HKUnit.percent()
        case HKQuantityTypeIdentifier.walkingDoubleSupportPercentage.rawValue:
            return HKUnit.percent()
        default:
            return HKUnit.count()
        }
    }
}

// MARK: - HealthKit Errors
enum HealthKitError: Error {
    case notAvailable
    case notAuthorized
    case dataUnavailable
}
#endif
