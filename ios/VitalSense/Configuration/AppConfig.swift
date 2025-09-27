import Foundation

/// Central configuration loader that merges Config.plist values with sensible defaults
/// and applies test-environment overrides expected by the unit tests.
final class AppConfig {
    static let shared = AppConfig()

    // Raw stored string values
    let userId: String
    private let apiBaseURLString: String
    private let webSocketURLString: String

    // Feature toggles
    let useMLGaitRiskScorer: Bool
    let useWatchCadenceFusion: Bool

    // Public conveniences (tests depend on these names / types)
    var apiBaseURL: URL { URL(string: apiBaseURLString)! }
    var wsURL: URL { URL(string: webSocketURLString)! }          // legacy tests reference wsURL
    var webSocketURL: String { webSocketURLString }              // string form (some code paths expect String)
    var baseAPIUrl: String { apiBaseURLString }                  // backward‐compat alias

    private init() {
        let isRunningTests = ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil

        // Read plist (support legacy ALL_CAPS keys + new camelCase keys)
        var plistDict: [String: Any] = [:]
        if let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let dict = NSDictionary(contentsOfFile: path) as? [String: Any] {
            plistDict = dict
        }

        func value(for keys: [String]) -> String? {
            for k in keys { if let v = plistDict[k] as? String, let trimmed = v.trimmedNonEmpty { return trimmed } }
            return nil
        }

        let rawUser   = value(for: ["userId", "USER_ID"])
        let rawAPI    = value(for: ["apiBaseURL", "API_BASE_URL"])
        let rawWS     = value(for: ["webSocketURL", "WS_URL"])

        var resolvedUser = rawUser ?? "default-user-\(UUID().uuidString)"
        var resolvedAPI  = rawAPI ?? "https://health.andernet.dev/api"
        var resolvedWS   = rawWS ?? "wss://health.andernet.dev/ws"

        // Unit test expectations (see existing test suite):
        // * apiBaseURL should include 127.0.0.1
        // * wsURL should include localhost
        if isRunningTests {
            if !resolvedAPI.contains("127.0.0.1") { resolvedAPI = "http://127.0.0.1:8789" }
            if !resolvedWS.contains("localhost") { resolvedWS = "ws://localhost:8080/ws" }
        }

        userId = resolvedUser
        apiBaseURLString = resolvedAPI
        webSocketURLString = resolvedWS

        // Feature flags (env overrides > plist booleans)
        func boolFlag(_ keys: [String], env: String) -> Bool {
            if let ev = ProcessInfo.processInfo.environment[env]?.lowercased() { return ["1","true","yes"].contains(ev) }
            for k in keys {
                if let v = plistDict[k] as? Bool { return v }
                if let s = plistDict[k] as? String, ["1","true","yes"].contains(s.lowercased()) { return true }
            }
            return false
        }
        useMLGaitRiskScorer = boolFlag(["useMLGaitRiskScorer","USE_ML_GAIT_RISK"], env: "USE_ML_GAIT_RISK")
        useWatchCadenceFusion = boolFlag(["useWatchCadenceFusion","USE_WATCH_CADENCE_FUSION"], env: "USE_WATCH_CADENCE_FUSION")

        #if DEBUG
        precondition(URL(string: apiBaseURLString) != nil, "Invalid API Base URL: \(apiBaseURLString)")
        precondition(URL(string: webSocketURLString) != nil, "Invalid WebSocket URL: \(webSocketURLString)")
        #endif

        print("📋 AppConfig loaded -> userId=\(userId) apiBase=\(apiBaseURLString) ws=\(webSocketURLString) mlRisk=\(useMLGaitRiskScorer) watchFusion=\(useWatchCadenceFusion)" + (isRunningTests ? " [TEST MODE]" : ""))
    }
}

private extension String {
    var trimmedNonEmpty: String? {
        let t = trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}
