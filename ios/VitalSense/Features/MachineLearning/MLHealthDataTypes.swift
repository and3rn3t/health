//
//  MLHealthDataTypes.swift
//  VitalSense
//
//  Core data structures for Machine Learning health analysis
//  Created: 2024-12-19
//

import Foundation
import HealthKit
import CoreML

// MARK: - ML Health Insight

struct MLHealthInsight: Identifiable, Codable {
    let id: String
    let type: MLInsightType
    let title: String
    let description: String
    let severity: InsightSeverity
    let confidence: Double // 0.0 to 1.0
    let actionableRecommendations: [String]
    let dataPoints: [MLDataPoint]
    let generatedAt: Date

    var confidenceLevel: ConfidenceLevel {
        switch confidence {
        case 0.9...: return .veryHigh
        case 0.8..<0.9: return .high
        case 0.7..<0.8: return .medium
        case 0.6..<0.7: return .low
        default: return .veryLow
        }
    }

    var isActionable: Bool {
        return !actionableRecommendations.isEmpty && confidence >= 0.6
    }
}

enum MLInsightType: String, CaseIterable, Codable {
    case heartRateVariability = "hrv"
    case activityPattern = "activity"
    case sleepQuality = "sleep"
    case gaitAnalysis = "gait"
    case correlation = "correlation"
    case anomaly = "anomaly"
    case prediction = "prediction"

    var displayName: String {
        switch self {
        case .heartRateVariability: return "Heart Rate Variability"
        case .activityPattern: return "Activity Pattern"
        case .sleepQuality: return "Sleep Quality"
        case .gaitAnalysis: return "Gait Analysis"
        case .correlation: return "Health Correlation"
        case .anomaly: return "Anomaly Detection"
        case .prediction: return "Health Prediction"
        }
    }

    var icon: String {
        switch self {
        case .heartRateVariability: return "heart.text.square"
        case .activityPattern: return "figure.walk"
        case .sleepQuality: return "bed.double"
        case .gaitAnalysis: return "figure.walk.motion"
        case .correlation: return "chart.line.uptrend.xyaxis"
        case .anomaly: return "exclamationmark.triangle"
        case .prediction: return "crystal.ball"
        }
    }
}

enum InsightSeverity: String, CaseIterable, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"

    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }

    var priority: Int {
        switch self {
        case .low: return 1
        case .medium: return 2
        case .high: return 3
        case .critical: return 4
        }
    }
}

enum ConfidenceLevel: String, CaseIterable, Codable {
    case veryLow = "very_low"
    case low = "low"
    case medium = "medium"
    case high = "high"
    case veryHigh = "very_high"

    var displayName: String {
        switch self {
        case .veryLow: return "Very Low"
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .veryHigh: return "Very High"
        }
    }

    var percentage: String {
        switch self {
        case .veryLow: return "< 60%"
        case .low: return "60-70%"
        case .medium: return "70-80%"
        case .high: return "80-90%"
        case .veryHigh: return "> 90%"
        }
    }
}

// MARK: - ML Data Point

struct MLDataPoint: Identifiable, Codable {
    let id = UUID()
    let date: Date
    let value: Double
    let label: String
    let metadata: [String: String]?

    init(date: Date, value: Double, label: String, metadata: [String: String]? = nil) {
        self.date = date
        self.value = value
        self.label = label
        self.metadata = metadata
    }
}

// MARK: - Health Predictions

struct HealthPredictions: Codable {
    let nextWeekHeartRateTrend: HeartRateTrend
    let activityPredictions: ActivityTrends
    let fallRiskScore: Double // 0.0 to 1.0
    let confidenceLevel: Double
    let generatedAt: Date

    var fallRiskLevel: FallRiskLevel {
        switch fallRiskScore {
        case 0.0..<0.2: return .low
        case 0.2..<0.5: return .moderate
        case 0.5..<0.8: return .high
        default: return .veryHigh
        }
    }
}

struct HeartRateTrend: Codable {
    let average: Double
    let trend: TrendDirection
    let confidence: Double
    let predictedRange: ClosedRange<Double>?

