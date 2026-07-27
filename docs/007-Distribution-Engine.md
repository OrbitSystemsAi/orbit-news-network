# 007 — Distribution Engine

Distribution is a centralized configuration-driven policy, independent of Career Pivot and UI.

- Private, profile, and application content remain within the originating project. Profile also requires contributor context.
- Network content is eligible for active projects in the originating Orbit Systems AI organization.
- Partner content requires an active explicit destination target.
- Public content requires authenticated destination-project public-content access. It does not create anonymous public access.

Published content and an active publication are mandatory. Paused, rejected, draft, or archived content is excluded. Active rules may be publication-specific, require topics, and target destination projects. A unique content/destination delivery records eligibility, delivery, first shown time, suppression, expiration, or revocation.

`POST /api/v1/content/relevant` returns eligible first-party candidates with deterministic topic scoring. `POST /api/v1/feed/relevant` returns separate first-party and current-news arrays plus nonbinding composition guidance. The consuming application owns ordering, insertion positions, presentation, and user-created content.

Suppressing or revoking a delivery prevents new eligible delivery. PostgreSQL remains the only operational store; there is no worker, queue, scheduler, or public syndication.
