import SwiftUI

struct AppShell: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            EnhancedVitalSenseDashboard()
        } else {
            EnhancedHealthMonitoringView()
        }
    }
}

#Preview { AppShell() }
