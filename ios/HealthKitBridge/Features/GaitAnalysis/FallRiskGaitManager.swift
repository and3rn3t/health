import HealthKit
import Foundation
import SwiftUI
import CoreMotion

// MARK: - Fall Risk & Gait Analysis Manager
class FallRiskGaitManager: ObservableObject {
    static let shared = FallRiskGaitManager()
    
    @Published var currentGaitMetrics: GaitMetrics?
    @Published var fallRiskScore: FallRiskScore?
    @Published var walkingStabilityData: [WalkingStabilityReading] = []
    @Published var balanceAssessment: BalanceAssessment?
    @Published var dailyMobilityTrends: DailyMobilityTrends?
    @Published var isMonitoring = false
    
    private let healthStore = HKHealthStore()
    private let motionManager = CMMotionManager()
    private var gaitObservers: [HKObserverQuery] = []
    
    // Core gait and mobility data types
    private let gaitDataTypes: Set<HKObjectType> = [
        HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!,
        HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)!,
        HKQuantityType.quantityType(forIdentifier: .appleMoveTime)!,
        HKQuantityType.quantityType(forIdentifier: .appleStandTime)!,
        HKQuantityType.quantityType(forIdentifier: .stepCount)!,
        HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
    ]
    
    private init() {
        setupGaitMonitoring()
    }
    
    func requestGaitAuthorization() async {
        do {
            try await healthStore.requestAuthorization(toShare: [], read: gaitDataTypes)
            await fetchGaitMetrics()
            await calculateFallRisk()
        } catch {
            print("❌ Gait authorization failed: \(error)")
        }
    }
    
    // MARK: - Core Gait Data Collection
    func fetchGaitMetrics() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchWalkingSpeed() }
            group.addTask { await self.fetchStepLength() }
            group.addTask { await self.fetchWalkingAsymmetry() }
            group.addTask { await self.fetchDoubleSupportTime() }
            group.addTask { await self.fetchStairSpeeds() }
            group.addTask { await self.fetchDailyMobility() }
            group.addTask { await self.assessBalance() }
        }
        
        await MainActor.run {
            self.compileGaitMetrics()
        }
    }
    
    private func fetchWalkingSpeed() async {
        guard let walkingSpeedType = HKQuantityType.quantityType(forIdentifier: .walkingSpeed) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: walkingSpeedType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { [weak self] query, statistics, error in
                defer { continuation.resume() }
                
                guard let statistics = statistics,
                      let average = statistics.averageQuantity() else { return }
                
                let speedMPS = average.doubleValue(for: HKUnit.meter().unitDivided(by: .second()))
                
                DispatchQueue.main.async {
                    if self?.currentGaitMetrics == nil {
                        self?.currentGaitMetrics = GaitMetrics()
                    }
                    self?.currentGaitMetrics?.averageWalkingSpeed = speedMPS
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchStepLength() async {
        guard let stepLengthType = HKQuantityType.quantityType(forIdentifier: .walkingStepLength) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepLengthType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { [weak self] query, statistics, error in
                defer { continuation.resume() }
                
                guard let statistics = statistics,
                      let average = statistics.averageQuantity() else { return }
                
                let lengthMeters = average.doubleValue(for: HKUnit.meter())
                
                DispatchQueue.main.async {
                    if self?.currentGaitMetrics == nil {
                        self?.currentGaitMetrics = GaitMetrics()
                    }
                    self?.currentGaitMetrics?.averageStepLength = lengthMeters
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchWalkingAsymmetry() async {
        guard let asymmetryType = HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: asymmetryType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { [weak self] query, statistics, error in
                defer { continuation.resume() }
                
                guard let statistics = statistics,
                      let average = statistics.averageQuantity() else { return }
                
                let asymmetryPercent = average.doubleValue(for: HKUnit.percent()) * 100
                
                DispatchQueue.main.async {
                    if self?.currentGaitMetrics == nil {
                        self?.currentGaitMetrics = GaitMetrics()
                    }
                    self?.currentGaitMetrics?.walkingAsymmetry = asymmetryPercent
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchDoubleSupportTime() async {
        guard let doubleSupportType = HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: doubleSupportType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { [weak self] query, statistics, error in
                defer { continuation.resume() }
                
                guard let statistics = statistics,
                      let average = statistics.averageQuantity() else { return }
                
                let doubleSupportPercent = average.doubleValue(for: HKUnit.percent()) * 100
                
                DispatchQueue.main.async {
                    if self?.currentGaitMetrics == nil {
                        self?.currentGaitMetrics = GaitMetrics()
                    }
                    self?.currentGaitMetrics?.doubleSupportTime = doubleSupportPercent
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchStairSpeeds() async {
        await withTaskGroup(of: Void.self) { group in
            // Stair ascent speed
            group.addTask {
                guard let ascentType = HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed) else { return }
                
                let query = HKSampleQuery(
                    sampleType: ascentType,
                    predicate: nil,
                    limit: 10,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
                ) { [weak self] query, samples, error in
                    guard let samples = samples as? [HKQuantitySample],
                          !samples.isEmpty else { return }
                    
                    let speeds = samples.map { $0.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second())) }
                    let averageSpeed = speeds.reduce(0, +) / Double(speeds.count)
                    
                    DispatchQueue.main.async {
                        if self?.currentGaitMetrics == nil {
                            self?.currentGaitMetrics = GaitMetrics()
                        }
                        self?.currentGaitMetrics?.stairAscentSpeed = averageSpeed
                    }
                }
                
                self.healthStore.execute(query)
            }
            
            // Stair descent speed
            group.addTask {
                guard let descentType = HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed) else { return }
                
                let query = HKSampleQuery(
                    sampleType: descentType,
                    predicate: nil,
                    limit: 10,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
                ) { [weak self] query, samples, error in
                    guard let samples = samples as? [HKQuantitySample],
                          !samples.isEmpty else { return }
                    
                    let speeds = samples.map { $0.quantity.doubleValue(for: HKUnit.meter().unitDivided(by: .second())) }
                    let averageSpeed = speeds.reduce(0, +) / Double(speeds.count)
                    
                    DispatchQueue.main.async {
                        if self?.currentGaitMetrics == nil {
                            self?.currentGaitMetrics = GaitMetrics()
                        }
                        self?.currentGaitMetrics?.stairDescentSpeed = averageSpeed
                    }
                }
                
                self.healthStore.execute(query)
            }
        }
    }
    
    private func fetchDailyMobility() async {
        let today = Calendar.current.startOfDay(for: Date())
        let endOfDay = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        let predicate = HKQuery.predicateForSamples(withStart: today, end: endOfDay)
        
        await withTaskGroup(of: Void.self) { group in
            // Step count
            group.addTask {
                guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
                
                let query = HKStatisticsQuery(
                    quantityType: stepType,
                    quantitySamplePredicate: predicate,
                    options: .cumulativeSum
                ) { [weak self] query, statistics, error in
                    guard let statistics = statistics,
                          let sum = statistics.sumQuantity() else { return }
                    
                    let steps = Int(sum.doubleValue(for: .count()))
                    
                    DispatchQueue.main.async {
                        if self?.dailyMobilityTrends == nil {
                            self?.dailyMobilityTrends = DailyMobilityTrends()
                        }
                        self?.dailyMobilityTrends?.stepCount = steps
                    }
                }
                
                self.healthStore.execute(query)
            }
            
            // Walking distance
            group.addTask {
                guard let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning) else { return }
                
                let query = HKStatisticsQuery(
                    quantityType: distanceType,
                    quantitySamplePredicate: predicate,
                    options: .cumulativeSum
                ) { [weak self] query, statistics, error in
                    guard let statistics = statistics,
                          let sum = statistics.sumQuantity() else { return }
                    
                    let distance = sum.doubleValue(for: HKUnit.meter())
                    
                    DispatchQueue.main.async {
                        if self?.dailyMobilityTrends == nil {
                            self?.dailyMobilityTrends = DailyMobilityTrends()
                        }
                        self?.dailyMobilityTrends?.walkingDistance = distance
                    }
                }
                
                self.healthStore.execute(query)
            }
            
            // Stand time (Apple Watch)
            group.addTask {
                guard let standType = HKQuantityType.quantityType(forIdentifier: .appleStandTime) else { return }
                
                let query = HKStatisticsQuery(
                    quantityType: standType,
                    quantitySamplePredicate: predicate,
                    options: .cumulativeSum
                ) { [weak self] query, statistics, error in
                    guard let statistics = statistics,
                          let sum = statistics.sumQuantity() else { return }
                    
                    let standMinutes = sum.doubleValue(for: HKUnit.minute())
                    
                    DispatchQueue.main.async {
                        if self?.dailyMobilityTrends == nil {
                            self?.dailyMobilityTrends = DailyMobilityTrends()
                        }
                        self?.dailyMobilityTrends?.standTime = standMinutes
                    }
                }
                
                self.healthStore.execute(query)
            }
        }
    }
    
    // MARK: - Fall Risk Assessment
    private func calculateFallRisk() async {
        await MainActor.run {
            guard let gait = self.currentGaitMetrics else { return }
            
            var riskFactors: [FallRiskFactor] = []
            var totalScore = 0.0
            
            // Walking speed assessment (slower = higher risk)
            if let speed = gait.averageWalkingSpeed {
                let speedRisk = assessWalkingSpeedRisk(speed)
                riskFactors.append(speedRisk)
                totalScore += speedRisk.score
            }
            
            // Gait asymmetry assessment
            if let asymmetry = gait.walkingAsymmetry {
                let asymmetryRisk = assessGaitAsymmetryRisk(asymmetry)
                riskFactors.append(asymmetryRisk)
                totalScore += asymmetryRisk.score
            }
            
            // Double support time assessment
            if let doubleSupport = gait.doubleSupportTime {
                let supportRisk = assessDoubleSupportRisk(doubleSupport)
                riskFactors.append(supportRisk)
                totalScore += supportRisk.score
            }
            
            // Step length assessment
            if let stepLength = gait.averageStepLength {
                let lengthRisk = assessStepLengthRisk(stepLength)
                riskFactors.append(lengthRisk)
                totalScore += lengthRisk.score
            }
            
            // Stair navigation assessment
            if let ascentSpeed = gait.stairAscentSpeed,
               let descentSpeed = gait.stairDescentSpeed {
                let stairRisk = assessStairNavigationRisk(ascentSpeed, descentSpeed)
                riskFactors.append(stairRisk)
                totalScore += stairRisk.score
            }
            
            let averageScore = riskFactors.isEmpty ? 0 : totalScore / Double(riskFactors.count)
            
            self.fallRiskScore = FallRiskScore(
                overallScore: averageScore,
                riskLevel: FallRiskLevel.fromScore(averageScore),
                riskFactors: riskFactors,
                lastAssessment: Date()
            )
        }
    }
    
    private func assessWalkingSpeedRisk(_ speed: Double) -> FallRiskFactor {
        // Normal walking speed: 1.2-1.4 m/s, Slower speeds indicate higher fall risk
        let riskScore: Double
        let severity: FallRiskSeverity
        
        if speed >= 1.2 {
            riskScore = 1.0
            severity = .low
        } else if speed >= 1.0 {
            riskScore = 2.0
            severity = .moderate
        } else if speed >= 0.8 {
            riskScore = 3.0
            severity = .high
        } else {
            riskScore = 4.0
            severity = .critical
        }
        
        return FallRiskFactor(
            name: "Walking Speed",
            value: speed,
            unit: "m/s",
            score: riskScore,
            severity: severity,
            description: "Average walking speed over 7 days",
            recommendation: speed < 1.0 ? "Consider gait training or physical therapy" : "Maintain current activity level"
        )
    }
    
    private func assessGaitAsymmetryRisk(_ asymmetry: Double) -> FallRiskFactor {
        // Normal asymmetry: < 3%, Higher asymmetry indicates balance issues
        let riskScore: Double
        let severity: FallRiskSeverity
        
        if asymmetry <= 3.0 {
            riskScore = 1.0
            severity = .low
        } else if asymmetry <= 5.0 {
            riskScore = 2.0
            severity = .moderate
        } else if asymmetry <= 8.0 {
            riskScore = 3.0
            severity = .high
        } else {
            riskScore = 4.0
            severity = .critical
        }
        
        return FallRiskFactor(
            name: "Gait Asymmetry",
            value: asymmetry,
            unit: "%",
            score: riskScore,
            severity: severity,
            description: "Difference between left and right step timing",
            recommendation: asymmetry > 5.0 ? "Evaluate for balance disorders or leg strength differences" : "Good gait symmetry"
        )
    }
    
    private func assessDoubleSupportRisk(_ doubleSupport: Double) -> FallRiskFactor {
        // Normal double support: 20-25%, Higher values indicate instability
        let riskScore: Double
        let severity: FallRiskSeverity
        
        if doubleSupport <= 25.0 {
            riskScore = 1.0
            severity = .low
        } else if doubleSupport <= 30.0 {
            riskScore = 2.0
            severity = .moderate
        } else if doubleSupport <= 35.0 {
            riskScore = 3.0
            severity = .high
        } else {
            riskScore = 4.0
            severity = .critical
        }
        
        return FallRiskFactor(
            name: "Double Support Time",
            value: doubleSupport,
            unit: "%",
            score: riskScore,
            severity: severity,
            description: "Time with both feet on ground during walking",
            recommendation: doubleSupport > 30.0 ? "Consider balance training exercises" : "Normal gait stability"
        )
    }
    
    private func assessStepLengthRisk(_ stepLength: Double) -> FallRiskFactor {
        // Normal step length: 0.6-0.8m, Shorter steps indicate caution/instability
        let riskScore: Double
        let severity: FallRiskSeverity
        
        if stepLength >= 0.6 {
            riskScore = 1.0
            severity = .low
        } else if stepLength >= 0.5 {
            riskScore = 2.0
            severity = .moderate
        } else if stepLength >= 0.4 {
            riskScore = 3.0
            severity = .high
        } else {
            riskScore = 4.0
            severity = .critical
        }
        
        return FallRiskFactor(
            name: "Step Length",
            value: stepLength,
            unit: "m",
            score: riskScore,
            severity: severity,
            description: "Average distance covered per step",
            recommendation: stepLength < 0.5 ? "Consider strength training and gait therapy" : "Good step length"
        )
    }
    
    private func assessStairNavigationRisk(_ ascentSpeed: Double, _ descentSpeed: Double) -> FallRiskFactor {
        // Assess combined stair navigation ability
        let avgStairSpeed = (ascentSpeed + descentSpeed) / 2.0
        
        let riskScore: Double
        let severity: FallRiskSeverity
        
        if avgStairSpeed >= 0.5 {
            riskScore = 1.0
            severity = .low
        } else if avgStairSpeed >= 0.3 {
            riskScore = 2.5
            severity = .moderate
        } else if avgStairSpeed >= 0.2 {
            riskScore = 3.5
            severity = .high
        } else {
            riskScore = 4.0
            severity = .critical
        }
        
        return FallRiskFactor(
            name: "Stair Navigation",
            value: avgStairSpeed,
            unit: "m/s",
            score: riskScore,
            severity: severity,
            description: "Speed navigating stairs (up/down)",
            recommendation: avgStairSpeed < 0.3 ? "Practice stair climbing with assistance" : "Good stair navigation ability"
        )
    }
    
    private func assessBalance() async {
        // Analyze recent gait data for balance indicators
        await MainActor.run {
            guard let gait = self.currentGaitMetrics else { return }
            
            var balanceScore = 10.0 // Start with perfect score
            var indicators: [BalanceIndicator] = []
            
            // Reduce score based on risk factors
            if let asymmetry = gait.walkingAsymmetry, asymmetry > 5.0 {
                balanceScore -= 2.0
                indicators.append(BalanceIndicator(type: .asymmetry, severity: .high, description: "Significant gait asymmetry detected"))
            }
            
            if let doubleSupport = gait.doubleSupportTime, doubleSupport > 30.0 {
                balanceScore -= 2.0
                indicators.append(BalanceIndicator(type: .stability, severity: .moderate, description: "Increased double support time"))
            }
            
            if let speed = gait.averageWalkingSpeed, speed < 1.0 {
                balanceScore -= 1.5
                indicators.append(BalanceIndicator(type: .mobility, severity: .moderate, description: "Reduced walking speed"))
            }
            
            balanceScore = max(0, balanceScore)
            
            self.balanceAssessment = BalanceAssessment(
                score: balanceScore,
                maxScore: 10.0,
                indicators: indicators,
                assessmentDate: Date()
            )
        }
    }
    
    private func compileGaitMetrics() {
        if currentGaitMetrics != nil {
            currentGaitMetrics?.lastUpdated = Date()
        }
    }
    
    // MARK: - Real-time Monitoring Setup
    private func setupGaitMonitoring() {
        let criticalGaitTypes = [
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
            HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!
        ]
        
        for type in criticalGaitTypes {
            let observer = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] query, completionHandler, error in
                Task {
                    await self?.fetchGaitMetrics()
                    await self?.calculateFallRisk()
                }
                completionHandler()
            }
            
            gaitObservers.append(observer)
            healthStore.execute(observer)
        }
    }
    
    deinit {
        for observer in gaitObservers {
            healthStore.stop(observer)
        }
    }
    
    // MARK: - Missing Integration Methods
    func startBackgroundMonitoring() async {
        print("🏃‍♂️ Starting background gait monitoring")
        await MainActor.run {
            isMonitoring = true
        }
        
        setupGaitMonitoring()
        await fetchGaitMetrics()
    }
    
    func stopBackgroundMonitoring() {
        print("🛑 Stopping background gait monitoring")
        
        for observer in gaitObservers {
            healthStore.stop(observer)
        }
        gaitObservers.removeAll()
        
        isMonitoring = false
    }
    
    func updateDailyMobilityTrends() async {
        await fetchDailyMobility()
    }
    
    func assessFallRisk() async {
        await calculateFallRisk()
    }
}
