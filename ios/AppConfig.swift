import Foundation

struct AppConfig {
    let apiBaseURL: URL
    let wsURL: URL
    let userId: String

    static func load() -> AppConfig {
        guard let url = Bundle.main.url(forResource: "Config", withExtension: "plist"),
              let data = try? Data(contentsOf: url),
              let dict = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any]
        else { fatalError("Missing Config.plist") }

        guard let api = dict["API_BASE_URL"] as? String, let apiURL = URL(string: api) else { fatalError("API_BASE_URL missing") }
        guard let ws = dict["WS_URL"] as? String, let wsURL = URL(string: ws) else { fatalError("WS_URL missing") }
        let userId = (dict["USER_ID"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let uid = userId, !uid.isEmpty else { fatalError("USER_ID missing") }
        return AppConfig(apiBaseURL: apiURL, wsURL: wsURL, userId: uid)
    }
}
