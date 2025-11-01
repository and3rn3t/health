import Foundation
import HealthKit
import WidgetKit
import Combine

// MARK: - Widget Health Manager
@MainActor
class WidgetHealthManager: ObservableObject {
    static let shared = WidgetHealthManager()

    private let healthStore = HKHealthStore()
    private let userDefaults = UserDefaults(suiteName: "group.dev.andernet.VitalSense.shared")

    // Cache keys
    private enum CacheKeys {
        static let heartRate = "cached_heart_rate"
        static let steps = "cached_steps"
        static let activeEnergy = "cached_active_energy"
        static let exerciseMinutes = "cached_exercise_minutes"
        static let standHours = "cached_stand_hours"
        static let walkingSteadiness = "cached_walking_steadiness"
        static let lastUpdate = "last_update"
    }

    private init() {
        setupHealthKit()
    }

    // MARK: - HealthKit Setup
    private func setupHealthKit() {
        guard HKHealthStore.isHealthDataAvailable() else { return }

        let readTypes: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)!,
            HKQuantityType.quantityType(forIdentifier: .appleStandHour)!,
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!
        ]

        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                print("HealthKit authorization failed: \(error)")
            }
        }
    }

    // MARK: - Heart Rate Data
    func fetchHeartRateData(completion: @escaping (Double?) -> Void) {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!

        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] _, samples, error in
            DispatchQueue.main.async {
                if let sample = samples?.first as? HKQuantitySample {
                    let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    self?.cacheValue(heartRate, for: CacheKeys.heartRate)
                    completion(heartRate)
                } else {
                    // Return cached value if available
                    let cached = self?.getCachedValue(for: CacheKeys.heartRate)
                    completion(cached)
                }
            }
        }

        healthStore.execute(query)
    }

    // MARK: - Activity Data
    func fetchActivityData(completion: @escaping (Double?, Double?, Double?, Double?) -> Void) {
        let group = DispatchGroup()
        var steps: Double?
        var energy: Double?
        var exercise: Double?
        var stand: Double?

        // Fetch steps
        group.enter()
        fetchStepsForToday { stepsValue in
            steps = stepsValue
            group.leave()
        }

        // Fetch active energy
        group.enter()
        fetchActiveEnergyForToday { energyValue in
            energy = energyValue
            group.leave()
        }

        // Fetch exercise minutes
        group.enter()
        fetchExerciseMinutesForToday { exerciseValue in
            exercise = exerciseValue
            group.leave()
        }

        // Fetch stand hours
        group.enter()
        fetchStandHoursForToday { standValue in
            stand = standValue
            group.leave()
        }

        group.notify(queue: .main) {
            completion(steps, energy, exercise, stand)
        }
    }

    // MARK: - Steps Data
    func fetchStepsData(completion: @escaping (Double?, [Double]?) -> Void) {
        let group = DispatchGroup()
        var totalSteps: Double?
        var hourlySteps: [Double]?

        // Fetch total steps for today
        group.enter()
        fetchStepsForToday { steps in
            totalSteps = steps
            group.leave()
        }

        // Fetch hourly steps
        group.enter()
        fetchHourlySteps { hourly in
            hourlySteps = hourly
            group.leave()
        }

        group.notify(queue: .main) {
            completion(totalSteps, hourlySteps)
        }
    }

    // MARK: - Walking Steadiness Data
    func fetchWalkingSteadinessData(completion: @escaping (Double?, String) -> Void) {
        // Walking steadiness is a more complex metric
        // For now, we'll use walking speed as a proxy
        let walkingSpeedType = HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!

        let query = HKSampleQuery(
            sampleType: walkingSpeedType,
            predicate: todayPredicate(),
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] _, samples, error in
            DispatchQueue.main.async {
                if let samples = samples as? [HKQuantitySample], !samples.isEmpty {
                    let speeds = samples.map { $0.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second())) }
                    let averageSpeed = speeds.reduce(0, +) / Double(speeds.count)

                    // Convert to steadiness score (0-100)
                    let steadinessScore = min(max(averageSpeed * 50, 0), 100)
                    let status = self?.steadinessStatus(for: steadinessScore) ?? "Unknown"

                    self?.cacheValue(steadinessScore, for: CacheKeys.walkingSteadiness)
                    completion(steadinessScore, status)
                } else {
                    let cached = self?.getCachedValue(for: CacheKeys.walkingSteadiness)
                    let status = self?.steadinessStatus(for: cached ?? 0) ?? "Unknown"
                    completion(cached, status)
                }
            }
        }

        healthStore.execute(query)
    }

    // MARK: - All Health Data
    func fetchAllHealthData(completion: @escaping (HealthEntry) -> Void) {
        let group = DispatchGroup()

        var heartRate: Double?
        var steps: Double?
        var activeEnergy: Double?
        var exerciseMinutes: Double?
        var standHours: Double?
        var walkingSteadiness: Double?
        var steadinessStatus = "Unknown"

        // Fetch heart rate
        group.enter()
        fetchHeartRateData { hr in
            heartRate = hr
            group.leave()
        }

        // Fetch activity data
        group.enter()
        fetchActivityData { s, e, ex, st in
            steps = s
            activeEnergy = e
            exerciseMinutes = ex
            standHours = st
            group.leave()
        }

        // Fetch walking steadiness
        group.enter()
        fetchWalkingSteadinessData { ws, status in
            walkingSteadiness = ws
            steadinessStatus = status
            group.leave()
        }

        group.notify(queue: .main) {
            let entry = HealthEntry(
                date: Date(),
                heartRate: heartRate,
                steps: steps,
                activeEnergy: activeEnergy,
                exerciseMinutes: exerciseMinutes,
                standHours: standHours,
                walkingSteadiness: walkingSteadiness,
                steadinessStatus: steadinessStatus,
                isConnected: true
            )

            // Cache the entry
            self.cacheHealthEntry(entry)
            completion(entry)
        }
    }

    // MARK: - Private Helper Methods
    private func fetchStepsForToday(completion: @escaping (Double?) -> Void) {
        let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount)!

        let query = HKStatisticsQuery(
            quantityType: stepsType,
            quantitySamplePredicate: todayPredicate(),
            options: .cumulativeSum
        ) { [weak self] _, statistics, error in
            DispatchQueue.main.async {
                if let sum = statistics?.sumQuantity() {
                    let steps = sum.doubleValue(for: .count())
                    self?.cacheValue(steps, for: CacheKeys.steps)
                    completion(steps)
                } else {
                    let cached = self?.getCachedValue(for: CacheKeys.steps)
                    completion(cached)
                }
            }
        }

        healthStore.execute(query)
    }

    private func fetchActiveEnergyForToday(completion: @escaping (Double?) -> Void) {
        let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!

        let query = HKStatisticsQuery(
            quantityType: energyType,
            quantitySamplePredicate: todayPredicate(),
            options: .cumulativeSum
        ) { [weak self] _, statistics, error in
            DispatchQueue.main.async {
                if let sum = statistics?.sumQuantity() {
                    let energy = sum.doubleValue(for: .kilocalorie())
                    self?.cacheValue(energy, for: CacheKeys.activeEnergy)
                    completion(energy)
                } else {
                    let cached = self?.getCachedValue(for: CacheKeys.activeEnergy)
                    completion(cached)
                }
            }
        }

        healthStore.execute(query)
    }

    private func fetchExerciseMinutesForToday(completion: @escaping (Double?) -> Void) {
        let exerciseType = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)!

        let query = HKStatisticsQuery(
            quantityType: exerciseType,
            quantitySamplePredicate: todayPredicate(),
            options: .cumulativeSum
        ) { [weak self] _, statistics, error in
            DispatchQueue.main.async {
                if let sum = statistics?.sumQuantity() {
                    let minutes = sum.doubleValue(for: .minute())
                    self?.cacheValue(minutes, for: CacheKeys.exerciseMinutes)
                    completion(minutes)
                } else {
                    let cached = self?.getCachedValue(for: CacheKeys.exerciseMinutes)
                    completion(cached)
                }
            }
        }

        healthStore.execute(query)
    }

    private func fetchStandHoursForToday(completion: @escaping (Double?) -> Void) {
        let standType = HKQuantityType.quantityType(forIdentifier: .appleStandHour)!

        let query = HKStatisticsQuery(
            quantityType: standType,
            quantitySamplePredicate: todayPredicate(),
            options: .cumulativeSum
        ) { [weak self] _, statistics, error in
            DispatchQueue.main.async {
                if let sum = statistics?.sumQuantity() {
                    let hours = sum.doubleValue(for: .count())
                    self?.cacheValue(hours, for: CacheKeys.standHours)
                    completion(hours)
                } else {
                    let cached = self?.getCachedValue(for: CacheKeys.standHours)
                    completion(cached)
                }
            }
        }

        healthStore.execute(query)
    }

    private func fetchHourlySteps(completion: @escaping ([Double]?) -> Void) {
        let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)

        var interval = DateComponents()
        interval.hour = 1

        let query = HKStatisticsCollectionQuery(
            quantityType: stepsType,
            quantitySamplePredicate: nil,
            options: .cumulativeSum,
            anchorDate: startOfDay,
            intervalComponents: interval
        )

        query.initialResultsHandler = { _, results, error in
            DispatchQueue.main.async {
                guard let results = results else {
                    completion(nil)
                    return
                }

                var hourlySteps: [Double] = []
                let currentHour = calendar.component(.hour, from: now)

                results.enumerateStatistics(from: startOfDay, to: now) { statistics, _ in
                    let steps = statistics.sumQuantity()?.doubleValue(for: .count()) ?? 0
                    hourlySteps.append(steps)
                }

                // Pad with current hour if needed
                while hourlySteps.count <= currentHour {
                    hourlySteps.append(0)
                }

                completion(hourlySteps)
            }
        }

        healthStore.execute(query)
    }

    private func todayPredicate() -> NSPredicate {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        return HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
    }

    private func steadinessStatus(for score: Double) -> String {
        switch score {
        case 80...: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        case 20..<40: return "Poor"
        default: return "Very Low"
        }
    }

    // MARK: - Caching
    private func cacheValue(_ value: Double, for key: String) {
        userDefaults?.set(value, forKey: key)
        userDefaults?.set(Date(), forKey: CacheKeys.lastUpdate)
    }

    private func getCachedValue(for key: String) -> Double? {
        guard let userDefaults = userDefaults else { return nil }

        // Check if cache is still valid (less than 30 minutes old)
        if let lastUpdate = userDefaults.object(forKey: CacheKeys.lastUpdate) as? Date {
            let timeSinceUpdate = Date().timeIntervalSince(lastUpdate)
            if timeSinceUpdate > 30 * 60 { // 30 minutes
                return nil
            }
        }

        let value = userDefaults.double(forKey: key)
        return value > 0 ? value : nil
    }

    private func cacheHealthEntry(_ entry: HealthEntry) {
        guard let userDefaults = userDefaults else { return }

        if let heartRate = entry.heartRate {
            userDefaults.set(heartRate, forKey: CacheKeys.heartRate)
        }
        if let steps = entry.steps {
            userDefaults.set(steps, forKey: CacheKeys.steps)
        }
        if let activeEnergy = entry.activeEnergy {
            userDefaults.set(activeEnergy, forKey: CacheKeys.activeEnergy)
        }
        if let exerciseMinutes = entry.exerciseMinutes {
            userDefaults.set(exerciseMinutes, forKey: CacheKeys.exerciseMinutes)
        }
        if let standHours = entry.standHours {
            userDefaults.set(standHours, forKey: CacheKeys.standHours)
        }
        if let walkingSteadiness = entry.walkingSteadiness {
            userDefaults.set(walkingSteadiness, forKey: CacheKeys.walkingSteadiness)
        }

        userDefaults.set(Date(), forKey: CacheKeys.lastUpdate)
    }

    func getCachedHealthEntry() -> HealthEntry? {
        guard let userDefaults = userDefaults else { return nil }

        // Check if cache is still valid
        if let lastUpdate = userDefaults.object(forKey: CacheKeys.lastUpdate) as? Date {
            let timeSinceUpdate = Date().timeIntervalSince(lastUpdate)
            if timeSinceUpdate > 30 * 60 { // 30 minutes
                return nil
            }
        } else {
            return nil
        }

        return HealthEntry(
            date: Date(),
            heartRate: getCachedValue(for: CacheKeys.heartRate),
            steps: getCachedValue(for: CacheKeys.steps),
            activeEnergy: getCachedValue(for: CacheKeys.activeEnergy),
            exerciseMinutes: getCachedValue(for: CacheKeys.exerciseMinutes),
            standHours: getCachedValue(for: CacheKeys.standHours),
            walkingSteadiness: getCachedValue(for: CacheKeys.walkingSteadiness),
            steadinessStatus: steadinessStatus(for: getCachedValue(for: CacheKeys.walkingSteadiness) ?? 0),
            isConnected: true
        )
    }

    // MARK: - Widget Updates
    func refreshAllWidgets() {
        WidgetCenter.shared.reloadAllTimelines()
    }

    func refreshWidget(kind: String) {
        WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
}

