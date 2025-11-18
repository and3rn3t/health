import SwiftUI
import ARKit
import AVFoundation
import CoreMotion

struct LiDARPermissionView: View {
    @StateObject private var permissionManager = LiDARPermissionManager()
    @Environment(\.dismiss) private var dismiss
    @State private var showingSettings = false

    var body: some View {
        NavigationView {
            VStack(spacing: 32) {
                Spacer()

                // Header
                VStack(spacing: 16) {
                    Image(systemName: "camera.metering.spot")
                        .font(.system(size: 64))
                        .foregroundColor(.blue)

                    Text(NSLocalizedString("permission.lidar.title", value: "LiDAR Scanning Permissions", comment: ""))
                        .font(.title)
                        .fontWeight(.bold)
                        .lidarDynamicType(size: .title)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)

                    Text(NSLocalizedString("permission.lidar.message", value: "VitalSense needs camera and motion access to perform LiDAR scanning for health analysis.", comment: ""))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lidarDynamicType(size: .subheadline)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                // Permission cards
                VStack(spacing: 16) {
                    PermissionCard(
                        icon: "camera.fill",
                        title: loc("permission.camera.title"),
                        description: loc("permission.camera.message"),
                        status: permissionManager.cameraPermission,
                        action: {
                            permissionManager.requestCameraPermission()
                        }
                    )
                    .accessibilityIdentifier("permission_card_camera")
                    .switchControlSupport()

                    PermissionCard(
                        icon: "gyroscope",
                        title: loc("permission.motion.title"),
                        description: loc("permission.motion.message"),
                        status: permissionManager.motionPermission,
                        action: {
                            permissionManager.requestMotionPermission()
                        }
                    )
                    .accessibilityIdentifier("permission_card_motion")
                    .switchControlSupport()

                    if !permissionManager.isLiDARAvailable {
                        PermissionCard(
                            icon: "exclamationmark.triangle.fill",
                            title: loc("device.lidar.required"),
                            description: loc("device.lidar.required.message"),
                            status: .unavailable,
                            action: {}
                        )
                        .accessibilityIdentifier("permission_card_lidar_unavailable")
                    }
                }

                Spacer()

                // Action buttons
                VStack(spacing: 12) {
                    if permissionManager.allPermissionsGranted && permissionManager.isLiDARAvailable {
                        Button(NSLocalizedString("permission.button.continue", value: "Continue to LiDAR Scanning", comment: "")) {
                            dismiss()
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .accessibilityLabel(NSLocalizedString("accessibility.button.continue", value: "Continue", comment: ""))
                        .voiceControlSupport(identifier: "continue_button")
                        .switchControlSupport()
                    } else if permissionManager.hasAnyDeniedPermissions {
                        Button(NSLocalizedString("permission.button.open_settings", value: "Open Settings", comment: "")) {
                            showingSettings = true
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .accessibilityLabel(NSLocalizedString("accessibility.button.open_settings", value: "Open Settings", comment: ""))
                        .voiceControlSupport(identifier: "open_settings_button")
                        .switchControlSupport()

                        Button(NSLocalizedString("permission.button.skip", value: "Skip for Now", comment: "")) {
                            dismiss()
                        }
                        .buttonStyle(SecondaryButtonStyle())
                        .accessibilityLabel(NSLocalizedString("accessibility.button.skip", value: "Skip for now", comment: ""))
                        .voiceControlSupport(identifier: "skip_button")
                        .switchControlSupport()
                    } else {
                        Button(NSLocalizedString("permission.button.grant", value: "Grant Permissions", comment: "")) {
                            permissionManager.requestAllPermissions()
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(!permissionManager.isLiDARAvailable)
                        .accessibilityLabel(NSLocalizedString("accessibility.button.grant_permissions", value: "Grant permissions", comment: ""))
                        .voiceControlSupport(identifier: "grant_permissions_button")
                        .switchControlSupport()

                        Button(NSLocalizedString("permission.button.cancel", value: "Cancel", comment: "")) {
                            dismiss()
                        }
                        .buttonStyle(SecondaryButtonStyle())
                        .accessibilityLabel(NSLocalizedString("accessibility.button.cancel", value: "Cancel", comment: ""))
                        .voiceControlSupport(identifier: "cancel_button")
                        .switchControlSupport()
                    }
                }
                .padding(.bottom, 32)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                permissionManager.checkPermissions()
            }
        }
        .alert(NSLocalizedString("permission.alert.settings_required", value: "Settings Required", comment: ""),
               isPresented: $showingSettings) {
            Button(NSLocalizedString("permission.alert.button.settings", value: "Settings", comment: "")) {
                openSettings()
            }
            Button(NSLocalizedString("permission.alert.button.cancel", value: "Cancel", comment: ""), role: .cancel) { }
        } message: {
            Text(NSLocalizedString("permission.alert.message", value: "Please enable camera and motion permissions in Settings to use LiDAR scanning.", comment: ""))
        }
    }

    private func openSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
}

// MARK: - Permission Card
struct PermissionCard: View {
    let icon: String
    let title: String
    let description: String
    let status: PermissionStatus
    let action: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            // Icon
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(iconColor)
                .frame(width: 32)

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lidarDynamicType(size: .headline)

                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lidarDynamicType(size: .subheadline)
            }

            Spacer()

            // Status indicator
            statusIndicator
        }
        .padding()
        .background(backgroundColor)
        .cornerRadius(12)
        .onTapGesture {
            if status == .notDetermined {
                action()
            }
        }
    }

