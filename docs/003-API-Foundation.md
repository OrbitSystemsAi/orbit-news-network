# 003 — API Foundation

All public integration endpoints are versioned under `/api/v1`. The initial implementation exposes only `GET /api/v1/health`.

Success:

```json
{ "data": {}, "meta": { "requestId": "optional" } }
```

Error:

```json
{ "error": { "code": "STABLE_CODE", "message": "Safe message", "details": {} } }
```

Future authentication uses a bearer credential issued per project and environment. ONN stores a non-secret prefix for display and a one-way hash for verification; plaintext keys are returned only once at creation and never logged. The authenticated credential determines the project—request bodies cannot override it.

Planned endpoint groups: health, projects, API keys, feeds, topics, relevant news, content submissions, publications, feedback, distribution, and analytics. Shared Zod schemas validate path, query, and payload input before service calls.

Integration boundary:

```text
User browser → originating application → originating server
             → ONN /api/v1 using a private project credential
```

Never place a private ONN key in browser JavaScript, a public environment variable, a URL, a screenshot, or source control. Health reports database configuration state without exposing connection details.


## Phase 2 endpoints

- `GET /api/v1/topics` — active topics permitted for the authenticated project.
- `POST /api/v1/news/relevant` — validates weighted topics, refreshes only stale relevant sources, enforces the project maximum and 24-hour window, and returns deterministic ranked items.
- `POST /api/v1/news/feedback` — stores a minimal project/user/article interaction.
- `POST /api/internal/news/refresh` — ADMIN_ACCESS_KEY-protected manual collection.

## Deployed access and CORS policy

Integration endpoints remain server-to-server. Private project keys must not be delivered to browsers. ONN intentionally omits permissive cross-origin response headers, does not use wildcard origins, and does not treat CORS as authentication. Any future browser origin allowlist requires separate review and does not replace scopes.

Administrative endpoints require either the constant-time `x-onn-admin-key` comparison used by approved server tools or the signed HTTP-only private-MVP session used by same-origin protected pages. Error envelopes do not include stack traces, database details, or credentials. The manual refresh endpoint remains behind this boundary.

The public health endpoint exposes application status, version, time, environment, and a coarse database configuration state only. It never exposes the database host, account, region, connection string, or secret values.
- Internal source, project, and API-key routes provide development administration.

The relevant-news request requires an opaque `externalUserId` and one or more weighted topics. Unknown or unauthorized topics return `TOPIC_NOT_AUTHORIZED`. Excluded topics and article IDs are hard rejections. Weak unrelated articles are not returned merely to fill the requested count.

Full API keys appear only in a successful creation response and cannot be read later. Request logs exclude bodies and credentials. Administrative protection is an MVP limitation; rate limiting remains a placeholder. RSS connectors never follow publisher article links. Standard envelopes always include request ID and timestamp.


## Publishing API and scopes

Phase 3 adds content submission/retrieval, publications, first-party relevance, unified feed, content feedback, and feed feedback. Required scopes are enforced at authentication. A bearer key identifies the project; no request-body project identifier can override it.

Submission retries use project-scoped `Idempotency-Key`. Identical retries return the canonical record; conflicts return 409. Destination retrieval returns 404 for nonexistent and unauthorized objects alike to reduce object-enumeration leakage.

Distribution levels are private, profile, application, network, partner, and public. Public means eligible for authenticated projects with configured access—not anonymous publication. Status transitions and administrative decisions use internal server-only routes.

Standard errors include `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_PUBLICATION`, `TOPIC_NOT_ALLOWED`, `DUPLICATE_SUBMISSION`, `IDEMPOTENCY_CONFLICT`, `CONTENT_REJECTED`, `CONTENT_NOT_FOUND`, and `INVALID_STATUS_TRANSITION`.