// MARK: - Widget Configuration
struct WidgetConfiguration {
    let refreshInterval: TimeInterval
    let showTrends: Bool
    let compactMode: Bool
    let primaryMetric: PrimaryMetric

    enum PrimaryMetric: String, CaseIterable {
        case heartRate = "heart_rate"
        case steps = "steps"
        case activity = "activity"
        case walkingSteadiness = "walking_steadiness"

        var displayName: String {
            switch self {
            case .heartRate: return "Heart Rate"
            case .steps: return "Steps"
            case .activity: return "Activity"
            case .walkingSteadiness: return "Walking Steadiness"
            }
        }

        var icon: String {
            switch self {
            case .heartRate: return "heart.fill"
            case .steps: return "figure.walk"
            case .activity: return "flame.fill"
            case .walkingSteadiness: return "figure.walk.motion"
            }
        }
    }

    static let `default` = WidgetConfiguration(
        refreshInterval: 300, // 5 minutes
        showTrends: true,
        compactMode: false,
        primaryMetric: .heartRate
    )
}

// MARK: - Widget Preferences
class WidgetPreferences: ObservableObject {
    static let shared = WidgetPreferences()

    private let userDefaults = UserDefaults(suiteName: "group.dev.andernet.VitalSense.shared")

    @Published var configuration: WidgetConfiguration {
        didSet {
            saveConfiguration()
        }
    }

