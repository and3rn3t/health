//
//  Andernet_PostureApp.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import SwiftUI
import SwiftData
import os.log

private let logger = AppLogger.app

@main
struct Andernet_PostureApp: App {

    let sharedModelContainer: ModelContainer
    @State private var showSplash = true
    @State private var cloudSyncService = CloudSyncService()
    @State private var mlModelService = MLModelService.shared
    @State private var deepLinkHandler = DeepLinkHandler()
    @Environment(\.scenePhase) private var scenePhase

    init() {
        let schema = Schema([GaitSession.self, UserGoals.self])

        // iCloud sync: set the CloudKit container identifier so SwiftData
        // mirrors all models to the private CloudKit database automatically.
        // Users who aren't signed in to iCloud still get a local-only store.
        let config = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            cloudKitDatabase: .private("iCloud.dev.andernet.posture")
        )

        do {
            sharedModelContainer = try ModelContainer(
                for: schema,
                migrationPlan: GaitSessionMigrationPlan.self,
                configurations: [config]
            )
            logger.info("ModelContainer created successfully (persistent store, migration plan active)")
        } catch {
            logger.error("Persistent ModelContainer failed: \(error.localizedDescription). Falling back to in-memory store.")
            // Fallback: in-memory store so the app doesn't crash
            do {
                let fallbackConfig = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
                sharedModelContainer = try ModelContainer(
                    for: schema,
                    migrationPlan: GaitSessionMigrationPlan.self,
                    configurations: [fallbackConfig]
                )
                logger.warning("Using in-memory fallback — data will not persist between launches.")
            } catch {
                // Last resort: this should never happen, but if it does, crash with context
                fatalError("ModelContainer could not be created even in-memory: \(error)")
            }
        }
        
        // Initialize MetricKit monitoring (production only)
        #if !DEBUG
        _ = MetricsManager.shared
        #endif
    }

    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false

    var body: some Scene {
        WindowGroup {
            ZStack {
                if hasCompletedOnboarding {
                    MainTabView()
                } else {
                    OnboardingView(hasCompletedOnboarding: $hasCompletedOnboarding)
                }

                if showSplash {
                    SplashScreenView()
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
            .onAppear {
                // One-time migration from legacy @AppStorage goals
                migrateLegacyGoalsIfNeeded()

                // Kick off iCloud KVS sync for demographics
                KeyValueStoreSync.shared.pushAll()

                // Pre-warm CoreML models in background
                mlModelService.warmUp()

                // Dismiss splash after animation completes
                Task { @MainActor in
                    try? await Task.sleep(for: .seconds(2.8))
                    withAnimation(.easeOut(duration: 0.5)) {
                        showSplash = false
                    }
                }
            }
            .onOpenURL { url in
                deepLinkHandler.handle(url: url)
            }
        }
        .modelContainer(sharedModelContainer)
        .environment(cloudSyncService)
        .environment(mlModelService)
        .environment(deepLinkHandler)
        .onChange(of: scenePhase) { oldPhase, newPhase in
            handleScenePhaseChange(from: oldPhase, to: newPhase)
        }
    }
    
    // MARK: - Scene Phase Handling
    
    private func handleScenePhaseChange(from oldPhase: ScenePhase, to newPhase: ScenePhase) {
        switch newPhase {
        case .active:
            logger.info("App became active")
            // CloudSyncService will check for stale syncs via its own notification observer
            
        case .inactive:
            logger.debug("App became inactive")
            
        case .background:
            logger.info("App entered background")
            // Save any pending changes (SwiftData auto-saves, but be explicit)
            do {
                try sharedModelContainer.mainContext.save()
            } catch {
                logger.error("Background save failed: \(error.localizedDescription)")
            }
            
        @unknown default:
            break
        }
    }

    // MARK: - Legacy Goals Migration

    /// One-time migration from @AppStorage("goalsJSON") → SwiftData UserGoals.
    private func migrateLegacyGoalsIfNeeded() {
        let defaults = UserDefaults.standard
        let legacyKey = "goalsJSON"
        guard let json = defaults.string(forKey: legacyKey), !json.isEmpty else { return }

        let context = sharedModelContainer.mainContext
        // Only migrate if no UserGoals exist yet
        let descriptor = FetchDescriptor<UserGoals>()
        let existingCount = (try? context.fetchCount(descriptor)) ?? 0
        guard existingCount == 0 else {
            // Already migrated — clean up the legacy key
            defaults.removeObject(forKey: legacyKey)
            logger.info("Legacy goalsJSON removed (migration already complete)")
            return
        }

        if let migrated = UserGoals.fromLegacyJSON(json) {
            context.insert(migrated)
            do {
                try context.save()
            } catch {
                logger.error("Legacy goals migration save failed: \(error.localizedDescription)")
            }
            defaults.removeObject(forKey: legacyKey)
            logger.info("Migrated legacy GoalConfig → SwiftData UserGoals")
        }
    }
}
