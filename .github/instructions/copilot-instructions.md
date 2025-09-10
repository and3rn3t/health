# Copilot Instructions for this repository

These instructions guide GitHub Copilot Chat/Edits to produce code and docs that fit this project’s stack, arc## Example prompts that fit this repo

### React Query + Data Fetching

- "Create a React Query hook for GET /api/health-data with zod validation and a loading/error UI snippet using our Button and Alert components."
- "Build an infinite query hook for health data pagination using cursor-based pagination with nextCursor and hasMore fields."

### WebSocket Integration

- "Add a WebSocket client utility that connects to ws://localhost:3001, validates message envelopes with zod, and exposes a subscribe API."
- "Add a WebSocket client that connects to ws://localhost:3001, validates envelopes with messageEnvelopeSchema, and exposes subscribe(type, handler). Include reconnect with backoff and ping/pong."

### API Routes & Validation

- "Add a Hono POST /api/health-data route that validates input, writes to KV if bound, and returns the stored record."
- "Add a Hono POST /api/health-data route that validates against processedHealthDataSchema, writes to KV if available, and returns the stored record with a 201."

### UI Components & Styling

- "Build a compact card list to display recent health alerts. Use our tokens, Tailwind utilities, and existing ui primitives."
- "Create a VitalSense-branded health status card using VitalSenseStatusCard component with teal color scheme."
- "Build a responsive health dashboard using our card components and VitalSense color palette."

### Type Safety & Refactoring

- "Refactor src/lib/liveHealthDataSync.ts to use the zod schemas for parsing incoming WS messages and narrow types across the pipeline."
- "Add proper TypeScript types for health data processing with zod validation at component boundaries."

### iOS Development & SwiftLint Compliance

- "Create a Swift HealthKit manager singleton that follows our AppConfig.shared pattern with proper SwiftLint formatting - break long initializers into multi-line format."
- "Add iOS WebSocket client with proper ATS configuration and SwiftLint-compliant code formatting (lines under 150 characters)."
- "Refactor this Swift function to follow SwiftLint rules - break long parameter lists into multi-line format and use proper conditional formatting."
- "Create a RiskFactor initialization that follows SwiftLint compliance - each parameter on its own line with proper indentation."

### iOS Integration

- "Create a Swift HealthKit manager singleton that follows our AppConfig.shared pattern with proper error handling."
- "Add iOS WebSocket client with proper ATS configuration and background task management."

## Project context

- Purpose: Apple Health insights, fall risk monitoring, emergency alerts, caregiver dashboards (see `docs/PRD.md`).
- Frontend: React 19 (TS) + Vite, Tailwind v4, Radix UI, GitHub Spark UI utilities, TanStack Query.
- Runtime: Cloudflare Workers (Hono) for static/API, optional Node WebSocket bridge in `server/` for local/edge streaming.
- Data: Local KV via `@github/spark/hooks` on the client; Cloudflare KV/R2 bindings planned via Wrangler.

## Architecture and boundaries

- React app builds to `dist` (served by Worker assets). Worker entry is `src/worker.ts` (built to `dist-worker/index.js`).
- Worker: Hono routes for `/health`, `/api/*`, and static serving; no Node-only APIs unless `nodejs_compat` is enabled (it is, but keep code Workers-safe).
- WebSocket server (local dev): `server/websocket-server.js` (Express + ws). Message types: `connection_established`, `live_health_update`, `historical_data_update`, `emergency_alert`.

## Language, modules, and layout

- TypeScript, ESM only. Do not use `require`/CommonJS. Use `import` and named exports.
- Paths alias: import app code with `@/*` (configured in `tsconfig.json` and `vite.config.ts`).
- File locations:
  - Components: `src/components/**` (`ui/` for primitives, domains under `health/`, `gamification/`, etc.).
  - Hooks: `src/hooks/**`.
  - Libraries/utilities: `src/lib/**`.
  - Styles: `src/**/*.css` and `src/styles/theme.css`.

