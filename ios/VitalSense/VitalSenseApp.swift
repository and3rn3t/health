//
//  VitalSenseApp.swift
//  VitalSense
//
//  Main application entry point for VitalSense health monitoring app
//  Implements modern SwiftUI App lifecycle with proper initialization
//

import SwiftUI
import HealthKit
import BackgroundTasks

@main
struct VitalSenseApp: App {
    // MARK: - App Configuration
    @StateObject private var appConfig = AppConfig.shared
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var notificationManager = SmartNotificationManager.shared

    // MARK: - App State
    @State private var isInitialized = false
    @State private var showingOnboarding = false

    // MARK: - App Body
    var body: some Scene {
        WindowGroup {
            Group {
                if isInitialized {
                    ContentView()
                        .environmentObject(appConfig)
                        .environmentObject(healthKitManager)
                        .environmentObject(webSocketManager)
                        .environmentObject(notificationManager)
                } else {
                    LaunchScreen()
                }
            }
            .onAppear {
                initializeApp()
            }
            .sheet(isPresented: $showingOnboarding) {
                OnboardingView()
            }
        }
        .backgroundTask(.appRefresh("health-data-sync")) {
            await performBackgroundSync()
        }
        .backgroundTask(.healthKitSync("vitalsense.health.sync")) {
            await syncHealthData()
        }
    }

    // MARK: - App Initialization
    private func initializeApp() {
        Task {
            do {
                // Initialize core managers
                try await setupAppConfiguration()
                try await setupHealthKit()
                try await setupNetworking()
                try await setupNotifications()

                // Check if onboarding needed
                await checkOnboardingStatus()

                // Mark as initialized
                await MainActor.run {
                    isInitialized = true
                }

                print("✅ VitalSense app initialized successfully")

            } catch {
                print("❌ App initialization failed: \(error)")
                // Handle initialization failure gracefully
                await MainActor.run {
                    isInitialized = true // Show app even with errors
                }
            }
        }
    }

    // MARK: - Setup Methods
    private func setupAppConfiguration() async throws {
        // Load configuration from Config.plist and environment
        try await appConfig.initialize()

        // Configure app-wide settings
        configureAppearance()
        configurePerformanceMonitoring()
    }

    private func setupHealthKit() async throws {
        // Request HealthKit authorization if needed
        let authorized = try await healthKitManager.requestAuthorization()

        if !authorized {
            print("⚠️ HealthKit authorization denied - limited functionality available")
        }

        // Start background health data monitoring
        await healthKitManager.startBackgroundMonitoring()
    }

    private func setupNetworking() async throws {
        // Initialize WebSocket connection for real-time health updates
        try await webSocketManager.initialize()

        // Configure API client
        ApiClient.shared.configure(with: appConfig.networkConfiguration)
    }

    private func setupNotifications() async throws {
        // Request notification permissions
        try await notificationManager.requestPermissions()

        // Configure health alert notifications
        await notificationManager.setupHealthAlerts()
    }

    private func checkOnboardingStatus() async {
        let needsOnboarding = !appConfig.hasCompletedOnboarding

        await MainActor.run {
            showingOnboarding = needsOnboarding
        }
    }

    // MARK: - Background Tasks
    private func performBackgroundSync() async {
        print("🔄 Performing background health data sync...")

        do {
            // Sync health data with server
            try await healthKitManager.syncRecentData()

            // Process any pending analytics
            await processHealthAnalytics()

            print("✅ Background sync completed")

        } catch {
            print("❌ Background sync failed: \(error)")
        }
    }

    private func syncHealthData() async {
        print("💓 Performing HealthKit background sync...")

        do {
            // Fetch latest health metrics
            let metrics = try await healthKitManager.fetchLatestMetrics()

            // Send to analytics pipeline
            await webSocketManager.sendHealthUpdate(metrics)

            // Check for health alerts
            await notificationManager.processHealthAlerts(metrics)

            print("✅ HealthKit sync completed")

        } catch {
            print("❌ HealthKit sync failed: \(error)")
        }
    }

    private func processHealthAnalytics() async {
        // Process fall risk calculations
        await healthKitManager.processFallRiskAnalytics()

        // Update gait analysis if active
        if appConfig.gaitMonitoringEnabled {
            await healthKitManager.processGaitAnalytics()
        }
    }

    // MARK: - App Configuration
    private func configureAppearance() {
        // Configure VitalSense brand colors
        UINavigationBar.appearance().tintColor = UIColor(named: "VitalSensePrimary")
        UITabBar.appearance().tintColor = UIColor(named: "VitalSenseAccent")
    }

    private func configurePerformanceMonitoring() {
        // Enable performance monitoring in debug builds
        #if DEBUG
        PerformanceMonitor.shared.startMonitoring()
        #endif
    }
}

// MARK: - Supporting Views
struct LaunchScreen: View {
    @State private var isAnimating = false

    var body: some View {
        VStack(spacing: 24) {
            // VitalSense Logo
            Image("VitalSenseLogo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 120, height: 120)
                .scaleEffect(isAnimating ? 1.1 : 1.0)
                .animation(
                    Animation.easeInOut(duration: 1.0)
                        .repeatForever(autoreverses: true),
                    value: isAnimating
                )

            VStack(spacing: 8) {
                Text("VitalSense")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)

                Text("Health Insights & Fall Prevention")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Loading indicator
            ProgressView()
                .scaleEffect(1.2)
                .tint(Color("VitalSensePrimary"))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color("VitalSenseBackground"))
        .onAppear {
            isAnimating = true
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var healthKitManager: HealthKitManager
    @EnvironmentObject var appConfig: AppConfig
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HealthDashboardView()
                .tabItem {
                    Image(systemName: "heart.text.square")
                    Text("Dashboard")
                }
                .tag(0)

            GaitAnalysisView()
                .tabItem {
                    Image(systemName: "figure.walk")
                    Text("Gait")
                }
                .tag(1)

            HealthMetricsView()
                .tabItem {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                    Text("Metrics")
                }
                .tag(2)

            EnhancedSettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(3)
        }
        .tint(Color("VitalSensePrimary"))
    }
}

// MARK: - Placeholder Views (to be implemented)
struct OnboardingView: View {
    var body: some View {
        VStack {
            Text("Welcome to VitalSense")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Your personal health monitoring companion")
                .font(.subheadline)
                .foregroundColor(.secondary)

            // Onboarding content will be implemented
            Spacer()
        }
        .padding()
    }
}

struct DashboardView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Health Dashboard")
                    .font(.title)
                    .fontWeight(.semibold)

                // Dashboard content will be implemented
                Spacer()
            }
            .navigationTitle("VitalSense")
        }
    }
}

struct GaitAnalysisView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Gait Analysis")
                    .font(.title)
                    .fontWeight(.semibold)

                // Gait analysis content will be implemented
                Spacer()
            }
            .navigationTitle("Gait Analysis")
        }
    }
}

struct HealthMetricsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Health Metrics")
                    .font(.title)
                    .fontWeight(.semibold)

                // Health metrics content will be implemented
                Spacer()
            }
            .navigationTitle("Health Metrics")
        }
    }
}

struct SettingsView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Settings")
                    .font(.title)
                    .fontWeight(.semibold)

                // Settings content will be implemented
                Spacer()
            }
            .navigationTitle("Settings")
        }
    }
}
