# Pre-commit Hook Test

This file is used to test the pre-commit hook functionality.

## Test Results

✅ Pre-commit hook is working correctly
✅ Optimized for speed (linting only, no heavy tests)
✅ Supports both iOS and TypeScript file changes
✅ Provides service status information

## Usage

The pre-commit hook will automatically run when you commit changes:

```bash
git commit -m "your message"
```

To bypass the hook (not recommended):

```bash
git commit -m "your message" --no-verify
```

To setup/reinstall hooks:

```bash
npm run hooks:setup
```
