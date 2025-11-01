//
//  MLModelImplementations.swift
//  VitalSense
//
//  Machine Learning model implementations and mock models for health analysis
//  Created: 2024-12-19
//

import Foundation
import CoreML
import CreateML
import HealthKit
import Accelerate

// MARK: - Base ML Model Protocol

protocol VitalSenseMLModel {
    associatedtype InputType
    associatedtype OutputType

    var accuracy: Double { get }
    var isLoaded: Bool { get }

    func load() async throws
    func predict(input: InputType) async throws -> OutputType
    func retrain(with data: [InputType], labels: [OutputType]) async throws
}

// MARK: - Heart Rate Prediction Model

class HeartRatePredictionModel: VitalSenseMLModel {
    typealias InputType = HeartRateFeatures
    typealias OutputType = HeartRatePrediction

    private var coreMLModel: MLModel?
    private var isModelLoaded = false

    var accuracy: Double = 0.87
    var isLoaded: Bool { isModelLoaded }

    func load() async throws {
        // In a real implementation, this would load a trained Core ML model
        // For now, we'll simulate loading
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 second delay
        isModelLoaded = true
    }

    func predict(input: HeartRateFeatures) async throws -> HeartRatePrediction {
        guard isLoaded else {
            throw MLModelError.modelNotLoaded
        }

        // Mock prediction logic based on input features
        let baseHeartRate = input.avgRestingHR
        let trend = input.hrTrend
        let variability = input.hrVariability

        // Simulate prediction calculation
        let predictedAverage = baseHeartRate + (trend * 7) // 7 days ahead
        let confidence = min(0.95, 0.6 + (variability * 0.3))

        // Determine trend direction
        let trendDirection: TrendDirection
        if trend > 2.0 {
            trendDirection = .increasing
        } else if trend < -2.0 {
            trendDirection = .decreasing
        } else {
            trendDirection = .stable
        }

        let predictedRange = (predictedAverage - 5)...(predictedAverage + 5)

        return HeartRatePrediction(
            predictedAverage: predictedAverage,
            trend: trendDirection,
            confidence: confidence,
            predictedRange: predictedRange,
            riskFactors: calculateHeartRateRiskFactors(input)
        )
    }

    func retrain(with data: [HeartRateFeatures], labels: [HeartRatePrediction]) async throws {
        // In a real implementation, this would retrain the model
        // For now, we'll just update accuracy based on data quality
        let dataQuality = Double(data.count) / 100.0 // Assume 100 samples is ideal
        accuracy = min(0.95, 0.7 + (dataQuality * 0.2))
    }

    private func calculateHeartRateRiskFactors(_ input: HeartRateFeatures) -> [String] {
        var risks: [String] = []

        if input.avgRestingHR > 100 {
            risks.append("Elevated resting heart rate")
        }

        if input.hrVariability < 20 {
            risks.append("Low heart rate variability")
        }

        if input.hrRecovery < 0.7 {
            risks.append("Slow heart rate recovery")
        }

        return risks
    }
}

struct HeartRatePrediction {
    let predictedAverage: Double
    let trend: TrendDirection
    let confidence: Double
    let predictedRange: ClosedRange<Double>
    let riskFactors: [String]
}

// MARK: - Activity Prediction Model

class ActivityPredictionModel: VitalSenseMLModel {
    typealias InputType = ActivityFeatures
    typealias OutputType = ActivityPrediction

    private var isModelLoaded = false

    var accuracy: Double = 0.82
    var isLoaded: Bool { isModelLoaded }

    func load() async throws {
        try await Task.sleep(nanoseconds: 300_000_000) // 0.3 second delay
        isModelLoaded = true
    }

