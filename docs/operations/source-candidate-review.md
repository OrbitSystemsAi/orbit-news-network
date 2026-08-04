---
title: Initial External Source Candidate Review
status: in-review
owner: Orbit News Network Operations
last_updated: 2026-08-04
---

# Initial External Source Candidate Review

## Scope

This review identifies official, free RSS feeds that could improve ONN coverage for careers, employment, business, technology, and education. It records discovery and safe parsing evidence only. No candidate in this document is approved, stored, or active.

## Safe parsing results

ONN's production connector was run locally in non-storing test mode on August 4, 2026. All five URLs passed HTTPS network controls and RSS/Atom parsing.

| Candidate | Official feed | Proposed topics | Items parsed | Newest parsed item | Review state |
| --- | --- | --- | ---: | --- | --- |
| U.S. Department of Labor News Releases | `https://www.dol.gov/rss/releases.xml` | careers, employment, remote-work, business | 10 | 2026-07-22 | `PENDING_REVIEW`; activation not approved |
| BLS Employment Situation | `https://www.bls.gov/feed/empsit.rss` | employment, careers, business | 12 | 2026-02-11 | Hold: parsed feed appears stale |
| SEC Press Releases | `https://www.sec.gov/news/pressreleases.rss` | business, finance, government | 25 | 2026-05-27 | Hold: general reuse policy needs confirmation |
| NIST News | `https://www.nist.gov/news-events/news/rss.xml` | technology, artificial-intelligence, digital-transformation | 40 | 2025-09-24 | Hold: parsed feed appears stale |
| U.S. National Science Foundation News | `https://www.nsf.gov/rss/rss_www_news.xml` | education, technology, artificial-intelligence | 15 | 2026-07-29 | `PENDING_REVIEW`; activation not approved |

The dates above describe the feed output observed by ONN, not the newest webpage content. BLS and NIST should not advance until the stale-feed discrepancy is understood.

## Candidate review notes

### U.S. Department of Labor News Releases

- Official-feed evidence: DOL's RSS directory explicitly publishes the news-release feed URL.
- Use guidance: DOL states that agency-created information is generally public domain and encourages attribution; third-party photographs, graphics, publications, articles, and multimedia may remain protected.
- Proposed attribution: “U.S. Department of Labor,” linked to the original release.
- Proposed restriction: ingest title, source-provided excerpt, canonical URL, author, and publication date; do not reuse or proxy images or other media.
- Remaining decision: ONN owner approval of broad DOL newsroom coverage and topic mappings.

### U.S. National Science Foundation News

- Official-feed evidence: NSF's RSS directory explicitly publishes the NSF News feed and describes it as headlines, summaries, and links to NSF content.
- Use guidance: NSF states that most text is government-created or placed in the public domain, while visual media can have separate rights and credit requirements.
- Proposed attribution: “U.S. National Science Foundation,” linked to the original item.
- Proposed restriction: ingest title, source-provided excerpt, canonical URL, author, and publication date; do not reuse or proxy visual media.
- Remaining decision: ONN owner approval of the education and technology mappings.

### SEC Press Releases

- Official-feed evidence: SEC's RSS directory explicitly publishes the press-release feed.
- Proposed attribution: “U.S. Securities and Exchange Commission,” linked to the original release.
- Proposed restriction: metadata and source-provided excerpt only; no images, attachments, or third-party submitted material.
- Remaining decision: locate or obtain a sufficiently clear SEC website reuse policy before activation.

### BLS and NIST

Both feeds are official and parse successfully, but their newest parsed dates lag the agencies' current webpages. Keep them outside the first batch until redirect, cache, feed-selection, and date-field behavior are reviewed. BLS separately states that its agency-published materials are public domain except previously copyrighted photographs and illustrations, and asks users to cite BLS.

## Recommended first approval batch

DOL News Releases and NSF News were added to production as `PENDING_REVIEW` on August 4, 2026. The source-level image restriction is deployed and both records have images blocked. Neither source has been refreshed and neither has stored an article. Keep SEC, BLS, and NIST as research candidates with no database record.

Activation remains a separate owner decision after official-feed confirmation, terms review, attribution requirements, permitted fields, restrictions, and final topic mappings are recorded.

## Primary references

- DOL RSS directory: `https://www.dol.gov/rss`
- DOL website content and publication practices: `https://beta.dol.gov/about/website-content-and-publication-practices`
- BLS RSS directory: `https://www.bls.gov/feed/`
- BLS copyright information: `https://www.bls.gov/opub/copyright-information.htm`
- SEC RSS directory: `https://www.sec.gov/about/rss-feeds`
- NIST RSS directory: `https://www.nist.gov/coo/nist-rss-feeds`
- NSF RSS directory: `https://www.nsf.gov/rss`
- NSF web policies: `https://www.nsf.gov/policies/digital`

## Related references

- [External source review runbook](source-review.md)
- [News ingestion](../004-News-Ingestion.md)
- [Platform roadmap](../product/roadmap.md)
