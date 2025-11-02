//
//  AppIntent.swift
//  VitalSense Widgets
//
//  Created by Matthew Anderson on 9/26/25.
//

import WidgetKit
import SwiftUI

// Simple configuration for widgets - using basic configuration without AppIntents
// AppIntents and @Parameter require iOS 16+ and may not be available in current deployment target

struct VitalSenseWidgetConfiguration {
    let displayName: String
    let description: String

    static let `default` = VitalSenseWidgetConfiguration(
        displayName: "VitalSense Health",
        description: "Monitor your key health metrics at a glance"
    )
}
