import HealthKit
import Foundation
import SwiftUI

// MARK: - Advanced Health Metrics Manager
class AdvancedHealthMetrics: ObservableObject {
    static let shared = AdvancedHealthMetrics()
    
    @Published var vo2Max: Double?
    @Published var restingHeartRate: Double?
    @Published var heartRateVariability: Double?
    @Published var sleepAnalysis: [HKCategorySample] = []
    @Published var workoutSummary: WorkoutSummary?
    @Published var nutritionData: NutritionData?
    @Published var respiratoryRate: Double?
    @Published var bodyTemperature: Double?
    @Published var bloodPressure: BloodPressureReading?
    @Published var oxygenSaturation: Double?
    @Published var environmentalAudioExposure: Double?
    @Published var menstrualHealthData: MenstrualHealthData?
    @Published var mindfulnessMinutes: Double?
    @Published var healthScore: HealthScore?
    
    private let healthStore = HKHealthStore()
    private var backgroundObservers: [HKObserverQuery] = []
    
    private init() {
        setupBackgroundObservers()
    }
    
    // MARK: - Advanced Health Data Types
    private let advancedReadTypes: Set<HKObjectType> = [
        HKQuantityType.quantityType(forIdentifier: .vo2Max)!,
        HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
        HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
        HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!,
        HKQuantityType.quantityType(forIdentifier: .oxygenSaturation)!,
        HKQuantityType.quantityType(forIdentifier: .bodyTemperature)!,
        HKQuantityType.quantityType(forIdentifier: .environmentalAudioExposure)!,
        HKQuantityType.quantityType(forIdentifier: .headphoneAudioExposure)!,
        HKQuantityType.quantityType(forIdentifier: .respiratoryRate)!,
        HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)!,
        HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic)!,
        HKQuantityType.quantityType(forIdentifier: .peakExpiratoryFlowRate)!,
        HKQuantityType.quantityType(forIdentifier: .forcedVitalCapacity)!,
        HKQuantityType.quantityType(forIdentifier: .forcedExpiratoryVolume1)!,
        // Nutrition
        HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryProtein)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)!,
        HKQuantityType.quantityType(forIdentifier: .dietarySugar)!,
        HKQuantityType.quantityType(forIdentifier: .dietarySodium)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryFiber)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryVitaminC)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryVitaminD)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryCalcium)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryIron)!,
        HKQuantityType.quantityType(forIdentifier: .dietaryWater)!,
        // Mental Health & Mindfulness
        HKCategoryType.categoryType(forIdentifier: .mindfulSession)!,
        HKCategoryType.categoryType(forIdentifier: .highHeartRateEvent)!,
        HKCategoryType.categoryType(forIdentifier: .lowHeartRateEvent)!,
        HKCategoryType.categoryType(forIdentifier: .irregularHeartRhythmEvent)!,
        // Reproductive Health
        HKCategoryType.categoryType(forIdentifier: .menstrualFlow)!,
        HKCategoryType.categoryType(forIdentifier: .ovulationTestResult)!,
        HKCategoryType.categoryType(forIdentifier: .cervicalMucusQuality)!,
        HKCategoryType.categoryType(forIdentifier: .basalBodyTemperature)!,
        // Body Measurements
        HKQuantityType.quantityType(forIdentifier: .bodyMass)!,
        HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .leanBodyMass)!,
        HKQuantityType.quantityType(forIdentifier: .waistCircumference)!,
        // Lab Results
        HKQuantityType.quantityType(forIdentifier: .bloodGlucose)!,
        HKQuantityType.quantityType(forIdentifier: .insulinDelivery)!,
        // Audio & Environmental
        HKQuantityType.quantityType(forIdentifier: .sixMinuteWalkTestDistance)!,
        HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .walkingStepLength)!,
        HKQuantityType.quantityType(forIdentifier: .walkingAsymmetryPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .walkingDoubleSupportPercentage)!,
        HKQuantityType.quantityType(forIdentifier: .stairAscentSpeed)!,
        HKQuantityType.quantityType(forIdentifier: .stairDescentSpeed)!,
        // Apple Watch specific
        HKQuantityType.quantityType(forIdentifier: .appleStandTime)!,
        HKQuantityType.quantityType(forIdentifier: .appleExerciseTime)!,
    ]
    
    func requestAdvancedAuthorization() async {
        do {
            try await healthStore.requestAuthorization(toShare: [], read: advancedReadTypes)
            await fetchAdvancedMetrics()
        } catch {
            print("❌ Advanced authorization failed: \(error)")
        }
    }
    
    func fetchAdvancedMetrics() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchVO2Max() }
            group.addTask { await self.fetchRestingHeartRate() }
            group.addTask { await self.fetchHeartRateVariability() }
            group.addTask { await self.fetchSleepData() }
            group.addTask { await self.fetchRecentWorkouts() }
            group.addTask { await self.fetchNutritionData() }
            group.addTask { await self.fetchRespiratoryRate() }
            group.addTask { await self.fetchBodyTemperature() }
            group.addTask { await self.fetchBloodPressure() }
            group.addTask { await self.fetchOxygenSaturation() }
            group.addTask { await self.fetchEnvironmentalAudio() }
            group.addTask { await self.fetchMenstrualHealth() }
            group.addTask { await self.fetchMindfulnessData() }
            group.addTask { await self.calculateHealthScore() }
        }
    }
    
    private func fetchVO2Max() async {
        guard let vo2MaxType = HKQuantityType.quantityType(forIdentifier: .vo2Max) else { return }
        
        let query = HKSampleQuery(
            sampleType: vo2MaxType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.vo2Max = sample.quantity.doubleValue(for: HKUnit.literUnit(with: .milli).unitDivided(by: .gramUnit(with: .kilo)).unitDivided(by: .minute()))
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchRestingHeartRate() async {
        guard let restingHRType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else { return }
        
        let query = HKSampleQuery(
            sampleType: restingHRType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.restingHeartRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchHeartRateVariability() async {
        guard let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else { return }
        
        let query = HKSampleQuery(
            sampleType: hrvType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.heartRateVariability = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchSleepData() async {
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return }
        
        let startDate = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)
        
        let query = HKSampleQuery(
            sampleType: sleepType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKCategorySample] else { return }
            
            DispatchQueue.main.async {
                self?.sleepAnalysis = samples
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchRecentWorkouts() async {
        let workoutType = HKWorkoutType.workoutType()
        let startDate = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)
        
        let query = HKSampleQuery(
            sampleType: workoutType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let workouts = samples as? [HKWorkout] else { return }
            
            let summary = WorkoutSummary(workouts: workouts)
            
            DispatchQueue.main.async {
                self?.workoutSummary = summary
            }
        }
        
            healthStore.execute(query)
        }
    }
    
    // MARK: - Advanced Vital Signs
    private func fetchRespiratoryRate() async {
        guard let respiratoryType = HKQuantityType.quantityType(forIdentifier: .respiratoryRate) else { return }
        
        let query = HKSampleQuery(
            sampleType: respiratoryType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.respiratoryRate = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchBodyTemperature() async {
        guard let tempType = HKQuantityType.quantityType(forIdentifier: .bodyTemperature) else { return }
        
        let query = HKSampleQuery(
            sampleType: tempType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.bodyTemperature = sample.quantity.doubleValue(for: HKUnit.degreeFahrenheit())
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchBloodPressure() async {
        let systolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)!
        let diastolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic)!
        
        // Fetch both systolic and diastolic readings
        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                let query = HKSampleQuery(
                    sampleType: systolicType,
                    predicate: nil,
                    limit: 1,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
                ) { [weak self] query, samples, error in
                    guard let sample = samples?.first as? HKQuantitySample else { return }
                    
                    let systolic = sample.quantity.doubleValue(for: HKUnit.millimeterOfMercury())
                    
                    DispatchQueue.main.async {
                        if self?.bloodPressure == nil {
                            self?.bloodPressure = BloodPressureReading(systolic: systolic, diastolic: 0, date: sample.endDate)
                        } else {
                            self?.bloodPressure?.systolic = systolic
                        }
                    }
                }
                self.healthStore.execute(query)
            }
            
            group.addTask {
                let query = HKSampleQuery(
                    sampleType: diastolicType,
                    predicate: nil,
                    limit: 1,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
                ) { [weak self] query, samples, error in
                    guard let sample = samples?.first as? HKQuantitySample else { return }
                    
                    let diastolic = sample.quantity.doubleValue(for: HKUnit.millimeterOfMercury())
                    
                    DispatchQueue.main.async {
                        if self?.bloodPressure == nil {
                            self?.bloodPressure = BloodPressureReading(systolic: 0, diastolic: diastolic, date: sample.endDate)
                        } else {
                            self?.bloodPressure?.diastolic = diastolic
                        }
                    }
                }
                self.healthStore.execute(query)
            }
        }
    }
    
    private func fetchOxygenSaturation() async {
        guard let oxygenType = HKQuantityType.quantityType(forIdentifier: .oxygenSaturation) else { return }
        
        let query = HKSampleQuery(
            sampleType: oxygenType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            DispatchQueue.main.async {
                self?.oxygenSaturation = sample.quantity.doubleValue(for: HKUnit.percent()) * 100
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchEnvironmentalAudio() async {
        guard let audioType = HKQuantityType.quantityType(forIdentifier: .environmentalAudioExposure) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        let query = HKStatisticsQuery(
            quantityType: audioType,
            quantitySamplePredicate: predicate,
            options: .discreteAverage
        ) { [weak self] query, statistics, error in
            guard let statistics = statistics,
                  let average = statistics.averageQuantity() else { return }
            
            DispatchQueue.main.async {
                self?.environmentalAudioExposure = average.doubleValue(for: HKUnit.decibelAWeighted())
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Reproductive Health
    private func fetchMenstrualHealth() async {
        guard let menstrualType = HKCategoryType.categoryType(forIdentifier: .menstrualFlow) else { return }
        
        let startDate = Calendar.current.date(byAdding: .month, value: -3, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date())
        
        let query = HKSampleQuery(
            sampleType: menstrualType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKCategorySample] else { return }
            
            let menstrualData = MenstrualHealthData(samples: samples)
            
            DispatchQueue.main.async {
                self?.menstrualHealthData = menstrualData
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Mindfulness & Mental Health
    private func fetchMindfulnessData() async {
        guard let mindfulType = HKCategoryType.categoryType(forIdentifier: .mindfulSession) else { return }
        
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: sevenDaysAgo, end: Date())
        
        let query = HKSampleQuery(
            sampleType: mindfulType,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        ) { [weak self] query, samples, error in
            guard let samples = samples as? [HKCategorySample] else { return }
            
            let totalMinutes = samples.reduce(0) { total, sample in
                total + sample.endDate.timeIntervalSince(sample.startDate) / 60
            }
            
            DispatchQueue.main.async {
                self?.mindfulnessMinutes = totalMinutes
            }
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Health Score Calculation
    private func calculateHealthScore() async {
        // Wait for basic metrics to be fetched
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        
        await MainActor.run {
            var score = HealthScore()
            
            // Heart Rate Score (0-25 points)
            if let restingHR = self.restingHeartRate {
                score.heartRateScore = self.calculateHeartRateScore(restingHR)
            }
            
            // Activity Score (0-25 points)
            if let workoutSummary = self.workoutSummary {
                score.activityScore = self.calculateActivityScore(workoutSummary)
            }
            
            // Sleep Score (0-25 points)
            if !self.sleepAnalysis.isEmpty {
                score.sleepScore = self.calculateSleepScore(self.sleepAnalysis)
            }
            
            // Nutrition Score (0-25 points)
            if let nutrition = self.nutritionData, nutrition.isComplete {
                score.nutritionScore = self.calculateNutritionScore(nutrition)
            }
            
            score.calculateOverallScore()
            self.healthScore = score
        }
    }
    
    private func calculateHeartRateScore(_ restingHR: Double) -> Double {
        // Optimal resting heart rate ranges by age
        let optimalRange: ClosedRange<Double>
        
        // Simplified age-based calculation (assuming adult)
        optimalRange = 60...80
        
        if optimalRange.contains(restingHR) {
            return 25.0
        } else {
            let deviation = min(abs(restingHR - optimalRange.lowerBound), abs(restingHR - optimalRange.upperBound))
            return max(0, 25.0 - (deviation * 0.5))
        }
    }
    
    private func calculateActivityScore(_ workout: WorkoutSummary) -> Double {
        var score = 0.0
        
        // Weekly workout frequency (up to 15 points)
        let weeklyFrequency = min(workout.totalWorkouts, 5)
        score += Double(weeklyFrequency) * 3.0
        
        // Total duration (up to 10 points)
        let weeklyMinutes = workout.totalDuration / 60
        score += min(weeklyMinutes / 150.0 * 10.0, 10.0) // Based on 150 min/week recommendation
        
        return min(score, 25.0)
    }
    
    private func calculateSleepScore(_ sleepSamples: [HKCategorySample]) -> Double {
        let recentSleep = sleepSamples.filter { sample in
            Calendar.current.isDate(sample.startDate, inSameDayAs: Date()) ||
            Calendar.current.isDate(sample.startDate, inSameDayAs: Calendar.current.date(byAdding: .day, value: -1, to: Date())!)
        }
        
        let totalSleepHours = recentSleep.reduce(0) { total, sample in
            total + sample.endDate.timeIntervalSince(sample.startDate) / 3600
        }
        
        // Optimal sleep: 7-9 hours
        if totalSleepHours >= 7 && totalSleepHours <= 9 {
            return 25.0
        } else {
            let deviation = min(abs(totalSleepHours - 7), abs(totalSleepHours - 9))
            return max(0, 25.0 - (deviation * 2.0))
        }
    }
    
    private func calculateNutritionScore(_ nutrition: NutritionData) -> Double {
        var score = 0.0
        
        // Calorie intake reasonableness (0-10 points)
        if nutrition.calories >= 1200 && nutrition.calories <= 2500 {
            score += 10.0
        }
        
        // Protein adequacy (0-5 points)
        if nutrition.protein >= 50 {
            score += 5.0
        }
        
        // Fiber intake (0-5 points)
        if nutrition.fiber >= 25 {
            score += 5.0
        }
        
        // Balanced macronutrients (0-5 points)
        let totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat
        if totalMacros > 0 {
            let proteinPercent = (nutrition.protein * 4) / nutrition.calories * 100
            let carbPercent = (nutrition.carbs * 4) / nutrition.calories * 100
            let fatPercent = (nutrition.fat * 9) / nutrition.calories * 100
            
            if proteinPercent >= 10 && proteinPercent <= 35 &&
               carbPercent >= 45 && carbPercent <= 65 &&
               fatPercent >= 20 && fatPercent <= 35 {
                score += 5.0
            }
        }
        
        return min(score, 25.0)
    }
    
    // MARK: - Background Monitoring
    private func setupBackgroundObservers() {
        // Set up observers for real-time health data updates
        let criticalTypes = [
            HKQuantityType.quantityType(forIdentifier: .heartRate)!,
            HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)!,
            HKQuantityType.quantityType(forIdentifier: .oxygenSaturation)!
        ]
        
        for type in criticalTypes {
            let observer = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] query, completionHandler, error in
                // Fetch latest data when new samples are available
                Task {
                    await self?.fetchAdvancedMetrics()
                }
                completionHandler()
            }
            
            backgroundObservers.append(observer)
            healthStore.execute(observer)
        }
    }
    
    deinit {
        // Clean up observers
        for observer in backgroundObservers {
            healthStore.stop(observer)
        }
    }
    
    private func fetchNutritionData() async {
        let nutritionTypes = [
            HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed)!,
            HKQuantityType.quantityType(forIdentifier: .dietaryProtein)!,
            HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)!,
            HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)!,
            HKQuantityType.quantityType(forIdentifier: .dietaryFiber)!,
            HKQuantityType.quantityType(forIdentifier: .dietarySugar)!,
            HKQuantityType.quantityType(forIdentifier: .dietarySodium)!,
            HKQuantityType.quantityType(forIdentifier: .dietaryWater)!,
        ]
        
        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)
        
        var nutritionData = NutritionData()
        
        for type in nutritionTypes {
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { query, statistics, error in
                guard let statistics = statistics, let sum = statistics.sumQuantity() else { return }
                
                DispatchQueue.main.async {
                    switch type.identifier {
                    case HKQuantityTypeIdentifier.dietaryEnergyConsumed.rawValue:
                        nutritionData.calories = sum.doubleValue(for: .kilocalorie())
                    case HKQuantityTypeIdentifier.dietaryProtein.rawValue:
                        nutritionData.protein = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietaryCarbohydrates.rawValue:
                        nutritionData.carbs = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietaryFatTotal.rawValue:
                        nutritionData.fat = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietaryFiber.rawValue:
                        nutritionData.fiber = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietarySugar.rawValue:
                        nutritionData.sugar = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietarySodium.rawValue:
                        nutritionData.sodium = sum.doubleValue(for: .gram())
                    case HKQuantityTypeIdentifier.dietaryWater.rawValue:
                        nutritionData.water = sum.doubleValue(for: .literUnit(with: .milli))
                    default:
                        break
                    }
                    
                    self.nutritionData = nutritionData
                }
            }
            
            healthStore.execute(query)
        }
    }
}

// MARK: - Supporting Data Models
struct WorkoutSummary {
    let totalWorkouts: Int
    let totalDuration: TimeInterval
    let totalEnergyBurned: Double
    let averageHeartRate: Double?
    let workoutTypes: [HKWorkoutActivityType]
    
    init(workouts: [HKWorkout]) {
        totalWorkouts = workouts.count
        totalDuration = workouts.reduce(0) { $0 + $1.duration }
        totalEnergyBurned = workouts.compactMap { $0.totalEnergyBurned?.doubleValue(for: .kilocalorie()) }.reduce(0, +)
        averageHeartRate = workouts.compactMap { workout in
            // This would need additional queries to get heart rate data during workouts
            return nil
        }.first
        workoutTypes = Array(Set(workouts.map { $0.workoutActivityType }))
    }
}

struct NutritionData {
    var calories: Double = 0
    var protein: Double = 0
    var carbs: Double = 0
    var fat: Double = 0
    var fiber: Double = 0
    var sugar: Double = 0
    var sodium: Double = 0
    var water: Double = 0 // in milliliters
    
    var isComplete: Bool {
        calories > 0 || protein > 0 || carbs > 0 || fat > 0
    }
    
    var macronutrientBalance: MacronutrientBalance {
        guard calories > 0 else { return MacronutrientBalance() }
        
        let proteinPercent = (protein * 4) / calories * 100
        let carbPercent = (carbs * 4) / calories * 100
        let fatPercent = (fat * 9) / calories * 100
        
        return MacronutrientBalance(
            proteinPercent: proteinPercent,
            carbPercent: carbPercent,
            fatPercent: fatPercent
        )
    }
}

struct MacronutrientBalance {
    let proteinPercent: Double
    let carbPercent: Double
    let fatPercent: Double
    
    init(proteinPercent: Double = 0, carbPercent: Double = 0, fatPercent: Double = 0) {
        self.proteinPercent = proteinPercent
        self.carbPercent = carbPercent
        self.fatPercent = fatPercent
    }
    
    var isBalanced: Bool {
        proteinPercent >= 10 && proteinPercent <= 35 &&
        carbPercent >= 45 && carbPercent <= 65 &&
        fatPercent >= 20 && fatPercent <= 35
    }
}

// MARK: - Advanced Health Data Models
struct BloodPressureReading {
    var systolic: Double
    var diastolic: Double
    let date: Date
    
    var category: BloodPressureCategory {
        if systolic < 120 && diastolic < 80 {
            return .normal
        } else if systolic < 130 && diastolic < 80 {
            return .elevated
        } else if systolic < 140 || diastolic < 90 {
            return .stage1Hypertension
        } else if systolic >= 140 || diastolic >= 90 {
            return .stage2Hypertension
        } else {
            return .hypertensiveCrisis
        }
    }
    
    enum BloodPressureCategory: String, CaseIterable {
        case normal = "Normal"
        case elevated = "Elevated"
        case stage1Hypertension = "Stage 1 Hypertension"
        case stage2Hypertension = "Stage 2 Hypertension"
        case hypertensiveCrisis = "Hypertensive Crisis"
        
        var color: Color {
            switch self {
            case .normal: return .green
            case .elevated: return .yellow
            case .stage1Hypertension: return .orange
            case .stage2Hypertension: return .red
            case .hypertensiveCrisis: return .purple
            }
        }
    }
}

struct MenstrualHealthData {
    let lastPeriodDate: Date?
    let averageCycleLength: Double?
    let averageFlowDuration: Double?
    let recentSymptoms: [String]
    
    init(samples: [HKCategorySample]) {
        // Process menstrual flow samples
        let flowSamples = samples.filter { $0.value == HKCategoryValueMenstrualFlow.heavy.rawValue ||
                                          $0.value == HKCategoryValueMenstrualFlow.medium.rawValue ||
                                          $0.value == HKCategoryValueMenstrualFlow.light.rawValue }
        
        lastPeriodDate = flowSamples.first?.startDate
        
        // Calculate average cycle length (simplified)
        if flowSamples.count > 1 {
            let periods = flowSamples.compactMap { $0.startDate }
            let intervals = zip(periods, periods.dropFirst()).map { $1.timeIntervalSince($0) }
            averageCycleLength = intervals.reduce(0, +) / Double(intervals.count) / 86400 // Convert to days
        } else {
            averageCycleLength = nil
        }
        
        // Calculate average flow duration
        let flowDurations = flowSamples.map { $0.endDate.timeIntervalSince($0.startDate) / 86400 }
        averageFlowDuration = flowDurations.isEmpty ? nil : flowDurations.reduce(0, +) / Double(flowDurations.count)
        
        // This would be enhanced with symptom tracking data
        recentSymptoms = []
    }
}

struct HealthScore {
    var heartRateScore: Double = 0     // 0-25 points
    var activityScore: Double = 0      // 0-25 points
    var sleepScore: Double = 0         // 0-25 points
    var nutritionScore: Double = 0     // 0-25 points
    var overallScore: Double = 0       // 0-100 points
    var grade: String = "N/A"
    
    mutating func calculateOverallScore() {
        overallScore = heartRateScore + activityScore + sleepScore + nutritionScore
        
        switch overallScore {
        case 90...100:
            grade = "A+"
        case 80..<90:
            grade = "A"
        case 70..<80:
            grade = "B"
        case 60..<70:
            grade = "C"
        case 50..<60:
            grade = "D"
        default:
            grade = "F"
        }
    }
    
    var scoreColor: Color {
        switch overallScore {
        case 80...100:
            return .green
        case 60..<80:
            return .yellow
        case 40..<60:
            return .orange
        default:
            return .red
        }
    }
}
