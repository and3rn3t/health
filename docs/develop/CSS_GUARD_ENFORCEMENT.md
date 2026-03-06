## CSS Guard Enforcement (VitalSense)

> [!NOTE]
> This document is now **deprecated** and superseded by `docs/develop/CSS_STRATEGY.md`, which contains the authoritative, unified CSS strategy + guard + contrast + baseline workflow. Keep this file as a lightweight pointer so existing links in PR history and commit messages do not break.
>
> Only update this file if the pointer requires maintenance. All substantive edits (tokens, thresholds, workflows, environment overrides) belong in `CSS_STRATEGY.md`.

### Quick Summary (Read-Only)

| Aspect | Current Policy | Where to Read More |
|--------|----------------|--------------------|
| Authored file | `src/main.css` (≤250 lines / ≤15KB, sentinel enforced) | CSS_STRATEGY.md#guardrails-and-measurement |
| Accessibility | All semantic token pairs must pass WCAG AA (normal ≥4.5, large/UI ≥3.0) | CSS_STRATEGY.md#contrast--token-enforcement |
| Automation | Pre-commit guard + CI hard gate + drift detection | CSS_STRATEGY.md#contrast--token-enforcement |
| Artifacts | `reports/contrast-report.json` + baseline for drift | CSS_STRATEGY.md#contrast--token-enforcement |
| Dark theme status | Updated Sept 2025 (primary `#2563eb`, destructive `#dc2626`, accent-foreground `#333333`) | CSS_STRATEGY.md |
| Baseline update | `CSS_UPDATE_BASELINE=true pnpm run ci:css-contrast-drift` | CSS_STRATEGY.md#baseline-workflow |
| Env overrides | Lines, bytes, delta, allow TW leakage | CSS_STRATEGY.md#contrast--token-enforcement |

### Rationale (Immutable Snapshot)

Maintaining a single, lean authored stylesheet plus automated accessibility and structural enforcement prevents accidental regression (e.g., bulk utility leakage) and keeps review signal high. Centralizing policy in one canonical document eliminates drift between overlapping guides.

### Historical Context

Originally this file enumerated guard script components (contrast audit, guard, CI wrapper, drift). That detail now lives in the unified strategy doc to reduce duplication.

---

If you reached this file from an old link, jump to the canonical source of truth:

**➡️  Open `docs/develop/CSS_STRATEGY.md` now for full details.**
