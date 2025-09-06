# PowerShell to Node.js Script Migration Plan

## 🎯 Migration Strategy

Converting 45+ PowerShell scripts to Node.js for cross-platform compatibility while maintaining all existing functionality and VS Code integration.

## 📊 Script Analysis & Categorization

### Core Infrastructure Scripts (High Priority)

1. **`probe.ps1`** (148 lines) - Health checking utility
2. **`simple-probe.ps1`** (18 lines) - Basic health probe
3. **`run-task.ps1`** (174 lines) - Task runner with progress tracking
4. **`get-copilot-context.ps1`** - Environment context gathering
5. **`simple-context.ps1`** - Basic context utility

### Development & Testing Scripts (High Priority)

6. **`start-dev.ps1`** - Development server starter
7. **`start-server.ps1`** - Server management
8. **`test-*.ps1`** (12 scripts) - Various testing utilities
9. **`lint-all.ps1`** - Linting orchestration
10. **`validate-configs.ps1`** - Configuration validation

### Deployment Scripts (Medium Priority)

11. **`deploy-*.ps1`** (8 scripts) - Deployment automation
12. **`setup-*.ps1`** (4 scripts) - Environment setup
13. **`dns-setup.ps1`** - DNS configuration

### Utility Scripts (Medium Priority)

14. **`find-*.ps1`** (2 scripts) - URL/endpoint discovery
15. **`fix-*.ps1`** (2 scripts) - Code fixing utilities
16. **`convert-*.ps1`** - Icon conversion tools
17. **`migrate-*.ps1`** - Migration utilities

### iOS Integration (Lower Priority)

18. **`ios-*.ps1`** (1 script) - iOS-specific testing
19. iOS scripts in `ios/scripts/` (handled separately)

### Core Module (Critical)

20. **`VSCodeIntegration.psm1`** (285 lines) - Core utilities module

## 🛠️ Technical Approach

### 1. Node.js Tooling Setup

```json
// Additional dependencies needed
{
  "commander": "^11.0.0", // CLI argument parsing
  "chalk": "^5.3.0", // Colored output
  "axios": "^1.5.0", // HTTP requests
  "fs-extra": "^11.1.1", // Enhanced file system
  "execa": "^8.0.1", // Process execution
  "ora": "^7.0.1", // Progress spinners
  "inquirer": "^9.2.10", // Interactive prompts
  "dotenv": "^16.3.1", // Environment variables
  "yaml": "^2.3.2", // YAML parsing
  "semver": "^7.5.4" // Version management
}
```

### 2. Directory Structure

```
scripts/
├── node/                    # New Node.js scripts
│   ├── core/               # Core utilities
│   │   ├── logger.js       # Logging utilities (replaces VSCodeIntegration.psm1)
│   │   ├── http-client.js  # HTTP utilities
│   │   ├── process-runner.js # Process management
│   │   └── config-loader.js # Configuration handling
│   ├── health/             # Health checking
│   │   ├── probe.js        # Main probe utility
│   │   └── simple-probe.js # Basic probe
│   ├── dev/                # Development utilities
│   │   ├── task-runner.js  # Task orchestration
│   │   ├── dev-server.js   # Development server
│   │   └── lint-runner.js  # Linting utilities
│   ├── test/               # Testing utilities
│   │   └── test-runner.js  # Test orchestration
│   ├── deploy/             # Deployment scripts
│   │   └── deploy-manager.js
│   └── utils/              # General utilities
│       ├── context-gatherer.js
│       ├── url-finder.js
│       └── config-validator.js
├── legacy/                 # Backup of PowerShell scripts
│   └── (all current .ps1 files)
└── package.json            # Script-specific dependencies
```

### 3. Migration Phases

#### Phase 1: Core Infrastructure (Week 1)

- Convert `VSCodeIntegration.psm1` to Node.js logger/utilities
- Convert `probe.ps1` and `simple-probe.ps1`
- Convert `run-task.ps1`
- Update VS Code tasks to use Node.js versions

#### Phase 2: Development & Testing (Week 2)

