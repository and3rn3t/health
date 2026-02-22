//
//  DeepLinkHandler.swift
//  Andernet Posture
//
//  Handles deep links and universal links for the app.
//  Supports URL scheme: andernetposture://
//  Supports universal links: https://andernet.dev/posture/
//
//  Supported routes:
//  - andernetposture://capture          → Open capture tab
//  - andernetposture://sessions         → Open sessions list
//  - andernetposture://session/{id}     → Open specific session detail
//  - andernetposture://tests            → Open clinical tests
//  - andernetposture://settings         → Open settings
//  - andernetposture://dashboard        → Open dashboard
//

import Foundation
import SwiftUI
import os.log

// MARK: - Deep Link Route

/// All navigable routes the app supports via deep links.
enum DeepLinkRoute: Equatable {
    case dashboard
    case sessions
    case sessionDetail(id: String)
    case capture
    case clinicalTests
    case settings

    /// Parse a URL into a DeepLinkRoute.
    static func from(url: URL) -> DeepLinkRoute? {
        // Handle both custom scheme and universal links
        let pathComponents: [String]
        let host: String?

        if url.scheme == "andernetposture" {
            host = url.host
            pathComponents = url.pathComponents.filter { $0 != "/" }
        } else {
            // Universal link: https://andernet.dev/posture/capture
            let components = url.pathComponents.filter { $0 != "/" }
            // Skip "posture" prefix if present
            if components.first == "posture" {
                host = components.dropFirst().first
                pathComponents = Array(components.dropFirst(2))
            } else {
                host = components.first
                pathComponents = Array(components.dropFirst())
            }
        }

        switch host {
        case "dashboard":
            return .dashboard
        case "sessions":
            return .sessions
        case "session":
            if let id = pathComponents.first {
                return .sessionDetail(id: id)
            }
            return .sessions
        case "capture":
            return .capture
        case "tests":
            return .clinicalTests
        case "settings":
            return .settings
        default:
            return nil
        }
    }
}

// MARK: - Deep Link Handler

/// Observable handler that views can bind to for navigation.
@Observable
@MainActor
final class DeepLinkHandler {
    /// The tab to navigate to. Bind this to your TabView selection.
    var selectedTab: MainTabView.AppTab = .dashboard

    /// If a session detail should be shown, this contains the session ID.
    var pendingSessionID: String?

    private let logger = AppLogger.app

    /// Process an incoming URL and navigate accordingly.
    func handle(url: URL) {
        guard let route = DeepLinkRoute.from(url: url) else {
            logger.warning("Unrecognized deep link: \(url.absoluteString)")
            return
        }

        logger.info("Handling deep link route: \(String(describing: route))")

        switch route {
        case .dashboard:
            selectedTab = .dashboard
        case .sessions:
            selectedTab = .sessions
        case .sessionDetail(let id):
            selectedTab = .sessions
            pendingSessionID = id
        case .capture:
            selectedTab = .capture
        case .clinicalTests:
            selectedTab = .clinicalTests
        case .settings:
            selectedTab = .settings
        }
    }
}
