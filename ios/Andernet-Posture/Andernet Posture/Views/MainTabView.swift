//
//  MainTabView.swift
//  Andernet Posture
//
//  iOS 26 Liquid Glass floating tab bar with scroll-to-minimize.
//

import SwiftUI
import SwiftData

struct MainTabView: View {
    @State private var selectedTab: AppTab = .dashboard

    enum AppTab: String, CaseIterable {
        case dashboard = "Dashboard"
        case sessions = "Sessions"
        case capture = "Capture"
        case clinicalTests = "Tests"
        case settings = "Settings"

        /// Localized display name for the tab. Enum raw values are not
        /// auto-extracted by the compiler, so we use String(localized:)
        /// to make tab labels appear in the String Catalog.
        var localizedName: String {
            switch self {
            case .dashboard:     return String(localized: "Dashboard")
            case .sessions:      return String(localized: "Sessions")
            case .capture:       return String(localized: "Capture")
            case .clinicalTests: return String(localized: "Tests")
            case .settings:      return String(localized: "Settings")
            }
        }

        var icon: String {
            switch self {
            case .dashboard: return "chart.bar.fill"
            case .sessions: return "list.bullet.rectangle.portrait.fill"
            case .capture: return "figure.walk"
            case .clinicalTests: return "stethoscope"
            case .settings: return "gearshape.fill"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab(AppTab.dashboard.localizedName, systemImage: AppTab.dashboard.icon, value: .dashboard) {
                DashboardView()
            }

            Tab(AppTab.sessions.localizedName, systemImage: AppTab.sessions.icon, value: .sessions) {
                SessionListView()
            }

            Tab(AppTab.capture.localizedName, systemImage: AppTab.capture.icon, value: .capture) {
                PostureGaitCaptureView()
            }

            Tab(AppTab.clinicalTests.localizedName, systemImage: AppTab.clinicalTests.icon, value: .clinicalTests) {
                ClinicalTestView()
            }

            Tab(AppTab.settings.localizedName, systemImage: AppTab.settings.icon, value: .settings) {
                SettingsView()
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .sensoryFeedback(.selection, trigger: selectedTab)
    }
}

#Preview {
    MainTabView()
        .modelContainer(for: [GaitSession.self, UserGoals.self], inMemory: true)
        .environment(CloudSyncService())
        .environment(MLModelService.shared)
}
