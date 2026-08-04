# 012 — Environment Management

## Classification

| Variable | Classification | Required | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | secret, server-only | database workflows | Pooled Neon runtime connection |
| `DIRECT_URL` | secret, server-only | migrations | Direct Neon migration connection |
| `ADMIN_ACCESS_KEY` | secret, server-only | migration fallback | Setup access and approved internal server tools |
| `API_KEY_HASH_SECRET` | secret, server-only | integration APIs | API-key hashing pepper |
| `NEON_AUTH_BASE_URL` | server-only endpoint | operator authentication | Branch-specific Neon Auth service URL |
| `NEON_AUTH_COOKIE_SECRET` | secret, server-only | operator authentication | Signs cached Neon Auth session data; minimum 32 characters |
| `ONN_ADMIN_EMAILS` | sensitive, server-only configuration | operator authorization | Comma-separated normalized email allowlist |
| `ONN_ALLOW_SIGN_UP` | server-only configuration | optional | Temporarily exposes self-registration UI; default false |
| `NEXT_PUBLIC_APP_URL` | safe public | deployed app | Canonical application URL |
| `NEWS_VISIBLE_HOURS` | server-only configuration | yes | External-news visibility |
| `NEWS_DELETE_AFTER_HOURS` | server-only configuration | yes | External-news retention |
| `DEFAULT_FEED_REFRESH_MINUTES` | server-only configuration | yes | Default feed cadence |
| `FEED_REQUEST_TIMEOUT_MS` | server-only configuration | yes | Feed request timeout |
| `REFRESH_LOCK_TIMEOUT_MINUTES` | server-only configuration | yes | Refresh lock expiry |
| `CONTENT_MAX_TITLE_LENGTH` | server-only configuration | yes | Submission validation |
| `CONTENT_MAX_SUMMARY_LENGTH` | server-only configuration | yes | Submission validation |
| `CONTENT_MAX_BODY_LENGTH` | server-only configuration | yes | Submission validation |
| `DEFAULT_LANGUAGE` | server-only configuration | yes | Content default |
| `IDEMPOTENCY_RETENTION_HOURS` | server-only configuration | yes | Idempotency retention |
| `ACCESS_SESSION_HOURS` | server-only configuration | optional | Signed session lifetime, default 8 |

## Environment separation

Local secrets belong in ignored `.env.local` or another ignored `.env.*` file. Preview and Production values belong in Vercel encrypted environment storage and are assigned deliberately per environment. Only `NEXT_PUBLIC_APP_URL` may enter browser bundles.

The private MVP may temporarily use one existing Neon Free project for local, Preview, and Production. Label preview/test records, never run destructive tests, and never automatically migrate or seed previews. Separate databases or branches are required before a public commercial launch.

## Neon connections and rotation

Use the pooled connection for runtime traffic and the direct connection for controlled Prisma operations. Preserve SSL parameters. Never place URLs in commands that may be logged, documentation, screenshots, issue text, or committed files.

Generate `ADMIN_ACCESS_KEY`, `API_KEY_HASH_SECRET`, and `NEON_AUTH_COOKIE_SECRET` with a cryptographically secure password generator and store them only locally and in Vercel. The Neon Auth cookie secret must remain stable across deployments within one environment. Rotate a secret by updating all intended Vercel environments, updating the approved local secret store, redeploying, verifying access, and invalidating the old value. Rotating `ADMIN_ACCESS_KEY` invalidates legacy private-MVP sessions; rotating `NEON_AUTH_COOKIE_SECRET` invalidates cached Neon Auth session data. Database credential exposure also requires Neon-side rotation.

`ONN_ALLOW_SIGN_UP=true` is intended only for controlled initial provisioning. An account created through Neon Auth still receives no ONN access unless its normalized email is listed in `ONN_ADMIN_EMAILS`. Return the flag to `false` after the required operator identities exist.
