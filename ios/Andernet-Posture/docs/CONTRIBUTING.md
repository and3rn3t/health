# Contributing to Andernet Posture

Thank you for your interest in contributing! This document outlines our development process and guidelines.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Standards](#code-standards)
- [Commit Messages](#commit-messages)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Experience level
- Background
- Identity
- Location

### Expected Behavior

- **Be Respectful** — Treat all contributors with respect and professionalism
- **Be Constructive** — Provide helpful feedback and accept feedback gracefully
- **Be Collaborative** — Work together to improve the project
- **Be Patient** — Remember that everyone is learning

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. ✅ Read the [ONBOARDING.md](./ONBOARDING.md) guide
2. ✅ Set up your development environment
3. ✅ Built and ran the app successfully
4. ✅ Read the [API.md](./API.md) documentation
5. ✅ Familiarized yourself with the codebase

### Finding Work

**Good First Issues:**

Look for issues labeled:
- `good first issue` — Beginner-friendly tasks
- `help wanted` — Tasks where we need assistance
- `documentation` — Documentation improvements

**Areas of Contribution:**

- 🔬 **Clinical Analyzers** — New metrics, improved algorithms
- 🤖 **ML Models** — Training data, model improvements
- 🎨 **UI/UX** — SwiftUI views, accessibility
- 📊 **Charts & Visualizations** — Swift Charts enhancements
- 📱 **iOS Features** — HealthKit, CloudKit, Widgets
- 📚 **Documentation** — Guides, API docs, examples
- 🧪 **Testing** — Unit tests, UI tests, edge cases
- 🐛 **Bug Fixes** — Issues from the tracker

---

## Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Andernet-Posture.git
cd Andernet-Posture

# Add upstream remote
git remote add upstream https://github.com/and3rn3t/Andernet-Posture.git
```

### 2. Create a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming:**

- `feature/` — New features (e.g., `feature/rom-analyzer`)
- `fix/` — Bug fixes (e.g., `fix/crash-on-export`)
- `docs/` — Documentation (e.g., `docs/api-reference`)
- `refactor/` — Code refactoring (e.g., `refactor/analyzer-protocol`)
- `test/` — Test additions (e.g., `test/gait-analyzer`)

### 3. Make Changes

Follow our [Code Standards](#code-standards) and:

- Write clean, readable code
- Add inline documentation for public APIs
- Include unit tests for new functionality
- Update relevant documentation files

### 4. Test Your Changes

```bash
# Run unit tests
Cmd+U in Xcode

# Run on physical device (AR features)
Cmd+R with device selected

# Run SwiftLint
swiftlint

# Check for build warnings
Cmd+B
```

### 5. Commit Changes

Follow our [Commit Message Guidelines](#commit-messages):

```bash
git add .
git commit -m "feat: add shoulder ROM analyzer"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

---

## Pull Request Guidelines

### PR Checklist

Before submitting, ensure:

- [ ] Code builds without errors or warnings
- [ ] All tests pass (`Cmd+U`)
- [ ] SwiftLint passes (`swiftlint`)
- [ ] New code has inline documentation
- [ ] Public API changes documented in `API.md`
- [ ] Updated `README.md` if needed
- [ ] Tested on physical device (if AR-related)
- [ ] PR description explains what and why

### PR Template

```markdown
## Description

Brief description of changes and motivation.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

Describe how you tested your changes:
- [ ] Unit tests added/updated
- [ ] Manual testing on device
- [ ] Tested with various body positions/movements

## Screenshots (if applicable)

Include screenshots or videos showing the changes.

## Related Issues

Closes #XXX
```

### Review Process

1. **Automated Checks** — GitHub Actions runs tests and SwiftLint
2. **Code Review** — Maintainer reviews code quality, design, tests
3. **Feedback** — Address any requested changes
4. **Approval** — Once approved, PR will be merged
5. **Merge** — Squash and merge to main branch

### Review Expectations

- **Initial Review:** Within 3-5 business days
- **Follow-up:** Within 1-2 business days after updates
- **Complex PRs:** May require multiple review cycles

---

## Code Standards

### Swift Style

Follow [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/) plus:

#### Naming Conventions

```swift
// ✅ Protocols describe capability
protocol BodyTrackingService { }
protocol PostureAnalyzer { }

// ✅ Classes/Structs are nouns
struct BodyFrame { }
final class SessionRecorder { }

// ✅ Methods are verbs
func analyzePosture() { }
func startRecording() { }

// ✅ Booleans read as assertions
var isRecording: Bool
var hasCompleted: Bool

// ❌ Avoid abbreviations
// Bad:
var pos: Position
func calc() { }

// Good:
var position: Position
func calculate() { }
```

#### Actor Isolation

```swift
// ✅ UI types → @MainActor
@MainActor
@Observable
final class CaptureViewModel { }

// ✅ Background services → actor
actor DefaultBodyTrackingService { }

// ✅ Data crossing boundaries → Sendable
struct BodyFrame: Sendable { }

// ❌ Don't use @MainActor on data
struct BodyFrame: Sendable { }  // Not @MainActor
```

#### Error Handling

```swift
// ✅ Custom errors with context
enum CaptureError: LocalizedError {
    case cameraAccessDenied
    case bodyTrackingFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .cameraAccessDenied:
            return "Camera access required for body tracking"
        case .bodyTrackingFailed(let error):
            return "Body tracking failed: \(error.localizedDescription)"
        }
    }
}

// ✅ Throw descriptive errors
throw CaptureError.cameraAccessDenied

// ❌ Don't throw generic errors
throw NSError(domain: "Error", code: -1)  // Bad
```

#### Documentation

```swift
/// Analyzes posture metrics from a body frame.
///
/// This method computes clinical posture metrics including:
/// - Craniovertebral angle (CVA)
/// - Sagittal vertical axis (SVA)
/// - REBA ergonomic score
///
/// - Parameter frame: The skeleton frame to analyze
/// - Returns: Computed posture metrics with severity classifications
/// - Note: Uses clinical thresholds from Kendall et al.
/// - Warning: Requires valid head and spine joints
func analyze(frame: BodyFrame) -> PostureMetrics
```

### SwiftLint

We enforce SwiftLint rules. Run before committing:

```bash
swiftlint
```

**Auto-fix issues:**

```bash
swiftlint --fix
```

**Key Rules:**

| Rule | Limit | Rationale |
|------|-------|-----------|
| Line length | 120 chars | Readability |
| File length | 400 lines | Maintainability |
| Function body length | 40 lines | Complexity management |
| Type name | PascalCase | Consistency |
| Force unwrapping | Discouraged | Safety |
| Cyclomatic complexity | 10 | Code simplicity |

### File Organization

```swift
// 1. Import statements
import SwiftUI
import ARKit

// 2. MARK: - Type Definition
struct MyView: View {
    // 3. MARK: - Properties (grouped)
    @State private var isRecording = false
    private let service: BodyTrackingService
    
    // 4. MARK: - Initialization
    init(service: BodyTrackingService) {
        self.service = service
    }
    
    // 5. MARK: - Body
    var body: some View {
        // ...
    }
    
    // 6. MARK: - Private Methods
    private func startCapture() {
        // ...
    }
}

// 7. MARK: - Extensions (if in same file)
extension MyView {
    // Computed properties, helper methods
}

// 8. MARK: - Preview
#Preview {
    MyView(service: MockBodyTrackingService())
}
```

---

## Commit Messages

### Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `perf` | Performance improvement |
| `chore` | Build process, dependencies |

### Examples

```bash
# Feature
git commit -m "feat(analyzer): add shoulder ROM analyzer"

# Bug fix
git commit -m "fix(export): prevent crash on empty session"

# Documentation
git commit -m "docs(api): document GaitAnalyzer protocol"

# Refactor
git commit -m "refactor(services): extract protocol from body tracker"

# Test
git commit -m "test(posture): add CVA calculation tests"
```

### Multi-line Commits

For complex changes:

```bash
git commit -m "feat(ml): add fatigue prediction model

- Implement CoreMLFatigueAnalyzer
- Add training data generator
- Include fallback to rule-based analyzer
- Add unit tests for edge cases

Closes #123"
```

---

## Testing Requirements

### Unit Test Coverage

**Required for:**

- ✅ All analyzers (target: 80%+)
- ✅ Core services (target: 60%+)
- ✅ Data models with complex logic
- ✅ Utility functions

**Optional for:**

- SwiftUI views (rely on UI tests or manual testing)
- Simple data models (plain structs)

### Test Structure

We use the **Swift Testing** framework (`import Testing`, `@Test`, `#expect`) for unit tests:

```swift
@Suite("PostureAnalyzer")
struct PostureAnalyzerTests {
    let sut = DefaultPostureAnalyzer()

    @Test func cvaWhenForwardHeadReturnsSevere() {
        // Arrange — use shared fixtures
        let joints = JointFixtures.forwardLean()

        // Act
        let metrics = sut.analyze(joints: joints)

        // Assert
        #expect(metrics.craniovertebralAngle < 40)
        #expect(metrics.severities["CVA"] == .severe)
    }

    @Test @MainActor func viewModelStartsInIdleState() {
        let vm = CaptureViewModel(/* inject mocks */)
        #expect(vm.state == .idle)
    }
}
```

> **Note:** UI tests still use XCTest (`XCTestCase`, `XCTAssert*`) because XCUITest requires it.

### Test Naming

```swift
// Use descriptive method names — no underscores required with Swift Testing
@Test func analyzeWithValidFrameReturnsMetrics()
@Test func analyzeWithMissingJointsReturnsZeroValues()
@Test func startRecordingWhenAlreadyRecordingThrowsError()
```

### Shared Fixtures

Use centralized factories from `Andernet PostureTests/Fixtures/`:

```swift
// Joint positions
let joints = JointFixtures.upright()      // 22-joint standing
let stub = JointFixtures.stub()           // 18-joint minimal
let lean = JointFixtures.forwardLean()    // Head shifted forward

// Sessions
let session = SessionFixtures.standard()   // Common metrics
let empty = SessionFixtures.empty()        // Minimal session
let series = SessionFixtures.series(count: 10)

// Frames
let frame = FrameFixtures.walking()        // Mid-stride frame
let sequence = FrameFixtures.walkSequence(count: 30)
```

### Mock Data

Use mock services from `Andernet PostureTests/Mocks/MockServices.swift`:

```swift
let mockGait = MockGaitAnalyzer()
mockGait.stubbedGaitMetrics = GaitMetrics(cadence: 110, ...)

let mockRecorder = MockSessionRecorder()
// Check call counts after test actions:
#expect(mockRecorder.startRecordingCallCount == 1)
```

---

## Documentation

### Required Documentation Updates

When making changes, update:

| Change Type | Update |
|-------------|--------|
| New public API | `API.md` + inline docs |
| New feature | `README.md` features list |
| Setup changes | `ONBOARDING.md` |
| Contribution process | `CONTRIBUTING.md` |
| Breaking changes | `README.md` + migration guide |

### Inline Documentation Style

```swift
/// Brief one-line summary.
///
/// Detailed description of what this does and why.
/// Can span multiple paragraphs.
///
/// - Parameters:
///   - frame: Description of parameter
///   - options: Description of parameter
/// - Returns: What the function returns
/// - Throws: What errors can be thrown
/// - Note: Additional information
/// - Warning: Important caveats
/// - SeeAlso: `RelatedType`, `relatedMethod()`
func analyze(frame: BodyFrame, options: AnalysisOptions) throws -> Metrics
```

### README Updates

If your PR adds a major feature:

```markdown
## Features

- **Your New Feature** — Brief description
```

---

## Issue Reporting

### Bug Reports

Include:

1. **Environment**
   - Xcode version
   - iOS version
   - Device model

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Minimal reproducible example

3. **Expected Behavior**
   - What should happen

4. **Actual Behavior**
   - What actually happens

5. **Screenshots/Logs**
   - Console output
   - Screenshots if UI-related

**Example:**

```markdown
**Environment:**
- Xcode 26.0
- iOS 26.2
- iPhone 14 Pro

**Steps to Reproduce:**
1. Open app
2. Tap Capture tab
3. Grant camera permission
4. Start recording
5. Stop after 5 seconds

**Expected:**
Session should save

**Actual:**
App crashes with EXC_BAD_ACCESS

**Console Log:**
```
Fatal error: Unexpectedly found nil while unwrapping Optional value
```
```

### Feature Requests

Include:

1. **Problem Statement** — What problem does this solve?
2. **Proposed Solution** — How should it work?
3. **Alternatives Considered** — Other approaches
4. **Use Cases** — Who benefits and how?

---

## Questions?

- **Code Questions:** Open a GitHub Discussion
- **Bug Reports:** Create an Issue
- **Security Issues:** Email security@andernet.dev (do not create public issue)

---

## Recognition

Contributors will be:

- Listed in release notes
- Acknowledged in the project
- Added to CONTRIBUTORS.md (coming soon)

Thank you for contributing to Andernet Posture! 🙏

---

**Last Updated:** February 10, 2026
