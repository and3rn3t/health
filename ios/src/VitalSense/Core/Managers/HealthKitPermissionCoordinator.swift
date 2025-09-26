import Foundation
import HealthKit
import SwiftUI

// MARK: - HealthKit Permission Coordinator
class HealthKitPermissionCoordinator: ObservableObject {
    static let shared = HealthKitPermissionCoordinator()
    
    @Published var hasHealthKitAccess = false
    @Published var permissionStatus: HealthKitPermissionStatus = .notDetermined
    
    private let healthStore = HKHealthStore()
    
    enum HealthKitPermissionStatus {
        case notDetermined
        case granted
        case denied
        case restricted
    }
    
    private init() {
        checkPermissionStatus()
    }
    
    private func checkPermissionStatus() {
        guard HKHealthStore.isHealthDataAvailable() else {
            permissionStatus = .restricted
            return
        }
        
        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .walkingSpeed)!
        ]
        
        for type in readTypes {
            let status = healthStore.authorizationStatus(for: type)
            switch status {
            case .notDetermined:
                permissionStatus = .notDetermined
                return
            case .sharingDenied:
                permissionStatus = .denied
                hasHealthKitAccess = false
                return
            case .sharingAuthorized:
                continue
            @unknown default:
                permissionStatus = .notDetermined
                return
            }
        }
        
        permissionStatus = .granted
        hasHealthKitAccess = true
    }
    
    func requestPermissions() async -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else { return false }
        
        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .walkingSpeed)!,
            HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!
        ]
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: readTypes)
            await MainActor.run {
                checkPermissionStatus()
            }
            return hasHealthKitAccess
        } catch {
            print("❌ HealthKit permission error: \(error)")
            return false
        }
    }
}