    init(average: Double, trend: TrendDirection, confidence: Double = 0.5, predictedRange: ClosedRange<Double>? = nil) {
        self.average = average
        self.trend = trend
        self.confidence = confidence
        self.predictedRange = predictedRange
    }
}

struct ActivityTrends: Codable {
    let expectedDailySteps: Int
    let energyExpenditure: Double
    let trend: TrendDirection
    let confidence: Double
    let weeklyPattern: [DayOfWeekActivity]

    init() {
        self.expectedDailySteps = 8000
        self.energyExpenditure = 400.0
        self.trend = .stable
        self.confidence = 0.5
        self.weeklyPattern = []
    }
}

struct DayOfWeekActivity: Codable, Identifiable {
    let id = UUID()
    let dayOfWeek: Int // 1 = Sunday, 7 = Saturday
    let expectedSteps: Int
    let expectedActiveMinutes: Int
    let confidence: Double
}

enum TrendDirection: String, CaseIterable, Codable {
    case increasing = "increasing"
    case stable = "stable"
    case decreasing = "decreasing"

    var displayName: String {
        switch self {
        case .increasing: return "Increasing"
        case .stable: return "Stable"
        case .decreasing: return "Decreasing"
        }
    }

    var icon: String {
        switch self {
        case .increasing: return "arrow.up.right"
        case .stable: return "arrow.right"
        case .decreasing: return "arrow.down.right"
        }
    }
}

enum ActivityTrendDirection: String, CaseIterable, Codable {
    case increasing = "increasing"
    case stable = "stable"
    case decreasing = "decreasing"
}

enum FallRiskLevel: String, CaseIterable, Codable {
    case low = "low"
    case moderate = "moderate"
    case high = "high"
    case veryHigh = "very_high"

    var displayName: String {
        switch self {
        case .low: return "Low Risk"
        case .moderate: return "Moderate Risk"
        case .high: return "High Risk"
        case .veryHigh: return "Very High Risk"
        }
    }

    var color: String {
        switch self {
        case .low: return "green"
        case .moderate: return "yellow"
        case .high: return "orange"
        case .veryHigh: return "red"
        }
    }

    var recommendations: [String] {
        switch self {
        case .low:
            return ["Continue regular exercise", "Maintain balance training"]
        case .moderate:
            return ["Increase balance exercises", "Consider strength training", "Regular vision checks"]
        case .high:
            return ["Consult healthcare provider", "Focus on fall prevention", "Home safety assessment"]
        case .veryHigh:
            return ["Immediate medical consultation", "Supervised exercise program", "Assistive devices consideration"]
        }
    }
}

// MARK: - Health Anomaly

struct HealthAnomaly: Identifiable, Codable {
    let id: String
    let type: AnomalyType
    let detectedAt: Date
    let severity: InsightSeverity
    let confidence: Double
    let affectedMetric: String
    let normalRange: ClosedRange<Double>
    let detectedValue: Double
    let description: String
    let potentialCauses: [String]
    let recommendedActions: [String]

    var deviationPercentage: Double {
        let center = (normalRange.lowerBound + normalRange.upperBound) / 2
        return abs((detectedValue - center) / center) * 100
    }

    var isSignificant: Bool {
        return confidence >= 0.7 && deviationPercentage >= 20
    }
}

enum AnomalyType: String, CaseIterable, Codable {
    case heartRateSpike = "hr_spike"
    case heartRateDrop = "hr_drop"
    case activityDecline = "activity_decline"
    case sleepDisruption = "sleep_disruption"
    case gaitChanges = "gait_changes"
    case hrvAbnormality = "hrv_abnormality"

    var displayName: String {
        switch self {
        case .heartRateSpike: return "Heart Rate Spike"
        case .heartRateDrop: return "Heart Rate Drop"
        case .activityDecline: return "Activity Decline"
        case .sleepDisruption: return "Sleep Disruption"
        case .gaitChanges: return "Gait Changes"
        case .hrvAbnormality: return "HRV Abnormality"
        }
    }

