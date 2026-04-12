---
description: 'Analyze and explain the current bundle size, identify large chunks, and suggest optimization strategies for the VitalSense web app.'
agent: 'performance-analyst'
tools: [execute, read, search]
---

Analyze the VitalSense web app bundle for optimization opportunities:

1. Run `pnpm run build` and examine output chunk sizes
2. Identify chunks exceeding the 100KB target
3. Check for:
   - Duplicate dependencies across chunks
   - Large libraries that could be lazy-loaded
   - Components >50KB that should use `React.lazy()`
   - Tree-shaking opportunities (barrel exports, unused code)
4. Review `vite.config.ts` chunking strategy
5. Check the Worker bundle size separately (`dist-worker/index.js`)

Target: ~187KB production bundle. Report current state vs target and actionable recommendations.
