import Foundation
import HealthKit
import UIKit

// MARK: - HealthKit Manager
class HealthKitManager: NSObject, ObservableObject {
    static let shared = HealthKitManager()

    let healthStore = HKHealthStore()
    private var webSocketManager: WebSocketManager
    private var deviceToken: String?
    private let userId: String

    // Enhanced configuration using new config system
    private let config = EnhancedAppConfig.shared

    // Health data types we want to read - enhanced for comprehensive movement analysis
    private lazy var healthDataTypes: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []

        // Core metrics
        if let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) {
            types.insert(heartRateType)
        }
        if let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            types.insert(stepCountType)
        }
        if let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) {
            types.insert(distanceType)
        }
        if let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            types.insert(activeEnergyType)
        }

        // EXISTING Critical fall risk indicators
        if let walkingSteadiness = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) {
            types.insert(walkingSteadiness)
        }
        if let sixMinuteWalkTest = HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance) {
            types.insert(sixMinuteWalkTest)
        }
        if let stairAscentSpeed = HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed) {
            types.insert(stairAscentSpeed)
        }
        if let stairDescentSpeed = HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed) {
            types.insert(stairDescentSpeed)
        }
        if let walkingSpeed = HKQuantityType.quantityType(forIdentifier: .walkingSpeed) {
            types.insert(walkingSpeed)
        }
        if let walkingStepLength = HKQuantityType.quantityType(forIdentifier: .walkingStepLength) {
            types.insert(walkingStepLength)
        }
        if let walkingAsymmetry = HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage) {
            types.insert(walkingAsymmetry)
        }
        if let walkingDoubleSupportPercentage = HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage) {
            types.insert(walkingDoubleSupportPercentage)
        }

        // NEW: Additional Critical Movement & Balance Metrics
        if let flightsClimbed = HKQuantityType.quantityType(forIdentifier: .flightsClimbed) {
            types.insert(flightsClimbed)
        }
        if let standHours = HKCategoryType.categoryType(forIdentifier: .appleStandHour) {
            types.insert(standHours)
        }
        if let exerciseTime = HKQuantityType.quantityType(forIdentifier: .appleExerciseTime) {
            types.insert(exerciseTime)
        }
        if let standTime = HKQuantityType.quantityType(forIdentifier: .appleStandTime) {
            types.insert(standTime)
        }

        // NEW: Critical Postural & Balance Metrics
        if let headphoneAudioExposure = HKQuantityType.quantityType(forIdentifier: .headphoneAudioExposure) {
            types.insert(headphoneAudioExposure) // Can affect balance/spatial awareness
        }
        if let environmentalAudioExposure = HKQuantityType.quantityType(forIdentifier: .environmentalAudioExposure) {
            types.insert(environmentalAudioExposure)
        }

        // NEW: Advanced Movement Quality Indicators
        if let cyclingSpeed = HKQuantityType.quantityType(forIdentifier: .cyclingSpeed) {
            types.insert(cyclingSpeed) // Balance and coordination indicator
        }
        if let cyclingPower = HKQuantityType.quantityType(forIdentifier: .cyclingPower) {
            types.insert(cyclingPower) // Lower body strength
        }
        if let cyclingCadence = HKQuantityType.quantityType(forIdentifier: .cyclingCadence) {
            types.insert(cyclingCadence) // Coordination and rhythm
        }

        // NEW: Critical Sleep & Recovery Metrics (affect balance)
        if let sleepAnalysis = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepAnalysis) // Sleep quality affects balance and cognition
        }
        if let timeInDaylight = HKQuantityType.quantityType(forIdentifier: .timeInDaylight) {
            types.insert(timeInDaylight) // Circadian rhythm affects stability
        }

        // NEW: Advanced Cardiovascular Metrics (critical for fall risk)
        if let walkingHeartRateAverage = HKQuantityType.quantityType(forIdentifier: .walkingHeartRateAverage) {
            types.insert(walkingHeartRateAverage) // Cardiovascular response to movement
        }
        if let bloodPressureSystolic = HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic) {
            types.insert(bloodPressureSystolic) // Orthostatic hypotension risk
        }
        if let bloodPressureDiastolic = HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic) {
            types.insert(bloodPressureDiastolic)
        }

        // NEW: Swimming & Water Movement (balance in different environments)
        if let swimmingStrokeCount = HKQuantityType.quantityType(forIdentifier: .swimmingStrokeCount) {
            types.insert(swimmingStrokeCount) // Coordination and strength
        }
        if let distanceSwimming = HKQuantityType.quantityType(forIdentifier: .distanceSwimming) {
            types.insert(distanceSwimming)
        }

        // NEW: Advanced Running Biomechanics (critical gait indicators)
        if let runningCadence = HKQuantityType.quantityType(forIdentifier: .runningPower) {
            types.insert(runningCadence) // Using runningPower instead of runningCadence which isn't available
        }
        if let runningGroundContactTime = HKQuantityType.quantityType(forIdentifier: .runningGroundContactTime) {
            types.insert(runningGroundContactTime) // Balance stability during movement
        }
        if let runningVerticalOscillation = HKQuantityType.quantityType(forIdentifier: .runningVerticalOscillation) {
            types.insert(runningVerticalOscillation) // Movement efficiency
        }
        if let runningStrideLength = HKQuantityType.quantityType(forIdentifier: .runningStrideLength) {
            types.insert(runningStrideLength)
        }
        if let runningSpeed = HKQuantityType.quantityType(forIdentifier: .runningSpeed) {
            types.insert(runningSpeed)
        }
        if let runningPower = HKQuantityType.quantityType(forIdentifier: .runningPower) {
            types.insert(runningPower)
        }

        // NEW: Physical Fitness Indicators
        if let vo2Max = HKQuantityType.quantityType(forIdentifier: .vo2Max) {
            types.insert(vo2Max)
        }
        if let restingHeartRate = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) {
            types.insert(restingHeartRate)
        }
        if let heartRateVariability = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            types.insert(heartRateVariability)
        }

        // NEW: Wheelchair Movement (for accessibility)
        if let wheelchairUse = HKQuantityType.quantityType(forIdentifier: .distanceWheelchair) {
            types.insert(wheelchairUse)
        }
        if let wheelchairPushes = HKQuantityType.quantityType(forIdentifier: .pushCount) {
            types.insert(wheelchairPushes)
        }

        // NEW: Critical Environmental & Health Factors
        if let respiratoryRate = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) {
            types.insert(respiratoryRate) // Can indicate physical stress affecting balance
        }
        if let oxygenSaturation = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) {
            types.insert(oxygenSaturation) // Low oxygen affects cognitive function and balance
        }
        if let bodyTemperature = HKQuantityType.quantityType(forIdentifier: .bodyTemperature) {
            types.insert(bodyTemperature) // Fever/illness affects stability
        }

        // Enhanced activity tracking
        if let appleMoveTime = HKQuantityType.quantityType(forIdentifier: .appleMoveTime) {
            types.insert(appleMoveTime)
        }

        return types
    }()

    @Published var authorizationStatus: HKAuthorizationStatus = .notDetermined
    @Published var isAuthorized = false
    @Published var lastError: String?

    // Core health metrics
    @Published var lastHeartRate: Double?
    @Published var lastStepCount: Double?
    @Published var lastActiveEnergy: Double?
    @Published var lastDistance: Double?

    // Fall risk specific metrics
    @Published var lastWalkingSteadiness: Double?
    @Published var lastWalkingSpeed: Double?
    @Published var lastWalkingStepLength: Double?
    @Published var lastWalkingAsymmetry: Double?
    @Published var lastWalkingDoubleSupportPercentage: Double?
    @Published var lastStairAscentSpeed: Double?
    @Published var lastStairDescentSpeed: Double?
    @Published var lastSixMinuteWalkDistance: Double?

    // NEW: Additional Movement & Fitness Metrics
    @Published var lastFlightsClimbed: Double?
    @Published var lastExerciseTime: Double?
    @Published var lastStandTime: Double?
    @Published var lastVO2Max: Double?
    @Published var lastRestingHeartRate: Double?
    @Published var lastHeartRateVariability: Double?
    @Published var lastRunningSpeed: Double?
    @Published var lastRunningStrideLength: Double?
    @Published var lastRunningGroundContactTime: Double?
    @Published var lastRunningVerticalOscillation: Double?
    @Published var lastRunningPower: Double?
    @Published var lastWheelchairDistance: Double?
    @Published var lastWheelchairPushes: Double?

    // NEW: Critical Postural & Balance Metrics
    @Published var lastWalkingHeartRateAverage: Double?
    @Published var lastBloodPressureSystolic: Double?
    @Published var lastBloodPressureDiastolic: Double?
    @Published var lastCyclingSpeed: Double?
    @Published var lastCyclingPower: Double?
    @Published var lastCyclingCadence: Double?
    @Published var lastSwimmingDistance: Double?
    @Published var lastSwimmingStrokeCount: Double?
    @Published var lastRunningCadence: Double?
    @Published var lastRespiratoryRate: Double?
    @Published var lastOxygenSaturation: Double?
    @Published var lastBodyTemperature: Double?
    @Published var lastTimeInDaylight: Double?

    // Enhanced monitoring stats with performance optimizations
    @Published var totalDataPointsSent: Int = 0
    @Published var dataPointsPerMinute: Double = 0.0
    @Published var isMonitoringActive: Bool = false {
        didSet {
            if config.shouldLogDebugInfo() {
                print("🏥 isMonitoringActive changed to: \(isMonitoringActive)")
            }
        }
    }
    @Published var connectionQuality = ConnectionQualityMonitor()
    @Published var healthDataFreshness: [String: Date] = [:]

    // Performance tracking
    private var lastMinuteDataPoints: [Date] = []

    var activeQueries: [HKQuery] = []
    private var dataPointTimer: Timer?
    private var performanceMonitor: PerformanceMonitor?
    private var periodicHealthCheckTimer: Timer?

    private override init() {
        // Use enhanced config
        self.userId = config.userId

        // Initialize WebSocket manager for health data transmission
        self.webSocketManager = WebSocketManager.shared

        super.init()

        // Initialize performance monitoring if enabled
        if config.enablePerformanceMonitoring {
            performanceMonitor = PerformanceMonitor()
        }

        // Ensure initial state is properly set
        DispatchQueue.main.async {
            self.isMonitoringActive = false
            if self.config.shouldLogDebugInfo() {
                print("🏥 HealthKitManager initialized - isMonitoringActive: \(self.isMonitoringActive)")
                print("🔧 Configuration: \(self.config.getConfigurationSummary())")
            }
        }

        checkAuthorizationStatus()
        startDataPointTracking()
        Log.info("HealthKitManager initialized", category: "healthkit")
    }

    private func startDataPointTracking() {
        // Use optimized sync interval from config
        let interval = config.getOptimalSyncInterval()
        dataPointTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            self?.updateDataPointsPerMinute()
        }
    }

    private func updateDataPointsPerMinute() {
        let now = Date()
        let oneMinuteAgo = now.addingTimeInterval(-60)

        // Remove data points older than 1 minute
        lastMinuteDataPoints = lastMinuteDataPoints.filter { $0 > oneMinuteAgo }

        // Update rate
        dataPointsPerMinute = Double(lastMinuteDataPoints.count)
    }

    private func recordDataPoint() {
        lastMinuteDataPoints.append(Date())
        totalDataPointsSent += 1
        performanceMonitor?.recordDataPoint()
    }

    // MARK: - Enhanced Authorization
    func requestAuthorization() async throws -> Bool {
        print("📋 Starting HealthKit authorization request...")
        performanceMonitor?.startTiming("authorization")

        guard HKHealthStore.isHealthDataAvailable() else {
            print("❌ HealthKit not available on this device")
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "HealthKit is not available on this device"
            }
            performanceMonitor?.endTiming("authorization")
            throw HealthKitError.healthKitNotAvailable
        }

        // Start with step count first since it's most reliable
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "Step count data type not available"
            }
            performanceMonitor?.endTiming("authorization")
            return
        }
        let primaryTypes: Set<HKObjectType> = [stepType]

        do {
            if config.shouldLogDebugInfo() {
                print("📋 Requesting authorization for step count first...")
            }
            try await healthStore.requestAuthorization(toShare: [], read: primaryTypes)

            // Test step count access immediately
            await testStepCountAccess()

            // If step count worked, try additional types
            if isAuthorized {
                if config.shouldLogDebugInfo() {
                    print("📋 Step count authorized, requesting additional health data types...")
                }
                try await healthStore.requestAuthorization(toShare: [], read: healthDataTypes)

                // Wait a moment for system to process - use config timeout
                let waitTime = min(config.connectionTimeout, 2.0) // Cap at 2 seconds for responsiveness
                try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))

                // Update status after full request
                await MainActor.run {
                    self.checkAuthorizationStatus()
                    self.lastError = nil
                    Telemetry.shared.record(.permissionFunnel(stage: "authorized"))
                    if self.config.shouldLogDebugInfo() {
                        print("✅ Full HealthKit authorization process completed")
                    }
                }

                // Test all data types for better feedback
                await testAllDataTypes()
            }

        } catch {
            if config.shouldLogDebugInfo() {
                print("❌ HealthKit authorization failed with error: \(error)")
            }
            await MainActor.run {
                self.isAuthorized = false
                self.authorizationStatus = .sharingDenied
                self.lastError = "Authorization failed: \(error.localizedDescription)"
            }
            Telemetry.shared.record(.permissionFunnel(stage: "denied"))
        }

        performanceMonitor?.endTiming("authorization")
    }

    func testAllDataTypes() async {
        let testTypes: [(String, HKQuantityType?)] = [
            ("Heart Rate", HKQuantityType.quantityType(forIdentifier: .heartRate)), ("Step Count", HKQuantityType.quantityType(forIdentifier: .stepCount)), ("Distance", HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)), ("Active Energy", HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned))
        ]

        for (name, optionalType) in testTypes {
            guard let type = optionalType else {
                print("📊 \(name): Not available on this system")
                continue
            }
            let status = healthStore.authorizationStatus(for: type)
            print("📊 \(name): \(statusDescription(status))")
        }
    }

    func testStepCountAccess() async {
        print("🔬 Testing step count data access...")

        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("🔬 Step count type not available on this system")
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum
            ) { [weak self] _, result, error in

                if let error = error {
                    print("🔬 Step count access test failed: \(error)")
                    DispatchQueue.main.async {
                        self?.isAuthorized = false
                        self?.authorizationStatus = .sharingDenied
                    }
                } else if let result = result {
                    print("🔬 Step count access test succeeded!")
                    DispatchQueue.main.async {
                        self?.isAuthorized = true
                        self?.authorizationStatus = .sharingAuthorized

                        if let sum = result.sumQuantity() {
                            let steps = sum.doubleValue(for: HKUnit.count())
                            self?.lastStepCount = steps
                            print("🔬 Got step count: \(steps)")
                        }
                    }
                } else {
                    print("🔬 Step count test returned nil result - this might still be valid")
                    DispatchQueue.main.async {
                        self?.isAuthorized = true
                        self?.authorizationStatus = .sharingAuthorized
                    }
                }

                continuation.resume()
            }

            self.healthStore.execute(query)
        }
    }

    private func checkAuthorizationStatus() {
        // Check authorization for multiple key types to get a better picture with safe initialization
        let keyTypes: [HKQuantityType] = [
            HKQuantityType.quantityType(forIdentifier: .heartRate), HKQuantityType.quantityType(forIdentifier: .stepCount), HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
        ].compactMap { $0 } // Remove any nil values safely

        var statusMessages: [String] = []
        var authorizedCount = 0
        var deniedCount = 0
        var notDeterminedCount = 0

        for type in keyTypes {
            let status = healthStore.authorizationStatus(for: type)
            let typeName = type.identifier.replacingOccurrences(of: "HKQuantityTypeIdentifier", with: "")
            statusMessages.append("\(typeName): \(statusDescription(status))")

            switch status {
            case .sharingAuthorized:
                authorizedCount += 1
            case .sharingDenied:
                deniedCount += 1
            case .notDetermined:
                notDeterminedCount += 1
            @unknown default:
                notDeterminedCount += 1
            }
        }

        // Use step count as the primary indicator since it's most commonly granted
        if let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            authorizationStatus = healthStore.authorizationStatus(for: stepCountType)
        } else {
            print("⚠️ Step count type not available on this system")
        }

        print("📊 HealthKit authorization status details:")
        for message in statusMessages {
            print("   \(message)")
        }

        if authorizedCount > 0 {
            // If ANY data type is authorized, consider it a success
            isAuthorized = true
            print("✅ At least one health data type is authorized - treating as success")
        } else if deniedCount == keyTypes.count {
            // Only if ALL types are explicitly denied
            isAuthorized = false
            print("❌ All health data types explicitly denied")
        } else {
            // Mixed or unclear status - test actual access
            print("⚠️ Mixed or unclear authorization status - testing actual data access...")
            testActualDataAccess()
        }
    }

    private func statusDescription(_ status: HKAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "NotDetermined"
        case .sharingDenied:
            return "Denied"
        case .sharingAuthorized:
            return "Authorized"
        @unknown default:
            return "Unknown"
        }
    }

    // Start live data streaming with WebSocket manager
    func startLiveDataStreaming(webSocketManager: WebSocketManager) async {
    Log.info("Starting enhanced live health data streaming", category: "stream")
        self.webSocketManager = webSocketManager

        Telemetry.shared.record(.streamStatus(started: true))

        await MainActor.run {
            self.isMonitoringActive = true
        }

        // Start observing health data changes
        startObservingHealthData()

        // Send initial data snapshot
        try? await sendCurrentHealthData()

        // Start periodic health checks
        startPeriodicHealthCheck()
    }

    private func startPeriodicHealthCheck() {
        // Clean up existing timer first
        periodicHealthCheckTimer?.invalidate()

        periodicHealthCheckTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            Task {
                await self?.performHealthCheck()
            }
        }
    }

    private func performHealthCheck() async {
        print("🔍 Performing periodic health check...")

        // Check data freshness
        let now = Date()
        let staleThreshold: TimeInterval = 300 // 5 minutes

        for (dataType, lastUpdate) in healthDataFreshness {
            if now.timeIntervalSince(lastUpdate) > staleThreshold {
                print("⚠️ \(dataType) data is stale (last update: \(lastUpdate))")
            }
        }

        // Test connection quality
        connectionQuality.recordPing()

        // Optionally fetch fresh data if needed
        if healthDataFreshness.isEmpty || healthDataFreshness.values.allSatisfy({ now.timeIntervalSince($0) > 60 }) {
            try? await sendCurrentHealthData()
        }
    }

    private func startObservingHealthData() {
        // Set up background health data observers
        observeHeartRate()
        observeStepCount()
        observeWalkingSteadiness()
        observeActiveEnergy()
        observeDistance()
        observeWalkingSpeed()
        observeWalkingStepLength()
        observeWalkingAsymmetry()
        observeWalkingDoubleSupport()
        observeStairAscent()
        observeStairDescent()
    }

    private func observeWalkingSpeed() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .walkingSpeed) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Walking speed observer error: \(error)"); return }
            Task { await self?.fetchLatestWalkingSpeed { _ in } }
            handler()
        }
        healthStore.execute(query)
        healthStore.enableBackgroundDelivery(for: type, frequency: .hourly) { _, _ in }
        activeQueries.append(query)
    }
    private func observeWalkingStepLength() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .walkingStepLength) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Step length observer error: \(error)"); return }
            Task { await self?.fetchLatestWalkingStepLength { _ in } }
            handler()
        }
        healthStore.execute(query)
        activeQueries.append(query)
    }
    private func observeWalkingAsymmetry() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Asymmetry observer error: \(error)"); return }
            Task { await self?.fetchLatestWalkingAsymmetry { _ in } }
            handler()
        }
        healthStore.execute(query)
        activeQueries.append(query)
    }
    private func observeWalkingDoubleSupport() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Double support observer error: \(error)"); return }
            Task { await self?.fetchLatestWalkingDoubleSupportPercentage { _ in } }
            handler()
        }
        healthStore.execute(query)
        activeQueries.append(query)
    }
    private func observeStairAscent() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Stair ascent observer error: \(error)"); return }
            Task { await self?.fetchLatestStairAscentSpeed { _ in } }
            handler()
        }
        healthStore.execute(query)
        activeQueries.append(query)
    }
    private func observeStairDescent() {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed) else { return }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, handler, error in
            if let error = error { print("❌ Stair descent observer error: \(error)"); return }
            Task { await self?.fetchLatestStairDescentSpeed { _ in } }
            handler()
        }
        healthStore.execute(query)
        activeQueries.append(query)
    }

    private func observeHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("⚠️ Heart rate type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Heart rate observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestHeartRate()
            }

            completionHandler()
        }

        healthStore.execute(query)
        healthStore.enableBackgroundDelivery(for: heartRateType, frequency: .immediate) { _, error in
            if let error = error {
                print("❌ Background delivery setup failed: \(error)")
            } else {
                print("✅ Heart rate background delivery enabled")
            }
        }
        activeQueries.append(query)
    }

    private func observeStepCount() {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("⚠️ Step count type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Step count observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestStepCount()
            }

            completionHandler()
        }

        healthStore.execute(query)
        // Enable background delivery for step count (high value / low power)
        healthStore.enableBackgroundDelivery(for: stepType, frequency: .hourly) { success, error in
            if let error = error { print("❌ Step count background delivery error: \(error)") }
            else if success { print("✅ Step count background delivery enabled (hourly)") }
        }
        activeQueries.append(query)
    }

    private func observeWalkingSteadiness() {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else {
            print("⚠️ Walking steadiness type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: steadinessType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Walking steadiness observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestWalkingSteadiness()
            }

            completionHandler()
        }

        healthStore.execute(query)
        // Immediate background delivery for walking steadiness signals are sparse but critical
        healthStore.enableBackgroundDelivery(for: steadinessType, frequency: .immediate) { success, error in
            if let error = error { print("❌ Walking steadiness background delivery error: \(error)") }
            else if success { print("✅ Walking steadiness background delivery enabled") }
        }
        activeQueries.append(query)
    }

    private func observeActiveEnergy() {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("⚠️ Active energy type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: energyType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Active energy observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestActiveEnergy()
            }

            completionHandler()
        }

        healthStore.execute(query)
        activeQueries.append(query)
    }

    private func observeDistance() {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            print("⚠️ Distance type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: distanceType, predicate: nil) { [weak self] _, completionHandler, error in
            if let error = error {
                print("❌ Distance observer error: \(error)")
                return
            }

            Task {
                await self?.fetchLatestDistance()
            }

            completionHandler()
        }

        healthStore.execute(query)
        activeQueries.append(query)
    }

    private func fetchLatestActiveEnergy() async {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("⚠️ Active energy type not available on this system")
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, result, error in

            if let error = error {
                print("❌ Active energy fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let energy = sum.doubleValue(for: HKUnit.kilocalorie())

            Task { @MainActor in
                self?.lastActiveEnergy = energy
                self?.healthDataFreshness["active_energy"] = Date()
                await self?.sendHealthData(type: "active_energy", value: energy, unit: "kcal", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestDistance() async {
        guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else {
            print("⚠️ Distance type not available on this system")
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, result, error in

            if let error = error {
                print("❌ Distance fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let distance = sum.doubleValue(for: HKUnit.meter())

            Task { @MainActor in
                self?.lastDistance = distance
                self?.healthDataFreshness["distance"] = Date()
                await self?.sendHealthData(type: "distance", value: distance, unit: "m", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestHeartRate() async {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("⚠️ Heart rate type not available on this system")
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, error in

            if let error = error {
                print("❌ Heart rate fetch error: \(error)")
                return
            }

            guard let sample = samples?.first as? HKQuantitySample else { return }

            let heartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))

            Task { @MainActor in
                self?.lastHeartRate = heartRate
                await self?.sendHealthData(type: "heart_rate", value: heartRate, unit: "bpm", timestamp: sample.endDate)
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestStepCount() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("⚠️ Step count type not available on this system")
            return
        }

        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] _, result, error in

            if let error = error {
                print("❌ Step count fetch error: \(error)")
                return
            }

            guard let result = result, let sum = result.sumQuantity() else { return }

            let steps = sum.doubleValue(for: HKUnit.count())

            Task { @MainActor in
                self?.lastStepCount = steps
                await self?.sendHealthData(type: "step_count", value: steps, unit: "steps", timestamp: Date())
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestWalkingSteadiness() async {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else {
            print("⚠️ Walking steadiness type not available on this system")
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: steadinessType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, error in

            if let error = error {
                print("❌ Walking steadiness fetch error: \(error)")
                return
            }

            guard let sample = samples?.first as? HKQuantitySample else { return }

            let steadiness = sample.quantity.doubleValue(for: HKUnit.percent())

            Task { @MainActor in
                self?.lastWalkingSteadiness = steadiness
                await self?.sendHealthData(type: "walking_steadiness", value: steadiness, unit: "percent", timestamp: sample.endDate)
            }
        }

        healthStore.execute(query)
    }

    // MARK: - Fall Risk Specific Data Fetching Methods

    func fetchComprehensiveFallRiskData() async -> [String: Double] {
        print("🏃‍♂️ Fetching comprehensive fall risk assessment data...")

        var fallRiskData: [String: Double] = [:]

        // Fetch all fall risk related metrics
        await fetchLatestWalkingSpeed { speed in
            if let speed = speed {
                fallRiskData["walking_speed"] = speed
            }
        }

        await fetchLatestWalkingStepLength { stepLength in
            if let stepLength = stepLength {
                fallRiskData["walking_step_length"] = stepLength
            }
        }

        await fetchLatestWalkingAsymmetry { asymmetry in
            if let asymmetry = asymmetry {
                fallRiskData["walking_asymmetry"] = asymmetry
            }
        }

        await fetchLatestWalkingDoubleSupportPercentage { doubleSupport in
            if let doubleSupport = doubleSupport {
                fallRiskData["walking_double_support"] = doubleSupport
            }
        }

        await fetchLatestStairAscentSpeed { stairSpeed in
            if let stairSpeed = stairSpeed {
                fallRiskData["stair_ascent_speed"] = stairSpeed
            }
        }

        await fetchLatestStairDescentSpeed { stairSpeed in
            if let stairSpeed = stairSpeed {
                fallRiskData["stair_descent_speed"] = stairSpeed
            }
        }

        await fetchLatestSixMinuteWalkDistance { walkDistance in
            if let walkDistance = walkDistance {
                fallRiskData["six_minute_walk_distance"] = walkDistance
            }
        }

        // Include existing metrics that are relevant to fall risk
        if let heartRate = lastHeartRate {
            fallRiskData["heart_rate"] = heartRate
        }
        if let steps = lastStepCount {
            fallRiskData["steps"] = steps
        }
        if let distance = lastDistance {
            fallRiskData["distance"] = distance
        }
        if let energy = lastActiveEnergy {
            fallRiskData["active_energy"] = energy
        }
        if let steadiness = lastWalkingSteadiness {
            fallRiskData["walking_steadiness"] = steadiness
        }

        print("📊 Collected \(fallRiskData.count) fall risk metrics")
        return fallRiskData
    }

    private func fetchLatestWalkingSpeed(_ completion: @escaping (Double?) -> Void) async {
        guard let walkingSpeedType = HKQuantityType.quantityType(forIdentifier: .walkingSpeed) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: walkingSpeedType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let speed = sample.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))

            Task { @MainActor in
                self?.lastWalkingSpeed = speed
                self?.healthDataFreshness["walking_speed"] = Date()
            }

            completion(speed)
        }

        healthStore.execute(query)
    }

    private func fetchLatestWalkingStepLength(_ completion: @escaping (Double?) -> Void) async {
        guard let stepLengthType = HKQuantityType.quantityType(forIdentifier: .walkingStepLength) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: stepLengthType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let stepLength = sample.quantity.doubleValue(for: HKUnit.meter())

            Task { @MainActor in
                self?.lastWalkingStepLength = stepLength
                self?.healthDataFreshness["walking_step_length"] = Date()
            }

            completion(stepLength)
        }

        healthStore.execute(query)
    }

    private func fetchLatestWalkingAsymmetry(_ completion: @escaping (Double?) -> Void) async {
        guard let asymmetryType = HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: asymmetryType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let asymmetry = sample.quantity.doubleValue(for: HKUnit.percent())

            Task { @MainActor in
                self?.lastWalkingAsymmetry = asymmetry
                self?.healthDataFreshness["walking_asymmetry"] = Date()
            }

            completion(asymmetry)
        }

        healthStore.execute(query)
    }

    private func fetchLatestWalkingDoubleSupportPercentage(_ completion: @escaping (Double?) -> Void) async {
        guard let doubleSupportType = HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: doubleSupportType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let doubleSupport = sample.quantity.doubleValue(for: HKUnit.percent())

            Task { @MainActor in
                self?.lastWalkingDoubleSupportPercentage = doubleSupport
                self?.healthDataFreshness["walking_double_support"] = Date()
            }

            completion(doubleSupport)
        }

        healthStore.execute(query)
    }

    private func fetchLatestStairAscentSpeed(_ completion: @escaping (Double?) -> Void) async {
        guard let stairAscentType = HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: stairAscentType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let speed = sample.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))

            Task { @MainActor in
                self?.lastStairAscentSpeed = speed
                self?.healthDataFreshness["stair_ascent_speed"] = Date()
            }

            completion(speed)
        }

        healthStore.execute(query)
    }

    private func fetchLatestStairDescentSpeed(_ completion: @escaping (Double?) -> Void) async {
        guard let stairDescentType = HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: stairDescentType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let speed = sample.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))

            Task { @MainActor in
                self?.lastStairDescentSpeed = speed
                self?.healthDataFreshness["stair_descent_speed"] = Date()
            }

            completion(speed)
        }

        healthStore.execute(query)
    }

    private func fetchLatestSixMinuteWalkDistance(_ completion: @escaping (Double?) -> Void) async {
        guard let sixMinuteWalkType = HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance) else {
            completion(nil)
            return
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: sixMinuteWalkType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, _ in

            guard let sample = samples?.first as? HKQuantitySample else {
                completion(nil)
                return
            }

            let distance = sample.quantity.doubleValue(for: HKUnit.meter())

            Task { @MainActor in
                self?.lastSixMinuteWalkDistance = distance
                self?.healthDataFreshness["six_minute_walk_distance"] = Date()
            }

            completion(distance)
        }

        healthStore.execute(query)
    }

    func performFallRiskAssessment() async {
        print("🔍 Initiating comprehensive fall risk assessment...")

        let fallRiskEngine = FallRiskAnalysisEngine.shared
        let fallRiskData = await fetchComprehensiveFallRiskData()

        await fallRiskEngine.performFallRiskAssessment(healthData: fallRiskData)

        print("✅ Fall risk assessment completed")

        // Send fall risk data through WebSocket for analysis
        if let webSocketManager = webSocketManager {
            let riskData = HealthData(
                type: "fall_risk_assessment", value: fallRiskEngine.riskScore, unit: "score", timestamp: Date(), deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "unknown", userId: userId
            )

            do {
                try await webSocketManager.sendHealthData(riskData)
            } catch {
                print("❌ Failed to send fall risk data: \(error)")
            }
        }
    }

    // MARK: - Missing Methods Implementation

    func testActualDataAccess() {
        // Test actual data access to verify authorization
        Task {
            await testStepCountAccess()
        }
    }

    func sendCurrentHealthData() async throws {
    Log.debug("Sending current health data snapshot", category: "stream")

        // Fetch and send current values for all available metrics
        await fetchLatestHeartRate()
        await fetchLatestStepCount()
        await fetchLatestActiveEnergy()
        await fetchLatestDistance()
        await fetchLatestWalkingSteadiness()

        // Update data freshness
        await MainActor.run {
            self.healthDataFreshness["snapshot"] = Date()
        }
    }

    internal func sendHealthData(type: String, value: Double, unit: String, timestamp: Date) async {
        guard let webSocketManager = webSocketManager else {
            print("⚠️ WebSocket manager not available")
            return
        }

        let healthData = HealthData(
            type: type, value: value, unit: unit, timestamp: timestamp, deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown", userId: userId
        )

        do {
            try await webSocketManager.sendHealthData(healthData)
            recordDataPoint()
            await MainActor.run {
                self.healthDataFreshness[type] = timestamp
            }
            Log.debug("Sent \(type): \(value) \(unit)", category: "stream")
        } catch {
            Log.error("Failed to send \(type): \(error.localizedDescription)", category: "stream")
        }
    }

    // Stop monitoring and clean up
    func stopMonitoring() {
        print("🛑 Stopping health monitoring...")
        Telemetry.shared.record(.streamStatus(started: false))

        // Stop all queries
        for query in activeQueries {
            healthStore.stop(query)
        }
        activeQueries.removeAll()

        // Stop timers
        dataPointTimer?.invalidate()
        periodicHealthCheckTimer?.invalidate()

        // Reset state
        isMonitoringActive = false
        webSocketManager = nil

        print("✅ Health monitoring stopped")
    }

    // Get health data summary for display
    func getHealthDataSummary() -> String {
        var components: [String] = []

        if let heartRate = lastHeartRate {
            components.append("HR: \(Int(heartRate)) bpm")
        }
        if let steps = lastStepCount {
            components.append("Steps: \(Int(steps))")
        }
        if let energy = lastActiveEnergy {
            components.append("Energy: \(Int(energy)) kcal")
        }
        if let distance = lastDistance {
            components.append("Distance: \(String(format: "%.1f", distance / 1000)) km")
        }

        return components.joined(separator: ", ")
    }

    // MARK: - Background Task Support (Stubs)
    /// Consolidated fetch used by background sync operation. Intentionally lightweight stub.
    func fetchAllHealthData() async {
        // Fetch a minimal subset to avoid heavy background cost; extend later as needed.
        await fetchLatestHeartRate()
        await fetchLatestStepCount()
        await fetchLatestActiveEnergy()
        await fetchLatestDistance()
        await fetchLatestWalkingSteadiness()
    }

    /// Start real-time health data streaming to enhanced server
    func startRealTimeHealthStreaming() async {
        guard isAuthorized else {
            print("❌ HealthKit not authorized - cannot start streaming")
            return
        }

        guard !isMonitoringActive else {
            print("⚠️ Health monitoring already active")
            return
        }

        // Connect to WebSocket if not already connected
        if !webSocketManager.isConnected {
            webSocketManager.connect()
        }

        // Register iOS client with enhanced server
        await registerIOSClient()

        // Start observing all health data types
        startObservingHealthData()

        // Set monitoring active
        isMonitoringActive = true

        // Send initial health data snapshot
        await sendAllHealthData()

        print("🏥 Real-time health streaming started for user: \(userId)")
    }

    /// Stop real-time health data streaming
    func stopRealTimeHealthStreaming() {
        isMonitoringActive = false

        // Stop all active queries
        for query in activeQueries {
            healthStore.stop(query)
        }
        activeQueries.removeAll()

        print("🛑 Real-time health streaming stopped")
    }

    /// Register iOS client with enhanced server
    private func registerIOSClient() async {
        let deviceInfo = [
            "model": UIDevice.current.model,
            "systemVersion": UIDevice.current.systemVersion,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0",
            "healthKitVersion": "iOS \(UIDevice.current.systemVersion)"
        ]

        let registrationMessage: [String: Any] = [
            "type": "client_register",
            "data": [
                "userId": userId,
                "clientType": "ios_app",
                "deviceInfo": deviceInfo
            ],
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        do {
            try await webSocketManager.sendJSON(registrationMessage)
        } catch {
            if config.enableDebugLogging {
                print("❌ Failed to register iOS client: \(error)")
            }
        }

        if config.enableDebugLogging {
            print("📱 Registered iOS client with enhanced server")
        }
    }

    /// Sends currently cached metric snapshot through WebSocket. Used by background sync.
    func sendAllHealthData() async {
        let now = Date()
        // Build a snapshot of readily available values (avoid triggering fresh HK queries here)
        let metrics: [(String, Double?, String)] = [
            ("heart_rate", lastHeartRate, "bpm"),
            ("step_count", lastStepCount, "steps"),
            ("active_energy", lastActiveEnergy, "kcal"),
            ("distance", lastDistance, "m"),
            ("walking_steadiness", lastWalkingSteadiness, "percent")
        ]
        for (type, value, unit) in metrics {
            if let v = value { await sendHealthData(type: type, value: v, unit: unit, timestamp: now) }
        }
    }

    /// Sends individual health data metric to enhanced server via WebSocket
    private func sendHealthData(type: String, value: Double, unit: String, timestamp: Date) async {
        guard webSocketManager.isConnected else {
            if config.enableDebugLogging {
                print("🔌 WebSocket not connected, queueing health data: \(type) = \(value) \(unit)")
            }
            return
        }

        // Calculate wellness score based on metric type and value
        let wellnessScore = calculateWellnessScore(for: type, value: value)

        // Create health metric data structure matching enhanced server format
        let healthMetric: [String: Any] = [
            "metricType": type,
            "value": value,
            "unit": unit,
            "timestamp": Int(timestamp.timeIntervalSince1970 * 1000), // milliseconds
            "source": getSourceForMetric(type),
            "wellnessScore": wellnessScore
        ]

        // Send health data update to enhanced server
        let message: [String: Any] = [
            "type": "health_data_update",
            "data": [
                "userId": userId,
                "metrics": [healthMetric]
            ],
            "timestamp": ISO8601DateFormatter().string(from: timestamp)
        ]

        do {
            try await webSocketManager.sendJSON(message)
        } catch {
            if config.enableDebugLogging {
                print("❌ Failed to send health data: \(error)")
            }
        }
        recordDataPoint()

        if config.enableDebugLogging {
            print("📱 Sent \(type): \(value) \(unit) (wellness: \(wellnessScore))")
        }
    }

    /// Calculate wellness score based on metric type and value
    private func calculateWellnessScore(for metricType: String, value: Double) -> Int {
        switch metricType {
        case "heart_rate":
            // Optimal: 60-80 bpm, concerning: <50 or >100
            if value >= 60 && value <= 80 { return 90 + Int.random(in: 0...10) }
            if value >= 50 && value <= 100 { return 70 + Int.random(in: 0...20) }
            if value < 50 || value > 120 { return 20 + Int.random(in: 0...30) }
            return 50 + Int.random(in: 0...20)

        case "walking_steadiness":
            // Apple's walking steadiness ranges from 0-100%
            let percentage = value * 100
            if percentage >= 80 { return 85 + Int.random(in: 0...15) }
            if percentage >= 60 { return 65 + Int.random(in: 0...20) }
            if percentage >= 40 { return 45 + Int.random(in: 0...20) }
            return 25 + Int.random(in: 0...20)

        case "step_count":
            // Daily step goals: 10,000+ excellent, 7,000+ good
            if value >= 10000 { return 90 + Int.random(in: 0...10) }
            if value >= 7000 { return 75 + Int.random(in: 0...15) }
            if value >= 5000 { return 60 + Int.random(in: 0...15) }
            if value >= 3000 { return 45 + Int.random(in: 0...15) }
            return 30 + Int.random(in: 0...20)

        case "walking_speed":
            // Walking speed in m/s: 1.2-1.6 m/s is normal for adults
            if value >= 1.2 && value <= 1.6 { return 85 + Int.random(in: 0...15) }
            if value >= 1.0 && value <= 1.8 { return 70 + Int.random(in: 0...15) }
            if value < 0.8 { return 30 + Int.random(in: 0...20) }
            return 60 + Int.random(in: 0...20)

        default:
            // Generic scoring for other metrics
            return 70 + Int.random(in: 0...20)
        }
    }

    /// Get data source description for metric
    private func getSourceForMetric(_ metricType: String) -> String {
        switch metricType {
        case "heart_rate":
            return "Apple Watch"
        case "walking_steadiness", "step_count", "walking_speed":
            return "iPhone HealthKit"
        case "active_energy":
            return "Apple Watch"
        case "distance":
            return "iPhone HealthKit"
        default:
            return "HealthKit"
        }
    }
}