## UI and styling

- Use Tailwind v4 classes with semantic tokens from our CSS variables (`theme.json` + `styles/theme.css`). Prefer utility classes; avoid inline styles.
- Prefer existing UI primitives from `src/components/ui/*` and Radix-based components; compose over re-creating components.
- Icons: prefer `@phosphor-icons/react` or `lucide-react` already used in the codebase.
- Dark mode: Tailwind is configured with `darkMode: ["selector", '[data-appearance="dark"]']`. If you add theme toggles or components checking theme, prefer toggling `[data-appearance="dark"]` on `document.documentElement`. Avoid adding a separate theme mechanism.

## State, data fetching, and realtime

- Local persisted UI state: use `useKV` from `@github/spark/hooks` for lightweight, user-specific values.
- Server data: use `@tanstack/react-query` for fetches, caching, and mutations. Co-locate query keys/constants.
- Pagination: prefer cursor-based pagination for `/api/health-data` using an infinite query hook. The API returns `{ data, nextCursor?, hasMore? }`; older clients may only read `data`.
- Validation: use `zod` for runtime schema validation at boundaries (WebSocket payloads, Worker request bodies, query params).
- WebSocket client code should be resilient: auto-reconnect, heartbeat/ping support, backoff, and message-type guards with `zod`.

## Cloudflare Worker best practices

- Use Hono handlers (`(c) => { ... }`) and `serveStatic` for assets and index fallback.
- Stick to Web APIs (Request/Response, fetch, crypto). Avoid Nodejs-only APIs even with `nodejs_compat` unless strictly necessary.
- Access environment via `c.env`. Don’t hardcode secrets; use Wrangler secrets/vars.
- Keep Worker bundles small and edge-safe; avoid large Node libraries.

## Terminal and Command Execution Rules

- **NEVER run commands in active/working terminals** - Always check terminal status first with `get_terminal_output`
- If a terminal is already running a process (like dev servers), DO NOT interrupt it with new commands
- Use `run_in_terminal` with `isBackground=true` for long-running processes (servers, watchers)
- Use `run_in_terminal` with `isBackground=false` for quick commands that should complete
- Always check if required dependencies are installed before running commands
- Prefer using VS Code tasks when available over direct terminal commands

## Conventions and patterns

- Components: function components with explicit props types; avoid `any`. Keep files small and focused.
- Hooks: prefix with `use*`; side-effects with `useEffect`; memoize intensive computations.
- Error handling: use `react-error-boundary` already wired in `src/main.tsx`. Prefer error boundaries over try/catch in render.
- Routing: The app is currently single-entry; if adding routes, prefer client-side composition (tabs/conditional panels) unless a router is introduced.
- Imports: absolute `@/` first, then third-party, then relative. Keep deterministic order. No circular deps.
- Formatting: Prettier with Tailwind plugin; keep class order normalized.

## Performance Optimization Patterns

**CRITICAL**: This project has been optimized for performance with established patterns. Follow these guidelines:

### React Performance Optimization

**Memoization Patterns** (applied in `src/App.tsx`):

- Use `useMemo()` for expensive computations and derived state
- Use `useCallback()` for event handlers and functions passed as props
- Apply `React.memo()` to components with stable props
- Example: `const navigationItems = useMemo(() => [...], [dependencies])`

**Code Splitting & Lazy Loading**:

- Use `React.lazy()` for component-level code splitting
- Implement proper `Suspense` boundaries with loading fallbacks
- Target large components (>50KB) and conditional components for lazy loading
- Example: `const ComponentName = lazy(() => import('@/components/path/ComponentName'))`

**Suspense Boundaries**:

- Always wrap lazy-loaded components in `<Suspense>`
- Use descriptive loading states with branded components
- Implement error boundaries alongside Suspense for resilience
- Example: `<Suspense fallback={<LoadingFallback />}><LazyComponent /></Suspense>`

**Bundle Optimization**:

- Current production bundle: ~187KB optimized
- Target: Keep individual route chunks under 100KB
- Monitor bundle size with build reports
- Use dynamic imports for feature modules

### Performance Anti-Patterns to Avoid

- ❌ Large single-file components without lazy loading (>2000 lines)
- ❌ Unnecessary re-renders from missing memoization
- ❌ Blocking UI with synchronous expensive operations
- ❌ Large bundle sizes without code splitting

### Performance Monitoring

- Use React DevTools Profiler for performance analysis
- Monitor Core Web Vitals in production
- Check bundle analyzer reports for optimization opportunities
- Reference: `docs/OPTIMIZATION_DEPLOYMENT_COMPLETE.md`

## Authentication & Security Integration

### VitalSense Branding & Auth0 Configuration

**CRITICAL**: This project uses VitalSense branding throughout. When implementing authentication or UI components:

1. **Brand Consistency**: Always use VitalSense branding, never generic "Health App" references
2. **Color Scheme**: Primary color is `#2563eb` (blue), secondary is `#0891b2` (teal)
3. **Typography**: Use Inter font family consistently
4. **Auth0 Integration**: Custom branded login page exists in `auth0-custom-login/`

**Auth0 Branding Implementation**:

- Custom login page: `auth0-custom-login/login.html`
- Deployment script: `scripts/deploy-auth0-custom-login.ps1`
- VS Code tasks available: "Auth0: Test Custom Login Page", "Auth0: Deploy Custom Login Page"
- Configuration: `src/lib/auth0Config.ts` with dynamic environment loading

**Quick Commands for Auth0 Branding**:

```powershell
# Test custom login page
.\scripts\test-auth0-login-page.ps1

# Deploy in test mode
.\scripts\quick-deploy-auth0.ps1 -TestMode

# Deploy to production
.\scripts\quick-deploy-auth0.ps1
```

**Common Branding Issues & Solutions**:

- ❌ **Problem**: Generic health app references, inconsistent colors
- ✅ **Solution**: Use VitalSense branding system, centralized configuration
- 📝 **Reference**: See `docs/troubleshooting/VITALSENSE_BRANDING_LESSONS_LEARNED.md`

### Authentication Flow

The app uses Auth0 for authentication with custom branding:

- **Auth0 configuration**: Environment-specific settings in `wrangler.toml`
- **Custom login page**: `auth0-custom-login/login.html` with VitalSense branding
- **Device authentication**: JWT-based device authentication for iOS HealthKit integration
- **Development setup**: Use `scripts/node/auth/auth0-setup.js` for configuration management
- **Environment domains**: dev-qjdpc81dzr7xrnlu.us.auth0.com for development, production domain TBD

### Auth0 Implementation Patterns

- Always validate JWT tokens server-side in Worker routes
- Use environment-specific Auth0 client IDs and domains
- Implement proper logout flows with token cleanup
- Handle authentication errors gracefully with user-friendly messages

## Security, privacy, and compliance

- Treat health data as sensitive. Do not log raw health metrics or personally identifiable information.
- Validate and narrow inputs with `zod`. Sanitize outputs. Fail closed on parse errors.
- For alerts/emergency paths, debounce and confirm critical actions. Provide a cancel window where applicable.
- Do not introduce analytics or third-party network calls without explicit approval.

## When generating code, prefer these choices

- React + TS + Vite idioms; minimal runtime dependencies; tree-shakable libraries.
- Networking: `fetch` with typed wrappers; integrate with React Query. For Workers, use Hono `c.req`, `c.env`.
- Realtime: `WebSocket` browser API; message envelopes `{ type, data, timestamp }` with `zod` validation.
- Styling: Tailwind utilities + existing UI components; no CSS-in-JS.
- Storage: `useKV` for client persistence; Cloudflare KV/R2 via Wrangler for server-side persistence (define bindings, don’t hardcode IDs in code).

## Don’ts