    private var iconColor: Color {
        switch status {
        case .granted:
            return .green
        case .denied:
            return .red
        case .notDetermined:
            return .blue
        case .unavailable:
            return .orange
        }
    }

    private var backgroundColor: Color {
        switch status {
        case .granted:
            return Color.green.opacity(0.1)
        case .denied:
            return Color.red.opacity(0.1)
        case .notDetermined:
            return Color.blue.opacity(0.1)
        case .unavailable:
            return Color.orange.opacity(0.1)
        }
    }

    @ViewBuilder
    private var statusIndicator: some View {
        switch status {
        case .granted:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.title3)
        case .denied:
            Image(systemName: "xmark.circle.fill")
                .foregroundColor(.red)
                .font(.title3)
        case .notDetermined:
            Image(systemName: "questionmark.circle.fill")
                .foregroundColor(.blue)
                .font(.title3)
        case .unavailable:
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.orange)
                .font(.title3)
        }
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundColor(.blue)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Permission Manager
enum PermissionStatus {
    case notDetermined
    case granted
    case denied
    case unavailable
}

@MainActor
class LiDARPermissionManager: ObservableObject {
    @Published var cameraPermission: PermissionStatus = .notDetermined
    @Published var motionPermission: PermissionStatus = .notDetermined
    @Published var isLiDARAvailable = false

    var allPermissionsGranted: Bool {
        return cameraPermission == .granted &&
               motionPermission == .granted &&
               isLiDARAvailable
    }

    var hasAnyDeniedPermissions: Bool {
        return cameraPermission == .denied || motionPermission == .denied
    }

    init() {
        checkLiDARAvailability()
        checkPermissions()
    }

    func checkPermissions() {
        checkCameraPermission()
        checkMotionPermission()
    }

    func requestAllPermissions() {
        requestCameraPermission()
        requestMotionPermission()
    }

    // MARK: - LiDAR Availability
    private func checkLiDARAvailability() {
        // Check if device supports LiDAR
        isLiDARAvailable = ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) ||
                          ARWorldTrackingConfiguration.supportsSceneReconstruction(.meshWithClassification)

        // Additional check for device model
        if !isLiDARAvailable {
            isLiDARAvailable = deviceSupportsLiDAR()
        }
    }

    private func deviceSupportsLiDAR() -> Bool {
        var systemInfo = utsname()
        uname(&systemInfo)

        let modelCode = withUnsafePointer(to: &systemInfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) {
                ptr in String.init(validatingUTF8: ptr)
            }
        }

        guard let model = modelCode else { return false }

        // LiDAR supported devices
        let lidarDevices = [
            "iPhone13,2", "iPhone13,3", "iPhone13,4", // iPhone 12 Pro, Pro Max
            "iPhone14,2", "iPhone14,3", // iPhone 13 Pro, Pro Max
            "iPhone15,2", "iPhone15,3", // iPhone 14 Pro, Pro Max
            "iPhone16,1", "iPhone16,2", // iPhone 15 Pro, Pro Max
            "iPad13,8", "iPad13,9", "iPad13,10", "iPad13,11", // iPad Pro 12.9" (5th gen)
            "iPad13,4", "iPad13,5", "iPad13,6", "iPad13,7", // iPad Pro 11" (3rd gen)
            "iPad14,3", "iPad14,4", // iPad Pro 11" (4th gen)
            "iPad14,5", "iPad14,6"  // iPad Pro 12.9" (6th gen)
        ]

        return lidarDevices.contains { model.hasPrefix($0) }
    }

    // MARK: - Camera Permission
    private func checkCameraPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraPermission = .granted
        case .denied, .restricted:
            cameraPermission = .denied
        case .notDetermined:
            cameraPermission = .notDetermined
        @unknown default:
            cameraPermission = .notDetermined
        }
    }

    func requestCameraPermission() {
        guard cameraPermission == .notDetermined else { return }

        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.cameraPermission = granted ? .granted : .denied
            }
        }
    }

    // MARK: - Motion Permission
    /// Motion data doesn't require explicit permission on iOS, but we check availability
    private func checkMotionPermission() {
        // Motion sensors (accelerometer, gyroscope) don't require permission
        // They're always available if the device supports them
        let motionManager = CMMotionManager()
        if motionManager.isAccelerometerAvailable || motionManager.isGyroAvailable {
            motionPermission = .granted
        } else {
            motionPermission = .unavailable
        }
    }

    func requestMotionPermission() {
        // CoreMotion accelerometer/gyroscope data doesn't require explicit permission
        // This is mainly for consistency in the UI
        checkMotionPermission()
    }
}

// MARK: - Preview
struct LiDARPermissionView_Previews: PreviewProvider {
    static var previews: some View {
        LiDARPermissionView()
    }
}
