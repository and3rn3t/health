//
//  DetailedGaitMetricsCard.swift
//  VitalSense
//
//  Detailed gait metrics display card for comprehensive gait analysis
//  Created: 2025-11-01
//

import SwiftUI
import HealthKit

struct DetailedGaitMetricsCard: View {
    let gaitData: GaitAnalysisData
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "figure.walk.motion")
                    .foregroundColor(.blue)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Gait Analysis")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("Last updated \(gaitData.timestamp, style: .relative)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: { isExpanded.toggle() }) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                }
            }

            // Key Metrics Grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                MetricTile(
                    title: "Walking Speed",
                    value: String(format: "%.2f m/s", gaitData.walkingSpeed),
                    icon: "speedometer",
                    color: gaitData.walkingSpeed > 1.2 ? .green : .orange
                )

                MetricTile(
                    title: "Step Length",
                    value: String(format: "%.1f cm", gaitData.stepLength * 100),
                    icon: "ruler",
                    color: .blue
                )

                MetricTile(
                    title: "Cadence",
                    value: String(format: "%.0f steps/min", gaitData.cadence),
                    icon: "metronome",
                    color: .purple
                )

                MetricTile(
                    title: "Asymmetry",
                    value: String(format: "%.1f%%", gaitData.asymmetry * 100),
                    icon: "scale.3d",
                    color: gaitData.asymmetry < 0.05 ? .green : .red
                )
            }

            if isExpanded {
                // Detailed Analysis
                VStack(alignment: .leading, spacing: 12) {
                    Divider()

                    Text("Detailed Analysis")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    VStack(alignment: .leading, spacing: 8) {
                        AnalysisRow(
                            title: "Gait Stability",
                            value: gaitData.stabilityScore,
                            description: stabilityDescription
                        )

                        AnalysisRow(
                            title: "Fall Risk",
                            value: gaitData.fallRiskScore,
                            description: fallRiskDescription
                        )

                        AnalysisRow(
                            title: "Balance Score",
                            value: gaitData.balanceScore,
                            description: balanceDescription
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private var stabilityDescription: String {
        let score = gaitData.stabilityScore
        if score > 0.8 {
            return "Excellent gait stability"
        } else if score > 0.6 {
            return "Good stability with minor variations"
        } else {
            return "Consider balance exercises"
        }
    }

    private var fallRiskDescription: String {
        let risk = gaitData.fallRiskScore
        if risk < 0.2 {
            return "Low fall risk - maintain current activity"
        } else if risk < 0.5 {
            return "Moderate risk - focus on balance training"
        } else {
            return "Higher risk - consult healthcare provider"
        }
    }

    private var balanceDescription: String {
        let score = gaitData.balanceScore
        if score > 0.8 {
            return "Strong balance and coordination"
        } else if score > 0.6 {
            return "Good balance with room for improvement"
        } else {
            return "Balance training recommended"
        }
    }
}

// MARK: - Supporting Views

struct MetricTile: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title3)
                    .fontWeight(.bold)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct AnalysisRow: View {
    let title: String
    let value: Double
    let description: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(String(format: "%.1f", value * 100))
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(scoreColor)
        }
    }

    private var scoreColor: Color {
        if value > 0.8 { return .green }
        else if value > 0.6 { return .orange }
        else { return .red }
    }
}

// MARK: - Data Model

struct GaitAnalysisData {
    let walkingSpeed: Double      // m/s
    let stepLength: Double        // meters
    let cadence: Double          // steps/minute
    let asymmetry: Double        // 0.0 to 1.0
    let stabilityScore: Double   // 0.0 to 1.0
    let fallRiskScore: Double    // 0.0 to 1.0
    let balanceScore: Double     // 0.0 to 1.0
    let timestamp: Date

    static let sample = GaitAnalysisData(
        walkingSpeed: 1.25,
        stepLength: 0.65,
        cadence: 115,
        asymmetry: 0.03,
        stabilityScore: 0.85,
        fallRiskScore: 0.15,
        balanceScore: 0.82,
        timestamp: Date()
    )
}
