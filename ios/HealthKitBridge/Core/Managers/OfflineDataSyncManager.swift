import Foundation

// MARK: - Offline Data Sync Manager
// Handles data queuing when offline and batch sync when connection is restored

class OfflineDataSyncManager: ObservableObject {
    static let shared = OfflineDataSyncManager()
    
    @Published var queuedDataCount: Int = 0
    @Published var isSyncing: Bool = false
    @Published var lastSyncTime: Date?
    
    private var dataQueue: [HealthData] = []
    private let maxQueueSize = 1000
    private let batchSize = 50
    private let userDefaults = UserDefaults.standard
    private let queueKey = "health_data_queue"
    
    private init() {
        loadQueueFromStorage()
    }
    
    func queueHealthData(_ data: HealthData) {
        dataQueue.append(data)
        queuedDataCount = dataQueue.count
        
        // Prevent memory issues with very large queues
        if dataQueue.count > maxQueueSize {
            dataQueue.removeFirst(dataQueue.count - maxQueueSize)
            queuedDataCount = dataQueue.count
        }
        
        saveQueueToStorage()
        print("📦 Queued health data. Queue size: \(queuedDataCount)")
    }
    
    func syncQueuedData(webSocketManager: WebSocketManager) async {
        guard !dataQueue.isEmpty && !isSyncing else { return }
        
        await MainActor.run {
            isSyncing = true
        }
        
        print("🔄 Starting sync of \(dataQueue.count) queued items...")
        
        var syncedCount = 0
        var failedCount = 0
        
        // Process in batches
        while !dataQueue.isEmpty {
            let batch = Array(dataQueue.prefix(batchSize))
            dataQueue.removeFirst(min(batchSize, dataQueue.count))
            
            for data in batch {
                do {
                    try await webSocketManager.sendHealthData(data)
                    syncedCount += 1
                } catch {
                    // Re-queue failed items
                    dataQueue.insert(data, at: 0)
                    failedCount += 1
                    print("❌ Failed to sync data: \(error)")
                    break // Stop batch on first failure
                }
            }
            
            // Update UI
            await MainActor.run {
                queuedDataCount = dataQueue.count
            }
            
            // Brief pause between batches to prevent overwhelming the server
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }
        
        await MainActor.run {
            isSyncing = false
            lastSyncTime = Date()
        }
        
        saveQueueToStorage()
        print("✅ Sync completed. Synced: \(syncedCount), Failed: \(failedCount), Remaining: \(queuedDataCount)")
    }
    
    private func saveQueueToStorage() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(dataQueue)
            userDefaults.set(data, forKey: queueKey)
        } catch {
            print("❌ Failed to save queue to storage: \(error)")
        }
    }
    
    private func loadQueueFromStorage() {
        guard let data = userDefaults.data(forKey: queueKey) else { return }
        
        do {
            let decoder = JSONDecoder()
            dataQueue = try decoder.decode([HealthData].self, from: data)
            queuedDataCount = dataQueue.count
            print("📱 Loaded \(queuedDataCount) items from storage")
        } catch {
            print("❌ Failed to load queue from storage: \(error)")
        }
    }
    
    func clearQueue() {
        dataQueue.removeAll()
        queuedDataCount = 0
        saveQueueToStorage()
    }
    
    func getQueueStatistics() -> (oldest: Date?, newest: Date?, size: Int) {
        guard !dataQueue.isEmpty else {
            return (nil, nil, 0)
        }
        
        let timestamps = dataQueue.map { $0.timestamp }
        return (
            oldest: timestamps.min(),
            newest: timestamps.max(),
            size: dataQueue.count
        )
    }
}