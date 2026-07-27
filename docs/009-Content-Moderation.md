# 009 — Deterministic Content Moderation

Phase 3 moderation is rules and administrative review, not AI and not factual verification.

Validation checks required fields, content type, project/publication/contributor status, topic permissions, HTTPS URLs, language shape, title/summary/body limits, duplicate identifiers/fingerprints, distribution level, and unsafe executable markup. Reason codes include invalid_publication, unsupported_content_type, duplicate_submission, unsafe_markup, contributor_suspended, project_disabled, distribution_not_allowed, topic_not_allowed, and administrative_review.

Valid API submissions begin as submitted and receive a review-required decision. Administrators may move submitted content under review or approve it; under-review content may be approved or rejected. Only approved content may publish. Published content may pause or archive. Every decision and status change is recorded with a source and safe identifier—never a credential.

Current rules do not verify truth, copyright ownership, quality, sentiment, or harm beyond narrow executable-markup and configuration checks. Future approved AI assistance may be added behind the moderation interface, but cannot silently replace deterministic permission and administrator controls.