- Don’t use Node APIs in Worker routes (fs, net, crypto in Node mode) unless guarded and necessary.
- Don’t bypass React Query for server-state unless it’s a one-off local computation.
- Don’t introduce CommonJS, default exports that fight tree-shaking, or unnamed functions.
- Don’t create duplicate UI primitives; extend `src/components/ui/*` instead.

## Useful scaffolds Copilot can follow

- React Query hook skeleton
  - Input: key, url, optional schema
  - Output: `{ data, error, isLoading }`
  - Error modes: network failure, schema parse failure
- Infinite query hook skeleton (cursor pagination)
  - Input: params (metric, from, to, limit)
  - Data shape: pages of `{ items, nextCursor }`
  - getNextPageParam: `page.nextCursor`
  - Merge strategy: `pages.flatMap(p => p.items)`
- WebSocket client manager
  - Inputs: url, `onMessage` map keyed by `type`
  - Behaviors: backoff reconnect, ping/pong keepalive, close on tab hidden if needed
- Hono route handler
  - Validate `c.req.json()` against `zod` schema; return `c.json(result, status)`; handle bad input with 400

## File naming

- Components: `PascalCase.tsx` in a folder that matches the domain (e.g., `src/components/health/*`).
- Hooks: `useX.ts` in `src/hooks/`.
- Libs/utils: `camelCase.ts` in `src/lib/`.
- Tests (if added): colocate as `*.test.ts(x)` using Vitest. Avoid adding test deps without approval.

## VitalSense Branding & UI Components

The app uses **VitalSense** branding throughout:

- **App name**: VitalSense (not "Health App" - always use VitalSense in user-facing text)
- **Components**: Use `src/components/ui/vitalsense-components.tsx` for branded UI components
- **Colors**: VitalSense color palette defined in `src/lib/vitalsense-colors.ts` with `getVitalSenseClasses` utility
- **Theme**: Custom Tailwind configuration in `theme.json` with VitalSense-specific CSS variables
- **Branding verification**: Use tasks like `💎 VitalSense Deploy` for branding consistency checks

### VitalSense-Specific Patterns

- Health status indicators should use VitalSense color scheme (teal, success, error variants)
- All user-facing text should reference "VitalSense" not generic "health app"
- Status cards and health metrics should use `VitalSenseStatusCard` component
- Maintain consistent icon usage with health-focused Phosphor icons

## Integration cues from this repo

- WebSocket message types to handle: `live_health_update`, `historical_data_update`, `emergency_alert`.
- Existing domains: health analytics, fall risk, caregiver dashboards, notifications, gamification, usage analytics.
- Styling tokens: `--color-*`, `--radius-*`, spacing via CSS variables (see `tailwind.config.js` and `theme.json`).
- **VitalSense branding**: Always use VitalSense in user-facing content, leverage branded components and color scheme

## Example prompts that fit this repo

- “Create a React Query hook for GET /api/health-data with zod validation and a loading/error UI snippet using our Button and Alert components.”
- “Add a WebSocket client utility that connects to ws://localhost:3001, validates message envelopes with zod, and exposes a subscribe API.”
- “Add a Hono POST /api/health-data route that validates input, writes to KV if bound, and returns the stored record.”

---

By following these rules, Copilot should generate code that compiles with Vite + TS, runs in Cloudflare Workers where expected, and matches our UI/UX and privacy standards.

## iOS Development Patterns (Swift/HealthKit)

