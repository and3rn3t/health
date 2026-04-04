---
description: 'Create a new zod schema with TypeScript type for health data validation. Generates schema, type export, and usage examples following VitalSense conventions.'
agent: 'agent'
---

Create a new zod schema for the described health data type. Follow these conventions:

- Place in `src/schemas/health.ts` (or a new file in `src/schemas/` if it's a new domain)
- Export both the schema and inferred type:
  ```typescript
  export const FooSchema = z.object({ ... });
  export type Foo = z.infer<typeof FooSchema>;
  ```
- Use `PascalCaseSchema` for schema names, `PascalCase` for types
- Include `.describe()` on fields for documentation
- Add `.default()` for optional fields with sensible defaults
- For WebSocket messages, use discriminated unions with `type` field
- Never include PII in schema error messages
- Add JSDoc comment explaining the schema's purpose and where it's used