    var icon: String {
        switch self {
        case .heartRateSpike: return "heart.circle.fill"
        case .heartRateDrop: return "heart.slash"
        case .activityDecline: return "figure.walk.diamond.fill"
        case .sleepDisruption: return "moon.zzz.fill"
        case .gaitChanges: return "figure.walk.motion.trianglebadge.exclamationmark"
        case .hrvAbnormality: return "waveform.path.ecg"
        }
    }
}

// MARK: - Personalized Recommendation

struct PersonalizedRecommendation: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let category: RecommendationCategory
    let priority: RecommendationPriority
    let actionSteps: [String]
    let expectedBenefit: String
    let timeToResult: String
    let confidence: Double
    let personalizedFor: String // User ID
    let validUntil: Date?

    init(id: String, title: String, description: String, category: RecommendationCategory,
         priority: RecommendationPriority, actionSteps: [String], expectedBenefit: String,
         timeToResult: String, confidence: Double, personalizedFor: String, validUntil: Date? = nil) {
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.priority = priority
        self.actionSteps = actionSteps
        self.expectedBenefit = expectedBenefit
        self.timeToResult = timeToResult
        self.confidence = confidence
        self.personalizedFor = personalizedFor
        self.validUntil = validUntil
    }

    var isValid: Bool {
        guard let validUntil = validUntil else { return true }
        return Date() <= validUntil
    }

    var priorityScore: Int {
        return priority.rawValue * Int(confidence * 100)
    }
}

enum RecommendationCategory: String, CaseIterable, Codable {
    case fitness = "fitness"
    case nutrition = "nutrition"
    case sleep = "sleep"
    case stress = "stress"
    case recovery = "recovery"
    case activity = "activity"
    case mobility = "mobility"
    case safety = "safety"

    var displayName: String {
        switch self {
        case .fitness: return "Fitness"
        case .nutrition: return "Nutrition"
        case .sleep: return "Sleep"
        case .stress: return "Stress Management"
        case .recovery: return "Recovery"
        case .activity: return "Daily Activity"
        case .mobility: return "Mobility"
        case .safety: return "Safety"
        }
    }

    var icon: String {
        switch self {
        case .fitness: return "figure.strengthtraining.traditional"
        case .nutrition: return "fork.knife"
        case .sleep: return "bed.double.fill"
        case .stress: return "brain.head.profile"
        case .recovery: return "leaf.fill"
        case .activity: return "figure.walk"
        case .mobility: return "figure.walk.motion"
        case .safety: return "shield.fill"
        }
    }

    var color: String {
        switch self {
        case .fitness: return "blue"
        case .nutrition: return "green"
        case .sleep: return "indigo"
        case .stress: return "orange"
        case .recovery: return "mint"
        case .activity: return "teal"
        case .mobility: return "purple"
        case .safety: return "red"
        }
    }
}

enum RecommendationPriority: Int, CaseIterable, Codable {
    case low = 1
    case medium = 2
    case high = 3
    case urgent = 4

    var displayName: String {
        switch self {
        case .low: return "Low Priority"
        case .medium: return "Medium Priority"
        case .high: return "High Priority"
        case .urgent: return "Urgent"
        }
    }

    var color: String {
        switch self {
        case .low: return "gray"
        case .medium: return "blue"
        case .high: return "orange"
        case .urgent: return "red"
        }
    }
}

// MARK: - Health Data Collection

struct HealthDataCollection {
    let heartRateData: [HeartRateData]
    let heartRateVariability: [HeartRateVariabilityData]
    let activityData: [ActivityData]
    let sleepData: [SleepData]
    let gaitData: [GaitData]
    let collectedAt: Date

    var dataQuality: DataQuality {
        let completeness = calculateCompleteness()
        switch completeness {
        case 0.9...: return .excellent
        case 0.7..<0.9: return .good
        case 0.5..<0.7: return .fair
        default: return .poor
        }
    }

