# 013 — Private MVP Security

## Operator authentication boundary

`/admin/**` and `/portal/**` are intercepted before rendering. When Neon Auth is configured, operators authenticate through the same-origin `/api/auth/**` proxy and receive Neon-managed sessions. Page layouts and internal API routes independently require the authenticated email to appear in the server-only `ONN_ADMIN_EMAILS` allowlist. A valid identity without authorization is denied.

The original `ADMIN_ACCESS_KEY` session remains available only when Neon Auth is not configured, preventing setup lockout. The `x-onn-admin-key` header remains a temporary credential for approved server-side tools. Remove both legacy paths after deployed Neon Auth, administrator provisioning, recovery, and operational tooling have been verified.

This phase provides individual operator identity but not subscriber tenancy. Both `/admin/**` and `/portal/**` remain administrator-only because current portal queries are not scoped to a user or organization. Before subscriber access, add explicit identity-to-organization/project memberships and enforce that scope in every query and mutation.

## Integration security

Project integrations use server-to-server bearer keys stored only as scrypt hashes plus safe prefixes. Requests enforce project ownership, status, revocation, and explicit capability scopes. Originating applications retain user authentication and private profiles. Federated identifiers are project-scoped and private contributor data must not cross project boundaries.

Private API keys must never run in browser JavaScript. ONN does not send `Access-Control-Allow-Origin: *` or otherwise opt private APIs into cross-origin browser access. CORS is intentionally restrictive by default and is not authentication.

## Secrets, logs, and operational limits

Secrets live in ignored local files and Vercel encrypted environment storage. Logs must omit authorization headers, keys, connection URLs, passwords, private bodies, and full profiles. The public health response reports configuration/reachability state only and never hosts, users, regions, secret names, stack traces, or deployment identifiers.

Before launch, add tenant-scoped role authorization, CSRF review for every mutation, rate limiting, security monitoring, independent environments, incident response, backup/restore exercises, formal privacy controls, and an external security assessment.
