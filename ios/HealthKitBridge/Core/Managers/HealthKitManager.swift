import Foundation
import HealthKit
import UIKit

// MARK: - Health Data Model
struct HealthData: Codable {
    let type: String
    let value: Double
    let unit: String
    let timestamp: Date
    let deviceId: String
    let userId: String
}

// MARK: - Connection Quality Monitor
class ConnectionQualityMonitor: ObservableObject {
    @Published var signalStrength: Double = 1.0
    @Published var latency: TimeInterval = 0.0
    @Published var packetLoss: Double = 0.0
    @Published var reconnectCount: Int = 0
    
    private var lastPingTime: Date?
    
    func recordPing() {
        lastPingTime = Date()
    }
    
    func recordPong() {
        guard let pingTime = lastPingTime else { return }
        latency = Date().timeIntervalSince(pingTime)
    }
    
    func recordReconnect() {
        reconnectCount += 1
    }
}

// MARK: - HealthKit Manager
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

    // Request HealthKit permissions with enhanced feedback
    func requestAuthorization() async {
        performanceMonitor?.startTiming("authorization")
        
        if config.shouldLogDebugInfo() {
            print("📋 Requesting HealthKit authorization...")
        }

        guard HKHealthStore.isHealthDataAvailable() else {
            if config.shouldLogDebugInfo() {
                print("❌ HealthKit not available on this device")
            }
            await MainActor.run {
                self.isAuthorized = false
                self.lastError = "HealthKit is not available on this device"
            }
            performanceMonitor?.endTiming("authorization")
            return
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
        }
        
        performanceMonitor?.endTiming("authorization")
    }
    
    private func testAllDataTypes() async {
        let testTypes: [(String, HKQuantityType?)] = [
            ("Heart Rate", HKQuantityType.quantityType(forIdentifier: .heartRate)),
            ("Step Count", HKQuantityType.quantityType(forIdentifier: .stepCount)),
            ("Distance", HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)),
            ("Active Energy", HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned))
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
    
    private func testStepCountAccess() async {
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
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] query, result, error in
                
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
            HKQuantityType.quantityType(forIdentifier: .heartRate),
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)
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
        print("📊 Starting enhanced live health data streaming...")
        self.webSocketManager = webSocketManager

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
    }
    
    private func observeHeartRate() {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            print("⚠️ Heart rate type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] query, completionHandler, error in
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
        healthStore.enableBackgroundDelivery(for: heartRateType, frequency: .immediate) { success, error in
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

        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] query, completionHandler, error in
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
        activeQueries.append(query)
    }

    private func observeWalkingSteadiness() {
        guard let steadinessType = HKQuantityType.quantityType(forIdentifier: .appleWalkingSteadiness) else {
            print("⚠️ Walking steadiness type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: steadinessType, predicate: nil) { [weak self] query, completionHandler, error in
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
        activeQueries.append(query)
    }
    
    private func observeActiveEnergy() {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            print("⚠️ Active energy type not available on this system")
            return
        }

        let query = HKObserverQuery(sampleType: energyType, predicate: nil) { [weak self] query, completionHandler, error in
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

        let query = HKObserverQuery(sampleType: distanceType, predicate: nil) { [weak self] query, completionHandler, error in
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

        let query = HKStatisticsQuery(quantityType: energyType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

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

        let query = HKStatisticsQuery(quantityType: distanceType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

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
        let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in

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

        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { [weak self] query, result, error in

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
        let query = HKSampleQuery(sampleType: steadinessType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in

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
        let query = HKSampleQuery(sampleType: walkingSpeedType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: stepLengthType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: asymmetryType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: doubleSupportType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: stairAscentType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: stairDescentType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
        let query = HKSampleQuery(sampleType: sixMinuteWalkType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] query, samples, error in
            
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
                type: "fall_risk_assessment",
                value: fallRiskEngine.riskScore,
                unit: "score",
                timestamp: Date(),
                deviceId: await UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
                userId: userId
            )
            
            do {
                try await webSocketManager.sendHealthData(riskData)
            } catch {
                print("❌ Failed to send fall risk data: \(error)")
            }
        }
    }
    
    // MARK: - Missing Methods Implementation
    
    private func testActualDataAccess() {
        // Test actual data access to verify authorization
        Task {
            await testStepCountAccess()
        }
    }
    
    func sendCurrentHealthData() async throws {
        print("📤 Sending current health data snapshot...")
        
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
            type: type,
            value: value,
            unit: unit,
            timestamp: timestamp,
            deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
            userId: userId
        )
        
        do {
            try await webSocketManager.sendHealthData(healthData)
            recordDataPoint()
            await MainActor.run {
                self.healthDataFreshness[type] = timestamp
            }
            print("✅ Sent \(type): \(value) \(unit)")
        } catch {
            print("❌ Failed to send \(type): \(error)")
        }
    }

    // Stop monitoring and clean up
    func stopMonitoring() {
        print("🛑 Stopping health monitoring...")
        
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
            components.append("Distance: \(String(format: "%.1f", distance/1000)) km")
        }
        
        return components.joined(separator: ", ")
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
}
