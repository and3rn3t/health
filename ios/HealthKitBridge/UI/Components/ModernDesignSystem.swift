//
//  ModernDesignSystem.swift
//  VitalSense Monitor
//

import SwiftUI

// MARK: - Design System Colors
extension Color {
    static let primaryBrand = Color("PrimaryBrand")
    static let secondaryBrand = Color("SecondaryBrand")
    static let accentBrand = Color("AccentBrand")
    
    // Health Status Colors
    static let healthGreen = Color.green
    static let healthYellow = Color.yellow
    static let healthOrange = Color.orange
    static let healthRed = Color.red
    
    // Gait Analysis Colors
    static let gaitNormal = Color.green
    static let gaitConcern = Color.orange
    static let gaitRisk = Color.red
    
    // Background Colors
    static let backgroundPrimary = Color(.systemBackground)
    static let backgroundSecondary = Color(.secondarySystemBackground)
    static let backgroundTertiary = Color(.tertiarySystemBackground)
}

// MARK: - Typography
extension Font {
    // Headers
    static let heroTitle = Font.largeTitle.weight(.bold)
    static let sectionHeader = Font.title2.weight(.semibold)
    static let cardTitle = Font.headline.weight(.medium)
    
    // Body Text
    static let bodyRegular = Font.body
    static let bodyMedium = Font.body.weight(.medium)
    static let captionRegular = Font.caption
    static let captionMedium = Font.caption.weight(.medium)
    
    // Metrics Display
    static let metricValue = Font.title3.weight(.semibold)
    static let metricLabel = Font.caption.weight(.medium)
}

// MARK: - Spacing
struct Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}

// MARK: - Border Radius
struct BorderRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 20
}

// MARK: - Shadow Styles
struct ShadowStyle {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
    
    static let cardShadow = ShadowStyle(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    static let buttonShadow = ShadowStyle(color: .black.opacity(0.15), radius: 4, x: 0, y: 2)
    static let modalShadow = ShadowStyle(color: .black.opacity(0.25), radius: 20, x: 0, y: 10)
}

// MARK: - Card Styles
struct CardStyle: ViewModifier {
    let backgroundColor: Color
    let cornerRadius: CGFloat
    let shadow: ShadowStyle
    
    func body(content: Content) -> some View {
        content
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}

extension View {
    func modernCard(
        backgroundColor: Color = .backgroundSecondary,
        cornerRadius: CGFloat = BorderRadius.md,
        shadow: ShadowStyle = ShadowStyle.cardShadow
    ) -> some View {
        self.modifier(CardStyle(backgroundColor: backgroundColor, cornerRadius: cornerRadius, shadow: shadow))
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    let backgroundColor: Color
    let foregroundColor: Color
    
    init(backgroundColor: Color = .accentColor, foregroundColor: Color = .white) {
        self.backgroundColor = backgroundColor
        self.foregroundColor = foregroundColor
    }
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(backgroundColor.opacity(configuration.isPressed ? 0.8 : 1.0))
            .foregroundColor(foregroundColor)
            .font(.bodyMedium)
            .cornerRadius(BorderRadius.md)
            .shadow(color: ShadowStyle.buttonShadow.color, radius: ShadowStyle.buttonShadow.radius, x: ShadowStyle.buttonShadow.x, y: ShadowStyle.buttonShadow.y)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    let borderColor: Color
    let foregroundColor: Color
    
    init(borderColor: Color = .accentColor, foregroundColor: Color = .accentColor) {
        self.borderColor = borderColor
        self.foregroundColor = foregroundColor
    }
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.md)
            .background(Color.clear)
            .foregroundColor(foregroundColor.opacity(configuration.isPressed ? 0.7 : 1.0))
            .font(.bodyMedium)
            .overlay(
                RoundedRectangle(cornerRadius: BorderRadius.md)
                    .stroke(borderColor.opacity(configuration.isPressed ? 0.7 : 1.0), lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Status Indicator
struct StatusIndicator: View {
    let status: String
    let color: Color
    let size: CGFloat
    
    init(status: String, color: Color, size: CGFloat = 12) {
        self.status = status
        self.color = color
        self.size = size
    }
    
    var body: some View {
        HStack(spacing: Spacing.xs) {
            Circle()
                .fill(color)
                .frame(width: size, height: size)
            
            Text(status)
                .font(.captionMedium)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Metric Display Card
struct MetricDisplayCard: View {
    let title: String
    let value: String
    let unit: String?
    let status: String?
    let statusColor: Color?
    let icon: String?
    
    init(
        title: String,
        value: String,
        unit: String? = nil,
        status: String? = nil,
        statusColor: Color? = nil,
        icon: String? = nil
    ) {
        self.title = title
        self.value = value
        self.unit = unit
        self.status = status
        self.statusColor = statusColor
        self.icon = icon
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .foregroundColor(.accentColor)
                        .font(.headline)
                }
                
                Text(title)
                    .font(.metricLabel)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if let status = status, let statusColor = statusColor {
                    StatusIndicator(status: status, color: statusColor, size: 8)
                }
            }
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.metricValue)
                    .foregroundColor(.primary)
                
                if let unit = unit {
                    Text(unit)
                        .font(.captionRegular)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(Spacing.md)
        .modernCard()
    }
}

// MARK: - Progress Ring
struct ProgressRing: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    let size: CGFloat
    
    init(progress: Double, color: Color = .accentColor, lineWidth: CGFloat = 8, size: CGFloat = 60) {
        self.progress = progress
        self.color = color
        self.lineWidth = lineWidth
        self.size = size
    }
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)
                .frame(width: size, height: size)
            
            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 1.0), value: progress)
        }
    }
}

