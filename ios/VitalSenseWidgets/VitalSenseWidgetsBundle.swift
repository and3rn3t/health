//
//  VitalSenseWidgetsBundle.swift
//  VitalSenseWidgets
//
//  Created by Matthew Anderson on 9/26/25.
//

import WidgetKit
import SwiftUI

@main
struct VitalSenseWidgetsBundle: WidgetBundle {
    var body: some Widget {
        VitalSenseWidgets()
        VitalSenseWidgetsControl()
        VitalSenseWidgetsLiveActivity()
    }
}
