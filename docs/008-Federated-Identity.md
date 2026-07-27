# 008 — Federated Identity

Originating Orbit applications own user authentication, sessions, private profiles, drafts, and application-specific moderation. ONN authenticates the project server, not the contributor.

A contributor identity is uniquely scoped by project ID plus the originating application's external contributor ID. ONN stores optional display name, byline, public profile URL, avatar URL, status, and timestamps solely for attribution, publishing permissions, and operational records.

The same human may have separate contributor records in different applications; ONN does not infer or merge identity. External user IDs used for feed interactions are also project-scoped opaque values. ONN stores no passwords, login tokens, private messages, unnecessary emails, phone numbers, or complete private profiles.

All access flows through versioned APIs. A project key cannot use a body-supplied project ID to cross ownership boundaries. Destination projects receive only published, eligible content and permitted attribution fields.