// MARK: - Section Header
struct SectionHeaderView: View {
    let title: String
    let subtitle: String?
    let action: (() -> Void)?
    let actionTitle: String?
    
    init(title: String, subtitle: String? = nil, actionTitle: String? = nil, action: (() -> Void)? = nil) {
        self.title = title
        self.subtitle = subtitle
        self.actionTitle = actionTitle
        self.action = action
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.sectionHeader)
                    .foregroundColor(.primary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.captionRegular)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if let action = action, let actionTitle = actionTitle {
                Button(actionTitle, action: action)
                    .font(.captionMedium)
                    .foregroundColor(.accentColor)
            }
        }
        .padding(.horizontal, Spacing.md)
        .padding(.vertical, Spacing.sm)
    }
}

// MARK: - Alert Banner
struct AlertBanner: View {
    let message: String
    let type: AlertType
    let dismissAction: (() -> Void)?
    
    enum AlertType {
        case info, success, warning, error
        
        var color: Color {
            switch self {
            case .info: return .blue
            case .success: return .green
            case .warning: return .orange
            case .error: return .red
            }
        }
        
        var icon: String {
            switch self {
            case .info: return "info.circle.fill"
            case .success: return "checkmark.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .error: return "xmark.circle.fill"
            }
        }
    }
    
    var body: some View {
        HStack(spacing: Spacing.sm) {
            Image(systemName: type.icon)
                .foregroundColor(type.color)
                .font(.headline)
            
            Text(message)
                .font(.bodyRegular)
                .foregroundColor(.primary)
                .multilineTextAlignment(.leading)
            
            Spacer()
            
            if let dismissAction = dismissAction {
                Button(action: dismissAction) {
                    Image(systemName: "xmark")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
        }
        .padding(Spacing.md)
        .background(type.color.opacity(0.1))
        .cornerRadius(BorderRadius.md)
        .overlay(
            RoundedRectangle(cornerRadius: BorderRadius.md)
                .stroke(type.color.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Loading View
struct LoadingView: View {
    let message: String?
    
    init(message: String? = "Loading...") {
        self.message = message
    }
    
    var body: some View {
        VStack(spacing: Spacing.md) {
            ProgressView()
                .scaleEffect(1.5)
                .progressViewStyle(CircularProgressViewStyle(tint: .accentColor))
            
            if let message = message {
                Text(message)
                    .font(.bodyRegular)
                    .foregroundColor(.secondary)
            }
        }
        .padding(Spacing.xl)
        .modernCard()
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let title: String
    let message: String
    let icon: String
    let actionTitle: String?
    let action: (() -> Void)?
    
    init(
        title: String,
        message: String,
        icon: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.message = message
        self.icon = icon
        self.actionTitle = actionTitle
        self.action = action
    }
    
    var body: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundColor(.secondary)
            
            VStack(spacing: Spacing.sm) {
                Text(title)
                    .font(.sectionHeader)
                    .foregroundColor(.primary)
                
                Text(message)
                    .font(.bodyRegular)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            if let action = action, let actionTitle = actionTitle {
                Button(actionTitle, action: action)
                    .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding(Spacing.xl)
    }
}

#Preview {
    VStack(spacing: Spacing.lg) {
        MetricDisplayCard(
            title: "Walking Speed",
            value: "1.25",
            unit: "m/s",
            status: "Normal",
            statusColor: .green,
            icon: "figure.walk"
        )
        
        AlertBanner(
            message: "Fall risk assessment completed successfully",
            type: .success,
            dismissAction: {}
        )
        
        LoadingView(message: "Analyzing gait data...")
    }
    .padding()
}
