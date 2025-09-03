import Foundation
import HealthKit
import SwiftUI

// MARK: - Advanced Health Analytics Engine
class AdvancedHealthAnalytics: ObservableObject {
    static let shared = AdvancedHealthAnalytics()
    
    @Published var insights: [HealthInsight] = []
    @Published var trends: [HealthTrend] = []
    @Published var predictions: [HealthPrediction] = []
    @Published var correlations: [HealthCorrelation] = []
    
    private let healthStore = HKHealthStore()
    private init() {}
    
    func generateComprehensiveAnalysis() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.analyzeHeartRatePatterns() }
            group.addTask { await self.analyzeActivityPatterns() }
            group.addTask { await self.analyzeSleepQuality() }
            group.addTask { await self.generateHealthPredictions() }
            group.addTask { await self.findHealthCorrelations() }
        }
    }
    
    private func analyzeHeartRatePatterns() async {
        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else { return }
        
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: true)]
            ) { [weak self] query, samples, error in
                defer { continuation.resume() }
                
                guard let samples = samples as? [HKQuantitySample] else { return }
                
                let heartRates = samples.map { sample in
                    HeartRatePoint(
                        value: sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())),
                        date: sample.endDate
                    )
                }
                
                let insights = self?.analyzeHeartRateData(heartRates) ?? []
                
                DispatchQueue.main.async {
                    self?.insights.append(contentsOf: insights)
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func analyzeHeartRateData(_ data: [HeartRatePoint]) -> [HealthInsight] {
        var insights: [HealthInsight] = []
        
        // Analyze resting heart rate trends
        let restingHR = data.filter { Calendar.current.component(.hour, from: $0.date) >= 22 || Calendar.current.component(.hour, from: $0.date) <= 6 }
        
        if restingHR.count > 7 {
            let recentWeek = Array(restingHR.suffix(7))
            let previousWeek = Array(restingHR.dropLast(7).suffix(7))
            
            let recentAvg = recentWeek.map(\.value).reduce(0, +) / Double(recentWeek.count)
            let previousAvg = previousWeek.map(\.value).reduce(0, +) / Double(previousWeek.count)
            
            let change = recentAvg - previousAvg
            
            if abs(change) > 3 {
                insights.append(HealthInsight(
                    type: .heartRate,
                    title: "Resting Heart Rate Change",
                    description: "Your resting heart rate has \(change > 0 ? "increased" : "decreased") by \(String(format: "%.1f", abs(change))) BPM this week",
                    severity: abs(change) > 5 ? .high : .medium,
                    recommendations: change > 0 ? ["Consider stress management", "Ensure adequate sleep", "Review medication timing"] : ["Great improvement! Keep up current habits"],
                    date: Date()
                ))
            }
        }
        
        // Analyze heart rate variability patterns
        let weeklyPatterns = analyzeWeeklyPatterns(data)
        if let pattern = weeklyPatterns {
            insights.append(pattern)
        }
        
        return insights
    }
    
    private func analyzeWeeklyPatterns(_ data: [HeartRatePoint]) -> HealthInsight? {
        let grouped = Dictionary(grouping: data) { Calendar.current.component(.weekday, from: $0.date) }
        
        var dayAverages: [Int: Double] = [:]
        for (weekday, points) in grouped {
            dayAverages[weekday] = points.map(\.value).reduce(0, +) / Double(points.count)
        }
        
        guard dayAverages.count >= 5 else { return nil }
        
        let sortedAverages = dayAverages.sorted { $0.key < $1.key }
        let values = sortedAverages.map(\.value)
        let variance = calculateVariance(values)
        
        if variance > 50 { // High variability between days
            return HealthInsight(
                type: .pattern,
                title: "Weekly Heart Rate Pattern",
                description: "Your heart rate varies significantly between days of the week",
                severity: .medium,
                recommendations: ["Maintain consistent sleep schedule", "Consider weekly stress patterns", "Monitor workload balance"],
                date: Date()
            )
        }
        
        return nil
    }
    
    private func analyzeActivityPatterns() async {
        // Analyze step patterns, workout frequency, etc.
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        
        let thirtyDaysAgo = Calendar.current.date(byAdding: .day, value: -30, to: Date())!
        let predicate = HKQuery.predicateForSamples(withStart: thirtyDaysAgo, end: Date())
        
        await withCheckedContinuation { continuation in
            let query = HKStatisticsCollectionQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum,
                anchorDate: Date(),
                intervalComponents: DateComponents(day: 1)
            )
            
            query.initialResultsHandler = { [weak self] query, results, error in
                defer { continuation.resume() }
                
                guard let results = results else { return }
                
                var dailySteps: [DailyStepData] = []
                results.enumerateStatistics(from: thirtyDaysAgo, to: Date()) { statistics, stop in
                    if let quantity = statistics.sumQuantity() {
                        dailySteps.append(DailyStepData(
                            date: statistics.startDate,
                            steps: Int(quantity.doubleValue(for: .count()))
                        ))
                    }
                }
                
                let insights = self?.analyzeActivityData(dailySteps) ?? []
                
                DispatchQueue.main.async {
                    self?.insights.append(contentsOf: insights)
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    private func analyzeActivityData(_ data: [DailyStepData]) -> [HealthInsight] {
        var insights: [HealthInsight] = []
        
        // Analyze step count trends
        if data.count >= 14 {
            let recentWeek = Array(data.suffix(7))
            let previousWeek = Array(data.dropLast(7).suffix(7))
            
            let recentAvg = Double(recentWeek.map(\.steps).reduce(0, +)) / 7.0
            let previousAvg = Double(previousWeek.map(\.steps).reduce(0, +)) / 7.0
            
            let percentChange = ((recentAvg - previousAvg) / previousAvg) * 100
            
            if abs(percentChange) > 15 {
                insights.append(HealthInsight(
                    type: .activity,
                    title: "Activity Level Change",
                    description: "Your daily steps have \(percentChange > 0 ? "increased" : "decreased") by \(String(format: "%.0f", abs(percentChange)))% this week",
                    severity: percentChange < -25 ? .high : .low,
                    recommendations: percentChange > 0 ? ["Great progress! Consider setting new goals"] : ["Try to increase daily movement", "Set reminders to walk", "Consider indoor activities"],
                    date: Date()
                ))
            }
        }
        
        // Analyze consistency
        let stepCounts = data.map(\.steps)
        let variance = calculateVariance(stepCounts.map(Double.init))
        let average = Double(stepCounts.reduce(0, +)) / Double(stepCounts.count)
        let coefficientOfVariation = sqrt(variance) / average
        
        if coefficientOfVariation > 0.5 {
            insights.append(HealthInsight(
                type: .consistency,
                title: "Activity Consistency",
                description: "Your daily activity levels vary significantly",
                severity: .medium,
                recommendations: ["Aim for more consistent daily activity", "Set minimum daily step goals", "Plan regular exercise schedule"],
                date: Date()
            ))
        }
        
        return insights
    }
    
    private func analyzeSleepQuality() async {
        // Implement sleep analysis if sleep data is available
    }
    
    private func generateHealthPredictions() async {
        // Generate predictions based on current trends
        let currentTrends = trends
        var predictions: [HealthPrediction] = []
        
        // Example: Predict heart rate trends
        if let heartRateTrend = currentTrends.first(where: { $0.type == .heartRate }) {
            let prediction = HealthPrediction(
                type: .heartRate,
                timeframe: .oneMonth,
                prediction: "Based on current trends, your average heart rate may \(heartRateTrend.direction == .improving ? "continue to improve" : "need attention")",
                confidence: heartRateTrend.consistency > 0.7 ? .high : .medium,
                date: Date()
            )
            predictions.append(prediction)
        }
        
        DispatchQueue.main.async {
            self.predictions = predictions
        }
    }
    
    private func findHealthCorrelations() async {
        // Find correlations between different health metrics
        // This would require more complex statistical analysis
    }
    
    private func calculateVariance(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        
        let mean = values.reduce(0, +) / Double(values.count)
        let squaredDifferences = values.map { pow($0 - mean, 2) }
        return squaredDifferences.reduce(0, +) / Double(values.count)
    }
}

// MARK: - Data Models
struct HealthInsight: Identifiable {
    let id = UUID()
    let type: InsightType
    let title: String
    let description: String
    let severity: Severity
    let recommendations: [String]
    let date: Date
    
    enum InsightType {
        case heartRate, activity, sleep, nutrition, pattern, consistency
    }
    
    enum Severity {
        case low, medium, high
        
        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .orange
            case .high: return .red
            }
        }
    }
}

struct HealthTrend: Identifiable {
    let id = UUID()
    let type: TrendType
    let direction: Direction
    let consistency: Double // 0-1 scale
    let significance: Double // 0-1 scale
    
    enum TrendType {
        case heartRate, activity, sleep, weight
    }
    
    enum Direction {
        case improving, declining, stable
    }
}

struct HealthPrediction: Identifiable {
    let id = UUID()
    let type: PredictionType
    let timeframe: Timeframe
    let prediction: String
    let confidence: Confidence
    let date: Date
    
    enum PredictionType {
        case heartRate, activity, sleep, weight
    }
    
    enum Timeframe {
        case oneWeek, oneMonth, threeMonths
    }
    
    enum Confidence {
        case low, medium, high
    }
}

struct HealthCorrelation: Identifiable {
    let id = UUID()
    let metric1: String
    let metric2: String
    let correlation: Double // -1 to 1
    let significance: Double // 0-1 scale
}

struct HeartRatePoint {
    let value: Double
    let date: Date
}

struct DailyStepData {
    let date: Date
    let steps: Int
}
