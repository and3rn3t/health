//
//  ErrorPresentation.swift
//  Andernet Posture
//
//  Reusable SwiftUI view modifier for presenting AppError alerts
//  with recovery suggestions and optional retry actions.
//

import SwiftUI

// MARK: - Error Alert Modifier

/// Presents a standardized alert for any `AppError`, with an optional retry action.
struct ErrorAlertModifier: ViewModifier {
    @Binding var error: AppError?
    var onRetry: (() -> Void)?

    func body(content: Content) -> some View {
        content
            .alert(
                error?.errorDescription ?? String(localized: "Error"),
                isPresented: Binding(
                    get: { error != nil },
                    set: { if !$0 { error = nil } }
                )
            ) {
                if let error, error.isRetryable, let onRetry {
                    Button(String(localized: "Retry")) {
                        self.error = nil
                        onRetry()
                    }
                    Button(String(localized: "Dismiss"), role: .cancel) {
                        self.error = nil
                    }
                } else {
                    Button(String(localized: "OK"), role: .cancel) {
                        self.error = nil
                    }
                }
            } message: {
                if let suggestion = error?.recoverySuggestion {
                    Text(suggestion)
                }
            }
    }
}

// MARK: - Error Banner Modifier

/// Displays a non-blocking banner at the top of the view for transient errors.
struct ErrorBannerModifier: ViewModifier {
    @Binding var error: AppError?
    var autoDismissAfter: TimeInterval = 5.0

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if let error {
                    VStack(spacing: 4) {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.yellow)
                            Text(error.errorDescription ?? String(localized: "Error"))
                                .font(.subheadline.weight(.medium))
                            Spacer()
                            Button {
                                withAnimation { self.error = nil }
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.secondary)
                            }
                        }
                        if let suggestion = error.recoverySuggestion {
                            Text(suggestion)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        Task { @MainActor in
                            try? await Task.sleep(for: .seconds(autoDismissAfter))
                            withAnimation { self.error = nil }
                        }
                    }
                }
            }
            .animation(.easeInOut(duration: 0.3), value: error != nil)
    }
}

// MARK: - View Extension

extension View {
    /// Present a standardized error alert with optional retry.
    func errorAlert(_ error: Binding<AppError?>, onRetry: (() -> Void)? = nil) -> some View {
        modifier(ErrorAlertModifier(error: error, onRetry: onRetry))
    }

    /// Show a non-blocking error banner that auto-dismisses.
    func errorBanner(_ error: Binding<AppError?>, autoDismissAfter: TimeInterval = 5.0) -> some View {
        modifier(ErrorBannerModifier(error: error, autoDismissAfter: autoDismissAfter))
    }
}
