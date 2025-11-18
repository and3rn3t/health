//
//  HealthDashboardView.swift
//  VitalSense
//
//  Health dashboard screen displaying summary of health metrics and navigation
//  to detailed views for gait analysis, fall risk, and other features.
//  Created: 2025-11-01
//

import SwiftUI
import HealthKit

// MARK: - Health Dashboard View

struct HealthDashboardView: View {
    // MARK: - Environment Objects
    @EnvironmentObject var healthStore: HealthStore
    @EnvironmentObject var settings: SettingsStore

    // MARK: - State Properties
    @State private var isGaitAnalysisActive = false
    @State private var isFallRiskActive = false
    @State private var isLiDARActive = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    Text("Health Dashboard")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .padding()

                    // Summary Cards
                    HStack {
                        MetricCard(
                            title: "Steps",
                            value: "\(healthStore.stepCount)",
                            unit: "steps",
                            icon: "figure.walk",
                            color: .blue
                        )
                        MetricCard(
                            title: "Heart Rate",
                            value: "\(healthStore.heartRate)",
                            unit: "bpm",
                            icon: "heart.fill",
                            color: .red
                        )
                    }

                    HStack {
                        MetricCard(
                            title: "Distance",
                            value: "\(healthStore.walkingDistance, specifier: "%.1f")",
                            unit: "km",
                            icon: "location.fill",
                            color: .green
                        )
                        MetricCard(
                            title: "Calories",
                            value: "\(healthStore.activeEnergyBurned)",
                            unit: "kcal",
                            icon: "flame.fill",
                            color: .orange
                        )
                    }

                    // Status Cards
                    HStack {
                        StatusCard(
                            title: "Gait Analysis",
                            value: settings.isGaitAnalysisEnabled ? "On" : "Off",
                            icon: "waveform.path.ecg",
                            color: settings.isGaitAnalysisEnabled ? .green : .red
                        )
                        StatusCard(
                            title: "Fall Risk",
                            value: settings.isFallRiskEnabled ? "Monitored" : "Not Monitored",
                            icon: "exclamationmark.triangle",
                            color: settings.isFallRiskEnabled ? .yellow : .gray
                        )
                    }

                    // Navigation Links
                    NavigationLink(destination: GaitAnalysisView().environmentObject(healthStore)) {
                        Text("View Gait Analysis")
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.blue.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    NavigationLink(destination: FallRiskView().environmentObject(healthStore)) {
                        Text("View Fall Risk Details")
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.orange.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }

                    NavigationLink(destination: LiDARView().environmentObject(healthStore)) {
                        Text("View LiDAR Data")
                            .font(.headline)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.purple.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Supporting Views

struct MetricCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color

    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(color)
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("\(value) \(unit)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 5)
    }
}

struct StatusCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(color)
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 5)
    }
}

// MARK: - Preview

struct HealthDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        HealthDashboardView()
            .environmentObject(HealthStore())
            .environmentObject(SettingsStore())
    }
}
