import AppIntents
import SwiftUI
import HealthKit

// MARK: - VitalSense App Shortcuts Provider
@available(iOS 16.0, *)
struct VitalSenseShortcutsProvider: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CheckHealthScoreIntent(),
            phrases: [
                "Check my health score with \(.applicationName)",
                "Show my VitalSense health score",
                "What's my current health status",
                "Check my wellness score"
            ],
            shortTitle: "Health Score",
            systemImageName: "heart.fill"
        )
        
        AppShortcut(
            intent: CheckFallRiskIntent(),
            phrases: [
                "Check my fall risk with \(.applicationName)",
                "Show my fall risk assessment",
                "What's my mobility status",
                "Check my balance score"
            ],
            shortTitle: "Fall Risk",
            systemImageName: "figure.walk.motion"
        )
        
        AppShortcut(
            intent: GetTodayStepsIntent(),
            phrases: [
                "How many steps today with \(.applicationName)",
                "Show my step count",
                "Check my daily steps",
                "What's my walking progress"
            ],
            shortTitle: "Today's Steps",
            systemImageName: "figure.walk"
        )
        
        AppShortcut(
            intent: CheckHeartRateIntent(),
            phrases: [
                "Check my heart rate with \(.applicationName)",
                "What's my current heart rate",
                "Show my pulse",
                "Check my cardiac status"
            ],
            shortTitle: "Heart Rate",
            systemImageName: "heart.pulse"
        )
        
        AppShortcut(
            intent: GetSleepSummaryIntent(),
            phrases: [
                "How did I sleep with \(.applicationName)",
                "Show my sleep summary",
                "Check last night's sleep",
                "What's my sleep quality"
            ],
            shortTitle: "Sleep Summary",
            systemImageName: "bed.double"
        )
        
        AppShortcut(
            intent: StartGaitAssessmentIntent(),
            phrases: [
                "Start gait assessment with \(.applicationName)",
                "Check my walking pattern",
                "Analyze my mobility",
                "Test my balance"
            ],
            shortTitle: "Gait Assessment",
            systemImageName: "figure.walk.motion.trianglebadge.exclamationmark"
        )
        
        AppShortcut(
            intent: EmergencyContactIntent(),
            phrases: [
                "Call emergency contact with \(.applicationName)",
                "Alert my caregiver",
                "Send emergency alert",
                "Contact help"
            ],
            shortTitle: "Emergency Alert",
            systemImageName: "exclamationmark.triangle.fill"
        )
    }
}

// MARK: - Health Score Intent
@available(iOS 16.0, *)
struct CheckHealthScoreIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Health Score"
    static var description = IntentDescription("Get your current VitalSense health score")
    static var openAppWhenRun: Bool = false
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let healthManager = HealthKitManager.shared
        
        // Request HealthKit permission if needed
        guard await healthManager.requestAuthorization() else {
            return .result(
                dialog: "I need access to your health data to check your score. Please open VitalSense to grant permission."
            )
        }
        
        let analytics = AdvancedHealthAnalytics.shared
        let healthScore = await analytics.calculateOverallHealthScore()
        
        let status = healthStatusDescription(for: healthScore)
        let trend = await analytics.getHealthTrend()
        
        let dialogText = "Your VitalSense health score is \(healthScore) out of 100. " +
                        "That's \(status). " +
                        "Your trend is \(trend.displayName.lowercased())."
        
        return .result(
            dialog: IntentDialog(stringLiteral: dialogText),
            view: HealthScoreSnippetView(score: healthScore, status: status, trend: trend)
        )
    }
    
    private func healthStatusDescription(for score: Int) -> String {
        switch score {
        case 90...100:
            return "excellent"
        case 80..<90:
            return "good"
        case 70..<80:
            return "fair"
        case 60..<70:
            return "needs attention"
        default:
            return "concerning"
        }
    }
}

// MARK: - Fall Risk Intent
@available(iOS 16.0, *)
struct CheckFallRiskIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Fall Risk"
    static var description = IntentDescription("Get your current fall risk assessment")
    static var openAppWhenRun: Bool = false
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let gaitManager = FallRiskGaitManager.shared
        await gaitManager.fetchGaitMetrics()
        
        let riskLevel = await gaitManager.getCurrentFallRiskLevel()
        let confidence = await gaitManager.getAssessmentConfidence()
        
        let dialogText = "Your fall risk is currently \(riskLevel.displayName.lowercased()) " +
                        "with \(Int(confidence * 100))% confidence. " +
                        "This is based on your recent mobility patterns."
        
        return .result(
            dialog: IntentDialog(stringLiteral: dialogText),
            view: FallRiskSnippetView(riskLevel: riskLevel, confidence: confidence)
        )
    }
}

