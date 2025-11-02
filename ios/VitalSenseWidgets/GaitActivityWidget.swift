// This file is intended for a Widget Extension target.
// After creating the Widget Extension in Xcode, add this file to that target (not the main app).

import SwiftUI

#if canImport(WidgetKit) && canImport(ActivityKit)
import WidgetKit
import ActivityKit

struct GaitSessionAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
        var sessionDuration: TimeInterval
        var status: String
    }

    // Fixed non-changing properties about your activity go here!
    var sessionID: String
}

@available(iOS 16.1, *)
struct GaitActivityWidget {
    @available(iOS 16.1, *)
    static func configuration() -> some ActivityConfiguration {
        ActivityConfiguration(for: GaitSessionAttributes.self) { context in
            // Lock Screen / Banner
            GaitActivityLockScreenView(state: context.state)
                .activityBackgroundTint(.black.opacity(0.2))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    QualityPill(qualityScore: context.state.qualityScore)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.state.protocolName)
                            .font(.headline)
                        HStack(spacing: 12) {
                            Label(timeString(context.state.elapsed), systemImage: "timer")
                            Label("\(Int(context.state.remaining))s", systemImage: "hourglass")
                            Label(
                                context.state.isConnected ? "Online" : "Offline", systemImage: context.state.isConnected ? "bolt.horizontal" : "bolt.slash"
                            )
                        }
                        .font(.caption)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Image(systemName: "figure.walk")
                }
            } compactLeading: {
                QualityPill(qualityScore: context.state.qualityScore)
            } compactTrailing: {
                Image(systemName: context.state.isConnected ? "bolt.horizontal" : "bolt.slash")
            } minimal: {
                Image(systemName: "figure.walk")
            }
        }
    }
}

@available(iOS 16.1, *)
private struct GaitActivityLockScreenView: View {
    let state: GaitSessionAttributes.ContentState
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "figure.walk")
            VStack(alignment: .leading, spacing: 2) {
                Text(state.protocolName)
                    .font(.headline)
                HStack(spacing: 10) {
                    Label(timeString(state.elapsed), systemImage: "timer")
                    Label("\(Int(state.remaining))s", systemImage: "hourglass")
                    QualityPill(qualityScore: state.qualityScore)
                    Image(systemName: state.isConnected ? "bolt.horizontal" : "bolt.slash")
                }
                .font(.caption)
            }
        }
        .padding(8)
    }
}

@available(iOS 16.1, *)
private struct QualityPill: View {
    let qualityScore: Int
    var color: Color {
        if qualityScore >= 85 { return .green }
        if qualityScore >= 70 { return .blue }
        if qualityScore >= 55 { return .yellow }
        if qualityScore >= 40 { return .orange }
        return .red
    }
    var body: some View {
        Text("Q:\(qualityScore)")
            .font(.caption2)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(color.opacity(0.2))
            .clipShape(Capsule())
    }
}

@available(iOS 16.1, *)
private func timeString(_ interval: TimeInterval) -> String {
    let seconds = Int(interval)
    let minutes = seconds / 60
    let remainder = seconds % 60
    return String(format: "%d:%02d", minutes, remainder)
}

#if DEBUG
// Test seam (no ActivityKit dependency required by callers); mirrors QualityPill + timeString
enum GaitWidgetTestSeam {
    static func qualityCategory(for score: Int) -> String {
        if score >= 85 { return "green" }
        if score >= 70 { return "blue" }
        if score >= 55 { return "yellow" }
        if score >= 40 { return "orange" }
        return "red"
    }
    static func formatted(_ interval: TimeInterval) -> String { timeString(interval) }
}
#endif

#endif