    func predict(input: ActivityFeatures) async throws -> ActivityPrediction {
        guard isLoaded else {
            throw MLModelError.modelNotLoaded
        }

        let baseSteps = input.avgDailySteps
        let consistency = input.consistencyScore
        let weeklyPattern = input.weeklyPattern

        // Predict next week's activity based on patterns
        let predictedSteps = Int(baseSteps * (1.0 + consistency * 0.1))
        let predictedActiveMinutes = Int(input.avgActiveMinutes * (1.0 + consistency * 0.05))

        // Calculate trend based on recent patterns
        let recentTrend = weeklyPattern.suffix(3).reduce(0, +) / 3.0
        let overallAverage = weeklyPattern.reduce(0, +) / Double(weeklyPattern.count)

        let trendDirection: TrendDirection
        if recentTrend > overallAverage * 1.1 {
            trendDirection = .increasing
        } else if recentTrend < overallAverage * 0.9 {
            trendDirection = .decreasing
        } else {
            trendDirection = .stable
        }

        return ActivityPrediction(
            predictedDailySteps: predictedSteps,
            predictedActiveMinutes: predictedActiveMinutes,
            trend: trendDirection,
            confidence: min(0.9, consistency + 0.1),
            weeklyForecast: generateWeeklyForecast(baseSteps, weeklyPattern),
            motivationalMessage: generateMotivationalMessage(trendDirection, predictedSteps)
        )
    }

    func retrain(with data: [ActivityFeatures], labels: [ActivityPrediction]) async throws {
        let dataQuality = Double(data.count) / 50.0
        accuracy = min(0.9, 0.65 + (dataQuality * 0.25))
    }

    private func generateWeeklyForecast(_ baseSteps: Double, _ pattern: [Double]) -> [DayOfWeekActivity] {
        var forecast: [DayOfWeekActivity] = []

        for dayIndex in 1...7 {
            let dayPattern = pattern.isEmpty ? 1.0 : (pattern[dayIndex % pattern.count] / baseSteps)
            let expectedSteps = Int(baseSteps * dayPattern)
            let expectedActiveMinutes = expectedSteps / 100 // Rough conversion

            forecast.append(DayOfWeekActivity(
                dayOfWeek: dayIndex,
                expectedSteps: expectedSteps,
                expectedActiveMinutes: expectedActiveMinutes,
                confidence: 0.8
            ))
        }

        return forecast
    }

    private func generateMotivationalMessage(_ trend: TrendDirection, _ predictedSteps: Int) -> String {
        switch trend {
        case .increasing:
            return "Great momentum! You're on track to exceed your goals. Keep it up!"
        case .stable:
            return "Consistent effort! Your \(predictedSteps) daily steps show great stability."
        case .decreasing:
            return "Let's turn this around! Small increases in daily activity can make a big difference."
        }
    }
}

struct ActivityPrediction {
    let predictedDailySteps: Int
    let predictedActiveMinutes: Int
    let trend: TrendDirection
    let confidence: Double
    let weeklyForecast: [DayOfWeekActivity]
    let motivationalMessage: String
}

// MARK: - Fall Risk Prediction Model

class FallRiskPredictionModel: VitalSenseMLModel {
    typealias InputType = GaitFeatures
    typealias OutputType = FallRiskPrediction

    private var isModelLoaded = false

    var accuracy: Double = 0.91
    var isLoaded: Bool { isModelLoaded }

    func load() async throws {
        try await Task.sleep(nanoseconds: 400_000_000) // 0.4 second delay
        isModelLoaded = true
    }

    func predict(input: GaitFeatures) async throws -> FallRiskPrediction {
        guard isLoaded else {
            throw MLModelError.modelNotLoaded
        }

        // Calculate fall risk based on gait parameters
        let speedRisk = calculateSpeedRisk(input.avgWalkingSpeed)
        let asymmetryRisk = calculateAsymmetryRisk(input.gaitAsymmetry)
        let balanceRisk = calculateBalanceRisk(input.balanceScore)
        let variabilityRisk = calculateVariabilityRisk(input.stepLengthVariability)

        // Weighted combination of risk factors
        let overallRisk = (speedRisk * 0.3 + asymmetryRisk * 0.25 +
                          balanceRisk * 0.25 + variabilityRisk * 0.2)

        let confidence = calculateConfidence(input)
        let riskLevel = determineRiskLevel(overallRisk)

        return FallRiskPrediction(
            riskScore: overallRisk,
            riskLevel: riskLevel,
            confidence: confidence,
            contributingFactors: identifyContributingFactors(input),
            recommendations: generateFallPreventionRecommendations(riskLevel),
            nextAssessmentDate: Calendar.current.date(byAdding: .day, value: 30, to: Date()) ?? Date()
        )
    }

    func retrain(with data: [GaitFeatures], labels: [FallRiskPrediction]) async throws {
        let dataQuality = Double(data.count) / 200.0
        accuracy = min(0.95, 0.85 + (dataQuality * 0.1))
    }

