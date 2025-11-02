import Foundation
import HealthKit
import WatchKit
import Combine

class WatchHealthManager: NSObject, ObservableObject {
    static let shared = WatchHealthManager()

    private let healthStore = HKHealthStore()
    @Published var isRealTimeMonitoringActive = false
    @Published var isAuthorized = false

    // Real-time queries
    private var heartRateQuery: HKAnchoredObjectQuery?
    private var workoutSession: HKWorkoutSession?

    private override init() {
        super.init()
    }

    // MARK: - Authorization
    func requestAuthorization(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }

        let typesToRead: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKObjectType.workoutType()
        ]

        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            DispatchQueue.main.async {
                self.isAuthorized = success
                completion(success)
            }
        }
    }

    // MARK: - Real-time Heart Rate Monitoring
    func startRealTimeHeartRateMonitoring(completion: @escaping (Double) -> Void) {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            return
        }

        let predicate = HKQuery.predicateForSamples(
            withStart: Date(),
            end: nil,
            options: .strictStartDate
        )

        heartRateQuery = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { _, samples, _, _, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                DispatchQueue.main.async {
                    completion(heartRate)
                }
            }
        }

        heartRateQuery?.updateHandler = { _, samples, _, _, error in
            guard let samples = samples as? [HKQuantitySample] else { return }

            for sample in samples {
                let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                DispatchQueue.main.async {
                    completion(heartRate)
                }
            }
        }

        healthStore.execute(heartRateQuery!)
        isRealTimeMonitoringActive = true
    }

    func stopRealTimeHeartRateMonitoring() {
        if let query = heartRateQuery {
            healthStore.stop(query)
            heartRateQuery = nil
        }
        isRealTimeMonitoringActive = false
    }

    // MARK: - Data Fetching
    func fetchTodaySteps(completion: @escaping (Double) -> Void) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            return
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)

        let query = HKStatisticsQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            guard let result = result,
                  let sum = result.sumQuantity() else {
                completion(0)
                return
            }

            let steps = sum.doubleValue(for: HKUnit.count())
            DispatchQueue.main.async {
                completion(steps)
            }
        }

        healthStore.execute(query)
    }

    func fetchTodayActiveEnergy(completion: @escaping (Double) -> Void) {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            return
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)

        let query = HKStatisticsQuery(
            quantityType: energyType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, result, error in
            guard let result = result,
                  let sum = result.sumQuantity() else {
                completion(0)
                return
            }

            let energy = sum.doubleValue(for: HKUnit.kilocalorie())
            DispatchQueue.main.async {
                completion(energy)
            }
        }

        healthStore.execute(query)
    }

    // MARK: - Workout Management
    func startWorkout() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .other
        configuration.locationType = .unknown

        do {
            workoutSession = try HKWorkoutSession(configuration: configuration)
            workoutSession?.delegate = self
            workoutSession?.startActivity(with: Date())
        } catch {
            print("Failed to start workout: \(error)")
        }
    }

    func startHeartRateWorkout() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .other
        configuration.locationType = .unknown

        do {
            workoutSession = try HKWorkoutSession(configuration: configuration)
            workoutSession?.delegate = self
            workoutSession?.startActivity(with: Date())

            // Start enhanced heart rate monitoring during workout
            startRealTimeHeartRateMonitoring { heartRate in
                // Send to phone via connectivity
                WatchAppConnectivityManager.shared.sendHeartRateToPhone(heartRate)
            }
        } catch {
            print("Failed to start heart rate workout: \(error)")
        }
    }

    func stopWorkout() {
        workoutSession?.end()
        workoutSession = nil
        stopRealTimeHeartRateMonitoring()
    }
}

// MARK: - HKWorkoutSessionDelegate
extension WatchHealthManager: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        switch toState {
        case .running:
            print("Workout started")
        case .ended:
            print("Workout ended")
            stopRealTimeHeartRateMonitoring()
        default:
            break
        }
    }

    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("Workout failed: \(error)")
    }
}
