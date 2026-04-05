//
//  AppLogger.swift
//  Andernet Posture
//
//  Structured OSLog loggers for all app subsystems.
//

import Foundation
import os.log

/// Centralized logger definitions for structured logging throughout the app.
/// Usage: `AppLogger.capture.info("Frame processed")`
///
/// All loggers are `nonisolated(unsafe)` so they can be used from any
/// isolation context (Timer callbacks, Task.detached, @Sendable closures, etc.).
/// This is safe because `Logger` is `Sendable` and these are immutable.
enum AppLogger {
    private nonisolated(unsafe) static let subsystem = Bundle.main.bundleIdentifier ?? "dev.andernet.posture"

    /// App lifecycle, ModelContainer, startup
    nonisolated(unsafe) static let app = Logger(subsystem: subsystem, category: "App")

    /// ARKit body tracking, skeleton overlay
    nonisolated(unsafe) static let arTracking = Logger(subsystem: subsystem, category: "ARTracking")

    /// Capture session lifecycle and frame processing
    nonisolated(unsafe) static let capture = Logger(subsystem: subsystem, category: "Capture")

    /// Session recording (frame collection, state machine)
    nonisolated(unsafe) static let recorder = Logger(subsystem: subsystem, category: "Recorder")

    /// Clinical analyzers (posture, gait, balance, etc.)
    nonisolated(unsafe) static let analysis = Logger(subsystem: subsystem, category: "Analysis")

    /// HealthKit reads and writes
    nonisolated(unsafe) static let healthKit = Logger(subsystem: subsystem, category: "HealthKit")

    /// CoreMotion service
    nonisolated(unsafe) static let motion = Logger(subsystem: subsystem, category: "Motion")

    /// SwiftData persistence
    nonisolated(unsafe) static let persistence = Logger(subsystem: subsystem, category: "Persistence")

    /// Clinical test protocols (TUG, Romberg, 6MWT)
    nonisolated(unsafe) static let clinicalTests = Logger(subsystem: subsystem, category: "ClinicalTests")

    /// Performance monitoring and profiling
    nonisolated(unsafe) static let performance = Logger(subsystem: subsystem, category: "Performance")

    /// Export & sharing (CSV, PDF, file I/O)
    nonisolated(unsafe) static let export = Logger(subsystem: subsystem, category: "Export")

    /// CloudKit sync (NSPersistentCloudKitContainer)
    nonisolated(unsafe) static let cloudSync = Logger(subsystem: subsystem, category: "CloudSync")

    /// CoreML model loading and inference
    nonisolated(unsafe) static let ml = Logger(subsystem: subsystem, category: "ML")

    /// iCloud Key-Value Store sync
    nonisolated(unsafe) static let kvSync = Logger(subsystem: subsystem, category: "KVSync")

    /// Local notifications (reminders, alerts)
    nonisolated(unsafe) static let notifications = Logger(subsystem: subsystem, category: "Notifications")

    /// WebSocket bridge to Cloudflare Workers
    nonisolated(unsafe) static let webSocket = Logger(subsystem: subsystem, category: "WebSocket")
}
