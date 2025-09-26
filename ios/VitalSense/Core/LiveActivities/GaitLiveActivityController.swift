import Foundation
import SwiftUI

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
final class GaitLiveActivityController {
    static let shared = GaitLiveActivityController()
    private init() {}

    private var activity: Activity<GaitSessionAttributes>?

    func startSessionActivity(
        protocolName: String,
        duration: TimeInterval,
        isConnected: Bool
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = GaitSessionAttributes(title: "VitalSense Gait Session")
        let state = GaitSessionAttributes.ContentState(
            protocolName: protocolName,
            elapsed: 0,
            remaining: duration,
            qualityScore: 100,
            isConnected: isConnected
        )
        do {
            activity = try Activity<GaitSessionAttributes>.request(
                attributes: attributes,
                contentState: state,
                pushType: nil
            )
        } catch {
            // Silently ignore in production; optionally log with os.Logger
        }
    }

    func update(
        elapsed: TimeInterval,
        remaining: TimeInterval,
        qualityScore: Int,
        isConnected: Bool,
        protocolName: String
    ) {
        guard let activity else { return }
        let state = GaitSessionAttributes.ContentState(
            protocolName: protocolName,
            elapsed: elapsed,
            remaining: remaining,
            qualityScore: qualityScore,
            isConnected: isConnected
        )
        Task { await activity.update(using: state) }
    }

    func end(success: Bool) {
        guard let activity else { return }
        Task {
            await activity.end(dismissalPolicy: success ? .immediate : .default)
        }
        self.activity = nil
    }
}
#endif