- Convert all `test-*.ps1` scripts
- Convert `lint-all.ps1`
- Convert `start-dev.ps1` and `start-server.ps1`
- Convert `validate-configs.ps1`

#### Phase 3: Deployment & Setup (Week 3)

- Convert `deploy-*.ps1` scripts
- Convert `setup-*.ps1` scripts
- Convert `dns-setup.ps1`

#### Phase 4: Utilities & Cleanup (Week 4)

- Convert remaining utility scripts
- Update package.json npm scripts
- Update documentation
- Remove PowerShell dependencies

## 🔄 Compatibility Layer

### VS Code Tasks Transition

```json
// Before (PowerShell)
{
  "label": "probe-health",
  "type": "shell",
  "command": "pwsh",
  "args": ["-NoProfile", "-File", "scripts/simple-probe.ps1", "-Port", "8787"]
}

// After (Node.js)
{
  "label": "probe-health",
  "type": "shell",
  "command": "node",
  "args": ["scripts/node/health/simple-probe.js", "--port", "8787"]
}
```

### Package.json Scripts Update

```json
// Before
"probe:dev": "pwsh -NoProfile -File scripts/probe.ps1 -HostUrl http://127.0.0.1 -Port 8787",

// After
"probe:dev": "node scripts/node/health/probe.js --host http://127.0.0.1 --port 8787"
```

## 🎯 Benefits

### ✅ Cross-Platform Compatibility

- Works on Windows, macOS, Linux
- No PowerShell dependency
- Consistent behavior across platforms

### ✅ Improved Developer Experience

- Faster startup (no PowerShell initialization)
- Better debugging with VS Code Node.js debugger
- Consistent npm ecosystem integration

### ✅ Enhanced Features

- Better JSON handling
- Improved error reporting
- Progress indicators with ora/chalk
- Interactive prompts with inquirer

### ✅ Maintenance Benefits

- Single language ecosystem (JavaScript/TypeScript)
- Better testing capabilities with Jest/Vitest
- Easier CI/CD integration
- Simplified dependency management

## 🚧 Migration Challenges & Solutions

### Challenge 1: PowerShell-Specific Features

**Problem**: PowerShell has built-in cmdlets like `Invoke-RestMethod`, `ConvertTo-Json`
**Solution**: Use axios for HTTP, native JSON handling

### Challenge 2: Windows-Specific Paths

**Problem**: PowerShell scripts use Windows-style paths
**Solution**: Use `path` module for cross-platform path handling

### Challenge 3: Process Management

**Problem**: PowerShell process handling differs from Node.js
**Solution**: Use `execa` for consistent process execution

### Challenge 4: Error Handling

**Problem**: PowerShell error patterns vs Node.js
**Solution**: Implement consistent error handling with try/catch and proper exit codes

## 📝 Implementation Example

### Before (PowerShell)

```powershell
param([string]$Port = '8787')
$url = "http://127.0.0.1:$Port/health"
try {
  $response = Invoke-RestMethod -Uri $url -TimeoutSec 5
  $response | ConvertTo-Json -Depth 5
} catch {
  Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
```

### After (Node.js)

```javascript
#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import axios from 'axios';

program.option('-p, --port <port>', 'Port number', '8787').parse();

const { port } = program.opts();
const url = `http://127.0.0.1:${port}/health`;

try {
  console.log(chalk.cyan(`Testing endpoint: ${url}`));
  const response = await axios.get(url, { timeout: 5000 });
  console.log(JSON.stringify(response.data, null, 2));
  console.log(chalk.green('Health check passed'));
} catch (error) {
  console.log(chalk.red(`Health check failed: ${error.message}`));
  process.exit(1);
}
```

## 🎯 Success Metrics

- ✅ All scripts work on Windows, macOS, Linux
- ✅ VS Code tasks run without PowerShell dependency
- ✅ npm scripts work consistently
- ✅ Performance equal or better than PowerShell versions
- ✅ All existing functionality preserved
- ✅ Backward compatibility during transition period

---

**Ready to proceed with Phase 1?**
