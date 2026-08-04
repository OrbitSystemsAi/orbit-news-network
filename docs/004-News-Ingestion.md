# 004 — News Ingestion

## Connector architecture

`NewsSourceConnector` accepts a reviewed feed configuration and returns validated `CollectedArticle` records. The RSS/Atom connector fetches only the configured feed URL with a ten-second default timeout and an identifying ONN user agent. It never follows article links, scrapes pages, downloads images, or stores complete bodies. The connector rejects local, private, link-local, reserved, and credential-bearing URLs; revalidates each redirect; allows at most three redirects; and caps feed responses at 2 MB.

## Approval workflow

New sources enter `PENDING_REVIEW`. Testing fetches and parses a safe summary but does not activate the source. Activation requires a durable record confirming that the feed is official or authorized, publisher terms were reviewed, and attribution requirements were captured. ONN records the reviewer, review time, editorial notes, and a policy re-review date six months later. Sources may be paused or rejected at any time. No external feed URL is seeded automatically.

The authoritative operator checklist and decision process are maintained in the [External Source Review Runbook](operations/source-review.md).

## Normalization

RSS and Atom provider fields map to external ID, title, source-provided description, canonical URL, author, optional external image URL, publication timestamp, and minimal format metadata. Zod rejects malformed entries without failing the remaining feed. Missing or invalid dates use collection time.

External images are blocked by default at the source level. Unless an operator explicitly records that a reviewed source permits image reuse and enables `allowExternalImages`, ingestion stores no image URL and feed responses suppress any previously stored image URL for that source.

## Duplicates and topics

URLs are normalized to HTTPS with a lowercase host, collapsed path slashes, no fragment or trailing slash, sorted query parameters, and common tracking parameters removed. Identity-bearing query parameters are retained. A SHA-256 fingerprint combines canonical URL, normalized title, source, and publication day. ONN checks canonical URL, source identifier, and fingerprint. A repeat URL remains the existing item even if source metadata or title changes; update-in-place is not part of the current ingestion contract. A different URL with a different source identifier and fingerprint is a new item, including legitimate republishing. Near-identical stories from different publishers retain separate provenance and are handled through diversity-aware curation rather than destructive cross-source merging. Articles inherit feed mappings and may gain conservative keyword-rule topics; assignment source and deterministic confidence are stored.

## Refresh selection and locking

A relevant-news request resolves authorized topics and active mapped sources. A source is fresh only when its last success is within both source and project constraints; the more restrictive interval wins. An atomic conditional update acquires a database timestamp lock. Locks expire after five minutes by default. Concurrent requests use cached records rather than waiting. This MVP lock assumes one PostgreSQL system of record and does not provide distributed queues or guaranteed retries.

## Retention and errors

Every query requires active articles whose publication timestamp is within `NEWS_VISIBLE_HOURS` (24 by default). Refresh marks older records expired; permanent deletion after the configurable diagnostic window is a later maintenance operation. Each source records counts, duration, and a bounded safe error message. One failing source does not stop others.

A source is automatically paused after `SOURCE_AUTO_PAUSE_FAILURE_THRESHOLD` consecutive refresh failures, three by default. The source record retains the pause timestamp and a safe reason visible to operators. A successful refresh resets the failure count. Automatically paused sources never reactivate themselves; an operator must review the failure and deliberately return the source to active status, which clears the failure and automatic-pause state.

Publisher descriptions remain source-provided excerpts. ONN does not claim redistribution rights; administrators must review each feed’s terms before production activation.

The August 4, 2026 review confirmed the configured NASA and JPL endpoints on official agency domains. ONN must link to the original item, identify NASA or JPL as the source, avoid implied endorsement, and avoid reuse of separately copyrighted third-party material. Supporting primary guidance: `https://cneos.jpl.nasa.gov/feed/`, `https://www.jpl.nasa.gov/rss/`, and `https://sti.nasa.gov/disclaimers/`.

## Operator visibility

The protected Sources screen shows current source state, topic mappings, refresh health, recent active external articles, and recent processing-run counts. Operators can test without storing, add a source for review, activate or pause it, reject or reopen it, and force a bounded manual refresh. Repeat refreshes expose duplicate counts and do not create additional article records.
