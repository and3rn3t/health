import SwiftUI
import CoreLocation
import HealthKit
import CoreMotion

// MARK: - Walking Coach View
struct WalkingCoachView: View {
    @StateObject private var walkingCoach = WalkingCoachManager()
    @Environment(\.dismiss) private var dismiss

    @State private var isCoachingActive = false
    @State private var selectedWorkout: WalkingWorkout?

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    if isCoachingActive { activeCoachingView() } else { coachingSetupView() }
                }
                .padding()
            }
            .navigationTitle("Walking Coach")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isCoachingActive ? "Stop" : "Start") { toggleCoaching() }
                        .foregroundColor(isCoachingActive ? .red : .blue)
                }
            }
        }
        .onAppear { walkingCoach.requestPermissions() }
    }

    // MARK: - Active Coaching View
    @ViewBuilder
    private func activeCoachingView() -> some View {
        VStack(spacing: 16) {
            if let m = walkingCoach.currentMetrics {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Elapsed: \(Int(m.elapsedTime))s")
                    Text(String(format: "Speed: %.2f m/s", m.currentSpeed))
                    Text(String(format: "Cadence: %.0f spm", m.stepCadence))
                    Text(String(format: "Stability: %.0f%%", m.gaitStability * 100))
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.blue.opacity(0.08)))
            } else {
                Text("Awaiting metrics...")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.gray.opacity(0.1)))
            }
            if !walkingCoach.coachingFeedback.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Feedback").font(.headline)
                    ForEach(Array(walkingCoach.coachingFeedback.suffix(5).enumerated()), id: \.offset) { _, item in
                        Text(item.message).font(.caption)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.orange.opacity(0.08)))
            }
            Button(action: { walkingCoach.stopCoaching(); isCoachingActive = false }) {
                HStack { Image(systemName: "stop.fill"); Text("Stop Coaching Session") }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
    }

    // MARK: - Coaching Setup View
    @ViewBuilder
    private func coachingSetupView() -> some View {
        VStack(spacing: 16) {
            Text("Personalized walking guidance")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text("Grant location & Health permissions, then start a session to receive real‑time feedback.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            HStack {
                Label("Location", systemImage: walkingCoach.canStartCoaching ? "checkmark.circle" : "location")
                Spacer()
                Label("Health", systemImage: walkingCoach.canStartCoaching ? "checkmark.circle" : "heart")
            }
            .font(.caption)
            .padding(8)
            .background(RoundedRectangle(cornerRadius: 10).fill(Color.gray.opacity(0.1)))
            Button(action: startCoaching) {
                HStack { Image(systemName: "play.fill"); Text("Start Walking Session") }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(walkingCoach.canStartCoaching ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(!walkingCoach.canStartCoaching)
        }
    }

    // MARK: - Helper Functions
    private func toggleCoaching() {
        if isCoachingActive { walkingCoach.stopCoaching(); isCoachingActive = false } else { startCoaching() }
    }
    private func startCoaching() { walkingCoach.startCoaching(workout: selectedWorkout); isCoachingActive = true }
}

// MARK: - Walking Coach Manager
class WalkingCoachManager: NSObject, ObservableObject {
    @Published var isCoaching = false
    @Published var currentMetrics: RealtimeWalkingMetrics?
    @Published var coachingFeedback: [CoachingFeedback] = []
    @Published var workoutProgress: WorkoutProgress?
    @Published var canStartCoaching = false

    private let locationManager = CLLocationManager()
    private let healthStore = HKHealthStore()
    private let motionManager = CMMotionManager()

    private var workoutSession: HKWorkoutSession?
    #if os(watchOS)
    private var workoutBuilder: HKLiveWorkoutBuilder?
    #endif
    private var startTime: Date?
    private var lastLocation: CLLocation?
    private var coachingTimer: Timer?

    override init() {
        super.init()
        setupLocationManager()
        setupMotionManager()
    }

    // MARK: Permissions
    func requestPermissions() { requestLocationPermission(); requestHealthKitPermissions() }
    private func requestLocationPermission() { locationManager.delegate = self; locationManager.requestWhenInUseAuthorization() }
    private func requestHealthKitPermissions() {
        let typesToRead: Set<HKObjectType> = [
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKQuantityType.quantityType(forIdentifier: .walkingSpeed)!,
            HKQuantityType.quantityType(forIdentifier: .heartRate)!
        ]
        let typesToWrite: Set<HKSampleType> = [
            HKQuantityType.quantityType(forIdentifier: .stepCount)!,
            HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!,
            HKWorkoutType.workoutType()
        ]
        healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead) { [weak self] _, _ in
            DispatchQueue.main.async { self?.updateCoachingAvailability() }
        }
    }
    private func updateCoachingAvailability() {
        canStartCoaching = locationManager.authorizationStatus == .authorizedWhenInUse &&
            healthStore.authorizationStatus(for: HKWorkoutType.workoutType()) == .sharingAuthorized
    }

    // MARK: Control
    func startCoaching(workout: WalkingWorkout?) {
        guard canStartCoaching else { return }
        isCoaching = true
        startTime = Date()
        startWorkoutSession(); startLocationTracking(); startMotionTracking(); startCoachingFeedback()
    }
    func stopCoaching() {
        isCoaching = false
        stopWorkoutSession(); stopLocationTracking(); stopMotionTracking(); stopCoachingFeedback(); generateWorkoutSummary()
    }

    // MARK: Workout Session
    private func startWorkoutSession() {
        #if os(watchOS)
        let configuration = HKWorkoutConfiguration(); configuration.activityType = .walking; configuration.locationType = .outdoor
        do {
            workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            workoutBuilder = workoutSession?.associatedWorkoutBuilder()
            workoutBuilder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)
            workoutSession?.startActivity(with: Date())
            workoutBuilder?.beginCollection(withStart: Date()) { _, _ in }
        } catch { print("Failed to start workout session: \(error)") }
        #else
        if #available(iOS 26.0, *) {
            let configuration = HKWorkoutConfiguration(); configuration.activityType = .walking; configuration.locationType = .outdoor
            do { workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration); workoutSession?.startActivity(with: Date()) } catch { print("Failed to start workout session: \(error)") }
        }
        #endif
    }
    private func stopWorkoutSession() {
        workoutSession?.stopActivity(with: Date())
        #if os(watchOS)
        workoutBuilder?.endCollection(withEnd: Date()) { [weak self] _, _ in self?.finishWorkout() }
        #endif
    }
    private func finishWorkout() {
        #if os(watchOS)
        workoutBuilder?.finishWorkout { _, error in if let error = error { print("Workout save error: \(error)") } }
        #endif
    }

    // MARK: Tracking
    private func startLocationTracking() { locationManager.startUpdatingLocation() }
    private func stopLocationTracking() { locationManager.stopUpdatingLocation() }
    private func startMotionTracking() {
        guard motionManager.isDeviceMotionAvailable else { return }
        motionManager.deviceMotionUpdateInterval = 1.0
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in guard let motion else { return }; self?.processMotionData(motion) }
    }
    private func stopMotionTracking() { motionManager.stopDeviceMotionUpdates() }
    private func processMotionData(_ motion: CMDeviceMotion) {
        let acc = motion.userAcceleration
        let rot = motion.rotationRate
        let stepCadence = calculateStepCadence(from: acc)
        let gaitStability = calculateGaitStability(from: rot)
        updateRealtimeMetrics(stepCadence: stepCadence, gaitStability: gaitStability)
    }
    private func calculateStepCadence(from acceleration: CMAcceleration) -> Double {
        let mag = sqrt(acceleration.x*acceleration.x + acceleration.y*acceleration.y + acceleration.z*acceleration.z)
        return mag > 0.1 ? 120.0 : 0.0
    }
    private func calculateGaitStability(from rotationRate: CMRotationRate) -> Double {
        let rotMag = sqrt(rotationRate.x*rotationRate.x + rotationRate.y*rotationRate.y + rotationRate.z*rotationRate.z)
        return max(0, 1.0 - rotMag)
    }
    private func updateRealtimeMetrics(stepCadence: Double, gaitStability: Double) {
        let metrics = RealtimeWalkingMetrics(
            elapsedTime: Date().timeIntervalSince(startTime ?? Date()),
            currentSpeed: locationManager.location?.speed ?? 0,
            stepCadence: stepCadence,
            gaitStability: gaitStability,
            distance: calculateTotalDistance(),
            heartRate: 0
        )
        DispatchQueue.main.async { self.currentMetrics = metrics; self.generateRealtimeFeedback(metrics) }
    }

    // MARK: Feedback
    private func startCoachingFeedback() { coachingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in self?.generatePeriodicFeedback() } }
    private func stopCoachingFeedback() { coachingTimer?.invalidate(); coachingTimer = nil }
    private func generateRealtimeFeedback(_ metrics: RealtimeWalkingMetrics) {
        var feedback: [CoachingFeedback] = []
        if metrics.currentSpeed < 0.8 { feedback.append(CoachingFeedback(type: .speed, message: "Try to pick up the pace a bit", priority: .medium, timestamp: Date())) }
        else if metrics.currentSpeed > 1.8 { feedback.append(CoachingFeedback(type: .speed, message: "Great pace! Keep it up", priority: .positive, timestamp: Date())) }
        if metrics.stepCadence < 100 { feedback.append(CoachingFeedback(type: .cadence, message: "Take more frequent steps", priority: .medium, timestamp: Date())) }
        if metrics.gaitStability < 0.7 { feedback.append(CoachingFeedback(type: .stability, message: "Focus on steady, controlled steps", priority: .high, timestamp: Date())) }
        DispatchQueue.main.async { self.coachingFeedback.append(contentsOf: feedback); self.coachingFeedback = Array(self.coachingFeedback.suffix(10)) }
    }
    private func generatePeriodicFeedback() {
        let encouragement = [
            "You're doing great! Keep up the excellent work",
            "Halfway there! Your consistency is impressive",
            "Your walking form is improving with each step",
            "Great rhythm! Your gait is looking stable",
            "Excellent pace! You're in the optimal zone"
        ]
        let fb = CoachingFeedback(type: .encouragement, message: encouragement.randomElement() ?? "Keep going!", priority: .positive, timestamp: Date())
        DispatchQueue.main.async { self.coachingFeedback.append(fb) }
    }

    // MARK: Helpers
    private func calculateTotalDistance() -> Double { 0 }
    private func generateWorkoutSummary() { }
    private func setupLocationManager() { locationManager.desiredAccuracy = kCLLocationAccuracyBest; locationManager.distanceFilter = 1 }
    private func setupMotionManager() { }
}

// MARK: - CLLocationManagerDelegate
extension WalkingCoachManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last else { return }
        if let last = lastLocation { _ = newLocation.distance(from: last) }
        lastLocation = newLocation
    }
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) { updateCoachingAvailability() }
}

// MARK: - Supporting Models
struct RealtimeWalkingMetrics { let elapsedTime: TimeInterval; let currentSpeed: CLLocationSpeed; let stepCadence: Double; let gaitStability: Double; let distance: Double; let heartRate: Double }
struct CoachingFeedback { let type: FeedbackType; let message: String; let priority: FeedbackPriority; let timestamp: Date }
struct WorkoutProgress { let elapsedTime: TimeInterval; let targetTime: TimeInterval; let completedDistance: Double; let targetDistance: Double; let averageSpeed: Double }
struct WalkingWorkout { let name: String; let description: String; let targetDuration: TimeInterval; let targetDistance: Double?; let intensity: WorkoutIntensity }

enum FeedbackType { case speed, cadence, stability, posture, encouragement }
enum FeedbackPriority { case low, medium, high, positive }
enum WorkoutIntensity { case easy, moderate, vigorous }
