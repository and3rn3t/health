import SwiftUI

// MARK: - Enhanced Health Insights Card for ContentView Integration
struct AdvancedHealthInsightsCard: View {
    @StateObject private var advancedMetrics = AdvancedHealthMetrics.shared
    @State private var showingDashboard = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Advanced Health Insights")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    if let score = advancedMetrics.healthScore {
                        Text("Health Score: \(Int(score.overallScore))/100 (\(score.grade))")
                            .font(.caption)
                            .foregroundColor(score.scoreColor)
                    } else {
                        Text("Analyzing your health data...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Button(action: { showingDashboard = true }) {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Quick Metrics Preview
            if let score = advancedMetrics.healthScore {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                    QuickMetricView(
                        title: "Heart Rate",
                        value: advancedMetrics.restingHeartRate.map { "\(Int($0))" } ?? "--",
                        unit: "BPM",
                        score: score.heartRateScore,
                        maxScore: 25,
                        color: .red
                    )
                    
                    QuickMetricView(
                        title: "Activity",
                        value: advancedMetrics.workoutSummary?.totalWorkouts.description ?? "--",
                        unit: "workouts",
                        score: score.activityScore,
                        maxScore: 25,
                        color: .green
                    )
                    
                    QuickMetricView(
                        title: "Sleep",
                        value: advancedMetrics.sleepAnalysis.isEmpty ? "--" : "\(advancedMetrics.sleepAnalysis.count)",
                        unit: "sessions",
                        score: score.sleepScore,
                        maxScore: 25,
                        color: .purple
                    )
                    
                    QuickMetricView(
                        title: "Nutrition",
                        value: advancedMetrics.nutritionData?.isComplete == true ? "✓" : "--",
                        unit: "tracked",
                        score: score.nutritionScore,
                        maxScore: 25,
                        color: .orange
                    )
                }
            } else {
                // Loading state
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    
                    Text("Calculating advanced health metrics...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            
            // Recent Insights
            if !advancedMetrics.insights.isEmpty {
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Latest Insight")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if let latestInsight = advancedMetrics.insights.first {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(latestInsight.severity.color)
                                .frame(width: 8, height: 8)
                            
                            Text(latestInsight.title)
                                .font(.caption)
                                .fontWeight(.medium)
                            
                            Spacer()
                        }
                        
                        Text(latestInsight.description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .sheet(isPresented: $showingDashboard) {
            AdvancedHealthDashboardView()
        }
        .onAppear {
            Task {
                await advancedMetrics.fetchAdvancedMetrics()
            }
        }
    }
}

struct QuickMetricView: View {
    let title: String
    let value: String
    let unit: String
    let score: Double
    let maxScore: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Score indicator
                if score > 0 {
                    Circle()
                        .fill(scoreColor)
                        .frame(width: 8, height: 8)
                }
            }
            
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(color)
                
                Text(unit)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            // Progress bar for score
            if score > 0 {
                ProgressView(value: score / maxScore)
                    .progressViewStyle(LinearProgressViewStyle(tint: scoreColor))
                    .scaleEffect(x: 1, y: 0.5)
            }
        }
        .padding(12)
        .background(color.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
    }
    
    private var scoreColor: Color {
        let percentage = score / maxScore
        switch percentage {
        case 0.8...1.0:
            return .green
        case 0.6..<0.8:
            return .yellow
        case 0.4..<0.6:
            return .orange
        default:
            return .red
        }
    }
}

// MARK: - Health Trends Card
struct HealthTrendsCard: View {
    @StateObject private var analytics = AdvancedHealthAnalytics.shared
    @State private var showingAnalytics = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.title2)
                    .foregroundColor(.green)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Health Trends & Predictions")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("AI-powered health insights")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: { showingAnalytics = true }) {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if !analytics.trends.isEmpty {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(analytics.trends.prefix(3)) { trend in
                        TrendRowView(trend: trend)
                    }
                }
            } else {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    
                    Text("Analyzing health patterns...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            
            if !analytics.predictions.isEmpty {
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Next Week Prediction")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if let prediction = analytics.predictions.first {
                        Text(prediction.prediction)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .sheet(isPresented: $showingAnalytics) {
            HealthAnalyticsDetailView()
        }
        .onAppear {
            Task {
                await analytics.generateComprehensiveAnalysis()
            }
        }
    }
}

struct TrendRowView: View {
    let trend: HealthTrend
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: directionIcon)
                .font(.caption)
                .foregroundColor(directionColor)
            
            Text(trend.type.displayName)
                .font(.caption)
                .fontWeight(.medium)
            
            Spacer()
            
            Text(trend.direction.displayName)
                .font(.caption)
                .foregroundColor(directionColor)
        }
    }
    
    private var directionIcon: String {
        switch trend.direction {
        case .improving:
            return "arrow.up.circle.fill"
        case .declining:
            return "arrow.down.circle.fill"
        case .stable:
            return "minus.circle.fill"
        }
    }
    
    private var directionColor: Color {
        switch trend.direction {
        case .improving:
            return .green
        case .declining:
            return .red
        case .stable:
            return .blue
        }
    }
}

// MARK: - Extensions for Display Names
extension HealthTrend.TrendType {
    var displayName: String {
        switch self {
        case .heartRate:
            return "Heart Rate"
        case .activity:
            return "Activity"
        case .sleep:
            return "Sleep"
        case .weight:
            return "Weight"
        }
    }
}

extension HealthTrend.Direction {
    var displayName: String {
        switch self {
        case .improving:
            return "Improving"
        case .declining:
            return "Declining"
        case .stable:
            return "Stable"
        }
    }
}

// MARK: - Placeholder Views for Full Analytics
struct HealthAnalyticsDetailView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    Text("Comprehensive Health Analytics")
                        .font(.title)
                        .fontWeight(.bold)
                        .padding()
                    
                    Text("Full analytics dashboard would be implemented here with detailed charts, correlations, and personalized recommendations.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        // Dismiss
                    }
                }
            }
        }
    }
}
