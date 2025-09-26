import Foundation
import SwiftUI

#if canImport(TipKit)
import TipKit

@available(iOS 17.0, *)
struct ProtocolTip: Tip {
    var title: Text { Text("Choose a protocol") }
    var message: Text? { Text("TUG, 10MWT, or 6MWT—VitalSense guides you with timing and cues.") }
    var image: Image? { Image(systemName: "figure.walk.motion") }
}

@available(iOS 17.0, *)
struct ARSpaceTip: Tip {
    var title: Text { Text("Find a clear path") }
    var message: Text? { Text("Use a flat, well-lit space. Place the phone at hip height for best results.") }
    var image: Image? { Image(systemName: "camera.viewfinder") }
}

@available(iOS 17.0, *)
enum GaitTipsManager {
    static func configure() {
        try? Tips.configure()
    }
}
#endif
