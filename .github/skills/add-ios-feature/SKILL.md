---
name: add-ios-feature
description: "Scaffold a new iOS feature for the Andernet Posture app. Use when adding SwiftUI views, ViewModels, HealthKit data types, CoreML models, or new app screens. Includes view, model, tests, and HealthKit integration patterns."
argument-hint: "Feature name (e.g., 'sleep tracking', 'medication reminders', 'blood oxygen monitor')"
---

# Add iOS Feature

## When to Use
- Add a new screen or view to the Andernet Posture app
- Integrate a new HealthKit data type
- Add a new CoreML-powered analysis feature
- Create a new health monitoring widget

## Procedure

### 1. Create SwiftUI View
Create `ios/Andernet-Posture/Andernet Posture/Views/<FeatureName>View.swift`:

```swift
import SwiftUI

struct FeatureNameView: View {
    @StateObject private var viewModel = FeatureNameViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if viewModel.isLoading {
                    ProgressView("Loading...")
                } else if let error = viewModel.error {
                    Text(error)
                        .foregroundColor(.red)
                        .accessibilityLabel("Error: \(error)")
                } else {
                    // Feature content
                }
            }
            .navigationTitle("Feature Name")
            .task {
                await viewModel.load()
            }
        }
    }
}
```

### 2. Create ViewModel
Create `ios/Andernet-Posture/Andernet Posture/ViewModels/<FeatureName>ViewModel.swift`:

```swift
import Foundation
import Combine

@MainActor
final class FeatureNameViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Fetch data via HealthKitManager.shared or ApiClient.shared
        } catch {
            self.error = error.localizedDescription
        }
    }
}
```

### 3. Add HealthKit Integration (if needed)
In `ios/HealthKitBridge/`:
- Add new `HKQuantityTypeIdentifier` or `HKCategoryTypeIdentifier`
- Update `Info.plist` with usage description for the new data type
- Add to `HealthKitManager.shared` authorization request

```swift
// In HealthKitManager
let newType = HKQuantityType.quantityType(
    forIdentifier: .heartRate
)!
let typesToRead: Set<HKObjectType> = [newType]
```

### 4. Write Tests
Create `ios/Andernet-Posture/Andernet PostureTests/<FeatureName>Tests.swift`:

```swift
import XCTest
@testable import Andernet_Posture

final class FeatureNameTests: XCTestCase {
    var viewModel: FeatureNameViewModel!

    @MainActor
    override func setUp() {
        super.setUp()
        viewModel = FeatureNameViewModel()
    }

    @MainActor
    func testInitialState() {
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }

    @MainActor
    func testLoadSetsLoadingState() async {
        await viewModel.load()
        XCTAssertFalse(viewModel.isLoading)
    }
}
```

### 5. Wire Up Navigation
Add the new view to the app's navigation structure in the appropriate tab or navigation stack.

### 6. SwiftLint Compliance
Before committing, validate:
```bash
docker run --rm -v "$(pwd)/ios:/workspace" \
  ghcr.io/realm/swiftlint:latest swiftlint /workspace
```

Key rules:
- Lines: WARNING >120 chars, ERROR >150 chars
- No `force_unwrapping` — use `if let` / `guard let`
- Files <600 lines, class bodies <800 lines

## Checklist
- [ ] SwiftUI view with proper accessibility labels
- [ ] ViewModel with `@MainActor` and `@Published` properties
- [ ] HealthKit permissions added to `Info.plist` (if new data type)
- [ ] Unit tests for ViewModel logic
- [ ] No raw health data in logs or error messages
- [ ] SwiftLint passes (no warnings in strict mode)
- [ ] Navigation wired up in app structure
- [ ] Data validation before WebSocket bridge sync
- [ ] Dark mode appearance verified
