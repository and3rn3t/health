# IDE Configuration Sync Summary

This document outlines how all IDE configurations are synchronized across the project to maintain consistent linting, formatting, and code quality standards.

## 🎯 Unified Configuration Goals

- **Permissive Development**: Allow commits with warnings instead of blocking errors
- **Consistent Formatting**: Same indentation, line endings, and style across all tools
- **Cross-Language Support**: TypeScript/React + Swift + PowerShell + Markdown
- **Gradual Improvement**: Warnings guide developers toward better code quality

## 📁 Configuration Files Overview

### Root Level (TypeScript/React)

- **`.editorconfig`** - Universal editor settings
- **`.prettierrc`** - Code formatting rules
- **`eslint.config.js`** - Linting rules (permissive)
- **`.vscode/settings.json`** - VS Code IDE settings

### iOS Directory (Swift)

- **`ios/.swiftlint.yml`** - Swift linting rules (permissive)
- **`ios/.vscode/settings.json`** - iOS-specific VS Code settings

### Scripts

- **`scripts/lint-all.ps1`** - Unified linting across all languages
- **`.git/hooks/pre-commit-new.ps1`** - Git hook with unified approach

## 🔧 Key Synchronization Points

### Indentation & Formatting

```text
- Tab Size: 2 spaces (all languages)
- Insert Spaces: true (no tabs)
- Max Line Length: 80 (TypeScript), 120 (Swift, PowerShell)
- End of Line: LF (\n)
- Trim Trailing Whitespace: true
- Insert Final Newline: true
```

### Linting Philosophy

```text
- Unused Variables: WARNING (was error)
- TypeScript any: WARNING (was error)
- React Hooks deps: WARNING (was error)
- Force Unwrapping: WARNING (Swift)
- TODO comments: ALLOWED during development
```

### File Exclusions (consistent across tools)

```text
- .wrangler/** (Cloudflare temp files)
- dist/** and dist-worker/** (build outputs)
- node_modules/** (dependencies)
- build/** and .build/** (Swift build)
- **/*.xcuserdata (Xcode user data)
- Pods/** (iOS dependencies)
```

## 🚀 Usage Commands

### Individual Tools

```bash
# TypeScript/React linting
npm run lint              # Check only
npm run lint:fix          # Auto-fix issues

# Swift linting
npm run lint:swift        # iOS-specific

# Formatting
npm run format            # Fix all formatting
npm run format:check      # Check formatting only
```

### Unified Commands

```bash
# Run all linting together
npm run lint:all          # Check all languages
npm run lint:all:fix      # Auto-fix all languages

# Use the PowerShell script directly
pwsh scripts/lint-all.ps1           # Check all
pwsh scripts/lint-all.ps1 -Fix      # Auto-fix all
pwsh scripts/lint-all.ps1 -TSOnly   # TypeScript only
pwsh scripts/lint-all.ps1 -SwiftOnly # Swift only
```

## 🪝 Pre-commit Integration

The pre-commit hook (`pre-commit-new.ps1`) now:

1. Detects which file types changed
2. Runs appropriate linters only for changed files
3. Uses permissive rules to allow commits with warnings
4. Provides helpful fix commands when issues are found

## 📋 IDE Extension Recommendations

### VS Code Extensions (automatically suggested)

- **ESLint** - TypeScript/React linting
- **Prettier** - Code formatting
- **Swift** - Swift language support
- **PowerShell** - PowerShell script support
- **EditorConfig** - Respects .editorconfig settings

### Settings Applied Automatically

- Format on save: enabled
- Auto-fix ESLint on save: enabled
- Organize imports on save: enabled
- Consistent rulers and tab settings

## 🔄 Maintenance

To keep configurations in sync:

1. **When adding new linting rules**: Update both ESLint and SwiftLint configs
2. **When changing formatting**: Update .prettierrc, .editorconfig, and VS Code settings
3. **When adding file exclusions**: Update all relevant config files
4. **When changing severity levels**: Ensure consistency across languages

## 🎯 Benefits

- ✅ **Consistent Experience**: Same behavior across all editors and languages
- ✅ **Developer Friendly**: Warnings guide improvement without blocking work
- ✅ **Automated**: Pre-commit hooks catch issues before they reach main branch
- ✅ **Scalable**: Easy to add new languages or rules consistently
- ✅ **Flexible**: Can run individual tools or unified checks as needed

This synchronized approach ensures that whether you're working on TypeScript components, Swift iOS code, or PowerShell scripts, you'll have the same high-quality development experience with consistent linting and formatting standards.
