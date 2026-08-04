---
title: Orbit News Network Platform Roadmap
status: draft
owner: Orbit Systems AI
last_updated: 2026-08-04
---

# Orbit News Network Platform Roadmap

## Purpose

This roadmap tracks the work required to make Orbit News Network (ONN) a dependable, multi-application content intelligence and distribution platform.

ONN receives external news metadata from approved RSS, Atom, and future provider connectors. It also receives first-party OSai content from authorized applications. ONN validates, vets, moderates, classifies, deduplicates, scores, and distributes eligible content. Consumer applications retrieve curated feeds through authenticated server-to-server APIs.

ONN is infrastructure, not a consumer news reader. Career Pivot is the first consumer and pilot integration, but all contracts, taxonomy, policies, and services must remain reusable across Orbit applications.

## Status legend

- `[ ]` Planned or incomplete
- `[~]` Foundation exists; production work remains
- `[x]` Complete and verified

Completion must be supported by implementation, automated tests where appropriate, production verification, and updated documentation. A checked item is not complete merely because it has been designed.

---

## Part I — Seven-stage ONN operating model

These seven stages describe the platform's intended end-to-end operation.

### 1. Receive external news

**Status:** `[~]` RSS/Atom ingestion exists; production source onboarding and additional connectors remain.

ONN collects publisher-provided content metadata through reviewed connectors.

- [~] Support RSS and Atom feeds.
- [ ] Support approved publisher APIs when justified.
- [ ] Maintain source approval, terms, attribution, and re-review records.
- [ ] Enforce network safety, response-size limits, timeouts, redirect validation, and permitted content types.
- [ ] Store normalized metadata and source-provided excerpts, not complete copyrighted article bodies.
- [ ] Never scrape publisher article pages.

**Completion criteria:** Every active external source is approved, auditable, safely collected, correctly attributed, and monitored.

### 2. Receive first-party OSai content

**Status:** `[x]` Verified with separate OSai and Career Pivot publishers on August 4, 2026.

Authorized Orbit applications submit their own articles, guidance, announcements, community stories, research summaries, and supported media through ONN's publishing API.

- [x] Authenticate the originating project with scoped server credentials.
- [x] Validate publications, contributors, topics, citations, and distribution levels.
- [x] Make retries idempotent.
- [~] Finalize the submission contract and generated client types. Typed request/response contracts and a server client now exist; packaging and cross-repository consumption remain.
- [x] Verify the complete submission lifecycle with real OSai and Career Pivot originating applications.

**Completion criteria:** Multiple applications can publish through configuration and stable API contracts without application-specific ONN code.

**Verification note:** OSai and Career Pivot each use their own server-only `content:submit` credential and project-owned publication. Controlled submissions returned `201`, identical retries returned the same submission IDs with `200`, and a Career Pivot credential was denied access to the OSai publication. Both application adapters compile against ONN's neutral request and response contract; ONN contains no application-specific route logic.

### 3. Vet and moderate content

**Status:** `[x]` Source vetting and first-party moderation controls verified on August 4, 2026.

External news and first-party OSai content require related but distinct controls.

- [x] Vet external sources for legitimacy, official feed ownership, editorial quality, terms, and attribution.
- [x] Validate each external item for source status, required metadata, freshness, duplication, URL safety, and restrictions.
- [x] Validate first-party content for authorization, safe markup, completeness, citations, duplication, and distribution permissions.
- [x] Support draft, submitted, under-review, approved, published, rejected, paused, and archived states as applicable.
- [x] Establish operator queues, decision records, escalation rules, and policy review intervals.

**Completion criteria:** Only approved, policy-compliant, traceable content can enter a destination feed.

**Verification note:** The operator queue includes submitted and under-review content, age-based priority, evidence, explicit decision reasons, rejection/escalation notes, and durable decision/status history. Direct submission-to-approval is prohibited and publication requires the latest moderation decision to be approved. The OSai demonstration completed the full submitted → under review → approved → published path; the Career Pivot demonstration completed submitted → under review → rejected. No delivery exists for unpublished content. External-source activation requires recorded official-feed confirmation, terms review, attribution requirements, reviewer, and a six-month policy re-review date.

### 4. Classify content

**Status:** `[x]` Shared hierarchical taxonomy and compatibility layer verified on August 4, 2026.

ONN needs a shared hierarchy that can classify both external news and first-party OSai content:

```text
Category
└── Subcategory
    └── Topic
        └── Optional tags or entities
```

- [x] Define stable categories, subcategories, topics, and relationships.
- [x] Preserve current topic compatibility during migration.
- [x] Add project permissions and default weights at appropriate taxonomy levels.
- [x] Record confidence and assignment method for every classification.
- [x] Support source mappings, deterministic rules, operator assignments, and future approved classifiers.
- [x] Add taxonomy governance, aliases, deprecation, and migration procedures.

