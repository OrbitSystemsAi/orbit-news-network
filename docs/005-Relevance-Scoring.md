# 005 — Explainable Feed Curation

ONN curates external news and first-party content with deterministic, reviewable rules. The ranking layer does not use an opaque model and never returns unrelated material merely to fill a requested count.

## Eligibility before ranking

A candidate must belong to the authenticated project, be active and published, satisfy the requested freshness window, avoid excluded topics and item IDs, and match at least one project-authorized category, subcategory, or topic. Category and subcategory requests expand only to their authorized descendant topics.

Request maximums are upper bounds, not quotas. If only two candidates clear the relevance threshold, a request for ten returns two.

## Explainable score

Each response includes a `relevanceExplanation` with the total and its components:

- **Topic relevance:** requested weight × assignment confidence × signal-source multiplier × mapping multiplier. Signal multipliers are career 1.25, interest 1.0, group 0.9, and network 0.7; direct feed mappings receive 1.1.
- **Freshness:** a linear bonus that begins at 4 and falls to zero at the request's freshness limit.
- **Source quality:** an external-news adjustment based on reviewed or official-feed status, recent collection failures, and overdue policy review. It is bounded and cannot make an unrelated item relevant.
- **Feedback:** a project- and user-scoped topic adjustment derived from recent interactions.

The explanation also lists the matched topics, making an item's inclusion auditable without exposing private implementation data.

## Feedback personalization

ONN considers at most the requesting user's 250 most recent external-news interactions and 250 most recent first-party-content interactions from the requesting project during the previous 90 days. Signals decay with a 30-day half-life. Positive and negative values aggregate by topic, are clamped to `[-2, 2]` per topic, and the final feedback score is bounded to `[-3, 3]`.

No preference crosses project boundaries. The ranking service uses only the supplied opaque external user identifier and does not require additional identity data.

## Duplicate suppression and diversity

After scoring, ONN suppresses near-duplicate stories using normalized title and summary token similarity. It then limits repeated publishers, content types, and taxonomy branches when qualifying alternatives exist. Diversity never replaces a relevant candidate with an unrelated one, and a single-publisher inventory is not artificially truncated solely to satisfy a diversity cap.

## Evaluation and calibration

Reviewed cases live in `tests/fixtures/relevance-evaluation.json`. Each case records the requested topics, candidates, expected winner, and items that must be excluded. Automated tests cover duplicate suppression, conditional diversity, feedback decay and bounds, source-quality behavior, and reviewed rankings.

Calibration changes should update or add reviewed cases, state the intended ranking effect, and preserve the no-quota-fill rule. This keeps threshold and weight changes visible in review.

## Verification — August 4, 2026

The automated suite passed 91 tests, including two reviewed evaluation cases. Live authenticated checks exercised OSai first-party content and NASA external news. A useful signal increased the relevant OSai item's feedback component; a not-relevant signal reduced the matching external-news topic component. Both effects were bounded, scoped to the OSai project and test user, and visible in the response explanation. Category-level retrieval returned only authorized descendants, and unrelated candidates were not used to fill the requested maximum.
