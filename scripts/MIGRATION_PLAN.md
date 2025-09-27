# Scripts Folder Migration and Organization Plan

## Current State Analysis

The scripts folder currently contains:

- **65+ PowerShell scripts** (legacy, Windows-specific)
- **Well-organized Node.js scripts** in `scripts/node/` (cross-platform, modern)
- **Duplicate functionality** between PowerShell and Node.js versions
- **Mixed usage** in VS Code tasks and package.json scripts

## Migration Strategy

### Phase 1: Identify and Preserve Critical Scripts

**Status: ✅ Complete**

**Keep These PowerShell Scripts (Windows-specific functionality):**

- `VSCodeIntegration.psm1` - Core utilities module
- `setup-vscode-workspace.ps1` - VS Code workspace configuration
- `PowerShell-Profile.ps1` - Development profile
- `terminal-init.ps1` - Terminal initialization

**Keep These Node.js Scripts (Already Modern):**

- All scripts in `scripts/node/` - Already well-organized and comprehensive
- `build*.js` scripts in root - Build tooling
- `performance-monitor.js` - Performance monitoring

### Phase 2: Archive Obsolete Scripts

**Status: 🔄 In Progress**

**Scripts to Archive (Replaced by Node.js versions):**

- `probe.ps1` → `scripts/node/health/probe.js`
- `simple-probe.ps1` → `scripts/node/health/simple-probe.js`
- `test-*.ps1` → `scripts/node/test/test-*.js`
- `verify-*.ps1` → `scripts/node/branding/verify-*.js`
- `deploy-*.ps1` → `scripts/node/deploy/*.js`
- `find-*.ps1` → `scripts/node/branding/*.js`

### Phase 3: Update References

**Status: 🔄 In Progress**

**Update These Configuration Files:**

- `.vscode/tasks.json` - Ensure all tasks use Node.js scripts where available
- `package.json` - Remove PowerShell alternatives, keep Node.js versions
- Documentation references

### Phase 4: Create Legacy Archive

**Status: 🔄 In Progress**

**Structure:**

```
scripts/
├── node/                    # Modern Node.js scripts (keep)
├── build*.js               # Build tooling (keep)
├── performance-monitor.js  # Performance monitoring (keep)
├── VSCodeIntegration.psm1  # PowerShell utilities (keep)
├── setup-vscode-workspace.ps1  # VS Code setup (keep)
├── PowerShell-Profile.ps1  # Dev profile (keep)
├── terminal-init.ps1       # Terminal init (keep)
├── _archive/               # Legacy scripts (new)
│   ├── README.md           # Migration notes
│   └── legacy-powershell/  # Archived PowerShell scripts
└── README.md               # Updated documentation
```

## Implementation Benefits

1. **Cross-platform compatibility** - Node.js scripts work on Windows, macOS, Linux
2. **Reduced maintenance** - Single codebase instead of dual PowerShell/Node.js
3. **Better integration** - Consistent with modern tooling (VS Code, CI/CD)
4. **Improved performance** - Node.js scripts are faster and more reliable
5. **Enhanced functionality** - Node.js versions have more features and better error handling

## Migration Checklist

- [x] Analyze current script usage
- [x] Identify critical vs obsolete scripts
- [ ] Create archive structure
- [ ] Move obsolete scripts to archive
- [ ] Update VS Code tasks
- [ ] Update package.json scripts
- [ ] Update documentation
- [ ] Test all functionality
- [ ] Create migration summary

## Post-Migration Cleanup

1. Remove PowerShell alternatives from package.json
2. Update documentation to reference Node.js scripts
3. Ensure all VS Code tasks use Node.js versions
4. Update README with new script organization
5. Create quick reference guide for common tasks
