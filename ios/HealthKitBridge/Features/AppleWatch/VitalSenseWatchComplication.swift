import SwiftUI
import WidgetKit

struct VitalSenseWatchComplication: View {
    @Environment(\.widgetFamily) var widgetFamily
    let gaitMetrics: WatchGaitMetrics?
    
    var body: some View {
        switch widgetFamily {
        case .accessoryCorner:
            cornerView
        case .accessoryCircular:
            circularView
        default:
            EmptyView()
        }
    }
    
    private var cornerView: some View {
        VStack {
            Image(systemName: "figure.walk")
                .foregroundColor(.green)
            Text("1.2")
                .font(.caption)
        }
    }
    
    private var circularView: some View {
        VStack {
            Text("1.2")
                .font(.title2)
            Text("m/s")
                .font(.caption)
        }
    }
}
