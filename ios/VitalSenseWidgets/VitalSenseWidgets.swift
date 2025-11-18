//
//  VitalSenseWidgets.swift
//  VitalSenseWidgets
//
//  Created by Matthew Anderson on 9/26/25.
//

import WidgetKit
import SwiftUI

// Simple timeline provider without AppIntents dependency
struct Provider: TimelineProvider {
    typealias Entry = SimpleEntry

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), emoji: "😃")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), emoji: "😃")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        var entries: [SimpleEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, emoji: "😃")
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let emoji: String
}

struct VitalSenseWidgetsEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                Text("VitalSense")
                    .font(.headline)
                    .fontWeight(.bold)
            }

            Text("Time:")
            Text(entry.date, style: .time)

            Text("Status:")
            Text(entry.emoji)
                .font(.largeTitle)
        }
        .padding()
    }
}

struct VitalSenseWidgets: Widget {
    let kind: String = "VitalSenseWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            VitalSenseWidgetsEntryView(entry: entry)
        }
        .configurationDisplayName("VitalSense Widget")
        .description("Quick access to VitalSense health monitoring")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemSmall) {
    VitalSenseWidgets()
} timeline: {
    SimpleEntry(date: Date(), emoji: "😃")
    SimpleEntry(date: Date(), emoji: "💓")
}
