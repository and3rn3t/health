//
//  VitalSenseMLHealthAnalyzer.swift
//  VitalSense
//
//  Advanced Machine Learning health analysis and predictive insights
//  Created: 2024-12-19
//

import Foundation
import CoreML
import HealthKit
import CreateML
import SwiftUI
import Combine
import OSLog

// MARK: - ML Health Analyzer

@MainActor
class VitalSenseMLHealthAnalyzer: ObservableObject {
    static let shared = VitalSenseMLHealthAnalyzer()

    @Published var currentInsights: [MLHealthInsight] = []
    @Published var healthPredictions: HealthPredictions?
    @Published var anomalyDetections: [HealthAnomaly] = []
    @Published var personalizedRecommendations: [PersonalizedRecommendation] = []
    @Published var isAnalyzing = false
    @Published var modelAccuracy: Double = 0.0

    private let logger = Logger(subsystem: "com.vitalsense.ml", category: "HealthAnalyzer")
    private var mlModels: MLModels = MLModels()
    private var healthDataProcessor = HealthDataProcessor()
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupMLModels()
        startContinuousAnalysis()
    }

    // MARK: - ML Model Setup

    private func setupMLModels() {
        Task {
            do {
                try await mlModels.loadAllModels()
                modelAccuracy = await mlModels.getAverageAccuracy()
                logger.info("ML models loaded successfully with accuracy: \(self.modelAccuracy)")
            } catch {
                logger.error("Failed to load ML models: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Continuous Health Analysis

    private func startContinuousAnalysis() {
        // Analyze health data every 30 minutes
        Timer.publish(every: 1800, on: .main, in: .common)
            .autoconnect()
            .sink { _ in
                Task {
                    await self.performComprehensiveAnalysis()
                }
            }
            .store(in: &cancellables)
    }

    func performComprehensiveAnalysis() async {
        isAnalyzing = true
        logger.info("Starting comprehensive ML health analysis")

        do {
            // Collect recent health data
            let healthData = try await healthDataProcessor.collectRecentHealthData()

            // Perform various ML analyses
            async let insights = generateHealthInsights(from: healthData)
            async let predictions = generateHealthPredictions(from: healthData)
            async let anomalies = detectHealthAnomalies(from: healthData)
            async let recommendations = generatePersonalizedRecommendations(from: healthData)

            // Update UI with results
            currentInsights = try await insights
            healthPredictions = try await predictions
            anomalyDetections = try await anomalies
            personalizedRecommendations = try await recommendations

            logger.info("ML analysis completed - \(currentInsights.count) insights, \(anomalyDetections.count) anomalies")

        } catch {
            logger.error("ML analysis failed: \(error.localizedDescription)")
        }

        isAnalyzing = false
    }

    // MARK: - Health Insights Generation

    private func generateHealthInsights(from data: HealthDataCollection) async throws -> [MLHealthInsight] {
        var insights: [MLHealthInsight] = []

        // Heart Rate Variability Analysis
        if let hrvInsight = try await analyzeHeartRateVariability(data.heartRateVariability) {
            insights.append(hrvInsight)
        }

        // Activity Pattern Analysis
        if let activityInsight = try await analyzeActivityPatterns(data.activityData) {
            insights.append(activityInsight)
        }

        // Sleep Quality Analysis
        if let sleepInsight = try await analyzeSleepQuality(data.sleepData) {
            insights.append(sleepInsight)
        }

        // Gait Analysis Insights
        if let gaitInsight = try await analyzeGaitPatterns(data.gaitData) {
            insights.append(gaitInsight)
        }

        // Cross-metric correlation analysis
        let correlationInsights = try await analyzeMetricCorrelations(data)
        insights.append(contentsOf: correlationInsights)

        return insights.sorted { $0.confidence > $1.confidence }
    }

    // MARK: - Health Predictions

    private func generateHealthPredictions(from data: HealthDataCollection) async throws -> HealthPredictions {
        // Use ensemble models for more accurate predictions
        let heartRateModel = mlModels.heartRatePredictionModel
        let activityModel = mlModels.activityPredictionModel
        let fallRiskModel = mlModels.fallRiskPredictionModel

        // Prepare feature vectors
        let features = try healthDataProcessor.createFeatureVector(from: data)

        // Generate predictions
        let nextWeekHeartRate = try await heartRateModel?.predict(features: features.heartRateFeatures)
        let activityTrends = try await activityModel?.predict(features: features.activityFeatures)
        let fallRiskScore = try await fallRiskModel?.predict(features: features.gaitFeatures)

        return HealthPredictions(
            nextWeekHeartRateTrend: nextWeekHeartRate ?? HeartRateTrend(average: 72, trend: .stable),
            activityPredictions: activityTrends ?? ActivityTrends(),
            fallRiskScore: fallRiskScore?.riskScore ?? 0.1,
            confidenceLevel: min(nextWeekHeartRate?.confidence ?? 0.5,
                                activityTrends?.confidence ?? 0.5,
                                fallRiskScore?.confidence ?? 0.5),
            generatedAt: Date()
        )
    }

    // MARK: - Anomaly Detection

    private func detectHealthAnomalies(from data: HealthDataCollection) async throws -> [HealthAnomaly] {
        var anomalies: [HealthAnomaly] = []

        // Heart Rate Anomalies
        let heartRateAnomalies = try await mlModels.heartRateAnomalyModel?.detectAnomalies(
            in: data.heartRateData
        ) ?? []
        anomalies.append(contentsOf: heartRateAnomalies)

        // Activity Anomalies
        let activityAnomalies = try await mlModels.activityAnomalyModel?.detectAnomalies(
            in: data.activityData
        ) ?? []
        anomalies.append(contentsOf: activityAnomalies)

        // Sleep Pattern Anomalies
        let sleepAnomalies = try await mlModels.sleepAnomalyModel?.detectAnomalies(
            in: data.sleepData
        ) ?? []
        anomalies.append(contentsOf: sleepAnomalies)

        // Gait Pattern Anomalies
        let gaitAnomalies = try await mlModels.gaitAnomalyModel?.detectAnomalies(
            in: data.gaitData
        ) ?? []
        anomalies.append(contentsOf: gaitAnomalies)

        return anomalies.filter { $0.severity >= .medium }
    }

    // MARK: - Personalized Recommendations

    private func generatePersonalizedRecommendations(from data: HealthDataCollection) async throws -> [PersonalizedRecommendation] {
        let userProfile = try await healthDataProcessor.createUserProfile(from: data)
        let recommendationEngine = PersonalizedRecommendationEngine()

        return try await recommendationEngine.generateRecommendations(
            for: userProfile,
            based: data,
            using: mlModels
        )
    }

    // MARK: - Specific Analysis Methods

    private func analyzeHeartRateVariability(_ hrvData: [HeartRateVariabilityData]) async throws -> MLHealthInsight? {
        guard !hrvData.isEmpty else { return nil }

        let recentHRV = hrvData.suffix(7) // Last 7 days
        let avgRMSSD = recentHRV.map { $0.rmssd }.reduce(0, +) / Double(recentHRV.count)
        let avgSDNN = recentHRV.map { $0.sdnn }.reduce(0, +) / Double(recentHRV.count)

        let stressLevel = calculateStressLevel(rmssd: avgRMSSD, sdnn: avgSDNN)
        let recoveryLevel = calculateRecoveryLevel(from: recentHRV)

        return MLHealthInsight(
            id: "hrv-analysis-\(Date().timeIntervalSince1970)",
            type: .heartRateVariability,
            title: "Heart Rate Variability Analysis",
            description: generateHRVInsightDescription(stress: stressLevel, recovery: recoveryLevel),
            severity: stressLevel > 0.7 ? .high : (stressLevel > 0.4 ? .medium : .low),
            confidence: 0.85,
            actionableRecommendations: generateHRVRecommendations(stress: stressLevel, recovery: recoveryLevel),
            dataPoints: hrvData.map { MLDataPoint(date: $0.date, value: $0.rmssd, label: "RMSSD") },
            generatedAt: Date()
        )
    }

    private func analyzeActivityPatterns(_ activityData: [ActivityData]) async throws -> MLHealthInsight? {
        guard !activityData.isEmpty else { return nil }

        let recentActivity = activityData.suffix(14) // Last 14 days
        let avgSteps = recentActivity.map { $0.steps }.reduce(0, +) / recentActivity.count
        let avgActiveEnergy = recentActivity.map { $0.activeEnergy }.reduce(0, +) / Double(recentActivity.count)

        let activityConsistency = calculateActivityConsistency(from: recentActivity)
        let progressTrend = calculateActivityTrend(from: recentActivity)

        return MLHealthInsight(
            id: "activity-analysis-\(Date().timeIntervalSince1970)",
            type: .activityPattern,
            title: "Activity Pattern Analysis",
            description: generateActivityInsightDescription(
                avgSteps: avgSteps,
                consistency: activityConsistency,
                trend: progressTrend
            ),
            severity: activityConsistency < 0.5 ? .medium : .low,
            confidence: 0.78,
            actionableRecommendations: generateActivityRecommendations(
                avgSteps: avgSteps,
                consistency: activityConsistency,
                trend: progressTrend
            ),
            dataPoints: activityData.map { MLDataPoint(date: $0.date, value: Double($0.steps), label: "Steps") },
            generatedAt: Date()
        )
    }

    private func analyzeSleepQuality(_ sleepData: [SleepData]) async throws -> MLHealthInsight? {
        guard !sleepData.isEmpty else { return nil }

        let recentSleep = sleepData.suffix(7) // Last 7 days
        let avgDuration = recentSleep.map { $0.duration }.reduce(0, +) / Double(recentSleep.count)
        let avgQuality = recentSleep.map { $0.quality }.reduce(0, +) / Double(recentSleep.count)

        let sleepConsistency = calculateSleepConsistency(from: recentSleep)
        let sleepEfficiency = calculateSleepEfficiency(from: recentSleep)

        return MLHealthInsight(
            id: "sleep-analysis-\(Date().timeIntervalSince1970)",
            type: .sleepQuality,
            title: "Sleep Quality Analysis",
            description: generateSleepInsightDescription(
                avgDuration: avgDuration,
                avgQuality: avgQuality,
                consistency: sleepConsistency
            ),
            severity: avgQuality < 0.6 ? .high : (avgQuality < 0.8 ? .medium : .low),
            confidence: 0.82,
            actionableRecommendations: generateSleepRecommendations(
                avgDuration: avgDuration,
                avgQuality: avgQuality,
                consistency: sleepConsistency
            ),
            dataPoints: sleepData.map { MLDataPoint(date: $0.date, value: $0.quality, label: "Quality") },
            generatedAt: Date()
        )
    }

    private func analyzeGaitPatterns(_ gaitData: [GaitData]) async throws -> MLHealthInsight? {
        guard !gaitData.isEmpty else { return nil }

        let recentGait = gaitData.suffix(10) // Last 10 sessions
        let avgSpeed = recentGait.map { $0.walkingSpeed }.reduce(0, +) / Double(recentGait.count)
        let avgAsymmetry = recentGait.map { $0.asymmetry }.reduce(0, +) / Double(recentGait.count)

        let gaitStability = calculateGaitStability(from: recentGait)
        let fallRiskScore = calculateFallRisk(from: recentGait)

        return MLHealthInsight(
            id: "gait-analysis-\(Date().timeIntervalSince1970)",
            type: .gaitAnalysis,
            title: "Gait Pattern Analysis",
            description: generateGaitInsightDescription(
                avgSpeed: avgSpeed,
                asymmetry: avgAsymmetry,
                stability: gaitStability,
                fallRisk: fallRiskScore
            ),
            severity: fallRiskScore > 0.3 ? .high : (fallRiskScore > 0.15 ? .medium : .low),
            confidence: 0.88,
            actionableRecommendations: generateGaitRecommendations(
                avgSpeed: avgSpeed,
                asymmetry: avgAsymmetry,
                fallRisk: fallRiskScore
            ),
            dataPoints: gaitData.map { MLDataPoint(date: $0.date, value: $0.walkingSpeed, label: "Speed") },
            generatedAt: Date()
        )
    }

    private func analyzeMetricCorrelations(_ data: HealthDataCollection) async throws -> [MLHealthInsight] {
        var insights: [MLHealthInsight] = []

        // Heart Rate vs Activity Correlation
        let hrActivityCorr = calculateCorrelation(
            data.heartRateData.map { $0.averageRate },
            data.activityData.map { Double($0.steps) }
        )

        if abs(hrActivityCorr) > 0.6 {
            insights.append(MLHealthInsight(
                id: "correlation-hr-activity-\(Date().timeIntervalSince1970)",
                type: .correlation,
                title: "Heart Rate-Activity Correlation",
                description: "Strong correlation detected between heart rate and activity levels (\(hrActivityCorr, specifier: "%.2f"))",
                severity: .low,
                confidence: 0.75,
                actionableRecommendations: [
                    "Monitor activity intensity to optimize heart rate zones",
                    "Consider heart rate-guided training"
                ],
                dataPoints: [],
                generatedAt: Date()
            ))
        }

        // Sleep vs HRV Correlation
        if !data.sleepData.isEmpty && !data.heartRateVariability.isEmpty {
            let sleepHRVCorr = calculateCorrelation(
                data.sleepData.map { $0.quality },
                data.heartRateVariability.map { $0.rmssd }
            )

            if abs(sleepHRVCorr) > 0.5 {
                insights.append(MLHealthInsight(
                    id: "correlation-sleep-hrv-\(Date().timeIntervalSince1970)",
                    type: .correlation,
                    title: "Sleep-Recovery Correlation",
                    description: "Sleep quality strongly correlates with heart rate variability (\(sleepHRVCorr, specifier: "%.2f"))",
                    severity: .low,
                    confidence: 0.80,
                    actionableRecommendations: [
                        "Prioritize sleep quality for better recovery",
                        "Track sleep patterns to optimize HRV"
                    ],
                    dataPoints: [],
                    generatedAt: Date()
                ))
            }
        }

        return insights
    }
}

// MARK: - ML Models Container

class MLModels {
    var heartRatePredictionModel: HeartRatePredictionModel?
    var activityPredictionModel: ActivityPredictionModel?
    var fallRiskPredictionModel: FallRiskPredictionModel?
    var heartRateAnomalyModel: AnomalyDetectionModel?
    var activityAnomalyModel: AnomalyDetectionModel?
    var sleepAnomalyModel: AnomalyDetectionModel?
    var gaitAnomalyModel: AnomalyDetectionModel?

    func loadAllModels() async throws {
        // In a real implementation, these would load actual Core ML models
        // For now, we'll create mock models
        heartRatePredictionModel = HeartRatePredictionModel()
        activityPredictionModel = ActivityPredictionModel()
        fallRiskPredictionModel = FallRiskPredictionModel()
        heartRateAnomalyModel = AnomalyDetectionModel(type: .heartRate)
        activityAnomalyModel = AnomalyDetectionModel(type: .activity)
        sleepAnomalyModel = AnomalyDetectionModel(type: .sleep)
        gaitAnomalyModel = AnomalyDetectionModel(type: .gait)
    }

    func getAverageAccuracy() async -> Double {
        // Return mock accuracy
        return 0.87
    }
}

// MARK: - Personalized Recommendation Engine

class PersonalizedRecommendationEngine {
    func generateRecommendations(
        for profile: UserHealthProfile,
        based data: HealthDataCollection,
        using models: MLModels
    ) async throws -> [PersonalizedRecommendation] {
        var recommendations: [PersonalizedRecommendation] = []

        // Heart Rate Zone Optimization
        if let hrRecommendation = generateHeartRateRecommendation(profile: profile, data: data) {
            recommendations.append(hrRecommendation)
        }

        // Activity Optimization
        if let activityRecommendation = generateActivityRecommendation(profile: profile, data: data) {
            recommendations.append(activityRecommendation)
        }

        // Sleep Optimization
        if let sleepRecommendation = generateSleepRecommendation(profile: profile, data: data) {
            recommendations.append(sleepRecommendation)
        }

        // Gait Improvement
        if let gaitRecommendation = generateGaitRecommendation(profile: profile, data: data) {
            recommendations.append(gaitRecommendation)
        }

        return recommendations.sorted { $0.priority.rawValue > $1.priority.rawValue }
    }

    private func generateHeartRateRecommendation(
        profile: UserHealthProfile,
        data: HealthDataCollection
    ) -> PersonalizedRecommendation? {
        let avgHeartRate = data.heartRateData.map { $0.averageRate }.reduce(0, +) / Double(data.heartRateData.count)
        let targetZone = profile.calculateOptimalHeartRateZone()

        if avgHeartRate < targetZone.lower {
            return PersonalizedRecommendation(
                id: "hr-increase-\(Date().timeIntervalSince1970)",
                title: "Increase Exercise Intensity",
                description: "Your average heart rate is below optimal training zones. Consider increasing workout intensity.",
                category: .fitness,
                priority: .medium,
                actionSteps: [
                    "Add 10-15 minutes of moderate intensity exercise daily",
                    "Try interval training to boost cardiovascular fitness",
                    "Monitor heart rate during workouts"
                ],
                expectedBenefit: "Improved cardiovascular health and fitness",
                timeToResult: "2-3 weeks",
                confidence: 0.82,
                personalizedFor: profile.id
            )
        } else if avgHeartRate > targetZone.upper {
            return PersonalizedRecommendation(
                id: "hr-decrease-\(Date().timeIntervalSince1970)",
                title: "Focus on Recovery",
                description: "Your heart rate indicates high stress or overtraining. Prioritize recovery.",
                category: .recovery,
                priority: .high,
                actionSteps: [
                    "Incorporate more rest days into your routine",
                    "Practice stress reduction techniques",
                    "Ensure adequate sleep (7-9 hours)"
                ],
                expectedBenefit: "Better recovery and reduced stress levels",
                timeToResult: "1-2 weeks",
                confidence: 0.88,
                personalizedFor: profile.id
            )
        }

        return nil
    }

    private func generateActivityRecommendation(
        profile: UserHealthProfile,
        data: HealthDataCollection
    ) -> PersonalizedRecommendation? {
        let avgSteps = data.activityData.map { $0.steps }.reduce(0, +) / data.activityData.count
        let recommendedSteps = profile.calculateRecommendedDailySteps()

        if avgSteps < recommendedSteps * 80 / 100 {
            return PersonalizedRecommendation(
                id: "activity-increase-\(Date().timeIntervalSince1970)",
                title: "Increase Daily Activity",
                description: "You're averaging \(avgSteps) steps daily. Aim for \(recommendedSteps) steps for optimal health.",
                category: .activity,
                priority: .medium,
                actionSteps: [
                    "Take a 10-minute walk after each meal",
                    "Use stairs instead of elevators",
                    "Park farther away or get off public transport one stop early",
                    "Set hourly movement reminders"
                ],
                expectedBenefit: "Improved cardiovascular health and weight management",
                timeToResult: "2-4 weeks",
                confidence: 0.85,
                personalizedFor: profile.id
            )
        }

        return nil
    }

    private func generateSleepRecommendation(
        profile: UserHealthProfile,
        data: HealthDataCollection
    ) -> PersonalizedRecommendation? {
        guard !data.sleepData.isEmpty else { return nil }

        let avgSleepQuality = data.sleepData.map { $0.quality }.reduce(0, +) / Double(data.sleepData.count)

        if avgSleepQuality < 0.7 {
            return PersonalizedRecommendation(
                id: "sleep-improve-\(Date().timeIntervalSince1970)",
                title: "Improve Sleep Quality",
                description: "Your sleep quality score is \(avgSleepQuality, specifier: "%.1f"). Let's work on improving your sleep.",
                category: .sleep,
                priority: .high,
                actionSteps: [
                    "Establish a consistent bedtime routine",
                    "Avoid screens 1 hour before bedtime",
                    "Keep your bedroom cool (65-68°F)",
                    "Limit caffeine after 2 PM",
                    "Try meditation or deep breathing before sleep"
                ],
                expectedBenefit: "Better recovery, improved mood, and enhanced cognitive function",
                timeToResult: "1-3 weeks",
                confidence: 0.90,
                personalizedFor: profile.id
            )
        }

        return nil
    }

    private func generateGaitRecommendation(
        profile: UserHealthProfile,
        data: HealthDataCollection
    ) -> PersonalizedRecommendation? {
        guard !data.gaitData.isEmpty else { return nil }

        let avgAsymmetry = data.gaitData.map { $0.asymmetry }.reduce(0, +) / Double(data.gaitData.count)

        if avgAsymmetry > 0.1 {
            return PersonalizedRecommendation(
                id: "gait-improve-\(Date().timeIntervalSince1970)",
                title: "Improve Gait Symmetry",
                description: "Your walking shows \(avgAsymmetry * 100, specifier: "%.1f")% asymmetry. Let's work on balance and coordination.",
                category: .mobility,
                priority: .high,
                actionSteps: [
                    "Practice single-leg standing exercises",
                    "Add balance training to your routine",
                    "Consider physical therapy if asymmetry persists",
                    "Perform heel-to-toe walking exercises",
                    "Strengthen your core muscles"
                ],
                expectedBenefit: "Improved balance, reduced fall risk, and better mobility",
                timeToResult: "3-6 weeks",
                confidence: 0.85,
                personalizedFor: profile.id
            )
        }

        return nil
    }
}

// MARK: - Supporting Types and Extensions

// Additional helper methods and calculations would be implemented here...
// This includes all the calculation functions referenced above like:
// - calculateStressLevel
// - calculateRecoveryLevel
// - calculateActivityConsistency
// - calculateCorrelation
// etc.

// MARK: - Mock Calculation Methods (simplified implementations)

extension VitalSenseMLHealthAnalyzer {
    private func calculateStressLevel(rmssd: Double, sdnn: Double) -> Double {
        // Simplified stress calculation based on HRV metrics
        let normalizedRMSSD = min(1.0, rmssd / 50.0)
        let normalizedSDNN = min(1.0, sdnn / 60.0)
        return 1.0 - (normalizedRMSSD + normalizedSDNN) / 2.0
    }

    private func calculateRecoveryLevel(from hrvData: ArraySlice<HeartRateVariabilityData>) -> Double {
        let trend = hrvData.enumerated().map { index, data in
            return data.rmssd * Double(index + 1) / Double(hrvData.count)
        }.reduce(0, +)
        return min(1.0, trend / 50.0)
    }

    private func calculateActivityConsistency(from activityData: ArraySlice<ActivityData>) -> Double {
        let steps = activityData.map { Double($0.steps) }
        let mean = steps.reduce(0, +) / Double(steps.count)
        let variance = steps.map { pow($0 - mean, 2) }.reduce(0, +) / Double(steps.count)
        let standardDeviation = sqrt(variance)
        return max(0.0, 1.0 - (standardDeviation / mean))
    }

    private func calculateActivityTrend(from activityData: ArraySlice<ActivityData>) -> ActivityTrendDirection {
        guard activityData.count >= 2 else { return .stable }

        let firstHalf = activityData.prefix(activityData.count / 2).map { Double($0.steps) }.reduce(0, +)
        let secondHalf = activityData.suffix(activityData.count / 2).map { Double($0.steps) }.reduce(0, +)

        let difference = (secondHalf - firstHalf) / firstHalf

        if difference > 0.1 { return .increasing }
        else if difference < -0.1 { return .decreasing }
        else { return .stable }
    }

    private func calculateSleepConsistency(from sleepData: ArraySlice<SleepData>) -> Double {
        let bedtimes = sleepData.map { $0.bedtime.timeIntervalSince1970 }
        let mean = bedtimes.reduce(0, +) / Double(bedtimes.count)
        let variance = bedtimes.map { pow($0 - mean, 2) }.reduce(0, +) / Double(bedtimes.count)
        let standardDeviation = sqrt(variance)

        // Convert to hours and normalize (consistent if within 1 hour)
        let hoursVariation = standardDeviation / 3600.0
        return max(0.0, 1.0 - hoursVariation)
    }

    private func calculateSleepEfficiency(from sleepData: ArraySlice<SleepData>) -> Double {
        return sleepData.map { $0.efficiency }.reduce(0, +) / Double(sleepData.count)
    }

    private func calculateGaitStability(from gaitData: ArraySlice<GaitData>) -> Double {
        let asymmetries = gaitData.map { $0.asymmetry }
        let avgAsymmetry = asymmetries.reduce(0, +) / Double(asymmetries.count)
        return max(0.0, 1.0 - avgAsymmetry * 5.0) // Normalize asymmetry to stability score
    }

    private func calculateFallRisk(from gaitData: ArraySlice<GaitData>) -> Double {
        let avgSpeed = gaitData.map { $0.walkingSpeed }.reduce(0, +) / Double(gaitData.count)
        let avgAsymmetry = gaitData.map { $0.asymmetry }.reduce(0, +) / Double(gaitData.count)

        // Simplified fall risk calculation
        let speedRisk = max(0.0, (1.2 - avgSpeed) / 1.2) // Risk increases as speed decreases below 1.2 m/s
        let asymmetryRisk = min(1.0, avgAsymmetry * 5.0) // Risk increases with asymmetry

        return min(1.0, (speedRisk + asymmetryRisk) / 2.0)
    }

    private func calculateCorrelation(_ x: [Double], _ y: [Double]) -> Double {
        guard x.count == y.count && x.count > 1 else { return 0.0 }

        let n = Double(x.count)
        let sumX = x.reduce(0, +)
        let sumY = y.reduce(0, +)
        let sumXY = zip(x, y).map { $0 * $1 }.reduce(0, +)
        let sumXSquared = x.map { $0 * $0 }.reduce(0, +)
        let sumYSquared = y.map { $0 * $0 }.reduce(0, +)

        let numerator = n * sumXY - sumX * sumY
        let denominator = sqrt((n * sumXSquared - sumX * sumX) * (n * sumYSquared - sumY * sumY))

        return denominator != 0 ? numerator / denominator : 0.0
    }

    // Insight description generators
    private func generateHRVInsightDescription(stress: Double, recovery: Double) -> String {
        if stress > 0.7 {
            return "Your heart rate variability indicates high stress levels. Consider incorporating stress management techniques."
        } else if recovery < 0.5 {
            return "Your recovery metrics suggest you may need more rest. Focus on sleep quality and relaxation."
        } else {
            return "Your heart rate variability shows good balance between stress and recovery."
        }
    }

    private func generateHRVRecommendations(stress: Double, recovery: Double) -> [String] {
        var recommendations: [String] = []

        if stress > 0.7 {
            recommendations.append("Practice deep breathing exercises for 10 minutes daily")
            recommendations.append("Try meditation or mindfulness activities")
            recommendations.append("Consider reducing workout intensity temporarily")
        }

        if recovery < 0.5 {
            recommendations.append("Prioritize 7-9 hours of quality sleep")
            recommendations.append("Include more rest days in your fitness routine")
            recommendations.append("Stay hydrated throughout the day")
        }

        return recommendations
    }

    private func generateActivityInsightDescription(avgSteps: Int, consistency: Double, trend: ActivityTrendDirection) -> String {
        let trendDescription = trend == .increasing ? "increasing" : (trend == .decreasing ? "decreasing" : "stable")
        let consistencyDescription = consistency > 0.7 ? "consistent" : "inconsistent"

        return "Your daily activity averages \(avgSteps) steps with \(consistencyDescription) patterns. Trend: \(trendDescription)."
    }

    private func generateActivityRecommendations(avgSteps: Int, consistency: Double, trend: ActivityTrendDirection) -> [String] {
        var recommendations: [String] = []

        if avgSteps < 8000 {
            recommendations.append("Aim for at least 8,000 steps daily")
            recommendations.append("Take short walks throughout the day")
        }

        if consistency < 0.7 {
            recommendations.append("Try to maintain consistent daily activity levels")
            recommendations.append("Set daily step goals and reminders")
        }

        return recommendations
    }

    private func generateSleepInsightDescription(avgDuration: TimeInterval, avgQuality: Double, consistency: Double) -> String {
        let hours = Int(avgDuration / 3600)
        let qualityDescription = avgQuality > 0.8 ? "excellent" : (avgQuality > 0.6 ? "good" : "poor")
        return "You're averaging \(hours) hours of \(qualityDescription) quality sleep per night."
    }

    private func generateSleepRecommendations(avgDuration: TimeInterval, avgQuality: Double, consistency: Double) -> [String] {
        var recommendations: [String] = []

        if avgDuration < 7 * 3600 {
            recommendations.append("Aim for 7-9 hours of sleep per night")
            recommendations.append("Establish a consistent bedtime routine")
        }

        if avgQuality < 0.7 {
            recommendations.append("Create a sleep-friendly environment")
            recommendations.append("Avoid screens before bedtime")
            recommendations.append("Consider relaxation techniques")
        }

        return recommendations
    }

    private func generateGaitInsightDescription(avgSpeed: Double, asymmetry: Double, stability: Double, fallRisk: Double) -> String {
        let speedDescription = avgSpeed > 1.2 ? "good" : "below average"
        let asymmetryDescription = asymmetry > 0.1 ? "high" : "normal"
        return "Walking speed is \(speedDescription) at \(avgSpeed, specifier: "%.1f") m/s. Gait asymmetry is \(asymmetryDescription) at \(asymmetry * 100, specifier: "%.1f")%."
    }

    private func generateGaitRecommendations(avgSpeed: Double, asymmetry: Double, fallRisk: Double) -> [String] {
        var recommendations: [String] = []

        if avgSpeed < 1.0 {
            recommendations.append("Work on improving walking speed through regular exercise")
            recommendations.append("Consider strength training for leg muscles")
        }

        if asymmetry > 0.1 {
            recommendations.append("Practice balance exercises daily")
            recommendations.append("Consider consulting a physical therapist")
        }

        if fallRisk > 0.3 {
            recommendations.append("Focus on fall prevention exercises")
            recommendations.append("Ensure home environment is safe")
        }

        return recommendations
    }
}
