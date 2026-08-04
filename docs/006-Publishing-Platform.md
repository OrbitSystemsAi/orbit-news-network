# 006 — Publishing Platform

ONN accepts first-party content from authenticated Orbit application servers. Supported Phase 3 types are article, announcement, insight, research, event, product update, alert, and press release. Media uploads are not supported; permitted external media URLs may be referenced.

A project owns publications. A submission verifies publication ownership/status, project topic permissions, content type, distribution level, URLs, body limits, and safe plain text or Markdown. Contributor identities are upserted by project plus external contributor ID. First-party bodies may be stored because the originating application intentionally submits them for publishing; this is distinct from external news, where ONN never stores full publisher bodies.

Requests may provide an `Idempotency-Key`. The project/key pair stores a request fingerprint for 48 hours by default. Identical retries return the prior record; conflicting payloads return `IDEMPOTENCY_CONFLICT`. Project plus external content ID and content fingerprint add duplicate protection.

The canonical request schema exports `ContentSubmissionRequest`; the publishing contract exports the stable `ContentSubmissionResponse` DTO and `createPublishingClient` server helper. Unknown request fields, duplicate or malformed topic slugs, oversized metadata, insecure citation/media URLs, and invalid or oversized idempotency keys are rejected. API responses are serialized through the contract boundary rather than exposing Prisma record shapes.

Workflow transitions are centralized: draft→submitted; submitted→under review; under review→approved or rejected; approved→published; published→paused or archived; paused→published or archived. Every transition creates history. Direct submission-to-approval is prohibited. Publication requires an approved moderation decision. Operators choose a bounded reason code; rejection and escalation require notes, and escalation leaves the item under review with a durable decision record.

The moderation queue loads both submitted and under-review records, exposes citations and provenance, and flags reviews at 24 hours and overdue reviews at 48 hours. Policy and staffing may shorten these operational targets without changing the API contract.

Submissions may include submitted topic weights and ordered HTTPS citations. Federated contributor records contain attribution and public-profile URLs only—never passwords, sessions, tokens, private messages, email, or phone.

Example:

```http
POST /api/v1/content/submissions
Authorization: Bearer onn_dev_example_not_real
Idempotency-Key: originating-request-123
Content-Type: application/json
```

See the developer portal for the complete JSON contract.

Private project credentials are server-only. The ONN portal does not accept them in browser forms; originating applications must call the publishing endpoint from their own backend environment.
