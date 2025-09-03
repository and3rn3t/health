import SwiftUI
import HealthKit
import WatchConnectivity

@main
struct HealthKitBridgeWatchApp: App {
    @StateObject private var gaitMonitor = AppleWatchGaitMonitor.shared
    @StateObject private var workoutManager = WatchWorkoutManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(gaitMonitor)
                .environmentObject(workoutManager)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject private var gaitMonitor: AppleWatchGaitMonitor
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Gait Monitoring Tab
            WatchGaitMonitorView()
                .tabItem {
                    Image(systemName: "figure.walk")
                    Text("Gait")
                }
                .tag(0)
            
            // Quick Stats Tab
            WatchQuickStatsView()
                .tabItem {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                    Text("Stats")
                }
                .tag(1)
            
            // Settings Tab
            WatchSettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(2)
        }
    }
}

struct WatchQuickStatsView: View {
    @EnvironmentObject private var gaitMonitor: AppleWatchGaitMonitor
    
    var body: some View {
        VStack(spacing: 8) {
            Text("Today's Activity")
                .font(.headline)
                .fontWeight(.semibold)
            
            if gaitMonitor.isMonitoring {
                // Current session stats
                VStack(spacing: 4) {
                    HStack {
                        Image(systemName: "figure.walk.circle.fill")
                            .foregroundColor(.green)
                        Text("\(gaitMonitor.realtimeMetrics.stepCount)")
                        Text("steps")
                            .foregroundColor(.secondary)
                    }
                    .font(.subheadline)
                    
                    HStack {
                        Image(systemName: "speedometer")
                            .foregroundColor(.blue)
                        Text(String(format: "%.1f", gaitMonitor.realtimeMetrics.currentCadence))
                        Text("SPM")
                            .foregroundColor(.secondary)
                    }
                    .font(.caption)
                    
                    HStack {
                        Image(systemName: "scale.3d")
                            .foregroundColor(gaitMonitor.realtimeMetrics.averageStability > 7 ? .green : .orange)
                        Text(String(format: "%.1f", gaitMonitor.realtimeMetrics.averageStability))
                        Text("stability")
                            .foregroundColor(.secondary)
                    }
                    .font(.caption)
                }
            } else {
                Text("Start monitoring to see stats")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
    }
}

struct WatchSettingsView: View {
    @AppStorage("autoStartMonitoring") private var autoStartMonitoring = false
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @AppStorage("dataSync") private var dataSync = true
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Settings")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 8) {
                Toggle("Auto-start monitoring", isOn: $autoStartMonitoring)
                    .font(.caption)
                
                Toggle("Haptic feedback", isOn: $hapticFeedback)
                    .font(.caption)
                
                Toggle("Sync with iPhone", isOn: $dataSync)
                    .font(.caption)
            }
            
            Text("Version 1.0")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

// MARK: - Watch Workout Manager
class WatchWorkoutManager: NSObject, ObservableObject {
    static let shared = WatchWorkoutManager()
    
    @Published var isWorkoutActive = false
    @Published var workoutType: HKWorkoutActivityType = .walking
    
    private let healthStore = HKHealthStore()
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    
    override init() {
        super.init()
    }
    
    func startWorkout() async {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .walking
        configuration.locationType = .outdoor
        
        do {
            let session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            let builder = session.associatedWorkoutBuilder()
            
            session.delegate = self
            builder.delegate = self
            
            await MainActor.run {
                self.workoutSession = session
                self.workoutBuilder = builder
            }
            
            // Start collecting data
            builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            
            session.startActivity(with: Date())
            try await builder.beginCollection(at: Date())
            
            await MainActor.run {
                self.isWorkoutActive = true
            }
            
        } catch {
            print("❌ Failed to start workout: \(error)")
        }
    }
    
    func endWorkout() async {
        guard let workoutSession = workoutSession,
              let workoutBuilder = workoutBuilder else { return }
        
        workoutSession.end()
        
        do {
            try await workoutBuilder.endCollection(at: Date())
            let workout = try await workoutBuilder.finishWorkout()
            
            await MainActor.run {
                self.isWorkoutActive = false
                self.workoutSession = nil
                self.workoutBuilder = nil
            }
            
            print("✅ Workout saved: \(workout)")
            
        } catch {
            print("❌ Failed to end workout: \(error)")
        }
    }
}

// MARK: - Workout Session Delegate
extension WatchWorkoutManager: HKWorkoutSessionDelegate {
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        DispatchQueue.main.async {
            switch toState {
            case .running:
                self.isWorkoutActive = true
            case .ended:
                self.isWorkoutActive = false
            default:
                break
            }
        }
    }
    
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        print("❌ Workout session failed: \(error)")
        DispatchQueue.main.async {
            self.isWorkoutActive = false
        }
    }
}

// MARK: - Live Workout Builder Delegate
extension WatchWorkoutManager: HKLiveWorkoutBuilderDelegate {
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        // Handle collected workout data
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType else { continue }
            
            if let statistics = workoutBuilder.statistics(for: quantityType) {
                // Process statistics for gait analysis
                print("📊 Collected \(type.identifier): \(statistics)")
            }
        }
    }
    
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {
        // Handle workout events
    }
}
