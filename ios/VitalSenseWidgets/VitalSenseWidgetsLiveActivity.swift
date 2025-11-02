//
//  VitalSenseWidgetsLiveActivity.swift
//  VitalSenseWidgets
//
//  Created by Matthew Anderson on 9/26/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct VitalSenseWidgetsAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct VitalSenseWidgetsLiveActivity {
    @available(iOS 16.1, *)
    static func configuration() -> some ActivityConfiguration {
        ActivityConfiguration(for: VitalSenseWidgetsAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension VitalSenseWidgetsAttributes {
    fileprivate static var preview: VitalSenseWidgetsAttributes {
        VitalSenseWidgetsAttributes(name: "World")
    }
}

extension VitalSenseWidgetsAttributes.ContentState {
    fileprivate static var smiley: VitalSenseWidgetsAttributes.ContentState {
        VitalSenseWidgetsAttributes.ContentState(emoji: "😀")
     }

     fileprivate static var starEyes: VitalSenseWidgetsAttributes.ContentState {
         VitalSenseWidgetsAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: VitalSenseWidgetsAttributes.preview) {
   VitalSenseWidgetsLiveActivity()
} contentStates: {
    VitalSenseWidgetsAttributes.ContentState.smiley
    VitalSenseWidgetsAttributes.ContentState.starEyes
}
