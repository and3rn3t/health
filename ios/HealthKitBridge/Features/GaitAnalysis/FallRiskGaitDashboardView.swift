import SwiftUI
import HealthKit

// MARK: - Fall Risk & Gait Analysis Dashboard
struct FallRiskGaitDashboardView: View {
    @StateObject private var gaitManager = FallRiskGaitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @State private var refreshing = false
    @State private var lastDataSent: Date?
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 20) {
                    // Fall Risk Overview Card
                    if let fallRisk = gaitManager.fallRiskScore {
                        FallRiskOverviewCard(fallRisk: fallRisk)
                    } else {
                        AnalyzingCard(title: "Fall Risk Assessment", description: "Analyzing your gait and mobility patterns...")
                    }
                    
                    // Gait Metrics Card
                    if let gait = gaitManager.currentGaitMetrics, gait.isComplete {
                        GaitMetricsCard(gaitMetrics: gait)
                    } else {
                        AnalyzingCard(title: "Gait Analysis", description: "Collecting walking and movement data...")
                    }
                    
                    // Balance Assessment Card
                    if let balance = gaitManager.balanceAssessment {
                        BalanceAssessmentCard(balance: balance)
                    }
                    
                    // Daily Mobility Card
                    if let mobility = gaitManager.dailyMobilityTrends {
                        DailyMobilityCard(mobility: mobility)
                    }
                    
                    // Data Transmission Card
                    DataTransmissionCard(
                        isConnected: webSocketManager.isConnected,
                        lastSent: lastDataSent,
                        onSendData: sendGaitAnalysis
                    )
                }
                .padding()
            }
            .navigationTitle("Fall Risk Analysis")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshAnalysis) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(refreshing ? 360 : 0))
                            .animation(.linear(duration: 1).repeatCount(refreshing ? .max : 1, autoreverses: false), value: refreshing)
                    }
                }
            }
        }
        .onAppear {
            Task {
                await gaitManager.requestGaitAuthorization()
                await refreshData()
            }
        }
    }
    
    private func refreshAnalysis() {
        guard !refreshing else { return }
        
        refreshing = true
        Task {
            await refreshData()
            await MainActor.run {
                refreshing = false
            }
        }
    }
    
    private func refreshData() async {
        await gaitManager.fetchGaitMetrics()
    }
    
    private func sendGaitAnalysis() {
        guard let gait = gaitManager.currentGaitMetrics,
              let fallRisk = gaitManager.fallRiskScore else {
            print("❌ Insufficient gait data for transmission")
            return
        }
        
        Task {
            do {
                let payload = GaitAnalysisPayload(
                    userId: AppConfig.shared.userId,
                    deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
                    gait: gait,
                    fallRisk: fallRisk,
                    balance: gaitManager.balanceAssessment,
                    mobility: gaitManager.dailyMobilityTrends
                )
                
                try await webSocketManager.sendGaitAnalysis(payload)
                
                await MainActor.run {
                    lastDataSent = Date()
                }
                
                print("✅ Gait analysis data transmitted successfully")
            } catch {
                print("❌ Failed to send gait analysis: \(error)")
            }
        }
    }
}