**Completion criteria:** All eligible content uses a shared, explainable taxonomy that is independent of any one consumer application.

**Verification note:** Five categories and eight subcategories organize all fifteen existing topics without changing their slugs. Category requests expand only into project-authorized descendant topics. The taxonomy API returns project-specific hierarchy and compatibility data; relevant-content and relevant-news responses expose category, subcategory, assignment source, and confidence. Category, legacy-topic, and alias requests were verified against OSai first-party content and NASA external news. Operator correction was verified with a manual Career Pivot assignment.

### 5. Curate and rank feeds

**Status:** `[x]` Explainable, diverse, feedback-aware curation verified on August 4, 2026.

ONN selects eligible content based on destination permissions and ranks it using explainable signals.

- [x] Apply project authorization, topic relevance, freshness, exclusions, and request maximums.
- [x] Add category and subcategory relevance.
- [x] Add publisher, story, content-type, and taxonomy diversity rules.
- [x] Add source-quality signals and duplicate-story suppression.
- [x] Apply bounded, project-scoped feedback personalization with decay.
- [x] Maintain reviewed evaluation sets for relevance calibration.

**Completion criteria:** Reviewed evaluation sets consistently produce relevant, diverse, explainable results without quota-filling with unrelated content.

**Verification note:** Deterministic score explanations now separate taxonomy relevance, freshness, source quality, and bounded feedback. Category and subcategory requests expand through project-authorized taxonomy. Near-duplicate suppression and conditional publisher, content-type, and taxonomy diversity preserve qualifying alternatives without admitting unrelated items. Project/user feedback uses a 90-day window, 30-day half-life, per-topic bounds, and no cross-project data. Ninety-one automated tests passed, including reviewed ranking cases; live OSai and NASA checks confirmed explainable positive and negative ranking changes.

### 6. Distribute through the ONN Feed API

**Status:** `[x]` Stable unified delivery and feedback contract verified on August 4, 2026.

Consumer applications request curated feeds with private project credentials through their own servers.

- [x] Refactor unified feed composition into a dedicated service layer.
- [x] Publish an OpenAPI specification, examples, stable error catalog, and TypeScript types/client generated from the validated request contract.
- [x] Support taxonomy, source, publication, content-type, and distribution filters.
- [x] Define partial-result, empty-result, timeout, and freshness behavior.
- [x] Offer a normalized combined item view while preserving origin and provenance.
- [x] Add a dedicated `feed:feedback` scope and consistent feed analytics.
- [x] Add quotas, rate limits, payload limits, caching, and project onboarding.

**Completion criteria:** A consumer team can safely integrate using public documentation without reading ONN source code.

**Verification note:** The unified route now authenticates and validates once, then calls a dedicated composition service rather than other route handlers. Strict requests support taxonomy, origin, source, publication, content-type, distribution, age, exclusion, and maximum filters. Responses provide normalized combined items, origin sections, provenance, explanations, freshness/cache metadata, and documented complete, partial, empty, and unavailable states. OpenAPI, examples, stable errors, TypeScript contracts, and a server client are published. Per-project payload, burst, daily, cache, request-log, and separate `feed:feedback` controls are active. Live OSai and Career Pivot requests verified authorization, cache miss/hit behavior, normalized results, feedback recording, and feedback-scope isolation; OSai also returned the controlled first-party item through the origin filter. Temporary verifier keys were revoked.

### 7. Serve and learn from consumer applications

**Status:** `[x]` Career Pivot production pilot verified on August 4, 2026.

Each consumer calls ONN from its backend, presents the returned feed, and forwards user interaction signals.

- [x] Integrate Career Pivot as the first production pilot.
- [x] Render external and first-party items with correct provenance and attribution.
- [x] Forward shown, opened, saved, useful, dismissed, and not-relevant interactions.
- [x] Provide last-known-good behavior when ONN is temporarily unavailable.
- [~] Monitor latency, empty feeds, relevance, source diversity, errors, and feedback. Request and interaction records exist; sustained production dashboards and alerting remain.
- [~] Validate that onboarding a second application requires configuration rather than Career Pivot-specific code. The neutral adapter pattern is documented; a second live consumer verification remains.

**Completion criteria:** At least one production pilot is dependable, measurable, and reusable as the onboarding pattern for additional Orbit applications.

