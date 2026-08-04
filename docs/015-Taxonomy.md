# 015 — Shared Taxonomy

## Model

ONN owns an application-neutral hierarchy of category → subcategory → topic, with optional tag and entity nodes available as governed extensions. Every node has a stable slug, status, governance version, aliases, optional replacement, and parent relationship. Topic nodes link one-to-one with the preexisting `Topic` record, preserving all legacy topic slugs and assignments.

The initial shared categories are Health and Wellbeing, Economy and Business, Technology and Data, Work and Careers, and Society and Learning. They organize the existing fifteen topics without changing their identifiers. The hierarchy is configuration stored in PostgreSQL, not application-specific route logic.

## Permissions and compatibility

Projects have explicit permissions at category, subcategory, and topic levels. Category and subcategory permissions are derived from active topic subscriptions during the idempotent seed; topic permissions retain the existing project weight. A hierarchical request expands only to active descendant topics that the requesting project is also authorized to use.

`GET /api/v1/topics` returns the permitted hierarchy plus a `compatibleTopics` list. Relevant-news and relevant-content requests accept both the existing `topics` field and a new `classifications` field. Both may be combined. Category, subcategory, topic, or alias signals resolve to the stable topic signals used by the existing ranking services.

## Explainability and correction

External article assignments retain `FEED_MAPPING`, `KEYWORD_RULE`, or `MANUAL` provenance and a confidence score. First-party assignments retain `SUBMITTED`, `PUBLICATION_DEFAULT`, `RULE_BASED`, or `MANUAL` provenance, weight, and explicit confidence. Relevant API responses include topic assignment source, confidence/score, subcategory, and category.

Operators can replace an item’s assignment through `/api/internal/classifications`; corrections are stored as `MANUAL`. The internal taxonomy API supports names, descriptions, aliases, activation state, and deprecation. A deprecated node must identify its replacement, and every governance change increments its version.

## Governance procedure

1. Add or revise nodes through an additive reviewed migration or the protected taxonomy API.
2. Never repurpose an existing stable slug for a different meaning.
3. Add aliases for terminology changes that do not change meaning.
4. For a material meaning change, create a new node, deprecate the old node, and set `replacedById`.
5. Migrate project permissions and assignments in a reviewed, idempotent operation.
6. Keep deprecated aliases resolvable only during the documented migration window; disable the old node after consumers migrate.

## Step 4 verification

On August 4, 2026, the migration and idempotent seed created five categories, eight subcategories, fifteen compatible topic nodes, aliases, and OSai/Career Pivot permissions. A `technology-and-data` request expanded to artificial intelligence, technology, data analytics, and digital transformation. It returned both the published OSai verification item and classified NASA news with hierarchy and provenance. The legacy `artificial-intelligence` request and the `ai` alias returned the same first-party item. A controlled Career Pivot record received a manual `employment` assignment with confidence `0.92`.
