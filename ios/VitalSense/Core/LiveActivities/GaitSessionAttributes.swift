import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
struct GaitSessionAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var protocolName: String
        var elapsed: TimeInterval
        var remaining: TimeInterval
        var qualityScore: Int
        var isConnected: Bool
    }

    var title: String
}
#endif