// MARK: - Fall Risk Overview Card
struct FallRiskOverviewCard: View {
    let fallRisk: FallRiskScore
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: fallRisk.riskLevel.iconName)
                    .font(.title2)
                    .foregroundColor(fallRisk.riskLevel.color)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Fall Risk Assessment")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Last assessed: \(fallRisk.lastAssessment, format: .relative(presentation: .named))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text(fallRisk.riskLevel.rawValue)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(fallRisk.riskLevel.color)
                    
                    Text(String(format: "%.1f/4.0", fallRisk.overallScore))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Risk Level Indicator
            HStack {
                RiskLevelBar(score: fallRisk.overallScore, maxScore: 4.0, color: fallRisk.riskLevel.color)
                
                VStack(alignment: .trailing, spacing: 4) {
                    ForEach(FallRiskLevel.allCases, id: \.self) { level in
                        HStack(spacing: 4) {
                            Circle()
                                .fill(level.color)
                                .frame(width: 8, height: 8)
                            
                            Text(level.rawValue)
                                .font(.caption2)
                                .foregroundColor(level == fallRisk.riskLevel ? level.color : .secondary)
                        }
                    }
                }
            }
            
            // Risk Factors Summary
            if !fallRisk.riskFactors.isEmpty {
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Risk Factors")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                        ForEach(fallRisk.riskFactors.prefix(4), id: \.name) { factor in
                            RiskFactorChip(factor: factor)
                        }
                    }
                }
            }
            
            // Top Recommendation
            if let topRecommendation = fallRisk.recommendations.first {
                Divider()
                
                HStack(spacing: 8) {
                    Image(systemName: "lightbulb.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    
                    Text(topRecommendation)
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .padding(8)
                .background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

// MARK: - Gait Metrics Card
struct GaitMetricsCard: View {
    let gaitMetrics: GaitMetrics
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "figure.walk")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Gait Analysis")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("Mobility Status: \(gaitMetrics.mobilityStatus.rawValue)")
                        .font(.caption)
                        .foregroundColor(gaitMetrics.mobilityStatus.color)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Circle()
                        .fill(gaitMetrics.mobilityStatus.color)
                        .frame(width: 12, height: 12)
                }
            }
            
            // Gait Metrics Grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                if let speed = gaitMetrics.averageWalkingSpeed {
                    GaitMetricView(
                        title: "Walking Speed",
                        value: String(format: "%.2f", speed),
                        unit: "m/s",
                        normalRange: "1.2-1.4",
                        isNormal: speed >= 1.0,
                        icon: "speedometer"
                    )
                }
                
                if let stepLength = gaitMetrics.averageStepLength {
                    GaitMetricView(
                        title: "Step Length",
                        value: String(format: "%.2f", stepLength),
                        unit: "m",
                        normalRange: "0.6-0.8",
                        isNormal: stepLength >= 0.5,
                        icon: "ruler"
                    )
                }
                
                if let asymmetry = gaitMetrics.walkingAsymmetry {
                    GaitMetricView(
                        title: "Asymmetry",
                        value: String(format: "%.1f", asymmetry),
                        unit: "%",
                        normalRange: "< 3%",
                        isNormal: asymmetry <= 3.0,
                        icon: "scale.3d"
                    )
                }
                
                if let doubleSupport = gaitMetrics.doubleSupportTime {
                    GaitMetricView(
                        title: "Double Support",
                        value: String(format: "%.1f", doubleSupport),
                        unit: "%",
                        normalRange: "20-25%",
                        isNormal: doubleSupport <= 25.0,
                        icon: "timer"
                    )
                }
            }
            
            // Stair Navigation (if available)
            if let ascentSpeed = gaitMetrics.stairAscentSpeed,
               let descentSpeed = gaitMetrics.stairDescentSpeed {
                
                Divider()
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Stair Navigation")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Ascent")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack(alignment: .lastTextBaseline, spacing: 2) {
                                Text(String(format: "%.2f", ascentSpeed))
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Text("m/s")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text("Descent")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack(alignment: .lastTextBaseline, spacing: 2) {
                                Text(String(format: "%.2f", descentSpeed))
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Text("m/s")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

// MARK: - Balance Assessment Card
struct BalanceAssessmentCard: View {
    let balance: BalanceAssessment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "figure.mind.and.body")
                    .font(.title2)
                    .foregroundColor(balance.balanceLevel.color)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Balance Assessment")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("\(balance.balanceLevel.rawValue) Balance")
                        .font(.caption)
                        .foregroundColor(balance.balanceLevel.color)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text(String(format: "%.1f", balance.score))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(balance.balanceLevel.color)
                    
                    Text("out of \(Int(balance.maxScore))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Balance Score Progress
            ProgressView(value: balance.score / balance.maxScore)
                .progressViewStyle(LinearProgressViewStyle(tint: balance.balanceLevel.color))
            
            // Balance Indicators
            if !balance.indicators.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Areas of Concern")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    ForEach(balance.indicators.prefix(3), id: \.type.rawValue) { indicator in
                        HStack(spacing: 8) {
                            Circle()
                                .fill(indicator.severity.color)
                                .frame(width: 8, height: 8)
                            
                            Text(indicator.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

// MARK: - Daily Mobility Card
struct DailyMobilityCard: View {
    let mobility: DailyMobilityTrends
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "figure.walk.circle")
                    .font(.title2)
                    .foregroundColor(mobility.activityLevel.color)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Daily Mobility")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("\(mobility.activityLevel.rawValue) Activity")
                        .font(.caption)
                        .foregroundColor(mobility.activityLevel.color)
                }
                
                Spacer()
                
                Text("Today")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Mobility Metrics
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 12) {
                if let steps = mobility.stepCount {
                    MobilityMetricView(
                        title: "Steps",
                        value: "\(steps)",
                        icon: "figure.walk",
                        color: steps >= 5000 ? .green : .orange
                    )
                }
                
                if let distance = mobility.walkingDistance {
                    MobilityMetricView(
                        title: "Distance",
                        value: String(format: "%.1f km", distance / 1000),
                        icon: "map",
                        color: distance >= 3000 ? .green : .orange
                    )
                }
                
                if let standTime = mobility.standTime {
                    MobilityMetricView(
                        title: "Stand Time",
                        value: "\(Int(standTime))m",
                        icon: "figure.stand",
                        color: standTime >= 360 ? .green : .orange // 6 hours
                    )
                }
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

// MARK: - Supporting Views
struct RiskLevelBar: View {
    let score: Double
    let maxScore: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Risk Level")
                    .font(.caption)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text("\(String(format: "%.1f", score))/\(String(format: "%.0f", maxScore))")
                    .font(.caption)
                    .fontWeight(.medium)
            }
            
            ProgressView(value: score / maxScore)
                .progressViewStyle(LinearProgressViewStyle(tint: color))
        }
    }
}

struct RiskFactorChip: View {
    let factor: FallRiskFactor
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(factor.severity.color)
                .frame(width: 6, height: 6)
            
            Text(factor.name)
                .font(.caption2)
                .fontWeight(.medium)
            
            Spacer()
            
            Text(String(format: "%.1f", factor.score))
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(factor.severity.color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(factor.severity.color.opacity(0.1), in: RoundedRectangle(cornerRadius: 6))
    }
}

struct GaitMetricView: View {
    let title: String
    let value: String
    let unit: String
    let normalRange: String
    let isNormal: Bool
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(isNormal ? .green : .orange)
                
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                
                Spacer()
            }
            
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(isNormal ? .green : .orange)
                
                Text(unit)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Text("Normal: \(normalRange)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
    }
}

struct MobilityMetricView: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
    }
}

struct AnalyzingCard: View {
    let title: String
    let description: String
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(40)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct DataTransmissionCard: View {
    let isConnected: Bool
    let lastSent: Date?
    let onSendData: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.title2)
                    .foregroundColor(isConnected ? .green : .red)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Data Transmission")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(isConnected ? "Connected to analysis server" : "Disconnected")
                        .font(.caption)
                        .foregroundColor(isConnected ? .green : .red)
                }
                
                Spacer()
                
                Button("Send Data", action: onSendData)
                    .buttonStyle(.borderedProminent)
                    .disabled(!isConnected)
            }
            
            if let lastSent = lastSent {
                Text("Last sent: \(lastSent, format: .relative(presentation: .named))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(20)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

#Preview {
    FallRiskGaitDashboardView()
}
