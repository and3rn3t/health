//
//  MainTabView.swift
//  VitalSense
//
//  Main navigation structure with tab-based navigation
//  Includes LiDAR scanning integration
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var notificationManager = SmartNotificationManager.shared
    @StateObject private var errorHandler = ErrorHandler.shared
    @StateObject private var analyticsManager = AnalyticsManager.shared
    @StateObject private var offlineSupportManager = OfflineSupportManager.shared
    @StateObject private var appConfig = AppConfig.shared

    var body: some View {
        TabView(selection: $selectedTab) {
            // Health Dashboard Tab
            HealthDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "heart.text.square.fill")
                }
                .tag(0)

            // Gait Analysis Tab
            GaitAnalysisView()
                .tabItem {
                    Label("Gait", systemImage: "figure.walk")
                }
                .tag(1)

            // LiDAR Scanning Tab
            Group {
                if #available(iOS 16.0, *) {
                    LiDARScanningView()
                } else {
                    LiDARUnavailableView()
                }
            }
            .tabItem {
                Label("LiDAR Scan", systemImage: "viewfinder")
            }
            .tag(2)

            // Advanced Analytics Tab
            if #available(iOS 16.0, *) {
                AdvancedAnalyticsView()
                    .tabItem {
                        Label("Analytics", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    .tag(3)
            }

            // Settings Tab
            EnhancedSettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(4)
        }
        .environmentObject(healthKitManager)
        .environmentObject(webSocketManager)
        .environmentObject(notificationManager)
        .environmentObject(errorHandler)
        .environmentObject(analyticsManager)
        .environmentObject(offlineSupportManager)
        .environmentObject(appConfig)
        .errorAlert(errorHandler: errorHandler)
        .onAppear {
            setupAppearance()
            trackTabSelection()
        }
        .onChange(of: selectedTab) { _, newTab in
            trackTabSelection()
            analyticsManager.logEvent("tab_changed", parameters: [
                "tab_index": String(newTab),
                "tab_name": tabName(for: newTab)
            ])
        }
    }

    private func setupAppearance() {
        // Configure tab bar appearance
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground

        UITabBar.appearance().standardAppearance = appearance
        if #available(iOS 15.0, *) {
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }

    private func trackTabSelection() {
        // Track tab selection for analytics
        let tabName = tabName(for: selectedTab)
        analyticsManager.logEvent("tab_viewed", parameters: [
            "tab_name": tabName
        ])
    }

    private func tabName(for index: Int) -> String {
        switch index {
        case 0: return "dashboard"
        case 1: return "gait_analysis"
        case 2: return "lidar_scan"
        case 3: return "analytics"
        case 4: return "settings"
        default: return "unknown"
        }
    }
}

// MARK: - LiDAR Unavailable View
struct LiDARUnavailableView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Image(systemName: "viewfinder")
                    .font(.system(size: 64))
                    .foregroundColor(.gray)

                VStack(spacing: 12) {
                    Text("LiDAR Scanning Unavailable")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("LiDAR scanning requires iOS 16.0 or later.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    Text("Please update your device to use this feature.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("LiDAR Scan")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

#Preview {
    MainTabView()
}