    private func calculateSpeedRisk(_ speed: Double) -> Double {
        // Normal walking speed: 1.2-1.4 m/s
        // Risk increases as speed decreases below 1.0 m/s
        if speed >= 1.2 {
            return 0.0
        } else if speed >= 1.0 {
            return (1.2 - speed) / 0.2 * 0.3
        } else {
            return 0.3 + (1.0 - speed) / 1.0 * 0.4
        }
    }

    private func calculateAsymmetryRisk(_ asymmetry: Double) -> Double {
        // Normal asymmetry: < 5%
        // High risk: > 15%
        return min(1.0, asymmetry / 0.15)
    }

    private func calculateBalanceRisk(_ balance: Double) -> Double {
        // Balance score is 0-1, where 1 is perfect balance
        return 1.0 - balance
    }

    private func calculateVariabilityRisk(_ variability: Double) -> Double {
        // High step length variability indicates instability
        return min(1.0, variability / 0.2)
    }

    private func calculateConfidence(_ input: GaitFeatures) -> Double {
        // Confidence based on data quality and consistency
        let speedConsistency = 1.0 - min(0.3, abs(input.avgWalkingSpeed - 1.3) / 1.3)
        let balanceReliability = input.balanceScore
        return (speedConsistency + balanceReliability) / 2.0
    }

    private func determineRiskLevel(_ riskScore: Double) -> FallRiskLevel {
        switch riskScore {
        case 0.0..<0.2: return .low
        case 0.2..<0.5: return .moderate
        case 0.5..<0.8: return .high
        default: return .veryHigh
        }
    }

    private func identifyContributingFactors(_ input: GaitFeatures) -> [String] {
        var factors: [String] = []

        if input.avgWalkingSpeed < 1.0 {
            factors.append("Slow walking speed")
        }

        if input.gaitAsymmetry > 0.1 {
            factors.append("Gait asymmetry")
        }

        if input.balanceScore < 0.7 {
            factors.append("Poor balance")
        }

        if input.stepLengthVariability > 0.15 {
            factors.append("Step length variability")
        }

        if input.cadenceConsistency < 0.8 {
            factors.append("Inconsistent cadence")
        }

        return factors
    }

    private func generateFallPreventionRecommendations(_ riskLevel: FallRiskLevel) -> [String] {
        return riskLevel.recommendations
    }
}

struct FallRiskPrediction {
    let riskScore: Double
    let riskLevel: FallRiskLevel
    let confidence: Double
    let contributingFactors: [String]
    let recommendations: [String]
    let nextAssessmentDate: Date
}

// MARK: - Anomaly Detection Model

class AnomalyDetectionModel: VitalSenseMLModel {
    typealias InputType = [Double]
    typealias OutputType = [HealthAnomaly]

    let modelType: AnomalyModelType
    private var isModelLoaded = false
    private var historicalData: [Double] = []
    private var statisticalThreshold: Double = 2.0 // Standard deviations

    var accuracy: Double = 0.84
    var isLoaded: Bool { isModelLoaded }

    init(type: AnomalyModelType) {
        self.modelType = type
    }

    func load() async throws {
        try await Task.sleep(nanoseconds: 200_000_000) // 0.2 second delay
        isModelLoaded = true
    }

    func predict(input: [Double]) async throws -> [HealthAnomaly] {
        guard isLoaded else {
            throw MLModelError.modelNotLoaded
        }

        return detectAnomalies(in: input)
    }

    func retrain(with data: [[Double]], labels: [[HealthAnomaly]]) async throws {
        // Update historical data for better baseline
        historicalData.append(contentsOf: data.flatMap { $0 })

        // Adjust threshold based on data variability
        let standardDeviation = calculateStandardDeviation(historicalData)
        statisticalThreshold = min(3.0, max(1.5, standardDeviation))

        accuracy = min(0.9, 0.75 + Double(data.count) / 1000.0 * 0.15)
    }

    func detectAnomalies(in data: [Double]) -> [HealthAnomaly] {
        var anomalies: [HealthAnomaly] = []

        guard data.count >= 3 else { return anomalies }

        let mean = data.reduce(0, +) / Double(data.count)
        let standardDeviation = calculateStandardDeviation(data)

        for (index, value) in data.enumerated() {
            let zScore = abs((value - mean) / standardDeviation)

            if zScore > statisticalThreshold {
                let anomaly = createAnomalyFromDetection(
                    value: value,
                    mean: mean,
                    standardDeviation: standardDeviation,
                    index: index,
                    zScore: zScore
                )
                anomalies.append(anomaly)
            }
        }

        return anomalies
    }