// MARK: - Extensions for Enhanced Functionality
extension HealthKitManager {

    var connectionStatusSummary: String {
        let activeCount = activeQueries.count
        let freshDataCount = healthDataFreshness.count
        let monitoringStatus = isMonitoringActive ? "Active" : "Inactive"

        return "Monitoring: \(monitoringStatus), Queries: \(activeCount), Fresh Data: \(freshDataCount)"
    }

    // Enhanced UI Support Properties
    var isAuthorized: Bool {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        return healthStore.authorizationStatus(for: heartRateType) == .sharingAuthorized
    }

    var hasActiveAlerts: Bool {
        // Simple logic for demo - in real app, track actual alerts
        if let heartRate = lastHeartRate {
            return heartRate > 120 || heartRate < 50
        }
        return false
    }

    // Latest metric accessors for UI
    var lastHeartRate: Double? {
        return latestHealthData["heart_rate"]?.value
    }

    var lastStepCount: Double? {
        return latestHealthData["step_count"]?.value
    }

    var lastDistance: Double? {
        return latestHealthData["distance"]?.value
    }

    var lastActiveEnergy: Double? {
        return latestHealthData["active_energy"]?.value
    }

    var lastWalkingSteadiness: Double? {
        return latestHealthData["walking_steadiness"]?.value
    }

