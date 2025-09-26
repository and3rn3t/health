import WidgetKit
import SwiftUI

#if WIDGET_EXTENSION
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
#endif
