# Copilot Instructions for this repository

These instructions guide GitHub Copilot Chat/Edits to produce code and docs that fit this project’s stack, architecture, and goals.

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

## Conventions and patterns

- Components: function components with explicit props types; avoid `any`. Keep files small and focused.
- Hooks: prefix with `use*`; side-effects with `useEffect`; memoize intensive computations.
- Error handling: use `react-error-boundary` already wired in `src/main.tsx`. Prefer error boundaries over try/catch in render.
- Routing: The app is currently single-entry; if adding routes, prefer client-side composition (tabs/conditional panels) unless a router is introduced.
- Imports: absolute `@/` first, then third-party, then relative. Keep deterministic order. No circular deps.
- Formatting: Prettier with Tailwind plugin; keep class order normalized.

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

## Integration cues from this repo

- WebSocket message types to handle: `live_health_update`, `historical_data_update`, `emergency_alert`.
- Existing domains: health analytics, fall risk, caregiver dashboards, notifications, gamification, usage analytics.
- Styling tokens: `--color-*`, `--radius-*`, spacing via CSS variables (see `tailwind.config.js` and `theme.json`).

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

## PowerShell & Development Tooling Integration

This project has enhanced PowerShell-VS Code-Copilot integration for optimal development experience:

### PowerShell Scripts and Utilities

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

- **Health checking**: `probe-health`, `probe-health-8788`, `probe-health-8789` for endpoint testing
- **Development servers**: `wrangler-dev-8788`, `wrangler-dev-8789` for Cloudflare Workers development
- **Enhanced workflow**: `Enhanced Task Runner` with interactive task selection
- **Context gathering**: `Get Copilot Context` for environment information
- **iOS development**: Complete iOS build, test, lint, and deployment tasks
- **Code quality**: Swift linting, formatting, performance analysis, and dependency checking

### VS Code Workspace Features

- Multi-folder workspace with `health.code-workspace` for organized development
- Folder-specific settings for iOS, documentation, and scripts
- Optimized search exclusions and file associations
- PowerShell execution policy handling and terminal configuration
