import SwiftUI

// MARK: - Offline Indicator View

struct OfflineIndicatorView: View {
    @StateObject private var offlineManager = OfflineSupportManager.shared

    var body: some View {
        if !offlineManager.isOnline {
            HStack(spacing: 8) {
                Image(systemName: "wifi.slash")
                    .font(.caption)

                Text("Offline")
                    .font(.caption)
                    .fontWeight(.medium)

                if offlineManager.queuedItems > 0 {
                    Text("(\(offlineManager.queuedItems) queued)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.orange.opacity(0.2))
            .foregroundColor(.orange)
            .cornerRadius(8)
        } else if offlineManager.syncStatus == .syncing {
            HStack(spacing: 8) {
                ProgressView()
                    .scaleEffect(0.8)

                Text("Syncing...")
                    .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.blue.opacity(0.2))
            .foregroundColor(.blue)
            .cornerRadius(8)
        } else if offlineManager.queuedItems > 0 {
            HStack(spacing: 8) {
                Image(systemName: "tray.and.arrow.down")
                    .font(.caption)

                Text("\(offlineManager.queuedItems) items queued")
                    .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.yellow.opacity(0.2))
            .foregroundColor(.yellow)
            .cornerRadius(8)
        }
    }
}
