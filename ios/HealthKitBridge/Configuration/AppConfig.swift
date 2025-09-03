import Foundation

class AppConfig {
    static let shared = AppConfig()
    
    // Configuration properties
    let userId: String
    let apiBaseURL: String
    let webSocketURL: String
    
    private init() {
        // Try to load from Config.plist first, then use defaults
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let plist = NSDictionary(contentsOfFile: path) {
            // Fix key names to match the actual plist structure
            self.userId = plist["USER_ID"] as? String ?? "default-user-\(UUID().uuidString)"
            self.apiBaseURL = plist["API_BASE_URL"] as? String ?? "https://api.andernet.dev"
            self.webSocketURL = plist["WS_URL"] as? String ?? "wss://api.andernet.dev/ws"
        } else {
            // Default values for testing
            self.userId = "default-user-\(UUID().uuidString)"
            self.apiBaseURL = "https://api.andernet.dev"
            self.webSocketURL = "wss://api.andernet.dev/ws"
        }
        
        print("📋 App Config loaded:")
        print("   User ID: \(userId)")
        print("   API Base URL: \(apiBaseURL)")
        print("   WebSocket URL: \(webSocketURL)")
    }
}
