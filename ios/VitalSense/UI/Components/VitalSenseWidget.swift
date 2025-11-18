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
        StaticConfiguration(kind: kind, provider: PlaceholderProvider()) { _ in
            LegacyRedirectView()
        }
        .configurationDisplayName("VitalSense Health")
        .description("Legacy widget - please add the new VitalSense widget instead.")
    }
}

// MARK: - Placeholder Provider

struct PlaceholderProvider: TimelineProvider {
    struct Entry: TimelineEntry { let date = Date() }

    func placeholder(in context: Context) -> Entry { Entry() }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry()) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry()], policy: .atEnd))
    }
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
