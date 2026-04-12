# Pull Request

## Summary

Describe the change and the problem it solves.

## Screenshots

If UI changes, include before/after.

## Type of change

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] CI / Tooling

## How to test

Steps to validate.

## Checklist

Mandatory gates (mark ALL that apply):

- [ ] Builds locally (`pnpm build`)
- [ ] Type checks (`pnpm type-check`)
- [ ] Lint passes / no new warnings (`pnpm lint`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] Full validation (`pnpm validate`)
- [ ] No PII or raw health data in logs
- [ ] No sensitive data or raw health metrics logged

Data & API:

- [ ] Zod validation at all new data boundaries
- [ ] Schema changes are backward-compatible (or migration provided)
- [ ] API changes reflected in OpenAPI spec (`pnpm check:openapi`)

Cross-platform:

- [ ] iOS config sync needed? (`pnpm gait:sync` / `pnpm fallrisk:sync`)
- [ ] WebSocket message changes coordinated with iOS bridge

Optional (but encouraged):

- [ ] Bundle size checked (`pnpm check:bundle`)
- [ ] Added/updated tests for new schemas
- [ ] Visual regression screenshots updated if UI changed
- [ ] Docs updated (API / WS / security / deployment) if applicable
- [ ] Accessibility tested (keyboard nav, screen reader)
