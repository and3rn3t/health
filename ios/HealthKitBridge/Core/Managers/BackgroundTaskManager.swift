import Foundation
import BackgroundTasks
import UIKit

// MARK: - Background Task Manager
class BackgroundTaskManager: ObservableObject {
    static let shared = BackgroundTaskManager()
    
    @Published var backgroundRefreshStatus: UIBackgroundRefreshStatus = .avail        return hourlyActivity.compactMap { hour, count in
            return Double(count) >= threshold ? hour : nil
        }.sorted()
    }
}

// MARK: - Gait Monitoring Background Task
extension BackgroundTaskManager {
    private func scheduleGaitMonitoring() {
        let request = BGAppRefreshTaskRequest(identifier: gaitMonitoringIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Gait monitoring background task scheduled")
        } catch {
            print("❌ Failed to schedule gait monitoring task: \(error)")
        }
    }
    
    private func handleGaitMonitoring(task: BGAppRefreshTask) {
        print("🏃‍♂️ Background gait monitoring task started")
        
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        
        let gaitOperation = BlockOperation {
            Task {
                // Fetch recent gait data
                await FallRiskGaitManager.shared.fetchGaitMetrics()
                
                // Perform fall risk assessment
                await FallRiskGaitManager.shared.assessFallRisk()
                
                // Update daily mobility trends
                await FallRiskGaitManager.shared.updateDailyMobilityTrends()
                
                await MainActor.run {
                    self.lastBackgroundUpdate = Date()
                    self.backgroundTasksExecuted += 1
                }
            }
        }
        
        task.expirationHandler = {
            queue.cancelAllOperations()
        }
        
        gaitOperation.completionBlock = {
            task.setTaskCompleted(success: !gaitOperation.isCancelled)
            
            // Schedule next gait monitoring
            self.scheduleGaitMonitoring()
        }
        
        queue.addOperation(gaitOperation)
    }
}
    @Published var lastBackgroundUpdate: Date?
    @Published var backgroundTasksExecuted: Int = 0
    
    private let healthDataSyncIdentifier = "com.healthkitbridge.healthsync"
    private let analyticsProcessingIdentifier = "com.healthkitbridge.analytics"
    private let gaitMonitoringIdentifier = "com.healthkitbridge.gaitmonitoring"
    
    private init() {
        registerBackgroundTasks()
        checkBackgroundRefreshStatus()
    }
    
    private func registerBackgroundTasks() {
        // Register background app refresh task
        BGTaskScheduler.shared.register(forTaskWithIdentifier: healthDataSyncIdentifier, using: nil) { task in
            self.handleHealthDataSync(task: task as! BGAppRefreshTask)
        }
        
        // Register background processing task
        BGTaskScheduler.shared.register(forTaskWithIdentifier: analyticsProcessingIdentifier, using: nil) { task in
            self.handleAnalyticsProcessing(task: task as! BGProcessingTask)
        }
        
        // Register gait monitoring background task
        BGTaskScheduler.shared.register(forTaskWithIdentifier: gaitMonitoringIdentifier, using: nil) { task in
            self.handleGaitMonitoring(task: task as! BGAppRefreshTask)
        }
    }
    
    private func checkBackgroundRefreshStatus() {
        backgroundRefreshStatus = UIApplication.shared.backgroundRefreshStatus
        
        NotificationCenter.default.addObserver(
            forName: UIApplication.backgroundRefreshStatusDidChangeNotification,
            object: nil,
            queue: .main
        ) { _ in
            self.backgroundRefreshStatus = UIApplication.shared.backgroundRefreshStatus
        }
    }
    
    func scheduleBackgroundTasks() {
        scheduleHealthDataSync()
        scheduleAnalyticsProcessing()
        scheduleGaitMonitoring()
    }
    
    private func scheduleHealthDataSync() {
        let request = BGAppRefreshTaskRequest(identifier: healthDataSyncIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Background health sync scheduled")
        } catch {
            print("❌ Failed to schedule background health sync: \(error)")
        }
    }
    
    private func scheduleAnalyticsProcessing() {
        let request = BGProcessingTaskRequest(identifier: analyticsProcessingIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60) // 1 hour
        request.requiresNetworkConnectivity = false
        request.requiresExternalPower = false
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Background analytics processing scheduled")
        } catch {
            print("❌ Failed to schedule background analytics: \(error)")
        }
    }
    
    private func handleHealthDataSync(task: BGAppRefreshTask) {
        print("🔄 Executing background health data sync")
        
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        
        let syncOperation = HealthDataSyncOperation()
        
        task.expirationHandler = {
            queue.cancelAllOperations()
        }
        
        syncOperation.completionBlock = {
            DispatchQueue.main.async {
                self.lastBackgroundUpdate = Date()
                self.backgroundTasksExecuted += 1
            }
            
            task.setTaskCompleted(success: !syncOperation.isCancelled)
            
            // Schedule next sync
            self.scheduleHealthDataSync()
        }
        
        queue.addOperation(syncOperation)
    }
    
    private func handleAnalyticsProcessing(task: BGProcessingTask) {
        print("📊 Executing background analytics processing")
        
        let queue = OperationQueue()
        queue.maxConcurrentOperationCount = 1
        
        let analyticsOperation = AnalyticsProcessingOperation()
        
        task.expirationHandler = {
            queue.cancelAllOperations()
        }
        
        analyticsOperation.completionBlock = {
            task.setTaskCompleted(success: !analyticsOperation.isCancelled)
            
            // Schedule next processing
            self.scheduleAnalyticsProcessing()
        }
        
        queue.addOperation(analyticsOperation)
    }
}