    private func calculateCompleteness() -> Double {
        var totalMetrics = 0
        var availableMetrics = 0

        totalMetrics += 5 // Number of data types

        if !heartRateData.isEmpty { availableMetrics += 1 }
        if !heartRateVariability.isEmpty { availableMetrics += 1 }
        if !activityData.isEmpty { availableMetrics += 1 }
        if !sleepData.isEmpty { availableMetrics += 1 }
        if !gaitData.isEmpty { availableMetrics += 1 }

        return Double(availableMetrics) / Double(totalMetrics)
    }
}

enum DataQuality: String, CaseIterable {
    case poor = "poor"
    case fair = "fair"
    case good = "good"
    case excellent = "excellent"

    var displayName: String {
        switch self {
        case .poor: return "Poor"
        case .fair: return "Fair"
        case .good: return "Good"
        case .excellent: return "Excellent"
        }
    }

    var color: String {
        switch self {
        case .poor: return "red"
        case .fair: return "orange"
        case .good: return "yellow"
        case .excellent: return "green"
        }
    }
}

// MARK: - Health Data Types

struct HeartRateData: Codable {
    let date: Date
    let averageRate: Double
    let minRate: Double
    let maxRate: Double
    let restingRate: Double?
    let context: HeartRateContext?
}

struct HeartRateVariabilityData: Codable {
    let date: Date
    let rmssd: Double // Root Mean Square of Successive Differences
    let sdnn: Double  // Standard Deviation of NN intervals
    let context: HRVContext?
}

struct ActivityData: Codable {
    let date: Date
    let steps: Int
    let activeEnergy: Double // kcal
    let exerciseMinutes: Int
    let standHours: Int
    let distance: Double // meters
}

struct SleepData: Codable {
    let date: Date
    let bedtime: Date
    let wakeTime: Date
    let duration: TimeInterval
    let quality: Double // 0.0 to 1.0
    let efficiency: Double // 0.0 to 1.0
    let stages: SleepStageData?
}

struct SleepStageData: Codable {
    let awake: TimeInterval
    let rem: TimeInterval
    let core: TimeInterval
    let deep: TimeInterval
}

struct GaitData: Codable {
    let date: Date
    let walkingSpeed: Double // m/s
    let asymmetry: Double // 0.0 to 1.0
    let steadiness: Double // 0.0 to 1.0
    let stepLength: Double // meters
    let cadence: Double // steps/minute
    let context: GaitContext?
}

// MARK: - Context Enums

enum HeartRateContext: String, Codable {
    case resting = "resting"
    case exercise = "exercise"
    case recovery = "recovery"
    case stress = "stress"
}

enum HRVContext: String, Codable {
    case morning = "morning"
    case evening = "evening"
    case postExercise = "post_exercise"
    case stressed = "stressed"
}

enum GaitContext: String, Codable {
    case indoor = "indoor"
    case outdoor = "outdoor"
    case treadmill = "treadmill"
    case stairs = "stairs"
}

// MARK: - User Health Profile

struct UserHealthProfile: Codable {
    let id: String
    let age: Int
    let biologicalSex: HKBiologicalSex
    let height: Double // meters
    let weight: Double // kg
    let activityLevel: ActivityLevel
    let healthConditions: [HealthCondition]
    let goals: [HealthGoal]
    let preferences: UserPreferences

    func calculateOptimalHeartRateZone() -> (lower: Double, upper: Double) {
        let maxHR = 220.0 - Double(age)
        let lower = maxHR * 0.5  // 50% of max HR
        let upper = maxHR * 0.85 // 85% of max HR
        return (lower: lower, upper: upper)
    }

    func calculateRecommendedDailySteps() -> Int {
        switch activityLevel {
        case .sedentary: return 6000
        case .lightlyActive: return 8000
        case .moderatelyActive: return 10000
        case .veryActive: return 12000
        case .extraActive: return 15000
        }
    }
}

enum ActivityLevel: String, CaseIterable, Codable {
    case sedentary = "sedentary"
    case lightlyActive = "lightly_active"
    case moderatelyActive = "moderately_active"
    case veryActive = "very_active"
    case extraActive = "extra_active"

