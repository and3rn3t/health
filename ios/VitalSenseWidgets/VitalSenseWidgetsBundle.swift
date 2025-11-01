//
//  VitalSenseWidgetsBundle.swift
//  VitalSenseWidgets
//
//  Main widget bundle - consolidated to avoid duplication
//  Created: 2025-11-01
//

import WidgetKit
import SwiftUI

@main
struct VitalSenseWidgetsBundle: WidgetBundle {
    var body: some Widget {
        // Main health widgets
        VitalSenseHealthWidget()

        // Specialized widgets
        VitalSenseHeartRateWidget()
        VitalSenseActivityWidget()
        VitalSenseStepsWidget()

        // Interactive and live activities
        VitalSenseWidgetsControl()
        VitalSenseWidgetsLiveActivity()

        // Legacy support (can be removed once migration is complete)
        VitalSenseWidgets()
    }
}
