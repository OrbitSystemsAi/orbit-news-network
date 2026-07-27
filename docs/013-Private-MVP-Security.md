# 013 — Private MVP Security

## Temporary access boundary

`/admin/**` and `/portal/**` are intercepted before rendering. Operators submit `ADMIN_ACCESS_KEY` to a same-origin server route. A successful constant-time comparison creates an expiring HMAC-signed cookie with `HttpOnly`, `SameSite=Strict`, path `/`, and `Secure` in production. The cookie contains only an expiry and signature—not the key. Internal APIs accept this session for portal operations or the existing administrative header for approved server-side tools.

This shared gate is suitable only for private MVP testing. It has no individual identity, roles, recovery, audit attribution, revocation list, or subscriber isolation. Full operator/subscriber authentication and authorization are required before public commercial launch.

## Integration security

Project integrations use server-to-server bearer keys stored only as scrypt hashes plus safe prefixes. Requests enforce project ownership, status, revocation, and explicit capability scopes. Originating applications retain user authentication and private profiles. Federated identifiers are project-scoped and private contributor data must not cross project boundaries.

Private API keys must never run in browser JavaScript. ONN does not send `Access-Control-Allow-Origin: *` or otherwise opt private APIs into cross-origin browser access. CORS is intentionally restrictive by default and is not authentication.

## Secrets, logs, and operational limits

Secrets live in ignored local files and Vercel encrypted environment storage. Logs must omit authorization headers, keys, connection URLs, passwords, private bodies, and full profiles. The public health response reports configuration/reachability state only and never hosts, users, regions, secret names, stack traces, or deployment identifiers.

Before launch, add individual authentication, role-based authorization, CSRF review for every mutation, rate limiting, security monitoring, independent environments, incident response, backup/restore exercises, formal privacy controls, and an external security assessment.
