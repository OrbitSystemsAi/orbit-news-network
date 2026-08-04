# 001 — Architecture

## System context and boundaries

ONN is a headless content-infrastructure platform. A user browser authenticates with an originating Orbit application; that application’s server calls ONN with a project-scoped credential. ONN never trusts a body-supplied application ID and never reaches into another application’s private database.

Organizations own projects. Projects own API keys, publications, subscriptions, contributor references, submissions, distribution rules, and request logs. External contributor identities contain only stable originating-app identifiers and optional attribution—not passwords, sessions, messages, or full private profiles.

## Career Pivot integration

Career Pivot constructs the magazine and sends normalized relevance signals. Its server requests current news from ONN. ONN authenticates the project, finds eligible topic/source groups, checks shared freshness, returns cached content when fresh, or acquires a refresh lock and updates only stale groups. Other concurrent requests reuse the refreshed inventory. Responses exclude external articles older than 24 hours.

## Publishing flow

Future first-party flow: originating-app draft → originating review → ONN submission → validation → moderation → enrichment → distribution rules → publication → distribution → analytics. The current schema preserves submission, publication, contributor, and distribution boundaries without implementing the workflow.

## API and security boundaries

Versioned REST routes live under `/api/v1`. Browser bundles never contain ONN private credentials. API keys are represented by a display prefix and a one-way hash only. Secrets come from environment variables; logs contain request metadata, not credentials or private payloads.

## Database overview

PostgreSQL/Neon is the system of record. The schema separates external rolling inventory from first-party submissions. A governed taxonomy layer organizes stable legacy topics beneath shared categories and subcategories, with aliases, replacements, project permissions, assignment provenance, and confidence. Source, article, topic, taxonomy, project, publication, credential, rule, request-log, and processing-run models use ownership indexes and uniqueness constraints.

## MVP versus future state

MVP: demand-driven RSS/Atom, deterministic hierarchical classification/relevance, URL/fingerprint duplicates, project credentials, PostgreSQL, REST, and 24-hour visibility. Future: approved automated classifiers, semantic search, graph processing, streaming, webhooks, GraphQL, SDKs, billing, premium sources, and warehouse analytics. These future systems remain extension points, not active dependencies.


## Phase 2 functional request path

The bearer-key prefix locates a candidate record; scrypt verification with a server-held pepper authenticates one active project and updates key usage. Requested topics are intersected with active `ProjectTopic` permissions. ONN selects only active sources mapped to those topics, uses the stricter project/source interval, and atomically acquires expiring source locks. Fresh or concurrently refreshing sources use shared cached inventory.

Connectors normalize RSS/Atom metadata into minimal records. Canonical URL, source identifier, and content fingerprint enforce deterministic duplicates. Feed mappings and centralized keyword rules assign topics. Queries enforce active status and a 24-hour cutoff before explainable scoring. Feedback stores project ID, opaque external user ID, article ID, interaction, and timestamp only.

Individual Neon Auth sessions plus the server-only `ONN_ADMIN_EMAILS` allowlist protect source, project, key, and manual-refresh operations when Neon Auth is configured. `ADMIN_ACCESS_KEY` remains a temporary setup fallback and approved server-tool credential; it is not subscriber authentication. Database locks provide practical single-database coordination but no durable queue. Failed sources are isolated; manual approval is required before activation, and no feeds are seeded.


## Phase 3 publishing boundaries

An authenticated originating project submits safe first-party content into a publication it owns. ONN validates project/publication/topic ownership, upserts a project-scoped contributor, applies deterministic moderation, stores ordered citations and topics, and records status history. Idempotency is scoped by project and request fingerprint.

The distribution engine evaluates origin/destination organizations and projects, active states, publication/content status, distribution level, explicit partner targets, and destination public-content access. Eligible retrieval creates a unique delivery. Destination interaction records use opaque project-scoped external user IDs. The unified feed returns separate candidate arrays; it does not compose an application magazine.

API-key scopes are verified before each capability. Subscriber keys cannot invoke administrative state changes. Internal administration requires both a Neon Auth identity and explicit ONN administrator authorization; the legacy administrative key remains only for migration and approved server-side tooling.

## Private MVP deployment boundary

The Vercel private MVP keeps the landing page, developer documentation, access pages, health endpoint, and authenticated integration APIs reachable. `/admin/**` and `/portal/**` are protected by Neon Auth middleware, then independently authorized against a server-only administrator allowlist in layouts and internal routes. Until Neon Auth is configured, the temporary HMAC-signed access session prevents setup lockout. The administrative header remains available only for approved server-side tooling.

The runtime uses Neon’s pooled `DATABASE_URL`; controlled Prisma operations prefer `DIRECT_URL`. Preview and Production may temporarily share the existing free database, so builds never migrate or seed. A reviewed operator runs committed migrations before deployment. Vercel Git integration supplies preview and production artifacts; no duplicate deployment workflow, scheduler, paid monitor, or custom domain is part of this phase.
