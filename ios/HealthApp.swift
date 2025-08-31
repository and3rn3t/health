import SwiftUI

@main
struct HealthApp: App {
    @StateObject private var hk = HealthKitManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(hk)
        }
    }
}
