import SwiftUI

// MARK: - Enhanced Navigation System for VitalSense

/// Enhanced tab view with smooth animations and better visual hierarchy
struct EnhancedTabView: View {
    @Binding var selectedTab: Int
    let tabs: [TabItem]

    struct TabItem {
        let id: Int
        let title: String
        let icon: String
        let selectedIcon: String?
        let badge: Int?
        let content: AnyView

        init<Content: View>(
            id: Int,
            title: String,
            icon: String,
            selectedIcon: String? = nil,
            badge: Int? = nil,
            @ViewBuilder content: () -> Content
        ) {
            self.id = id
            self.title = title
            self.icon = icon
            self.selectedIcon = selectedIcon
            self.badge = badge
            self.content = AnyView(content())
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Content area
            ZStack {
                ForEach(tabs, id: \.id) { tab in
                    tab.content
                        .opacity(selectedTab == tab.id ? 1.0 : 0.0)
                        .scaleEffect(selectedTab == tab.id ? 1.0 : 0.95)
                        .animation(.easeInOut(duration: 0.3), value: selectedTab)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Custom tab bar
            EnhancedTabBar(selectedTab: $selectedTab, tabs: tabs)
        }
    }
}

/// Custom tab bar with enhanced visual design and animations
struct EnhancedTabBar: View {
    @Binding var selectedTab: Int
    let tabs: [EnhancedTabView.TabItem]

    @Namespace private var animationNamespace

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.id) { tab in
                TabBarButton(
                    tab: tab,
                    isSelected: selectedTab == tab.id,
                    animationNamespace: animationNamespace
                ) {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        selectedTab = tab.id
                    }

                    // Haptic feedback
                    let selectionFeedback = UISelectionFeedbackGenerator()
                    selectionFeedback.selectionChanged()
                }
            }
        }
        .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        .padding(.vertical, ModernDesignSystem.Spacing.small)
        .background {
            RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.xxLarge)
                .fill(.regularMaterial)
                .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: -5)
        }
        .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        .padding(.bottom, ModernDesignSystem.Spacing.small)
    }
}

/// Individual tab bar button with enhanced styling
struct TabBarButton: View {
    let tab: EnhancedTabView.TabItem
    let isSelected: Bool
    let animationNamespace: Namespace.ID
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: ModernDesignSystem.Spacing.xxSmall) {
                ZStack {
                    // Background indicator
                    if isSelected {
                        RoundedRectangle(cornerRadius: ModernDesignSystem.CornerRadius.large)
                            .fill(ModernDesignSystem.Colors.primary.opacity(0.1))
                            .frame(width: 44, height: 32)
                            .matchedGeometryEffect(id: "selectedTab", in: animationNamespace)
                    }

                    // Icon with badge
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: isSelected ? (tab.selectedIcon ?? tab.icon) : tab.icon)
                            .font(.system(size: 18, weight: isSelected ? .semibold : .medium))
                            .foregroundColor(isSelected ? ModernDesignSystem.Colors.primary : ModernDesignSystem.Colors.textSecondary)
                            .scaleEffect(isSelected ? 1.1 : 1.0)
                            .animation(.easeInOut(duration: 0.2), value: isSelected)

                        if let badge = tab.badge, badge > 0 {
                            Text("\(badge)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 2)
                                .background {
                                    Capsule()
                                        .fill(ModernDesignSystem.Colors.healthRed)
                                }
                                .offset(x: 8, y: -8)
                        }
                    }
                }

                Text(tab.title)
                    .font(.system(size: 10, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(isSelected ? ModernDesignSystem.Colors.primary : ModernDesignSystem.Colors.textSecondary)
                    .animation(.easeInOut(duration: 0.2), value: isSelected)
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

/// Enhanced page transition wrapper
struct EnhancedPageTransition<Content: View>: View {
    let content: Content
    let transitionType: TransitionType

    enum TransitionType {
        case slide, scale, opacity, combined

        var transition: AnyTransition {
            switch self {
            case .slide:
                return .asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                )
            case .scale:
                return .scale.combined(with: .opacity)
            case .opacity:
                return .opacity
            case .combined:
                return .asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .scale).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .scale).combined(with: .opacity)
                )
            }
        }
    }

    init(transitionType: TransitionType = .combined, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.transitionType = transitionType
    }

    var body: some View {
        content
            .transition(transitionType.transition)
    }
}

/// Enhanced navigation header with better visual hierarchy
struct EnhancedNavigationHeader: View {
    let title: String
    let subtitle: String?
    let leadingButton: HeaderButton?
    let trailingButton: HeaderButton?

    struct HeaderButton {
        let icon: String
        let action: () -> Void
    }