// MARK: - Background Operations
class HealthDataSyncOperation: Operation {
    override func main() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        
        Task {
            defer { semaphore.signal() }
            
            // Fetch latest health data
            let healthManager = HealthKitManager.shared
            await healthManager.fetchAllHealthData()
            
            // Sync with server if connected
            let webSocketManager = WebSocketManager.shared
            if webSocketManager.isConnected {
                await healthManager.sendAllHealthData()
            } else {
                // Queue for later sync
                let offlineManager = OfflineDataSyncManager.shared
                // Implementation would depend on your existing data structure
            }
        }
        
        semaphore.wait()
    }
}

class AnalyticsProcessingOperation: Operation {
    override func main() {
        guard !isCancelled else { return }
        
        let semaphore = DispatchSemaphore(value: 0)
        
        Task {
            defer { semaphore.signal() }
            
            // Process analytics in background
            let analytics = AdvancedHealthAnalytics.shared
            await analytics.generateComprehensiveAnalysis()
            
            // Update cache
            let cacheManager = DataCacheManager.shared
            await cacheManager.updateAnalyticsCache()
        }
        
        semaphore.wait()
    }
}

// MARK: - Smart Scheduling Manager
class SmartSchedulingManager: ObservableObject {
    static let shared = SmartSchedulingManager()
    
    @Published var optimalSyncTimes: [Date] = []
    @Published var userActivityPattern: ActivityPattern?
    
    private let userDefaults = UserDefaults.standard
    private let activityKey = "user_activity_pattern"
    
    private init() {
        loadActivityPattern()
        analyzeOptimalTimes()
    }
    
    func recordUserActivity() {
        let now = Date()
        let hour = Calendar.current.component(.hour, from: now)
        let weekday = Calendar.current.component(.weekday, from: now)
        
        var pattern = userActivityPattern ?? ActivityPattern()
        pattern.recordActivity(hour: hour, weekday: weekday)
        
        userActivityPattern = pattern
        saveActivityPattern()
        analyzeOptimalTimes()
    }
    
    private func analyzeOptimalTimes() {
        guard let pattern = userActivityPattern else { return }
        
        // Find times when user is typically active but not peak usage
        let optimalHours = pattern.getOptimalSyncHours()
        
        // Generate next week's optimal sync times
        var times: [Date] = []
        let calendar = Calendar.current
        
        for day in 1...7 {
            if let futureDate = calendar.date(byAdding: .day, value: day, to: Date()) {
                for hour in optimalHours {
                    if let syncTime = calendar.date(bySettingHour: hour, minute: 0, second: 0, of: futureDate) {
                        times.append(syncTime)
                    }
                }
            }
        }
        
        optimalSyncTimes = times
    }
    
    private func saveActivityPattern() {
        if let pattern = userActivityPattern,
           let data = try? JSONEncoder().encode(pattern) {
            userDefaults.set(data, forKey: activityKey)
        }
    }
    
    private func loadActivityPattern() {
        if let data = userDefaults.data(forKey: activityKey),
           let pattern = try? JSONDecoder().decode(ActivityPattern.self, from: data) {
            userActivityPattern = pattern
        }
    }
}

// MARK: - Activity Pattern Model
struct ActivityPattern: Codable {
    private var hourlyActivity: [Int: Int] = [:] // hour: count
    private var weekdayActivity: [Int: Int] = [:] // weekday: count
    
    mutating func recordActivity(hour: Int, weekday: Int) {
        hourlyActivity[hour, default: 0] += 1
        weekdayActivity[weekday, default: 0] += 1
    }
    
    func getOptimalSyncHours() -> [Int] {
        // Find hours with moderate activity (not peak, not dead)
        let totalActivity = hourlyActivity.values.reduce(0, +)
        guard totalActivity > 0 else { return [2, 14, 22] } // Default times
        
        let averageActivity = Double(totalActivity) / Double(hourlyActivity.count)
        
        return hourlyActivity.compactMap { hour, count in
            let activityLevel = Double(count) / averageActivity
            // Select hours with 30-70% of average activity
            return (0.3...0.7).contains(activityLevel) ? hour : nil
        }.sorted()
    }
    
    func getPeakActivityHours() -> [Int] {
        let maxActivity = hourlyActivity.values.max() ?? 0
        let threshold = Double(maxActivity) * 0.8
        
        return hourlyActivity.compactMap { hour, count in
            Double(count) >= threshold ? hour : nil
        }.sorted()
    }
}
