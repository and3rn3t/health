import SwiftUI

struct AppShell: View {
    var body: some View {
        if #available(iOS 16.0, *) {
            EnhancedHealthMonitoringView()
        } else {
            HealthMonitoringView()
        }
    }
}

#Preview { AppShell() }
