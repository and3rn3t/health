import Foundation

class AppConfig: ObservableObject {
    static let shared = AppConfig()

    let apiBaseURL: URL
    let wsURL: URL
    let userId: String

    private init() {
        guard let url = Bundle.main.url(forResource: "Config", withExtension: "plist"),
              let data = try? Data(contentsOf: url),
              let dict = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any]
        else {
            fatalError("❌ Missing Config.plist - make sure it's added to your Xcode project target")
        }

        guard let apiString = dict["API_BASE_URL"] as? String,
              let apiURL = URL(string: apiString) else {
            fatalError("❌ API_BASE_URL missing or invalid in Config.plist")
        }

        guard let wsString = dict["WS_URL"] as? String,
              let wsURL = URL(string: wsString) else {
            fatalError("❌ WS_URL missing or invalid in Config.plist")
        }

        guard let userIdString = dict["USER_ID"] as? String else {
            fatalError("❌ USER_ID missing in Config.plist")
        }

        let cleanUserId = userIdString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanUserId.isEmpty else {
            fatalError("❌ USER_ID is empty in Config.plist")
        }

        self.apiBaseURL = apiURL
        self.wsURL = wsURL
        self.userId = cleanUserId

        print("✅ AppConfig loaded:")
        print("   API: \(apiURL.absoluteString)")
        print("   WebSocket: \(wsURL.absoluteString)")
        print("   User ID: \(cleanUserId)")
    }
}
