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
    private static let subsystem = Bundle.main.bundleIdentifier ?? "dev.andernet.posture"
    
    /// App lifecycle, ModelContainer, startup
    static let app = Logger(subsystem: subsystem, category: "App")
    
    /// ARKit body tracking, skeleton overlay
    static let arTracking = Logger(subsystem: subsystem, category: "ARTracking")
    
    /// Capture session lifecycle and frame processing
    static let capture = Logger(subsystem: subsystem, category: "Capture")
    
    /// Session recording (frame collection, state machine)
    static let recorder = Logger(subsystem: subsystem, category: "Recorder")
    
    /// Clinical analyzers (posture, gait, balance, etc.)
    static let analysis = Logger(subsystem: subsystem, category: "Analysis")
    
    /// HealthKit reads and writes
    static let healthKit = Logger(subsystem: subsystem, category: "HealthKit")
    
    /// CoreMotion service
    static let motion = Logger(subsystem: subsystem, category: "Motion")
    
    /// SwiftData persistence
    static let persistence = Logger(subsystem: subsystem, category: "Persistence")
    
    /// Clinical test protocols (TUG, Romberg, 6MWT)
    static let clinicalTests = Logger(subsystem: subsystem, category: "ClinicalTests")
    
    /// Performance monitoring and profiling
    static let performance = Logger(subsystem: subsystem, category: "Performance")
    
    /// Export & sharing (CSV, PDF, file I/O)
    static let export = Logger(subsystem: subsystem, category: "Export")
    
    /// CloudKit sync (NSPersistentCloudKitContainer)
    static let cloudSync = Logger(subsystem: subsystem, category: "CloudSync")
    
    /// CoreML model loading and inference
    static let ml = Logger(subsystem: subsystem, category: "ML")
    
    /// iCloud Key-Value Store sync
    static let kvSync = Logger(subsystem: subsystem, category: "KVSync")
    
    /// Local notifications (reminders, alerts)
    static let notifications = Logger(subsystem: subsystem, category: "Notifications")
}
