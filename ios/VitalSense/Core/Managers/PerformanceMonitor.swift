import Foundation

// MARK: - Performance Monitor
class PerformanceMonitor {
    static let shared = PerformanceMonitor()

    private var timingData: [String: Date] = [:]
    private var metrics: [String: Double] = [:]
    private var dataPoints: [Date] = []

    private init() {}

    func startMonitoring() {
        // Start monitoring can be extended
    }

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
        let now = Date()
        dataPoints.append(now)

        // Keep only last 100 data points and remove old ones efficiently
        if dataPoints.count > 100 {
            dataPoints.removeFirst(dataPoints.count - 100)
        }

        // Also remove points older than 5 minutes to prevent unbounded growth
        let fiveMinutesAgo = now.addingTimeInterval(-300)
        if let firstValidIndex = dataPoints.firstIndex(where: { $0 > fiveMinutesAgo }) {
            if firstValidIndex > 0 {
                dataPoints.removeFirst(firstValidIndex)
            }
        } else {
            // All points are old, keep only the most recent
            dataPoints = [now]
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

        // Use binary search to find first valid point (more efficient than filter)
        // Since dataPoints are append-only (chronological), find first point after threshold
        var validCount = 0
        for point in dataPoints.reversed() {
            if point > oneMinuteAgo {
                validCount += 1
            } else {
                break // No need to continue since points are chronological
            }
        }

        return Double(validCount)
    }
}
