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

        // Legacy support (can be removed once migration is complete)
        VitalSenseWidgets()
        
        // Note: VitalSenseWidgetsControl requires iOS 18.0+ and is excluded
        // from the bundle since deployment target is iOS 17.0
    }
}
