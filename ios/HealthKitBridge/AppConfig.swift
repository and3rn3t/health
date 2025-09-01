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
            self.apiBaseURL = plist["API_BASE_URL"] as? String ?? "https://health-app-prod.andernet.workers.dev/api"
            self.webSocketURL = plist["WS_URL"] as? String ?? "wss://health-app-prod.andernet.workers.dev/ws"
        } else {
            // Default values for production
            self.userId = "default-user-\(UUID().uuidString)"
            self.apiBaseURL = "https://health-app-prod.andernet.workers.dev/api"
            self.webSocketURL = "wss://health-app-prod.andernet.workers.dev/ws"
        }

        print("📋 App Config loaded:")
        print("   User ID: \(userId)")
        print("   API Base URL: \(apiBaseURL)")
        print("   WebSocket URL: \(webSocketURL)")
    }
}
