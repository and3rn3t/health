import SwiftUI
import CoreLocation
import HealthKit

// MARK: - Walking Coach View
struct WalkingCoachView: View {
    @StateObject private var walkingCoach = WalkingCoachManager()
    @Environment(\.dismiss) private var dismiss

    @State private var isCoachingActive = false
    @State private var selectedWorkout: WalkingWorkout?
    @State private var showingWorkoutSelection = false

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    if isCoachingActive {
                        ActiveCoachingView()
                    } else {
                        CoachingSetupView()
                    }
                }
                .padding()
            }
            .navigationTitle("Walking Coach")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") { dismiss() }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isCoachingActive ? "Stop" : "Start") {
                        toggleCoaching()
                    }
                    .foregroundColor(isCoachingActive ? .red : .blue)
                }
            }
        }
        .onAppear {
            walkingCoach.requestPermissions()
        }
        .sheet(isPresented: $showingWorkoutSelection) {
            WorkoutSelectionView(selectedWorkout: $selectedWorkout)
        }
    }

    // MARK: - Active Coaching View

    @ViewBuilder
    private func ActiveCoachingView() -> some View {
        // Real-time Metrics
        RealTimeMetricsCard()

        // Coaching Feedback
        CoachingFeedbackCard()

        // Progress Tracking
        WorkoutProgressCard()

        // Emergency Stop Button
        Button(action: { walkingCoach.stopCoaching() }) {
            HStack {
                Image(systemName: "stop.fill")
                Text("Stop Coaching Session")
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }

    // MARK: - Coaching Setup View

    @ViewBuilder
    private func CoachingSetupView() -> some View {
        // Welcome Card
        WelcomeToCoachingCard()

        // Workout Selection
        WorkoutSelectionCard()

        // Goals Setting
        GoalsSettingCard()

        // Permissions Status
        PermissionsStatusCard()

        // Start Coaching Button
        Button(action: startCoaching) {
            HStack {
                Image(systemName: "play.fill")
                Text("Start Walking Session")
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(walkingCoach.canStartCoaching ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(!walkingCoach.canStartCoaching)
    }

    // MARK: - Helper Functions

    private func toggleCoaching() {
        if isCoachingActive {
            walkingCoach.stopCoaching()
            isCoachingActive = false
        } else {
            startCoaching()
        }
    }

    private func startCoaching() {
        walkingCoach.startCoaching(workout: selectedWorkout)
        isCoachingActive = true
    }
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
    private var workoutBuilder: HKLiveWorkoutBuilder?
    private var startTime: Date?
    private var lastLocation: CLLocation?
    private var coachingTimer: Timer?

    override init() {
        super.init()
        setupLocationManager()
        setupMotionManager()
    }

    // MARK: - Permissions

    func requestPermissions() {
        requestLocationPermission()
        requestHealthKitPermissions()
    }

    private func requestLocationPermission() {
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
    }

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

        healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead) { [weak self] success, error in
            DispatchQueue.main.async {
                self?.updateCoachingAvailability()
            }
        }
    }

    private func updateCoachingAvailability() {
        canStartCoaching = locationManager.authorizationStatus == .authorizedWhenInUse &&
                          healthStore.authorizationStatus(for: HKWorkoutType.workoutType()) == .sharingAuthorized
    }

    // MARK: - Coaching Control

    func startCoaching(workout: WalkingWorkout?) {
        guard canStartCoaching else { return }

        isCoaching = true
        startTime = Date()

        startWorkoutSession()
        startLocationTracking()
        startMotionTracking()
        startCoachingFeedback()

        print("🚶‍♂️ Walking coaching started")
    }

    func stopCoaching() {
        isCoaching = false

        stopWorkoutSession()
        stopLocationTracking()
        stopMotionTracking()
        stopCoachingFeedback()

        generateWorkoutSummary()

        print("🏁 Walking coaching stopped")
    }

    // MARK: - Workout Session Management

    private func startWorkoutSession() {
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .walking
        configuration.locationType = .outdoor

        do {
            workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            workoutBuilder = workoutSession?.associatedWorkoutBuilder()

            workoutBuilder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: configuration)

            workoutSession?.startActivity(with: Date())
            workoutBuilder?.beginCollection(withStart: Date()) { [weak self] success, error in
                if success {
                    print("✅ Workout collection started")
                } else {
                    print("❌ Failed to start workout collection: \(error?.localizedDescription ?? "Unknown error")")
                }
            }
        } catch {
            print("❌ Failed to start workout session: \(error)")
        }
    }

    private func stopWorkoutSession() {
        workoutSession?.stopActivity(with: Date())
        workoutBuilder?.endCollection(withEnd: Date()) { [weak self] success, error in
            if success {
                self?.finishWorkout()
            }
        }
    }

    private func finishWorkout() {
        workoutBuilder?.finishWorkout { [weak self] workout, error in
            if let workout = workout {
                print("✅ Workout saved: \(workout)")
            } else {
                print("❌ Failed to save workout: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }

    // MARK: - Real-time Tracking

    private func startLocationTracking() {
        locationManager.startUpdatingLocation()
    }

    private func stopLocationTracking() {
        locationManager.stopUpdatingLocation()
    }

    private func startMotionTracking() {
        guard motionManager.isDeviceMotionAvailable else { return }

        motionManager.deviceMotionUpdateInterval = 1.0
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let motion = motion else { return }
            self?.processMotionData(motion)
        }
    }

    private func stopMotionTracking() {
        motionManager.stopDeviceMotionUpdates()
    }

    private func processMotionData(_ motion: CMDeviceMotion) {
        // Analyze walking pattern from device motion
        let acceleration = motion.userAcceleration
        let rotationRate = motion.rotationRate

        // Calculate step detection and gait quality
        // This is a simplified version - real implementation would be more sophisticated
        let stepCadence = calculateStepCadence(from: acceleration)
        let gaitStability = calculateGaitStability(from: rotationRate)

        updateRealtimeMetrics(stepCadence: stepCadence, gaitStability: gaitStability)
    }

    private func calculateStepCadence(from acceleration: CMAcceleration) -> Double {
        // Simplified step detection algorithm
        let magnitude = sqrt(acceleration.x * acceleration.x +
                           acceleration.y * acceleration.y +
                           acceleration.z * acceleration.z)

        // This would typically involve more sophisticated peak detection
        return magnitude > 0.1 ? 120.0 : 0.0 // Simplified cadence estimation
    }

    private func calculateGaitStability(from rotationRate: CMRotationRate) -> Double {
        // Measure rotational stability during walking
        let rotationMagnitude = sqrt(rotationRate.x * rotationRate.x +
                                   rotationRate.y * rotationRate.y +
                                   rotationRate.z * rotationRate.z)

        // Lower rotation = more stable gait
        return max(0, 1.0 - rotationMagnitude)
    }

    private func updateRealtimeMetrics(stepCadence: Double, gaitStability: Double) {
        let metrics = RealtimeWalkingMetrics(
            elapsedTime: Date().timeIntervalSince(startTime ?? Date()),
            currentSpeed: locationManager.location?.speed ?? 0,
            stepCadence: stepCadence,
            gaitStability: gaitStability,
            distance: calculateTotalDistance(),
            heartRate: 0 // Would be populated from HealthKit real-time queries
        )

        DispatchQueue.main.async {
            self.currentMetrics = metrics
            self.generateRealtimeFeedback(metrics)
        }
    }

    // MARK: - Coaching Feedback

    private func startCoachingFeedback() {
        coachingTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.generatePeriodicFeedback()
        }
    }

    private func stopCoachingFeedback() {
        coachingTimer?.invalidate()
        coachingTimer = nil
    }

    private func generateRealtimeFeedback(_ metrics: RealtimeWalkingMetrics) {
        var feedback: [CoachingFeedback] = []

        // Speed feedback
        if metrics.currentSpeed < 0.8 {
            feedback.append(CoachingFeedback(
                type: .speed,
                message: "Try to pick up the pace a bit",
                priority: .medium,
                timestamp: Date()
            ))
        } else if metrics.currentSpeed > 1.8 {
            feedback.append(CoachingFeedback(
                type: .speed,
                message: "Great pace! Keep it up",
                priority: .positive,
                timestamp: Date()
            ))
        }

        // Cadence feedback
        if metrics.stepCadence < 100 {
            feedback.append(CoachingFeedback(
                type: .cadence,
                message: "Take more frequent steps",
                priority: .medium,
                timestamp: Date()
            ))
        }

        // Stability feedback
        if metrics.gaitStability < 0.7 {
            feedback.append(CoachingFeedback(
                type: .stability,
                message: "Focus on steady, controlled steps",
                priority: .high,
                timestamp: Date()
            ))
        }

        // Update feedback list (keep only recent feedback)
        DispatchQueue.main.async {
            self.coachingFeedback.append(contentsOf: feedback)
            self.coachingFeedback = Array(self.coachingFeedback.suffix(10))
        }
    }

    private func generatePeriodicFeedback() {
        let encouragementMessages = [
            "You're doing great! Keep up the excellent work",
            "Halfway there! Your consistency is impressive",
            "Your walking form is improving with each step",
            "Great rhythm! Your gait is looking stable",
            "Excellent pace! You're in the optimal zone"
        ]

        let feedback = CoachingFeedback(
            type: .encouragement,
            message: encouragementMessages.randomElement() ?? "Keep going!",
            priority: .positive,
            timestamp: Date()
        )

        DispatchQueue.main.async {
            self.coachingFeedback.append(feedback)
        }
    }

    // MARK: - Helper Functions

    private func calculateTotalDistance() -> Double {
        // This would calculate distance from location updates
        return 0.0 // Placeholder
    }

    private func generateWorkoutSummary() {
        // Generate comprehensive workout summary
        print("📊 Generating workout summary...")
    }

    private func setupLocationManager() {
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 1.0
    }

    private func setupMotionManager() {
        // Motion manager setup
    }
}

// MARK: - CLLocationManagerDelegate

extension WalkingCoachManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newLocation = locations.last else { return }

        if let lastLocation = lastLocation {
            let distance = newLocation.distance(from: lastLocation)
            // Process distance and speed calculations
        }

        lastLocation = newLocation
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        updateCoachingAvailability()
    }
}

// MARK: - Supporting Models

struct RealtimeWalkingMetrics {
    let elapsedTime: TimeInterval
    let currentSpeed: CLLocationSpeed
    let stepCadence: Double
    let gaitStability: Double
    let distance: Double
    let heartRate: Double
}

struct CoachingFeedback {
    let type: FeedbackType
    let message: String
    let priority: FeedbackPriority
    let timestamp: Date
}

struct WorkoutProgress {
    let elapsedTime: TimeInterval
    let targetTime: TimeInterval
    let completedDistance: Double
    let targetDistance: Double
    let averageSpeed: Double
}

struct WalkingWorkout {
    let name: String
    let description: String
    let targetDuration: TimeInterval
    let targetDistance: Double?
    let intensity: WorkoutIntensity
}

enum FeedbackType {
    case speed, cadence, stability, posture, encouragement
}

enum FeedbackPriority {
    case low, medium, high, positive

    var color: Color {
        switch self {
        case .low: return .blue
        case .medium: return .yellow
        case .high: return .red
        case .positive: return .green
        }
    }
}

enum WorkoutIntensity {
    case easy, moderate, vigorous
}
