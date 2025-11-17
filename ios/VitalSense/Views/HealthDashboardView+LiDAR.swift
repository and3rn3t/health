//
//  HealthDashboardView+LiDAR.swift
//  VitalSense
//
//  LiDAR quick access card for Health Dashboard
//

import SwiftUI

@available(iOS 16.0, *)
struct LiDARQuickAccessCard: View {
    @StateObject private var lidarManager = LiDARScanningManager.shared
    @State private var showingLiDARView = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "viewfinder")
                    .foregroundColor(.blue)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 4) {
                    Text("LiDAR Health Scan")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text(lidarManager.isLiDARAvailable ? "3D scanning available" : "LiDAR not available on this device")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if lidarManager.isLiDARAvailable {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                }
            }

            if lidarManager.isLiDARAvailable {
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(lidarManager.totalScans)")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)

                        Text("Total Scans")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()
                        .frame(height: 30)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(lidarManager.scansThisWeek)")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.green)

                        Text("This Week")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()
                        .frame(height: 30)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(String(format: "%.0f", lidarManager.averageScore))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(averageScoreColor)

                        Text("Avg Score")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }

                Button(action: {
                    showingLiDARView = true
                }) {
                    HStack {
                        Spacer()
                        Text("Start LiDAR Scan")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [.blue, .teal],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("LiDAR scanning requires:")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("• iPhone 12 Pro or newer")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Text("• iPad Pro with LiDAR scanner")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Text("• iOS 16.0 or later")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.orange.opacity(0.1))
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color("VitalSenseCardBackground"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        .fullScreenCover(isPresented: $showingLiDARView) {
            LiDARScanningView()
        }
    }

    private var averageScoreColor: Color {
        if lidarManager.averageScore >= 80 {
            return .green
        } else if lidarManager.averageScore >= 60 {
            return .orange
        } else {
            return .red
        }
    }
}
