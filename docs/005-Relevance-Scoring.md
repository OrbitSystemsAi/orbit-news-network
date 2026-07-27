# 005 — Deterministic Relevance Scoring

ONN Phase 2 scoring is explainable rules, not AI.

## Inputs and weights

For every matching article topic:

`requested weight × article-topic confidence × signal-source multiplier × mapping multiplier`

Signal multipliers are career 1.25, interest 1.0, group 0.9, and network 0.7. Direct feed mappings receive a 1.1 multiplier. A linear freshness bonus starts at 4 points and falls to zero at 24 hours.

Feedback adjustments are: saved/useful +2, opened +1, dismissed/not relevant −4. The current endpoint records feedback; personalized aggregation is an extension point and is not yet applied across topic history.

## Exclusions

Articles are rejected before ranking when they contain an excluded topic, appear in `excludeArticleIds`, are older than 24 hours, are not active, have no requested-topic match, or score below the minimum threshold. Results are unique, score-descending, then newest-first, and capped by the project maximum.

## Examples

A current healthcare article with confidence 1.0 and career weight 10 begins near `10 × 1 × 1.25 × 1.1 = 13.75`, then receives freshness points. A network-derived match with weight 4 begins near `4 × 1 × .7 × 1.1 = 3.08`. An unrelated new article scores no topic points and is rejected rather than returned merely to fill a count.

## Limitations and extension points

Rules do not understand semantics, ambiguity, sentiment, or factual quality. Keyword lists are intentionally conservative. Future approved extensions may add configurable rules, aggregate feedback preferences, source-quality signals, or semantic scoring behind the same service interface without changing the public response contract.
