import SwiftUI

struct ContentView: View {
    @EnvironmentObject var hk: HealthKitManager

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(hk.isAuthorized ? Color.green : Color.red)
                        .frame(width: 10, height: 10)
                    Text(hk.isAuthorized ? "HealthKit: Authorized" : "HealthKit: Not Authorized")
                        .font(.headline)
                }

                Button("Request HealthKit Access") {
                    hk.requestAuthorization()
                }
                .buttonStyle(.borderedProminent)

                Text("After authorization, the app mints a device token, connects to the WS URL in Config.plist, and streams HealthKit samples.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
            }
            .padding()
            .navigationTitle("Health Bridge")
        }
    }
}
