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
    @StateObject private var errorHandler = ErrorHandler.shared
    @StateObject private var analyticsManager = AnalyticsManager.shared
    @StateObject private var offlineSupportManager = OfflineSupportManager.shared

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
                        .environmentObject(errorHandler)
                        .environmentObject(analyticsManager)
                        .environmentObject(offlineSupportManager)
                        .errorAlert(errorHandler: errorHandler)
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
        // Initialize crash reporting first
        CrashReportingManager.shared.initialize()

        // Set user for crash reporting
        CrashReportingManager.shared.setUser(
            userId: appConfig.userId,
            email: nil,
            username: nil
        )

        // Start analytics session
        analyticsManager.startSession()

        // Start performance monitoring
        let initTimer = analyticsManager.startTiming("app_initialization")

        Task {
            do {
                // Initialize core managers
                try await setupAppConfiguration()
                try await setupHealthKit()
                try await setupNetworking()
                try await setupNotifications()

                // Initialize offline support
                await setupOfflineSupport()

                // Check if onboarding needed
                await checkOnboardingStatus()

                // Mark as initialized
                await MainActor.run {
                    isInitialized = true
                }

                // Record initialization time
                _ = initTimer.stop()

                analyticsManager.logEvent("app_initialized", parameters: [
                    "has_onboarding": String(!appConfig.hasCompletedOnboarding)
                ])

                print("✅ VitalSense app initialized successfully")

            } catch {
                // Record initialization error
                _ = initTimer.stop()

                errorHandler.handle(
                    error,
                    context: "App initialization",
                    recovery: .userAction
                )

                CrashReportingManager.shared.reportError(
                    error,
                    context: "App initialization failed",
                    level: .fatal
                )

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

    private func setupOfflineSupport() async {
        // Offline support manager initializes itself
        // Update queue status
        offlineSupportManager.updateQueueStatus()
    }

    private func checkOnboardingStatus() async {
        let needsOnboarding = !appConfig.hasCompletedOnboarding

        await MainActor.run {
            showingOnboarding = needsOnboarding
        }
    }

    // MARK: - Background Tasks
    private func performBackgroundSync() async {
        let timer = analyticsManager.startTiming("background_sync")
        analyticsManager.logEvent("background_sync_started")

        do {
            // Sync health data with server
            try await healthKitManager.syncRecentData()

            // Process any pending analytics
            await processHealthAnalytics()

            // Update offline queue status
            offlineSupportManager.updateQueueStatus()

            _ = timer.stop()
            analyticsManager.logEvent("background_sync_completed")
            print("✅ Background sync completed")

        } catch {
            _ = timer.stop()
            errorHandler.handle(
                error,
                context: "Background sync",
                recovery: .retry(maxAttempts: 3)
            )

            CrashReportingManager.shared.addBreadcrumb(
                "Background sync failed: \(error.localizedDescription)",
                category: "background_tasks",
                level: .error
            )

            print("❌ Background sync failed: \(error)")
        }
    }

    private func syncHealthData() async {
        let timer = analyticsManager.startTiming("healthkit_sync")
        analyticsManager.logEvent("healthkit_sync_started")

        do {
            // Fetch latest health metrics
            let metrics = try await healthKitManager.fetchLatestMetrics()

            // Send to analytics pipeline
            await webSocketManager.sendHealthUpdate(metrics)

            // Check for health alerts
            await notificationManager.processHealthAlerts(metrics)

            // Record memory usage periodically
            analyticsManager.recordMemoryUsage()
            analyticsManager.recordBatteryUsage()

            _ = timer.stop()
            analyticsManager.logEvent("healthkit_sync_completed")
            print("✅ HealthKit sync completed")

        } catch {
            _ = timer.stop()
            errorHandler.handle(
                error,
                context: "HealthKit sync",
                recovery: .retry(maxAttempts: 3)
            )

            CrashReportingManager.shared.reportError(
                error,
                context: "HealthKit background sync failed",
                level: .error
            )

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

        // Start periodic memory and battery monitoring
        Task {
            while true {
                try? await Task.sleep(nanoseconds: 60_000_000_000) // Every 60 seconds
                analyticsManager.recordMemoryUsage()
                analyticsManager.recordBatteryUsage()
            }
        }
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