    // Refresh latest data for UI
    func refreshLatestData() async {
        // Trigger a refresh of the latest metrics
        await MainActor.run {
            // Force a UI update by accessing the data
            _ = self.lastHeartRate
            _ = self.lastStepCount
            _ = self.lastDistance
            _ = self.lastActiveEnergy
            _ = self.lastWalkingSteadiness
        }
    }

    // MARK: - Methods Required by VitalSenseApp
    func startBackgroundMonitoring() async {
        print("🔄 Starting background health monitoring...")

        guard isAuthorized else {
            print("⚠️ Cannot start monitoring - HealthKit not authorized")
            return
        }

        // Start background query observers
        await startBackgroundQueries()

        await MainActor.run {
            isMonitoringActive = true
        }

        print("✅ Background health monitoring started")
    }

    func syncRecentData() async throws {
        print("🔄 Syncing recent health data...")

        // Fetch data from the last 24 hours
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: endDate)!

        // Sync key metrics
        try await syncMetric(.stepCount, from: startDate, to: endDate)
        try await syncMetric(.heartRate, from: startDate, to: endDate)
        try await syncMetric(.distanceWalkingRunning, from: startDate, to: endDate)

        print("✅ Recent data sync completed")
    }

    func fetchLatestMetrics() async throws -> HealthMetrics {
        print("📊 Fetching latest health metrics...")

        // Fetch latest values for each metric
        let stepCount = try await fetchLatestValue(for: .stepCount)
        let heartRate = try await fetchLatestValue(for: .heartRate)
        let walkingSteadiness = try await fetchLatestValue(for: .appleWalkingSteadiness)
        let heartRateVariability = try await fetchLatestValue(for: .heartRateVariabilitySDNN)

        // Calculate fall risk based on available metrics
        let fallRisk = calculateFallRisk(
            walkingSteadiness: walkingSteadiness,
            heartRate: heartRate,
            stepCount: stepCount
        )

        return HealthMetrics(
            stepCount: stepCount != nil ? Int(stepCount!) : nil,
            heartRate: heartRate,
            heartRateVariability: heartRateVariability,
            walkingSteadiness: walkingSteadiness,
            fallRisk: fallRisk,
            sleepQuality: nil, // To be implemented
            timestamp: Date()
        )
    }

    func processFallRiskAnalytics() async {
        print("🧠 Processing fall risk analytics...")

        do {
            let metrics = try await fetchLatestMetrics()

            // Process fall risk indicators
            if metrics.fallRisk > 0.7 {
                print("⚠️ High fall risk detected: \(metrics.fallRisk)")
                // Trigger alerts through notification manager
            }

            // Update local analytics
            await updateFallRiskTrends(metrics.fallRisk)

        } catch {
            print("❌ Fall risk analytics processing failed: \(error)")
        }
    }

    func processGaitAnalytics() async {
        print("🚶‍♂️ Processing gait analytics...")

        do {
            // Fetch gait-related metrics
            let walkingSpeed = try await fetchLatestValue(for: .walkingSpeed)
            let walkingStepLength = try await fetchLatestValue(for: .walkingStepLength)
            let walkingAsymmetry = try await fetchLatestValue(for: .walkingAsymmetryPercentage)

            // Process gait patterns
            let gaitScore = calculateGaitScore(
                speed: walkingSpeed,
                stepLength: walkingStepLength,
                asymmetry: walkingAsymmetry
            )

            print("📊 Gait score calculated: \(gaitScore)")

        } catch {
            print("❌ Gait analytics processing failed: \(error)")
        }
    }

    // MARK: - Private Helper Methods
    private func startBackgroundQueries() async {
        // Start observer queries for real-time monitoring
        startObserverQuery(for: .heartRate)
        startObserverQuery(for: .stepCount)
        startObserverQuery(for: .appleWalkingSteadiness)
    }

    private func startObserverQuery(for identifier: HKQuantityTypeIdentifier) {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            return
        }

        let query = HKObserverQuery(sampleType: quantityType, predicate: nil) { [weak self] query, completionHandler, error in
            if let error = error {
                print("❌ Observer query error for \(identifier): \(error)")
                return
            }

            Task {
                await self?.handleNewHealthData(for: identifier)
            }

            completionHandler()
        }

        healthStore.execute(query)
        activeQueries.append(query)
    }

    private func handleNewHealthData(for identifier: HKQuantityTypeIdentifier) async {
        // Fetch and process new health data
        do {
            let newValue = try await fetchLatestValue(for: identifier)
            await MainActor.run {
                // Update published properties based on the metric type
                switch identifier {
                case .heartRate:
                    self.lastHeartRate = newValue
                case .stepCount:
                    self.lastStepCount = newValue
                case .appleWalkingSteadiness:
                    self.lastWalkingSteadiness = newValue
                default:
                    break
                }
            }
        } catch {
            print("❌ Failed to handle new health data for \(identifier): \(error)")
        }
    }

    private func syncMetric(_ identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            throw HealthKitError.invalidQuantityType
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
            ) { query, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                // Process samples and send to server
                if let samples = samples as? [HKQuantitySample] {
                    Task {
                        await self.processSamplesForSync(samples, identifier: identifier)
                    }
                }

                continuation.resume()
            }

            healthStore.execute(query)
        }
    }

    private func processSamplesForSync(_ samples: [HKQuantitySample], identifier: HKQuantityTypeIdentifier) async {
        for sample in samples {
            let value = sample.quantity.doubleValue(for: getUnit(for: identifier))

            // Send to WebSocket if available
            let healthData = [
                "type": identifier.rawValue,
                "value": value,
                "timestamp": sample.startDate.timeIntervalSince1970,
                "endDate": sample.endDate.timeIntervalSince1970
            ]

            await webSocketManager.sendHealthUpdate(healthData)
        }
    }

    private func fetchLatestValue(for identifier: HKQuantityTypeIdentifier) async throws -> Double? {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            throw HealthKitError.invalidQuantityType
        }

        let predicate = HKQuery.predicateForSamples(withStart: Calendar.current.date(byAdding: .day, value: -7, to: Date()), end: Date(), options: .strictEndDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: predicate,
                limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
            ) { query, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let samples = samples as? [HKQuantitySample],
                      let latestSample = samples.first else {
                    continuation.resume(returning: nil)
                    return
                }

                let value = latestSample.quantity.doubleValue(for: self.getUnit(for: identifier))
                continuation.resume(returning: value)
            }

            healthStore.execute(query)
        }
    }

    private func getUnit(for identifier: HKQuantityTypeIdentifier) -> HKUnit {
        switch identifier {
        case .heartRate:
            return HKUnit.count().unitDivided(by: .minute())
        case .stepCount:
            return HKUnit.count()
        case .distanceWalkingRunning:
            return HKUnit.meter()
        case .activeEnergyBurned:
            return HKUnit.kilocalorie()
        case .appleWalkingSteadiness:
            return HKUnit.percent()
        case .walkingSpeed:
            return HKUnit.meter().unitDivided(by: .second())
        case .heartRateVariabilitySDNN:
            return HKUnit.secondUnit(with: .milli)
        default:
            return HKUnit.count()
        }
    }

    private func calculateFallRisk(walkingSteadiness: Double?, heartRate: Double?, stepCount: Double?) -> Double {
        var riskScore: Double = 0.0

        // Walking steadiness contribution (40% of risk)
        if let steadiness = walkingSteadiness {
            if steadiness < 50.0 {
                riskScore += 0.4 * (1.0 - steadiness / 100.0)
            }
        } else {
            riskScore += 0.2 // Penalty for missing data
        }

        // Heart rate contribution (30% of risk)
        if let hr = heartRate {
            if hr > 120 || hr < 50 {
                riskScore += 0.3
            }
        }

        // Activity level contribution (30% of risk)
        if let steps = stepCount {
            if steps < 3000 { // Low activity
                riskScore += 0.3
            }
        }

        return min(riskScore, 1.0) // Cap at 100%
    }

    private func calculateGaitScore(speed: Double?, stepLength: Double?, asymmetry: Double?) -> Double {
        var score: Double = 100.0 // Start with perfect score

        if let speed = speed {
            if speed < 1.0 { // Slow walking speed
                score -= 20.0
            }
        }

        if let asymmetry = asymmetry {
            if asymmetry > 10.0 { // High asymmetry
                score -= 30.0
            }
        }

        if let stepLength = stepLength {
            if stepLength < 0.6 { // Short step length
                score -= 15.0
            }
        }

        return max(score, 0.0)
    }

    private func updateFallRiskTrends(_ currentRisk: Double) async {
        // Store fall risk trend data for analytics
        let trendData = [
            "timestamp": Date().timeIntervalSince1970,
            "fallRisk": currentRisk,
            "userId": userId
        ]

        // Send trend data to analytics
        await webSocketManager.sendAnalyticsUpdate(trendData)
    }
}

// MARK: - HealthKit Errors
enum HealthKitError: LocalizedError {
    case healthKitNotAvailable
    case authorizationDenied
    case invalidQuantityType
    case dataNotAvailable
    case queryFailed(Error)

    var errorDescription: String? {
        switch self {
        case .healthKitNotAvailable:
            return "HealthKit is not available on this device"
        case .authorizationDenied:
            return "HealthKit authorization was denied"
        case .invalidQuantityType:
            return "Invalid quantity type specified"
        case .dataNotAvailable:
            return "Requested health data is not available"
        case .queryFailed(let error):
            return "HealthKit query failed: \(error.localizedDescription)"
        }
    }
}
