import WidgetKit
import SwiftUI

@main
struct VitalSenseWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        VitalSenseWidget() // renamed from HealthKitBridgeWidget
        if #available(iOS 16.1, *) {
            GaitActivityWidget()
        }
    }
}
