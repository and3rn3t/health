<!-- 40b1ae1b-733d-4daa-a005-47caabdd72fb 919b409a-f019-456f-b698-eae350763716 -->
# Health App B2C Growth Roadmap (12 months, quarterly)

## Product Vision

Help people build sustainable healthy routines by making tracking effortless, personalized, and motivating. Focus on fast time‑to‑value, daily habit formation, and viral growth loops.

## Strategy Themes

- Activation: shorten time to first value (TTFV) and first successful track.
- Habit formation: reminders, streaks, and lightweight journaling.
- Personalization: tailored goals, content, and nudges.
- Virality: referrals and shareable progress.
- Analytics-first: instrumentation + rapid A/B testing.

## Timeline Overview

- Q1 (Months 1–3): Activation foundation + analytics + reminders. Ship onboarding revamp, core habit tracking polish, push/email infra, baseline analytics and A/B testing.
- Q2 (Months 4–6): Habit depth + content. Ship streaks, challenges, content library, basic personalization, and referrals v1.
- Q3 (Months 7–9): Social + search + performance. Ship social feed (opt‑in), discoverability/search, offline mode v1, performance and accessibility.
- Q4 (Months 10–12): Personalization v2 + retention loops. Ship recommendations, weekly insights, premium experiments, localization v1.

---

## Q1: Activation and Analytics Foundations

### Features

1) Onboarding Revamp (progressive profiling)

- Key flows: sign‑up, goal selection, baseline habits, reminder preference.
- Hook into: existing auth, profile storage, habit templates, notification settings.
- Acceptance: <7 min complete time, >70% reach first track.

2) Core Habit Tracking Polish

- Faster add/edit flows, templates, quick actions, calendar view fixes.
- Hook into: current habit model, sync, UI components.
- Acceptance: p50 track flow <7s, error rate <0.5%.

3) Reminders & Push/Email Infrastructure

- Notification scheduling, quiet hours, timezone support, batched reminders.
- Hook into: user preferences, job scheduler, push/email provider.
- Acceptance: delivery success >98%, opt‑out honored, latency <30s.

4) Analytics & A/B Testing Baseline

- Event schema, client SDK wrapper, server pipelines, experiment flagging.
- Hook into: all major screens, auth, tracking, notifications.
- Acceptance: 95% event fidelity, dashboard for TTFV, D1/D7.

### Experiments

- A/B: onboarding steps; reminder default opt‑in text; quick‑add placement.

### Success Metrics

- Activation rate +15%, TTFV < 1 day, D1 retention +8pp, WAU +20%.

### Dependencies/Risks

- Push/email vendor integration; timezones; data governance (PII/event schema).

---

## Q2: Habit Depth, Content, and Virality

### Features

1) Streaks, Badges, and Gentle Recovery

- Visual streaks, milestone badges, catch‑up logic to reduce churn.
- Hook into: habit logs, profile, notifications.

2) Themed Challenges (solo + small groups)

- 7/14/30‑day templates, progress tracking, challenge reminders.
- Hook into: habit engine, notifications, share.

3) Content Library v1

- Short articles/tips mapped to goals; in‑app surfaces and reminder links.
- Hook into: CMS or static content service, search index.

4) Personalization v1

- Basic rules: suggest 2–3 habits and content based on onboarding answers.
- Hook into: recommendations service, event data, content tags.

5) Referrals v1

- Referral codes/links, attribution, lightweight reward.
- Hook into: auth, deep links, attribution store.

### Experiments

- A/B: streak visibility; challenge lengths; referral reward types.

### Success Metrics

- D7 +10pp, MAU +25%, referral K‑factor 0.15+, challenge join rate >20% of WAU.

### Dependencies/Risks

- Abuse prevention on referrals; content quality; challenge moderation.

---

## Q3: Social, Discoverability, and Reliability

### Features

1) Social Feed (opt‑in, privacy‑respecting)

- Share milestones, challenges updates; reactions only (no comments v1).
- Hook into: profiles, content moderation, push.

