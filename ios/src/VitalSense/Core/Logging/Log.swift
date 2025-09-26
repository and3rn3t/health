import Foundation

// MARK: - Lightweight Logger
// Simple ring-buffer logger used by tests and runtime components.
enum Log {
    enum Level: String { case debug = "DEBUG", info = "INFO", warn = "WARN", error = "ERROR" }
    private static let queue = DispatchQueue(label: "dev.andernet.vitalsense.log", qos: .utility)
    private static var buffer: [String] = []
    private static let cap = 600
    private static let ts: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    static func debug(_ msg: @autoclosure () -> String, category: String? = nil) { write(.debug, msg(), category) }
    static func info (_ msg: @autoclosure () -> String, category: String? = nil) { write(.info,  msg(), category) }
    static func warn (_ msg: @autoclosure () -> String, category: String? = nil) { write(.warn,  msg(), category) }
    static func error(_ msg: @autoclosure () -> String, category: String? = nil) { write(.error, msg(), category) }

    static func recent(_ max: Int = 200) -> [String] { queue.sync { Array(buffer.suffix(max)) } }

    private static func write(_ level: Level, _ message: String, _ category: String?) {
        let entry = "[\(level.rawValue)][\(category ?? "general")] \(message)"
        #if DEBUG
        print("❖", entry)
        #endif
        queue.async {
            buffer.append("\(ts.string(from: Date())) \(entry)")
            if buffer.count > cap { buffer.removeFirst(buffer.count - cap) }
        }
    }

    #if DEBUG
    /// Barrier to ensure all queued writes complete before assertions in tests
    static func _test_barrier() { queue.sync { /* drain */ } }
    /// Expose capacity for tests
    static var _test_cap: Int { cap }
    #endif
}
