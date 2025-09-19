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

## How to test

Steps to validate.

## Checklist

Mandatory gates (mark ALL that apply):

- [ ] Builds locally (`npm run build`)
- [ ] Type checks (`npx tsc --noEmit`)
- [ ] Lint passes / no new warnings (`npm run lint`)
- [ ] Unit tests pass (`npm test`)
- [ ] Bundle thresholds pass (`npm run ci:bundle-threshold`)
- [ ] Bundle drift acceptable (`npm run ci:bundle-drift`)
- [ ] Branding audit passes (`npm run branding:audit:local` or prod)
- [ ] Privacy guard clean (`npm run ci:privacy`)
- [ ] WebSocket resilience test (if live features touched)
- [ ] Secret rotation policy satisfied (no >90d secrets)
- [ ] WebSocket schema drift check passes (`npm run ci:ws-schema` if realtime touched)
- [ ] Performance SLO probe reviewed (`npm run ci:perf-slo` if bundle changes)
- [ ] Docs updated (API / WS / security / deployment) if applicable
- [ ] No sensitive data or raw health metrics logged

Optional (but encouraged):

- [ ] Performance snapshot captured (bundle analyzer)
- [ ] Added/updated tests for new schemas
