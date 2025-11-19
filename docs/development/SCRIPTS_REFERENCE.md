# VitalSense Scripts Reference

Complete reference guide for all npm scripts in the VitalSense project, organized by category.

**Last Updated:** January 2025  
**Total Scripts:** ~180

## 📋 Quick Reference

### Most Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run unit tests
npm run lint             # Lint source code
npm run format           # Format code with Prettier

# Deployment
npm run deploy:dev       # Deploy to development
npm run deploy:prod      # Deploy to production
```

---

## 🚀 Development

### Build Commands

| Script | Description |
|--------|-------------|
| `dev` | Start development server (ESBuild) |
| `build` | Build React app with Vite |
| `build:app` | Type check + build React app |
| `build:worker` | Build Cloudflare Worker |
| `build:worker:advanced` | Build advanced WebSocket worker |
| `preview` | Preview production build |
| `optimize` | Optimize build with Vite |

### Code Quality

| Script | Description |
|--------|-------------|
| `lint` | Lint source code (ESLint) |
| `lint:fix` | Lint and auto-fix issues |
| `lint:strict` | Lint with zero warnings allowed |
| `lint:tooling` | Lint scripts and server code |
| `lint:configs` | Lint configuration files |
| `lint:all` | Lint TypeScript + Swift |
| `lint:all:fix` | Lint all and auto-fix |
| `lint:swift` | Lint Swift code (iOS) |
| `format` | Format code with Prettier |
| `format:check` | Check code formatting |

---

## 🧪 Testing

### Unit Tests

| Script | Description |
|--------|-------------|
| `test` | Run unit tests (Vitest) |
| `test:ui` | Run tests with UI |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage |
| `test:geospatial` | Run geospatial tests |
| `test:phase5` | Run Phase 5 feature tests |
| `test:observability` | Run observability tests |

### Integration & E2E

| Script | Description |
|--------|-------------|
| `test:e2e` | Run end-to-end tests |
| `test:e2e:ui` | Run E2E tests with UI |
| `test:api-endpoints` | Test API endpoints |
| `test:dev` | Run tests in dev mode |
| `test:quick` | Quick test suite |
| `test:full` | Full test suite |
| `test:api` | API integration tests |
| `test:prod` | Production test suite |

### Specialized Tests

| Script | Description |
|--------|-------------|
| `test:large-arrays` | Test large array handling |

---

## 🚢 Deployment

### Cloudflare Workers

| Script | Description |
|--------|-------------|
| `deploy:dev` | Deploy to development environment |
| `deploy:prod` | Deploy to production environment |
| `deploy:advanced-websocket:dev` | Deploy advanced WebSocket (dev) |
| `deploy:advanced-websocket:prod` | Deploy advanced WebSocket (prod) |

### Platform Deployment

| Script | Description |
|--------|-------------|
| `platform:deploy` | Deploy platform |
| `platform:phase1` | Phase 1 deployment |
| `platform:phase2` | Phase 2 deployment |
| `platform:phase3` | Phase 3 deployment |
| `platform:verify` | Verify deployment |
| `deploy:platform:dry` | Dry run deployment |

### DNS & Infrastructure

| Script | Description |
|--------|-------------|
| `dns:setup` | Setup DNS configuration |
| `dns:phase1` | DNS Phase 1 |
| `dns:phase2` | DNS Phase 2 |
| `dns:phase3` | DNS Phase 3 |
| `dns:cleanup` | Cleanup DNS config |
| `dns:dry` | DNS dry run |

### VitalSense Deployment

| Script | Description |
|--------|-------------|
| `deploy:vitalsense` | Deploy VitalSense |
| `deploy:vitalsense:full` | Full VitalSense deployment |
| `deploy:vitalsense:dev` | Dev server deployment |

### Production Infrastructure

| Script | Description |
|--------|-------------|
| `production:setup` | Setup production infrastructure |
| `production:deploy` | Deploy to production |
| `production:secrets` | Setup production secrets |
| `production:observability` | Enable observability |
| `production:dns` | Production DNS setup |
| `production:waf` | Setup WAF |
| `production:verify` | Verify production setup |

### Cloudflare Utilities

| Script | Description |
|--------|-------------|
| `cf:dev` | Cloudflare Workers dev mode |
| `cf:tail` | Tail Cloudflare Workers logs |
| `cf:kv` | Cloudflare KV operations |
| `cf:purge:all` | Purge all Cloudflare cache |
| `cf:purge:urls` | Purge specific URLs |

---

## 📱 iOS Development

### Setup & Configuration

| Script | Description |
|--------|-------------|
| `ios:setup` | Setup iOS development environment |
| `ios:lint` | Lint Swift code |
| `ios:format` | Format Swift code |
| `ios:check` | Check Swift errors |

### Build & Test

| Script | Description |
|--------|-------------|
| `ios:build-sim` | Build iOS simulator |
| `ios:test` | Run iOS tests |
| `ios:test:unit` | Run unit tests |
| `ios:test:ui` | Run UI tests |
| `ios:test:performance` | Run performance tests |
| `ios:test:coverage` | Run tests with coverage |
| `ios:test:device` | Run tests on device |
| `ios:test:verbose` | Verbose test output |
| `ios:test:specific` | Run specific test case |
| `ios:test:env-setup` | Setup test environment |
| `ios:test:env-check` | Check test environment |
| `ios:test:clean` | Clean test data |

### Analysis & Optimization

| Script | Description |
|--------|-------------|
| `ios:deps` | Analyze Swift dependencies |
| `ios:deps-graph` | Show dependency graph |
| `ios:perf` | Performance analysis |
| `ios:perf-detail` | Detailed performance analysis |

### Workflow

| Script | Description |
|--------|-------------|
| `ios:quick` | Quick iOS check |
| `ios:full` | Full iOS check |
| `ios:fix` | Fix iOS issues |
| `ios:ready` | Prepare for build |

### App Deployment

| Script | Description |
|--------|-------------|
| `app:deploy` | Deploy iOS app |
| `app:deploy:dev` | Deploy to development |
| `app:deploy:staging` | Deploy to staging |
| `app:deploy:prod` | Deploy to production |
| `app:status` | Check app status |
| `app:sync` | Sync iOS configuration |
| `app:quick` | Quick app check |

---

## 🔍 Analysis & Monitoring

### Bundle Analysis

| Script | Description |
|--------|-------------|
| `analyze:bundle` | Analyze bundle size |
| `analyze:bundle:save` | Analyze and save report |
| `analyze:bundle:verbose` | Verbose bundle analysis |
| `check:bundle` | Quick bundle check |

### Performance

| Script | Description |
|--------|-------------|
| `monitor:performance` | Monitor performance |
| `monitor:performance:continuous` | Continuous monitoring |
| `monitor:performance:history` | Performance history |
| `perf:sample` | Performance sampling |

### CSS Analysis

| Script | Description |
|--------|-------------|
| `optimize:css` | Optimize CSS |
| `audit:css:duplicates` | Audit duplicate CSS |
| `audit:css:contrast` | Audit CSS contrast |
| `guard:css` | CSS guard check |

### Build Optimization

| Script | Description |
|--------|-------------|
| `optimize:build` | Optimize build |
| `optimize:test` | Test optimizations |
| `build:optimized` | Build optimized version |
| `build:fast` | Fast build |

---

## 🛠️ CI & Quality Gates

### CI Scripts

| Script | Description |
|--------|-------------|
| `ci:bundle-threshold` | Check bundle size threshold |
| `ci:smoke` | Smoke tests |
| `ci:privacy` | Privacy log guard |
| `ci:bundle-drift` | Check bundle drift |
| `ci:secrets` | Secret rotation check |
| `ci:ws-schema` | WebSocket schema drift |
| `ci:css-guard` | CSS guard check |
| `ci:catalog` | Catalog validation |
| `ci:localization` | iOS localization audit |
| `ci:perf-slo` | Performance SLO probe |
| `ci:sonar-security` | SonarQube security analysis |
| `ci:sonar-duplication` | SonarQube duplication analysis |
| `ci:gait-drift` | Gait config drift check |
| `ci:gait-verify` | Gait config verification |
| `ci:fallrisk-drift` | Fall risk config drift |
| `ci:fallrisk-verify` | Fall risk config verification |
| `ci:analytics-verify` | Analytics verification |

### Pre-Release

| Script | Description |
|--------|-------------|
| `pre:release:gate` | Pre-release quality gate |

---

## 🔧 Development Tools

### Setup & Configuration

| Script | Description |
|--------|-------------|
| `setup:project` | Setup project |
| `setup:git-hooks` | Setup git hooks |
| `hooks:setup` | Alias for setup:git-hooks |
| `onboarding` | Onboarding wizard |
| `config:validate` | Validate configuration |
| `config:fix` | Fix configuration issues |

### Debugging

| Script | Description |
|--------|-------------|
| `debug:device-auth` | Debug device authentication |
| `start:dev` | Start development environment |
| `start:worker` | Start worker locally |

### Testing & Probes

| Script | Description |
|--------|-------------|
| `probe:dev` | Probe development server |
| `probe:dev:nodejs` | Probe Node.js server |
| `probe:simple` | Simple probe |
| `probe:simple:8788` | Probe port 8788 |
| `app:status:node` | Check app status |
| `app:status:5000` | Check status on port 5000 |
| `app:status:8789` | Check status on port 8789 |

---

## 🎨 Branding & Assets

| Script | Description |
|--------|-------------|
| `verify:branding` | Verify branding |
| `verify:branding:node` | Verify branding (Node) |
| `verify:branding:local` | Verify local branding |
| `verify:rebrand` | Verify rebrand |
| `branding:audit` | Branding audit |
| `branding:audit:local` | Local branding audit |
| `fix:circular-deps` | Fix circular dependencies |
| `optimize:icons` | Optimize icons |
| `convert:phosphor-to-lucide` | Convert icon library |

---

## 📊 Data & Analytics

| Script | Description |
|--------|-------------|
| `gait:sync` | Sync gait configuration |
| `fallrisk:sync` | Sync fall risk configuration |
| `analytics:sync` | Sync analytics configurations |
| `dump:mismatch` | Dump version mismatches |
| `catalog:api` | Catalog API operations |

---

## 📦 PWA & Assets

| Script | Description |
|--------|-------------|
| `pwa:validate` | Validate PWA |
| `pwa:icons` | Generate PWA icons |

---

## 🔄 Data Ingestion

| Script | Description |
|--------|-------------|
| `ingest:file` | Ingest file |
| `ingest:validate:item` | Validate STAC item |
| `ingest:validate:collection` | Validate STAC collection |

---

## 📝 Utilities

| Script | Description |
|--------|-------------|
| `wrangler` | Wrangler CLI |
| `kill` | Kill process on port 5000 |
| `task:run` | Run task |
| `audit:localization:ios` | Audit iOS localization |

---

## 🗂️ Script Organization

Scripts are organized by:
- **Category** (development, testing, deployment, etc.)
- **Platform** (web, iOS, infrastructure)
- **Purpose** (build, test, deploy, analyze)

For detailed information about specific scripts, see:
- [`scripts/README.md`](../../scripts/README.md) - Scripts directory overview
- Individual script files in `scripts/` directory

---

## 🔍 Finding Scripts

### By Task

- **Build**: `build*`, `dev`, `preview`
- **Test**: `test*`
- **Deploy**: `deploy*`, `platform:*`, `dns:*`
- **Lint**: `lint*`, `format*`
- **Analyze**: `analyze*`, `monitor*`, `audit*`
- **iOS**: `ios:*`, `app:*`
- **CI**: `ci:*`

### By Platform

- **Web/React**: Most scripts (default)
- **iOS**: `ios:*`, `app:*`
- **Infrastructure**: `platform:*`, `dns:*`, `production:*`

---

**Note:** This reference is generated from `package.json`. For the most up-to-date list, run `npm run` to see all available scripts.