**Production verification note:** Career Pivot calls ONN only through authenticated server routes, derives an opaque user ID, maps bounded profile signals to shared taxonomy, displays normalized attributed items, and forwards interactions. Desktop and mobile layouts, empty state, entity normalization, Save state, and console health were checked in the rendered application. With ONN stopped, Career Pivot served and labeled its last-known-good edition; service recovered after restart. The production Vercel project uses a free durable Neon database, production-scoped ONN credentials, and a production-only Vercel Trusted Source rule. A live production request returned four normalized external-news items and a useful interaction returned `201`; ONN recorded key usage and two isolated QA feedback events. The QA account was removed and superseded production credentials were revoked after verification. Sustained dashboards, alerting, and a second live consumer remain follow-on improvements rather than blockers to this stage's one-pilot completion criterion.

---

## Part II — Seventeen-step production roadmap

These steps are ordered dependencies. Work may overlap where safe, but a later phase should not be declared complete while its required foundation remains incomplete.

### 1. Define the production feed contract

**Status:** `[x]` Version 1 contract published and verified on August 4, 2026.

- [x] Specify required and optional request fields.
- [x] Specify normalized response items and provenance.
- [x] Define maximums, stable identifiers, versioning, errors, timeouts, partial results, and empty results.
- [x] Publish OpenAPI, examples, and TypeScript types.

**Complete when:** An application can integrate without inspecting ONN source code.

### 2. Tighten the unified-feed API

**Status:** `[x]` Dedicated composition service and contract tests verified on August 4, 2026.

- [x] Replace route-to-route composition with shared feed services.
- [x] Authenticate and validate once per request.
- [x] Add a dedicated unified-feed schema.
- [x] Add consistent request IDs, timestamps, logging, freshness metadata, and error behavior.
- [x] Add a dedicated `feed:feedback` scope.
- [x] Add contract tests.

**Complete when:** Unified-feed behavior is independently testable and its public contract is stable.

### 3. Establish the taxonomy

**Status:** `[x]` Shared hierarchical taxonomy and governance verified on August 4, 2026.

- [x] Define category, subcategory, topic, tag, and entity boundaries.
- [x] Define stable slugs, descriptions, relationships, aliases, and lifecycle states.
- [x] Add project permissions and source mappings.
- [x] Avoid application-specific taxonomy hardcoding.

**Complete when:** Every active classification has a clear, non-ambiguous meaning and governance process.

### 4. Build the source-review process

**Status:** `[x]` Activation controls, audit fields, and operator runbook verified on August 4, 2026.

- [x] Record feed ownership, publisher identity, terms, attribution, permitted fields, restrictions, reviewer, and review dates.
- [x] Separate safe test collection from activation.
- [x] Require administrative approval before production activation.

**Complete when:** Every active source has an auditable approval record.

### 5. Add initial production sources

**Status:** `[~]` NASA, DOL, and NSF are reviewed and active; broader priority-taxonomy coverage remains.

- [~] Begin with two to five strong sources per priority taxonomy area. The current production catalog has three active reviewed sources with images blocked by default and one paused NASA/JPL CNEOS source.
- [x] Test parsing, dates, URLs, descriptions, authors, images, attribution, and duplicates for the current reviewed catalog.
- [x] Verify that one source failure does not stop others.

**Complete when:** Approved sources refresh consistently and store correctly normalized records.

### 6. Improve source safety and reliability

**Status:** `[x]` Automatic failure controls and controlled reactivation verified on August 4, 2026.

- [x] Block localhost, private networks, metadata services, unsafe protocols, and unsafe redirect destinations.
- [x] Limit response size, redirects, content types, and processing time.
- [x] Sanitize stored text and bound logged errors.
- [x] Add failure thresholds, warnings, automatic pausing, and controlled reactivation.

**Complete when:** A malicious or broken feed cannot access internal services, consume unbounded resources, or expose sensitive information.

### 7. Validate normalization and deduplication

**Status:** `[x]` Fixture-backed identity and duplicate behavior verified on August 4, 2026.

- [x] Add fixtures for tracking parameters, fragments, slashes, protocol changes, identifiers, title changes, syndication, and republishing.
- [x] Define update-versus-new-item behavior.
- [x] Preserve stable ONN IDs and provenance.

**Complete when:** Repeat refreshes are idempotent and duplicate stories rarely reach consumers.

### 8. Improve curation quality

**Status:** `[x]` Reviewed evaluation sets and explainable diversity-aware ranking verified on August 4, 2026.

- [x] Build reviewed relevance evaluation sets.
- [x] Tune thresholds, weights, freshness, mappings, and source quality.
- [x] Add source and story diversity.
- [x] Reject weak results rather than filling quotas.

**Complete when:** Evaluation sets produce consistently acceptable rankings.

### 9. Make feedback affect future results

**Status:** `[~]` Bounded, decayed personalization is active; preference reset remains.