    private func calculateStandardDeviation(_ values: [Double]) -> Double {
        guard values.count > 1 else { return 0.0 }

        let mean = values.reduce(0, +) / Double(values.count)
        let squaredDifferences = values.map { pow($0 - mean, 2) }
        let variance = squaredDifferences.reduce(0, +) / Double(values.count - 1)
        return sqrt(variance)
    }

    private func createAnomalyFromDetection(
        value: Double,
        mean: Double,
        standardDeviation: Double,
        index: Int,
        zScore: Double
    ) -> HealthAnomaly {
        let confidence = min(0.95, (zScore - statisticalThreshold) / 2.0 + 0.6)
        let severity: InsightSeverity = zScore > 3.0 ? .high : .medium

        let normalRange = (mean - standardDeviation)...(mean + standardDeviation)

        return HealthAnomaly(
            id: "anomaly-\(modelType.rawValue)-\(Date().timeIntervalSince1970)-\(index)",
            type: getAnomalyType(for: value, mean: mean),
            detectedAt: Date(),
            severity: severity,
            confidence: confidence,
            affectedMetric: modelType.metricName,
            normalRange: normalRange,
            detectedValue: value,
            description: generateAnomalyDescription(value: value, mean: mean, zScore: zScore),
            potentialCauses: getPotentialCauses(),
            recommendedActions: getRecommendedActions()
        )
    }

    private func getAnomalyType(for value: Double, mean: Double) -> AnomalyType {
        switch modelType {
        case .heartRate:
            return value > mean ? .heartRateSpike : .heartRateDrop
        case .activity:
            return .activityDecline
        case .sleep:
            return .sleepDisruption
        case .gait:
            return .gaitChanges
        }
    }

    private func generateAnomalyDescription(value: Double, mean: Double, zScore: Double) -> String {
        let direction = value > mean ? "above" : "below"
        let percentage = abs((value - mean) / mean) * 100

        return "\(modelType.metricName) is \(String(format: "%.1f", percentage))% \(direction) normal range (Z-score: \(String(format: "%.2f", zScore)))"
    }

    private func getPotentialCauses() -> [String] {
        switch modelType {
        case .heartRate:
            return ["Stress", "Caffeine", "Medication changes", "Illness", "Dehydration"]
        case .activity:
            return ["Illness", "Weather changes", "Schedule changes", "Injury", "Motivation changes"]
        case .sleep:
            return ["Stress", "Environment changes", "Caffeine", "Screen time", "Schedule changes"]
        case .gait:
            return ["Fatigue", "Pain", "Footwear changes", "Surface changes", "Medical condition"]
        }
    }

    private func getRecommendedActions() -> [String] {
        switch modelType {
        case .heartRate:
            return ["Monitor symptoms", "Check medication timing", "Reduce stress", "Consult healthcare provider if persistent"]
        case .activity:
            return ["Review recent changes", "Set smaller goals", "Address barriers", "Gradually increase activity"]
        case .sleep:
            return ["Review sleep hygiene", "Check environment", "Limit screen time", "Maintain consistent schedule"]
        case .gait:
            return ["Check for pain or discomfort", "Review footwear", "Consider physical therapy", "Monitor for changes"]
        }
    }
}

enum AnomalyModelType: String, CaseIterable {
    case heartRate = "heart_rate"
    case activity = "activity"
    case sleep = "sleep"
    case gait = "gait"

    var metricName: String {
        switch self {
        case .heartRate: return "Heart Rate"
        case .activity: return "Activity Level"
        case .sleep: return "Sleep Quality"
        case .gait: return "Gait Pattern"
        }
    }
}

// MARK: - Health Data Processor

class HealthDataProcessor {
    private let healthStore = HKHealthStore()

    func collectRecentHealthData() async throws -> HealthDataCollection {
        // Collect data from the last 30 days
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -30, to: endDate)!

