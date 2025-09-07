import WidgetKit
import SwiftUI
import HealthKit

// MARK: - Widget Configuration
struct HealthKitBridgeWidget: Widget {
    let kind: String = "HealthKitBridgeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: VitalSenseProvider()
        ) { entry in
            VitalSenseWidgetView(entry: entry)
        }
        .configurationDisplayName("VitalSense Health")
        .description("Monitor your health metrics and fall risk at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Timeline Provider
struct VitalSenseProvider: TimelineProvider {
    func placeholder(in context: Context) -> VitalSenseEntry {
        VitalSenseEntry(
            date: Date(),
            healthScore: 85,
            fallRisk: .low,
            heartRate: 72,
            steps: 8547,
            sleepHours: 7.5,
            trend: .improving,
            lastUpdate: Date()
        )
    }

    func getSnapshot(
        in context: Context,
        completion: @escaping (VitalSenseEntry) -> Void
    ) {
        Task {
            let entry = await fetchHealthData()
            completion(entry)
        }
    }

    func getTimeline(
        in context: Context,
        completion: @escaping (Timeline<Entry>) -> Void
    ) {
        Task {
            let currentEntry = await fetchHealthData()
            
            // Create timeline entries for the next 6 hours, updating every hour
            var entries: [VitalSenseEntry] = []
            let now = Date()
            
            for hourOffset in 0..<6 {
                let entryDate = Calendar.current.date(
                    byAdding: .hour,
                    value: hourOffset,
                    to: now
                ) ?? now
                
                // For future entries, we'll use current data but update the date
                let entry = VitalSenseEntry(
                    date: entryDate,
                    healthScore: currentEntry.healthScore,
                    fallRisk: currentEntry.fallRisk,
                    heartRate: currentEntry.heartRate,
                    steps: currentEntry.steps,
                    sleepHours: currentEntry.sleepHours,
                    trend: currentEntry.trend,
                    lastUpdate: currentEntry.lastUpdate
                )
                entries.append(entry)
            }
            
            // Refresh timeline every hour
            let nextUpdate = Calendar.current.date(
                byAdding: .hour,
                value: 1,
                to: now
            ) ?? now
            
            let timeline = Timeline(entries: entries, policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func fetchHealthData() async -> VitalSenseEntry {
        let healthManager = HealthKitManager.shared
        
        // Fetch recent health data
        let healthScore = await fetchHealthScore()
        let fallRisk = await fetchFallRisk()
        let heartRate = await fetchRecentHeartRate()
        let steps = await fetchTodaySteps()
        let sleepHours = await fetchLastNightSleep()
        let trend = await calculateTrend()
        
        return VitalSenseEntry(
            date: Date(),
            healthScore: healthScore,
            fallRisk: fallRisk,
            heartRate: heartRate,
            steps: steps,
            sleepHours: sleepHours,
            trend: trend,
            lastUpdate: Date()
        )
    }
    
    private func fetchHealthScore() async -> Int {
        // Implementation would calculate overall health score
        return Int.random(in: 70...95) // Placeholder
    }
    
    private func fetchFallRisk() async -> FallRiskLevel {
        // Implementation would assess current fall risk
        return .low // Placeholder
    }
    
    private func fetchRecentHeartRate() async -> Int {
        // Implementation would get most recent heart rate
        return Int.random(in: 60...100) // Placeholder
    }
    
    private func fetchTodaySteps() async -> Int {
        // Implementation would get today's step count
        return Int.random(in: 3000...15000) // Placeholder
    }
    
    private func fetchLastNightSleep() async -> Double {
        // Implementation would get last night's sleep duration
        return Double.random(in: 6.0...9.0) // Placeholder
    }
    
    private func calculateTrend() async -> TrendDirection {
        // Implementation would compare recent vs historical data
        return .improving // Placeholder
    }
}

// MARK: - Widget Entry
struct VitalSenseEntry: TimelineEntry {
    let date: Date
    let healthScore: Int
    let fallRisk: FallRiskLevel
    let heartRate: Int
    let steps: Int
    let sleepHours: Double
    let trend: TrendDirection
    let lastUpdate: Date
}

// MARK: - Widget Views
struct VitalSenseWidgetView: View {
    let entry: VitalSenseProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget (Health Score Focus)
struct SmallWidgetView: View {
    let entry: VitalSenseEntry
    
    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(ModernDesignSystem.Colors.primary)
                    .font(.caption)
                
                Text("VitalSense")
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                
                Spacer()
                
                TrendIcon(direction: entry.trend)
            }
            
            Spacer()
            
            // Main Health Score
            VStack(spacing: 4) {
                Text("\(entry.healthScore)")
                    .font(ModernDesignSystem.Typography.numericLarge)
                    .foregroundColor(healthScoreColor(entry.healthScore))
                
                Text("Health Score")
                    .font(ModernDesignSystem.Typography.caption)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
            }
            
            Spacer()
            
            // Fall Risk Indicator
            HStack {
                Circle()
                    .fill(entry.fallRisk.color)
                    .frame(width: 6, height: 6)
                
                Text(entry.fallRisk.shortDisplayName)
                    .font(ModernDesignSystem.Typography.caption2)
                    .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                
                Spacer()
            }
        }
        .padding(12)
        .background(ModernDesignSystem.Colors.surface)
        .cornerRadius(16)
    }
    
    private func healthScoreColor(_ score: Int) -> Color {
        switch score {
        case 90...100:
            return ModernDesignSystem.Colors.healthGreen
        case 80..<90:
            return ModernDesignSystem.Colors.primary
        case 70..<80:
            return ModernDesignSystem.Colors.healthYellow
        case 60..<70:
            return ModernDesignSystem.Colors.healthOrange
        default:
            return ModernDesignSystem.Colors.healthRed
        }
    }
}

// MARK: - Medium Widget (Key Metrics)
struct MediumWidgetView: View {
    let entry: VitalSenseEntry
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(ModernDesignSystem.Colors.primary)
                        .font(.callout)
                    
                    Text("VitalSense")
                        .font(ModernDesignSystem.Typography.callout)
                        .fontWeight(.medium)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                }
                
                Spacer()
                
                HStack(spacing: 4) {
                    TrendIcon(direction: entry.trend)
                    Text(entry.trend.displayName)
                        .font(ModernDesignSystem.Typography.caption2)
                        .foregroundColor(entry.trend.color)
                }
            }
            
            // Metrics Grid
            HStack(spacing: 16) {
                // Health Score
                VStack(spacing: 4) {
                    Text("\(entry.healthScore)")
                        .font(ModernDesignSystem.Typography.numericMedium)
                        .foregroundColor(healthScoreColor(entry.healthScore))
                    
                    Text("Health")
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
                
                Divider()
                
                // Heart Rate
                VStack(spacing: 4) {
                    Text("\(entry.heartRate)")
                        .font(ModernDesignSystem.Typography.numericMedium)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                    
                    Text("BPM")
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
                
                Divider()
                
                // Steps
                VStack(spacing: 4) {
                    Text("\(entry.steps.formatted(.number.notation(.compactName)))")
                        .font(ModernDesignSystem.Typography.numericMedium)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                    
                    Text("Steps")
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
            }
            
            // Fall Risk Status
            HStack {
                HStack(spacing: 6) {
                    Circle()
                        .fill(entry.fallRisk.color)
                        .frame(width: 8, height: 8)
                    
                    Text("Fall Risk: \(entry.fallRisk.displayName)")
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                }
                
                Spacer()
                
                Text(timeAgoString(from: entry.lastUpdate))
                    .font(ModernDesignSystem.Typography.caption2)
                    .foregroundColor(ModernDesignSystem.Colors.textTertiary)
            }
        }
        .padding(16)
        .background(ModernDesignSystem.Colors.surface)
        .cornerRadius(16)
    }
    
    private func healthScoreColor(_ score: Int) -> Color {
        switch score {
        case 90...100:
            return ModernDesignSystem.Colors.healthGreen
        case 80..<90:
            return ModernDesignSystem.Colors.primary
        case 70..<80:
            return ModernDesignSystem.Colors.healthYellow
        case 60..<70:
            return ModernDesignSystem.Colors.healthOrange
        default:
            return ModernDesignSystem.Colors.healthRed
        }
    }
}

// MARK: - Large Widget (Comprehensive View)
struct LargeWidgetView: View {
    let entry: VitalSenseEntry
    
    var body: some View {
        VStack(spacing: 16) {
            // Header with Branding
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "heart.fill")
                        .foregroundColor(ModernDesignSystem.Colors.primary)
                        .font(.title3)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("VitalSense")
                            .font(ModernDesignSystem.Typography.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                        
                        Text("Health Dashboard")
                            .font(ModernDesignSystem.Typography.caption)
                            .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 4) {
                        TrendIcon(direction: entry.trend)
                        Text(entry.trend.displayName)
                            .font(ModernDesignSystem.Typography.caption)
                            .foregroundColor(entry.trend.color)
                    }
                    
                    Text(timeAgoString(from: entry.lastUpdate))
                        .font(ModernDesignSystem.Typography.caption2)
                        .foregroundColor(ModernDesignSystem.Colors.textTertiary)
                }
            }
            
            // Primary Health Score
            VStack(spacing: 8) {
                HStack {
                    Text("\(entry.healthScore)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(healthScoreColor(entry.healthScore))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Health Score")
                            .font(ModernDesignSystem.Typography.subheadline)
                            .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                        
                        Text(healthScoreDescription(entry.healthScore))
                            .font(ModernDesignSystem.Typography.caption)
                            .foregroundColor(healthScoreColor(entry.healthScore))
                    }
                    
                    Spacer()
                }
                
                // Health Score Progress Bar
                ProgressView(value: Double(entry.healthScore), total: 100)
                    .progressViewStyle(
                        LinearProgressViewStyle(
                            tint: healthScoreColor(entry.healthScore)
                        )
                    )
                    .scaleEffect(y: 2)
            }
            
            // Metrics Grid
            HStack(spacing: 20) {
                MetricCard(
                    title: "Heart Rate",
                    value: "\(entry.heartRate)",
                    unit: "BPM",
                    icon: "heart",
                    color: ModernDesignSystem.Colors.healthRed
                )
                
                MetricCard(
                    title: "Steps",
                    value: entry.steps.formatted(.number.notation(.compactName)),
                    unit: "today",
                    icon: "figure.walk",
                    color: ModernDesignSystem.Colors.primary
                )
                
                MetricCard(
                    title: "Sleep",
                    value: String(format: "%.1f", entry.sleepHours),
                    unit: "hours",
                    icon: "bed.double",
                    color: ModernDesignSystem.Colors.secondary
                )
            }
            
            // Fall Risk Assessment
            HStack {
                HStack(spacing: 8) {
                    Circle()
                        .fill(entry.fallRisk.color)
                        .frame(width: 10, height: 10)
                    
                    Text("Fall Risk Assessment:")
                        .font(ModernDesignSystem.Typography.caption)
                        .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                    
                    Text(entry.fallRisk.displayName)
                        .font(ModernDesignSystem.Typography.caption)
                        .fontWeight(.medium)
                        .foregroundColor(entry.fallRisk.color)
                }
                
                Spacer()
            }
        }
        .padding(20)
        .background(ModernDesignSystem.Colors.surface)
        .cornerRadius(20)
    }
    
    private func healthScoreColor(_ score: Int) -> Color {
        switch score {
        case 90...100:
            return ModernDesignSystem.Colors.healthGreen
        case 80..<90:
            return ModernDesignSystem.Colors.primary
        case 70..<80:
            return ModernDesignSystem.Colors.healthYellow
        case 60..<70:
            return ModernDesignSystem.Colors.healthOrange
        default:
            return ModernDesignSystem.Colors.healthRed
        }
    }
    
    private func healthScoreDescription(_ score: Int) -> String {
        switch score {
        case 90...100:
            return "Excellent"
        case 80..<90:
            return "Good"
        case 70..<80:
            return "Fair"
        case 60..<70:
            return "Needs Attention"
        default:
            return "Critical"
        }
    }
}

