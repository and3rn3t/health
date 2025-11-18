import Foundation
import WatchConnectivity

// Coordinates LiDAR-driven gait metrics with Apple Watch via WatchConnectivity.

@MainActor
final class WatchLiDARIntegrationManager: NSObject, ObservableObject {
    static let shared = WatchLiDARIntegrationManager()

    private let session: WCSession? = WCSession.isSupported() ? WCSession.default : nil

    private override init() {
        super.init()
        session?.delegate = self
        session?.activate()
    }

    func sendGaitUpdate(_ payload: RealtimeGaitDataPayload) {
        guard let session = session, session.isPaired, session.isWatchAppInstalled else { return }

        do {
            let data = try JSONEncoder().encode(payload)
            try session.updateApplicationContext(["realtimeGaitData": data])
        } catch {
            // Swallow errors for now; detailed logging can be added later.
        }
    }
}

@MainActor
extension WatchLiDARIntegrationManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) { }
    func sessionDidBecomeInactive(_ session: WCSession) { }
    func sessionDidDeactivate(_ session: WCSession) { }
}
