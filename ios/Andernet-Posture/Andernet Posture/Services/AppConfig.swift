//
//  AppConfig.swift
//  Andernet Posture
//
//  Centralised deployment and networking configuration.
//  Clinical / algorithm constants stay co-located with their analyzers.
//

import Foundation

// swiftlint:disable type_body_length

/// App-wide configuration values that vary by build configuration.
enum AppConfig {

    // MARK: - WebSocket

    enum WebSocket {
        /// Server URL — switches between dev and production automatically.
        static var url: String {
            #if DEBUG
            return "wss://localhost:8789/ws"
            #else
            return "wss://health-app.andernet.dev/ws"
            #endif
        }

        /// Maximum reconnection attempts before giving up.
        static let maxReconnectAttempts = 10

        /// Maximum messages held in the offline queue.
        static let maxMessageQueueSize = 50

        /// Minimum interval (seconds) between queued message sends on reconnect.
        static let queueDrainInterval: TimeInterval = 0.1

        /// Interval (seconds) between WebSocket ping frames.
        static let pingInterval: TimeInterval = 30
    }

    // MARK: - HealthKit

    enum HealthKit {
        /// Timeout for HealthKit save operations.
        static let saveTimeout: TimeInterval = 30

        /// Timeout for HealthKit fetch / query operations.
        static let fetchTimeout: TimeInterval = 15
    }

    // MARK: - Motion

    enum Motion {
        /// CoreMotion update interval (60 Hz).
        static let updateInterval: TimeInterval = 1.0 / 60.0
    }

    // MARK: - API

    enum API {
        /// Base URL for the VitalSense web API.
        static var baseURL: String {
            #if DEBUG
            return "https://localhost:8789"
            #else
            return "https://health-app.andernet.dev"
            #endif
        }
    }
}

// swiftlint:enable type_body_length
