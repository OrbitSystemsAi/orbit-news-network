# Orbit News Network

Orbit News Network (ONN) is the shared news, publishing, distribution, and content-intelligence infrastructure for Orbit Systems AI applications. It is not a consumer news reader. Career Pivot is the first integration, not the definition of the platform.

## Deployment status

ONN is deployed as a gated MVP on Vercel. The application repository is public by explicit owner decision so the Orbit Systems AI organization can use Vercel Hobby Git integration; runtime credentials and database connection values remain encrypted and server-only.

- GitHub repository: `OrbitSystemsAi/orbit-news-network` (public, `main`)
- Vercel project: `orbit-systems-ai/orbit-news-network` (Git connected)
- Vercel URL: `https://orbit-news-network.vercel.app`
- Neon: Free project connected; baseline migration and idempotent production seed applied
- Cost target: $0/month using GitHub Free, Vercel Hobby, Neon Free, and open-source dependencies
- Access: `/admin/**` and `/portal/**` use a temporary HTTP-only signed access session; this is not full operator or subscriber authentication
- Custom domain: deliberately out of scope

The gated MVP is not ready for public commercial use. It lacks subscriber self-registration, role-based authentication, SSO, independent production/preview databases, paid-grade operational guarantees, and a formal public security review.

## Implemented platform

- Public platform and developer documentation surfaces
- Operator and subscriber portals
- Project-scoped API keys stored as hashes with explicit scopes and revocation
- RSS/Atom ingestion, freshness locking, duplicate detection, relevance, and feedback
- First-party publications, contributors, submissions, citations, moderation, distribution, deliveries, interactions, and idempotency
- Versioned `/api/v1` response envelopes and protected `/api/internal` operations
- Deterministic relevance/moderation foundations and aggregate operational analytics
- Prisma/PostgreSQL schema with a committed baseline migration

Dashboard metrics and any records explicitly labeled as examples are demonstration data. ONN stores external metadata and source excerpts, never complete copyrighted publisher bodies.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL on Neon, Prisma, Zod, ESLint, Vitest, Lucide, npm, and Vercel-compatible serverless routes.

## Local development

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

ONN always uses local port `3001` to avoid conflicting with Career Pivot on port `3000`. Open `http://localhost:3001`; the access screen is at `http://localhost:3001/access`.

Add real values only to ignored local environment files. Never commit credentials. The application can build without a live database, but database-backed workflows require a valid Neon connection.

Useful commands:

```bash
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run verify
npm run db:validate
npm run db:generate
npm run db:migrate -- --name <migration-name>
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:seed:production
```

`db:migrate` is for controlled development work. Production uses the committed migrations through `db:migrate:deploy`; Vercel builds never run development migrations or seeds.

## Environment and Neon

`DATABASE_URL` is the pooled runtime connection. `DIRECT_URL` is preferred by Prisma CLI migration commands through `prisma.config.ts`. The remaining required secrets are `ADMIN_ACCESS_KEY` and `API_KEY_HASH_SECRET`. `NEXT_PUBLIC_APP_URL` is the only public setting and must contain the deployed application URL.

Preview and production may temporarily share the existing Neon Free project for this private MVP. This is a documented cost compromise, not a recommended long-term production architecture. Preview builds must never migrate or seed the shared database automatically.

See [Environment Management](docs/012-Environment-Management.md) for classification and rotation procedures.

## Access and API model

The public landing page, `/developers`, `/access`, and `/api/v1/health` remain accessible. `/admin/**` and `/portal/**` require the temporary private-MVP gate. A successful server-side key comparison creates a signed, `HttpOnly`, `SameSite=Strict`, production-secure cookie. The administrative key is not stored in browser JavaScript, a URL, or the cookie.

Integration APIs require server-to-server project bearer keys and capability scopes. Browsers must not receive project API keys. Cross-origin access is denied by omission: private APIs do not emit permissive CORS headers.

Implemented publishing endpoints include:

- `GET /api/v1/topics`
- `POST /api/v1/news/relevant`
- `POST /api/v1/news/feedback`
- `POST /api/v1/content/submissions`
- `GET /api/v1/content/submissions/{submissionId}`
- `GET /api/v1/publications`
- `POST /api/v1/content/relevant`
- `POST /api/v1/feed/relevant`
- `POST /api/v1/content/feedback`
- `POST /api/v1/feed/feedback`

Scopes are `news:read`, `news:feedback`, `content:submit`, `content:read`, `content:feedback`, `publications:read`, `feed:read`, and `analytics:read`.

## Safe deployment sequence

1. Complete the secret review and all local verification commands.
2. Authenticate GitHub CLI and verify access to the exact Orbit Systems AI organization.
3. Confirm the intended repository visibility and remote before creating or changing either.
4. Push the verified default branch without rewriting history.
5. Authenticate Vercel and verify the exact owner and absence of a conflicting project.
6. Link GitHub, configure environment variables in Preview and Production, and keep secrets server-only.
7. Run `npm run db:migrate:status`, then manually run `npm run db:migrate:deploy` with the direct Neon connection.
8. Run the idempotent production seed once, verify it, deploy, set `NEXT_PUBLIC_APP_URL`, and redeploy if necessary.
9. Complete [the deployment smoke test](docs/014-Deployment-Smoke-Test.md).

Do not use `prisma db push`, run migrations from previews, create a public migration endpoint, configure a custom domain, or activate paid services.

## Documentation

- [Architecture](docs/001-Architecture.md)
- [API Foundation](docs/003-API-Foundation.md)
- [News Ingestion](docs/004-News-Ingestion.md)
- [Relevance Scoring](docs/005-Relevance-Scoring.md)
- [Publishing Platform](docs/006-Publishing-Platform.md)
- [Distribution Engine](docs/007-Distribution-Engine.md)
- [Federated Identity](docs/008-Federated-Identity.md)
- [Content Moderation](docs/009-Content-Moderation.md)
- [GitHub Workflow](docs/010-GitHub-Workflow.md)
- [Vercel Deployment](docs/011-Vercel-Deployment.md)
- [Environment Management](docs/012-Environment-Management.md)
- [Private MVP Security](docs/013-Private-MVP-Security.md)
- [Deployment Smoke Test](docs/014-Deployment-Smoke-Test.md)