    private init() {
        self.configuration = WidgetPreferences.loadConfiguration()
    }

    private static func loadConfiguration() -> WidgetConfiguration {
        guard let userDefaults = UserDefaults(suiteName: "group.dev.andernet.VitalSense.shared") else {
            return .default
        }

        let refreshInterval = userDefaults.double(forKey: "refresh_interval")
        let showTrends = userDefaults.bool(forKey: "show_trends")
        let compactMode = userDefaults.bool(forKey: "compact_mode")
        let primaryMetricRaw = userDefaults.string(forKey: "primary_metric") ?? "heart_rate"
        let primaryMetric = WidgetConfiguration.PrimaryMetric(rawValue: primaryMetricRaw) ?? .heartRate

        return WidgetConfiguration(
            refreshInterval: refreshInterval > 0 ? refreshInterval : 300,
            showTrends: showTrends,
            compactMode: compactMode,
            primaryMetric: primaryMetric
        )
    }

    private func saveConfiguration() {
        guard let userDefaults = userDefaults else { return }

        userDefaults.set(configuration.refreshInterval, forKey: "refresh_interval")
        userDefaults.set(configuration.showTrends, forKey: "show_trends")
        userDefaults.set(configuration.compactMode, forKey: "compact_mode")
        userDefaults.set(configuration.primaryMetric.rawValue, forKey: "primary_metric")
    }

