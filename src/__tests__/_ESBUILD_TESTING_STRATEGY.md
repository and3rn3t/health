# Testing Strategy for ESBuild + VitalSense

## Current Situation

- ✅ Build: ESBuild (fast, efficient)
- ❓ Tests: Vitest configured but not installed
- 🎯 Goal: Fast testing that works with ESBuild

## Recommended Approach: Vitest + ESBuild

### Why Keep Vitest?

1. **Independent of Vite**: Vitest can run without Vite
2. **ESBuild Compatible**: Vitest can use ESBuild internally for faster builds
3. **Existing Tests**: Your current tests already use Vitest syntax
4. **TypeScript Support**: Works well with your TS setup
5. **React Testing**: Good support for component testing

### Updated Configuration

```typescript
// vitest.config.ts - Updated for ESBuild compatibility
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    environment: 'jsdom', // For React component testing
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

```typescript
// vitest.setup.ts - Updated for React testing
import '@testing-library/jest-dom';

// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
  }
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};
```

### Required Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^23.0.0",
    "msw": "^2.0.0"
  }
}
```

## Alternative Options

### Option 2: Jest + ESBuild

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "esbuild-jest": "^0.5.0"
  }
}
```

### Option 3: Node.js Test Runner (Minimal)

```javascript
// For simple unit tests only
import { test, describe } from 'node:test';
import assert from 'node:assert';
```

## Recommendation: Vitest + ESBuild

**Pros:**

- ✅ Fast (uses ESBuild internally)
- ✅ Your existing tests work
- ✅ Great DX with hot reload
- ✅ TypeScript support
- ✅ React component testing
- ✅ Modern API (async/await, ES modules)

**Setup Steps:**

1. Install Vitest dependencies
2. Update vitest.config.ts for ESBuild
3. Add React testing setup
4. Your existing tests should work!

## Updated Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

The key insight: **Vitest can work with ESBuild** - you don't need to change your testing framework just because you switched from Vite to ESBuild for building.