- Always use singleton pattern for manager classes: `AppConfig.shared`, `ApiClient.shared`, `HealthKitManager.shared`
- Never access initializers directly - they should be private with static shared instances
- Handle HealthKit permissions properly with usage descriptions in Info.plist
- Design for background execution - implement proper background task management
- Use dependency injection for testability (especially for HealthKit which doesn't work in simulator)
- WebSocket connections need proper ATS configuration for development

### iOS Development Tools and Scripts

- **iOS workspace**: `ios/` contains complete Xcode project with enhanced development tooling
- **Build tools**: `ios/scripts/ios-build-simulator.ps1`, `ios/scripts/fast-build.sh` for optimized building
- **Testing**: `ios/scripts/ios-test-runner.ps1`, comprehensive test suites in `HealthKitBridgeTests/`
- **Code quality**: `ios/scripts/swift-lint-windows.ps1`, `ios/scripts/swift-format-windows.ps1`
- **Performance**: `ios/scripts/swift-performance-analyzer.ps1`, `ios/scripts/swift-dependency-analyzer.ps1`
- **Deployment**: `ios/scripts/main-app-deploy.ps1` for environment-specific deployments
- **VS Code integration**: `ios/.vscode/` with iOS-specific tasks and settings

### iOS Project Structure

- **Main app**: `ios/HealthKitBridge/` - singleton managers, WebSocket integration, HealthKit bridge
- **Core files**: `HealthKitManager.swift`, `WebSocketManager.swift`, `ApiClient.swift`, `AppConfig.swift`
- **Configuration**: Environment-specific configs in `Config.plist`, `TestConfig.plist`
- **Tests**: Unit tests in `HealthKitBridgeTests/`, UI tests in `HealthKitBridgeUITests/`

### SwiftLint Code Quality Standards

This project enforces **strict SwiftLint compliance** for maintainable, readable Swift code. **ALL Swift code must pass SwiftLint validation** before commit.

#### **Critical SwiftLint Rules**:

**Line Length Violations**:

- **ERROR**: Lines >150 characters (build-blocking)
- **WARNING**: Lines >120 characters (code quality)
- **Target**: Keep lines under 120 characters ideally

#### **Required Swift Patterns for SwiftLint Compliance**:

**1. Long Function Calls - Break into Multi-line Format**:

```swift
// ❌ BAD - SwiftLint ERROR
let payload = GaitAnalysisPayload(userId: userId, deviceId: "combined_iphone_watch", gait: watchGaitMetrics, fallRisk: fallRisk, balance: balanceAssessment, mobility: dailyMobilityTrends)

// ✅ GOOD - SwiftLint Compliant
let payload = GaitAnalysisPayload(
    userId: userId,
    deviceId: "combined_iphone_watch",
    gait: watchGaitMetrics,
    fallRisk: fallRisk,
    balance: balanceAssessment,
    mobility: dailyMobilityTrends
)
```

**2. Dictionary Declarations - One Key-Value Per Line**:

```swift
// ❌ BAD - SwiftLint ERROR
let configData: [String: Any] = ["type": "gait_config_update", "monitoringInterval": config.monitoringInterval, "sensitivityLevel": config.sensitivityLevel.rawValue, "backgroundMonitoring": config.backgroundMonitoring]

// ✅ GOOD - SwiftLint Compliant
let configData: [String: Any] = [
    "type": "gait_config_update",
    "monitoringInterval": config.monitoringInterval,
    "sensitivityLevel": config.sensitivityLevel.rawValue,
    "backgroundMonitoring": config.backgroundMonitoring
]
```

**3. Complex Conditionals - Use Multi-line If-Else**:

```swift
// ❌ BAD - SwiftLint ERROR
if score >= 85 { return .green } else if score >= 70 { return .blue } else if score >= 55 { return .yellow } else if score >= 40 { return .orange } else { return .red }

// ✅ GOOD - SwiftLint Compliant
if score >= 85 {
    return .green
} else if score >= 70 {
    return .blue
} else if score >= 55 {
    return .yellow
} else if score >= 40 {
    return .orange
} else {
    return .red
}
```

**4. Long String Concatenations - Split with + Operator**:

```swift
// ❌ BAD - SwiftLint ERROR
description: "Your resting heart rate has \(change > 0 ? "increased" : "decreased") by \(String(format: "%.1f", abs(change))) BPM this week"

// ✅ GOOD - SwiftLint Compliant
description: "Your resting heart rate has \(change > 0 ? "increased" : "decreased") " +
            "by \(String(format: "%.1f", abs(change))) BPM this week"
```

**5. HK Query Initializations - Break Parameters**:

```swift
// ❌ BAD - SwiftLint ERROR
let query = HKSampleQuery(sampleType: ascentType, predicate: nil, limit: 10, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)])

// ✅ GOOD - SwiftLint Compliant
let query = HKSampleQuery(
    sampleType: ascentType,
    predicate: nil,
    limit: 10,
    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
)
```

#### **SwiftLint Validation Workflow**:

**During Development**:

- Use Docker SwiftLint container: `docker run --rm -v "c:\git\health\ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace`
- VS Code task: "iOS: Swift Lint" for quick validation
- PowerShell script: `ios/scripts/swift-lint-windows.ps1` for Windows integration

**Pre-Commit Checklist**:

```powershell
# Quick line length check (Windows)
$files = Get-ChildItem "ios\HealthKitBridge" -Recurse -Filter "*.swift"
foreach ($file in $files) {
    $longLines = Get-Content $file.FullName | Where-Object { $_.Length -gt 150 }
    if ($longLines) { Write-Host "❌ ERROR: $($file.Name) has lines >150 chars" }
}
```

**Common SwiftLint Violations to Avoid**:

- `line_length`: Always break long lines using patterns above
- `force_unwrapping`: Use safe unwrapping (`if let`, `guard let`) instead of `!`
- `file_length`: Keep files under 600 lines, split large classes
- `type_body_length`: Keep class bodies under 800 lines
- `conditional_returns_on_newline`: Put return statements on new lines
- `multiline_arguments`: Use proper multi-line argument formatting

#### **SwiftLint Integration Commands**:

```bash
# Docker SwiftLint validation (recommended)
docker run --rm -v "$(pwd)/ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace

# VS Code tasks for SwiftLint
# - "iOS: Swift Lint" - Full linting
# - "iOS: Swift Format" - Auto-formatting
# - "iOS: Format Check (Dry Run)" - Preview formatting changes
```

**Remember**: SwiftLint compliance is **mandatory** - ERROR-level violations will block builds. Always format code properly using the patterns above to ensure smooth development workflow.

## WebSocket & Networking Resilience

- Implement message queuing and retry logic - network is unreliable
- Use exponential backoff for reconnection attempts
- Buffer messages client-side during connection issues
- Always validate message schemas with `zod` before processing
- Plan for connection cleanup to prevent port conflicts (especially on Windows)

## Build and Configuration Management

- Maintain separate Vite configs for app (`vite.config.ts`) and worker (`vite.worker.config.ts`)
- Use environment-specific configurations in `wrangler.toml`
- Set up KV/R2 bindings before deployment, not after
- Configure CORS early in development to prevent browser issues
- Plan for key rotation and data migration from the start

## Common Pitfalls to Avoid

1. **Private Initializer Errors**: Use singleton pattern with `static shared` instance
2. **Node.js in Workers**: Stick to Web APIs, avoid Node-specific modules
3. **Missing Capabilities**: Configure iOS capabilities and permissions before coding
4. **Network Reliability**: Always implement retry logic and message buffering
5. **Environment Config**: Use environment-specific secrets, never hardcode
6. **Data Retention**: Implement TTL and cleanup from the beginning
7. **Testing Strategy**: Plan for iOS physical device testing early

## Problem-Solving References

- Check `docs/troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md` for comprehensive issue catalog
- See `docs/troubleshooting/BUILD_TROUBLESHOOTING.md` for specific Swift/TypeScript build issues
- Reference `docs/project-management/LESSONS_LEARNED.md` for architectural insights
- Use `docs/README.md` as navigation hub for all documentation

### Documentation Structure

- **Architecture**: `docs/architecture/` - PRD, API specs, WebSocket protocols, system design
- **Development**: `docs/development/` - setup guides, IDE configuration, Copilot prompts, PowerShell integration
- **iOS**: `docs/ios/` - iOS development on Windows, testing guides, deployment procedures
- **Deployment**: `docs/deployment/` - Cloudflare setup, DNS configuration, infrastructure hardening
- **Getting Started**: `docs/getting-started/` - quick start guides and setup instructions
- **Security**: `docs/security/` - security baseline, retention policies, compliance guidelines
- **Troubleshooting**: `docs/troubleshooting/` - problem database, build issues, common solutions

### Key Reference Files for Development

- `docs/development/POWERSHELL_VSCODE_INTEGRATION.md` - Complete PowerShell-VS Code integration guide
- `docs/ios/IOS_DEVELOPMENT_WINDOWS.md` - iOS development setup and workflows on Windows
- `docs/architecture/API.md` - Complete API documentation and endpoints
- `docs/architecture/WEBSOCKETS.md` - WebSocket protocol and message types
- `docs/troubleshooting/PROBLEM_SOLUTIONS_DATABASE.md` - Comprehensive solutions database

## AI Assistant Optimization

- Always specify file paths and project context in prompts
- Include complete error messages when asking for help
- Request full file contents rather than snippets to avoid context loss
- Ask for security review of any code handling health data
- Reference the problem database before implementing solutions to avoid known issues

## Node.js Scripts & Cross-Platform Development Integration

This project has been enhanced with Node.js scripts for cross-platform compatibility alongside PowerShell tooling:

### Node.js Scripts and Utilities (Phase 4 Enhancement)

- **Core scripts location**: `scripts/node/` - comprehensive Node.js tooling ecosystem (v1.4.0)
- **Health probing**: `scripts/node/health/simple-probe.js`, `scripts/node/health/probe.js` - cross-platform endpoint testing
- **Development tools**: `scripts/node/dev/task-runner.js`, `scripts/node/dev/start-dev.js` - unified development workflow
- **Testing suite**: `scripts/node/test/test-all-endpoints.js`, `scripts/node/test/test-integration.js` - comprehensive testing
- **Infrastructure**: `scripts/node/infrastructure/setup-production-infrastructure.js` - production deployment automation
- **Auth0 integration**: `scripts/node/auth/auth0-setup.js` - authentication configuration management
- **Linting tools**: `scripts/node/dev/lint-runner.js` - TypeScript and Swift linting support

### PowerShell Scripts and Utilities (Legacy Support)

- **Core utilities**: `scripts/VSCodeIntegration.psm1` - shared functions for logging, HTTP requests, process management
- **Task runner**: `scripts/run-task.ps1` - unified task execution with progress tracking and background support
- **Health probe**: `scripts/probe.ps1` - enhanced endpoint testing with JSON output and verbose modes
- **Context gathering**: `scripts/get-copilot-context.ps1` - collects environment info for better Copilot interactions
- **Enhanced profile**: `scripts/PowerShell-Profile.ps1` - development-optimized PowerShell profile

### VS Code Configuration

- **Settings**: `.vscode/settings.json` includes PowerShell-specific optimizations, terminal config, and Copilot settings
- **Tasks**: `.vscode/tasks.json` has enhanced task definitions with proper presentation, timeouts, and instance limits
- **Script analysis**: `.vscode/PSScriptAnalyzerSettings.psd1` ensures consistent PowerShell code quality
- **Workspace**: `health.code-workspace` provides multi-folder workspace with optimized settings

### Development Workflow Commands

**Node.js Commands (Preferred for Cross-Platform)**:

```bash
# Development server with progress tracking
npm run start:dev

# Enhanced health checking with context
npm run probe:dev:nodejs --verbose

# Quick health probes
npm run probe:simple
npm run probe:simple:8788

# Task execution
npm run task:run

# Comprehensive testing
node scripts/node/test/test-all-endpoints.js --verbose --save=test-results.json
node scripts/node/test/test-integration.js --verbose

# Infrastructure management
node scripts/node/infrastructure/setup-production-infrastructure.js --dry-run --verbose
```

**PowerShell Commands (Windows-Specific)**:

```powershell
# Start development server with progress tracking
./scripts/run-task.ps1 -Task dev -Background

# Enhanced health checking with context
./scripts/probe.ps1 -Verbose -JSON

# Gather environment context for Copilot
./scripts/get-copilot-context.ps1 -Full -Clipboard

# Quick profile commands (when profile loaded)
dev          # Start development server
probe        # Health check endpoints
Get-Context  # Environment information
Kill-Port 8787  # Terminate processes on specific ports
```

### PowerShell Best Practices for This Project

- Always use `scripts/VSCodeIntegration.psm1` utilities for consistent logging and error handling
- Include `-Verbose` and `-JSON` parameters for debugging and automation
- Use `Write-TaskStart`, `Write-TaskComplete`, `Write-TaskError` for status reporting
- Implement proper timeout handling and background process management
- Provide structured output that Copilot can parse and understand

### Integration Features

- **Consistent logging**: Timestamped, color-coded output that VS Code and Copilot can parse
- **Background task management**: Proper process lifecycle management with cleanup
- **Context awareness**: Scripts that gather and report development environment state
- **Error resilience**: Timeout handling, retry logic, and graceful failure modes
- **VS Code optimization**: Task presentation, terminal management, and output formatting

### Troubleshooting Command Hanging Issues

- Use `-NoProfile` flag in script execution to avoid slow profile loading
- Check `.vscode/tasks.json` for proper timeout and presentation settings
- Use background task management utilities instead of blocking commands
- Monitor processes with `Get-Process` and clean up with utilities like `Kill-Port`

When working with PowerShell scripts in this project, always consider VS Code integration and Copilot context. Reference `docs/development/POWERSHELL_VSCODE_INTEGRATION.md` for comprehensive usage guide.

### Available VS Code Tasks

The project includes comprehensive VS Code tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task":

**Enhanced Node.js Workflow Tasks (Phase 4)**:

- **🚀 Node.js Development Workflow**: Main development server with pre-checks
- **⚡ Quick Health Check**: Fast development environment validation
- **🧪 Full Test Suite**: Comprehensive testing with config validation
- **🔧 Fix All Issues**: Auto-fix linting issues across TypeScript and Swift
- **🚀 Deploy (Dry Run)**: Preview deployment changes safely
- **🌐 DNS Setup (Preview)**: Preview DNS configuration changes
- **💎 VitalSense Deploy**: VitalSense branding verification and deployment
- **🧪 Comprehensive API Testing**: Phase 4 API endpoint testing with results export
- **🔍 Integration Test Suite**: Full system integration testing with health checks
- **🏗️ Production Infrastructure Setup**: Complete production deployment with safety checks
- **🔐 Auth0 Configuration Manager**: Auth0 authentication setup and management

**Core Development Tasks**:

- **Health checking**: `probe-health-nodejs`, `probe-health-8788-nodejs`, `enhanced-probe-nodejs`
- **Development servers**: `wrangler-dev-8788`, `wrangler-dev-8789` for Cloudflare Workers
- **Node.js tools**: `start-dev-nodejs`, `task-runner-nodejs`, `lint-typescript-nodejs`, `config-validate-nodejs`

**iOS Development Tasks**:

- **iOS: Swift Lint**, **iOS: Swift Format**, **iOS: Format Check (Dry Run)**
- **iOS: Build Simulator**, **iOS: Check Swift Errors**
- **iOS: Dependency Analysis**, **iOS: Performance Analysis**
- **App: Deploy Development**, **App: Deploy Production**, **App: Status Check**

**Legacy PowerShell Tasks**:

- **Enhanced Task Runner**: Interactive task selection with PowerShell backend
- **Get Copilot Context**: Environment information gathering for AI assistance

### VS Code Workspace Features

- Multi-folder workspace with `health.code-workspace` for organized development
- Folder-specific settings for iOS, documentation, and scripts
- Optimized search exclusions and file associations
- PowerShell execution policy handling and terminal configuration
