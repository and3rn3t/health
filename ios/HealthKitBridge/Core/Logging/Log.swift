import Foundation

/// Central lightweight logging facade. In Release builds `debug` logs are suppressed.
enum Log {
    enum Level: String { case debug = "🔍", info = "ℹ️", warn = "⚠️", error = "❌" }
    enum Category: String { case core, healthkit, websocket, auth, permissions, diagnostics }

    static var isDebug: Bool {
        #if DEBUG
        true
        #else
        false
        #endif
    }

    /// Generic logger.
    static func log(_ message: @autoclosure () -> String,
                    level: Level = .info,
                    category: String = "core",
                    file: String = #fileID,
                    line: Int = #line) {
        if level == .debug && !isDebug { return }
        let ts = ISO8601DateFormatter().string(from: Date())
        print("\(level.rawValue) [\(category)] \(ts) \(message()) @\(file):\(line)")
    }

    static func debug(_ msg: @autoclosure () -> String, category: String = "core") { log(msg(), level: .debug, category: category) }
    static func info(_ msg: @autoclosure () -> String, category: String = "core") { log(msg(), level: .info, category: category) }
    static func warn(_ msg: @autoclosure () -> String, category: String = "core") { log(msg(), level: .warn, category: category) }
    static func error(_ msg: @autoclosure () -> String, category: String = "core") { log(msg(), level: .error, category: category) }

    // Category enum overloads
    static func debug(_ msg: @autoclosure () -> String, category: Category) { debug(msg(), category: category.rawValue) }
    static func info(_ msg: @autoclosure () -> String, category: Category) { info(msg(), category: category.rawValue) }
    static func warn(_ msg: @autoclosure () -> String, category: Category) { warn(msg(), category: category.rawValue) }
    static func error(_ msg: @autoclosure () -> String, category: Category) { error(msg(), category: category.rawValue) }
}

extension Log {
    /// Redact sensitive numeric values (future: hashing / bucketing).
    static func redact(_ value: Double?, precision: Int = 1) -> String {
        guard let v = value else { return "–" }
        return String(format: "~%.\(precision)f", v)
    }
}