    // MARK: - Connection Status

    /// Get current connection status for widgets
    func getConnectionStatus() -> ConnectionStatus {
        // Check HealthKit authorization
        guard HKHealthStore.isHealthDataAvailable() else {
            return .noHealthData
        }

        // Check if we have recent data (within last 4 hours)
        guard let lastUpdate = getCachedDate(for: CacheKeys.lastUpdate) else {
            return .disconnected
        }

        let fourHoursAgo = Date().addingTimeInterval(-4 * 60 * 60)
        if lastUpdate < fourHoursAgo {
            return .stale
        }

        return .connected
    }

    private func getCachedDate(for key: String) -> Date? {
        return userDefaults?.object(forKey: key) as? Date
    }

    // MARK: - Trend Calculations

    /// Calculate heart rate trend based on recent data
    func calculateHeartRateTrend() -> HealthTrend {
        // Get current and previous heart rate values
        let current = getCachedValue(for: CacheKeys.heartRate) ?? 0
        let previous = getCachedValue(for: "previous_heart_rate") ?? current

        let difference = current - previous

        if difference > 5 {
            return .increasing
        } else if difference < -5 {
            return .decreasing
        } else {
            return .stable
        }
    }

    /// Cache previous value for trend calculation
    func cachePreviousHeartRate(_ value: Double) {
        userDefaults?.set(value, forKey: "previous_heart_rate")
    }
}

// MARK: - Widget Intent Configuration
import Intents

@available(iOS 14.0, *)
class WidgetConfigurationIntent: INIntent {
    @NSManaged public var primaryMetric: String?
    @NSManaged public var showTrends: NSNumber?
    @NSManaged public var refreshInterval: NSNumber?
}
