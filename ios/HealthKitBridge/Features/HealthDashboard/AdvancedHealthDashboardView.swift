import SwiftUI
import HealthKit

// MARK: - Advanced Health Dashboard View
struct AdvancedHealthDashboardView: View {
    @StateObject private var advancedMetrics = AdvancedHealthMetrics.shared
    @State private var selectedTab = 0
    @State private var refreshing = false
    
    var body: some View {
        NavigationView {
            TabView(selection: $selectedTab) {
                // Vital Signs Tab
                VitalSignsView()
                    .tabItem {
                        Image(systemName: "heart.fill")
                        Text("Vitals")
                    }
                    .tag(0)
                
                // Activity & Fitness Tab
                ActivityFitnessView()
                    .tabItem {
                        Image(systemName: "figure.run")
                        Text("Activity")
                    }
                    .tag(1)
                
                // Nutrition Tab
                NutritionView()
                    .tabItem {
                        Image(systemName: "fork.knife")
                        Text("Nutrition")
                    }
                    .tag(2)
                
                // Health Score Tab
                HealthScoreView()
                    .tabItem {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                        Text("Score")
                    }
                    .tag(3)
            }
            .navigationTitle("Advanced Health")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshData) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(refreshing ? 360 : 0))
                            .animation(.linear(duration: 1).repeatCount(refreshing ? .max : 1, autoreverses: false), value: refreshing)
                    }
                }
            }
        }
        .environmentObject(advancedMetrics)
        .onAppear {
            Task {
                await advancedMetrics.fetchAdvancedMetrics()
            }
        }
    }
    
    private func refreshData() {
        guard !refreshing else { return }
        
        refreshing = true
        Task {
            await advancedMetrics.fetchAdvancedMetrics()
            await MainActor.run {
                refreshing = false
            }
        }
    }
}

// MARK: - Vital Signs View
struct VitalSignsView: View {
    @EnvironmentObject var metrics: AdvancedHealthMetrics
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Heart Rate Section
                if let restingHR = metrics.restingHeartRate {
                    VitalSignCard(
                        title: "Resting Heart Rate",
                        value: "\(Int(restingHR))",
                        unit: "BPM",
                        icon: "heart.fill",
                        color: .red,
                        normalRange: "60-100 BPM"
                    )
                }
                
                // Heart Rate Variability
                if let hrv = metrics.heartRateVariability {
                    VitalSignCard(
                        title: "Heart Rate Variability",
                        value: String(format: "%.1f", hrv),
                        unit: "ms",
                        icon: "waveform.path.ecg",
                        color: .blue,
                        normalRange: "20-50 ms"
                    )
                }
                
                // Blood Pressure
                if let bp = metrics.bloodPressure {
                    BloodPressureCard(bloodPressure: bp)
                }
                
                // Oxygen Saturation
                if let o2 = metrics.oxygenSaturation {
                    VitalSignCard(
                        title: "Oxygen Saturation",
                        value: String(format: "%.1f", o2),
                        unit: "%",
                        icon: "lungs.fill",
                        color: .green,
                        normalRange: "95-100%"
                    )
                }
                
                // Respiratory Rate
                if let rr = metrics.respiratoryRate {
                    VitalSignCard(
                        title: "Respiratory Rate",
                        value: "\(Int(rr))",
                        unit: "breaths/min",
                        icon: "wind",
                        color: .cyan,
                        normalRange: "12-20 /min"
                    )
                }
                
                // Body Temperature
                if let temp = metrics.bodyTemperature {
                    VitalSignCard(
                        title: "Body Temperature",
                        value: String(format: "%.1f", temp),
                        unit: "°F",
                        icon: "thermometer",
                        color: .orange,
                        normalRange: "97.0-99.0°F"
                    )
                }
                
                // VO2 Max
                if let vo2 = metrics.vo2Max {
                    VitalSignCard(
                        title: "VO₂ Max",
                        value: String(format: "%.1f", vo2),
                        unit: "mL/kg/min",
                        icon: "figure.run",
                        color: .purple,
                        normalRange: "Varies by age/sex"
                    )
                }
            }
            .padding()
        }
    }
}

// MARK: - Activity & Fitness View
struct ActivityFitnessView: View {
    @EnvironmentObject var metrics: AdvancedHealthMetrics
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if let workoutSummary = metrics.workoutSummary {
                    WorkoutSummaryCard(summary: workoutSummary)
                }
                
                if let mindfulness = metrics.mindfulnessMinutes {
                    MindfulnessCard(minutes: mindfulness)
                }
                
