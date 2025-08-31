import Foundation

// MARK: - Enhanced Configuration Manager
// Provides environment-specific settings and performance optimizations

class EnhancedAppConfig {
    static let shared = EnhancedAppConfig()
    
    // Environment types
    enum Environment: String, CaseIterable {
        case development
        case staging
        case production
        case testing
    }
    
    // Current environment
    private let currentEnvironment: Environment
    
    // Configuration properties
    let userId: String
    let apiBaseURL: String
    let webSocketURL: String
    let enableDebugLogging: Bool
    let mockHealthData: Bool
    let autoReconnect: Bool
    let connectionTimeout: TimeInterval
    let healthDataBatchSize: Int
    let dataSyncInterval: TimeInterval
    let enablePerformanceMonitoring: Bool
    let showConnectionStats: Bool
    let maxRetryAttempts: Int
    
    private init() {
        // Determine environment from build configuration or plist
        if let envString = Bundle.main.object(forInfoDictionaryKey: "Environment") as? String,
           let env = Environment(rawValue: envString) {
            currentEnvironment = env
        } else {
            #if DEBUG
            currentEnvironment = .development
            #else
            currentEnvironment = .production
            #endif
        }
        
        // Load environment-specific configuration
        let config = Self.loadConfiguration(for: currentEnvironment)
        
        // Apply configuration
        self.userId = config["userId"] as? String ?? "default-user-\(UUID().uuidString)"
        self.apiBaseURL = config["apiBaseURL"] as? String ?? "https://api.andernet.dev"
        self.webSocketURL = config["webSocketURL"] as? String ?? "wss://api.andernet.dev/ws"
        self.enableDebugLogging = config["enableDebugLogging"] as? Bool ?? false
        self.mockHealthData = config["mockHealthData"] as? Bool ?? false
        self.autoReconnect = config["autoReconnect"] as? Bool ?? true
        self.connectionTimeout = config["connectionTimeout"] as? TimeInterval ?? 10.0
        self.healthDataBatchSize = config["healthDataBatchSize"] as? Int ?? 50
        self.dataSyncInterval = config["dataSyncInterval"] as? TimeInterval ?? 5.0
        self.enablePerformanceMonitoring = config["enablePerformanceMonitoring"] as? Bool ?? false
        self.showConnectionStats = config["showConnectionStats"] as? Bool ?? false
        self.maxRetryAttempts = config["maxRetryAttempts"] as? Int ?? 3
        
        print("🔧 Enhanced Config loaded for \(currentEnvironment.rawValue):")
        print("   User ID: \(userId)")
        print("   API Base URL: \(apiBaseURL)")
        print("   WebSocket URL: \(webSocketURL)")
        print("   Debug Logging: \(enableDebugLogging)")
        print("   Mock Data: \(mockHealthData)")
        print("   Performance Monitoring: \(enablePerformanceMonitoring)")
    }
    
    private static func loadConfiguration(for environment: Environment) -> [String: Any] {
        // Try to load from Config.plist first
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let plist = NSDictionary(contentsOfFile: path) {
            
            // Check for environment-specific section
            if let envConfig = plist[environment.rawValue] as? [String: Any] {
                return envConfig
            }
            
            // Fallback to root level config
            return plist as? [String: Any] ?? [:]
        }
        
        // Fallback to environment-specific defaults
        return defaultConfiguration(for: environment)
    }
    
    private static func defaultConfiguration(for environment: Environment) -> [String: Any] {
        switch environment {
        case .development:
            return [
                "apiBaseURL": "http://localhost:3000/api",
                "webSocketURL": "ws://localhost:8080/ws",
                "enableDebugLogging": true,
                "mockHealthData": true,
                "autoReconnect": true,
                "connectionTimeout": 5.0,
                "healthDataBatchSize": 10,
                "dataSyncInterval": 2.0,
                "enablePerformanceMonitoring": true,
                "showConnectionStats": true,
                "maxRetryAttempts": 3
            ]
            
        case .staging:
            return [
                "apiBaseURL": "https://staging-api.andernet.dev/api",
                "webSocketURL": "wss://staging-api.andernet.dev/ws",
                "enableDebugLogging": true,
                "mockHealthData": false,
                "autoReconnect": true,
                "connectionTimeout": 8.0,
                "healthDataBatchSize": 25,
                "dataSyncInterval": 3.0,
                "enablePerformanceMonitoring": true,
                "showConnectionStats": true,
                "maxRetryAttempts": 4
            ]
            
        case .production:
            return [
                "apiBaseURL": "https://api.andernet.dev/api",
                "webSocketURL": "wss://api.andernet.dev/ws",
                "enableDebugLogging": false,
                "mockHealthData": false,
                "autoReconnect": true,
                "connectionTimeout": 10.0,
                "healthDataBatchSize": 50,
                "dataSyncInterval": 5.0,
                "enablePerformanceMonitoring": false,
                "showConnectionStats": false,
                "maxRetryAttempts": 5
            ]
            
        case .testing:
            return [
                "apiBaseURL": "http://test-server:3000/api",
                "webSocketURL": "ws://test-server:8080/ws",
                "enableDebugLogging": true,
                "mockHealthData": true,
                "autoReconnect": false,
                "connectionTimeout": 1.0,
                "healthDataBatchSize": 5,
                "dataSyncInterval": 0.5,
                "enablePerformanceMonitoring": true,
                "showConnectionStats": true,
                "maxRetryAttempts": 1
            ]
        }
    }
    
    // MARK: - Performance Optimization Methods
    
    func shouldUseMockData() -> Bool {
        mockHealthData
    }
    
    func shouldLogDebugInfo() -> Bool {
        enableDebugLogging
    }
    
    func getOptimalBatchSize() -> Int {
        // Adjust batch size based on environment and device capabilities
        let deviceMemory = ProcessInfo.processInfo.physicalMemory
        let memoryGB = Double(deviceMemory) / 1_073_741_824 // Convert to GB
        
        if memoryGB < 4.0 {
            return max(5, healthDataBatchSize / 2) // Reduce for low memory devices
        } else {
            return healthDataBatchSize
        }
    }
    
    func getOptimalSyncInterval() -> TimeInterval {
        // Adjust sync interval based on network conditions and environment
        return dataSyncInterval
    }
    
    // MARK: - Environment Info
    
    func getCurrentEnvironment() -> Environment {
        currentEnvironment
    }
    
    func isDebugBuild() -> Bool {
        #if DEBUG
        true
        #else
        false
        #endif
    }
    
    func getConfigurationSummary() -> String {
        """
        Environment: \(currentEnvironment.rawValue)
        Debug Build: \(isDebugBuild())
        Mock Data: \(mockHealthData)
        Debug Logging: \(enableDebugLogging)
        Batch Size: \(getOptimalBatchSize())
        Sync Interval: \(dataSyncInterval)s
        Performance Monitoring: \(enablePerformanceMonitoring)
        """
    }
}
