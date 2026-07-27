# 004 — News Ingestion

## Connector architecture

`NewsSourceConnector` accepts a reviewed feed configuration and returns validated `CollectedArticle` records. The RSS/Atom connector fetches only the configured feed URL with a ten-second default timeout and an identifying ONN user agent. It never follows article links, scrapes pages, downloads images, or stores complete bodies.

## Approval workflow

New sources enter `PENDING_REVIEW`. Testing fetches and parses a safe summary but does not activate the source. An administrator reviews publisher terms, topic mappings, and refresh settings before activation. Sources may be paused or rejected at any time. No external feed URL is seeded automatically.

## Normalization

RSS and Atom provider fields map to external ID, title, source-provided description, canonical URL, author, optional external image URL, publication timestamp, and minimal format metadata. Zod rejects malformed entries without failing the remaining feed. Missing or invalid dates use collection time.

## Duplicates and topics

URLs are normalized by removing fragments, trailing slashes, and common tracking parameters while retaining identity parameters. A SHA-256 fingerprint combines canonical URL, normalized title, source, and publication day. ONN checks canonical URL, source identifier, and fingerprint. Articles inherit feed mappings and may gain conservative keyword-rule topics; assignment source and deterministic confidence are stored.

## Refresh selection and locking

A relevant-news request resolves authorized topics and active mapped sources. A source is fresh only when its last success is within both source and project constraints; the more restrictive interval wins. An atomic conditional update acquires a database timestamp lock. Locks expire after five minutes by default. Concurrent requests use cached records rather than waiting. This MVP lock assumes one PostgreSQL system of record and does not provide distributed queues or guaranteed retries.

## Retention and errors

Every query requires active articles whose publication timestamp is within `NEWS_VISIBLE_HOURS` (24 by default). Refresh marks older records expired; permanent deletion after the configurable diagnostic window is a later maintenance operation. Each source records counts, duration, and a bounded safe error message. One failing source does not stop others.

Publisher descriptions remain source-provided excerpts. ONN does not claim redistribution rights; administrators must review each feed’s terms before production activation.