                // Sleep Analysis
                if !metrics.sleepAnalysis.isEmpty {
                    SleepAnalysisCard(sleepData: metrics.sleepAnalysis)
                }
                
                // Environmental Audio
                if let audioExposure = metrics.environmentalAudioExposure {
                    VitalSignCard(
                        title: "Environmental Audio",
                        value: String(format: "%.0f", audioExposure),
                        unit: "dB",
                        icon: "speaker.wave.3.fill",
                        color: .yellow,
                        normalRange: "< 85 dB safe"
                    )
                }
            }
            .padding()
        }
    }
}

// MARK: - Nutrition View
struct NutritionView: View {
    @EnvironmentObject var metrics: AdvancedHealthMetrics
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if let nutrition = metrics.nutritionData, nutrition.isComplete {
                    // Macronutrients Overview
                    MacronutrientCard(nutrition: nutrition)
                    
                    // Detailed Nutrition
                    NutritionDetailCard(nutrition: nutrition)
                    
                    // Hydration
                    if nutrition.water > 0 {
                        VitalSignCard(
                            title: "Water Intake",
                            value: String(format: "%.0f", nutrition.water),
                            unit: "mL",
                            icon: "drop.fill",
                            color: .blue,
                            normalRange: "2000-3000 mL/day"
                        )
                    }
                } else {
                    EmptyNutritionView()
                }
            }
            .padding()
        }
    }
}

// MARK: - Health Score View
struct HealthScoreView: View {
    @EnvironmentObject var metrics: AdvancedHealthMetrics
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                if let healthScore = metrics.healthScore {
                    // Overall Score Circle
                    HealthScoreCircle(score: healthScore)
                    
                    // Score Breakdown
                    HealthScoreBreakdown(score: healthScore)
                    
                    // Recommendations
                    HealthRecommendations(score: healthScore)
                } else {
                    CalculatingScoreView()
                }
            }
            .padding()
        }
    }
}

// MARK: - Supporting View Components
struct VitalSignCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color
    let normalRange: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text("Normal: \(normalRange)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text(value)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct BloodPressureCard: View {
    let bloodPressure: BloodPressureReading
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "heart.circle.fill")
                    .font(.title2)
                    .foregroundColor(.red)
                
                Text("Blood Pressure")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text(bloodPressure.category.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(bloodPressure.category.color.opacity(0.2), in: Capsule())
                    .foregroundColor(bloodPressure.category.color)
            }
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Systolic")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(alignment: .lastTextBaseline, spacing: 2) {
                        Text("\(Int(bloodPressure.systolic))")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("mmHg")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Text("/")
                    .font(.title)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Diastolic")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(alignment: .lastTextBaseline, spacing: 2) {
                        Text("\(Int(bloodPressure.diastolic))")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("mmHg")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct MacronutrientCard: View {
    let nutrition: NutritionData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Macronutrients")
                .font(.headline)
                .fontWeight(.semibold)
            
            let balance = nutrition.macronutrientBalance
            
            HStack(spacing: 20) {
                MacroBar(title: "Protein", value: balance.proteinPercent, color: .red)
                MacroBar(title: "Carbs", value: balance.carbPercent, color: .orange)
                MacroBar(title: "Fat", value: balance.fatPercent, color: .yellow)
            }
            
            if balance.isBalanced {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Well balanced macronutrients")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct MacroBar: View {
    let title: String
    let value: Double
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
            
            VStack(spacing: 4) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(color.opacity(0.3))
                    .frame(width: 20, height: 60)
                    .overlay(alignment: .bottom) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(color)
                            .frame(height: min(60, 60 * (value / 100)))
                    }
                
                Text("\(Int(value))%")
                    .font(.caption2)
                    .fontWeight(.medium)
            }
        }
    }
}

struct HealthScoreCircle: View {
    let score: HealthScore
    
    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 20)
                    .frame(width: 200, height: 200)
                
                Circle()
                    .trim(from: 0, to: score.overallScore / 100)
                    .stroke(score.scoreColor, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                    .frame(width: 200, height: 200)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 1), value: score.overallScore)
                
                VStack {
                    Text("\(Int(score.overallScore))")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(score.scoreColor)
                    
                    Text("Grade: \(score.grade)")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                }
            }
            
            Text("Overall Health Score")
                .font(.title2)
                .fontWeight(.semibold)
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct EmptyNutritionView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "fork.knife.circle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Nutrition Data")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Connect a nutrition app or manually log your meals to see detailed nutrition insights.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

// Additional supporting views would go here...

#Preview {
    AdvancedHealthDashboardView()
}
