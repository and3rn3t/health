import Foundation
import HealthKit

// MARK: - Data Cache Manager
// Optimizes health data retrieval and reduces redundant HealthKit queries

class DataCacheManager: ObservableObject {
    static let shared = DataCacheManager()
    
    private struct CachedHealthData {
        let value: Double
        let unit: String
        let timestamp: Date
        let expiryTime: Date
    }
    
    private var cache: [String: CachedHealthData] = [:]
    private let cacheExpiryDuration: TimeInterval = 30 // 30 seconds
    private let maxCacheSize = 100
    
    private init() {}
    
    func cacheHealthData(type: String, value: Double, unit: String) {
        let now = Date()
        let cached = CachedHealthData(
            value: value,
            unit: unit,
            timestamp: now,
            expiryTime: now.addingTimeInterval(cacheExpiryDuration)
        )
        
        cache[type] = cached
        
        // Clean old entries if cache gets too large
        if cache.count > maxCacheSize {
            cleanExpiredEntries()
        }
    }
    
    func getCachedData(type: String) -> (value: Double, unit: String, timestamp: Date)? {
        guard let cached = cache[type],
              cached.expiryTime > Date() else {
            return nil
        }
        
        return (cached.value, cached.unit, cached.timestamp)
    }
    
    func isCacheValid(type: String) -> Bool {
        guard let cached = cache[type] else { return false }
        return cached.expiryTime > Date()
    }
    
    private func cleanExpiredEntries() {
        let now = Date()
        cache = cache.filter { $0.value.expiryTime > now }
    }
    
    func clearCache() {
        cache.removeAll()
    }
    
    func getCacheStatistics() -> (entries: Int, hitRate: Double) {
        // Could be extended to track hit/miss rates
        return (cache.count, 0.0)
    }
}