2) Global Search and Discoverability

- Search habits, content, challenges; typeahead; fast empty‑state creation.
- Hook into: search indexer, analytics for query success.

3) Offline Mode v1

- Local queueing for logs and reminders; conflict resolution on sync.
- Hook into: local storage, sync layer, event buffering.

4) Performance & Accessibility Pass

- P95 app start <2s mobile; WCAG AA for key flows.
- Hook into: build pipeline, design system tokens.

### Experiments

- A/B: feed presence for eligible users; search placement.

### Success Metrics

- Session length +10%, content CTR +20%, crash‑free sessions >99.5%.

### Dependencies/Risks

- Safety/privacy in social; search relevance; offline edge cases.

---

## Q4: Personalization v2, Insights, and Monetization Experiments

### Features

1) Recommendations v2

- Collaborative + content‑based blend; explore/exploit nudges.
- Hook into: event warehouse, feature store, model serving.

2) Weekly Insights & Reports

- Habit trends, adherence, best time‑of‑day, gentle nudges.
- Hook into: analytics pipelines, email/push.

3) Premium Experiments (soft paywall)

- Premium challenge types, advanced insights; metered access.
- Hook into: paywall SDK, subscriptions backend.

4) Localization v1

- Top 1–2 languages, RTL support where needed.

### Experiments

- Paywall placement/price tests; personalized nudge timing.

### Success Metrics

- D30 +8pp, conversion to premium test cohort 2–5%, churn −10%.

### Dependencies/Risks

- Subscription infra; GDPR/CCPA/i18n QA; model performance.

---

## Cross‑Cutting Engineering/Design Tracks

- Design system: tokens, components for speed and accessibility.
- Event taxonomy & governance: versioning, PII handling, retention.
- QA automation: smoke tests for onboarding, tracking, reminders, referrals.
- Observability: logs, traces, alerting for push, jobs, sync, payments.
- Security & privacy: encryption at rest/in transit, DSRs, audit logging.

## Key User Journeys to Instrument

- Sign‑up → goal selection → first track → first reminder → D1/D7 use.
- Create/join challenge → share → invite accept.
- Referral share → install/open → attribution.

## High‑Level Tech Hooks (where to integrate)

- Client: onboarding screens, habit edit/track screens, notifications settings, challenge and content surfaces, feed tab, search bar, insights view.
- Backend: auth/profile, habit engine, scheduler, push/email provider, content service, recommendations, attribution, payments (Q4).
- Data: event collector, ETL to warehouse, experimentation service, feature store (Q4), dashboards.

## Reporting & Cadence

- Quarterly planning; bi‑weekly releases; weekly experiment reviews.
- KPIs per quarter; post‑release readouts with decision memos.

## Risks & Mitigations

- Scope creep: strict acceptance criteria and weekly scope reviews.
- Data quality: schema validation and contract tests.
- Vendor risk: dual‑provider abstraction for push/payments when feasible.
- Privacy: privacy reviews before social/referrals/localization.

### To-dos

- [ ] Revamp onboarding with progressive profiling and goal selection
- [ ] Implement reminders and push/email infrastructure
- [ ] Ship baseline analytics SDK, schema, and A/B testing
- [ ] Polish habit tracking flows and calendar views
- [ ] Add streaks, badges, and recovery logic
- [ ] Launch themed challenges with tracking and reminders
- [ ] Publish content library v1 and surface in app
- [ ] Implement personalization v1 (rules-based suggestions)
- [ ] Release referrals v1 with attribution and rewards
- [ ] Ship opt‑in social feed with reactions
- [ ] Add global search and discoverability improvements
- [ ] Implement offline mode v1 with sync queue
- [ ] Conduct performance and accessibility pass
- [ ] Upgrade to recommendations v2 with model serving
- [ ] Launch weekly insights and reports
- [ ] Run premium feature experiments and paywall
- [ ] Localize app to top languages (v1)