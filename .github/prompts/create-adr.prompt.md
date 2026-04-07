---
description: 'Create an Architecture Decision Record (ADR) following the VitalSense template. Use when documenting significant technical decisions, dependency changes, or architectural patterns.'
---

Create an ADR document following the established VitalSense format (see `docs/architecture/adr/ADR-0001-*.md` and `ADR-0002-*.md` for reference).

## File Naming
`docs/architecture/adr/ADR-{NNNN}-{kebab-case-title}.md`

Determine the next number by checking existing ADRs in the directory.

## Required Sections

```markdown
# ADR-{NNNN}: {Title}

## Status
{Proposed | Accepted | Deprecated | Superseded by ADR-XXXX}

## Context
What is the issue? What forces are at play? Include:
- Current pain points or instability
- Technical constraints
- Team/project requirements that drove this decision

## Decision
What is the change being proposed? Be specific:
- Numbered list of concrete changes
- File paths, config changes, or code patterns affected
- Migration steps if applicable

## Alternatives Considered
For each alternative:
- **{Alternative name}**: {Why rejected — specific technical or practical reason}

## Consequences

### Positive
- Bullet list of benefits

### Negative / Trade-offs
- Bullet list of costs, maintenance burden, or limitations

## Implementation Notes
- Specific commits, scripts, or steps to execute
- Team workflow changes required
- Rollback procedure if things go wrong
```

## Guidelines
- Be specific — reference file paths, versions, and config values
- Include a rollback plan for reversible decisions
- Link to related ADRs if this supersedes or depends on another
- Keep it concise but complete — future you needs enough context
