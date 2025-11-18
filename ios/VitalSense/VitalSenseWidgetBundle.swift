import WidgetKit
import SwiftUI

struct VitalSenseWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        VitalSenseWidget() // renamed from HealthKitBridgeWidget
        if #available(iOS 16.1, *) {
            GaitActivityWidget()
        }
    }
}
