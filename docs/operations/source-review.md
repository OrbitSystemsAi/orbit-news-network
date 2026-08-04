---
title: External Source Review Runbook
status: approved
owner: Orbit News Network Operations
last_updated: 2026-08-04
---

# External Source Review Runbook

## Purpose

This runbook governs how an external RSS or Atom source moves from discovery to production use in Orbit News Network (ONN). Testing a feed proves only that ONN can fetch and parse it safely; testing never grants permission to activate or redistribute its metadata.

ONN stores normalized metadata and source-provided excerpts. It links to the publisher's original item, identifies the source, never scrapes article pages, and never stores complete copyrighted article bodies.

## Required evidence

Before activation, an operator must record:

- publisher name and canonical website;
- exact feed URL and whether it is published on an official or explicitly authorized domain;
- evidence that the feed is official or authorized;
- the terms, feed guidance, or publisher policy reviewed and the review date;
- permitted metadata fields and any restrictions on excerpts, images, authorship, or reuse;
- the exact attribution and linking requirements;
- editorial-quality and topical-fit notes;
- the reviewing operator's identifier and decision date; and
- a policy re-review date no more than 180 days later.

Unclear ownership, terms, attribution, or permitted use blocks activation and must be escalated to the ONN owner. Operators must not infer permission from technical accessibility alone.

## Workflow

1. **Discover:** Record the publisher, official site, candidate feed URL, intended taxonomy coverage, and reason for consideration.
2. **Test safely:** Use the protected source test operation. Confirm the public HTTPS URL passes network controls and inspect only the bounded parse summary. Do not store articles or activate the source.
3. **Review:** Confirm ownership, terms, attribution, permitted fields, restrictions, editorial quality, and taxonomy fit. Record supporting URLs in the editorial notes.
4. **Add pending source:** Create the source as `PENDING_REVIEW` with at least one approved topic mapping.
5. **Decide:** Activate only when official-feed confirmation, terms review, attribution notes, reviewer identity, and re-review date are present. Otherwise leave pending, reject, or pause it with a reason.
6. **Verify collection:** Run a bounded refresh and check item count, timestamps, canonical URLs, descriptions, authors, images, attribution, topic mappings, and duplicate counts.
7. **Observe:** Confirm one source failure does not prevent other sources from refreshing and that errors contain no secrets or unsafe response content.
8. **Re-review:** Reassess before the policy due date or immediately after a feed-domain, ownership, terms, format, or editorial-policy change.

## Decision outcomes

- `PENDING_REVIEW` — evidence or approval is incomplete; production collection is prohibited.
- `ACTIVE` — all required evidence is recorded and collection is approved.
- `PAUSED` — collection is temporarily disabled because of reliability, policy, ownership, attribution, or quality concerns.
- `REJECTED` — the source is unsuitable or permission cannot be established.

Reactivation follows the same evidence and approval requirements as initial activation. A technical recovery alone does not resolve a policy or permission concern.

## Production acceptance checklist

- [ ] Feed URL is public HTTPS and official or explicitly authorized.
- [ ] Publisher identity and canonical website are recorded.
- [ ] Terms or feed guidance were reviewed.
- [ ] Permitted fields and restrictions are recorded.
- [ ] External images remain blocked unless their reuse and attribution requirements are explicitly confirmed.
- [ ] Attribution and original-item linking requirements are recorded.
- [ ] Editorial quality and taxonomy fit were reviewed.
- [ ] Safe test parsing succeeded without storing content.
- [ ] Source begins in `PENDING_REVIEW`.
- [ ] Reviewer, decision date, and re-review date are recorded.
- [ ] Bounded refresh validates metadata and duplicate behavior.
- [ ] Failure isolation and safe error reporting are verified.

## Current catalog boundary

As of August 4, 2026, NASA News Releases is the only active production source. NASA/JPL CNEOS News is paused. Adding or reactivating a publisher requires a fresh review record and explicit operator activation; this runbook does not approve any additional source by itself.

## Related references

- [News ingestion](../004-News-Ingestion.md)
- [Shared taxonomy](../015-Taxonomy.md)
- [Platform roadmap](../product/roadmap.md)
- [Private MVP security](../013-Private-MVP-Security.md)
