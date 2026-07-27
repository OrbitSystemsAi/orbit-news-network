# 014 — Deployment Smoke Test

Record each run with date, tester, commit, environment, deployment URL, and database identifier by safe label only. Mark test content clearly and remove it afterward.

## Public and access checks

- `/`, `/developers`, and `/api/v1/health` return expected safe responses.
- `/admin`, `/admin/*`, `/portal`, `/portal/projects`, `/portal/feeds`, `/portal/api-keys`, `/portal/publications`, `/portal/content`, `/portal/distribution`, `/portal/analytics`, and `/portal/knowledge-graph` redirect to `/access` without a valid session and load after access is granted.
- The session cookie is HTTP-only, same-site strict, secure in production, expires as configured, and contains no secret.

## Database

- `npm run db:migrate:status` reports all committed migrations applied.
- Required organization, pilot project, taxonomy, topic permissions, and initial publications exist once.
- No fake traffic, interaction, history, content, or credential records were seeded.

## APIs

Verify `GET /api/v1/topics`; news relevance and feedback; publications; content submission, idempotent replay, retrieval, approval/publishing, relevance, unified feed, feedback, pause/archive, and post-archive exclusion. Exercise missing, invalid, revoked, and under-scoped keys plus cross-project access. Expected failures use safe envelopes without stack traces or database details.

Use only approved feeds and fake, explicitly labeled publishing content. Confirm external staleness rules and project isolation. Remove the API key and test content when practical.

## Deployment and security

- Confirm Preview and Production are associated with the intended commit and environment-variable assignments.
- Confirm Preview did not run migrations or seeds and Production remained unchanged during preview validation.
- Inspect browser assets and logs for API keys, the administrative secret, database URLs, authorization headers, private bodies, and stack traces.
- Confirm private APIs emit no wildcard CORS policy and repository visibility matches the explicitly approved GitHub policy.
- Confirm no custom domain or paid service was activated.

Expected result for every item is `PASS`; record `BLOCKED` or `FAIL` with a non-secret explanation and remediation. Deployment is not complete while any required item is unverified.

## 2026-07-27 production record

- Tester: Codex
- Commit: `456b2f9`
- Environment: Production
- URL: `https://orbit-news-network.vercel.app`
- Database: existing Neon Free project (safe label only)
- PASS: Vercel build, Prisma Client generation, TypeScript, and 39-route Next.js compilation.
- PASS: `/`, `/developers`, and `/api/v1/health` returned 200.
- PASS: `/admin` and `/portal` redirected to `/access` without a session.
- PASS: unauthenticated `GET /api/v1/topics` returned 401.
- PASS: Git branch `agent/verify-vercel-preview` triggered a protected Preview deployment; authenticated Vercel CLI checks returned 200 for health, 307 for gated admin access, and 401 for unauthenticated topics.
- PASS: no custom domain or paid service was activated.
- PENDING: authenticated application session, scoped integration-key workflows, publishing lifecycle, and deployed asset/log inspection.