    var body: some View {
        VStack(spacing: ModernDesignSystem.Spacing.xSmall) {
            HStack {
                // Leading button
                if let leadingButton = leadingButton {
                    Button(action: leadingButton.action) {
                        Image(systemName: leadingButton.icon)
                            .font(.title3.weight(.medium))
                            .foregroundColor(ModernDesignSystem.Colors.primary)
                            .frame(width: 44, height: 44)
                            .background {
                                Circle()
                                    .fill(ModernDesignSystem.Colors.primary.opacity(0.1))
                            }
                    }
                    .buttonStyle(.plain)
                } else {
                    Spacer()
                        .frame(width: 44, height: 44)
                }

                Spacer()

                // Title section
                VStack(spacing: 2) {
                    Text(title)
                        .font(ModernDesignSystem.Typography.title3)
                        .foregroundColor(ModernDesignSystem.Colors.textPrimary)
                        .multilineTextAlignment(.center)

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(ModernDesignSystem.Typography.caption)
                            .foregroundColor(ModernDesignSystem.Colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                }

                Spacer()

                // Trailing button
                if let trailingButton = trailingButton {
                    Button(action: trailingButton.action) {
                        Image(systemName: trailingButton.icon)
                            .font(.title3.weight(.medium))
                            .foregroundColor(ModernDesignSystem.Colors.primary)
                            .frame(width: 44, height: 44)
                            .background {
                                Circle()
                                    .fill(ModernDesignSystem.Colors.primary.opacity(0.1))
                            }
                    }
                    .buttonStyle(.plain)
                } else {
                    Spacer()
                        .frame(width: 44, height: 44)
                }
            }

            // Separator
            Rectangle()
                .fill(ModernDesignSystem.Colors.border)
                .frame(height: 0.5)
                .opacity(0.5)
        }
        .padding(.horizontal, ModernDesignSystem.Spacing.medium)
        .padding(.vertical, ModernDesignSystem.Spacing.small)
        .background(.regularMaterial)
    }
}

/// Enhanced sheet presentation with custom styling
struct EnhancedSheet<Content: View>: ViewModifier {
    @Binding var isPresented: Bool
    let content: Content
    let detents: Set<PresentationDetent>
    let dragIndicator: Visibility

    init(
        isPresented: Binding<Bool>,
        detents: Set<PresentationDetent> = [.large],
        dragIndicator: Visibility = .automatic,
        @ViewBuilder content: () -> Content
    ) {
        self._isPresented = isPresented
        self.content = content()
        self.detents = detents
        self.dragIndicator = dragIndicator
    }

    func body(content: Content) -> some View {
        content
            .sheet(isPresented: $isPresented) {
                NavigationView {
                    self.content
                        .navigationBarTitleDisplayMode(.inline)
                }
                .presentationDetents(detents)
                .presentationDragIndicator(dragIndicator)
            }
    }
}

// MARK: - View Extensions
extension View {
    func enhancedSheet<Content: View>(
        isPresented: Binding<Bool>,
        detents: Set<PresentationDetent> = [.large],
        dragIndicator: Visibility = .automatic,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        self.modifier(EnhancedSheet(
            isPresented: isPresented,
            detents: detents,
            dragIndicator: dragIndicator,
            content: content
        ))
    }

    func enhancedPageTransition(type: EnhancedPageTransition<EmptyView>.TransitionType = .combined) -> some View {
        self.transition(type.transition)
    }
}

// MARK: - Preview Support
#if DEBUG
struct EnhancedNavigation_Previews: PreviewProvider {
    @State static var selectedTab = 0
    @State static var showSheet = false

    static var previews: some View {
        EnhancedTabView(selectedTab: $selectedTab, tabs: [
            .init(id: 0, title: "Overview", icon: "heart", selectedIcon: "heart.fill") {
                VStack {
                    EnhancedNavigationHeader(
                        title: "VitalSense",
                        subtitle: "Health Monitoring",
                        leadingButton: .init(icon: "person.circle") {},
                        trailingButton: .init(icon: "bell") {}
                    )

                    Spacer()

                    Text("Overview Content")
                        .font(ModernDesignSystem.Typography.title2)

                    Spacer()
                }
                .background(ModernDesignSystem.Colors.background)
            },
            .init(id: 1, title: "Metrics", icon: "chart.line.uptrend.xyaxis", badge: 3) {
                Text("Metrics Content")
                    .font(ModernDesignSystem.Typography.title2)
            },
            .init(id: 2, title: "Settings", icon: "gear") {
                Text("Settings Content")
                    .font(ModernDesignSystem.Typography.title2)
            }
        ])
    }
}
#endif