// MARK: - Steps Intent
@available(iOS 16.0, *)
struct GetTodayStepsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Steps"
    static var description = IntentDescription("Check your step count for today")
    static var openAppWhenRun: Bool = false
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let healthManager = HealthKitManager.shared
        
        guard await healthManager.requestAuthorization() else {
            return .result(
                dialog: "I need access to your health data. Please open VitalSense to grant permission."
            )
        }
        
        let steps = await healthManager.getTodaySteps()
        let goal = await healthManager.getStepGoal() ?? 10000
        let progress = Double(steps) / Double(goal)
        
        let dialogText: String
        if steps >= goal {
            dialogText = "Great job! You've taken \(steps.formatted(.number)) steps today, " +
                        "reaching \(Int(progress * 100))% of your goal."
        } else {
            let remaining = goal - steps
            dialogText = "You've taken \(steps.formatted(.number)) steps today. " +
                        "You need \(remaining.formatted(.number)) more to reach your goal."
        }
        
        return .result(
            dialog: IntentDialog(stringLiteral: dialogText),
            view: StepsSnippetView(steps: steps, goal: goal, progress: progress)
        )
    }
}

// MARK: - Heart Rate Intent
@available(iOS 16.0, *)
struct CheckHeartRateIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Heart Rate"
    static var description = IntentDescription("Get your most recent heart rate reading")
    static var openAppWhenRun: Bool = false
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let healthManager = HealthKitManager.shared
        
        guard await healthManager.requestAuthorization() else {
            return .result(
                dialog: "I need access to your health data. Please open VitalSense to grant permission."
            )
        }
        
        let heartRate = await healthManager.getLatestHeartRate()
        let restingHR = await healthManager.getRestingHeartRate()
        
        let dialogText: String
        if let hr = heartRate, let resting = restingHR {
            let status = heartRateStatus(current: hr, resting: resting)
            dialogText = "Your heart rate is \(hr) beats per minute. " +
                        "Your resting rate is \(resting) BPM. " +
                        "This is \(status)."
        } else if let hr = heartRate {
            dialogText = "Your heart rate is \(hr) beats per minute."
        } else {
            dialogText = "I couldn't find a recent heart rate reading. " +
                        "Make sure your Apple Watch is connected and you've taken a reading recently."
        }
        
        return .result(
            dialog: IntentDialog(stringLiteral: dialogText),
            view: HeartRateSnippetView(currentHR: heartRate, restingHR: restingHR)
        )
    }
    
    private func heartRateStatus(current: Int, resting: Int) -> String {
        let difference = current - resting
        switch difference {
        case ..<10:
            return "at rest"
        case 10..<30:
            return "slightly elevated"
        case 30..<50:
            return "moderately elevated"
        default:
            return "significantly elevated"
        }
    }
}

// MARK: - Sleep Summary Intent
@available(iOS 16.0, *)
struct GetSleepSummaryIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Sleep Summary"
    static var description = IntentDescription("Check your sleep quality from last night")
    static var openAppWhenRun: Bool = false
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        let healthManager = HealthKitManager.shared
        
        guard await healthManager.requestAuthorization() else {
            return .result(
                dialog: "I need access to your health data. Please open VitalSense to grant permission."
            )
        }
        
        let sleepData = await healthManager.getLastNightSleep()
        
        let dialogText: String
        if let sleep = sleepData {
            let hours = Int(sleep.duration / 3600)
            let minutes = Int((sleep.duration.truncatingRemainder(dividingBy: 3600)) / 60)
            let quality = sleepQualityDescription(sleep.quality)
            
            dialogText = "Last night you slept for \(hours) hours and \(minutes) minutes. " +
                        "Your sleep quality was \(quality). " +
                        "You went to bed at \(formatTime(sleep.bedtime)) and woke up at \(formatTime(sleep.wakeTime))."
        } else {
            dialogText = "I couldn't find sleep data from last night. " +
                        "Make sure your Apple Watch was worn while sleeping or manually log your sleep in the Health app."
        }
        
        return .result(
            dialog: IntentDialog(stringLiteral: dialogText),
            view: SleepSnippetView(sleepData: sleepData)
        )
    }
    
    private func sleepQualityDescription(_ quality: Double) -> String {
        switch quality {
        case 0.8...1.0:
            return "excellent"
        case 0.6..<0.8:
            return "good"
        case 0.4..<0.6:
            return "fair"
        default:
            return "poor"
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Gait Assessment Intent
@available(iOS 16.0, *)
struct StartGaitAssessmentIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Gait Assessment"
    static var description = IntentDescription("Begin a walking pattern analysis")
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // This intent opens the app to start the assessment
        return .result(
            dialog: "Opening VitalSense to start your gait assessment. " +
                    "Please follow the on-screen instructions for the walking test."
        )
    }
}

