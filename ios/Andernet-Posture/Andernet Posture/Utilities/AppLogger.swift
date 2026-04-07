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
enum AppLogger {

    /// App lifecycle, ModelContainer, startup
    static let app = Logger(subsystem: "dev.andernet.posture", category: "App")

    /// ARKit body tracking, skeleton overlay
    static let arTracking = Logger(subsystem: "dev.andernet.posture", category: "ARTracking")

    /// Capture session lifecycle and frame processing
    static let capture = Logger(subsystem: "dev.andernet.posture", category: "Capture")

    /// Session recording (frame collection, state machine)
    static let recorder = Logger(subsystem: "dev.andernet.posture", category: "Recorder")

    /// Clinical analyzers (posture, gait, balance, etc.)
    static let analysis = Logger(subsystem: "dev.andernet.posture", category: "Analysis")

    /// HealthKit reads and writes
    static let healthKit = Logger(subsystem: "dev.andernet.posture", category: "HealthKit")

    /// CoreMotion service
    static let motion = Logger(subsystem: "dev.andernet.posture", category: "Motion")

    /// SwiftData persistence
    static let persistence = Logger(subsystem: "dev.andernet.posture", category: "Persistence")

    /// Clinical test protocols (TUG, Romberg, 6MWT)
    static let clinicalTests = Logger(subsystem: "dev.andernet.posture", category: "ClinicalTests")

    /// Performance monitoring and profiling
    static let performance = Logger(subsystem: "dev.andernet.posture", category: "Performance")

    /// Export & sharing (CSV, PDF, file I/O)
    static let export = Logger(subsystem: "dev.andernet.posture", category: "Export")

    /// CloudKit sync (NSPersistentCloudKitContainer)
    static let cloudSync = Logger(subsystem: "dev.andernet.posture", category: "CloudSync")

    /// CoreML model loading and inference
    static let ml = Logger(subsystem: "dev.andernet.posture", category: "ML")

    /// iCloud Key-Value Store sync
    static let kvSync = Logger(subsystem: "dev.andernet.posture", category: "KVSync")

    /// Local notifications (reminders, alerts)
    static let notifications = Logger(subsystem: "dev.andernet.posture", category: "Notifications")

    /// WebSocket bridge to Cloudflare Workers
    static let webSocket = Logger(subsystem: "dev.andernet.posture", category: "WebSocket")
}
