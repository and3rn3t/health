import SwiftUI

// MARK: - Fall Risk Dashboard View
// Comprehensive fall risk monitoring and prevention interface

struct FallRiskDashboardView: View {
    @StateObject private var fallRiskEngine = FallRiskAnalysisEngine.shared
    @StateObject private var healthManager = HealthKitManager.shared
    @State private var showingDetailedAnalysis = false
    @State private var showingRecommendations = false
    @State private var isPerformingAssessment = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with current risk status
                fallRiskHeaderCard
                
                // Quick assessment button
                assessmentActionCard
                
                // Risk factors overview
                if !fallRiskEngine.riskFactors.isEmpty {
                    riskFactorsCard
                }
                
                // Gait and balance metrics
                if let gaitAnalysis = fallRiskEngine.gaitAnalysis {
                    gaitAnalysisCard(gaitAnalysis)
                }
                
                if let balanceMetrics = fallRiskEngine.balanceMetrics {
                    balanceMetricsCard(balanceMetrics)
                }
                
                // Recommendations
                if !fallRiskEngine.recommendations.isEmpty {
                    recommendationsCard
                }
                
                // Health metrics relevant to fall risk
                fallRiskHealthMetricsCard
            }
            .padding()
        }
        .navigationTitle("Fall Risk Assessment")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showingDetailedAnalysis) {
            DetailedFallRiskAnalysisView()
        }
        .sheet(isPresented: $showingRecommendations) {
            FallPreventionRecommendationsView()
        }
    }
    
    private var fallRiskHeaderCard: some View {
        VStack(spacing: 15) {
            // Risk level indicator
            HStack {
                Circle()
                    .fill(riskLevelColor)
                    .frame(width: 20, height: 20)
                    .animation(.easeInOut, value: fallRiskEngine.currentRiskLevel)
                
                VStack(alignment: .leading) {
                    Text("Current Fall Risk")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(fallRiskEngine.currentRiskLevel.rawValue)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(riskLevelColor)
                }
                
                Spacer()
                
                VStack {
                    Text("\(Int(fallRiskEngine.riskScore))")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(riskLevelColor)
                    
                    Text("Risk Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Risk score progress bar
            ProgressView(value: fallRiskEngine.riskScore / 100)
                .progressViewStyle(LinearProgressViewStyle(tint: riskLevelColor))
                .scaleEffect(y: 2)
            
            // Last assessment info
            if let lastAssessment = fallRiskEngine.lastAssessment {
                Text("Last assessment: \(timeAgo(from: lastAssessment))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("No assessment performed yet")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private var assessmentActionCard: some View {
        VStack(spacing: 12) {
            Button(action: {
                performFallRiskAssessment()
            }) {
                HStack {
                    if isPerformingAssessment {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "stethoscope")
                            .font(.title2)
                    }
                    
                    Text(isPerformingAssessment ? "Analyzing..." : "Perform Fall Risk Assessment")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(isPerformingAssessment ? Color.gray : Color.blue)
                .cornerRadius(12)
            }
            .disabled(isPerformingAssessment)
            .animation(.easeInOut, value: isPerformingAssessment)
            
            HStack {
                Button("Detailed Analysis") {
                    showingDetailedAnalysis = true
                }
                .buttonStyle(.bordered)
                
                Spacer()
                
                Button("View Recommendations") {
                    showingRecommendations = true
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private var riskFactorsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                
                Text("Risk Factors Detected")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text("\(fallRiskEngine.riskFactors.count)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
            }
            
            ForEach(Array(fallRiskEngine.riskFactors.prefix(4)), id: \.id) { factor in
                riskFactorRow(factor)
            }
            
            if fallRiskEngine.riskFactors.count > 4 {
                Button("View All Risk Factors") {
                    showingDetailedAnalysis = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private func riskFactorRow(_ factor: FallRiskAnalysisEngine.RiskFactor) -> some View {
        HStack {
            Circle()
                .fill(severityColor(factor.severity))
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(factor.description)
                    .font(.caption)
                    .foregroundColor(.primary)
                
                Text(timeAgo(from: factor.detectedAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(severityText(factor.severity))
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(severityColor(factor.severity))
        }
    }
    
    private func gaitAnalysisCard(_ gaitAnalysis: FallRiskAnalysisEngine.GaitAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.blue)
                
                Text("Gait Analysis")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if gaitAnalysis.isAbnormal {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.orange)
                }
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                gaitMetricItem("Speed", "\(String(format: "%.2f", gaitAnalysis.averageSpeed)) m/s", gaitAnalysis.averageSpeed > 0.8 ? .green : .orange)
                gaitMetricItem("Step Length", "\(String(format: "%.2f", gaitAnalysis.stepLength)) m", gaitAnalysis.stepLength > 0.6 ? .green : .orange)
                gaitMetricItem("Cadence", "\(Int(gaitAnalysis.cadence)) steps/min", gaitAnalysis.cadence > 100 ? .green : .orange)
                gaitMetricItem("Symmetry", "\(Int(gaitAnalysis.symmetry * 100))%", gaitAnalysis.symmetry > 0.85 ? .green : .orange)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private func balanceMetricsCard(_ balance: FallRiskAnalysisEngine.BalanceMetrics) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "scale.3d")
                    .foregroundColor(.purple)
                
                Text("Balance Assessment")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                if balance.isImpaired {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundColor(.red)
                }
            }
            
            VStack(spacing: 8) {
                balanceProgressRow("Static Balance", balance.staticBalance, threshold: 0.7)
                balanceProgressRow("Dynamic Balance", balance.dynamicBalance, threshold: 0.6)
                
                HStack {
                    Text("Reaction Time")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("\(Int(balance.reactionTime))ms")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(balance.reactionTime < 500 ? .green : .red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private var recommendationsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                
                Text("Prevention Recommendations")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button("View All") {
                    showingRecommendations = true
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
            
            ForEach(Array(fallRiskEngine.getTopRecommendations(limit: 3)), id: \.id) { recommendation in
                recommendationRow(recommendation)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private var fallRiskHealthMetricsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Related Health Metrics")
                .font(.headline)
                .fontWeight(.semibold)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                if let steadiness = healthManager.lastWalkingSteadiness {
                    healthMetricItem("Walking Steadiness", "\(Int(steadiness))%", steadiness > 50 ? .green : .red)
                }
                
                if let speed = healthManager.lastWalkingSpeed {
                    healthMetricItem("Walking Speed", "\(String(format: "%.2f", speed)) m/s", speed > 0.8 ? .green : .orange)
                }
                
                if let asymmetry = healthManager.lastWalkingAsymmetry {
                    healthMetricItem("Gait Asymmetry", "\(String(format: "%.1f", asymmetry))%", asymmetry < 15 ? .green : .orange)
                }
                
                if let stairSpeed = healthManager.lastStairAscentSpeed {
                    healthMetricItem("Stair Speed", "\(String(format: "%.2f", stairSpeed)) m/s", stairSpeed > 0.3 ? .green : .orange)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    // MARK: - Helper Views
    
    private func gaitMetricItem(_ title: String, _ value: String, _ color: Color) -> some View {
        VStack {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
    
    private func healthMetricItem(_ title: String, _ value: String, _ color: Color) -> some View {
        VStack {
            Text(value)
                .font(.callout)
                .fontWeight(.semibold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .background(Color(.systemBackground))
        .cornerRadius(6)
    }
    
    private func balanceProgressRow(_ title: String, _ value: Double, threshold: Double) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(Int(value * 100))%")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(value > threshold ? .green : .red)
            }
            
            ProgressView(value: value)
                .progressViewStyle(LinearProgressViewStyle(tint: value > threshold ? .green : .red))
        }
    }
    
    private func recommendationRow(_ recommendation: FallRiskAnalysisEngine.Recommendation) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(priorityColor(recommendation.priority))
                .frame(width: 8, height: 8)
                .padding(.top, 4)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(recommendation.title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text(recommendation.description)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            if recommendation.actionable {
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 4)
    }
    
    // MARK: - Computed Properties & Helpers
    
    private var riskLevelColor: Color {
        switch fallRiskEngine.currentRiskLevel {
        case .low: return .green
        case .moderate: return .yellow
        case .high: return .orange
        case .critical: return .red
        case .unknown: return .gray
        }
    }
    
    private func severityColor(_ severity: FallRiskAnalysisEngine.RiskFactor.Severity) -> Color {
        switch severity {
        case .low: return .yellow
        case .moderate: return .orange
        case .high: return .red
        case .critical: return .purple
        }
    }
    
    private func severityText(_ severity: FallRiskAnalysisEngine.RiskFactor.Severity) -> String {
        switch severity {
        case .low: return "Low"
        case .moderate: return "Moderate"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }
    
    private func priorityColor(_ priority: FallRiskAnalysisEngine.Recommendation.Priority) -> Color {
        switch priority {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .urgent: return .red
        }
    }
    
    private func timeAgo(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 {
            return "\(Int(interval))s ago"
        } else if interval < 3600 {
            return "\(Int(interval/60))m ago"
        } else if interval < 86400 {
            return "\(Int(interval/3600))h ago"
        } else {
            return "\(Int(interval/86400))d ago"
        }
    }
    
    private func performFallRiskAssessment() {
        Task {
            await MainActor.run {
                isPerformingAssessment = true
            }
            
            await healthManager.performFallRiskAssessment()
            
            await MainActor.run {
                isPerformingAssessment = false
            }
        }
    }
}

// MARK: - Supporting Views

struct DetailedFallRiskAnalysisView: View {
    @StateObject private var fallRiskEngine = FallRiskAnalysisEngine.shared
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Detailed Fall Risk Analysis")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    // Comprehensive risk factor list
                    if !fallRiskEngine.riskFactors.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("All Risk Factors")
                                .font(.headline)
                            
                            ForEach(fallRiskEngine.riskFactors, id: \.id) { factor in
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(factor.description)
                                            .font(.body)
                                        
                                        Spacer()
                                        
                                        Text("Severity: \(factor.severity)")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Text("Value: \(String(format: "%.2f", factor.value))")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    
                                    Divider()
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct FallPreventionRecommendationsView: View {
    @StateObject private var fallRiskEngine = FallRiskAnalysisEngine.shared
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    Text("Fall Prevention Recommendations")
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    ForEach(fallRiskEngine.recommendations, id: \.id) { recommendation in
                        RecommendationDetailCard(recommendation: recommendation)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct RecommendationDetailCard: View {
    let recommendation: FallRiskAnalysisEngine.Recommendation
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                categoryIcon
                    .foregroundColor(categoryColor)
                
                Text(recommendation.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                priorityBadge
            }
            
            Text(recommendation.description)
                .font(.body)
                .foregroundColor(.primary)
            
            HStack {
                Text("Estimated Impact:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ProgressView(value: recommendation.estimatedImpact)
                    .progressViewStyle(LinearProgressViewStyle(tint: .green))
                    .frame(width: 100)
                
                Text("\(Int(recommendation.estimatedImpact * 100))%")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.green)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private var categoryIcon: Image {
        switch recommendation.category {
        case .exercise: return Image(systemName: "figure.strengthtraining.traditional")
        case .environment: return Image(systemName: "house.fill")
        case .medical: return Image(systemName: "stethoscope")
        case .lifestyle: return Image(systemName: "heart.fill")
        case .safety: return Image(systemName: "shield.fill")
        }
    }
    
    private var categoryColor: Color {
        switch recommendation.category {
        case .exercise: return .blue
        case .environment: return .green
        case .medical: return .red
        case .lifestyle: return .purple
        case .safety: return .orange
        }
    }
    
    private var priorityBadge: some View {
        Text(priorityText)
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(priorityColor)
            .cornerRadius(8)
    }
    
    private var priorityText: String {
        switch recommendation.priority {
        case .low: return "LOW"
        case .medium: return "MED"
        case .high: return "HIGH"
        case .urgent: return "URGENT"
        }
    }
    
    private var priorityColor: Color {
        switch recommendation.priority {
        case .low: return .green
        case .medium: return .yellow
        case .high: return .orange
        case .urgent: return .red
        }
    }
}

#Preview {
    FallRiskDashboardView()
}