        async let heartRateData = fetchHeartRateData(from: startDate, to: endDate)
        async let hrvData = fetchHRVData(from: startDate, to: endDate)
        async let activityData = fetchActivityData(from: startDate, to: endDate)
        async let sleepData = fetchSleepData(from: startDate, to: endDate)
        async let gaitData = fetchGaitData(from: startDate, to: endDate)

        return try await HealthDataCollection(
            heartRateData: heartRateData,
            heartRateVariability: hrvData,
            activityData: activityData,
            sleepData: sleepData,
            gaitData: gaitData,
            collectedAt: Date()
        )
    }

    func createFeatureVector(from data: HealthDataCollection) throws -> HealthFeatureVector {
        let heartRateFeatures = createHeartRateFeatures(from: data.heartRateData, hrv: data.heartRateVariability)
        let activityFeatures = createActivityFeatures(from: data.activityData)
        let sleepFeatures = createSleepFeatures(from: data.sleepData)
        let gaitFeatures = createGaitFeatures(from: data.gaitData)
        let demographicFeatures = createDemographicFeatures()

        return HealthFeatureVector(
            heartRateFeatures: heartRateFeatures,
            activityFeatures: activityFeatures,
            sleepFeatures: sleepFeatures,
            gaitFeatures: gaitFeatures,
            demographicFeatures: demographicFeatures
        )
    }

    func createUserProfile(from data: HealthDataCollection) async throws -> UserHealthProfile {
        // This would typically fetch user profile data from HealthKit or user preferences
        // For now, we'll create a mock profile
        return UserHealthProfile(
            id: "user-\(UUID().uuidString)",
            age: 35, // This would be calculated from date of birth
            biologicalSex: .female,
            height: 1.65, // meters
            weight: 65.0, // kg
            activityLevel: .moderatelyActive,
            healthConditions: [],
            goals: [.fitnessImprovement, .betterSleep],
            preferences: UserPreferences(
                preferredUnits: .metric,
                notificationFrequency: .daily,
                dataPrivacy: .standard,
                analysisDepth: .advanced
            )
        )
    }

    // MARK: - Private Data Fetching Methods

    private func fetchHeartRateData(from startDate: Date, to endDate: Date) async throws -> [HeartRateData] {
        // Mock heart rate data - in real implementation, fetch from HealthKit
        var data: [HeartRateData] = []
        let dayCount = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0

        for i in 0..<dayCount {
            guard let date = Calendar.current.date(byAdding: .day, value: i, to: startDate) else { continue }

            let baseRate = 72.0 + Double.random(in: -8...8)
            data.append(HeartRateData(
                date: date,
                averageRate: baseRate,
                minRate: baseRate - Double.random(in: 10...15),
                maxRate: baseRate + Double.random(in: 20...40),
                restingRate: baseRate - Double.random(in: 5...10),
                context: .resting
            ))
        }

        return data
    }

    private func fetchHRVData(from startDate: Date, to endDate: Date) async throws -> [HeartRateVariabilityData] {
        // Mock HRV data
        var data: [HeartRateVariabilityData] = []
        let dayCount = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0

        for i in 0..<dayCount {
            guard let date = Calendar.current.date(byAdding: .day, value: i, to: startDate) else { continue }

            data.append(HeartRateVariabilityData(
                date: date,
                rmssd: 30.0 + Double.random(in: -10...15),
                sdnn: 45.0 + Double.random(in: -15...20),
                context: .morning
            ))
        }

        return data
    }

    private func fetchActivityData(from startDate: Date, to endDate: Date) async throws -> [ActivityData] {
        // Mock activity data
        var data: [ActivityData] = []
        let dayCount = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0

        for i in 0..<dayCount {
            guard let date = Calendar.current.date(byAdding: .day, value: i, to: startDate) else { continue }

            let steps = Int.random(in: 5000...12000)
            data.append(ActivityData(
                date: date,
                steps: steps,
                activeEnergy: Double(steps) * 0.04 + Double.random(in: -50...100),
                exerciseMinutes: Int.random(in: 15...90),
                standHours: Int.random(in: 8...14),
                distance: Double(steps) * 0.7 / 1000 // km
            ))
        }

        return data
    }

    private func fetchSleepData(from startDate: Date, to endDate: Date) async throws -> [SleepData] {
        // Mock sleep data
        var data: [SleepData] = []
        let dayCount = Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 0

        for i in 0..<dayCount {
            guard let date = Calendar.current.date(byAdding: .day, value: i, to: startDate) else { continue }

            let bedtime = Calendar.current.date(byAdding: .hour, value: 22 + Int.random(in: -2...2), to: date)!
            let duration = TimeInterval(6 + Double.random(in: -1...3)) * 3600 // 5-9 hours
            let wakeTime = bedtime.addingTimeInterval(duration)

            data.append(SleepData(
                date: date,
                bedtime: bedtime,
                wakeTime: wakeTime,
                duration: duration,
                quality: 0.6 + Double.random(in: -0.2...0.3),
                efficiency: 0.75 + Double.random(in: -0.1...0.2),
                stages: SleepStageData(
                    awake: duration * 0.05,
                    rem: duration * 0.25,
                    core: duration * 0.55,
                    deep: duration * 0.15
                )
            ))
        }

        return data
    }

    private func fetchGaitData(from startDate: Date, to endDate: Date) async throws -> [GaitData] {
        // Mock gait data - typically collected during walks
        var data: [GaitData] = []
        let sessionCount = Int.random(in: 15...25) // 15-25 walking sessions in 30 days

        for i in 0..<sessionCount {
            let daysAgo = Int.random(in: 0...29)
            guard let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date()) else { continue }

            data.append(GaitData(
                date: date,
                walkingSpeed: 1.2 + Double.random(in: -0.3...0.4),
                asymmetry: Double.random(in: 0.02...0.12),
                steadiness: 0.8 + Double.random(in: -0.1...0.15),
                stepLength: 0.65 + Double.random(in: -0.1...0.15),
                cadence: 110 + Double.random(in: -15...20),
                context: .outdoor
            ))
        }

        return data
    }

    // MARK: - Feature Creation Methods

    private func createHeartRateFeatures(from heartRateData: [HeartRateData], hrv: [HeartRateVariabilityData]) -> HeartRateFeatures {
        let avgResting = heartRateData.compactMap { $0.restingRate }.reduce(0, +) / Double(heartRateData.count)
        let maxHR = heartRateData.map { $0.maxRate }.max() ?? 180
        let avgHRV = hrv.map { $0.rmssd }.reduce(0, +) / Double(hrv.count)

        // Calculate trend (simplified)
        let firstHalf = heartRateData.prefix(heartRateData.count / 2).map { $0.averageRate }.reduce(0, +) / Double(heartRateData.count / 2)
        let secondHalf = heartRateData.suffix(heartRateData.count / 2).map { $0.averageRate }.reduce(0, +) / Double(heartRateData.count / 2)
        let trend = secondHalf - firstHalf

        return HeartRateFeatures(
            avgRestingHR: avgResting,
            maxHR: maxHR,
            hrVariability: avgHRV,
            hrTrend: trend,
            hrRecovery: 0.75 // Mock recovery score
        )
    }

    private func createActivityFeatures(from activityData: [ActivityData]) -> ActivityFeatures {
        let avgSteps = Double(activityData.map { $0.steps }.reduce(0, +)) / Double(activityData.count)
        let avgActiveMinutes = Double(activityData.map { $0.exerciseMinutes }.reduce(0, +)) / Double(activityData.count)

        // Calculate consistency
        let stepVariances = activityData.map { abs(Double($0.steps) - avgSteps) }
        let avgVariance = stepVariances.reduce(0, +) / Double(stepVariances.count)
        let consistency = max(0, 1 - (avgVariance / avgSteps))

        // Weekly pattern (simplified)
        let weeklyPattern = (0..<7).map { dayIndex in
            let dayData = activityData.filter { Calendar.current.component(.weekday, from: $0.date) == dayIndex + 1 }
            return dayData.isEmpty ? avgSteps : Double(dayData.map { $0.steps }.reduce(0, +)) / Double(dayData.count)
        }

        return ActivityFeatures(
            avgDailySteps: avgSteps,
            avgActiveMinutes: avgActiveMinutes,
            consistencyScore: consistency,
            intensityDistribution: [0.3, 0.5, 0.2], // Low, moderate, high intensity
            weeklyPattern: weeklyPattern
        )
    }

    private func createSleepFeatures(from sleepData: [SleepData]) -> SleepFeatures {
        guard !sleepData.isEmpty else {
            return SleepFeatures(avgSleepDuration: 8, sleepEfficiency: 0.8, bedtimeConsistency: 0.5, sleepQualityTrend: 0, remPercentage: nil)
        }

        let avgDuration = sleepData.map { $0.duration }.reduce(0, +) / Double(sleepData.count) / 3600 // Convert to hours
        let avgEfficiency = sleepData.map { $0.efficiency }.reduce(0, +) / Double(sleepData.count)

        // Bedtime consistency
        let bedtimes = sleepData.map { Calendar.current.component(.hour, from: $0.bedtime) }
        let avgBedtime = Double(bedtimes.reduce(0, +)) / Double(bedtimes.count)
        let bedtimeVariances = bedtimes.map { abs(Double($0) - avgBedtime) }
        let bedtimeConsistency = max(0, 1 - (bedtimeVariances.reduce(0, +) / Double(bedtimeVariances.count) / 4))

        // Quality trend
        let firstHalfQuality = sleepData.prefix(sleepData.count / 2).map { $0.quality }.reduce(0, +) / Double(sleepData.count / 2)
        let secondHalfQuality = sleepData.suffix(sleepData.count / 2).map { $0.quality }.reduce(0, +) / Double(sleepData.count / 2)
        let qualityTrend = secondHalfQuality - firstHalfQuality

        // REM percentage (if available)
        let remPercentage = sleepData.compactMap { data in
            guard let stages = data.stages else { return nil }
            return stages.rem / data.duration
        }.reduce(0, +) / Double(sleepData.count)

        return SleepFeatures(
            avgSleepDuration: avgDuration,
            sleepEfficiency: avgEfficiency,
            bedtimeConsistency: bedtimeConsistency,
            sleepQualityTrend: qualityTrend,
            remPercentage: remPercentage > 0 ? remPercentage : nil
        )
    }

    private func createGaitFeatures(from gaitData: [GaitData]) -> GaitFeatures {
        guard !gaitData.isEmpty else {
            return GaitFeatures(avgWalkingSpeed: 1.2, gaitAsymmetry: 0.05, stepLengthVariability: 0.1, cadenceConsistency: 0.8, balanceScore: 0.8)
        }

        let avgSpeed = gaitData.map { $0.walkingSpeed }.reduce(0, +) / Double(gaitData.count)
        let avgAsymmetry = gaitData.map { $0.asymmetry }.reduce(0, +) / Double(gaitData.count)
        let avgBalance = gaitData.map { $0.steadiness }.reduce(0, +) / Double(gaitData.count)

        // Step length variability
        let stepLengths = gaitData.map { $0.stepLength }
        let avgStepLength = stepLengths.reduce(0, +) / Double(stepLengths.count)
        let stepVariances = stepLengths.map { abs($0 - avgStepLength) }
        let stepLengthVariability = stepVariances.reduce(0, +) / Double(stepVariances.count)

        // Cadence consistency
        let cadences = gaitData.map { $0.cadence }
        let avgCadence = cadences.reduce(0, +) / Double(cadences.count)
        let cadenceVariances = cadences.map { abs($0 - avgCadence) }
        let cadenceConsistency = max(0, 1 - (cadenceVariances.reduce(0, +) / Double(cadenceVariances.count) / avgCadence))

        return GaitFeatures(
            avgWalkingSpeed: avgSpeed,
            gaitAsymmetry: avgAsymmetry,
            stepLengthVariability: stepLengthVariability,
            cadenceConsistency: cadenceConsistency,
            balanceScore: avgBalance
        )
    }

    private func createDemographicFeatures() -> DemographicFeatures {
        // This would typically come from user profile data
        return DemographicFeatures(
            age: 35,
            bmi: 22.5, // Calculated from height/weight
            biologicalSex: 0, // 0 for female, 1 for male
            activityLevel: 0.6, // 0-1 scale
            healthRiskScore: 0.2 // 0-1 scale, calculated from health conditions
        )
    }
}

// MARK: - ML Model Errors

enum MLModelError: Error, LocalizedError {
    case modelNotLoaded
    case invalidInput
    case predictionFailed
    case insufficientData

    var errorDescription: String? {
        switch self {
        case .modelNotLoaded:
            return "ML model is not loaded"
        case .invalidInput:
            return "Invalid input data provided"
        case .predictionFailed:
            return "Prediction failed"
        case .insufficientData:
            return "Insufficient data for analysis"
        }
    }
}
