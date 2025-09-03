//
//  HealthKitBridgeWidget.swift
//  VitalSense Monitor
//

import WidgetKit
import SwiftUI

// MARK: - VitalSense Monitor Widget
struct VitalSenseMonitorWidget: Widget {
    let kind: String = "VitalSenseMonitorWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GaitMetricsProvider()) { entry in
            VitalSenseMonitorWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("VitalSense Monitor")
        .description("Monitor your gait metrics and fall risk assessment.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Timeline Provider
struct GaitMetricsProvider: TimelineProvider {
    func placeholder(in context: Context) -> GaitMetricsEntry {
        GaitMetricsEntry(
            date: Date(),
            walkingSpeed: 1.25,
            asymmetry: 2.1,
            fallRisk: "Low Risk",
            isMonitoring: true
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (GaitMetricsEntry) -> ()) {
        let entry = GaitMetricsEntry(
            date: Date(),
            walkingSpeed: 1.25,
            asymmetry: 2.1,
            fallRisk: "Low Risk",
            isMonitoring: true
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [GaitMetricsEntry] = []
        
        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = GaitMetricsEntry(
                date: entryDate,
                walkingSpeed: Double.random(in: 1.0...1.5),
                asymmetry: Double.random(in: 1.0...4.0),
                fallRisk: ["Low Risk", "Moderate Risk"].randomElement()!,
                isMonitoring: true
            )
            entries.append(entry)
        }
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

// MARK: - Timeline Entry
struct GaitMetricsEntry: TimelineEntry {
    let date: Date
    let walkingSpeed: Double
    let asymmetry: Double
    let fallRisk: String
    let isMonitoring: Bool
}

// MARK: - Widget Views
struct VitalSenseMonitorWidgetEntryView: View {
    var entry: GaitMetricsProvider.Entry
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

struct SmallWidgetView: View {
    let entry: GaitMetricsEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.accentColor)
                    .font(.headline)
                Text("VitalSense Monitor")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Fall Risk")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(entry.fallRisk)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(fallRiskColor(entry.fallRisk))
            }
            
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Speed")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(String(format: "%.2f", entry.walkingSpeed))
                        .font(.caption)
                        .fontWeight(.medium)
                }
                
                Spacer()
                
                Circle()
                    .fill(entry.isMonitoring ? .green : .red)
                    .frame(width: 8, height: 8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func fallRiskColor(_ risk: String) -> Color {
        switch risk {
        case "Low Risk": return .green
        case "Moderate Risk": return .orange
        case "High Risk": return .red
        default: return .gray
        }
    }
}

struct MediumWidgetView: View {
    let entry: GaitMetricsEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "figure.walk")
                    .foregroundColor(.accentColor)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("VitalSense Monitor")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Text("Gait Analysis")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack {
                    Circle()
                        .fill(entry.isMonitoring ? .green : .red)
                        .frame(width: 12, height: 12)
                    Text(entry.isMonitoring ? "Active" : "Inactive")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            HStack(spacing: 20) {
                MetricColumn(
                    title: "Fall Risk",
                    value: entry.fallRisk,
                    color: fallRiskColor(entry.fallRisk)
                )
                
                MetricColumn(
                    title: "Walking Speed",
                    value: String(format: "%.2f m/s", entry.walkingSpeed),
                    color: .primary
                )
                
                MetricColumn(
                    title: "Asymmetry",
                    value: String(format: "%.1f%%", entry.asymmetry),
                    color: entry.asymmetry > 3.0 ? .orange : .green
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func fallRiskColor(_ risk: String) -> Color {
        switch risk {
        case "Low Risk": return .green
        case "Moderate Risk": return .orange
        case "High Risk": return .red
        default: return .gray
        }
    }
}

struct LargeWidgetView: View {
    let entry: GaitMetricsEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "figure.walk")
                            .foregroundColor(.accentColor)
                            .font(.title2)
                        
                        Text("VitalSense Monitor")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                    }
                    
                    Text("Advanced Gait Analysis & Fall Risk Assessment")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    HStack {
                        Circle()
                            .fill(entry.isMonitoring ? .green : .red)
                            .frame(width: 8, height: 8)
                        Text(entry.isMonitoring ? "Monitoring Active" : "Monitoring Inactive")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Text("Updated: \(entry.date, style: .time)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Main Metrics
            VStack(alignment: .leading, spacing: 12) {
                Text("Current Assessment")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                HStack(spacing: 16) {
                    // Fall Risk - Prominent Display
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Fall Risk Level")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(entry.fallRisk)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(fallRiskColor(entry.fallRisk))
                    }
                    .padding()
                    .background(fallRiskColor(entry.fallRisk).opacity(0.1))
                    .cornerRadius(12)
                    
                    Spacer()
                    
                    // Secondary Metrics
                    VStack(alignment: .leading, spacing: 8) {
                        MetricRow(
                            title: "Walking Speed",
                            value: String(format: "%.2f m/s", entry.walkingSpeed),
                            status: entry.walkingSpeed >= 1.2 ? "Normal" : "Concern"
                        )
                        
                        MetricRow(
                            title: "Gait Asymmetry",
                            value: String(format: "%.1f%%", entry.asymmetry),
                            status: entry.asymmetry <= 3.0 ? "Normal" : "Elevated"
                        )
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private func fallRiskColor(_ risk: String) -> Color {
        switch risk {
        case "Low Risk": return .green
        case "Moderate Risk": return .orange
        case "High Risk": return .red
        default: return .gray
        }
    }
}

struct MetricColumn: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
    }
}

struct MetricRow: View {
    let title: String
    let value: String
    let status: String
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            
            Spacer()
            
            Text(status)
                .font(.caption2)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(statusColor(status).opacity(0.2))
                .foregroundColor(statusColor(status))
                .cornerRadius(4)
        }
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "Normal": return .green
        case "Concern", "Elevated": return .orange
        case "Risk": return .red
        default: return .gray
        }
    }
}

// MARK: - Widget Bundle
struct VitalSenseMonitorWidgetBundle: WidgetBundle {
    var body: some Widget {
        VitalSenseMonitorWidget()
    }
}

#Preview("Small Widget", as: .systemSmall) {
    VitalSenseMonitorWidget()
} timeline: {
    GaitMetricsEntry(
        date: Date(),
        walkingSpeed: 1.25,
        asymmetry: 2.1,
        fallRisk: "Low Risk",
        isMonitoring: true
    )
}

#Preview("Medium Widget", as: .systemMedium) {
    VitalSenseMonitorWidget()
} timeline: {
    GaitMetricsEntry(
        date: Date(),
        walkingSpeed: 1.25,
        asymmetry: 2.1,
        fallRisk: "Low Risk",
        isMonitoring: true
    )
}

#Preview("Large Widget", as: .systemLarge) {
    VitalSenseMonitorWidget()
} timeline: {
    GaitMetricsEntry(
        date: Date(),
        walkingSpeed: 1.25,
        asymmetry: 2.1,
        fallRisk: "Low Risk",
        isMonitoring: true
    )
}
