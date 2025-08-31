import Foundation

// MARK: - Performance Monitor
class PerformanceMonitor {
    private var timingData: [String: Date] = [:]
    private var metrics: [String: Double] = [:]
    private var dataPoints: [Date] = []
    
    func startTiming(_ operation: String) {
        timingData[operation] = Date()
    }
    
    func endTiming(_ operation: String) {
        guard let startTime = timingData[operation] else {
            return
        }
        let duration = Date().timeIntervalSince(startTime)
        metrics[operation] = duration
        timingData.removeValue(forKey: operation)
        
        if EnhancedAppConfig.shared.shouldLogDebugInfo() {
            print("⏱️ \(operation): \(String(format: "%.3f", duration))s")
        }
    }
    
    func recordDataPoint() {
        dataPoints.append(Date())
        
        // Keep only last 100 data points
        if dataPoints.count > 100 {
            dataPoints.removeFirst()
        }
    }
    
    func getMetrics() -> [String: Double] {
        metrics
    }
    
    func getDataPointRate() -> Double {
        guard dataPoints.count > 1 else {
            return 0.0
        }
        
        let now = Date()
        let oneMinuteAgo = now.addingTimeInterval(-60)
        let recentPoints = dataPoints.filter { $0 > oneMinuteAgo }
        
        return Double(recentPoints.count)
    }
}
