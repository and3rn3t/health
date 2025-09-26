import SwiftUI

@main
struct VitalSenseApp: App {
    var body: some Scene {
        WindowGroup { RootHostView() }
    }
}

struct RootHostView: View { // exposed for tests
    var body: some View {
        #if DEBUG
        Text("")
        #endif
        if AppShellAvailability.isPresent {
            AnyView(AppShell())
        } else {
            Text("VitalSense").font(.title)
        }
    }
}

enum AppShellAvailability { // exposed for tests
    static var overrideIsPresent: Bool?
    static var isPresent: Bool {
        if let o = overrideIsPresent { return o }
        return NSClassFromString("VitalSense.AppShell") != nil
    }
    #if DEBUG
    static func _resetOverride() { overrideIsPresent = nil }
    #endif
}
