import Foundation
import HealthKit

// MARK: - Health Analytics Engine
// Provides insights, trends, and anomaly detection for health data

class HealthAnalyticsEngine: ObservableObject {
    static let shared = HealthAnalyticsEngine()
    
    @Published var heartRateTrend: TrendDirection = .stable
    @Published var stepsTrend: TrendDirection = .stable
    @Published var energyTrend: TrendDirection = .stable
    @Published var anomalies: [HealthAnomaly] = []
    @Published var dailySummary: DailySummary?
    
    enum TrendDirection: String, CaseIterable {
        case increasing = "↗️"
        case decreasing = "↘️"
        case stable = "➡️"
        case unknown = "❓"
    }
    
    struct HealthAnomaly {
        let type: String
        let value: Double
        let expectedRange: ClosedRange<Double>
        let timestamp: Date
        let severity: Severity
        
        enum Severity {
            case low, medium, high
        }
    }
    
    struct DailySummary {
        let date: Date
        let totalSteps: Int
        let avgHeartRate: Double
        let activeMinutes: Int
        let caloriesBurned: Double
        let distanceWalked: Double
        let healthScore: Double // 0-100
    }
    
    private var heartRateHistory: [Double] = []
    private var stepsHistory: [Double] = []
    private var energyHistory: [Double] = []
    private let maxHistorySize = 50
    
    private init() {}
    
    func analyzeHealthData(heartRate: Double?, steps: Double?, energy: Double?) {
        if let hr = heartRate {
            addToHistory(&heartRateHistory, value: hr)
            heartRateTrend = calculateTrend(heartRateHistory)
            checkHeartRateAnomalies(hr)
        }
        
        if let s = steps {
            addToHistory(&stepsHistory, value: s)
            stepsTrend = calculateTrend(stepsHistory)
        }
        
        if let e = energy {
            addToHistory(&energyHistory, value: e)
            energyTrend = calculateTrend(energyHistory)
        }
        
        updateDailySummary()
    }
    
    private func addToHistory(_ history: inout [Double], value: Double) {
        history.append(value)
        if history.count > maxHistorySize {
            history.removeFirst()
        }
    }
    
    private func calculateTrend(_ data: [Double]) -> TrendDirection {
        guard data.count >= 3 else { return .unknown }
        
        let recent = Array(data.suffix(5))
        let older = Array(data.dropLast(5).suffix(5))
        
        guard !recent.isEmpty && !older.isEmpty else { return .stable }
        
        let recentAvg = recent.reduce(0, +) / Double(recent.count)
        let olderAvg = older.reduce(0, +) / Double(older.count)
        
        let percentChange = (recentAvg - olderAvg) / olderAvg * 100
        
        if percentChange > 5 { return .increasing }
        if percentChange < -5 { return .decreasing }
        return .stable
    }
    
    private func checkHeartRateAnomalies(_ heartRate: Double) {
        // Age-based normal ranges (simplified)
        let normalRange: ClosedRange<Double> = 60...100
        
        if !normalRange.contains(heartRate) {
            let anomaly = HealthAnomaly(
                type: "Heart Rate",
                value: heartRate,
                expectedRange: normalRange,
                timestamp: Date(),
                severity: heartRate > 120 || heartRate < 50 ? .high : .medium
            )
            
            // Add anomaly if not duplicate
            if !anomalies.contains(where: { 
                $0.type == anomaly.type && 
                abs($0.timestamp.timeIntervalSince(anomaly.timestamp)) < 300 
            }) {
                anomalies.append(anomaly)
                
                // Keep only recent anomalies
                anomalies = Array(anomalies.suffix(10))
            }
        }
    }
    
    private func updateDailySummary() {
        let today = Calendar.current.startOfDay(for: Date())
        
        // Calculate health score based on available data
        var score: Double = 50 // Base score
        
        if !heartRateHistory.isEmpty {
            let avgHR = heartRateHistory.reduce(0, +) / Double(heartRateHistory.count)
            if (60...90).contains(avgHR) { score += 20 }
        }
        
        if !stepsHistory.isEmpty {
            let totalSteps = stepsHistory.last ?? 0
            if totalSteps >= 10000 { score += 20 }
            else if totalSteps >= 5000 { score += 10 }
        }
        
        if !energyHistory.isEmpty {
            let totalEnergy = energyHistory.reduce(0, +)
            if totalEnergy >= 400 { score += 10 }
        }
        
        dailySummary = DailySummary(
            date: today,
            totalSteps: Int(stepsHistory.last ?? 0),
            avgHeartRate: heartRateHistory.isEmpty ? 0 : heartRateHistory.reduce(0, +) / Double(heartRateHistory.count),
            activeMinutes: Int(energyHistory.count * 5), // Rough estimate
            caloriesBurned: energyHistory.reduce(0, +),
            distanceWalked: Double(stepsHistory.last ?? 0) * 0.0008, // Rough km conversion
            healthScore: min(100, max(0, score))
        )
    }
    
    func getInsightMessage() -> String {
        guard let summary = dailySummary else { return "Collecting health data..." }
        
        var insights: [String] = []
        
        if summary.healthScore >= 80 {
            insights.append("🎉 Excellent health metrics today!")
        } else if summary.healthScore >= 60 {
            insights.append("👍 Good health activity today")
        } else {
            insights.append("💪 Room for improvement in activity")
        }
        
        if heartRateTrend == .increasing {
            insights.append("📈 Heart rate trending up")
        }
        
        if summary.totalSteps >= 10000 {
            insights.append("🚶‍♂️ Great step count!")
        }
        
        if !anomalies.isEmpty {
            insights.append("⚠️ \(anomalies.count) anomal\(anomalies.count == 1 ? "y" : "ies") detected")
        }
        
        return insights.isEmpty ? "Keep up the good work!" : insights.joined(separator: " • ")
    }
    
    func clearAnomalies() {
        anomalies.removeAll()
    }
}