// MARK: - Emergency Contact Intent
@available(iOS 16.0, *)
struct EmergencyContactIntent: AppIntent {
    static var title: LocalizedStringResource = "Emergency Alert"
    static var description = IntentDescription("Contact emergency contacts or caregivers")
    static var openAppWhenRun: Bool = true
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // This intent opens the app to handle emergency contact
        return .result(
            dialog: "Opening VitalSense emergency contacts. " +
                    "You can quickly reach your caregivers or emergency services from here."
        )
    }
}

// MARK: - Snippet Views
@available(iOS 16.0, *)
struct HealthScoreSnippetView: View {
    let score: Int
    let status: String
    let trend: TrendDirection
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .font(.title2)
                
                Text("VitalSense Health Score")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            HStack {
                Text("\(score)")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(scoreColor)
                
                VStack(alignment: .leading) {
                    Text(status.capitalized)
                        .font(.title3)
                        .fontWeight(.medium)
                    
                    HStack(spacing: 4) {
                        Image(systemName: trend.iconName)
                            .foregroundColor(trend.color)
                        Text(trend.displayName)
                            .foregroundColor(trend.color)
                    }
                    .font(.caption)
                }
                
                Spacer()
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var scoreColor: Color {
        switch score {
        case 90...100:
            return .green
        case 80..<90:
            return .blue
        case 70..<80:
            return .orange
        default:
            return .red
        }
    }
}

@available(iOS 16.0, *)
struct FallRiskSnippetView: View {
    let riskLevel: FallRiskLevel
    let confidence: Double
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "figure.walk.motion.trianglebadge.exclamationmark")
                    .foregroundColor(.orange)
                    .font(.title2)
                
                Text("Fall Risk Assessment")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            VStack(spacing: 8) {
                Text(riskLevel.displayName)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(riskLevel.color)
                
                Text("\(Int(confidence * 100))% Confidence")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

@available(iOS 16.0, *)
struct StepsSnippetView: View {
    let steps: Int
    let goal: Int
    let progress: Double
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.green)
                    .font(.title2)
                
                Text("Today's Steps")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            VStack(spacing: 8) {
                Text(steps.formatted(.number))
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                ProgressView(value: min(progress, 1.0))
                    .progressViewStyle(LinearProgressViewStyle(tint: .green))
                    .scaleEffect(y: 2)
                
                Text("\(Int(progress * 100))% of goal (\(goal.formatted(.number)))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

@available(iOS 16.0, *)
struct HeartRateSnippetView: View {
    let currentHR: Int?
    let restingHR: Int?
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "heart.pulse")
                    .foregroundColor(.red)
                    .font(.title2)
                
                Text("Heart Rate")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            if let current = currentHR {
                HStack {
                    Text("\(current)")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.red)
                    
                    Text("BPM")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    if let resting = restingHR {
                        VStack(alignment: .trailing) {
                            Text("Resting")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("\(resting) BPM")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }
            } else {
                Text("No recent reading")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

@available(iOS 16.0, *)
struct SleepSnippetView: View {
    let sleepData: SleepData?
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "bed.double")
                    .foregroundColor(.purple)
                    .font(.title2)
                
                Text("Last Night's Sleep")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            if let sleep = sleepData {
                VStack(spacing: 8) {
                    let hours = Int(sleep.duration / 3600)
                    let minutes = Int((sleep.duration.truncatingRemainder(dividingBy: 3600)) / 60)
                    
                    Text("\(hours)h \(minutes)m")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    HStack {
                        VStack {
                            Text("Bedtime")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(formatTime(sleep.bedtime))
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        
                        Spacer()
                        
                        VStack {
                            Text("Wake Time")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(formatTime(sleep.wakeTime))
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                    }
                }
            } else {
                Text("No sleep data")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Supporting Data Types
struct SleepData {
    let duration: TimeInterval
    let quality: Double
    let bedtime: Date
    let wakeTime: Date
}