    var displayName: String {
        switch self {
        case .sedentary: return "Sedentary"
        case .lightlyActive: return "Lightly Active"
        case .moderatelyActive: return "Moderately Active"
        case .veryActive: return "Very Active"
        case .extraActive: return "Extra Active"
        }
    }
}

enum HealthCondition: String, CaseIterable, Codable {
    case diabetes = "diabetes"
    case hypertension = "hypertension"
    case heartDisease = "heart_disease"
    case arthritis = "arthritis"
    case osteoporosis = "osteoporosis"
    case depression = "depression"
    case anxiety = "anxiety"

    var displayName: String {
        switch self {
        case .diabetes: return "Diabetes"
        case .hypertension: return "Hypertension"
        case .heartDisease: return "Heart Disease"
        case .arthritis: return "Arthritis"
        case .osteoporosis: return "Osteoporosis"
        case .depression: return "Depression"
        case .anxiety: return "Anxiety"
        }
    }
}

enum HealthGoal: String, CaseIterable, Codable {
    case weightLoss = "weight_loss"
    case weightGain = "weight_gain"
    case fitnessImprovement = "fitness_improvement"
    case stressReduction = "stress_reduction"
    case betterSleep = "better_sleep"
    case fallPrevention = "fall_prevention"
    case heartHealth = "heart_health"

    var displayName: String {
        switch self {
        case .weightLoss: return "Weight Loss"
        case .weightGain: return "Weight Gain"
        case .fitnessImprovement: return "Fitness Improvement"
        case .stressReduction: return "Stress Reduction"
        case .betterSleep: return "Better Sleep"
        case .fallPrevention: return "Fall Prevention"
        case .heartHealth: return "Heart Health"
        }
    }
}

struct UserPreferences: Codable {
    let preferredUnits: UnitSystem
    let notificationFrequency: NotificationFrequency
    let dataPrivacy: DataPrivacyLevel
    let analysisDepth: AnalysisDepth
}

enum UnitSystem: String, CaseIterable, Codable {
    case metric = "metric"
    case imperial = "imperial"
}

enum NotificationFrequency: String, CaseIterable, Codable {
    case never = "never"
    case weekly = "weekly"
    case daily = "daily"
    case realTime = "real_time"
}

enum DataPrivacyLevel: String, CaseIterable, Codable {
    case minimal = "minimal"
    case standard = "standard"
    case comprehensive = "comprehensive"
}

enum AnalysisDepth: String, CaseIterable, Codable {
    case basic = "basic"
    case standard = "standard"
    case advanced = "advanced"
}

// MARK: - Feature Vectors for ML Models

struct HealthFeatureVector {
    let heartRateFeatures: HeartRateFeatures
    let activityFeatures: ActivityFeatures
    let sleepFeatures: SleepFeatures
    let gaitFeatures: GaitFeatures
    let demographicFeatures: DemographicFeatures
}

struct HeartRateFeatures {
    let avgRestingHR: Double
    let maxHR: Double
    let hrVariability: Double
    let hrTrend: Double
    let hrRecovery: Double
}

struct ActivityFeatures {
    let avgDailySteps: Double
    let avgActiveMinutes: Double
    let consistencyScore: Double
    let intensityDistribution: [Double]
    let weeklyPattern: [Double]
}

struct SleepFeatures {
    let avgSleepDuration: Double
    let sleepEfficiency: Double
    let bedtimeConsistency: Double
    let sleepQualityTrend: Double
    let remPercentage: Double?
}

struct GaitFeatures {
    let avgWalkingSpeed: Double
    let gaitAsymmetry: Double
    let stepLengthVariability: Double
    let cadenceConsistency: Double
    let balanceScore: Double
}

struct DemographicFeatures {
    let age: Double
    let bmi: Double
    let biologicalSex: Double // 0 for female, 1 for male
    let activityLevel: Double
    let healthRiskScore: Double
}
