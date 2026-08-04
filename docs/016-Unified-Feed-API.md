# 016 — Unified Feed API

The unified feed is ONN's stable server-to-server delivery contract for consumer applications. Applications call ONN from their backend with a project bearer credential; API keys must never be sent to browsers.

## Endpoints and scopes

- `POST /api/v1/feed/relevant` requires `feed:read`.
- `POST /api/v1/feed/feedback` requires `feed:feedback`.

The authoritative OpenAPI document is `docs/api/openapi.yaml`. TypeScript applications can import `UnifiedFeedRequest`, `UnifiedFeedResponse`, `FeedItem`, `FeedFeedbackRequest`, and `createFeedClient` from `src/lib/contracts/feed.ts` until the contract is published as a package.

## Request example

```json
{
  "externalUserId": "opaque-member-123",
  "classifications": [{ "slug": "technology-and-data", "weight": 8, "source": "interest" }],
  "origins": ["first_party", "external_news"],
  "contentTypes": ["article", "research"],
  "publicationSlugs": ["career-pivot"],
  "sourceSlugs": ["nasa"],
  "distributionLevels": ["application", "network"],
  "maximumItems": 12,
  "maximumAgeHours": 24
}
```

Topic, classification, exclusion, source, publication, content-type, distribution-level, origin, age, and maximum filters are validated strictly. Unknown request fields are rejected. Category and subcategory signals expand only through the authenticated project's taxonomy permissions.

## Response behavior

The `items` array is a relevance-ranked combined view. Every item has the same core fields, an `origin`, publisher, taxonomy, timestamps, provenance, relevance score, and explanation. Origin-specific arrays remain available under `sections.firstParty.items` and `sections.externalNews.items`.

- `200` means every requested origin completed.
- `206` means at least one origin completed and another was unavailable. The failed section contains a safe error code; successful items remain usable.
- `503 FEED_UNAVAILABLE` means no requested origin could be loaded.
- A successful empty result is `200` with an empty `items` array. ONN does not add unrelated items to fill the maximum.

Each origin is bounded by the server-only `FEED_REQUEST_TIMEOUT_MS` setting (10 seconds by default). A timed-out origin follows the same safe partial/unavailable behavior and does not expose its internal error.

Responses report generation time, requested freshness, 30-second cache policy, cache hit/miss, request ID, and timestamp. Cached results are scoped by project and the complete validated request.

## Stable error catalog

| Code | Status | Meaning |
| --- | ---: | --- |
| `UNAUTHORIZED` | 401 | Credential is missing, invalid, inactive, or lacks the endpoint scope. |
| `VALIDATION_ERROR` | 400 | The JSON body does not satisfy the request contract. |
| `CLASSIFICATION_NOT_AUTHORIZED` | 403 | The project cannot request at least one taxonomy signal. |
| `PAYLOAD_TOO_LARGE` | 413 | The request exceeds 32 KiB. |
| `FEED_ITEM_NOT_FOUND` | 404 | The item is not active or eligible for the project. |
| `RATE_LIMITED` | 429 | The project exceeded its burst or daily endpoint quota. |
| `FEED_UNAVAILABLE` | 503 | Every requested origin failed. |
| `INTERNAL_ERROR` | 500 | An unexpected composition failure occurred. |

Error envelopes include `error.code`, `error.message`, safe `error.details`, and `meta.requestId`. Clients should branch on the stable code, not the human-readable message.

## Limits, caching, and analytics

Each feed endpoint allows a 60-request-per-minute in-process burst and 10,000 logged requests per project per UTC day. The current burst limiter is instance-local; production horizontal scaling requires a shared limiter before increasing traffic. Relevant-feed results cache for 30 seconds in the serving instance. Project request logs record endpoint, status, duration, and request ID without request bodies or credentials.

## Project onboarding

1. Create or select an active ONN project and configure its maximum items, minimum refresh interval, taxonomy permissions, and permitted distribution targets.
2. Issue separate server-only credentials with the minimum required `feed:read` and/or `feed:feedback` scopes.
3. Verify taxonomy, publication, source, and distribution filters in the target environment.
4. Exercise complete, empty, partial, unauthorized, invalid, and rate-limited handling.
5. Forward only opaque application user IDs and supported interaction signals.
6. Monitor request latency, status, empty feeds, origin availability, and feedback volume before production rollout.

Consumers should retain a last-known-good response for temporary ONN outages. Durable cross-instance caching and shared rate limiting remain infrastructure-scale extensions; the API behavior and error contract do not depend on their implementation.
