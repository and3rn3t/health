//
//  VitalSenseWidget.swift
//  VitalSense
//
//  Legacy widget implementation - now redirects to VitalSenseWidgets module
//  Created: 2025-11-01
//

import WidgetKit
import SwiftUI

// MARK: - Legacy Widget Redirect

/// Legacy widget - use VitalSenseHealthWidget from VitalSenseWidgets module instead
@available(*, deprecated, message: "Use VitalSenseHealthWidget from VitalSenseWidgets module")
struct VitalSenseWidget: Widget {
    let kind: String = "VitalSenseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: LegacyProvider()
        ) { entry in
            LegacyRedirectView()
        }
        .configurationDisplayName("VitalSense Health")
        .description("Health monitoring widget - please use updated version")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Legacy Timeline Provider

struct LegacyProvider: TimelineProvider {
    func placeholder(in context: Context) -> LegacyEntry {
        LegacyEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (LegacyEntry) -> Void) {
        completion(LegacyEntry(date: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LegacyEntry>) -> Void) {
        let entry = LegacyEntry(date: Date())
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

// MARK: - Legacy Entry Model

struct LegacyEntry: TimelineEntry {
    let date: Date
}

// MARK: - Legacy Redirect View

struct LegacyRedirectView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.title2)
                .foregroundColor(.blue)

            Text("Widget Updated")
                .font(.caption)
                .fontWeight(.semibold)

            Text("Please remove and re-add widget")
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