- [x] Aggregate project-scoped user preferences.
- [x] Apply bounded positive and negative signals.
- [~] Add time decay and preference reset operations. Time decay is active; reset operations remain.
- [x] Keep explanations understandable and avoid unnecessary identity data.

**Complete when:** Repeated feedback creates measurable, bounded, explainable ranking changes.

### 10. Add caching and resilience

**Status:** `[x]` Unified-feed caching, partial results, and consumer last-known-good behavior verified on August 4, 2026.

- [x] Define database, request, and consumer last-known-good caching.
- [x] Return eligible cached content when refreshes fail.
- [x] Define stale, partial, empty, and unavailable states.
- [x] Ensure individual publisher failures do not make the feed unavailable.

**Complete when:** Temporary source or ONN failures do not erase the consuming application's news surface.

### 11. Move refresh work to scheduled processing

**Status:** `[ ]`

- [ ] Select due sources outside end-user feed requests.
- [ ] Add scheduled triggers, bounded concurrency, locking, retries, backoff, and run history.
- [ ] Add dead-source detection and operator controls.

**Complete when:** Feed request latency is independent of publisher response time.

### 12. Add rate limits and quotas

**Status:** `[x]` Project-scoped feed and feedback controls verified on August 4, 2026.

- [x] Define per-project and per-environment request, burst, daily, payload, topic, item, and feedback limits.
- [x] Return stable `429` errors and retry guidance.
- [x] Prevent authenticated callers from forcing excessive refresh or cache fragmentation.

**Complete when:** One project cannot degrade service for other consumers.

### 13. Add observability

**Status:** `[~]` Basic request and processing records exist.

- [ ] Track feed latency, counts, empty-feed rate, freshness, source success, rejected items, duplicates, feedback, and safe error codes.
- [ ] Add topic-coverage and quota visibility.
- [ ] Add actionable alerts for sustained failures.

**Complete when:** Operators can diagnose a bad feed without manually querying production tables.

### 14. Create project onboarding

**Status:** `[~]`

- [ ] Create repeatable development and production project setup.
- [ ] Configure taxonomy access, limits, refresh policy, and distribution permissions.
- [ ] Issue, verify, rotate, and revoke scoped keys safely.
- [ ] Record ownership and integration verification.

**Complete when:** A second Orbit application can be added through configuration instead of code changes.

### 15. Build contract and end-to-end testing

**Status:** `[x]` Contract, isolation, failure-state, and production consumer checks verified on August 4, 2026.

- [x] Test valid, invalid, revoked, incorrectly scoped, and unauthorized requests.
- [x] Test exclusions, maximums, refresh outcomes, deduplication, distribution, empty results, feedback, isolation, and safe errors.
- [x] Test one real consumer server against ONN. Career Pivot was verified locally and in production.

**Complete when:** ONN changes cannot silently break consumer integrations.

### 16. Complete security and privacy review

**Status:** `[~]`

- [ ] Review key lifecycle, request forgery defenses, authorization, project isolation, administration, logs, retention, deletion, attribution, backups, recovery, and dependencies.
- [ ] Document the threat model, mitigations, and explicitly accepted risks.

**Complete when:** Production risks and controls have been reviewed and recorded.

### 17. Pilot with one consuming application

**Status:** `[x]` Career Pivot production pilot verified on August 4, 2026.

- [x] Create Career Pivot's production project and narrowly scoped taxonomy access.
- [x] Activate a small approved source catalog.
- [x] Issue its production feed credential.
- [x] Build its server-side proxy, feed presentation, feedback forwarding, and fallback behavior.
- [x] Monitor and manually review relevance, latency, diversity, empty feeds, and errors during production verification.
- [~] Document reusable lessons and prove that a second application needs no Career Pivot-specific ONN changes. The neutral onboarding pattern is documented; a second live consumer remains follow-on work.

**Complete when:** The pilot is dependable and provides a reusable onboarding pattern for other Orbit applications.

---

## Recommended delivery milestones

### Milestone 1 — Contract

Steps 1–3: production API contract, unified-feed service, and hierarchical taxonomy.

### Milestone 2 — Content supply and governance

Steps 4–9: source approval, production sources, ingestion safety, normalization, curation, and feedback-informed relevance.

### Milestone 3 — Production operations

Steps 10–16: resilience, scheduled refresh, quotas, observability, onboarding, testing, security, and privacy.

### Milestone 4 — Pilot

Step 17: complete and evaluate the Career Pivot production pilot while preserving ONN as shared infrastructure.

## Immediate next action

Move refresh work to scheduled processing before scaling the source catalog, then add operational metrics and actionable alerts. Continue using the source-review runbook for each candidate; no source should be activated until ownership, terms, attribution, permitted fields, restrictions, taxonomy fit, and safe parsing have been reviewed.
