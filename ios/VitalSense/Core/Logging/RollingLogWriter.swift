import Foundation

/// Simple rolling log writer that trims from the start when exceeding maxBytes.
struct RollingLogWriter {
    enum TrimmedError: Error { case trimmed(Int) }

    private let url: URL
    private let maxBytes: Int
    private let fileManager = FileManager.default

    init(filename: String, maxBytes: Int) throws {
        self.maxBytes = maxBytes
        let dir = try Self.logsDirectory()
        self.url = dir.appendingPathComponent(filename)
        if !fileManager.fileExists(atPath: url.path) { fileManager.createFile(atPath: url.path, contents: Data(), attributes: nil) }
    }

    mutating func append(line: String) throws {
        let ts = ISO8601DateFormatter().string(from: Date())
        let data = ("[" + ts + "] " + line + "\n").data(using: .utf8) ?? Data()
        if let handle = try? FileHandle(forWritingTo: url) {
            defer { try? handle.close() }
            handle.seekToEndOfFile()
            handle.write(data)
        } else {
            try data.write(to: url, options: .atomic)
        }
        try trimIfNeeded()
    }

    private mutating func trimIfNeeded() throws {
        let attrs = try fileManager.attributesOfItem(atPath: url.path)
        if let size = attrs[.size] as? NSNumber, size.intValue > maxBytes {
            let excess = size.intValue - maxBytes
            let original = try Data(contentsOf: url)
            // Keep last maxBytes/2 to reduce trimming frequency
            let keep = min(maxBytes / 2, original.count)
            let slice = original.suffix(keep)
            try slice.write(to: url, options: .atomic)
            throw TrimmedError.trimmed(keep)
        }
    }

    private static func logsDirectory() throws -> URL {
        #if os(iOS)
        let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        #else
        let base = FileManager.default.temporaryDirectory
        #endif
        let dir = base.appendingPathComponent("LiveIngestionLogs", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }
}