// MARK: - Supporting Views
struct TrendIcon: View {
    let direction: TrendDirection
    
    var body: some View {
        Image(systemName: direction.iconName)
            .font(.caption2)
            .foregroundColor(direction.color)
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.callout)
                .foregroundColor(color)
            
            Text(value)
                .font(ModernDesignSystem.Typography.numericSmall)
                .fontWeight(.semibold)
                .foregroundColor(ModernDesignSystem.Colors.textPrimary)
            
            VStack(spacing: 1) {
                Text(title)
                    .font(ModernDesignSystem.Typography.caption2)
                    .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                
                Text(unit)
                    .font(ModernDesignSystem.Typography.caption2)
                    .foregroundColor(ModernDesignSystem.Colors.textTertiary)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Fall Risk Level
enum FallRiskLevel: CaseIterable {
    case low
    case moderate
    case high
    case critical
    
    var displayName: String {
        switch self {
        case .low:
            return "Low Risk"
        case .moderate:
            return "Moderate Risk"
        case .high:
            return "High Risk"
        case .critical:
            return "Critical Risk"
        }
    }
    
    var shortDisplayName: String {
        switch self {
        case .low:
            return "Low"
        case .moderate:
            return "Moderate"
        case .high:
            return "High"
        case .critical:
            return "Critical"
        }
    }
    
    var color: Color {
        switch self {
        case .low:
            return ModernDesignSystem.Colors.healthGreen
        case .moderate:
            return ModernDesignSystem.Colors.healthYellow
        case .high:
            return ModernDesignSystem.Colors.healthOrange
        case .critical:
            return ModernDesignSystem.Colors.healthRed
        }
    }
}

// MARK: - Utility Functions
private func timeAgoString(from date: Date) -> String {
    let formatter = RelativeDateTimeFormatter()
    formatter.timeStyle = .abbreviated
    formatter.dateStyle = .omitted
    return formatter.localizedString(for: date, relativeTo: Date())
}

// MARK: - Widget Preview
struct VitalSenseWidget_Previews: PreviewProvider {
    static var previews: some View {
        let sampleEntry = VitalSenseEntry(
            date: Date(),
            healthScore: 85,
            fallRisk: .low,
            heartRate: 72,
            steps: 8547,
            sleepHours: 7.5,
            trend: .improving,
            lastUpdate: Date().addingTimeInterval(-300) // 5 minutes ago
        )
        
        Group {
            VitalSenseWidgetView(entry: sampleEntry)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            VitalSenseWidgetView(entry: sampleEntry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            VitalSenseWidgetView(entry: sampleEntry)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
